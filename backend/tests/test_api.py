import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_admin_login():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"

def test_student_login():
    response = client.post("/api/v1/auth/login", json={
        "email": "student@example.com",
        "password": "student123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "STUDENT"

def test_examiner_login():
    response = client.post("/api/v1/auth/login", json={
        "email": "examiner@example.com",
        "password": "examiner123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "EXAMINER"

def test_get_exams_list():
    # Login as student
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@example.com",
        "password": "student123"
    })
    token = login_res.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/exams", headers=headers)
    assert response.status_code == 200
    exams = response.json()
    assert len(exams) >= 1
    assert any(e["code"] == "FS-DEV-2026" for e in exams)

def test_ai_grading_preview():
    # Login as examiner
    login_res = client.post("/api/v1/auth/login", json={
        "email": "examiner@example.com",
        "password": "examiner123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "question": "Explain ACID properties in relational database systems.",
        "student_answer": "ACID ensures atomicity, consistency, isolation, and durability. Atomicity means all-or-nothing transactions.",
        "model_answer": "ACID stands for Atomicity, Consistency, Isolation, and Durability to maintain integrity across concurrent operations.",
        "rubric": [
            {"criterion": "Atomicity and consistency", "keywords": ["atomicity", "all-or-nothing", "consistency"], "weight": 2.5},
            {"criterion": "Isolation and durability", "keywords": ["isolation", "durability", "concurrent"], "weight": 2.5}
        ],
        "marks": 5.0
    }
    response = client.post("/api/v1/grading/evaluate-preview", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "suggested_score" in data
    assert data["suggested_score"] > 0
    assert "matched_concepts" in data

def test_admin_analytics():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/admin/analytics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_students"] >= 10
    assert data["active_exams"] >= 1
