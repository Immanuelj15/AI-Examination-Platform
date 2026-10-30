import json
import re
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class SyllabusQuestionGeneratorService:
    @classmethod
    def generate_from_syllabus(
        cls,
        syllabus_text: str,
        subject: str,
        question_count: int = 5,
        difficulty: str = "MEDIUM"
    ) -> List[Dict[str, Any]]:
        """
        Parses syllabus text / curriculum headings and generates rich assessment questions:
        MCQ, multi-select, subjective, and coding challenges with distractors and rubrics.
        Uses Groq Cloud LLM if available, with graceful offline fallback.
        """
        # Try Groq AI Generation first if key is available
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY.startswith("gsk_"):
            try:
                import httpx
                headers = {
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
                system_prompt = (
                    "You are an expert enterprise curriculum and assessment architect. "
                    "Given a syllabus outline, subject, difficulty, and count, generate high-quality examination questions. "
                    "Mix question types: MCQ, MULTIPLE_CHOICE, SUBJECTIVE, and CODING. "
                    "Return ONLY a valid JSON object matching this schema:\n"
                    "{\n"
                    '  "questions": [\n'
                    '    {\n'
                    '      "question_text": "string",\n'
                    '      "question_type": "MCQ" | "MULTIPLE_CHOICE" | "SUBJECTIVE" | "CODING",\n'
                    '      "subject": "string",\n'
                    '      "topic": "string",\n'
                    '      "difficulty": "EASY" | "MEDIUM" | "HARD",\n'
                    '      "marks": float,\n'
                    '      "options": ["string", "string", "string", "string"], # for MCQ/MULTIPLE_CHOICE\n'
                    '      "correct_answer": "0" or "[0, 1]", # for MCQ/MULTIPLE_CHOICE\n'
                    '      "model_answer": "string", # for SUBJECTIVE\n'
                    '      "rubric": [{"concept": "string", "marks": float}], # for SUBJECTIVE\n'
                    '      "starter_code": "string", # for CODING\n'
                    '      "test_cases": [{"input": "string", "expected_output": "string", "is_hidden": false}] # for CODING\n'
                    '    }\n'
                    '  ]\n'
                    "}"
                )
                user_prompt = (
                    f"Subject: {subject}\n"
                    f"Difficulty: {difficulty}\n"
                    f"Required Count: {question_count}\n"
                    f"Syllabus Content:\n{syllabus_text[:2000]}\n"
                )

                payload = {
                    "model": settings.GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3
                }

                with httpx.Client(timeout=20.0) as client:
                    resp = client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    if resp.status_code != 200:
                        payload["model"] = settings.GROQ_FALLBACK_MODEL
                        resp = client.post(
                            "https://api.groq.com/openai/v1/chat/completions",
                            headers=headers,
                            json=payload
                        )

                    if resp.status_code == 200:
                        raw = resp.json()["choices"][0]["message"]["content"]
                        parsed = json.loads(raw)
                        qs = parsed.get("questions", [])
                        if qs and len(qs) > 0:
                            for q in qs:
                                q["status"] = "ACTIVE"
                                q["subject"] = subject
                                q["difficulty"] = difficulty
                            return qs[:question_count]
            except Exception as e:
                logger.warning(f"Groq syllabus generation failed ({e}), using template fallback.")

        # Deterministic Curriculum Template Fallback
        lines = [line.strip() for line in syllabus_text.splitlines() if len(line.strip()) > 3]
        if not lines:
            lines = [syllabus_text.strip()]

        generated_questions = []

        templates = [
            {
                "type": "MCQ",
                "q": "What is the primary operational objective of {topic} in modern computational architecture?",
                "options": [
                    "To optimize resource utilization and maintain deterministic state isolation.",
                    "To circumvent kernel security privileges during asynchronous I/O loops.",
                    "To disable thread concurrency in multi-core distributed clusters.",
                    "To manually allocate registers without compile-time bounds checking."
                ],
                "correct_option": 0,
                "marks": 2.0
            },
            {
                "type": "MULTIPLE_CHOICE",
                "q": "Which of the following properties are essential when implementing {topic}? (Select all that apply)",
                "options": [
                    "Data integrity verification through cryptographic validation hashes.",
                    "Linear scalability under elevated concurrent user workloads.",
                    "Complete deprecation of rollback transaction boundaries.",
                    "Strict type safety and boundary checking."
                ],
                "correct_options": [0, 1, 3],
                "marks": 3.0
            },
            {
                "type": "SUBJECTIVE",
                "q": "Explain the architectural principles of {topic}. Discuss failure recovery, trade-offs, and design patterns.",
                "model_answer": "{topic} guarantees structural reliability by enforcing isolation, automated recovery boundaries, and deterministic consensus across system components.",
                "rubric": [
                    {"concept": "Definition & Scope", "marks": 2.0},
                    {"concept": "Failure Recovery", "marks": 2.0},
                    {"concept": "Architectural Trade-offs", "marks": 1.0}
                ],
                "marks": 5.0
            },
            {
                "type": "CODING",
                "q": "Write a function that demonstrates optimal algorithm design for {topic}. Process inputs from standard input and output the result.",
                "starter_code": "def solve():\n    import sys\n    data = sys.stdin.read().split()\n    # Implement solution here\n    print('Result')\n\nif __name__ == '__main__':\n    solve()\n",
                "test_cases": [
                    {"input": "5 10 15\n", "expected_output": "30", "is_hidden": False},
                    {"input": "2 4 6 8\n", "expected_output": "20", "is_hidden": True}
                ],
                "marks": 10.0
            }
        ]

        for i in range(question_count):
            topic = lines[i % len(lines)]
            clean_topic = re.sub(r'^[0-9\.\-\*\#\s]+', '', topic).capitalize()
            tmpl = templates[i % len(templates)]

            q_data: Dict[str, Any] = {
                "question_text": tmpl["q"].format(topic=clean_topic),
                "question_type": tmpl["type"],
                "subject": subject,
                "topic": clean_topic,
                "difficulty": difficulty,
                "marks": tmpl["marks"],
                "status": "ACTIVE"
            }

            if tmpl["type"] in ("MCQ", "MULTIPLE_CHOICE"):
                q_data["options"] = tmpl["options"]
                if "correct_option" in tmpl:
                    q_data["correct_answer"] = str(tmpl["correct_option"])
                if "correct_options" in tmpl:
                    q_data["correct_answer"] = json.dumps(tmpl["correct_options"])

            elif tmpl["type"] == "SUBJECTIVE":
                q_data["model_answer"] = tmpl["model_answer"].format(topic=clean_topic)
                q_data["rubric"] = tmpl["rubric"]

            elif tmpl["type"] == "CODING":
                q_data["starter_code"] = tmpl["starter_code"]
                q_data["test_cases"] = tmpl["test_cases"]

            generated_questions.append(q_data)

        return generated_questions
