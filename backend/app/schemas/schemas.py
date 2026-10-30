from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- Auth & User ---
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    email: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None
    exam_id: Optional[int] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "STUDENT"
    phone: Optional[str] = None
    organization_id: Optional[int] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Organization ---
class OrganizationBase(BaseModel):
    name: str
    code: str
    domain: Optional[str] = None
    logo_url: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Subject & Topic ---
class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None

class TopicResponse(TopicBase):
    id: int
    subject_id: int

    model_config = ConfigDict(from_attributes=True)

class SubjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class SubjectResponse(SubjectBase):
    id: int
    topics: List[TopicResponse] = []

    model_config = ConfigDict(from_attributes=True)

# --- Questions & Question Banks ---
class QuestionOptionBase(BaseModel):
    option_key: str
    text_en: str
    text_ta: Optional[str] = None
    text_hi: Optional[str] = None
    text_ml: Optional[str] = None
    text_te: Optional[str] = None
    text_kn: Optional[str] = None
    is_correct: bool = False
    explanation: Optional[str] = None

class QuestionOptionCreate(QuestionOptionBase):
    pass

class QuestionOptionResponse(QuestionOptionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class QuestionBase(BaseModel):
    model_config = {"protected_namespaces": ()}
    question_type: str = "MCQ"  # MCQ, MULTI_SELECT, SHORT_ANSWER, LONG_ANSWER, IMAGE_UPLOAD, CODING
    difficulty: str = "MEDIUM"   # EASY, MEDIUM, HARD
    marks: float = 1.0
    negative_marks: float = 0.0
    question_en: str
    question_ta: Optional[str] = None
    question_hi: Optional[str] = None
    question_ml: Optional[str] = None
    question_te: Optional[str] = None
    question_kn: Optional[str] = None
    model_answer: Optional[str] = None
    explanation: Optional[str] = None
    rubric: Optional[List[Dict[str, Any]]] = None
    coding_starter_code: Optional[str] = None
    coding_language: Optional[str] = None
    coding_test_cases: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None
    status: str = "ACTIVE"  # ACTIVE, DRAFT, ARCHIVED
    bank_id: Optional[int] = None
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None

class QuestionCreate(QuestionBase):
    options: Optional[List[QuestionOptionBase]] = []

class QuestionUpdate(BaseModel):
    model_config = {"protected_namespaces": ()}
    question_type: Optional[str] = None
    difficulty: Optional[str] = None
    marks: Optional[float] = None
    negative_marks: Optional[float] = None
    question_en: Optional[str] = None
    question_ta: Optional[str] = None
    question_hi: Optional[str] = None
    question_ml: Optional[str] = None
    question_te: Optional[str] = None
    question_kn: Optional[str] = None
    model_answer: Optional[str] = None
    explanation: Optional[str] = None
    rubric: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    bank_id: Optional[int] = None
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    options: Optional[List[QuestionOptionBase]] = None

class QuestionResponse(QuestionBase):
    id: int
    created_at: datetime
    options: List[QuestionOptionResponse] = []

    model_config = ConfigDict(from_attributes=True)

class QuestionBankBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: Optional[int] = None
    is_public: bool = False

class QuestionBankCreate(QuestionBankBase):
    pass

class QuestionBankResponse(QuestionBankBase):
    id: int
    created_by_id: int
    created_at: datetime
    question_count: int = 0

    model_config = ConfigDict(from_attributes=True)

# --- Exams ---
class ExamQuestionMapping(BaseModel):
    question_id: int
    section_name: str = "General"
    order_index: int = 0
    marks_override: Optional[float] = None
    negative_marks_override: Optional[float] = None

class ExamCreate(BaseModel):
    title: str
    code: str
    description: Optional[str] = None
    subject_id: Optional[int] = None
    duration_minutes: int = 60
    total_marks: float = 100.0
    passing_marks: float = 40.0
    negative_marking: bool = False
    shuffle_questions: bool = True
    shuffle_options: bool = True
    camera_required: bool = True
    mic_required: bool = False
    face_detection_enabled: bool = True
    gaze_detection_enabled: bool = True
    multi_face_detection_enabled: bool = True
    tab_switch_detection_enabled: bool = True
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    instructions: Optional[str] = None
    status: str = "DRAFT"
    question_ids: Optional[List[int]] = []
    candidate_ids: Optional[List[int]] = []

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[float] = None
    passing_marks: Optional[float] = None
    negative_marking: Optional[bool] = None
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    camera_required: Optional[bool] = None
    mic_required: Optional[bool] = None
    face_detection_enabled: Optional[bool] = None
    gaze_detection_enabled: Optional[bool] = None
    multi_face_detection_enabled: Optional[bool] = None
    tab_switch_detection_enabled: Optional[bool] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    instructions: Optional[str] = None
    question_ids: Optional[List[int]] = None
    candidate_ids: Optional[List[int]] = None

class ExamResponse(BaseModel):
    id: int
    title: str
    code: str
    description: Optional[str] = None
    subject_id: Optional[int] = None
    created_by_id: int
    duration_minutes: int
    total_marks: float
    passing_marks: float
    negative_marking: bool
    shuffle_questions: bool = True
    shuffle_options: bool = True
    camera_required: bool
    mic_required: bool
    face_detection_enabled: bool
    gaze_detection_enabled: bool
    multi_face_detection_enabled: bool
    tab_switch_detection_enabled: bool
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: str
    instructions: Optional[str] = None
    created_at: datetime
    question_count: int = 0
    candidate_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class ExamCandidateResponse(BaseModel):
    id: int
    exam_id: int
    student_id: int
    student_name: str
    student_email: str
    assigned_at: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)

class ExamCandidateAssignRequest(BaseModel):
    student_ids: List[int]

class ExamValidateResponse(BaseModel):
    valid: bool
    issues: List[str]
    total_marks: float
    question_count: int
    passing_marks: float

class ExamAutoSelectRequest(BaseModel):
    subject_id: Optional[int] = None
    bank_id: Optional[int] = None
    total_questions: int = 20
    easy_count: int = 5
    medium_count: int = 10
    hard_count: int = 5
    question_types: Optional[List[str]] = None  # ["MCQ", "MULTI_SELECT", "SHORT_ANSWER", "LONG_ANSWER"]

class ExamDetailResponse(ExamResponse):
    questions: List[QuestionResponse] = []
    candidates: List[ExamCandidateResponse] = []

# --- Student Exam Interaction ---
class StudentQuestionItem(BaseModel):
    id: int
    order_index: int
    section_name: str
    question_type: str
    difficulty: str
    marks: float
    question_en: str
    question_ta: Optional[str] = None
    question_hi: Optional[str] = None
    question_ml: Optional[str] = None
    question_te: Optional[str] = None
    question_kn: Optional[str] = None
    options: List[Dict[str, Any]] = []
    coding_starter_code: Optional[str] = None
    coding_language: Optional[str] = None
    is_answered: bool = False
    is_flagged: bool = False
    saved_selected_options: Optional[List[str]] = None
    saved_text_answer: Optional[str] = None
    saved_code_answer: Optional[str] = None
    saved_image_url: Optional[str] = None

class ExamStartResponse(BaseModel):
    session_id: int
    exam_id: int
    exam_title: str
    duration_minutes: int
    server_time: datetime
    expires_at: datetime
    remaining_seconds: int
    total_questions: int
    questions: List[StudentQuestionItem]
    proctoring_config: Dict[str, Any]

class AnswerSaveRequest(BaseModel):
    question_id: int
    selected_options: Optional[List[str]] = None
    text_answer: Optional[str] = None
    code_answer: Optional[str] = None
    image_url: Optional[str] = None
    is_flagged: Optional[bool] = None
    time_spent_seconds: Optional[int] = 0

class AnswerResponse(BaseModel):
    id: int
    session_id: int
    question_id: int
    is_answered: bool
    is_flagged: bool
    status: str = "SAVED"

# --- Proctoring ---
class ProctorEventCreate(BaseModel):
    session_id: int
    event_type: str
    severity: Optional[str] = None
    duration_ms: Optional[int] = None
    confidence: Optional[float] = None
    face_count: Optional[int] = None
    score_delta: Optional[float] = None
    details: Optional[Dict[str, Any]] = None
    snapshot_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ProctorEventResponse(BaseModel):
    id: int
    session_id: int
    event_type: str
    severity: str
    duration_ms: Optional[int] = None
    confidence: Optional[float] = None
    face_count: Optional[int] = None
    score_delta: float
    details: Optional[Dict[str, Any]] = None
    snapshot_url: Optional[str] = None
    review_status: str
    examiner_notes: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class ProctorEventReviewRequest(BaseModel):
    review_status: str  # REVIEWED, DISMISSED, CONFIRMED
    examiner_notes: Optional[str] = None

class ProctorHeartbeatRequest(BaseModel):
    session_id: int
    face_detected: Optional[bool] = True
    multiple_faces: Optional[bool] = False
    gaze_away: Optional[bool] = False
    tab_active: Optional[bool] = True
    fullscreen: Optional[bool] = True
    current_suspicion_increment: Optional[float] = 0.0
    # Nested structured telemetry payload support
    camera: Optional[Dict[str, Any]] = None
    gaze: Optional[Dict[str, Any]] = None
    browser: Optional[Dict[str, Any]] = None
    network: Optional[Dict[str, Any]] = None
    events: Optional[List[Dict[str, Any]]] = None

class ProctorHeartbeatResponse(BaseModel):
    status: str = "OK"
    server_time: datetime
    remaining_seconds: int
    is_session_active: bool
    total_suspicion_score: float
    warning_message: Optional[str] = None

class ProctorSessionResponse(BaseModel):
    id: int
    exam_session_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    camera_status: str
    current_face_count: int
    last_face_seen_at: datetime
    last_heartbeat_at: datetime
    connection_status: str
    total_events: int
    review_status: str

    model_config = ConfigDict(from_attributes=True)

# --- AI Grading ---
class AIEvaluationRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    question: str
    student_answer: str
    model_answer: Optional[str] = None
    rubric: Optional[List[Dict[str, Any]]] = None
    marks: float = 10.0

class AIEvaluationResponse(BaseModel):
    suggested_score: float
    confidence: float
    justification: str
    matched_concepts: List[str]
    missing_concepts: List[str]
    examiner_recommendation: str

class GradingOverrideRequest(BaseModel):
    answer_id: int
    final_score: float
    examiner_feedback: Optional[str] = None
    action: str = "APPROVE"  # APPROVE, OVERRIDE

# --- Results ---
class ResultResponse(BaseModel):
    id: int
    session_id: int
    exam_id: int
    exam_title: str
    student_name: str
    total_score: float
    max_score: float
    percentage: float
    grade: str
    rank: Optional[int] = None
    percentile: Optional[float] = None
    status: str
    total_questions: int
    correct_count: int
    incorrect_count: int
    skipped_count: int
    partial_count: int
    topic_breakdown: Optional[Dict[str, Any]] = None
    difficulty_breakdown: Optional[Dict[str, Any]] = None
    published_at: datetime
    certificate_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Dashboard & Monitoring ---
class AdminAnalyticsResponse(BaseModel):
    total_students: int
    total_examiners: int
    active_exams: int
    upcoming_exams: int
    completed_exams: int
    live_sessions: int
    flagged_sessions: int
    pending_grading: int
    average_platform_score: float
    system_health: str = "OPTIMAL"
    score_distribution: List[Dict[str, Any]]
    topic_performance: List[Dict[str, Any]]
    proctoring_signals: List[Dict[str, Any]]

class LiveCandidateItem(BaseModel):
    session_id: int
    student_id: int
    candidate_name: str
    candidate_email: str
    exam_id: int
    exam_title: str
    started_at: datetime
    remaining_seconds: int
    connection_status: str
    camera_status: str
    face_detected: bool
    suspicion_score: float
    suspicion_level: str  # LOW, MEDIUM, HIGH
    recent_events: List[Dict[str, Any]]

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    link_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
