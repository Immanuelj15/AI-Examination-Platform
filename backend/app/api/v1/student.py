from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    Exam, ExamSession, Result, Certificate, User, ExamQuestion, ExamCandidate
)
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/student", tags=["Student Portal"])

@router.get("/dashboard")
def get_student_dashboard(
    db: Session = Depends(get_db),
    student: User = Depends(require_role("STUDENT"))
):
    now = datetime.now(timezone.utc)
    
    # Active / In progress exam sessions
    active_sessions = db.query(ExamSession).filter(
        ExamSession.student_id == student.id,
        ExamSession.status == "IN_PROGRESS"
    ).all()
    
    active_list = []
    for s in active_sessions:
        active_list.append({
            "session_id": s.id,
            "exam_id": s.exam_id,
            "title": s.exam.title,
            "code": s.exam.code,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "duration_minutes": s.exam.duration_minutes
        })

    # Available/Upcoming exams
    published_exams = db.query(Exam).filter(Exam.status.in_(["PUBLISHED", "ACTIVE"])).all()
    upcoming = []
    for ex in published_exams:
        # Check candidate restriction
        candidate_count = db.query(ExamCandidate).filter(ExamCandidate.exam_id == ex.id).count()
        if candidate_count > 0:
            assigned = db.query(ExamCandidate).filter(
                ExamCandidate.exam_id == ex.id,
                ExamCandidate.student_id == student.id
            ).first()
            if not assigned:
                continue

        # Check if already completed
        done = db.query(ExamSession).filter(
            ExamSession.exam_id == ex.id,
            ExamSession.student_id == student.id,
            ExamSession.status.in_(["SUBMITTED", "AUTO_SUBMITTED"])
        ).first()
        if not done:
            q_cnt = db.query(ExamQuestion).filter(ExamQuestion.exam_id == ex.id).count()
            upcoming.append({
                "id": ex.id,
                "title": ex.title,
                "code": ex.code,
                "description": ex.description,
                "duration_minutes": ex.duration_minutes,
                "total_marks": ex.total_marks,
                "question_count": q_cnt,
                "camera_required": ex.camera_required,
                "mic_required": ex.mic_required,
                "start_time": ex.start_time,
                "end_time": ex.end_time,
                "instructions": ex.instructions
            })

    # Completed results
    results = db.query(Result).filter(Result.student_id == student.id).order_by(Result.created_at.desc()).all()
    results_list = []
    for r in results:
        results_list.append({
            "id": r.id,
            "exam_title": r.session.exam.title if r.session and r.session.exam else "Assessment",
            "score": r.total_score,
            "max_score": r.max_score,
            "percentage": r.percentage,
            "grade": r.grade,
            "status": r.status,
            "published_at": r.published_at or r.created_at
        })

    # Overall student average score & certificates count
    avg_score = round(sum(r.percentage for r in results) / max(1, len(results)), 1) if results else 0.0
    cert_count = db.query(Certificate).filter(Certificate.student_id == student.id).count()

    return {
        "student_name": student.full_name,
        "email": student.email,
        "active_sessions": active_list,
        "upcoming_exams": upcoming,
        "recent_results": results_list,
        "completed_count": len(results_list),
        "average_score": avg_score,
        "certificates_count": cert_count
    }

@router.get("/exams")
def get_student_exams(
    db: Session = Depends(get_db),
    student: User = Depends(require_role("STUDENT"))
):
    """Returns all exams published and accessible to the student."""
    dash = get_student_dashboard(db=db, student=student)
    return dash["upcoming_exams"]

@router.get("/results/{session_id}")
def get_student_result_by_session(
    session_id: int,
    db: Session = Depends(get_db),
    student: User = Depends(require_role("STUDENT"))
):
    """Returns the result detail for a specific exam session of the student."""
    res = db.query(Result).filter(
        Result.session_id == session_id,
        Result.student_id == student.id
    ).first()
    if not res:
        raise HTTPException(status_code=404, detail="Result not found for this session")

    exam = db.query(Exam).filter(Exam.id == res.exam_id).first()
    is_passed = res.total_score >= (exam.passing_marks if exam else 0)

    return {
        "id": res.id,
        "session_id": res.session_id,
        "exam_id": res.exam_id,
        "exam_title": exam.title if exam else "Assessment",
        "total_score": res.total_score,
        "max_score": res.max_score,
        "percentage": res.percentage,
        "is_passed": is_passed,
        "grade": res.grade,
        "status": res.status,
        "published_at": res.published_at or res.created_at
    }
