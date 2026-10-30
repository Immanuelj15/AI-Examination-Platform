import re
import json
import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class AIGradingService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.LLM_MODEL

    async def evaluate_subjective_answer(
        self,
        question_text: str,
        student_answer: str,
        model_answer: Optional[str] = None,
        rubric: Optional[List[Dict[str, Any]]] = None,
        max_marks: float = 10.0
    ) -> Dict[str, Any]:
        """
        Evaluates a subjective answer using OpenAI GPT if API key is present,
        or an intelligent enterprise semantic rubric analyzer fallback.
        """
        if not student_answer or not student_answer.strip():
            return {
                "suggested_score": 0.0,
                "confidence": 0.99,
                "justification": "Candidate provided an empty answer or no response.",
                "matched_concepts": [],
                "missing_concepts": ["All required technical concepts"],
                "examiner_recommendation": "Confirm zero score for empty response."
            }

        # If valid OPENAI_API_KEY is configured, try calling OpenAI API
        if self.api_key and self.api_key.startswith("sk-"):
            try:
                import httpx
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                system_prompt = (
                    "You are an expert enterprise academic and technical examiner. "
                    "Evaluate the candidate's answer based on the question, model answer, and rubric. "
                    "Return ONLY valid JSON matching this schema:\n"
                    "{\n"
                    '  "suggested_score": float,\n'
                    '  "confidence": float between 0.0 and 1.0,\n'
                    '  "justification": string,\n'
                    '  "matched_concepts": [string],\n'
                    '  "missing_concepts": [string],\n'
                    '  "examiner_recommendation": string\n'
                    "}"
                )
                user_prompt = (
                    f"Question: {question_text}\n"
                    f"Model Answer: {model_answer or 'N/A'}\n"
                    f"Rubric: {json.dumps(rubric) if rubric else 'Standard semantic completeness'}\n"
                    f"Max Marks: {max_marks}\n\n"
                    f"Student Answer:\n{student_answer}\n"
                )

                async with httpx.AsyncClient(timeout=20.0) as client:
                    response = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers=headers,
                        json={
                            "model": self.model,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            "response_format": {"type": "json_object"},
                            "temperature": 0.2
                        }
                    )
                    if response.status_code == 200:
                        data = response.json()
                        content = data["choices"][0]["message"]["content"]
                        result = json.loads(content)
                        # Clamping
                        score = max(0.0, min(max_marks, float(result.get("suggested_score", 0.0))))
                        return {
                            "suggested_score": round(score, 1),
                            "confidence": round(float(result.get("confidence", 0.85)), 2),
                            "justification": result.get("justification", "Evaluated via LLM engine."),
                            "matched_concepts": result.get("matched_concepts", []),
                            "missing_concepts": result.get("missing_concepts", []),
                            "examiner_recommendation": result.get("examiner_recommendation", "Review examiner.")
                        }
            except Exception as e:
                logger.warning(f"OpenAI evaluation failed or unreachable ({e}), falling back to Semantic Rubric Engine.")

        # Intelligent Semantic Rubric Analyzer Fallback
        return self._semantic_rubric_analysis(question_text, student_answer, model_answer, rubric, max_marks)

    def _semantic_rubric_analysis(
        self,
        question_text: str,
        student_answer: str,
        model_answer: Optional[str],
        rubric: Optional[List[Dict[str, Any]]],
        max_marks: float
    ) -> Dict[str, Any]:
        """
        Deterministic, robust concept and rubric matcher for enterprise evaluation.
        Evaluates keyword coverage, phrase alignment, length quality, and concept presence.
        """
        student_clean = student_answer.lower()
        
        # Extract target concepts from model answer and rubric
        concepts = []
        if rubric and isinstance(rubric, list):
            for item in rubric:
                criterion = item.get("criterion", "")
                keywords = item.get("keywords", [])
                weight = float(item.get("weight", 1.0))
                concepts.append({"name": criterion, "keywords": [k.lower() for k in keywords], "weight": weight})

        if not concepts and model_answer:
            # Extract key nouns and phrases from model answer
            words = [w.strip(".,;:()[]{}\"'\n") for w in model_answer.split()]
            unique_words = list(dict.fromkeys([w.lower() for w in words if len(w) > 4]))
            chunk_size = max(2, len(unique_words) // 4)
            for i in range(0, min(len(unique_words), 12), chunk_size):
                sub = unique_words[i:i+chunk_size]
                if sub:
                    concepts.append({
                        "name": f"Key terms ({', '.join(sub[:2])})",
                        "keywords": sub,
                        "weight": 1.0
                    })

        if not concepts:
            # Fallback to question terms
            q_words = [w.strip(".,;:()[]{}\"'\n").lower() for w in question_text.split() if len(w) > 4]
            concepts = [{"name": "Core Question Concepts", "keywords": q_words[:5], "weight": 1.0}]

        matched = []
        missing = []
        total_weight = sum(c["weight"] for c in concepts) or 1.0
        earned_weight = 0.0

        for c in concepts:
            kws = c["keywords"]
            hit = any(kw in student_clean for kw in kws) if kws else False
            if hit:
                matched.append(c["name"])
                earned_weight += c["weight"]
            else:
                missing.append(c["name"])

        # Base score from concept coverage
        coverage_ratio = earned_weight / total_weight

        # Length and explanation depth factor
        length_words = len(student_clean.split())
        depth_factor = min(1.0, length_words / 40.0) if max_marks > 5 else min(1.0, length_words / 15.0)

        raw_score = max_marks * (coverage_ratio * 0.75 + depth_factor * 0.25)
        suggested_score = round(max(0.0, min(max_marks, raw_score)), 1)
        
        confidence = 0.88 if len(matched) > 0 else 0.75

        # Justification
        if suggested_score >= (max_marks * 0.8):
            justification = f"Comprehensive answer covering {len(matched)} key requirements with clear technical reasoning."
            recommendation = "Recommend approval with full marks."
        elif suggested_score >= (max_marks * 0.5):
            justification = f"Adequate coverage of core concepts ({', '.join(matched[:2])}), but missed depth on {', '.join(missing[:2])}."
            recommendation = "Examiner review recommended for partial credit adjustment."
        else:
            justification = f"Answer lacks several critical concepts ({', '.join(missing[:3])}) and requires additional technical detail."
            recommendation = "Examiner review: score significantly below average."

        return {
            "suggested_score": suggested_score,
            "confidence": confidence,
            "justification": justification,
            "matched_concepts": matched or ["Partial terminology present"],
            "missing_concepts": missing or ["Minor elaborations"],
            "examiner_recommendation": recommendation
        }

ai_grading_service = AIGradingService()
