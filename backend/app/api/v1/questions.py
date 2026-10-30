import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    QuestionBank, Question, QuestionOption, Subject, Topic, User,
    ExamQuestion, Exam, AuditLog
)
from app.schemas.schemas import (
    QuestionBankCreate, QuestionBankResponse, QuestionCreate, QuestionUpdate,
    QuestionResponse, QuestionOptionCreate, SubjectResponse
)
from app.api.deps import require_role, get_current_user
from app.services.syllabus_generator_service import SyllabusQuestionGeneratorService
from app.services.code_execution_service import CodeExecutionService

router = APIRouter(prefix="/questions", tags=["Question Management"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/banks", response_model=List[QuestionBankResponse])
def list_question_banks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    banks = db.query(QuestionBank).all()
    results = []
    for b in banks:
        cnt = db.query(Question).filter(Question.bank_id == b.id, Question.status != "ARCHIVED").count()
        results.append(QuestionBankResponse(
            id=b.id,
            title=b.title,
            description=b.description,
            subject_id=b.subject_id,
            is_public=b.is_public,
            created_by_id=b.created_by_id,
            created_at=b.created_at,
            question_count=cnt
        ))
    return results

@router.post("/banks", response_model=QuestionBankResponse)
def create_question_bank(
    payload: QuestionBankCreate,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    bank = QuestionBank(
        title=payload.title,
        description=payload.description,
        subject_id=payload.subject_id,
        is_public=payload.is_public,
        created_by_id=examiner.id,
        organization_id=examiner.organization_id
    )
    db.add(bank)
    db.commit()
    db.refresh(bank)
    return QuestionBankResponse(
        id=bank.id,
        title=bank.title,
        description=bank.description,
        subject_id=bank.subject_id,
        is_public=bank.is_public,
        created_by_id=bank.created_by_id,
        created_at=bank.created_at,
        question_count=0
    )

bank_router = APIRouter(prefix="/question-banks", tags=["Question Banks"])

@bank_router.get("", response_model=List[QuestionBankResponse])
def list_question_banks_alias(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    return list_question_banks(db=db, current_user=current_user)

@bank_router.post("", response_model=QuestionBankResponse)
def create_question_bank_alias(
    payload: QuestionBankCreate,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    return create_question_bank(payload=payload, db=db, examiner=examiner)

@router.get("", response_model=List[QuestionResponse])
def list_questions(
    bank_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    topic_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    question_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    query = db.query(Question)
    if bank_id:
        query = query.filter(Question.bank_id == bank_id)
    if subject_id:
        query = query.filter(Question.subject_id == subject_id)
    if topic_id:
        query = query.filter(Question.topic_id == topic_id)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty.upper())
    if question_type:
        query = query.filter(Question.question_type == question_type.upper())
    if status_filter:
        query = query.filter(Question.status == status_filter.upper())
    else:
        query = query.filter(Question.status != "ARCHIVED")
    if search:
        query = query.filter(Question.question_en.ilike(f"%{search}%"))

    return query.order_by(Question.created_at.desc()).limit(250).all()

@router.get("/{question_id}", response_model=QuestionResponse)
def get_question_by_id(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q

@router.post("", response_model=QuestionResponse)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    # Backend Validation Rules
    q_text = (payload.question_en or "").strip()
    if not q_text:
        raise HTTPException(status_code=400, detail="Question prompt (English) is required.")

    if payload.marks <= 0:
        raise HTTPException(status_code=400, detail="Marks must be greater than zero.")

    q_type = payload.question_type.upper()
    if q_type == "MCQ":
        opts = payload.options or []
        if len(opts) < 2:
            raise HTTPException(status_code=400, detail="MCQ must have at least 2 options.")
        correct_count = sum(1 for o in opts if o.is_correct)
        if correct_count != 1:
            raise HTTPException(status_code=400, detail="MCQ must have exactly 1 correct option marked.")
    elif q_type == "MULTI_SELECT":
        opts = payload.options or []
        if len(opts) < 2:
            raise HTTPException(status_code=400, detail="Multi-select must have at least 2 options.")
        correct_count = sum(1 for o in opts if o.is_correct)
        if correct_count < 1:
            raise HTTPException(status_code=400, detail="Multi-select must have at least 1 correct option marked.")

    question = Question(
        bank_id=payload.bank_id,
        subject_id=payload.subject_id,
        topic_id=payload.topic_id,
        question_type=q_type,
        difficulty=payload.difficulty.upper(),
        marks=payload.marks,
        negative_marks=payload.negative_marks,
        question_en=payload.question_en,
        question_ta=payload.question_ta,
        question_hi=payload.question_hi,
        question_ml=payload.question_ml,
        question_te=payload.question_te,
        question_kn=payload.question_kn,
        model_answer=payload.model_answer,
        explanation=payload.explanation,
        rubric=payload.rubric,
        coding_starter_code=payload.coding_starter_code,
        coding_language=payload.coding_language,
        coding_test_cases=payload.coding_test_cases,
        tags=payload.tags,
        status=payload.status or "ACTIVE",
        created_by_id=examiner.id
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    if payload.options:
        for opt in payload.options:
            q_opt = QuestionOption(
                question_id=question.id,
                option_key=opt.option_key.upper(),
                text_en=opt.text_en,
                text_ta=opt.text_ta,
                text_hi=opt.text_hi,
                text_ml=opt.text_ml,
                text_te=opt.text_te,
                text_kn=opt.text_kn,
                is_correct=opt.is_correct,
                explanation=opt.explanation
            )
            db.add(q_opt)
        db.commit()
        db.refresh(question)

    log = AuditLog(
        user_id=examiner.id,
        action="QUESTION_CREATED",
        resource_type="QUESTION",
        resource_id=str(question.id),
        details={"type": question.question_type, "marks": question.marks}
    )
    db.add(log)
    db.commit()

    return question

@router.patch("/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Question Versioning / Snapshot check:
    # If question is used in an active or published exam, prevent destructive changes
    used_in_published = db.query(ExamQuestion).join(Exam).filter(
        ExamQuestion.question_id == question_id,
        Exam.status.in_(["PUBLISHED", "ACTIVE", "COMPLETED"])
    ).first()

    if used_in_published and payload.options is not None:
        raise HTTPException(
            status_code=400,
            detail="This question is linked to a published examination. To protect examination integrity, please duplicate it as a new version instead of altering active exam items."
        )

    # Update basic fields if provided
    if payload.question_en is not None:
        question.question_en = payload.question_en
    if payload.question_ta is not None:
        question.question_ta = payload.question_ta
    if payload.question_hi is not None:
        question.question_hi = payload.question_hi
    if payload.question_ml is not None:
        question.question_ml = payload.question_ml
    if payload.question_te is not None:
        question.question_te = payload.question_te
    if payload.question_kn is not None:
        question.question_kn = payload.question_kn
    if payload.marks is not None:
        question.marks = payload.marks
    if payload.negative_marks is not None:
        question.negative_marks = payload.negative_marks
    if payload.difficulty is not None:
        question.difficulty = payload.difficulty.upper()
    if payload.model_answer is not None:
        question.model_answer = payload.model_answer
    if payload.explanation is not None:
        question.explanation = payload.explanation
    if payload.rubric is not None:
        question.rubric = payload.rubric
    if payload.tags is not None:
        question.tags = payload.tags
    if payload.status is not None:
        question.status = payload.status
    if payload.bank_id is not None:
        question.bank_id = payload.bank_id

    # Update options if provided and allowed
    if payload.options is not None:
        db.query(QuestionOption).filter(QuestionOption.question_id == question.id).delete()
        for opt in payload.options:
            q_opt = QuestionOption(
                question_id=question.id,
                option_key=opt.option_key.upper(),
                text_en=opt.text_en,
                text_ta=opt.text_ta,
                text_hi=opt.text_hi,
                text_ml=opt.text_ml,
                text_te=opt.text_te,
                text_kn=opt.text_kn,
                is_correct=opt.is_correct,
                explanation=opt.explanation
            )
            db.add(q_opt)

    db.commit()
    db.refresh(question)

    log = AuditLog(
        user_id=examiner.id,
        action="QUESTION_EDITED",
        resource_type="QUESTION",
        resource_id=str(question.id),
        details={"type": question.question_type}
    )
    db.add(log)
    db.commit()

    return question

@router.post("/{question_id}/duplicate", response_model=QuestionResponse)
def duplicate_question(
    question_id: int,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    original = db.query(Question).filter(Question.id == question_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Original question not found")

    new_q = Question(
        bank_id=original.bank_id,
        subject_id=original.subject_id,
        topic_id=original.topic_id,
        question_type=original.question_type,
        difficulty=original.difficulty,
        marks=original.marks,
        negative_marks=original.negative_marks,
        question_en=f"{original.question_en} (Copy)",
        question_ta=original.question_ta,
        question_hi=original.question_hi,
        question_ml=original.question_ml,
        question_te=original.question_te,
        question_kn=original.question_kn,
        model_answer=original.model_answer,
        explanation=original.explanation,
        rubric=original.rubric,
        coding_starter_code=original.coding_starter_code,
        coding_language=original.coding_language,
        coding_test_cases=original.coding_test_cases,
        tags=original.tags,
        status="DRAFT",
        created_by_id=examiner.id
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    for opt in original.options:
        new_opt = QuestionOption(
            question_id=new_q.id,
            option_key=opt.option_key,
            text_en=opt.text_en,
            text_ta=opt.text_ta,
            text_hi=opt.text_hi,
            text_ml=opt.text_ml,
            text_te=opt.text_te,
            text_kn=opt.text_kn,
            is_correct=opt.is_correct,
            explanation=opt.explanation
        )
        db.add(new_opt)

    db.commit()
    db.refresh(new_q)

    log = AuditLog(
        user_id=examiner.id,
        action="QUESTION_DUPLICATED",
        resource_type="QUESTION",
        resource_id=str(new_q.id),
        details={"source_question_id": original.id}
    )
    db.add(log)
    db.commit()

    return new_q

@router.delete("/{question_id}")
def delete_or_archive_question(
    question_id: int,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Check if question is used in any published or scheduled exam
    used = db.query(ExamQuestion).join(Exam).filter(
        ExamQuestion.question_id == question_id,
        Exam.status.in_(["PUBLISHED", "ACTIVE", "COMPLETED", "SCHEDULED"])
    ).first()

    if used:
        # Cannot hard-delete: archive it instead!
        question.status = "ARCHIVED"
        db.commit()
        return {"status": "ARCHIVED", "message": "Question is associated with an active/published exam and has been archived instead of deleted."}

    # If completely unused in exams, safe to delete
    db.query(ExamQuestion).filter(ExamQuestion.question_id == question_id).delete()
    db.query(QuestionOption).filter(QuestionOption.question_id == question_id).delete()
    db.delete(question)
    db.commit()

    log = AuditLog(
        user_id=examiner.id,
        action="QUESTION_DELETED",
        resource_type="QUESTION",
        resource_id=str(question_id)
    )
    db.add(log)
    db.commit()

    return {"status": "DELETED", "message": "Question deleted successfully."}

@router.post("/upload-image")
async def upload_diagram_or_handwritten_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    allowed_extensions = {"jpg", "jpeg", "png", "webp"}

    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WEBP images are supported.")

    raw_ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    if raw_ext not in allowed_extensions:
        raw_ext = "jpg"

    contents = await file.read(MAX_FILE_SIZE + 1)
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds maximum allowable limit of 5 MB.")

    unique_name = f"diag_{uuid.uuid4().hex[:16]}.{raw_ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(dest_path, "wb") as buffer:
        buffer.write(contents)

    return {
        "status": "UPLOADED",
        "url": f"/uploads/{unique_name}",
        "filename": unique_name
    }

@router.get("/subjects", response_model=List[SubjectResponse])
def get_subjects_and_topics(db: Session = Depends(get_db)):
    return db.query(Subject).all()

@router.post("/generate-from-syllabus")
def generate_questions_from_syllabus(
    payload: dict,
    db: Session = Depends(get_db),
    examiner: User = Depends(require_role("EXAMINER", "ADMIN"))
):
    """
    AI-powered question generator from syllabus text or curriculum topics.
    Generates MCQs, multi-select, subjective, and coding questions.
    """
    syllabus_text = payload.get("syllabus_text", "")
    subject = payload.get("subject", "Computer Science")
    count = int(payload.get("count", 5))
    difficulty = payload.get("difficulty", "MEDIUM")
    bank_id = payload.get("bank_id")

    if not syllabus_text.strip():
        raise HTTPException(status_code=400, detail="Syllabus or topic text is required")

    generated = SyllabusQuestionGeneratorService.generate_from_syllabus(
        syllabus_text=syllabus_text,
        subject=subject,
        question_count=count,
        difficulty=difficulty
    )

    # If bank_id is provided, automatically insert questions into the bank
    saved_ids = []
    if bank_id:
        for q_dict in generated:
            subj_rec = db.query(Subject).filter(Subject.name == q_dict["subject"]).first()
            subject_id = subj_rec.id if subj_rec else 1

            new_q = Question(
                bank_id=int(bank_id),
                subject_id=subject_id,
                question_text=q_dict["question_text"],
                question_type=q_dict["question_type"],
                difficulty=q_dict["difficulty"],
                marks=q_dict["marks"],
                negative_marks=0.0,
                status="ACTIVE",
                correct_answer=q_dict.get("correct_answer"),
                model_answer=q_dict.get("model_answer"),
                rubric=q_dict.get("rubric")
            )
            db.add(new_q)
            db.flush()

            if "options" in q_dict:
                for idx, opt_text in enumerate(q_dict["options"]):
                    is_corr = False
                    if q_dict.get("correct_answer") == str(idx):
                        is_corr = True
                    opt_rec = QuestionOption(
                        question_id=new_q.id,
                        option_text=opt_text,
                        is_correct=is_corr,
                        order_index=idx
                    )
                    db.add(opt_rec)

            saved_ids.append(new_q.id)
        db.commit()

    return {
        "status": "GENERATED",
        "count": len(generated),
        "saved_to_bank": bool(bank_id),
        "saved_ids": saved_ids,
        "questions": generated
    }

@router.post("/execute-code")
def run_code_sandbox(
    payload: dict,
    current_user: User = Depends(get_current_user)
):
    """
    In-browser multi-language execution sandbox against test cases.
    Supports Python, JavaScript, and C++.
    """
    language = payload.get("language", "python")
    code = payload.get("code", "")
    test_cases = payload.get("test_cases", [])

    if not code.strip():
        raise HTTPException(status_code=400, detail="Code string cannot be empty")

    result = CodeExecutionService.execute_code(language, code, test_cases)
    return result
