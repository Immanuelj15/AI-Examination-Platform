"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, ShieldAlert, ArrowLeft, ArrowRight, Flag, Check,
  AlertCircle, Upload, Code2, RotateCcw, CheckCircle2, Wifi, WifiOff,
  Play, Terminal, XCircle, FileCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProctoringHUD } from "@/components/ProctoringHUD";
import { QuestionNavigator } from "@/components/QuestionNavigator";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function ExamEnginePage({ params }: { params: Promise<{ examId: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.examId;
  const router = useRouter();
  const { language, t } = useLanguage();

  const [sessionData, setSessionData] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [answersState, setAnswersState] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [offlineProtected, setOfflineProtected] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // In-Browser Multi-Language Sandbox States
  const [codeLanguages, setCodeLanguages] = useState<Record<number, string>>({});
  const [codeExecuting, setCodeExecuting] = useState(false);
  const [codeExecutionResults, setCodeExecutionResults] = useState<Record<number, any>>({});
  const [activeTestTab, setActiveTestTab] = useState<number>(0);

  // Initialize Exam Session
  useEffect(() => {
    const startSession = async () => {
      try {
        const token = localStorage.getItem("evalora_token");
        const res = await fetch(`${API_BASE}/exam-sessions/start/${examId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setSessionData(data);
          setQuestions(data.questions);
          setRemainingSeconds(data.remaining_seconds);

          // Populate existing answers into local state
          const initialAns: Record<number, any> = {};
          data.questions.forEach((q: any) => {
            initialAns[q.id] = {
              selected_options: q.saved_selected_options || [],
              text_answer: q.saved_text_answer || "",
              code_answer: q.saved_code_answer || q.coding_starter_code || "",
              image_url: q.saved_image_url || "",
              is_flagged: q.is_flagged || false,
              is_answered: q.is_answered || false
            };
          });

          // Check if local backup exists in localStorage
          const localCache = localStorage.getItem(`evalora_answers_session_${data.session_id}`);
          if (localCache) {
            try {
              const parsed = JSON.parse(localCache);
              Object.assign(initialAns, parsed);
            } catch {}
          }

          setAnswersState(initialAns);
        } else {
          router.push("/student/dashboard");
        }
      } catch (err) {
        console.error("Exam start error:", err);
      } finally {
        setLoading(false);
      }
    };

    startSession();

    // Online / Offline state listeners
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineProtected(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setOfflineProtected(true);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [examId]);

  // Server Authoritative Countdown Timer
  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? (answersState[currentQ.id] || {}) : {};

  // Incremental Answer Persistence
  const saveAnswerToServer = async (qId: number, updatedAnswer: any) => {
    // 1. Always protect in local storage first
    if (sessionData?.session_id) {
      const merged = { ...answersState, [qId]: updatedAnswer };
      localStorage.setItem(`evalora_answers_session_${sessionData.session_id}`, JSON.stringify(merged));
    }

    // 2. Dispatch to backend API
    try {
      const token = localStorage.getItem("evalora_token");
      await fetch(`${API_BASE}/exam-sessions/${sessionData.session_id}/save-answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question_id: qId,
          selected_options: updatedAnswer.selected_options,
          text_answer: updatedAnswer.text_answer,
          code_answer: updatedAnswer.code_answer,
          image_url: updatedAnswer.image_url,
          is_flagged: updatedAnswer.is_flagged,
          time_spent_seconds: 5
        })
      });
    } catch (e) {
      console.warn("Backend save failed, saved locally", e);
      setOfflineProtected(true);
    }
  };

  const handleOptionSelect = (optionKey: string) => {
    if (!currentQ) return;
    const isMulti = currentQ.question_type === "MULTI_SELECT";
    let newSelected: string[] = [];

    if (isMulti) {
      const existing = currentAnswer.selected_options || [];
      if (existing.includes(optionKey)) {
        newSelected = existing.filter((k: string) => k !== optionKey);
      } else {
        newSelected = [...existing, optionKey];
      }
    } else {
      newSelected = [optionKey];
    }

    const updated = {
      ...currentAnswer,
      selected_options: newSelected,
      is_answered: newSelected.length > 0
    };

    setAnswersState((prev) => ({ ...prev, [currentQ.id]: updated }));
    saveAnswerToServer(currentQ.id, updated);
  };

  const handleTextChange = (text: string) => {
    if (!currentQ) return;
    const updated = {
      ...currentAnswer,
      text_answer: text,
      is_answered: text.trim().length > 0
    };
    setAnswersState((prev) => ({ ...prev, [currentQ.id]: updated }));
    saveAnswerToServer(currentQ.id, updated);
  };

  const handleCodeChange = (code: string) => {
    if (!currentQ) return;
    const updated = {
      ...currentAnswer,
      code_answer: code,
      is_answered: code.trim().length > 0
    };
    setAnswersState((prev) => ({ ...prev, [currentQ.id]: updated }));
    saveAnswerToServer(currentQ.id, updated);
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    const updated = {
      ...currentAnswer,
      is_flagged: !currentAnswer.is_flagged
    };
    setAnswersState((prev) => ({ ...prev, [currentQ.id]: updated }));
    saveAnswerToServer(currentQ.id, updated);
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    const updated = {
      ...currentAnswer,
      selected_options: [],
      text_answer: "",
      code_answer: currentQ.coding_starter_code || "",
      image_url: "",
      is_answered: false
    };
    setAnswersState((prev) => ({ ...prev, [currentQ.id]: updated }));
    saveAnswerToServer(currentQ.id, updated);
  };

  const handleExecuteCode = async () => {
    if (!currentQ) return;
    const lang = codeLanguages[currentQ.id] || currentQ.coding_language || "python";
    const code = currentAnswer.code_answer || currentQ.coding_starter_code || "";

    setCodeExecuting(true);
    try {
      const token = localStorage.getItem("evalora_token");
      const testCases = currentQ.test_cases && currentQ.test_cases.length > 0
        ? currentQ.test_cases
        : [
            { input: "1 2 3\n", expected_output: "6", is_hidden: false },
            { input: "10 20 30\n", expected_output: "60", is_hidden: true }
          ];

      const res = await fetch(`${API_BASE}/questions/execute-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          language: lang,
          code,
          test_cases: testCases
        })
      });

      if (res.ok) {
        const result = await res.json();
        setCodeExecutionResults((prev) => ({ ...prev, [currentQ.id]: result }));
      } else {
        const err = await res.json();
        alert(err.detail || "Code execution failed.");
      }
    } catch (e: any) {
      console.error("Execution error:", e);
      alert("Failed to reach execution sandbox.");
    } finally {
      setCodeExecuting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!sessionData?.session_id) return;
    await submitExamFinal();
  };

  const handleSubmitExamClick = async () => {
    const answeredCount = Object.values(answersState).filter((a: any) => a.is_answered).length;
    const confirmed = window.confirm(
      `Are you sure you want to submit? You have answered ${answeredCount} of ${questions.length} questions. Once submitted, your exam cannot be resumed.`
    );
    if (confirmed) {
      await submitExamFinal();
    }
  };

  const submitExamFinal = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/exam-sessions/${sessionData.session_id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/student/results/${data.result_id || 1}`);
      } else {
        router.push("/student/dashboard");
      }
    } catch (e) {
      console.error("Submission failed", e);
      router.push("/student/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#123B7A] border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Initializing Secure Examination Environment</h3>
          <p className="text-xs text-slate-500">Configuring authoritative timers and proctoring telemetry...</p>
        </div>
      </div>
    );
  }

  // Format countdown
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const isWarning = remainingSeconds <= 300 && remainingSeconds > 60;
  const isCritical = remainingSeconds <= 60;

  // Localized question text
  const getQuestionText = () => {
    if (!currentQ) return "";
    if (language === "ta" && currentQ.question_ta) return currentQ.question_ta;
    if (language === "hi" && currentQ.question_hi) return currentQ.question_hi;
    if (language === "ml" && currentQ.question_ml) return currentQ.question_ml;
    return currentQ.question_en;
  };

  // Localized options
  const getOptionText = (opt: any) => {
    if (language === "ta" && opt.text_ta) return opt.text_ta;
    if (language === "hi" && opt.text_hi) return opt.text_hi;
    if (language === "ml" && opt.text_ml) return opt.text_ml;
    return opt.text_en;
  };

  const navQuestionItems = questions.map((q, idx) => ({
    index: idx,
    id: q.id,
    isAnswered: answersState[q.id]?.is_answered || false,
    isFlagged: answersState[q.id]?.is_flagged || false,
    section: q.section_name || "General"
  }));

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col overflow-hidden select-none">
      {/* Offline Alert Banner */}
      {(!isOnline || offlineProtected) && (
        <div className="bg-amber-600 text-white text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 animate-pulse z-50">
          <WifiOff className="w-4 h-4" />
          <span>
            Connection interrupted. Your answers are being protected locally. Reconnect to continue.
          </span>
        </div>
      )}

      {/* Top Examination Navigation Bar */}
      <header className="h-18 bg-[#123B7A] text-white px-6 sm:px-8 flex items-center justify-between flex-shrink-0 shadow-md z-40 border-b border-blue-900/50">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-base shadow-sm">
            E
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
              {sessionData?.exam_title || "Enterprise Assessment"}
            </h1>
            <p className="text-xs sm:text-sm text-blue-200">
              Section: {currentQ?.section_name || "General"} • Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
        </div>

        {/* Central Authoritative Countdown Timer */}
        <div
          className={`flex items-center gap-2.5 px-5 py-2 rounded-xl font-mono text-xl sm:text-2xl font-bold tracking-wide shadow-sm transition-all duration-300 ${
            remainingSeconds <= 10
              ? "bg-rose-600 text-white animate-pulse ring-2 ring-rose-400"
              : isCritical
              ? "bg-rose-500 text-white"
              : isWarning
              ? "bg-amber-500 text-white"
              : "bg-blue-950/70 text-white border border-blue-400/40"
          }`}
        >
          <Clock className="w-5 h-5 flex-shrink-0" />
          <span>
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSelector variant="dark" />
          </div>

          <button
            onClick={handleSubmitExamClick}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[15px] font-bold transition-all shadow-sm flex items-center gap-2 btn-interactive"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? "Submitting..." : "Submit Examination"}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left / Center: Question & Answer Console */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between">
          <div className="max-w-[920px] mx-auto w-full space-y-6">
            {/* Animated Question Card Container */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 12 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -12 : 12 }}
                transition={{ duration: 0.2, ease: [0.215, 0.61, 0.355, 1] }}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* Question Header Meta */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3.5 py-1.5 rounded-lg text-sm sm:text-[15px] font-extrabold bg-blue-50 text-[#123B7A] border border-blue-200/80">
                      Question {currentIndex + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      {currentQ?.question_type} • {currentQ?.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <span className="text-sm sm:text-base font-bold text-slate-800 bg-slate-50 px-3 py-1 rounded-md border border-slate-200">
                      Marks: +{currentQ?.marks}
                    </span>
                    <button
                      onClick={handleToggleFlag}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-bold border transition-colors btn-interactive ${
                        currentAnswer.is_flagged
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Flag className="w-4 h-4" />
                      <span>{currentAnswer.is_flagged ? "Flagged for Review" : "Mark for Review"}</span>
                    </button>
                  </div>
                </div>

                {/* Question Prompt: 19px-20px Comfortable Enterprise Typography */}
                <div className="text-[19px] sm:text-[20px] font-semibold text-slate-900 leading-[1.65] pt-1">
                  {getQuestionText()}
                </div>

                {/* Dynamic Answer Inputs */}
                <div className="pt-4 border-t border-slate-100">
                  {/* 1. MCQ & Multi-Select with 56px touch target and 17px option text */}
                  {(currentQ?.question_type === "MCQ" || currentQ?.question_type === "MULTI_SELECT") && (
                    <div className="space-y-3">
                      {currentQ.options?.map((opt: any) => {
                        const isSelected = (currentAnswer.selected_options || []).includes(opt.option_key);
                        return (
                          <motion.div
                            key={opt.option_key}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.995 }}
                            onClick={() => handleOptionSelect(opt.option_key)}
                            className={`cursor-pointer min-h-[56px] p-4 sm:p-5 rounded-2xl border transition-all flex items-center gap-4 ${
                              isSelected
                                ? "bg-blue-50/90 border-[#2563EB] text-[#123B7A] shadow-xs ring-1 ring-[#2563EB]"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50/60"
                            }`}
                          >
                            <div
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-${
                                currentQ.question_type === "MULTI_SELECT" ? "lg" : "full"
                              } border flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0 transition-all ${
                                isSelected
                                  ? "bg-[#2563EB] text-white border-[#2563EB] shadow-xs"
                                  : "border-slate-300 bg-slate-50 text-slate-600"
                              }`}
                            >
                              {opt.option_key}
                            </div>
                            <span className="text-[16px] sm:text-[17px] font-medium leading-relaxed">{getOptionText(opt)}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. Short / Long Answer */}
                  {(currentQ?.question_type === "SHORT_ANSWER" || currentQ?.question_type === "LONG_ANSWER") && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm text-slate-500 font-medium">
                        <span>Type your detailed response below:</span>
                        <span>Word count: {(currentAnswer.text_answer || "").split(/\s+/).filter(Boolean).length} words</span>
                      </div>
                      <textarea
                        rows={currentQ.question_type === "LONG_ANSWER" ? 10 : 5}
                        value={currentAnswer.text_answer || ""}
                        onChange={(e) => handleTextChange(e.target.value)}
                        placeholder="Write your explanation or derivation clearly..."
                        className="w-full p-5 text-[16px] sm:text-[17px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans leading-relaxed text-slate-900 bg-white"
                      />
                    </div>
                  )}

                  {/* 3. In-Browser Multi-Language Code Execution Sandbox */}
                  {currentQ?.question_type === "CODING" && (
                    <div className="space-y-4">
                      {/* Editor Top Bar: Language Picker & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 rounded-t-2xl border border-slate-800 text-slate-200">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Environment:</span>
                          <select
                            value={codeLanguages[currentQ.id] || currentQ.coding_language || "python"}
                            onChange={(e) => {
                              const selected = e.target.value;
                              setCodeLanguages((prev) => ({ ...prev, [currentQ.id]: selected }));
                            }}
                            className="bg-slate-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-400 cursor-pointer"
                          >
                            <option value="python">Python 3.11</option>
                            <option value="javascript">JavaScript (Node.js)</option>
                            <option value="cpp">C++ (g++ 17)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleCodeChange(currentQ.coding_starter_code || "");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Reset to original template"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Template</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleExecuteCode}
                            disabled={codeExecuting}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{codeExecuting ? "Evaluating..." : "Run Code & Test Cases"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Code Editor Body */}
                      <textarea
                        rows={14}
                        value={currentAnswer.code_answer || currentQ.coding_starter_code || ""}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="# Write your technical solution here..."
                        className="w-full -mt-4 p-5 rounded-b-2xl bg-slate-950 text-emerald-300 font-mono text-[14px] leading-relaxed focus:outline-none border-x border-b border-slate-800 shadow-inner"
                        spellCheck={false}
                      />

                      {/* Execution Output Console / Test Case Results */}
                      {codeExecutionResults[currentQ.id] && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg animate-in fade-in">
                          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-4 h-4 text-emerald-400" />
                              <span className="font-bold text-white">Execution Sandbox Output</span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  codeExecutionResults[currentQ.id].all_passed
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                }`}
                              >
                                {codeExecutionResults[currentQ.id].all_passed ? "ALL PASSED" : "FAILED CASES DETECTED"}
                              </span>
                            </div>
                            <span className="font-mono text-slate-400 text-[11px]">
                              Passed: {codeExecutionResults[currentQ.id].passed_count} / {codeExecutionResults[currentQ.id].total_count}
                            </span>
                          </div>

                          {/* Test Case Tabs */}
                          <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-800/80 bg-slate-900">
                            {codeExecutionResults[currentQ.id].results?.map((tc: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setActiveTestTab(idx)}
                                className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  activeTestTab === idx
                                    ? "bg-slate-800 text-white border-t border-x border-slate-700"
                                    : "text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                {tc.passed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                )}
                                <span>{tc.is_hidden ? `Hidden Case #${idx + 1}` : `Case #${idx + 1}`}</span>
                              </button>
                            ))}
                          </div>

                          {/* Selected Test Case Details */}
                          {codeExecutionResults[currentQ.id].results?.[activeTestTab] && (
                            <div className="p-4 space-y-3 text-xs font-mono">
                              {codeExecutionResults[currentQ.id].results[activeTestTab].is_hidden ? (
                                <div className="p-4 bg-slate-950/60 rounded-xl text-slate-400 text-center">
                                  {codeExecutionResults[currentQ.id].results[activeTestTab].passed ? (
                                    <span className="text-emerald-400 font-bold">✓ Hidden verification test case passed.</span>
                                  ) : (
                                    <span className="text-rose-400 font-bold">✕ Hidden test case output mismatch or time limit exceeded.</span>
                                  )}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="text-slate-500 font-sans font-bold">Standard Input (stdin):</span>
                                    <pre className="p-3 bg-slate-950 rounded-xl text-slate-300 border border-slate-800 overflow-x-auto">
                                      {codeExecutionResults[currentQ.id].results[activeTestTab].input || "(Empty stdin)"}
                                    </pre>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-slate-500 font-sans font-bold">Expected Output:</span>
                                    <pre className="p-3 bg-slate-950 rounded-xl text-emerald-400 border border-slate-800 overflow-x-auto">
                                      {codeExecutionResults[currentQ.id].results[activeTestTab].expected_output}
                                    </pre>
                                  </div>
                                  <div className="sm:col-span-2 space-y-1">
                                    <span className="text-slate-500 font-sans font-bold">Your Standard Output (stdout):</span>
                                    <pre
                                      className={`p-3 bg-slate-950 rounded-xl border overflow-x-auto ${
                                        codeExecutionResults[currentQ.id].results[activeTestTab].passed
                                          ? "text-emerald-400 border-slate-800"
                                          : "text-rose-400 border-rose-900/50"
                                      }`}
                                    >
                                      {codeExecutionResults[currentQ.id].results[activeTestTab].stdout || "(No stdout output produced)"}
                                    </pre>
                                  </div>
                                  {codeExecutionResults[currentQ.id].results[activeTestTab].stderr && (
                                    <div className="sm:col-span-2 space-y-1">
                                      <span className="text-rose-400 font-sans font-bold">Stderr / Error Log:</span>
                                      <pre className="p-3 bg-rose-950/30 text-rose-300 rounded-xl border border-rose-900 overflow-x-auto">
                                        {codeExecutionResults[currentQ.id].results[activeTestTab].stderr}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Handwritten / Image Upload */}
                  {currentQ?.question_type === "IMAGE_UPLOAD" && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/60 transition-colors">
                        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                        <p className="text-base font-bold text-slate-700">Upload handwritten diagram or rough work photo</p>
                        <p className="text-sm text-slate-400 mt-1">JPEG, PNG, WEBP accepted (max 10MB)</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (re) => {
                                const b64 = re.target?.result as string;
                                const updated = { ...currentAnswer, image_url: b64, is_answered: true };
                                setAnswersState((prev) => ({ ...prev, [currentQ.id]: updated }));
                                saveAnswerToServer(currentQ.id, updated);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="mt-3 text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#123B7A] file:text-white cursor-pointer"
                        />
                      </div>

                      {currentAnswer.image_url && (
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                          <img src={currentAnswer.image_url} alt="Attached submission" className="w-full h-64 object-contain bg-slate-900" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Question Controls with 15-16px font and 48px height */}
            <div className="flex items-center justify-between py-3">
              <button
                onClick={handleClearResponse}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors btn-interactive"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear Response</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => {
                    setDirection(-1);
                    setCurrentIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-[15px] transition-colors disabled:opacity-30 flex items-center gap-2 btn-interactive"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => {
                    setDirection(1);
                    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
                  }}
                  className="px-7 py-3 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white font-bold text-[15px] transition-all shadow-sm flex items-center gap-2 disabled:opacity-30 btn-interactive"
                >
                  <span>Save & Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Question Navigator */}
        <aside className="w-80 p-5 hidden md:block overflow-hidden flex-shrink-0">
          <QuestionNavigator
            questions={navQuestionItems}
            currentIndex={currentIndex}
            onSelectQuestion={(idx) => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
          />
        </aside>
      </div>

      {/* Unobtrusive AI Proctoring HUD */}
      {sessionData?.session_id && (
        <ProctoringHUD sessionId={sessionData.session_id} />
      )}
    </div>
  );
}
