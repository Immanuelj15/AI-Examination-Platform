from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    GradingQueueItem, Answer, Question, ExamSession, Result, User
)
from app.schemas.schemas import (
    GradingOverrideRequest, AIEvaluationRequest, AIEvaluationResponse
)
from app.services.ai_grading_service import ai_grading_service
from app.api.deps import require_role

router = APIRouter(prefix="/grading", tags=["Examiner Grading Portal"])

@router.get("/queue")
def get_grading_queue(
    exam_id: Optional[int] = None,
    status_filter: Optional[str] = "PENDING",
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    query = db.query(GradingQueueItem)
    if exam_id:
        query = query.filter(GradingQueueItem.exam_id == exam_id)
    if status_filter:
        query = query.filter(GradingQueueItem.status == status_filter.upper())

    items = query.order_by(GradingQueueItem.created_at.asc()).all()
    results = []

    for item in items:
        ans = db.query(Answer).filter(Answer.id == item.answer_id).first()
        if not ans:
            continue
        q = db.query(Question).filter(Question.id == item.question_id).first()
        student = db.query(User).filter(User.id == item.student_id).first()

        results.append({
            "queue_id": item.id,
            "answer_id": ans.id,
            "session_id": item.session_id,
            "exam_id": item.exam_id,
            "student_id": item.student_id,
            "student_name": student.full_name if student else "Candidate",
            "question_id": q.id,
            "question_type": q.question_type,
            "question_text": q.question_en,
            "max_marks": q.marks,
            "model_answer": q.model_answer,
            "rubric": q.rubric,
            "student_text_answer": ans.text_answer,
            "student_code_answer": ans.code_answer,
            "student_image_url": ans.image_url,
            "ai_suggested_score": ans.ai_suggested_score or item.ai_score or 0.0,
            "ai_confidence": ans.ai_confidence or 0.85,
            "ai_justification": ans.ai_justification or "Evaluated via AI grading engine",
            "ai_matched_concepts": ans.ai_matched_concepts or [],
            "ai_missing_concepts": ans.ai_missing_concepts or [],
            "examiner_feedback": ans.examiner_feedback,
            "status": item.status,
            "created_at": item.created_at
        })
    return results

@router.post("/evaluate-preview", response_model=AIEvaluationResponse)
async def evaluate_preview(
    payload: AIEvaluationRequest,
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    """Allows examiner to run an instant AI evaluation dry-run with custom rubric or prompt."""
    result = await ai_grading_service.evaluate_subjective_answer(
        question_text=payload.question,
        student_answer=payload.student_answer,
        model_answer=payload.model_answer,
        rubric=payload.rubric,
        max_marks=payload.marks
    )
    return AIEvaluationResponse(**result)

@router.post("/finalize-score")
def finalize_grading_score(
    payload: GradingOverrideRequest,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    ans = db.query(Answer).filter(Answer.id == payload.answer_id).first()
    if not ans:
        raise HTTPException(status_code=404, detail="Answer record not found")

    now = datetime.now(timezone.utc)
    ans.marks_awarded = payload.final_score
    ans.examiner_feedback = payload.examiner_feedback
    ans.is_graded = True
    ans.graded_by_id = examiner.id
    ans.graded_at = now

    # Update Queue Item
    queue_item = db.query(GradingQueueItem).filter(GradingQueueItem.answer_id == ans.id).first()
    if queue_item:
        queue_item.status = "APPROVED" if payload.action == "APPROVE" else "OVERRIDDEN"
        queue_item.final_score = payload.final_score
        queue_item.examiner_id = examiner.id

    # Check if all subjective answers for this session are graded
    remaining_ungraded = db.query(Answer).filter(
        Answer.session_id == ans.session_id,
        Answer.is_graded == False
    ).count()

    # Recalculate session result total score
    session = db.query(ExamSession).filter(ExamSession.id == ans.session_id).first()
    if session:
        all_answers = db.query(Answer).filter(Answer.session_id == session.id).all()
        recalculated_score = sum((a.marks_awarded or 0.0) for a in all_answers)
        result = db.query(Result).filter(Result.session_id == session.id).first()
        if result:
            result.total_score = max(0.0, round(recalculated_score, 1))
            result.percentage = round((result.total_score / max(1.0, result.max_score)) * 100.0, 2)
            if remaining_ungraded == 0:
                result.status = "PUBLISHED"

    db.commit()
    return {
        "status": "SUCCESS",
        "answer_id": ans.id,
        "marks_awarded": ans.marks_awarded,
        "remaining_ungraded_in_session": remaining_ungraded
    }
