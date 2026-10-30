import json
import random
import time
from locust import HttpUser, task, between

class StudentExamUser(HttpUser):
    wait_time = between(2, 6)
    token = None
    session_id = None
    questions = []

    def on_start(self):
        """Simulate candidate authenticating and starting examination."""
        # Authenticate
        login_res = self.client.post("/api/v1/auth/login", json={
            "email": "student@example.com",
            "password": "password123"
        })
        if login_res.status_code == 200:
            data = login_res.json()
            self.token = data.get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
            
            # Start Exam 1 (Demo Full Stack Developer Assessment)
            start_res = self.client.post("/api/v1/exam-sessions/start/1", headers=self.headers)
            if start_res.status_code == 200:
                s_data = start_res.json()
                self.session_id = s_data.get("session_id")
                self.questions = s_data.get("questions", [])

    @task(5)
    def save_periodic_answer(self):
        """Simulate student selecting an answer and persisting it to backend."""
        if not self.session_id or not self.questions:
            return
            
        q = random.choice(self.questions)
        q_id = q.get("id")
        
        payload = {
            "question_id": q_id,
            "selected_options": ["A"],
            "text_answer": "Test answer simulation from concurrent load test.",
            "code_answer": "def solution():\n    return True",
            "time_spent_seconds": 15,
            "is_flagged": random.choice([True, False])
        }
        
        self.client.post(
            f"/api/v1/exam-sessions/{self.session_id}/save-answer",
            json=payload,
            headers=self.headers,
            name="/api/v1/exam-sessions/[id]/save-answer"
        )

    @task(3)
    def send_proctoring_heartbeat(self):
        """Simulate client computer-vision proctoring heartbeat every 10s."""
        if not self.session_id:
            return
            
        event_types = ["FACE_ABSENT", "GAZE_AWAY", "TAB_SWITCH"]
        has_event = random.random() < 0.15  # 15% probability of minor deviation
        
        events = []
        if has_event:
            events.append({
                "event_type": random.choice(event_types),
                "severity": "LOW",
                "metadata": {"source": "load_test_sim", "confidence": 0.94}
            })
            
        payload = {
            "session_id": self.session_id,
            "face_detected": not has_event,
            "multiple_faces": False,
            "gaze_centered": not has_event,
            "fullscreen_active": True,
            "events": events
        }
        
        self.client.post(
            "/api/v1/proctoring/heartbeat",
            json=payload,
            headers=self.headers,
            name="/api/v1/proctoring/heartbeat"
        )

    @task(1)
    def check_health(self):
        """Synthetic ping to verify server responsiveness under load."""
        self.client.get("/health", name="/health")
