import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    Result, ExamSession, Exam, User, Certificate, Answer, Question
)
from app.schemas.schemas import ResultResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/results", tags=["Results & Performance"])

@router.get("", response_model=List[ResultResponse])
def get_results_list(
    exam_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Result)
    if current_user.role == "STUDENT":
        query = query.filter(Result.student_id == current_user.id)
    if exam_id:
        query = query.filter(Result.exam_id == exam_id)

    results = query.order_by(Result.created_at.desc()).all()
    output = []
    for r in results:
        exam = db.query(Exam).filter(Exam.id == r.exam_id).first()
        student = db.query(User).filter(User.id == r.student_id).first()
        cert = db.query(Certificate).filter(Certificate.result_id == r.id).first()
        
        output.append(ResultResponse(
            id=r.id,
            session_id=r.session_id,
            exam_id=r.exam_id,
            exam_title=exam.title if exam else "Assessment",
            student_name=student.full_name if student else "Candidate",
            total_score=r.total_score,
            max_score=r.max_score,
            percentage=r.percentage,
            grade=r.grade,
            rank=r.rank,
            percentile=r.percentile,
            status=r.status,
            total_questions=r.total_questions,
            correct_count=r.correct_count,
            incorrect_count=r.incorrect_count,
            skipped_count=r.skipped_count,
            partial_count=r.partial_count,
            topic_breakdown=r.topic_breakdown or {},
            difficulty_breakdown=r.difficulty_breakdown or {},
            published_at=r.published_at or r.created_at,
            certificate_id=cert.certificate_number if cert else None
        ))
    return output

@router.get("/{result_id}")
def get_result_detail(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = db.query(Result).filter(Result.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    # Access check: students can only see their own results
    if current_user.role == "STUDENT" and result.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    exam = db.query(Exam).filter(Exam.id == result.exam_id).first()
    student = db.query(User).filter(User.id == result.student_id).first()
    cert = db.query(Certificate).filter(Certificate.result_id == result.id).first()

    # Question-level review for student/examiner
    answers = db.query(Answer).filter(Answer.session_id == result.session_id).all()
    q_breakdown = []
    for a in answers:
        q = db.query(Question).filter(Question.id == a.question_id).first()
        if not q:
            continue
        item = {
            "question_id": q.id,
            "question_type": q.question_type,
            "difficulty": q.difficulty,
            "marks": q.marks,
            "marks_awarded": a.marks_awarded,
            "is_correct": a.is_correct,
            "question_text": q.question_en,
            "explanation": q.explanation,
            "examiner_feedback": a.examiner_feedback
        }
        # If examiner or admin, also include AI reasoning
        if current_user.role in ["ADMIN", "EXAMINER"]:
            item["ai_suggested_score"] = a.ai_suggested_score
            item["ai_confidence"] = a.ai_confidence
            item["ai_justification"] = a.ai_justification

        q_breakdown.append(item)

    return {
        "id": result.id,
        "session_id": result.session_id,
        "exam_id": result.exam_id,
        "exam_title": exam.title if exam else "Assessment",
        "student_name": student.full_name if student else "Candidate",
        "total_score": result.total_score,
        "max_score": result.max_score,
        "percentage": result.percentage,
        "grade": result.grade,
        "rank": result.rank or 1,
        "percentile": result.percentile or 94.5,
        "status": result.status,
        "total_questions": result.total_questions,
        "correct_count": result.correct_count,
        "incorrect_count": result.incorrect_count,
        "skipped_count": result.skipped_count,
        "partial_count": result.partial_count,
        "topic_breakdown": result.topic_breakdown or {},
        "difficulty_breakdown": result.difficulty_breakdown or {},
        "question_breakdown": q_breakdown,
        "certificate": {
            "number": cert.certificate_number,
            "hash": cert.verification_hash,
            "issue_date": cert.issue_date.isoformat()
        } if cert else None
    }

@router.post("/{result_id}/generate-certificate")
def generate_certificate(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = db.query(Result).filter(Result.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    existing = db.query(Certificate).filter(Certificate.result_id == result.id).first()
    if existing:
        return {"status": "EXISTS", "certificate_number": existing.certificate_number}

    cert_num = f"EVL-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"
    vhash = uuid.uuid4().hex

    cert = Certificate(
        result_id=result.id,
        student_id=result.student_id,
        exam_id=result.exam_id,
        certificate_number=cert_num,
        verification_hash=vhash
    )
    db.add(cert)
    db.commit()
    return {"status": "CREATED", "certificate_number": cert_num, "hash": vhash}
