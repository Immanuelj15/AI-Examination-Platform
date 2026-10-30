from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    Exam, ExamQuestion, QuestionBank, Question, GradingQueueItem, ExamSession, User, Result
)
from app.api.deps import require_role

router = APIRouter(prefix="/examiner", tags=["Examiner Portal"])

@router.get("/dashboard")
def get_examiner_dashboard(
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    my_exams = db.query(Exam).filter(Exam.created_by_id == examiner.id).all()
    my_exam_ids = [e.id for e in my_exams]

    draft_count = sum(1 for e in my_exams if e.status == "DRAFT")
    scheduled_count = sum(1 for e in my_exams if e.status == "SCHEDULED")
    live_count = sum(1 for e in my_exams if e.status in ["ACTIVE", "PUBLISHED"])
    completed_count = sum(1 for e in my_exams if e.status == "COMPLETED")

    pending_grading_count = db.query(GradingQueueItem).filter(
        GradingQueueItem.status == "PENDING",
        GradingQueueItem.exam_id.in_(my_exam_ids) if my_exam_ids else True
    ).count()

    total_submissions = db.query(Result).filter(
        Result.exam_id.in_(my_exam_ids) if my_exam_ids else True
    ).count()

    live_candidates = db.query(ExamSession).filter(
        ExamSession.status == "IN_PROGRESS",
        ExamSession.exam_id.in_(my_exam_ids) if my_exam_ids else True
    ).count()

    flagged_sessions = db.query(ExamSession).filter(
        ExamSession.is_flagged == True,
        ExamSession.exam_id.in_(my_exam_ids) if my_exam_ids else True
    ).count()

    question_bank_count = db.query(QuestionBank).filter(
        (QuestionBank.created_by_id == examiner.id) | (QuestionBank.is_public == True)
    ).count()

    total_questions_count = db.query(Question).filter(Question.status != "ARCHIVED").count()

    exams_data = []
    for ex in my_exams:
        qc = db.query(ExamQuestion).filter(ExamQuestion.exam_id == ex.id).count()
        sub_count = db.query(Result).filter(Result.exam_id == ex.id).count()
        exams_data.append({
            "id": ex.id,
            "title": ex.title,
            "code": ex.code,
            "status": ex.status,
            "duration_minutes": ex.duration_minutes,
            "total_marks": ex.total_marks,
            "question_count": qc,
            "submissions_count": sub_count,
            "created_at": ex.created_at
        })

    return {
        "examiner_name": examiner.full_name,
        "total_exams": len(my_exams),
        "draft_exams": draft_count,
        "scheduled_exams": scheduled_count,
        "live_exams": live_count,
        "completed_exams": completed_count,
        "pending_grading_count": pending_grading_count,
        "total_submissions": total_submissions,
        "live_candidates": live_candidates,
        "flagged_sessions": flagged_sessions,
        "question_bank_count": question_bank_count,
        "total_questions_count": total_questions_count,
        "exams": exams_data
    }

@router.get("/students")
def list_students_for_assignment(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    query = db.query(User).filter(User.role == "STUDENT", User.is_active == True)
    if search:
        query = query.filter((User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%")))
    students = query.order_by(User.full_name.asc()).limit(150).all()
    return [{
        "id": s.id,
        "full_name": s.full_name,
        "email": s.email,
        "phone": s.phone
    } for s in students]

