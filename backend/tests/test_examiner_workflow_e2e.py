import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db, SessionLocal
from app.models.models import User, Exam, Question, ExamSession, Answer, Result, GradingQueueItem, ExamCandidate

client = TestClient(app)

def get_auth_token(email: str, password: str = "examiner123") -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"]
    # Fallback to student password
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "student123"})
    if res.status_code == 200:
        return res.json()["access_token"]
    raise ValueError(f"Could not login user {email}: {res.text}")

def test_examiner_complete_workflow_e2e():
    """
    Complete end-to-end integration test verifying the entire examination pipeline:
    EXAMINER -> QUESTION BANK -> QUESTIONS -> CREATE EXAM -> EXAM QUESTIONS ->
    SCHEDULE -> PUBLISH -> STUDENT -> EXAM SESSION -> ANSWERS -> EVALUATION -> RESULTS
    """
    examiner_token = get_auth_token("examiner@example.com", "examiner123")
    student_token = get_auth_token("student@example.com", "student123")

    examiner_headers = {"Authorization": f"Bearer {examiner_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # -------------------------------------------------------------
    # 1. SECURITY & RBAC TESTS
    # -------------------------------------------------------------
    # Student MUST NOT be able to create questions
    res = client.post("/api/v1/questions", headers=student_headers, json={
        "question_en": "Hacked question",
        "question_type": "MCQ",
        "marks": 2.0
    })
    assert res.status_code == 403, f"Expected 403 for student question creation, got {res.status_code}"

    # Student MUST NOT be able to create exams
    res = client.post("/api/v1/exams", headers=student_headers, json={
        "title": "Hacked exam",
        "code": "HACK-01"
    })
    assert res.status_code == 403, f"Expected 403 for student exam creation, got {res.status_code}"

    # -------------------------------------------------------------
    # 2. CREATE QUESTION BANK
    # -------------------------------------------------------------
    bank_title = f"Full Stack Development Suite {uuid.uuid4().hex[:6]}"
    res = client.post("/api/v1/questions/banks", headers=examiner_headers, json={
        "title": bank_title,
        "description": "Comprehensive full-stack engineering question bank",
        "subject_id": 1,
        "is_public": True
    })
    assert res.status_code == 200
    bank_data = res.json()
    bank_id = bank_data["id"]
    assert bank_data["title"] == bank_title

    # -------------------------------------------------------------
    # 3. QUESTION VALIDATION TESTS
    # -------------------------------------------------------------
    # Invalid MCQ with no correct answer
    res = client.post("/api/v1/questions", headers=examiner_headers, json={
        "bank_id": bank_id,
        "subject_id": 1,
        "question_type": "MCQ",
        "marks": 2.0,
        "question_en": "Which sorting algorithm has O(n log n) average time complexity?",
        "options": [
            {"option_key": "A", "text_en": "Bubble Sort", "is_correct": False},
            {"option_key": "B", "text_en": "Merge Sort", "is_correct": False}
        ]
    })
    assert res.status_code == 400
    assert "MCQ must have exactly 1 correct option" in res.json()["detail"]

    # Valid MCQ
    res = client.post("/api/v1/questions", headers=examiner_headers, json={
        "bank_id": bank_id,
        "subject_id": 1,
        "question_type": "MCQ",
        "difficulty": "MEDIUM",
        "marks": 2.0,
        "negative_marks": 0.5,
        "question_en": "What is the average time complexity of QuickSort?",
        "question_ta": "QuickSort-இன் சராசரி நேர சிக்கல்தன்மை என்ன?",
        "options": [
            {"option_key": "A", "text_en": "O(n^2)", "is_correct": False},
            {"option_key": "B", "text_en": "O(n log n)", "is_correct": True},
            {"option_key": "C", "text_en": "O(n)", "is_correct": False},
            {"option_key": "D", "text_en": "O(1)", "is_correct": False}
        ]
    })
    assert res.status_code == 200
    mcq_q = res.json()
    mcq_id = mcq_q["id"]

    # Valid Multi-Select
    res = client.post("/api/v1/questions", headers=examiner_headers, json={
        "bank_id": bank_id,
        "subject_id": 1,
        "question_type": "MULTI_SELECT",
        "difficulty": "HARD",
        "marks": 4.0,
        "negative_marks": 1.0,
        "question_en": "Which of the following are ACID properties in relational database systems?",
        "options": [
            {"option_key": "A", "text_en": "Atomicity", "is_correct": True},
            {"option_key": "B", "text_en": "Consistency", "is_correct": True},
            {"option_key": "C", "text_en": "Availability", "is_correct": False},
            {"option_key": "D", "text_en": "Durability", "is_correct": True}
        ]
    })
    assert res.status_code == 200
    ms_q = res.json()
    ms_id = ms_q["id"]

    # Valid Short Answer
    res = client.post("/api/v1/questions", headers=examiner_headers, json={
        "bank_id": bank_id,
        "subject_id": 1,
        "question_type": "SHORT_ANSWER",
        "difficulty": "EASY",
        "marks": 3.0,
        "question_en": "What is Database Normalization?",
        "model_answer": "Normalization is the process of organizing database tables to reduce data redundancy and enhance data integrity.",
        "tags": ["dbms", "sql", "normalization"]
    })
    assert res.status_code == 200
    short_q = res.json()
    short_id = short_q["id"]

    # Valid Long Answer with Rubric
    res = client.post("/api/v1/questions", headers=examiner_headers, json={
        "bank_id": bank_id,
        "subject_id": 1,
        "question_type": "LONG_ANSWER",
        "difficulty": "MEDIUM",
        "marks": 5.0,
        "question_en": "Explain the architectural differences between Monolithic and Microservices design patterns.",
        "model_answer": "Monoliths package all business components in a unified process with a single database, offering simplicity but tight coupling. Microservices separate domain capabilities into independently deployable services communicating via network APIs.",
        "rubric": [
            {"criteria": "Monolith Architecture Characteristics", "marks": 2.0},
            {"criteria": "Microservices Decoupling & Scalability", "marks": 2.0},
            {"criteria": "Tradeoffs & Operational Complexity", "marks": 1.0}
        ]
    })
    assert res.status_code == 200
    long_q = res.json()
    long_id = long_q["id"]

    # Question Duplicate
    res = client.post(f"/api/v1/questions/{mcq_id}/duplicate", headers=examiner_headers)
    assert res.status_code == 200
    dup_q = res.json()
    assert dup_q["id"] != mcq_id
    assert "(Copy)" in dup_q["question_en"]

    # -------------------------------------------------------------
    # 4. EXAM CREATION & PRE-PUBLISH VALIDATION
    # -------------------------------------------------------------
    test_exam_code = f"E2E-{uuid.uuid4().hex[:6].upper()}"

    # Fetch real students list
    students_res = client.get("/api/v1/examiner/students", headers=examiner_headers)
    assert students_res.status_code == 200
    all_students = students_res.json()
    student_obj = next(s for s in all_students if s["email"] == "student@example.com")
    student_id = student_obj["id"]

    # Create Draft Exam
    res = client.post("/api/v1/exams", headers=examiner_headers, json={
        "title": "E2E Assessment Examination",
        "code": test_exam_code,
        "description": "Full end-to-end evaluation assessment",
        "subject_id": 1,
        "duration_minutes": 30,
        "total_marks": 14.0,
        "passing_marks": 6.0,
        "negative_marking": True,
        "shuffle_questions": True,
        "shuffle_options": True,
        "camera_required": True,
        "face_detection_enabled": True,
        "gaze_detection_enabled": True,
        "multi_face_detection_enabled": True,
        "tab_switch_detection_enabled": True,
        "question_ids": [mcq_id, ms_id, short_id, long_id],
        "candidate_student_ids": [student_id],
        "status": "DRAFT"
    })
    assert res.status_code == 200
    exam_data = res.json()
    exam_id = exam_data["id"]
    assert exam_data["status"] == "DRAFT"
    assert exam_data["question_count"] == 4

    # Pre-Publish Validation on Draft Exam
    res = client.post(f"/api/v1/exams/{exam_id}/validate", headers=examiner_headers)
    assert res.status_code == 200
    val_data = res.json()
    assert val_data["valid"] is True, f"Validation issues: {val_data['issues']}"

    # Student MUST NOT see DRAFT exam
    res = client.get("/api/v1/student/exams", headers=student_headers)
    assert res.status_code == 200
    student_exams = res.json()
    assert not any(e["id"] == exam_id for e in student_exams), "Student should NOT see DRAFT exams!"

    # -------------------------------------------------------------
    # 5. PUBLISH EXAM
    # -------------------------------------------------------------
    res = client.post(f"/api/v1/exams/{exam_id}/publish", headers=examiner_headers)
    assert res.status_code == 200
    pub_data = res.json()
    assert pub_data["status"] in ["PUBLISHED", "ACTIVE", "SCHEDULED"]

    # Now Student MUST see the published assigned exam!
    res = client.get("/api/v1/student/exams", headers=student_headers)
    assert res.status_code == 200
    student_exams = res.json()
    assigned_exam = next((e for e in student_exams if e["id"] == exam_id), None)
    assert assigned_exam is not None, "Published exam must be visible to assigned student!"

    # -------------------------------------------------------------
    # 6. STUDENT STARTS EXAM (RANDOMIZED PAPER GENERATION)
    # -------------------------------------------------------------
    res = client.post(f"/api/v1/exam-sessions/start/{exam_id}", headers=student_headers)
    assert res.status_code == 200
    session_data = res.json()
    session_id = session_data["session_id"]
    assert session_data["exam_id"] == exam_id
    assert "remaining_seconds" in session_data

    # Verify session questions (correct answers must NOT be leaked to student!)
    session_questions = session_data["questions"]
    assert len(session_questions) == 4
    for sq in session_questions:
        assert "model_answer" not in sq or sq["model_answer"] is None
        assert "rubric" not in sq or sq["rubric"] is None
        for opt in sq.get("options", []):
            assert "is_correct" not in opt or opt["is_correct"] is None

    # -------------------------------------------------------------
    # 7. INCREMENTAL ANSWER SUBMISSION
    # -------------------------------------------------------------
    # Answer MCQ correctly (Option B)
    res = client.post(f"/api/v1/exam-sessions/{session_id}/answer", headers=student_headers, json={
        "question_id": mcq_id,
        "selected_options": ["B"]
    })
    assert res.status_code == 200

    # Answer Multi-Select partially/correctly (Options A, B, D)
    res = client.post(f"/api/v1/exam-sessions/{session_id}/answer", headers=student_headers, json={
        "question_id": ms_id,
        "selected_options": ["A", "B", "D"]
    })
    assert res.status_code == 200

    # Answer Short Answer (Subjective)
    res = client.post(f"/api/v1/exam-sessions/{session_id}/answer", headers=student_headers, json={
        "question_id": short_id,
        "text_answer": "Normalization is the systematic approach to organizing tables to eliminate data redundancy and preserve integrity."
    })
    assert res.status_code == 200

    # Answer Long Answer (Subjective)
    res = client.post(f"/api/v1/exam-sessions/{session_id}/answer", headers=student_headers, json={
        "question_id": long_id,
        "text_answer": "In a monolithic architecture, the entire application runs as a single unified service sharing one database. In contrast, microservices break the domain into independent, loosely coupled services communicating via HTTP or message queues, enabling autonomous scaling and deployment."
    })
    assert res.status_code == 200

    # -------------------------------------------------------------
    # 8. EXAM SUBMISSION & OBJECTIVE AUTO-EVALUATION
    # -------------------------------------------------------------
    res = client.post(f"/api/v1/exam-sessions/{session_id}/submit", headers=student_headers)
    assert res.status_code == 200
    submit_result = res.json()
    assert submit_result["status"] in ["SUCCESS", "SUBMITTED", "PENDING_GRADING", "PUBLISHED"]
    assert submit_result["total_score"] >= 6.0 # MCQ (2.0) + Multi-Select (4.0) = 6.0 awarded immediately

    # -------------------------------------------------------------
    # 9. EXAMINER AI GRADING QUEUE & SCORE OVERRIDE
    # -------------------------------------------------------------
    res = client.get("/api/v1/grading/queue", headers=examiner_headers)
    assert res.status_code == 200
    queue = res.json()
    exam_queue_items = [q for q in queue if q["exam_id"] == exam_id and q["session_id"] == session_id]
    assert len(exam_queue_items) >= 1, "Subjective answers must appear in examiner grading queue!"

    # Examiner approves or overrides the first subjective question
    first_item = exam_queue_items[0]
    res = client.post("/api/v1/grading/finalize-score", headers=examiner_headers, json={
        "answer_id": first_item["answer_id"],
        "final_score": first_item["max_marks"], # award full marks
        "examiner_feedback": "Excellent conceptual clarity and precision.",
        "action": "APPROVE"
    })
    assert res.status_code == 200

    # -------------------------------------------------------------
    # 10. PUBLISH FINAL RESULTS & STUDENT VERIFICATION
    # -------------------------------------------------------------
    res = client.post(f"/api/v1/exams/{exam_id}/publish-results", headers=examiner_headers)
    assert res.status_code == 200

    # Student views final results
    res = client.get(f"/api/v1/student/results/{session_id}", headers=student_headers)
    assert res.status_code == 200
    final_res = res.json()
    assert final_res["total_score"] >= 6.0
    assert final_res["is_passed"] is True
    assert final_res["status"] == "PUBLISHED"

    print("\n[SUCCESS] COMPLETE E2E WORKFLOW TEST PASSED SUCCESSFULLY!")
