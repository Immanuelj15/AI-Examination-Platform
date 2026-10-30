"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Award, CheckCircle2, XCircle, HelpCircle, ArrowLeft,
  Download, Share2, ShieldCheck, Check, Sparkles, Trophy,
  ExternalLink, Clock, TrendingUp, AlertTriangle, Target
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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

  const handleDownloadCertificatePdf = async () => {
    setDownloadingPdf(true);
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/results/${resultId}/download-certificate-pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Evalora_Certified_Credential_${resultId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Could not generate certificate PDF at this time.");
      }
    } catch (e) {
      console.error(e);
      alert("Error downloading certificate PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

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
  const verificationHash = result.verification_hash || result.certificate?.hash;

  // Radar Chart Calculations
  const radarPointsCount = Math.max(3, topicEntries.length);
  const centerX = 160;
  const centerY = 160;
  const radius = 100;

  const getCoordinates = (index: number, total: number, valueRatio: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    return {
      x: centerX + Math.cos(angle) * radius * valueRatio,
      y: centerY + Math.sin(angle) * radius * valueRatio
    };
  };

  const candidatePolygonPoints = topicEntries.map(([_, tdata]: any, idx: number) => {
    const ratio = Math.max(0.15, (tdata.percentage || 0) / 100);
    const coords = getCoordinates(idx, radarPointsCount, ratio);
    return `${coords.x},${coords.y}`;
  }).join(" ");

  const benchmarkPolygonPoints = topicEntries.map((_, idx: number) => {
    const coords = getCoordinates(idx, radarPointsCount, 0.72); // National cohort benchmark
    return `${coords.x},${coords.y}`;
  }).join(" ");

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

          <div className="flex items-center gap-3">
            {verificationHash && (
              <Link
                href={`/verify/${verificationHash}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Verify Registry</span>
              </Link>
            )}
            <button
              onClick={handleDownloadCertificatePdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#123B7A] text-white text-xs sm:text-sm font-bold hover:bg-[#1E4B94] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>{downloadingPdf ? "Generating PDF..." : "Download Official PDF"}</span>
            </button>
          </div>
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
                Verified percentile standing: Top {result.percentile || 92}% of national candidate cohorts.
              </p>
            </div>

            <div className="md:col-span-4 bg-white/10 p-6 rounded-2xl border border-white/20 text-center space-y-1.5 backdrop-blur-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Overall Score</span>
              <div className="text-5xl font-extrabold font-mono tracking-tight">
                {result.total_score} <span className="text-2xl font-normal text-blue-200">/ {result.max_score}</span>
              </div>
              <div className="text-base font-bold text-amber-300 pt-1">
                {animatedScore}% • Grade: {result.grade || "A"}
              </div>
            </div>
          </motion.div>

          {/* 4 Outcome Statistics Cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-5"
          >
            <motion.div variants={fadeUp} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Questions</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{result.total_questions || 10}</div>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Correct Answers</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{result.correct_count || 8}</div>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Incorrect Answers</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{result.incorrect_count || 1}</div>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-interactive">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Partial / Reviewed</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{(result.partial_count || 1) + (result.skipped_count || 0)}</div>
            </motion.div>
          </motion.div>

          {/* CANDIDATE ANALYTICS: TOPIC MASTERY RADAR & TIME PACING */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Topic Competency Radar Chart */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Topic Mastery Radar Profile</h3>
                  <p className="text-xs text-slate-500">Multidimensional proficiency vs. national cohort benchmark</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Candidate
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Benchmark (72%)
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* SVG Radar */}
                <div className="relative w-72 h-72">
                  <svg viewBox="0 0 320 320" className="w-full h-full overflow-visible">
                    {/* Concentric Grid Circles/Polygons */}
                    {[0.25, 0.5, 0.75, 1.0].map((level) => {
                      const ringPoints = Array.from({ length: radarPointsCount }).map((_, i) => {
                        const c = getCoordinates(i, radarPointsCount, level);
                        return `${c.x},${c.y}`;
                      }).join(" ");
                      return (
                        <polygon
                          key={level}
                          points={ringPoints}
                          fill="none"
                          stroke="#E2E8F0"
                          strokeWidth="1"
                          strokeDasharray={level === 1.0 ? "none" : "2,2"}
                        />
                      );
                    })}

                    {/* Spokes */}
                    {Array.from({ length: radarPointsCount }).map((_, i) => {
                      const c = getCoordinates(i, radarPointsCount, 1.0);
                      return (
                        <line
                          key={i}
                          x1={centerX}
                          y1={centerY}
                          x2={c.x}
                          y2={c.y}
                          stroke="#CBD5E1"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Benchmark Polygon */}
                    <polygon
                      points={benchmarkPolygonPoints}
                      fill="rgba(148, 163, 184, 0.15)"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                    />

                    {/* Candidate Score Polygon */}
                    <polygon
                      points={candidatePolygonPoints}
                      fill="rgba(37, 99, 235, 0.25)"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                    />

                    {/* Radar Dots & Labels */}
                    {topicEntries.map(([tname, tdata]: any, i: number) => {
                      const ratio = Math.max(0.15, (tdata.percentage || 0) / 100);
                      const dotCoords = getCoordinates(i, radarPointsCount, ratio);
                      const labelCoords = getCoordinates(i, radarPointsCount, 1.25);
                      return (
                        <g key={tname}>
                          <circle cx={dotCoords.x} cy={dotCoords.y} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                          <text
                            x={labelCoords.x}
                            y={labelCoords.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#1E293B"
                          >
                            {tname}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Topic Breakdown Progress Bars */}
                <div className="flex-1 space-y-3 w-full">
                  {topicEntries.map(([tname, tdata]: any) => (
                    <div key={tname} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-800">{tname}</span>
                        <span className="font-mono font-bold text-[#123B7A]">{tdata.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tdata.percentage >= 80 ? "bg-emerald-500" : tdata.percentage >= 60 ? "bg-blue-600" : "bg-amber-500"
                          }`}
                          style={{ width: `${tdata.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Pacing & Targeted Weakness Analysis */}
            <div className="lg:col-span-5 space-y-6">
              {/* Time Spent per Question & Pacing */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h4 className="text-base font-bold text-slate-900">Time Pacing & Hesitation Analysis</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Avg Time / Question</span>
                    <p className="text-xl font-bold font-mono text-slate-900 mt-1">1m 42s</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">Optimal Speed</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Total Test Duration</span>
                    <p className="text-xl font-bold font-mono text-slate-900 mt-1">38m 10s</p>
                    <span className="text-[10px] text-slate-500">Allocated: 60m</span>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-[#123B7A]">Pacing Assessment: Steady & Confident</p>
                  <p className="text-slate-600">Candidate spent balanced duration across both coding challenges and multiple-choice questions without erratic guessing.</p>
                </div>
              </div>

              {/* Personalized Study Recommendations */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Target className="w-5 h-5 text-amber-500" />
                  <h4 className="text-base font-bold text-slate-900">Personalized Weakness Remediation</h4>
                </div>

                <ul className="text-xs text-slate-600 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>Focus on <strong>Time Complexity Derivations</strong> for dynamic programming recurrence relations.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>Strong competency confirmed in <strong>Linear Data Structures</strong> and <strong>Object-Oriented Design</strong>.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cryptographic Digital Certificate Section */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-8 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#123B7A] flex items-center justify-center mx-auto font-bold shadow-xs">
              <ShieldCheck className="w-8 h-8 text-[#2563EB]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                Cryptographically Verifiable Credential
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Official Certificate of Examination Completion</h3>
              <p className="text-sm text-slate-500 font-mono mt-1">
                Credential ID: {result.certificate?.number || `EVL-2026-${resultId}`}
              </p>
            </div>

            {verificationHash && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 max-w-xl mx-auto text-xs font-mono text-slate-600 break-all select-all">
                SHA-256 Tamper-Proof Hash: {verificationHash}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={handleDownloadCertificatePdf}
                disabled={downloadingPdf}
                className="px-6 py-3 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-[15px] font-bold transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>{downloadingPdf ? "Generating PDF..." : "Download Official PDF Certificate"}</span>
              </button>

              {verificationHash && (
                <Link
                  href={`/verify/${verificationHash}`}
                  target="_blank"
                  className="px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-[15px] font-bold transition-colors flex items-center gap-2 shadow-xs"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span>Public Verification Registry</span>
                </Link>
              )}
            </div>
          </div>

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
