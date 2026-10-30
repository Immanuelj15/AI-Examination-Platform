"use client";

import React, { useEffect, useState } from "react";
import {
  CheckSquare, Sparkles, Check, Edit3, ArrowRight, ArrowLeft,
  AlertCircle, ShieldCheck, UserCheck, MessageSquare, Award
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function ExaminerGradingPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customScore, setCustomScore] = useState<number>(0);
  const [examinerFeedback, setExaminerFeedback] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/grading/queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        if (data.length > 0) {
          setCustomScore(data[0].ai_suggested_score);
          setExaminerFeedback(data[0].examiner_feedback || "");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const currentItem = queue[currentIndex];

  const handleApproveAIScore = async () => {
    if (!currentItem) return;
    await submitEvaluation(currentItem.ai_suggested_score, "APPROVE");
  };

  const handleOverrideScore = async () => {
    if (!currentItem) return;
    await submitEvaluation(customScore, "OVERRIDE");
  };

  const submitEvaluation = async (score: number, action: "APPROVE" | "OVERRIDE") => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/grading/finalize-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          answer_id: currentItem.answer_id,
          final_score: score,
          examiner_feedback: examinerFeedback,
          action
        })
      });

      if (res.ok) {
        setStatusMessage(`Score of ${score} / ${currentItem.max_marks} recorded successfully.`);
        setTimeout(() => setStatusMessage(null), 3000);

        // Advance to next
        if (currentIndex < queue.length - 1) {
          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          setCustomScore(queue[nextIdx].ai_suggested_score);
          setExaminerFeedback(queue[nextIdx].examiner_feedback || "");
        } else {
          // Re-fetch queue to see updated status
          await fetchQueue();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">AI-Assisted Subjective Grading Portal</h1>
              <p className="text-xs text-slate-500">Human-in-the-loop review for short/long answers, code, and diagrams</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              Queue: {queue.length > 0 ? `${currentIndex + 1} of ${queue.length}` : "0 Items"}
            </span>
          </div>
        </header>

        {/* Grading Workspace */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Loading grading tasks...
          </div>
        ) : !currentItem ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-xs">
              <CheckSquare className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Grading Queue Clean</h3>
              <p className="text-xs text-slate-500 mt-1">
                All candidate subjective submissions and coding evaluations have been reviewed and published.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6 space-y-4">
            {/* Status Alert Banner */}
            {statusMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* 3-Column Split Grading Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
              {/* Left Column: Question & Model Answer */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Question Definition
                  </span>
                  <span className="text-xs font-bold text-[#123B7A] bg-blue-50 px-2 py-0.5 rounded">
                    Max Marks: {currentItem.max_marks}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Question Prompt</h4>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {currentItem.question_text}
                  </p>

                  {currentItem.model_answer && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-500 uppercase">Official Model Answer</h4>
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed font-mono">
                        {currentItem.model_answer}
                      </p>
                    </div>
                  )}
                </div>

                {/* Rubric Criteria if present */}
                {currentItem.rubric && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase">Grading Rubric</span>
                    <div className="space-y-1.5">
                      {currentItem.rubric.map((r: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                          <span>{r.criterion}</span>
                          <span className="font-bold text-slate-900">{r.weight} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Center Column: Student Submission */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Candidate Submission
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {currentItem.student_name}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  {currentItem.student_text_answer && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500">Subjective Response</span>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[160px]">
                        {currentItem.student_text_answer}
                      </div>
                    </div>
                  )}

                  {currentItem.student_code_answer && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500">Code Submission</span>
                      <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto">
                        {currentItem.student_code_answer}
                      </pre>
                    </div>
                  )}

                  {currentItem.student_image_url && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500">Handwritten / Diagram Upload</span>
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <img
                          src={currentItem.student_image_url}
                          alt="Student upload"
                          className="w-full h-48 object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AI Evaluation & Justification */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Evaluation Engine
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    Confidence: {Math.round((currentItem.ai_confidence || 0.85) * 100)}%
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl text-center space-y-1">
                    <span className="text-xs font-semibold text-blue-900">AI Recommended Score</span>
                    <div className="text-3xl font-extrabold text-[#123B7A] font-mono">
                      {currentItem.ai_suggested_score} <span className="text-base text-slate-500 font-normal">/ {currentItem.max_marks}</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      AI Reasoning & Justification
                    </h5>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                      {currentItem.ai_justification}
                    </p>
                  </div>

                  {/* Matched Concepts */}
                  <div>
                    <h5 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Matched Rubric Concepts
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {currentItem.ai_matched_concepts?.map((c: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Concepts */}
                  {currentItem.ai_missing_concepts?.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        Missing Concepts
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {currentItem.ai_missing_concepts?.map((c: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Examiner Action Console */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 w-full md:w-auto flex items-center gap-4">
                <div className="w-32">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Final Score
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    max={currentItem.max_marks}
                    min="0"
                    value={customScore}
                    onChange={(e) => setCustomScore(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Examiner Feedback / Annotation
                  </label>
                  <input
                    type="text"
                    value={examinerFeedback}
                    onChange={(e) => setExaminerFeedback(e.target.value)}
                    placeholder="Provide constructive feedback for candidate..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                <button
                  onClick={handleApproveAIScore}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Approve AI Score ({currentItem.ai_suggested_score})</span>
                </button>

                <button
                  onClick={handleOverrideScore}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Override Score</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
