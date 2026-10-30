import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON, Enum, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    EXAMINER = "EXAMINER"
    STUDENT = "STUDENT"

class ExamStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class SessionStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    AUTO_SUBMITTED = "AUTO_SUBMITTED"
    DISQUALIFIED = "DISQUALIFIED"

class QuestionType(str, enum.Enum):
    MCQ = "MCQ"
    MULTI_SELECT = "MULTI_SELECT"
    SHORT_ANSWER = "SHORT_ANSWER"
    LONG_ANSWER = "LONG_ANSWER"
    IMAGE_UPLOAD = "IMAGE_UPLOAD"
    CODING = "CODING"

class DifficultyLevel(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class ProctorEventType(str, enum.Enum):
    FACE_ABSENT = "FACE_ABSENT"
    MULTIPLE_FACES = "MULTIPLE_FACES"
    GAZE_AWAY = "GAZE_AWAY"
    TAB_SWITCH = "TAB_SWITCH"
    WINDOW_BLUR = "WINDOW_BLUR"
    FULLSCREEN_EXIT = "FULLSCREEN_EXIT"
    CAMERA_DISABLED = "CAMERA_DISABLED"

class SeverityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class GradingStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    OVERRIDDEN = "OVERRIDDEN"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    domain = Column(String(255), nullable=True)
    logo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    users = relationship("User", back_populates="organization")
    exams = relationship("Exam", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="STUDENT", index=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    organization = relationship("Organization", back_populates="users")
    created_exams = relationship("Exam", back_populates="creator", foreign_keys="Exam.created_by_id")
    sessions = relationship("ExamSession", back_populates="student")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    assigned_candidate_exams = relationship("ExamCandidate", back_populates="student")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    topics = relationship("Topic", back_populates="subject")
    question_banks = relationship("QuestionBank", back_populates="subject")
    exams = relationship("Exam", back_populates="subject")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    subject = relationship("Subject", back_populates="topics")
    questions = relationship("Question", back_populates="topic")

class QuestionBank(Base):
    __tablename__ = "question_banks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    subject = relationship("Subject", back_populates="question_banks")
    questions = relationship("Question", back_populates="bank")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("question_banks.id"), nullable=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    question_type = Column(String(50), default="MCQ", nullable=False)  # MCQ, MULTI_SELECT, SHORT_ANSWER, LONG_ANSWER, IMAGE_UPLOAD, CODING
    difficulty = Column(String(50), default="MEDIUM", nullable=False)   # EASY, MEDIUM, HARD
    marks = Column(Float, default=1.0)
    negative_marks = Column(Float, default=0.0)

    # Multilingual question texts
    question_en = Column(Text, nullable=False)
    question_ta = Column(Text, nullable=True)
    question_hi = Column(Text, nullable=True)
    question_ml = Column(Text, nullable=True)
    question_te = Column(Text, nullable=True)
    question_kn = Column(Text, nullable=True)

    # Subjective & Coding helpers
    model_answer = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    rubric = Column(JSON, nullable=True)  # List of criteria: [{criterion: str, weight: float, keywords: []}]
    coding_starter_code = Column(Text, nullable=True)
    coding_language = Column(String(50), nullable=True)
    coding_test_cases = Column(JSON, nullable=True)  # [{input: str, expected_output: str, is_hidden: bool}]
    tags = Column(JSON, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="ACTIVE", index=True)  # ACTIVE, DRAFT, ARCHIVED
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    bank = relationship("QuestionBank", back_populates="questions")
    subject = relationship("Subject")
    topic = relationship("Topic", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    exam_questions = relationship("ExamQuestion", back_populates="question")

class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    option_key = Column(String(10), nullable=False)  # A, B, C, D
    text_en = Column(Text, nullable=False)
    text_ta = Column(Text, nullable=True)
    text_hi = Column(Text, nullable=True)
    text_ml = Column(Text, nullable=True)
    text_te = Column(Text, nullable=True)
    text_kn = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False)
    explanation = Column(Text, nullable=True)

    question = relationship("Question", back_populates="options")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    duration_minutes = Column(Integer, default=60)
    total_marks = Column(Float, default=100.0)
    passing_marks = Column(Float, default=40.0)
    negative_marking = Column(Boolean, default=False)
    shuffle_questions = Column(Boolean, default=True)
    shuffle_options = Column(Boolean, default=True)

    # Proctoring Configuration
    camera_required = Column(Boolean, default=True)
    mic_required = Column(Boolean, default=False)
    face_detection_enabled = Column(Boolean, default=True)
    gaze_detection_enabled = Column(Boolean, default=True)
    multi_face_detection_enabled = Column(Boolean, default=True)
    tab_switch_detection_enabled = Column(Boolean, default=True)

    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="DRAFT", index=True)  # DRAFT, PUBLISHED, ACTIVE, COMPLETED, ARCHIVED
    instructions = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    organization = relationship("Organization", back_populates="exams")
    creator = relationship("User", back_populates="created_exams", foreign_keys=[created_by_id])
    subject = relationship("Subject", back_populates="exams")
    exam_questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan", order_by="ExamQuestion.order_index")
    candidates = relationship("ExamCandidate", back_populates="exam", cascade="all, delete-orphan")
    sessions = relationship("ExamSession", back_populates="exam")

class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    section_name = Column(String(100), default="General")
    order_index = Column(Integer, default=0)
    marks_override = Column(Float, nullable=True)
    negative_marks_override = Column(Float, nullable=True)

    exam = relationship("Exam", back_populates="exam_questions")
    question = relationship("Question", back_populates="exam_questions")

class ExamCandidate(Base):
    __tablename__ = "exam_candidates"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=utc_now)
    status = Column(String(50), default="ASSIGNED")  # ASSIGNED, INVITED, COMPLETED

    exam = relationship("Exam", back_populates="candidates")
    student = relationship("User", back_populates="assigned_candidate_exams")

class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    start_time = Column(DateTime, default=utc_now)
    end_time = Column(DateTime, nullable=True)  # Authoritative server expiration time
    submitted_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="IN_PROGRESS", index=True)  # NOT_STARTED, IN_PROGRESS, SUBMITTED, AUTO_SUBMITTED, DISQUALIFIED

    current_question_index = Column(Integer, default=0)
    suspicion_score = Column(Float, default=0.0)  # Calculated 0-100
    is_flagged = Column(Boolean, default=False)
    client_ip = Column(String(100), nullable=True)
    user_agent = Column(String(500), nullable=True)
    last_heartbeat_at = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)

    exam = relationship("Exam", back_populates="sessions")
    student = relationship("User", back_populates="sessions")
    answers = relationship("Answer", back_populates="session", cascade="all, delete-orphan")
    proctor_events = relationship("ProctorEvent", back_populates="session", cascade="all, delete-orphan")
    result = relationship("Result", back_populates="session", uselist=False)

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)

    selected_options = Column(JSON, nullable=True)  # List of selected option keys, e.g. ["A"] or ["A", "C"]
    text_answer = Column(Text, nullable=True)       # For short & long answer
    image_url = Column(String(500), nullable=True)   # Handwritten / diagram upload
    code_answer = Column(Text, nullable=True)       # Coding submission
    is_answered = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)     # Marked for review by candidate
    time_spent_seconds = Column(Integer, default=0)

    # Evaluation
    marks_awarded = Column(Float, default=0.0)
    is_correct = Column(Boolean, nullable=True)
    ai_suggested_score = Column(Float, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_justification = Column(Text, nullable=True)
    ai_matched_concepts = Column(JSON, nullable=True)
    ai_missing_concepts = Column(JSON, nullable=True)
    examiner_feedback = Column(Text, nullable=True)
    is_graded = Column(Boolean, default=False)
    graded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    graded_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    session = relationship("ExamSession", back_populates="answers")
    question = relationship("Question")

class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id"), unique=True, nullable=False, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    total_score = Column(Float, default=0.0)
    max_score = Column(Float, default=100.0)
    percentage = Column(Float, default=0.0)
    grade = Column(String(10), default="F")
    rank = Column(Integer, nullable=True)
    percentile = Column(Float, nullable=True)
    status = Column(String(50), default="PUBLISHED")  # PENDING_GRADING, PUBLISHED, WITHHELD

    total_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)
    partial_count = Column(Integer, default=0)

    topic_breakdown = Column(JSON, nullable=True)       # {"Algorithms": {"score": 82, "total": 100}, ...}
    difficulty_breakdown = Column(JSON, nullable=True)  # {"EASY": {"correct": 5, "total": 6}, ...}
    
    published_at = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)

    session = relationship("ExamSession", back_populates="result")
    certificate = relationship("Certificate", back_populates="result", uselist=False)

class ProctorEvent(Base):
    __tablename__ = "proctor_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # FACE_ABSENT, FACE_RESTORED, MULTIPLE_FACE_DETECTED, MULTIPLE_FACE_RESTORED, GAZE_AWAY, TAB_SWITCH, WINDOW_BLUR, WINDOW_FOCUS, FULLSCREEN_EXIT, CAMERA_DISCONNECTED, CAMERA_RESTORED, NETWORK_INTERRUPTED, NETWORK_RESTORED
    severity = Column(String(50), default="LOW", index=True)     # INFO, LOW, MEDIUM, HIGH, CRITICAL
    duration_ms = Column(Integer, nullable=True)
    confidence = Column(Float, nullable=True)
    face_count = Column(Integer, nullable=True)
    score_delta = Column(Float, default=0.0)
    details = Column(JSON, nullable=True)
    snapshot_url = Column(String(500), nullable=True)
    review_status = Column(String(50), default="UNREVIEWED", index=True)  # UNREVIEWED, REVIEWED, DISMISSED, CONFIRMED
    examiner_notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)

    session = relationship("ExamSession", back_populates="proctor_events")

class ProctorSession(Base):
    __tablename__ = "proctor_sessions"

    id = Column(Integer, primary_key=True, index=True)
    exam_session_id = Column(Integer, ForeignKey("exam_sessions.id"), nullable=False, unique=True, index=True)
    started_at = Column(DateTime, default=utc_now)
    ended_at = Column(DateTime, nullable=True)
    camera_status = Column(String(50), default="ACTIVE")
    current_face_count = Column(Integer, default=1)
    last_face_seen_at = Column(DateTime, default=utc_now)
    last_heartbeat_at = Column(DateTime, default=utc_now, index=True)
    connection_status = Column(String(50), default="ONLINE")
    total_events = Column(Integer, default=0)
    review_status = Column(String(50), default="NORMAL", index=True)  # NORMAL, NEEDS_REVIEW, UNDER_REVIEW, REVIEWED

    session = relationship("ExamSession")


class GradingQueueItem(Base):
    __tablename__ = "grading_queue"

    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("answers.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    examiner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="PENDING")  # PENDING, IN_REVIEW, APPROVED, OVERRIDDEN
    ai_score = Column(Float, nullable=True)
    final_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    answer = relationship("Answer")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="INFO")  # INFO, WARNING, SUCCESS, ALERT
    is_read = Column(Boolean, default=False)
    link_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    user = relationship("User", back_populates="audit_logs")

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("results.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    certificate_number = Column(String(100), unique=True, index=True, nullable=False)
    issue_date = Column(DateTime, default=utc_now)
    verification_hash = Column(String(255), nullable=False)

    result = relationship("Result", back_populates="certificate")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
