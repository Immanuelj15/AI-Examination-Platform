import sys
import os
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.models import (
    User, Organization, Subject, Topic, QuestionBank, Question, QuestionOption,
    Exam, ExamQuestion, ExamCandidate, ExamSession, Answer, Result, ProctorEvent, GradingQueueItem,
    Notification, Certificate, AuditLog, ProctorSession
)

def run_seed():
    print("[INIT] Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing if any for idempotence
    print("[CLEAN] Cleaning previous records...")
    db.query(AuditLog).delete()
    db.query(Certificate).delete()
    db.query(GradingQueueItem).delete()
    db.query(ProctorEvent).delete()
    db.query(ProctorSession).delete()
    db.query(Result).delete()
    db.query(Answer).delete()
    db.query(ExamSession).delete()
    db.query(ExamCandidate).delete()
    db.query(ExamQuestion).delete()
    db.query(Exam).delete()
    db.query(QuestionOption).delete()
    db.query(Question).delete()
    db.query(QuestionBank).delete()
    db.query(Topic).delete()
    db.query(Subject).delete()
    db.query(Notification).delete()
    db.query(User).delete()
    db.query(Organization).delete()
    db.commit()

    print("[ORG] Creating Organizations...")
    org1 = Organization(
        name="Apex Institute of Technology",
        code="APEX-TECH",
        domain="apextech.edu",
        logo_url="https://images.unsplash.com/photo-1562774053-701939374585?w=100&auto=format&fit=crop&q=80"
    )
    org2 = Organization(
        name="Cognitive Cloud Systems Inc",
        code="COG-CLOUD",
        domain="cognitivesys.io",
        logo_url="https://images.unsplash.com/photo-1542744094-3a31f272c490?w=100&auto=format&fit=crop&q=80"
    )
    db.add_all([org1, org2])
    db.commit()

    print("[USERS] Creating Users (Admin, Examiners, Students)...")
    hashed_pwd = get_password_hash("password123")

    admin = User(
        email="admin@example.com",
        hashed_password=get_password_hash("admin123"),
        full_name="Dr. Alexander Wright",
        role="ADMIN",
        organization_id=org1.id,
        phone="+1 555-0199"
    )
    examiner1 = User(
        email="examiner@example.com",
        hashed_password=get_password_hash("examiner123"),
        full_name="Prof. Sarah Jenkins",
        role="EXAMINER",
        organization_id=org1.id,
        phone="+1 555-0144"
    )
    examiner2 = User(
        email="rajesh.examiner@example.com",
        hashed_password=hashed_pwd,
        full_name="Dr. Rajesh Raman",
        role="EXAMINER",
        organization_id=org1.id,
        phone="+91 98401 23456"
    )
    examiner3 = User(
        email="clara.examiner@example.com",
        hashed_password=hashed_pwd,
        full_name="Clara Oswald",
        role="EXAMINER",
        organization_id=org2.id,
        phone="+1 555-0182"
    )

    primary_student = User(
        email="student@example.com",
        hashed_password=get_password_hash("student123"),
        full_name="Karthik Narayan",
        role="STUDENT",
        organization_id=org1.id,
        phone="+91 98765 43210"
    )

    other_students = [
        User(email="arun.k@example.com", hashed_password=hashed_pwd, full_name="Arun Kumar", role="STUDENT", organization_id=org1.id),
        User(email="priya.s@example.com", hashed_password=hashed_pwd, full_name="Priya Sundaram", role="STUDENT", organization_id=org1.id),
        User(email="rahul.m@example.com", hashed_password=hashed_pwd, full_name="Rahul Menon", role="STUDENT", organization_id=org1.id),
        User(email="ananya.sharma@example.com", hashed_password=hashed_pwd, full_name="Ananya Sharma", role="STUDENT", organization_id=org1.id),
        User(email="vikram.aditya@example.com", hashed_password=hashed_pwd, full_name="Vikram Aditya", role="STUDENT", organization_id=org1.id),
        User(email="sneha.reddy@example.com", hashed_password=hashed_pwd, full_name="Sneha Reddy", role="STUDENT", organization_id=org1.id),
        User(email="david.chen@example.com", hashed_password=hashed_pwd, full_name="David Chen", role="STUDENT", organization_id=org2.id),
        User(email="sophia.martinez@example.com", hashed_password=hashed_pwd, full_name="Sophia Martinez", role="STUDENT", organization_id=org2.id),
        User(email="tanvi.patel@example.com", hashed_password=hashed_pwd, full_name="Tanvi Patel", role="STUDENT", organization_id=org1.id)
    ]

    db.add_all([admin, examiner1, examiner2, examiner3, primary_student] + other_students)
    db.commit()

    print("[SUBJECTS] Creating Subjects and Topics...")
    sub_cs = Subject(name="Computer Science & Engineering", code="CS101", description="Core computational and engineering foundations")
    sub_fs = Subject(name="Full Stack Web Engineering", code="FS201", description="Modern frontend, backend, and cloud architectures")
    sub_apt = Subject(name="Quantitative & Logical Reasoning", code="APT301", description="Aptitude and problem-solving benchmarks")
    db.add_all([sub_cs, sub_fs, sub_apt])
    db.commit()

    t_dsa = Topic(subject_id=sub_cs.id, name="Data Structures & Algorithms", description="Arrays, Trees, Graphs, Complexity")
    t_dbms = Topic(subject_id=sub_cs.id, name="Database Management Systems", description="SQL, Indexing, ACID, Normalization")
    t_java = Topic(subject_id=sub_cs.id, name="Java & OOPs", description="JVM internals, concurrency, inheritance, generics")
    t_react = Topic(subject_id=sub_fs.id, name="React & State Architecture", description="Hooks, virtual DOM, performance, concurrency")
    t_node = Topic(subject_id=sub_fs.id, name="Node.js & Backend Services", description="Event loop, streams, REST API, authentication")
    t_apt = Topic(subject_id=sub_apt.id, name="Analytical Aptitude", description="Combinatorics, probability, sequences, logic")
    db.add_all([t_dsa, t_dbms, t_java, t_react, t_node, t_apt])
    db.commit()

    print("[BANKS] Creating Question Banks...")
    qbank = QuestionBank(
        title="Enterprise Full-Stack & Engineering Question Repository",
        description="Comprehensive repository with multilingual translations and rubrics for technical assessments.",
        subject_id=sub_fs.id,
        organization_id=org1.id,
        created_by_id=examiner1.id,
        is_public=True
    )
    db.add(qbank)
    db.commit()

    print("[QUESTIONS] Creating Questions (MCQ, Multi-Select, Short Answer, Long Answer, Coding, Image)...")
    questions_list = []

    # 1. DSA MCQ
    q1 = Question(
        bank_id=qbank.id, subject_id=sub_cs.id, topic_id=t_dsa.id,
        question_type="MCQ", difficulty="MEDIUM", marks=4.0, negative_marks=1.0,
        question_en="What is the worst-case time complexity of searching for an element in a Balanced Binary Search Tree (AVL Tree) containing N elements?",
        question_ta="N கூறுகளைக் கொண்ட சமநிலையான பைனரி தேடல் மரத்தில் (AVL Tree) ஒரு கூறினைத் தேடுவதற்கான மிக மோசமான நேர சிக்கல் என்ன?",
        question_hi="N तत्वों वाले संतुलित बाइनरी सर्च ट्री (AVL ट्री) में किसी तत्व को खोजने की सबसे खराब समय जटिलता (worst-case time complexity) क्या है?",
        question_ml="N ഘടകങ്ങൾ അടങ്ങിയ സന്തുലിതമായ ബൈനറി സെർച്ച് ട്രീയിൽ ഒരു ഘടകം തിരയുന്നതിനുള്ള ഏറ്റവും മോശമായ സമയ സങ്കീർണ്ണത എന്താണ്?",
        explanation="In a balanced binary search tree like AVL or Red-Black tree, the height is guaranteed to be O(log N). Thus, lookup is bounded by O(log N) in the worst case."
    )
    db.add(q1)
    db.flush()
    db.add_all([
        QuestionOption(question_id=q1.id, option_key="A", text_en="O(1)", is_correct=False),
        QuestionOption(question_id=q1.id, option_key="B", text_en="O(log N)", text_ta="O(log N)", is_correct=True),
        QuestionOption(question_id=q1.id, option_key="C", text_en="O(N)", is_correct=False),
        QuestionOption(question_id=q1.id, option_key="D", text_en="O(N log N)", is_correct=False)
    ])
    questions_list.append(q1)

    # 2. React Multi-Select
    q2 = Question(
        bank_id=qbank.id, subject_id=sub_fs.id, topic_id=t_react.id,
        question_type="MULTI_SELECT", difficulty="MEDIUM", marks=4.0, negative_marks=0.0,
        question_en="Which of the following statements about React Hooks are true? (Select all that apply)",
        question_ta="React ஹூக்குகள் (Hooks) பற்றிய பின்வரும் அறிக்கைகளில் எவை சரியானவை? (பொருந்தும் அனைத்தையும் தேர்ந்தெடுக்கவும்)",
        question_hi="रिएक्ट हुक्स (React Hooks) के बारे में निम्नलिखित में से कौन से कथन सत्य हैं?",
        explanation="Hooks cannot be called inside loops/conditions, and must always be invoked at the top level of React function components or custom hooks."
    )
    db.add(q2)
    db.flush()
    db.add_all([
        QuestionOption(question_id=q2.id, option_key="A", text_en="Hooks can only be called at the top level of React functions.", is_correct=True),
        QuestionOption(question_id=q2.id, option_key="B", text_en="useEffect runs synchronously before DOM mutations occur.", is_correct=False),
        QuestionOption(question_id=q2.id, option_key="C", text_en="useMemo memoizes computed values to avoid expensive re-calculations on every render.", is_correct=True),
        QuestionOption(question_id=q2.id, option_key="D", text_en="Hooks can be conditionally called inside regular for-loops.", is_correct=False)
    ])
    questions_list.append(q2)

    # 3. DBMS Short Answer
    q3 = Question(
        bank_id=qbank.id, subject_id=sub_cs.id, topic_id=t_dbms.id,
        question_type="SHORT_ANSWER", difficulty="MEDIUM", marks=6.0, negative_marks=0.0,
        question_en="Explain the ACID properties in database transaction management and give a brief real-world example.",
        question_ta="தரவுத்தள பரிவர்த்தனை நிர்வாகத்தில் ACID பண்புகளை விளக்கி, ஒரு நிஜ உலக உதாரணத்தை விவரிக்கவும்.",
        question_hi="डेटाबेस लेनदेन प्रबंधन में ACID गुणों की व्याख्या करें और एक संक्षिप्त वास्तविक दुनिया का उदाहरण दें।",
        model_answer="ACID stands for Atomicity (all or nothing execution), Consistency (maintains integrity constraints), Isolation (concurrent transactions execute independently without cross-interference), and Durability (committed changes persist even upon system crash). Example: Bank money transfer where debit from account A and credit to account B must atomically succeed together.",
        rubric=[
            {"criterion": "Atomicity explanation", "keywords": ["atomicity", "all or nothing", "rollback"], "weight": 1.5},
            {"criterion": "Consistency & Isolation", "keywords": ["consistency", "isolation", "integrity", "concurrent"], "weight": 1.5},
            {"criterion": "Durability explanation", "keywords": ["durability", "persist", "committed", "crash"], "weight": 1.5},
            {"criterion": "Real world scenario", "keywords": ["bank", "transfer", "transaction", "account", "credit", "debit"], "weight": 1.5}
        ]
    )
    db.add(q3)
    questions_list.append(q3)

    # 4. Java Long Answer / Architectural Question
    q4 = Question(
        bank_id=qbank.id, subject_id=sub_cs.id, topic_id=t_java.id,
        question_type="LONG_ANSWER", difficulty="HARD", marks=10.0, negative_marks=0.0,
        question_en="Describe the Java Memory Model (JVM Heap, Stack, Metaspace) and elucidate how Garbage Collection algorithms (such as G1GC) minimize stop-the-world pauses.",
        question_ta="ஜாவா நினைவக மாதிரியை (JVM Heap, Stack, Metaspace) விவரித்து, Garbage Collection வழிமுறைகள் (G1GC போன்றவை) எவ்வாறு இடைநிறுத்தங்களைக் குறைக்கின்றன என்பதை விளக்குக.",
        question_hi="जावा मेमोरी मॉडल (JVM हीप, स्टैक, मेटास्पेस) का वर्णन करें और स्पष्ट करें कि कचरा संग्रहण एल्गोरिदम स्टॉप-द-वर्ल्ड पॉज़ को कैसे कम करते हैं।",
        model_answer="JVM memory is partitioned into: Stack (thread-specific frames, local variables, method call lifecycle), Heap (shared objects, Young Generation: Eden & Survivor spaces, Old Generation), and Metaspace (class metadata, method definitions outside JVM heap in native memory). Garbage collection algorithms like G1GC divide the heap into uniform contiguous memory regions. It concurrently predicts pause times, marks live objects concurrently, and performs compaction on regions with the highest density of reclaimable garbage (Garbage-First) to prevent prolonged Stop-The-World (STW) pauses.",
        rubric=[
            {"criterion": "Heap vs Stack vs Metaspace", "keywords": ["heap", "stack", "metaspace", "thread", "young generation", "old generation"], "weight": 3.0},
            {"criterion": "Generational memory hypothesis", "keywords": ["eden", "survivor", "tenured", "lifespan"], "weight": 2.5},
            {"criterion": "G1GC Region partitioning", "keywords": ["g1gc", "regions", "garbage-first", "concurrent"], "weight": 2.5},
            {"criterion": "Minimizing Stop-The-World pauses", "keywords": ["stop the world", "pause", "latency", "compaction"], "weight": 2.0}
        ]
    )
    db.add(q4)
    questions_list.append(q4)

    # 5. Coding Question
    q5 = Question(
        bank_id=qbank.id, subject_id=sub_fs.id, topic_id=t_dsa.id,
        question_type="CODING", difficulty="MEDIUM", marks=10.0, negative_marks=0.0,
        question_en="Implement an optimal function `twoSum(nums, target)` that returns the 0-based indices of two numbers such that they add up to the specific target. Assume exactly one solution exists and each element cannot be used twice.",
        question_ta="இரண்டு எண்களின் கூடுதல் குறிப்பிட்ட இலக்குக்கு (target) சமமாக இருக்கும் வகையில் அவற்றின் குறியீடுகளை (indices) திருப்பியளிக்கும் `twoSum(nums, target)` செயல்பாட்டை செயல்படுத்தவும்.",
        question_hi="एक इष्टतम फ़ंक्शन `twoSum(nums, target)` लागू करें जो दो संख्याओं के सूचकांक देता है ताकि वे दिए गए लक्ष्य तक जुड़ सकें।",
        coding_language="javascript",
        coding_starter_code="function twoSum(nums, target) {\n    // Write your optimal O(N) solution using a Hash Map\n    const map = new Map();\n    \n    // TODO: implement\n    return [];\n}",
        model_answer="function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}",
        coding_test_cases=[
            {"input": "nums = [2,7,11,15], target = 9", "expected_output": "[0,1]", "is_hidden": False},
            {"input": "nums = [3,2,4], target = 6", "expected_output": "[1,2]", "is_hidden": False},
            {"input": "nums = [3,3], target = 6", "expected_output": "[0,1]", "is_hidden": True}
        ]
    )
    db.add(q5)
    questions_list.append(q5)

    # 6. SQL / DBMS MCQ
    q6 = Question(
        bank_id=qbank.id, subject_id=sub_cs.id, topic_id=t_dbms.id,
        question_type="MCQ", difficulty="EASY", marks=3.0, negative_marks=1.0,
        question_en="Which SQL clause is used to filter groups of records resulting from a GROUP BY statement?",
        question_ta="GROUP BY அறிக்கையின் விளைவாக வரும் பதிவுகளின் குழுக்களை வடிகட்ட எந்த SQL பிரிவு பயன்படுத்தப்படுகிறது?",
        question_hi="GROUP BY विवरण से उत्पन्न रिकॉर्ड के समूहों को फ़िल्टर करने के लिए किस SQL क्लॉज का उपयोग किया जाता है?",
        explanation="HAVING filters aggregated groups, whereas WHERE filters individual rows before grouping."
    )
    db.add(q6)
    db.flush()
    db.add_all([
        QuestionOption(question_id=q6.id, option_key="A", text_en="WHERE", is_correct=False),
        QuestionOption(question_id=q6.id, option_key="B", text_en="HAVING", is_correct=True),
        QuestionOption(question_id=q6.id, option_key="C", text_en="ORDER BY", is_correct=False),
        QuestionOption(question_id=q6.id, option_key="D", text_en="FILTER", is_correct=False)
    ])
    questions_list.append(q6)

    # 7. Node.js MCQ
    q7 = Question(
        bank_id=qbank.id, subject_id=sub_fs.id, topic_id=t_node.id,
        question_type="MCQ", difficulty="MEDIUM", marks=4.0, negative_marks=1.0,
        question_en="In the Node.js event loop, in which phase are callbacks scheduled via `process.nextTick()` executed?",
        question_ta="Node.js நிகழ்வு வளையத்தில் (event loop), `process.nextTick()` மூலம் திட்டமிடப்பட்ட செயல்பாடுகள் எந்த கட்டத்தில் இயக்கப்படுகின்றன?",
        explanation="process.nextTick callbacks are processed immediately after the current operation finishes, before the event loop advances to the next phase."
    )
    db.add(q7)
    db.flush()
    db.add_all([
        QuestionOption(question_id=q7.id, option_key="A", text_en="In the Poll phase alongside I/O callbacks", is_correct=False),
        QuestionOption(question_id=q7.id, option_key="B", text_en="In the Check phase along with setImmediate()", is_correct=False),
        QuestionOption(question_id=q7.id, option_key="C", text_en="Immediately after the current operation completes, before the event loop continues", is_correct=True),
        QuestionOption(question_id=q7.id, option_key="D", text_en="In the Close callbacks phase", is_correct=False)
    ])
    questions_list.append(q7)

    # 8. Aptitude MCQ
    q8 = Question(
        bank_id=qbank.id, subject_id=sub_apt.id, topic_id=t_apt.id,
        question_type="MCQ", difficulty="EASY", marks=3.0, negative_marks=0.5,
        question_en="A train traveling at 72 km/h crosses a 200m long platform in 22 seconds. What is the length of the train?",
        question_ta="மணிக்கு 72 கி.மீ வேகத்தில் செல்லும் ஒரு ரயில் 200 மீ நீளமுள்ள நடைமேடையை 22 வினாடிகளில் கடக்கிறது. ரயிலின் நீளம் என்ன?",
        explanation="Speed = 72 * (5/18) = 20 m/s. Total distance = speed * time = 20 * 22 = 440m. Train length = 440 - 200 = 240m."
    )
    db.add(q8)
    db.flush()
    db.add_all([
        QuestionOption(question_id=q8.id, option_key="A", text_en="220 meters", is_correct=False),
        QuestionOption(question_id=q8.id, option_key="B", text_en="240 meters", is_correct=True),
        QuestionOption(question_id=q8.id, option_key="C", text_en="260 meters", is_correct=False),
        QuestionOption(question_id=q8.id, option_key="D", text_en="280 meters", is_correct=False)
    ])
    questions_list.append(q8)

    # 9. Handwritten / Diagram Image Upload Question
    q9 = Question(
        bank_id=qbank.id, subject_id=sub_fs.id, topic_id=t_node.id,
        question_type="IMAGE_UPLOAD", difficulty="HARD", marks=8.0, negative_marks=0.0,
        question_en="Draw and upload an architectural diagram showing the high-level architecture of a microservices backend with an API Gateway, Redis Cache, Kafka Message Broker, and Auth Service.",
        question_ta="API Gateway, Redis Cache, Kafka Message Broker மற்றும் Auth Service கொண்ட மைக்ரோசர்வீசஸ் கட்டமைப்பின் விளக்கப்படத்தை வரைந்து பதிவேற்றவும்.",
        model_answer="Diagram must display: 1) Client requests entering through API Gateway, 2) Token validation with Auth Service, 3) Redis caching layer for read endpoints, 4) Asynchronous event publishing to Kafka broker for downstream event-driven services.",
        rubric=[
            {"criterion": "API Gateway and Auth integration", "keywords": ["gateway", "auth", "jwt", "reverse proxy"], "weight": 2.5},
            {"criterion": "Cache tier placement", "keywords": ["redis", "cache", "memory", "latency"], "weight": 2.5},
            {"criterion": "Message broker asynchronous queue", "keywords": ["kafka", "events", "broker", "producer", "consumer"], "weight": 3.0}
        ]
    )
    db.add(q9)
    questions_list.append(q9)

    db.commit()

    print("[EXAMS] Creating Main Demo Exam: 'Full Stack Developer Assessment'...")
    now = datetime.now(timezone.utc)
    exam_demo = Exam(
        title="Full Stack Developer Assessment",
        code="FS-DEV-2026",
        description="Comprehensive technical evaluation covering Java, DSA, DBMS, React, Node.js, and Analytical Aptitude.",
        subject_id=sub_fs.id,
        organization_id=org1.id,
        created_by_id=examiner1.id,
        duration_minutes=60,
        total_marks=52.0,
        passing_marks=25.0,
        negative_marking=True,
        shuffle_questions=False,
        shuffle_options=False,
        camera_required=True,
        mic_required=False,
        face_detection_enabled=True,
        gaze_detection_enabled=True,
        multi_face_detection_enabled=True,
        tab_switch_detection_enabled=True,
        start_time=now - timedelta(days=1),
        end_time=now + timedelta(days=30),
        status="ACTIVE",
        instructions="• Ensure your webcam remains connected and properly positioned.\n• Do not switch browser tabs or exit fullscreen.\n• Timer is authoritative from server and auto-submits upon completion.\n• Use rough sheet for calculations if needed; keep your face facing the monitor."
    )
    db.add(exam_demo)
    db.commit()

    # Link questions to exam
    for i, q in enumerate(questions_list):
        section_name = "DSA & Java" if q.topic_id in [t_dsa.id, t_java.id] else (
            "Web Stack" if q.topic_id in [t_react.id, t_node.id] else (
                "Databases" if q.topic_id == t_dbms.id else "Aptitude"
            )
        )
        eq = ExamQuestion(
            exam_id=exam_demo.id,
            question_id=q.id,
            section_name=section_name,
            order_index=i + 1
        )
        db.add(eq)
    db.commit()

    # Assign primary student as candidate
    db.add(ExamCandidate(exam_id=exam_demo.id, student_id=primary_student.id, status="ASSIGNED"))
    db.commit()

    # Additional Exams for variety in dashboard
    exam2 = Exam(
        title="Cloud Architecture & Microservices Certification",
        code="CLOUD-ARCH-301",
        description="Deep dive on Docker, Kubernetes, AWS, microservices resilience patterns, and distributed transactions.",
        subject_id=sub_fs.id,
        organization_id=org1.id,
        created_by_id=examiner1.id,
        duration_minutes=45,
        total_marks=50.0,
        passing_marks=25.0,
        negative_marking=True,
        camera_required=True,
        status="PUBLISHED",
        start_time=now + timedelta(days=2),
        end_time=now + timedelta(days=10)
    )
    exam3 = Exam(
        title="Enterprise Data Structures & Algorithms Benchmark",
        code="DSA-BENCH-101",
        description="Coding benchmark exam evaluating asymptotic complexity, recursion, dynamic programming, and graphs.",
        subject_id=sub_cs.id,
        organization_id=org2.id,
        created_by_id=examiner2.id,
        duration_minutes=90,
        total_marks=100.0,
        passing_marks=50.0,
        camera_required=True,
        status="PUBLISHED",
        start_time=now + timedelta(days=5),
        end_time=now + timedelta(days=15)
    )
    db.add_all([exam2, exam3])
    db.commit()

    print("[SESSIONS] Creating Realistic Candidate Sessions, Answers, AI Evaluations & Results...")
    # 1. Primary student completed submission
    session_primary = ExamSession(
        exam_id=exam_demo.id,
        student_id=primary_student.id,
        start_time=now - timedelta(hours=3),
        end_time=now - timedelta(hours=2),
        submitted_at=now - timedelta(hours=2),
        status="SUBMITTED",
        suspicion_score=8.0,
        is_flagged=False
    )
    db.add(session_primary)
    db.commit()

    # Answers for primary student
    ans_p1 = Answer(session_id=session_primary.id, question_id=q1.id, selected_options=["B"], is_answered=True, is_correct=True, marks_awarded=4.0, is_graded=True)
    ans_p2 = Answer(session_id=session_primary.id, question_id=q2.id, selected_options=["A", "C"], is_answered=True, is_correct=True, marks_awarded=4.0, is_graded=True)
    ans_p3 = Answer(
        session_id=session_primary.id, question_id=q3.id,
        text_answer="ACID properties guarantee reliable database transactions. Atomicity ensures all operations succeed or all rollback. Consistency ensures integrity constraints like unique balances hold. Isolation ensures concurrent transactions don't dirty-read each other. Durability guarantees committed transactions survive power outages. Example is bank account fund transfers.",
        is_answered=True,
        ai_suggested_score=5.5,
        ai_confidence=0.92,
        ai_justification="Strong answer accurately describing all 4 ACID facets with good real world banking scenario.",
        ai_matched_concepts=["Atomicity explanation", "Consistency & Isolation", "Durability explanation", "Real world scenario"],
        ai_missing_concepts=[],
        marks_awarded=5.5,
        is_graded=True,
        graded_by_id=examiner1.id
    )
    ans_p4 = Answer(
        session_id=session_primary.id, question_id=q4.id,
        text_answer="JVM divides memory into heap and stack. Stack holds method activation frames while Heap holds runtime instances partitioned into Eden, Survivor 0/1 and Old generation. G1GC divides memory into regions and executes concurrent garbage collection focusing on regions with maximum dead objects to minimize stop the world latency.",
        is_answered=True,
        ai_suggested_score=8.5,
        ai_confidence=0.89,
        ai_justification="Excellent technical depth explaining JVM region partitioning and G1GC concurrent latency advantages.",
        ai_matched_concepts=["Heap vs Stack vs Metaspace", "G1GC Region partitioning", "Minimizing Stop-The-World pauses"],
        ai_missing_concepts=["Metaspace native memory details"],
        marks_awarded=8.5,
        is_graded=True,
        graded_by_id=examiner1.id
    )
    ans_p5 = Answer(
        session_id=session_primary.id, question_id=q5.id,
        code_answer="function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}",
        is_answered=True,
        marks_awarded=10.0,
        is_correct=True,
        is_graded=True
    )
    ans_p6 = Answer(session_id=session_primary.id, question_id=q6.id, selected_options=["B"], is_answered=True, is_correct=True, marks_awarded=3.0, is_graded=True)
    ans_p7 = Answer(session_id=session_primary.id, question_id=q7.id, selected_options=["C"], is_answered=True, is_correct=True, marks_awarded=4.0, is_graded=True)
    ans_p8 = Answer(session_id=session_primary.id, question_id=q8.id, selected_options=["B"], is_answered=True, is_correct=True, marks_awarded=3.0, is_graded=True)
    ans_p9 = Answer(
        session_id=session_primary.id, question_id=q9.id,
        image_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
        is_answered=True,
        ai_suggested_score=7.0,
        ai_confidence=0.86,
        ai_justification="System diagram shows clean API gateway, Redis caching tier, and Kafka event streaming pipeline.",
        marks_awarded=7.0,
        is_graded=True,
        graded_by_id=examiner1.id
    )
    db.add_all([ans_p1, ans_p2, ans_p3, ans_p4, ans_p5, ans_p6, ans_p7, ans_p8, ans_p9])
    db.commit()

    # Result for primary student
    total_earned = 4.0 + 4.0 + 5.5 + 8.5 + 10.0 + 3.0 + 4.0 + 3.0 + 7.0  # 49.0 / 52.0
    res_primary = Result(
        session_id=session_primary.id,
        exam_id=exam_demo.id,
        student_id=primary_student.id,
        total_score=total_earned,
        max_score=52.0,
        percentage=round((total_earned / 52.0) * 100.0, 1),
        grade="A+",
        rank=1,
        percentile=98.5,
        status="PUBLISHED",
        total_questions=9,
        correct_count=8,
        incorrect_count=0,
        skipped_count=0,
        partial_count=1,
        topic_breakdown={
            "Data Structures & Algorithms": {"score": 14.0, "total": 14.0, "percentage": 100.0},
            "React & State Architecture": {"score": 4.0, "total": 4.0, "percentage": 100.0},
            "Database Management Systems": {"score": 8.5, "total": 9.0, "percentage": 94.4},
            "Java & OOPs": {"score": 8.5, "total": 10.0, "percentage": 85.0},
            "Node.js & Backend Services": {"score": 11.0, "total": 12.0, "percentage": 91.7},
            "Analytical Aptitude": {"score": 3.0, "total": 3.0, "percentage": 100.0}
        },
        difficulty_breakdown={
            "EASY": {"correct": 2, "total": 2},
            "MEDIUM": {"correct": 5, "total": 5},
            "HARD": {"correct": 2, "total": 2}
        },
        published_at=now - timedelta(hours=2)
    )
    db.add(res_primary)
    db.commit()

    # Certificate for primary student
    cert_primary = Certificate(
        result_id=res_primary.id,
        student_id=primary_student.id,
        exam_id=exam_demo.id,
        certificate_number="EVL-2026-A94F81E2",
        issue_date=now - timedelta(hours=2),
        verification_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
    db.add(cert_primary)

    # 2. Live sessions for active exam monitoring
    live1 = ExamSession(
        exam_id=exam_demo.id,
        student_id=other_students[0].id,  # Arun Kumar
        start_time=now - timedelta(minutes=18),
        end_time=now + timedelta(minutes=42),
        status="IN_PROGRESS",
        suspicion_score=15.0,
        is_flagged=False,
        last_heartbeat_at=now
    )
    live2 = ExamSession(
        exam_id=exam_demo.id,
        student_id=other_students[1].id,  # Priya Sundaram
        start_time=now - timedelta(minutes=24),
        end_time=now + timedelta(minutes=36),
        status="IN_PROGRESS",
        suspicion_score=68.0,  # High suspicion for realistic proctoring alerts
        is_flagged=True,
        last_heartbeat_at=now
    )
    live3 = ExamSession(
        exam_id=exam_demo.id,
        student_id=other_students[2].id,  # Rahul Menon
        start_time=now - timedelta(minutes=10),
        end_time=now + timedelta(minutes=50),
        status="IN_PROGRESS",
        suspicion_score=5.0,
        is_flagged=False,
        last_heartbeat_at=now
    )
    db.add_all([live1, live2, live3])
    db.commit()

    # Proctor events for live2 (Priya - flagged session)
    pe1 = ProctorEvent(
        session_id=live2.id,
        event_type="TAB_SWITCH",
        severity="HIGH",
        score_delta=15.0,
        details={"message": "Candidate navigated away from assessment window (browser unfocused)"},
        timestamp=now - timedelta(minutes=14)
    )
    pe2 = ProctorEvent(
        session_id=live2.id,
        event_type="MULTIPLE_FACES",
        severity="CRITICAL",
        score_delta=25.0,
        details={"message": "Secondary individual detected in candidate webcam frame"},
        timestamp=now - timedelta(minutes=9)
    )
    pe3 = ProctorEvent(
        session_id=live2.id,
        event_type="GAZE_AWAY",
        severity="MEDIUM",
        score_delta=10.0,
        details={"message": "Gaze sustained off-screen (> 6 seconds)"},
        timestamp=now - timedelta(minutes=4)
    )
    db.add_all([pe1, pe2, pe3])
    db.commit()

    # 3. Create items in Grading Queue for Examiner
    # Student Rahul submitted subjective answers awaiting examiner review
    session_grading_target = ExamSession(
        exam_id=exam_demo.id,
        student_id=other_students[3].id,  # Ananya Sharma
        start_time=now - timedelta(hours=1),
        end_time=now,
        submitted_at=now - timedelta(minutes=5),
        status="SUBMITTED",
        suspicion_score=12.0
    )
    db.add(session_grading_target)
    db.commit()

    ans_g1 = Answer(
        session_id=session_grading_target.id,
        question_id=q3.id,
        text_answer="ACID means Atomicity, Consistency, Isolation, and Durability. It means database queries won't fail halfway through and keep data accurate. If you send money, either both get debited and credited or nothing changes.",
        is_answered=True,
        ai_suggested_score=4.5,
        ai_confidence=0.88,
        ai_justification="Candidate correctly identified the acronym and gave a sound banking example, but lacked technical elaboration on Isolation levels and Durability persistence mechanisms.",
        ai_matched_concepts=["Atomicity explanation", "Real world scenario"],
        ai_missing_concepts=["Consistency & Isolation", "Durability explanation"],
        is_graded=False
    )
    ans_g2 = Answer(
        session_id=session_grading_target.id,
        question_id=q4.id,
        text_answer="JVM memory has heap for object instances and stack for method invocation frames. G1GC collects garbage in parallel regions so user does not notice lag.",
        is_answered=True,
        ai_suggested_score=6.0,
        ai_confidence=0.82,
        ai_justification="Adequate overview of Heap and Stack separation; missing explanation of Metaspace and specific Region partitioning calculations.",
        ai_matched_concepts=["Heap vs Stack vs Metaspace", "G1GC Region partitioning"],
        ai_missing_concepts=["Generational memory hypothesis", "Minimizing Stop-The-World pauses"],
        is_graded=False
    )
    db.add_all([ans_g1, ans_g2])
    db.commit()

    queue1 = GradingQueueItem(
        answer_id=ans_g1.id,
        session_id=session_grading_target.id,
        exam_id=exam_demo.id,
        question_id=q3.id,
        student_id=other_students[3].id,
        examiner_id=examiner1.id,
        status="PENDING",
        ai_score=4.5
    )
    queue2 = GradingQueueItem(
        answer_id=ans_g2.id,
        session_id=session_grading_target.id,
        exam_id=exam_demo.id,
        question_id=q4.id,
        student_id=other_students[3].id,
        examiner_id=examiner1.id,
        status="PENDING",
        ai_score=6.0
    )
    db.add_all([queue1, queue2])

    # Add welcome notifications
    n1 = Notification(
        user_id=primary_student.id,
        title="Welcome to Evalora Assessment Platform",
        message="Your enterprise candidate profile is verified and active. You are registered for the Full Stack Developer Assessment.",
        type="INFO"
    )
    n2 = Notification(
        user_id=primary_student.id,
        title="Result Published",
        message="Your results for Full Stack Developer Assessment are ready to view. Grade: A+ (94.2%).",
        type="SUCCESS",
        link_url="/student/results"
    )
    n3 = Notification(
        user_id=examiner1.id,
        title="2 Submissions in Grading Queue",
        message="New candidate subjective submissions require your review and score confirmation.",
        type="ALERT",
        link_url="/examiner/grading"
    )
    db.add_all([n1, n2, n3])
    db.commit()

    print("[SUCCESS] Seed Data Generated Successfully!")
    print("-------------------------------------------------------")
    print("Default Test Accounts:")
    print("  [ADMIN]    admin@example.com     / admin123")
    print("  [EXAMINER] examiner@example.com  / examiner123")
    print("  [STUDENT]  student@example.com   / student123")
    print("-------------------------------------------------------")

    db.close()

if __name__ == "__main__":
    run_seed()
