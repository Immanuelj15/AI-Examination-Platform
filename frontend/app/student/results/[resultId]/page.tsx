"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Award, CheckCircle2, XCircle, HelpCircle, ArrowLeft,
  Download, Share2, ShieldCheck, Check, Sparkles, Trophy
} from "lucide-react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { fadeUp, staggerContainer } from "@/lib/animations/variants";
import confetti from "canvas-confetti";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function StudentResultDetailPage({ params }: { params: Promise<{ resultId: string }> }) {
  const resolvedParams = use(params);
  const resultId = resolvedParams.resultId;

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("evalora_token");
        const res = await fetch(`${API_BASE}/results/${resultId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setResult(data);

          // Animate score counter smoothly from 0 to percentage
          const target = data.percentage || 0;
          let current = 0;
          const step = Math.max(1, Math.floor(target / 40));
          const interval = setInterval(() => {
            current += step;
            if (current >= target) {
              setAnimatedScore(target);
              clearInterval(interval);
            } else {
              setAnimatedScore(current);
            }
          }, 25);

          // Trigger celebratory confetti for high scores
          if (data.percentage >= 70) {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 }
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resultId]);

  if (loading || !result) {
    return (
      <div className="flex h-screen bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 p-8 space-y-6 overflow-y-auto">
          <div className="h-10 w-72 bg-slate-200 animate-pulse rounded-xl" />
          <div className="h-44 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topicEntries = Object.entries(result.topic_breakdown || {});

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link
              href="/student/dashboard"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors btn-interactive"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{result.exam_title} — Official Performance Report</h1>
              <p className="text-sm text-slate-500 font-medium">Candidate: {result.student_name} • Status: {result.status}</p>
            </div>
          </div>

          {result.certificate && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => alert(`Certificate #${result.certificate.number} cryptographic verification confirmed.`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#123B7A] text-white text-[15px] font-bold hover:bg-[#1E4B94] transition-colors shadow-sm btn-interactive"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Verified Certificate</span>
              </button>
            </div>
          )}
        </header>

        <main className="p-8 max-w-6xl mx-auto w-full space-y-8">
          {/* Top Score Banner with Animated Counter */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-[#123B7A] via-[#16448D] to-[#1E4B94] rounded-2xl p-8 sm:p-10 text-white shadow-md grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
          >
            <div className="md:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-sm font-semibold text-blue-100">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Performance Outcome Certified</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {result.percentage >= 75 ? "Distinction Achieved!" : "Assessment Completed"}
              </h2>
              <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-xl">
                Your examination has been evaluated across all technical competencies.
                Verified percentile standing: Top {result.percentile}% of national candidate cohorts.
              </p>
            </div>

            <div className="md:col-span-4 bg-white/10 p-6 rounded-2xl border border-white/20 text-center space-y-1.5 backdrop-blur-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Overall Score</span>
              <div className="text-5xl font-extrabold font-mono tracking-tight">
                {result.total_score} <span className="text-2xl font-normal text-blue-200">/ {result.max_score}</span>
              </div>
              <div className="text-base font-bold text-amber-300 pt-1">
                {animatedScore}% • Grade: {result.grade}
              </div>
            </div>
          </motion.div>

          {/* 4 Outcome Statistics Cards with Staggered Motion */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-5"
          >
            <motion.div variants={fadeUp} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Questions</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{result.total_questions}</div>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Correct Answers</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{result.correct_count}</div>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Incorrect Answers</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{result.incorrect_count}</div>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Partial / Reviewed</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{result.partial_count + result.skipped_count}</div>
            </motion.div>
          </motion.div>

          {/* Topic-Wise Competency Analysis */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Topic-Level Competency Breakdown</h3>
                <p className="text-sm text-slate-500 font-medium">Detailed subject proficiency scores across curriculum domains</p>
              </div>
            </div>

            <div className="space-y-5">
              {topicEntries.map(([tname, tdata]: any) => (
                <div key={tname} className="space-y-2">
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="font-bold text-slate-800">{tname}</span>
                    <span className="font-mono font-bold text-[#123B7A]">{tdata.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        tdata.percentage >= 80 ? "bg-emerald-500" : tdata.percentage >= 60 ? "bg-blue-600" : "bg-amber-500"
                      }`}
                      style={{ width: `${tdata.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Certificate Section */}
          {result.certificate && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-8 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#123B7A] flex items-center justify-center mx-auto font-bold shadow-xs">
                <ShieldCheck className="w-8 h-8 text-[#2563EB]" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                  Official Digital Credential
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">Certificate of Assessment Completion</h3>
                <p className="text-sm text-slate-500 font-mono mt-1">
                  Credential ID: {result.certificate.number}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 max-w-xl mx-auto text-xs font-mono text-slate-600 truncate">
                SHA-256 Verification Hash: {result.certificate.hash}
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => alert(`Certificate ${result.certificate.number} downloaded.`)}
                  className="px-6 py-3 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-[15px] font-bold transition-colors flex items-center gap-2 btn-interactive"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Certificate</span>
                </button>
              </div>
            </div>
          )}

          {/* Question-Level Feedback */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Question-Level Evaluation & Model Explanations</h3>
              <p className="text-sm text-slate-500 font-medium">Review your responses, correct answers, and AI grading rationale</p>
            </div>

            <div className="space-y-4">
              {result.question_breakdown?.map((q: any, idx: number) => (
                <div key={idx} className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-base">Question {idx + 1} ({q.question_type})</span>
                    <span className="font-mono font-bold text-[#123B7A] text-base bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                      Marks: {q.marks_awarded} / {q.marks}
                    </span>
                  </div>

                  <p className="text-slate-800 text-[16px] font-medium leading-relaxed">{q.question_text}</p>

                  {q.explanation && (
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-slate-700 text-sm sm:text-[15px] leading-relaxed">
                      <span className="font-bold text-[#123B7A]">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}

                  {q.examiner_feedback && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-sm sm:text-[15px] leading-relaxed">
                      <span className="font-bold">Examiner Feedback: </span>
                      {q.examiner_feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
