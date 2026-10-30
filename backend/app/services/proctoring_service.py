from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.models import ExamSession, ProctorEvent, ProctorSession
from app.core.config import settings

class ProctoringService:
    def __init__(self):
        self.weights = {
            "FACE_ABSENT": float(getattr(settings, "FACE_ABSENCE_PENALTY", 10)),
            "FACE_RESTORED": 0.0,
            "MULTIPLE_FACE_DETECTED": float(getattr(settings, "MULTIPLE_FACES_PENALTY", 25)),
            "MULTIPLE_FACES": float(getattr(settings, "MULTIPLE_FACES_PENALTY", 25)),
            "MULTIPLE_FACE_RESTORED": 0.0,
            "GAZE_AWAY": float(getattr(settings, "GAZE_AWAY_PENALTY", 10)),
            "TAB_SWITCH": float(getattr(settings, "TAB_SWITCH_PENALTY", 15)),
            "WINDOW_BLUR": float(getattr(settings, "WINDOW_BLUR_PENALTY", 10)),
            "WINDOW_FOCUS": 0.0,
            "FULLSCREEN_EXIT": float(getattr(settings, "FULLSCREEN_EXIT_PENALTY", 15)),
            "CAMERA_DISCONNECTED": 10.0,
            "CAMERA_RESTORED": 0.0,
            "CAMERA_DISABLED": 15.0,
            "NETWORK_INTERRUPTED": 5.0,
            "NETWORK_RESTORED": 0.0
        }

        self.default_severities = {
            "FACE_RESTORED": "INFO",
            "MULTIPLE_FACE_RESTORED": "INFO",
            "WINDOW_FOCUS": "INFO",
            "CAMERA_RESTORED": "INFO",
            "NETWORK_RESTORED": "INFO",
            "GAZE_AWAY": "LOW",
            "NETWORK_INTERRUPTED": "LOW",
            "FACE_ABSENT": "MEDIUM",
            "WINDOW_BLUR": "MEDIUM",
            "CAMERA_DISCONNECTED": "MEDIUM",
            "MULTIPLE_FACE_DETECTED": "HIGH",
            "MULTIPLE_FACES": "HIGH",
            "TAB_SWITCH": "HIGH",
            "FULLSCREEN_EXIT": "HIGH",
            "CAMERA_DISABLED": "HIGH"
        }

    def _get_or_create_proctor_session(self, db: Session, session_id: int) -> ProctorSession:
        p_sess = db.query(ProctorSession).filter(ProctorSession.exam_session_id == session_id).first()
        if not p_sess:
            p_sess = ProctorSession(
                exam_session_id=session_id,
                started_at=datetime.now(timezone.utc),
                camera_status="ACTIVE",
                current_face_count=1,
                last_face_seen_at=datetime.now(timezone.utc),
                last_heartbeat_at=datetime.now(timezone.utc),
                connection_status="ONLINE",
                total_events=0,
                review_status="NORMAL"
            )
            db.add(p_sess)
            db.flush()
        return p_sess

    def calculate_decay(self, current_score: float, last_event_time: Optional[datetime], now: datetime) -> float:
        """
        Gradual time-based score decay if no events have occurred for > 60s.
        Prevents permanent penalty from transient/mild alerts.
        """
        if not last_event_time or current_score <= 0.0:
            return current_score

        elapsed_sec = (now - last_event_time.replace(tzinfo=timezone.utc)).total_seconds()
        if elapsed_sec > 60:
            # Decay 1 point per 30 seconds of flawless behavior after the first 60s
            decay_points = (elapsed_sec - 60) / 30.0
            return max(0.0, current_score - decay_points)
        return current_score

    def record_proctor_event(
        self,
        db: Session,
        session_id: int,
        event_type: str,
        severity: Optional[str] = None,
        duration_ms: Optional[int] = None,
        confidence: Optional[float] = None,
        face_count: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        snapshot_url: Optional[str] = None
    ) -> ProctorEvent:
        """
        Records a discrete proctoring event, validates severity, updates proctor session and suspicion score.
        """
        now = datetime.now(timezone.utc)
        normalized_type = event_type.upper().strip()
        validated_severity = severity or self.default_severities.get(normalized_type, "MEDIUM")

        # Authoritative score delta from server weights
        base_delta = self.weights.get(normalized_type, 5.0)
        multiplier = 1.0
        if validated_severity == "HIGH":
            multiplier = 1.3
        elif validated_severity == "CRITICAL":
            multiplier = 1.8
        elif validated_severity == "INFO":
            multiplier = 0.0

        score_delta = round(base_delta * multiplier, 1)

        event = ProctorEvent(
            session_id=session_id,
            event_type=normalized_type,
            severity=validated_severity,
            duration_ms=duration_ms,
            confidence=confidence,
            face_count=face_count,
            score_delta=score_delta,
            details=details or {},
            snapshot_url=snapshot_url,
            review_status="UNREVIEWED",
            timestamp=now
        )
        db.add(event)

        # Update ExamSession and ProctorSession
        session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
        p_sess = self._get_or_create_proctor_session(db, session_id)

        if session:
            # Check for decay before adding new delta
            last_event = db.query(ProctorEvent).filter(
                ProctorEvent.session_id == session_id
            ).order_by(ProctorEvent.timestamp.desc()).first()

            decayed_score = self.calculate_decay(
                session.suspicion_score,
                last_event.timestamp if last_event else None,
                now
            )

            new_score = min(100.0, decayed_score + score_delta)
            session.suspicion_score = round(new_score, 1)
            session.last_heartbeat_at = now

            if new_score >= 45.0:
                session.is_flagged = True
                p_sess.review_status = "NEEDS_REVIEW"

        # Update ProctorSession status
        p_sess.total_events += 1
        p_sess.last_heartbeat_at = now
        if face_count is not None:
            p_sess.current_face_count = face_count
            if face_count > 0:
                p_sess.last_face_seen_at = now

        if normalized_type == "CAMERA_DISCONNECTED":
            p_sess.camera_status = "DISCONNECTED"
        elif normalized_type == "CAMERA_RESTORED":
            p_sess.camera_status = "ACTIVE"
        elif normalized_type == "NETWORK_INTERRUPTED":
            p_sess.connection_status = "OFFLINE"
        elif normalized_type == "NETWORK_RESTORED":
            p_sess.connection_status = "ONLINE"

        db.commit()
        db.refresh(event)
        return event

    def process_heartbeat(
        self,
        db: Session,
        session_id: int,
        face_detected: Optional[bool] = True,
        multiple_faces: Optional[bool] = False,
        gaze_away: Optional[bool] = False,
        tab_active: Optional[bool] = True,
        fullscreen: Optional[bool] = True,
        suspicion_increment: Optional[float] = 0.0,
        camera: Optional[Dict[str, Any]] = None,
        gaze: Optional[Dict[str, Any]] = None,
        browser: Optional[Dict[str, Any]] = None,
        network: Optional[Dict[str, Any]] = None,
        events: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Processes 10-second heartbeat from candidate browser.
        Handles both legacy flags and rich structured telemetry.
        """
        session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
        if not session:
            return {"status": "ERROR", "message": "Session not found"}

        now = datetime.now(timezone.utc)
        session.last_heartbeat_at = now
        p_sess = self._get_or_create_proctor_session(db, session_id)
        p_sess.last_heartbeat_at = now

        # Parse nested camera metrics if provided
        cam_status = camera.get("status") if camera else ("ACTIVE" if face_detected else "STANDBY")
        f_count = camera.get("faceCount") if camera else (2 if multiple_faces else (1 if face_detected else 0))
        p_sess.camera_status = cam_status
        p_sess.current_face_count = f_count
        if f_count > 0:
            p_sess.last_face_seen_at = now

        if network and network.get("status"):
            p_sess.connection_status = network.get("status")

        # Process any batched events in heartbeat payload
        warning_message = None
        if events and isinstance(events, list):
            for ev in events:
                e_type = ev.get("event_type") or ev.get("type")
                if e_type:
                    self.record_proctor_event(
                        db=db,
                        session_id=session_id,
                        event_type=e_type,
                        severity=ev.get("severity"),
                        duration_ms=ev.get("durationMs") or ev.get("duration_ms"),
                        confidence=ev.get("confidence"),
                        face_count=ev.get("faceCount") or ev.get("face_count"),
                        details=ev.get("metadata") or ev.get("details")
                    )

        # Apply decay to suspicion score during clean heartbeat
        session.suspicion_score = round(self.calculate_decay(session.suspicion_score, p_sess.last_face_seen_at, now), 1)

        db.commit()
        db.refresh(session)

        # Server authoritative remaining time calculation
        remaining_seconds = 0
        is_active = (session.status == "IN_PROGRESS")
        if session.end_time:
            delta = (session.end_time.replace(tzinfo=timezone.utc) - now).total_seconds()
            remaining_seconds = max(0, int(delta))
            if remaining_seconds <= 0 and session.status == "IN_PROGRESS":
                session.status = "AUTO_SUBMITTED"
                session.submitted_at = now
                db.commit()
                is_active = False

        return {
            "status": "OK",
            "server_time": now.isoformat(),
            "remaining_seconds": remaining_seconds,
            "is_session_active": is_active,
            "total_suspicion_score": session.suspicion_score,
            "warning_message": warning_message
        }

    def review_event(
        self,
        db: Session,
        event_id: int,
        review_status: str,
        examiner_notes: Optional[str] = None
    ) -> ProctorEvent:
        """
        Allows an examiner/admin to mark a proctor event as REVIEWED, DISMISSED, or CONFIRMED.
        """
        event = db.query(ProctorEvent).filter(ProctorEvent.id == event_id).first()
        if not event:
            raise ValueError("Proctor event not found")

        event.review_status = review_status.upper().strip()
        if examiner_notes is not None:
            event.examiner_notes = examiner_notes

        # If dismissed, adjust session suspicion score downwards by score_delta
        if review_status.upper().strip() == "DISMISSED" and event.score_delta > 0:
            session = db.query(ExamSession).filter(ExamSession.id == event.session_id).first()
            if session:
                session.suspicion_score = max(0.0, round(session.suspicion_score - event.score_delta, 1))
                if session.suspicion_score < 45.0:
                    session.is_flagged = False

        db.commit()
        db.refresh(event)
        return event

proctoring_service = ProctoringService()
