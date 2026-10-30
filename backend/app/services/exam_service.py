from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    Exam, ExamQuestion, ExamSession, Answer, Question, QuestionOption,
    Result, GradingQueueItem, Notification, AuditLog
)
from app.services.ai_grading_service import ai_grading_service

class ExamService:
    @staticmethod
    def start_exam_session(db: Session, exam_id: int, student_id: int, client_ip: Optional[str] = None) -> ExamSession:
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            raise ValueError("Exam not found")

        # Check existing active session
        existing = db.query(ExamSession).filter(
            ExamSession.exam_id == exam_id,
            ExamSession.student_id == student_id
        ).first()

        now = datetime.now(timezone.utc)
        if existing:
            if existing.status in ["SUBMITTED", "AUTO_SUBMITTED", "DISQUALIFIED"]:
                return existing
            # If still within time window, return existing
            return existing

        end_time = now + timedelta(minutes=exam.duration_minutes)
        session = ExamSession(
            exam_id=exam_id,
            student_id=student_id,
            start_time=now,
            end_time=end_time,
            status="IN_PROGRESS",
            client_ip=client_ip,
            last_heartbeat_at=now
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # Pre-seed answers placeholders for each question in this exam
        exam_questions = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).order_by(ExamQuestion.order_index).all()
        for eq in exam_questions:
            ans = Answer(
                session_id=session.id,
                question_id=eq.question_id,
                is_answered=False,
                is_flagged=False
            )
            db.add(ans)

        # Audit log
        log = AuditLog(
            user_id=student_id,
            action="EXAM_SESSION_START",
            resource_type="EXAM",
            resource_id=str(exam_id),
            details={"session_id": session.id, "end_time": end_time.isoformat()}
        )
        db.add(log)
        db.commit()
        return session

    @staticmethod
    def save_answer(
        db: Session,
        session_id: int,
        student_id: int,
        question_id: int,
        selected_options: Optional[List[str]] = None,
        text_answer: Optional[str] = None,
        code_answer: Optional[str] = None,
        image_url: Optional[str] = None,
        is_flagged: Optional[bool] = None,
        time_spent_seconds: int = 0
    ) -> Answer:
        session = db.query(ExamSession).filter(
            ExamSession.id == session_id,
            ExamSession.student_id == student_id
        ).first()
        if not session or session.status not in ["IN_PROGRESS"]:
            raise ValueError("Invalid or inactive session")

        # Enforce server-authoritative timer check
        now = datetime.now(timezone.utc)
        if session.end_time and now > session.end_time.replace(tzinfo=timezone.utc):
            session.status = "AUTO_SUBMITTED"
            session.submitted_at = now
            db.commit()
            raise ValueError("Exam time has expired. Exam was auto-submitted.")

        answer = db.query(Answer).filter(
            Answer.session_id == session_id,
            Answer.question_id == question_id
        ).first()

        if not answer:
            answer = Answer(session_id=session_id, question_id=question_id)
            db.add(answer)

        if selected_options is not None:
            answer.selected_options = selected_options
        if text_answer is not None:
            answer.text_answer = text_answer
        if code_answer is not None:
            answer.code_answer = code_answer
        if image_url is not None:
            answer.image_url = image_url
        if is_flagged is not None:
            answer.is_flagged = is_flagged

        has_content = bool(
            (selected_options and len(selected_options) > 0) or
            (text_answer and text_answer.strip()) or
            (code_answer and code_answer.strip()) or
            image_url
        )
        answer.is_answered = has_content
        answer.time_spent_seconds += time_spent_seconds
        answer.updated_at = now

        db.commit()
        db.refresh(answer)
        return answer

    @classmethod
    async def submit_exam(
        cls,
        db: Session,
        session_id: int,
        student_id: int,
        auto_submitted: bool = False
    ) -> Result:
        session = db.query(ExamSession).filter(
            ExamSession.id == session_id,
            ExamSession.student_id == student_id
        ).first()
        if not session:
            raise ValueError("Session not found")

        # Idempotency guard: if session has already been submitted and result exists, return it immediately
        existing_result = db.query(Result).filter(Result.session_id == session_id).first()
        if session.status in ["SUBMITTED", "AUTO_SUBMITTED"] and existing_result:
            return existing_result

        now = datetime.now(timezone.utc)
        session.status = "AUTO_SUBMITTED" if auto_submitted else "SUBMITTED"
        session.submitted_at = now

        exam = db.query(Exam).filter(Exam.id == session.exam_id).first()
        answers = db.query(Answer).filter(Answer.session_id == session_id).all()

        total_score = 0.0
        max_possible_score = 0.0
        correct_count = 0
        incorrect_count = 0
        skipped_count = 0
        partial_count = 0
        has_pending_subjective = False

        topic_stats: Dict[str, Dict[str, float]] = {}
        difficulty_stats: Dict[str, Dict[str, int]] = {
            "EASY": {"correct": 0, "total": 0},
            "MEDIUM": {"correct": 0, "total": 0},
            "HARD": {"correct": 0, "total": 0}
        }

        for ans in answers:
            q = db.query(Question).filter(Question.id == ans.question_id).first()
            if not q:
                continue

            marks = q.marks
            neg_marks = q.negative_marks if exam.negative_marking else 0.0
            max_possible_score += marks

            # Track difficulty
            diff = q.difficulty or "MEDIUM"
            if diff in difficulty_stats:
                difficulty_stats[diff]["total"] += 1

            # Track topic
            topic_name = q.topic.name if q.topic else (q.subject.name if q.subject else "General")
            if topic_name not in topic_stats:
                topic_stats[topic_name] = {"earned": 0.0, "total": 0.0}
            topic_stats[topic_name]["total"] += marks

            # 1. Objective MCQ / MULTI_SELECT evaluation
            if q.question_type in ["MCQ", "MULTI_SELECT"]:
                correct_options = [
                    opt.option_key for opt in q.options if opt.is_correct
                ]
                selected = ans.selected_options or []
                
                if not ans.is_answered or not selected:
                    skipped_count += 1
                    ans.marks_awarded = 0.0
                    ans.is_correct = False
                    ans.is_graded = True
                elif set(selected) == set(correct_options):
                    correct_count += 1
                    ans.marks_awarded = marks
                    ans.is_correct = True
                    ans.is_graded = True
                    total_score += marks
                    topic_stats[topic_name]["earned"] += marks
                    if diff in difficulty_stats:
                        difficulty_stats[diff]["correct"] += 1
                else:
                    incorrect_count += 1
                    ans.marks_awarded = -neg_marks
                    ans.is_correct = False
                    ans.is_graded = True
                    total_score -= neg_marks

            # 2. Subjective / Image / Coding evaluation
            elif q.question_type in ["SHORT_ANSWER", "LONG_ANSWER", "IMAGE_UPLOAD", "CODING"]:
                if not ans.is_answered or (not ans.text_answer and not ans.code_answer and not ans.image_url):
                    skipped_count += 1
                    ans.marks_awarded = 0.0
                    ans.is_graded = True
                else:
                    has_pending_subjective = True
                    # Run AI evaluation asynchronously for recommendation
                    submission_text = ans.text_answer or ans.code_answer or f"Image attachment submitted: {ans.image_url}"
                    ai_eval = await ai_grading_service.evaluate_subjective_answer(
                        question_text=q.question_en,
                        student_answer=submission_text,
                        model_answer=q.model_answer,
                        rubric=q.rubric,
                        max_marks=marks
                    )

                    ans.ai_suggested_score = ai_eval["suggested_score"]
                    ans.ai_confidence = ai_eval["confidence"]
                    ans.ai_justification = ai_eval["justification"]
                    ans.ai_matched_concepts = ai_eval["matched_concepts"]
                    ans.ai_missing_concepts = ai_eval["missing_concepts"]
                    # By default, stage into grading queue for examiner verification
                    ans.is_graded = False

                    queue_item = GradingQueueItem(
                        answer_id=ans.id,
                        session_id=session_id,
                        exam_id=exam.id,
                        question_id=q.id,
                        student_id=student_id,
                        examiner_id=exam.created_by_id,
                        status="PENDING",
                        ai_score=ai_eval["suggested_score"]
                    )
                    db.add(queue_item)

        # Calculate percentage
        percentage = round((total_score / max(1.0, max_possible_score)) * 100.0, 2)
        if percentage >= 85:
            grade = "A+"
        elif percentage >= 75:
            grade = "A"
        elif percentage >= 60:
            grade = "B"
        elif percentage >= 45:
            grade = "C"
        else:
            grade = "F"

        # Topic breakdown percentages
        topic_breakdown_formatted = {}
        for tname, tdata in topic_stats.items():
            tot = tdata["total"] or 1.0
            pct = round((tdata["earned"] / tot) * 100.0, 1)
            topic_breakdown_formatted[tname] = {
                "score": round(tdata["earned"], 1),
                "total": round(tdata["total"], 1),
                "percentage": max(0.0, pct)
            }

        # Save or update result
        result = db.query(Result).filter(Result.session_id == session_id).first()
        if not result:
            result = Result(
                session_id=session_id,
                exam_id=exam.id,
                student_id=student_id
            )
            db.add(result)

        result.total_score = max(0.0, round(total_score, 1))
        result.max_score = round(max_possible_score, 1)
        result.percentage = max(0.0, percentage)
        result.grade = grade
        result.status = "PENDING_GRADING" if has_pending_subjective else "PUBLISHED"
        result.total_questions = len(answers)
        result.correct_count = correct_count
        result.incorrect_count = incorrect_count
        result.skipped_count = skipped_count
        result.partial_count = partial_count
        result.topic_breakdown = topic_breakdown_formatted
        result.difficulty_breakdown = difficulty_stats
        result.published_at = now

        # Add notification
        notif = Notification(
            user_id=student_id,
            title="Exam Submitted Successfully",
            message=f"Your submission for {exam.title} has been recorded.",
            type="SUCCESS",
            link_url=f"/student/results"
        )
        db.add(notif)

        db.commit()
        db.refresh(result)
        return result

exam_service = ExamService()
