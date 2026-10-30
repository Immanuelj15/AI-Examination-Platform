from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_code_execution_sandbox():
    payload = {
        "language": "python",
        "code": "import sys\nlines = sys.stdin.read().split()\nprint(sum(map(int, lines)))",
        "test_cases": [
            {"input": "1 2 3\n", "expected_output": "6", "is_hidden": False},
            {"input": "10 20 30\n", "expected_output": "60", "is_hidden": True}
        ]
    }
    # Login as admin to get auth headers
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    token = login_res.json()["access_token"]

    res = client.post("/api/v1/questions/execute-code", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["all_passed"] is True
    assert data["passed_count"] == 2

def test_generate_from_syllabus():
    login_res = client.post("/api/v1/auth/login", json={"email": "examiner@example.com", "password": "examiner123"})
    token = login_res.json()["access_token"]

    payload = {
        "syllabus_text": "Binary Search Trees\nGraph Traversal DFS BFS\nDynamic Programming",
        "subject": "Algorithms",
        "count": 3,
        "difficulty": "HARD"
    }
    res = client.post("/api/v1/questions/generate-from-syllabus", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "GENERATED"
    assert data["count"] == 3

