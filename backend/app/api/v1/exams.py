from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import random
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    Exam, ExamQuestion, ExamCandidate, Question, Subject, User, AuditLog,
    ExamSession, Result, QuestionOption
)
from app.schemas.schemas import (
    ExamCreate, ExamUpdate, ExamResponse, ExamDetailResponse,
    ExamCandidateResponse, ExamCandidateAssignRequest, ExamValidateResponse,
    ExamAutoSelectRequest, QuestionResponse
)
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/exams", tags=["Exams"])

def _build_exam_response(exam: Exam, db: Session) -> ExamResponse:
    q_count = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam.id).count()
    c_count = db.query(ExamCandidate).filter(ExamCandidate.exam_id == exam.id).count()
    return ExamResponse(
        id=exam.id,
        title=exam.title,
        code=exam.code,
        description=exam.description,
        subject_id=exam.subject_id,
        created_by_id=exam.created_by_id,
        duration_minutes=exam.duration_minutes,
        total_marks=exam.total_marks,
        passing_marks=exam.passing_marks,
        negative_marking=exam.negative_marking,
        shuffle_questions=exam.shuffle_questions,
        shuffle_options=exam.shuffle_options,
        camera_required=exam.camera_required,
        mic_required=exam.mic_required,
        face_detection_enabled=exam.face_detection_enabled,
        gaze_detection_enabled=exam.gaze_detection_enabled,
        multi_face_detection_enabled=exam.multi_face_detection_enabled,
        tab_switch_detection_enabled=exam.tab_switch_detection_enabled,
        start_time=exam.start_time,
        end_time=exam.end_time,
        status=exam.status,
        instructions=exam.instructions,
        created_at=exam.created_at,
        question_count=q_count,
        candidate_count=c_count
    )

@router.get("", response_model=List[ExamResponse])
def list_exams(
    status_filter: Optional[str] = Query(None, alias="status"),
    subject_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Exam)

    # Students only see published, active, or assigned exams
    if current_user.role == "STUDENT":
        # Check if student is explicitly assigned or exam is public/published
        candidate_exam_ids = [c.exam_id for c in db.query(ExamCandidate).filter(ExamCandidate.student_id == current_user.id).all()]
        query = query.filter(
            (Exam.status.in_(["PUBLISHED", "ACTIVE"])) | (Exam.id.in_(candidate_exam_ids))
        )
    elif current_user.role == "EXAMINER":
        query = query.filter(
            (Exam.created_by_id == current_user.id) | (Exam.status.in_(["PUBLISHED", "ACTIVE", "COMPLETED"]))
        )

    if status_filter:
        query = query.filter(Exam.status == status_filter.upper())
    if subject_id:
        query = query.filter(Exam.subject_id == subject_id)
    if search:
        query = query.filter(
            (Exam.title.ilike(f"%{search}%")) | (Exam.code.ilike(f"%{search}%"))
        )

    exams = query.order_by(Exam.created_at.desc()).all()
    return [_build_exam_response(e, db) for e in exams]

@router.get("/{exam_id}", response_model=ExamDetailResponse)
def get_exam_by_id(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Fetch associated questions
    eqs = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam.id).order_by(ExamQuestion.order_index).all()
    questions_list = []
    for eq in eqs:
        if eq.question:
            questions_list.append(eq.question)

    # Fetch assigned candidates
    candidates = db.query(ExamCandidate).filter(ExamCandidate.exam_id == exam.id).all()
    candidate_responses = []
    for c in candidates:
        candidate_responses.append(ExamCandidateResponse(
            id=c.id,
            exam_id=c.exam_id,
            student_id=c.student_id,
            student_name=c.student.full_name if c.student else "Candidate",
            student_email=c.student.email if c.student else "",
            assigned_at=c.assigned_at,
            status=c.status
        ))

    base_resp = _build_exam_response(exam, db)
    return ExamDetailResponse(
        **base_resp.model_dump(),
        questions=questions_list,
        candidates=candidate_responses
    )

@router.post("", response_model=ExamResponse)
def create_exam_wizard(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    code_cleaned = payload.code.upper().strip()
    if not code_cleaned:
        code_cleaned = f"EXAM-{random.randint(1000, 9999)}"

    # Check duplicate code
    existing = db.query(Exam).filter(Exam.code == code_cleaned).first()
    if existing:
        raise HTTPException(status_code=400, detail="Exam code already exists. Please choose a unique code.")

    if payload.passing_marks > payload.total_marks:
        raise HTTPException(status_code=400, detail="Passing marks cannot exceed total marks.")

    exam = Exam(
        title=payload.title,
        code=code_cleaned,
        description=payload.description,
        subject_id=payload.subject_id,
        organization_id=examiner.organization_id,
        created_by_id=examiner.id,
        duration_minutes=payload.duration_minutes,
        total_marks=payload.total_marks,
        passing_marks=payload.passing_marks,
        negative_marking=payload.negative_marking,
        shuffle_questions=payload.shuffle_questions,
        shuffle_options=payload.shuffle_options,
        camera_required=payload.camera_required,
        mic_required=payload.mic_required,
        face_detection_enabled=payload.face_detection_enabled,
        gaze_detection_enabled=payload.gaze_detection_enabled,
        multi_face_detection_enabled=payload.multi_face_detection_enabled,
        tab_switch_detection_enabled=payload.tab_switch_detection_enabled,
        start_time=payload.start_time,
        end_time=payload.end_time,
        instructions=payload.instructions,
        status=payload.status or "DRAFT"
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    # Attach questions if specified
    if payload.question_ids:
        for idx, qid in enumerate(payload.question_ids):
            eq = ExamQuestion(
                exam_id=exam.id,
                question_id=qid,
                order_index=idx
            )
            db.add(eq)
        db.commit()

    # Assign candidates if specified
    if payload.candidate_ids:
        for sid in payload.candidate_ids:
            ec = ExamCandidate(
                exam_id=exam.id,
                student_id=sid,
                status="ASSIGNED"
            )
            db.add(ec)
        db.commit()

    log = AuditLog(
        user_id=examiner.id,
        action="EXAM_CREATED",
        resource_type="EXAM",
        resource_id=str(exam.id),
        details={"title": exam.title, "code": exam.code, "status": exam.status}
    )
    db.add(log)
    db.commit()

    return _build_exam_response(exam, db)

@router.patch("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: int,
    payload: ExamUpdate,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Security check: Examiner A cannot edit Examiner B's private exam unless admin
    if examiner.role != "ADMIN" and exam.created_by_id != examiner.id:
        raise HTTPException(status_code=403, detail="Unauthorized to modify this examination.")

    # Guard live/active exams against structural modifications
    if exam.status in ["ACTIVE", "LIVE"] and (payload.question_ids is not None or payload.duration_minutes is not None):
        raise HTTPException(status_code=400, detail="This examination is currently active. Structural changes are not allowed.")

    if exam.status in ["COMPLETED", "ARCHIVED"]:
        raise HTTPException(status_code=400, detail="Completed or archived examinations cannot be modified.")

    if payload.title is not None:
        exam.title = payload.title
    if payload.description is not None:
        exam.description = payload.description
    if payload.duration_minutes is not None:
        exam.duration_minutes = payload.duration_minutes
    if payload.total_marks is not None:
        exam.total_marks = payload.total_marks
    if payload.passing_marks is not None:
        exam.passing_marks = payload.passing_marks
    if payload.negative_marking is not None:
        exam.negative_marking = payload.negative_marking
    if payload.shuffle_questions is not None:
        exam.shuffle_questions = payload.shuffle_questions
    if payload.shuffle_options is not None:
        exam.shuffle_options = payload.shuffle_options
    if payload.camera_required is not None:
        exam.camera_required = payload.camera_required
    if payload.mic_required is not None:
        exam.mic_required = payload.mic_required
    if payload.face_detection_enabled is not None:
        exam.face_detection_enabled = payload.face_detection_enabled
    if payload.gaze_detection_enabled is not None:
        exam.gaze_detection_enabled = payload.gaze_detection_enabled
    if payload.multi_face_detection_enabled is not None:
        exam.multi_face_detection_enabled = payload.multi_face_detection_enabled
    if payload.tab_switch_detection_enabled is not None:
        exam.tab_switch_detection_enabled = payload.tab_switch_detection_enabled
    if payload.start_time is not None:
        exam.start_time = payload.start_time
    if payload.end_time is not None:
        exam.end_time = payload.end_time
    if payload.instructions is not None:
        exam.instructions = payload.instructions
    if payload.status is not None:
        exam.status = payload.status

    # Update questions if provided
    if payload.question_ids is not None:
        db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam.id).delete()
        for idx, qid in enumerate(payload.question_ids):
            eq = ExamQuestion(exam_id=exam.id, question_id=qid, order_index=idx)
            db.add(eq)

    # Update candidate assignments if provided
    if payload.candidate_ids is not None:
        db.query(ExamCandidate).filter(ExamCandidate.exam_id == exam.id).delete()
        for sid in payload.candidate_ids:
            ec = ExamCandidate(exam_id=exam.id, student_id=sid, status="ASSIGNED")
            db.add(ec)

    db.commit()
    db.refresh(exam)

    log = AuditLog(
        user_id=examiner.id,
        action="EXAM_UPDATED",
        resource_type="EXAM",
        resource_id=str(exam.id),
        details={"status": exam.status}
    )
    db.add(log)
    db.commit()

    return _build_exam_response(exam, db)

@router.post("/{exam_id}/validate", response_model=ExamValidateResponse)
def validate_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    issues = []
    if not exam.title or len(exam.title.strip()) < 3:
        issues.append("Exam title must be at least 3 characters.")
    if exam.total_marks <= 0:
        issues.append("Total marks must be greater than zero.")
    if exam.passing_marks > exam.total_marks:
        issues.append(f"Passing marks ({exam.passing_marks}) cannot exceed total marks ({exam.total_marks}).")
    if exam.duration_minutes < 5:
        issues.append("Duration must be at least 5 minutes.")

    # Validate questions
    eqs = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam.id).all()
    if not eqs:
        issues.append("At least one question must be selected before publishing.")
    else:
        for idx, eq in enumerate(eqs):
            q = eq.question
            if not q:
                continue
            if q.question_type == "MCQ":
                correct_count = sum(1 for o in q.options if o.is_correct)
                if correct_count != 1:
                    issues.append(f"Question #{idx + 1} ({q.question_en[:30]}...) has {correct_count} correct answers. MCQ requires exactly 1 correct answer.")
            elif q.question_type == "MULTI_SELECT":
                correct_count = sum(1 for o in q.options if o.is_correct)
                if correct_count < 1:
                    issues.append(f"Question #{idx + 1} ({q.question_en[:30]}...) has no correct answers selected.")

    # Validate schedule
    if exam.start_time and exam.end_time:
        if exam.end_time <= exam.start_time:
            issues.append("Schedule end time must be after the start time.")

    return ExamValidateResponse(
        valid=(len(issues) == 0),
        issues=issues,
        total_marks=exam.total_marks,
        question_count=len(eqs),
        passing_marks=exam.passing_marks
    )

@router.post("/{exam_id}/publish", response_model=ExamResponse)
def publish_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Run validation check
    val = validate_exam(exam_id=exam_id, db=db, examiner=examiner)
    if not val.valid:
        raise HTTPException(
            status_code=400,
            detail=f"Exam cannot be published due to validation errors: {'; '.join(val.issues)}"
        )

    now = datetime.now(timezone.utc)
    if exam.start_time and exam.start_time.replace(tzinfo=timezone.utc) > now:
        exam.status = "SCHEDULED"
    else:
        exam.status = "PUBLISHED"

    db.commit()
    db.refresh(exam)

    log = AuditLog(
        user_id=examiner.id,
        action="EXAM_PUBLISHED",
        resource_type="EXAM",
        resource_id=str(exam.id),
        details={"status": exam.status}
    )
    db.add(log)
    db.commit()

    return _build_exam_response(exam, db)

@router.post("/{exam_id}/candidates")
def assign_candidates(
    exam_id: int,
    payload: ExamCandidateAssignRequest,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    added_count = 0
    for sid in payload.student_ids:
        existing = db.query(ExamCandidate).filter(
            ExamCandidate.exam_id == exam_id,
            ExamCandidate.student_id == sid
        ).first()
        if not existing:
            ec = ExamCandidate(exam_id=exam_id, student_id=sid, status="ASSIGNED")
            db.add(ec)
            added_count += 1

    db.commit()
    return {
        "status": "SUCCESS",
        "message": f"Successfully assigned {added_count} candidates to examination.",
        "total_assigned": db.query(ExamCandidate).filter(ExamCandidate.exam_id == exam_id).count()
    }

@router.get("/{exam_id}/candidates", response_model=List[ExamCandidateResponse])
def get_exam_candidates(
    exam_id: int,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    candidates = db.query(ExamCandidate).filter(ExamCandidate.exam_id == exam_id).all()
    results = []
    for c in candidates:
        results.append(ExamCandidateResponse(
            id=c.id,
            exam_id=c.exam_id,
            student_id=c.student_id,
            student_name=c.student.full_name if c.student else "Candidate",
            student_email=c.student.email if c.student else "",
            assigned_at=c.assigned_at,
            status=c.status
        ))
    return results

@router.post("/auto-select-questions")
def auto_select_questions(
    payload: ExamAutoSelectRequest,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    query = db.query(Question).filter(Question.status != "ARCHIVED")
    if payload.subject_id:
        query = query.filter(Question.subject_id == payload.subject_id)
    if payload.bank_id:
        query = query.filter(Question.bank_id == payload.bank_id)
    if payload.question_types:
        query = query.filter(Question.question_type.in_([qt.upper() for qt in payload.question_types]))

    all_matching = query.all()
    easy_pool = [q for q in all_matching if q.difficulty == "EASY"]
    med_pool = [q for q in all_matching if q.difficulty == "MEDIUM"]
    hard_pool = [q for q in all_matching if q.difficulty == "HARD"]

    issues = []
    if len(easy_pool) < payload.easy_count:
        issues.append(f"Only {len(easy_pool)} Easy questions available, but {payload.easy_count} requested.")
    if len(med_pool) < payload.medium_count:
        issues.append(f"Only {len(med_pool)} Medium questions available, but {payload.medium_count} requested.")
    if len(hard_pool) < payload.hard_count:
        issues.append(f"Only {len(hard_pool)} Hard questions available, but {payload.hard_count} requested.")

    if issues:
        return {
            "success": False,
            "message": "Insufficient questions in pool.",
            "issues": issues,
            "selected_ids": []
        }

    selected_easy = random.sample(easy_pool, payload.easy_count)
    selected_med = random.sample(med_pool, payload.medium_count)
    selected_hard = random.sample(hard_pool, payload.hard_count)
    all_selected = selected_easy + selected_med + selected_hard

    return {
        "success": True,
        "selected_ids": [q.id for q in all_selected],
        "total_selected": len(all_selected),
        "total_marks": sum(q.marks for q in all_selected)
    }

@router.post("/{exam_id}/duplicate", response_model=ExamResponse)
def duplicate_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    original = db.query(Exam).filter(Exam.id == exam_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Exam not found")

    new_code = f"{original.code}-COPY-{random.randint(100, 999)}"
    new_exam = Exam(
        title=f"{original.title} (Copy)",
        code=new_code,
        description=original.description,
        subject_id=original.subject_id,
        organization_id=examiner.organization_id,
        created_by_id=examiner.id,
        duration_minutes=original.duration_minutes,
        total_marks=original.total_marks,
        passing_marks=original.passing_marks,
        negative_marking=original.negative_marking,
        shuffle_questions=original.shuffle_questions,
        shuffle_options=original.shuffle_options,
        camera_required=original.camera_required,
        mic_required=original.mic_required,
        face_detection_enabled=original.face_detection_enabled,
        gaze_detection_enabled=original.gaze_detection_enabled,
        multi_face_detection_enabled=original.multi_face_detection_enabled,
        tab_switch_detection_enabled=original.tab_switch_detection_enabled,
        instructions=original.instructions,
        status="DRAFT"
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    # Copy question links
    eqs = db.query(ExamQuestion).filter(ExamQuestion.exam_id == original.id).all()
    for eq in eqs:
        new_eq = ExamQuestion(
            exam_id=new_exam.id,
            question_id=eq.question_id,
            order_index=eq.order_index,
            marks_override=eq.marks_override,
            negative_marks_override=eq.negative_marks_override
        )
        db.add(new_eq)
    db.commit()

    return _build_exam_response(new_exam, db)

@router.delete("/{exam_id}")
def delete_or_cancel_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if exam.status in ["ACTIVE", "LIVE"]:
        raise HTTPException(status_code=400, detail="Active exams cannot be deleted or cancelled.")

    if exam.status == "DRAFT":
        db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam.id).delete()
        db.query(ExamCandidate).filter(ExamCandidate.exam_id == exam.id).delete()
        db.delete(exam)
        db.commit()
        return {"status": "DELETED", "message": "Draft exam deleted successfully."}
    elif exam.status == "SCHEDULED":
        exam.status = "CANCELLED"
        db.commit()
        return {"status": "CANCELLED", "message": "Scheduled exam has been cancelled."}
    else:
        exam.status = "ARCHIVED"
        db.commit()
        return {"status": "ARCHIVED", "message": "Exam has been archived."}

@router.post("/{exam_id}/publish-results")
def publish_exam_results(
    exam_id: int,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    results = db.query(Result).filter(Result.exam_id == exam_id).all()
    pending_count = sum(1 for r in results if r.status == "PENDING_GRADING")

    # Mark all results published
    for r in results:
        r.status = "PUBLISHED"
        r.published_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Results published for {len(results)} candidates.",
        "pending_grading_overridden": pending_count,
        "total_results": len(results)
    }
