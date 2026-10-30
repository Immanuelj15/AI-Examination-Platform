from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    Exam, ExamSession, ExamQuestion, Question, Answer, User, Result, ExamCandidate
)
from app.schemas.schemas import (
    ExamStartResponse, StudentQuestionItem, AnswerSaveRequest, AnswerResponse, ResultResponse
)
from app.services.exam_service import exam_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/exam-sessions", tags=["Exam Session Engine"])

@router.post("/start/{exam_id}", response_model=ExamStartResponse)
def start_exam(
    exam_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import random
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.status not in ["PUBLISHED", "ACTIVE"]:
        raise HTTPException(status_code=400, detail="This exam is not currently active")

    # Candidate authorization check
    if current_user.role == "STUDENT":
        candidates_count = db.query(ExamCandidate).filter(ExamCandidate.exam_id == exam_id).count()
        if candidates_count > 0:
            is_assigned = db.query(ExamCandidate).filter(
                ExamCandidate.exam_id == exam_id,
                ExamCandidate.student_id == current_user.id
            ).first()
            if not is_assigned:
                raise HTTPException(status_code=403, detail="You are not authorized or assigned to take this examination.")

    client_ip = request.client.host if request.client else "127.0.0.1"
    session = exam_service.start_exam_session(
        db=db,
        exam_id=exam_id,
        student_id=current_user.id,
        client_ip=client_ip
    )

    now = datetime.now(timezone.utc)
    delta = (session.end_time.replace(tzinfo=timezone.utc) - now).total_seconds() if session.end_time else 0
    remaining_seconds = max(0, int(delta))

    # Fetch ordered exam questions
    eqs = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).order_by(ExamQuestion.order_index).all()
    if exam.shuffle_questions and len(eqs) > 1:
        rnd = random.Random(f"{exam.id}_{current_user.id}_{session.id}")
        eqs = list(eqs)
        rnd.shuffle(eqs)

    # Fetch existing answers saved for this session
    answers_map = {
        a.question_id: a for a in db.query(Answer).filter(Answer.session_id == session.id).all()
    }

    student_questions = []
    for idx, eq in enumerate(eqs):
        q = eq.question
        ans = answers_map.get(q.id)

        # Map options without exposing is_correct
        options_list = []
        for opt in q.options:
            options_list.append({
                "option_key": opt.option_key,
                "text_en": opt.text_en,
                "text_ta": opt.text_ta,
                "text_hi": opt.text_hi,
                "text_ml": opt.text_ml,
                "text_te": opt.text_te,
                "text_kn": opt.text_kn
            })

        if exam.shuffle_options and len(options_list) > 1:
            rnd_opt = random.Random(f"{session.id}_{q.id}")
            rnd_opt.shuffle(options_list)

        student_questions.append(StudentQuestionItem(
            id=q.id,
            order_index=idx,
            section_name=eq.section_name or "General",
            question_type=q.question_type,
            difficulty=q.difficulty,
            marks=eq.marks_override or q.marks,
            question_en=q.question_en,
            question_ta=q.question_ta,
            question_hi=q.question_hi,
            question_ml=q.question_ml,
            options=options_list,
            coding_starter_code=q.coding_starter_code,
            coding_language=q.coding_language,
            is_answered=ans.is_answered if ans else False,
            is_flagged=ans.is_flagged if ans else False,
            saved_selected_options=ans.selected_options if ans else None,
            saved_text_answer=ans.text_answer if ans else None,
            saved_code_answer=ans.code_answer if ans else None,
            saved_image_url=ans.image_url if ans else None
        ))

    proctoring_config = {
        "camera_required": exam.camera_required,
        "mic_required": exam.mic_required,
        "face_detection": exam.face_detection_enabled,
        "gaze_detection": exam.gaze_detection_enabled,
        "multi_face_detection": exam.multi_face_detection_enabled,
        "tab_switch_detection": exam.tab_switch_detection_enabled,
        "heartbeat_interval_seconds": 10
    }

    return ExamStartResponse(
        session_id=session.id,
        exam_id=exam.id,
        exam_title=exam.title,
        duration_minutes=exam.duration_minutes,
        server_time=now,
        expires_at=session.end_time,
        remaining_seconds=remaining_seconds,
        total_questions=len(student_questions),
        questions=student_questions,
        proctoring_config=proctoring_config
    )

@router.post("/{session_id}/save-answer", response_model=AnswerResponse)
@router.post("/{session_id}/answers", response_model=AnswerResponse)
@router.post("/{session_id}/answer", response_model=AnswerResponse)
def save_candidate_answer(
    session_id: int,
    payload: AnswerSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        ans = exam_service.save_answer(
            db=db,
            session_id=session_id,
            student_id=current_user.id,
            question_id=payload.question_id,
            selected_options=payload.selected_options,
            text_answer=payload.text_answer,
            code_answer=payload.code_answer,
            image_url=payload.image_url,
            is_flagged=payload.is_flagged,
            time_spent_seconds=payload.time_spent_seconds or 0
        )
        return AnswerResponse(
            id=ans.id,
            session_id=ans.session_id,
            question_id=ans.question_id,
            is_answered=ans.is_answered,
            is_flagged=ans.is_flagged,
            status="SAVED"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{session_id}/submit")
async def submit_examination(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await exam_service.submit_exam(
            db=db,
            session_id=session_id,
            student_id=current_user.id,
            auto_submitted=False
        )
        return {
            "status": "SUCCESS",
            "message": "Exam successfully submitted and evaluated",
            "result_id": result.id,
            "total_score": result.total_score,
            "max_score": result.max_score,
            "percentage": result.percentage,
            "grade": result.grade
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
