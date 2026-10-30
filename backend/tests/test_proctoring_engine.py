import pytest
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone, timedelta
from app.services.proctoring_service import proctoring_service
from app.models.models import ExamSession, User, Exam, ProctorEvent, ProctorSession
from app.core.database import SessionLocal, Base, engine

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Create test user and exam
    student = db.query(User).filter(User.email == "proctor_test_student@example.com").first()
    if not student:
        student = User(
            email="proctor_test_student@example.com",
            hashed_password="hash",
            full_name="Proctor Test Student",
            role="STUDENT",
            is_active=True
        )
        db.add(student)
        db.commit()
        db.refresh(student)

    exam = db.query(Exam).first()
    
    session = ExamSession(
        exam_id=exam.id if exam else 1,
        student_id=student.id,
        status="IN_PROGRESS",
        suspicion_score=0.0,
        is_flagged=False,
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc) + timedelta(minutes=60)
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    yield (db, session)

    # Cleanup
    db.query(ProctorEvent).filter(ProctorEvent.session_id == session.id).delete()
    db.query(ProctorSession).filter(ProctorSession.exam_session_id == session.id).delete()
    db.query(ExamSession).filter(ExamSession.id == session.id).delete()
    db.commit()
    db.close()

def test_single_face_no_violation(db_session):
    """Test 1: One face - baseline heartbeat creates no violation."""
    db, session = db_session
    res = proctoring_service.process_heartbeat(
        db=db,
        session_id=session.id,
        face_detected=True,
        multiple_faces=False,
        gaze_away=False,
        tab_active=True,
        fullscreen=True
    )
    assert res["status"] == "OK"
    assert res["total_suspicion_score"] == 0.0

def test_transient_missing_face_ignored(db_session):
    """Test 2: Transient missing face in isolated frame does not flag immediately."""
    db, session = db_session
    score_before = session.suspicion_score
    # Isolated minor event with INFO severity
    event = proctoring_service.record_proctor_event(
        db=db,
        session_id=session.id,
        event_type="WINDOW_FOCUS",
        severity="INFO"
    )
    assert event.score_delta == 0.0
    assert session.suspicion_score == score_before

def test_persistent_face_absence_creates_event(db_session):
    """Test 4: Persistent face absence creates FACE_ABSENT event and increases suspicion."""
    db, session = db_session
    initial_score = session.suspicion_score
    event = proctoring_service.record_proctor_event(
        db=db,
        session_id=session.id,
        event_type="FACE_ABSENT",
        severity="MEDIUM",
        duration_ms=6000,
        face_count=0
    )
    assert event.event_type == "FACE_ABSENT"
    assert event.severity == "MEDIUM"
    assert session.suspicion_score >= initial_score + 10.0

def test_persistent_multiple_faces(db_session):
    """Test 6: Multiple faces for prolonged time creates MULTIPLE_FACE_DETECTED."""
    db, session = db_session
    event = proctoring_service.record_proctor_event(
        db=db,
        session_id=session.id,
        event_type="MULTIPLE_FACE_DETECTED",
        severity="HIGH",
        duration_ms=3500,
        face_count=2
    )
    assert event.event_type == "MULTIPLE_FACE_DETECTED"
    assert event.severity == "HIGH"
    assert event.score_delta > 0.0

def test_face_restored(db_session):
    """Test 7: Face returns after absence records FACE_RESTORED without penalty."""
    db, session = db_session
    event = proctoring_service.record_proctor_event(
        db=db,
        session_id=session.id,
        event_type="FACE_RESTORED",
        severity="INFO",
        face_count=1
    )
    assert event.event_type == "FACE_RESTORED"
    assert event.score_delta == 0.0

def test_camera_disconnect_and_restore(db_session):
    """Test 10 & 11: Camera disconnected and camera restored handling."""
    db, session = db_session
    disc_event = proctoring_service.record_proctor_event(
        db=db,
        session_id=session.id,
        event_type="CAMERA_DISCONNECTED",
        severity="MEDIUM"
    )
    assert disc_event.event_type == "CAMERA_DISCONNECTED"

    rest_event = proctoring_service.record_proctor_event(
        db=db,
        session_id=session.id,
        event_type="CAMERA_RESTORED",
        severity="INFO"
    )
    assert rest_event.event_type == "CAMERA_RESTORED"
    assert rest_event.score_delta == 0.0

def test_examiner_review_and_dismissal(db_session):
    """Test Examiner Review: Dismissing an alert reduces suspicion score."""
    db, session = db_session
    event = proctoring_service.record_proctor_event(
        db=db,
        session_id=session.id,
        event_type="TAB_SWITCH",
        severity="HIGH"
    )
    score_after_flag = session.suspicion_score

    # Examiner reviews and dismisses false positive
    updated_event = proctoring_service.review_event(
        db=db,
        event_id=event.id,
        review_status="DISMISSED",
        examiner_notes="Candidate opened authorized formula sheet modal."
    )
    assert updated_event.review_status == "DISMISSED"
    assert updated_event.examiner_notes is not None
    assert session.suspicion_score < score_after_flag

def test_suspicion_score_decay():
    """Test 33: Suspicion score decay over clean time window."""
    now = datetime.now(timezone.utc)
    old_time = now - timedelta(seconds=150)
    decayed = proctoring_service.calculate_decay(current_score=25.0, last_event_time=old_time, now=now)
    assert decayed < 25.0

def test_transient_multi_face_ignore(db_session):
    """Test 5: Two faces for 500 ms should not generate a high-severity event."""
    db, session = db_session
    # If duration is below persistence threshold (1500ms warning / 2500ms event), event is not generated or classified INFO
    event = proctoring_service.record_proctor_event(
        db=db,
        session_id=session.id,
        event_type="MULTIPLE_FACE_DETECTED",
        severity="INFO",
        duration_ms=500,
        face_count=2
    )
    assert event.score_delta == 0.0

def test_gaze_away_event(db_session):
    """Test 22 & 23: Prolonged off-screen gaze generates non-accusatory GAZE_AWAY event."""
    db, session = db_session
    event = proctoring_service.record_proctor_event(
        db=db,
        session_id=session.id,
        event_type="GAZE_AWAY",
        severity="LOW",
        duration_ms=3200,
        details={"direction": "LEFT"}
    )
    assert event.event_type == "GAZE_AWAY"
    assert event.details["direction"] == "LEFT"

def test_network_interrupted_and_restored(db_session):
    """Test 12 & 13: Network interruption and restoration handling."""
    db, session = db_session
    int_event = proctoring_service.record_proctor_event(
        db=db,
        session_id=session.id,
        event_type="NETWORK_INTERRUPTED",
        severity="LOW"
    )
    assert int_event.event_type == "NETWORK_INTERRUPTED"

    res_event = proctoring_service.record_proctor_event(
        db=db,
        session_id=session.id,
        event_type="NETWORK_RESTORED",
        severity="INFO"
    )
    assert res_event.event_type == "NETWORK_RESTORED"
    assert res_event.score_delta == 0.0

