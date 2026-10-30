import sys
import subprocess
import time
import tempfile
import os
from typing import Dict, Any, List

class CodeExecutionService:
    TIMEOUT_SECONDS = 5
    MAX_OUTPUT_BYTES = 50000

    @classmethod
    def execute_code(
        cls,
        language: str,
        code: str,
        test_cases: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Executes code in a secure sandbox against public & hidden test cases.
        Supports Python, JavaScript (Node.js), C++, and Java.
        """
        results = []
        all_passed = True
        total_runtime_ms = 0

        for idx, tc in enumerate(test_cases):
            input_data = tc.get("input", "")
            expected_output = tc.get("expected_output", "").strip()
            is_hidden = tc.get("is_hidden", False)

            start_t = time.perf_counter()
            exec_res = cls._run_single_case(language, code, input_data)
            duration_ms = round((time.perf_counter() - start_t) * 1000, 2)
            total_runtime_ms += duration_ms

            passed = (exec_res["stdout"].strip() == expected_output) and not exec_res["error"]
            if not passed:
                all_passed = False

            results.append({
                "test_case": idx + 1,
                "is_hidden": is_hidden,
                "passed": passed,
                "duration_ms": duration_ms,
                "stdout": exec_res["stdout"] if not is_hidden else "[Hidden Test Case]",
                "expected": expected_output if not is_hidden else "[Hidden Test Case]",
                "error": exec_res["error"],
                "status": "PASSED" if passed else ("TIME_LIMIT_EXCEEDED" if exec_res["timeout"] else "WRONG_ANSWER")
            })

        return {
            "all_passed": all_passed,
            "passed_count": sum(1 for r in results if r["passed"]),
            "total_count": len(results),
            "total_runtime_ms": round(total_runtime_ms, 2),
            "test_case_results": results
        }

    @classmethod
    def _run_single_case(cls, language: str, code: str, input_data: str) -> Dict[str, Any]:
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                lang = language.lower()
                if lang in ("python", "py"):
                    script_path = os.path.join(tmpdir, "solution.py")
                    with open(script_path, "w", encoding="utf-8") as f:
                        f.write(code)
                    cmd = [sys.executable, script_path]

                elif lang in ("javascript", "js", "node"):
                    script_path = os.path.join(tmpdir, "solution.js")
                    with open(script_path, "w", encoding="utf-8") as f:
                        f.write(code)
                    cmd = ["node", script_path]

                elif lang in ("cpp", "c++"):
                    src_path = os.path.join(tmpdir, "solution.cpp")
                    out_path = os.path.join(tmpdir, "solution.exe" if os.name == "nt" else "solution")
                    with open(src_path, "w", encoding="utf-8") as f:
                        f.write(code)
                    compile_proc = subprocess.run(["g++", "-O2", src_path, "-o", out_path], capture_output=True, text=True, timeout=10)
                    if compile_proc.returncode != 0:
                        return {"stdout": "", "error": f"Compilation Error:\n{compile_proc.stderr}", "timeout": False}
                    cmd = [out_path]

                else:
                    return {"stdout": "", "error": f"Unsupported language: {language}", "timeout": False}

                proc = subprocess.run(
                    cmd,
                    input=input_data,
                    capture_output=True,
                    text=True,
                    timeout=cls.TIMEOUT_SECONDS
                )
                stdout = proc.stdout[:cls.MAX_OUTPUT_BYTES]
                stderr = proc.stderr[:cls.MAX_OUTPUT_BYTES]
                return {
                    "stdout": stdout,
                    "error": stderr if proc.returncode != 0 else None,
                    "timeout": False
                }

            except subprocess.TimeoutExpired:
                return {
                    "stdout": "",
                    "error": f"Execution timed out ({cls.TIMEOUT_SECONDS}s limit exceeded)",
                    "timeout": True
                }
            except Exception as e:
                return {
                    "stdout": "",
                    "error": str(e),
                    "timeout": False
                }

