from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    ExamSession, ProctorEvent, ProctorSession, User, Exam
)
from app.schemas.schemas import (
    ProctorEventCreate, ProctorEventResponse, ProctorEventReviewRequest,
    ProctorHeartbeatRequest, ProctorHeartbeatResponse, LiveCandidateItem,
    ProctorSessionResponse
)
from app.services.proctoring_service import proctoring_service
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/proctoring", tags=["AI Proctoring"])

@router.post("/heartbeat", response_model=ProctorHeartbeatResponse)
def submit_proctor_heartbeat(
    payload: ProctorHeartbeatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = proctoring_service.process_heartbeat(
        db=db,
        session_id=payload.session_id,
        face_detected=payload.face_detected,
        multiple_faces=payload.multiple_faces,
        gaze_away=payload.gaze_away,
        tab_active=payload.tab_active,
        fullscreen=payload.fullscreen,
        suspicion_increment=payload.current_suspicion_increment,
        camera=payload.camera,
        gaze=payload.gaze,
        browser=payload.browser,
        network=payload.network,
        events=payload.events
    )
    if result.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=result.get("message"))

    return ProctorHeartbeatResponse(
        status=result["status"],
        server_time=datetime.fromisoformat(result["server_time"]),
        remaining_seconds=result["remaining_seconds"],
        is_session_active=result["is_session_active"],
        total_suspicion_score=result["total_suspicion_score"],
        warning_message=result["warning_message"]
    )

@router.post("/events", response_model=ProctorEventResponse)
def log_discrete_event(
    payload: ProctorEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = proctoring_service.record_proctor_event(
        db=db,
        session_id=payload.session_id,
        event_type=payload.event_type,
        severity=payload.severity,
        duration_ms=payload.duration_ms,
        confidence=payload.confidence,
        face_count=payload.face_count,
        details=payload.metadata or payload.details,
        snapshot_url=payload.snapshot_url
    )
    return event

@router.get("/sessions", response_model=List[LiveCandidateItem])
def list_all_proctor_sessions(
    exam_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    return get_live_monitoring_sessions(exam_id=exam_id, db=db, current_user=current_user)

@router.get("/sessions/{session_id}", response_model=ProctorSessionResponse)
def get_proctor_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p_sess = db.query(ProctorSession).filter(ProctorSession.exam_session_id == session_id).first()
    if not p_sess:
        p_sess = proctoring_service._get_or_create_proctor_session(db, session_id)
        db.commit()
    return p_sess

@router.get("/sessions/{session_id}/events", response_model=List[ProctorEventResponse])
def get_session_proctor_events(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    events = db.query(ProctorEvent).filter(
        ProctorEvent.session_id == session_id
    ).order_by(ProctorEvent.timestamp.desc()).all()
    return events

@router.patch("/events/{event_id}/review", response_model=ProctorEventResponse)
def review_proctor_event(
    event_id: int,
    payload: ProctorEventReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    try:
        updated = proctoring_service.review_event(
            db=db,
            event_id=event_id,
            review_status=payload.review_status,
            examiner_notes=payload.examiner_notes
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/live-sessions", response_model=List[LiveCandidateItem])
def get_live_monitoring_sessions(
    exam_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    query = db.query(ExamSession).filter(ExamSession.status == "IN_PROGRESS")
    if exam_id:
        query = query.filter(ExamSession.exam_id == exam_id)

    sessions = query.order_by(ExamSession.suspicion_score.desc()).all()
    results = []
    now = datetime.now(timezone.utc)

    for s in sessions:
        rem_sec = 0
        if s.end_time:
            rem_sec = max(0, int((s.end_time.replace(tzinfo=timezone.utc) - now).total_seconds()))

        # Heartbeat freshness check
        last_hb = s.last_heartbeat_at.replace(tzinfo=timezone.utc) if s.last_heartbeat_at else now
        conn_status = "Online" if (now - last_hb).total_seconds() < 30 else "Unstable"

        # Suspicion level
        if s.suspicion_score >= 60:
            level = "HIGH"
        elif s.suspicion_score >= 30:
            level = "MEDIUM"
        else:
            level = "LOW"

        # Recent proctor events
        events = db.query(ProctorEvent).filter(
            ProctorEvent.session_id == s.id
        ).order_by(ProctorEvent.timestamp.desc()).limit(10).all()

        events_data = [
            {
                "id": ev.id,
                "event_type": ev.event_type,
                "severity": ev.severity,
                "duration_ms": ev.duration_ms,
                "confidence": ev.confidence,
                "face_count": ev.face_count,
                "review_status": ev.review_status,
                "examiner_notes": ev.examiner_notes,
                "time": ev.timestamp.strftime("%H:%M:%S"),
                "details": ev.details
            }
            for ev in events
        ]

        p_sess = db.query(ProctorSession).filter(ProctorSession.exam_session_id == s.id).first()

        results.append(LiveCandidateItem(
            session_id=s.id,
            student_id=s.student_id,
            candidate_name=s.student.full_name if s.student else "Candidate",
            candidate_email=s.student.email if s.student else "",
            exam_id=s.exam_id,
            exam_title=s.exam.title if s.exam else "Assessment",
            started_at=s.start_time,
            remaining_seconds=rem_sec,
            connection_status=p_sess.connection_status if p_sess else conn_status,
            camera_status=p_sess.camera_status if p_sess else ("Active" if conn_status == "Online" else "Disconnected"),
            face_detected=True if (p_sess and p_sess.current_face_count > 0) else (s.suspicion_score < 40),
            suspicion_score=s.suspicion_score,
            suspicion_level=level,
            recent_events=events_data
        ))

    return results

@router.post("/sessions/{session_id}/disqualify")
def disqualify_exam_session(
    session_id: int,
    reason: Optional[str] = "Proctoring integrity threshold breached",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")

    session.status = "DISQUALIFIED"
    session.is_flagged = True
    session.submitted_at = datetime.now(timezone.utc)

    # Record terminal proctor event
    proctoring_service.record_proctor_event(
        db=db,
        session_id=session_id,
        event_type="DISQUALIFIED",
        severity="CRITICAL",
        details={"reason": reason, "disqualified_by": current_user.email}
    )

    db.commit()
    return {"status": "DISQUALIFIED", "session_id": session_id}
