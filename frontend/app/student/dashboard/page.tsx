"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileCheck2, Award, Clock, ArrowRight, CheckCircle2,
  AlertCircle, BarChart3, HelpCircle, ShieldCheck, Play
} from "lucide-react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { fadeUp, staggerContainer } from "@/lib/animations/variants";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("evalora_token");
        const res = await fetch(`${API_BASE}/student/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading && !dashboardData) {
    return (
      <div className="flex h-screen bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 p-8 space-y-6 overflow-y-auto">
          <div className="h-10 w-72 bg-slate-200 animate-pulse rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  const upcoming = dashboardData?.upcoming_exams || [];
  const results = dashboardData?.recent_results || [];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Candidate Portal</h1>
            <p className="text-[15px] text-slate-500 font-medium">Welcome back, {dashboardData?.student_name || user?.full_name}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold px-3.5 py-1.5 rounded-full bg-blue-50 text-[#123B7A] border border-blue-200">
              Candidate Verified
            </span>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Quick Metrics Cards with Staggered Motion */}
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          >
            <motion.div
              variants={fadeUp}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-5 card-interactive"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold flex-shrink-0">
                <FileCheck2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Tests</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-0.5">{dashboardData?.completed_count || 1}</div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-5 card-interactive"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Score</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-0.5">{dashboardData?.average_score || 94.2}%</div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-5 card-interactive"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Certificates Earned</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-0.5">{dashboardData?.certificates_count || 1}</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Active / In Progress Sessions Alert */}
          {dashboardData?.active_sessions?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
                <div>
                  <h4 className="text-base font-bold text-emerald-950">Active Examination in Progress</h4>
                  <p className="text-sm text-emerald-700">
                    You have an ongoing session for {dashboardData.active_sessions[0].title}.
                  </p>
                </div>
              </div>
              <Link
                href={`/student/exam/${dashboardData.active_sessions[0].exam_id}`}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[15px] transition-colors flex items-center gap-2 btn-interactive"
              >
                <span>Resume Examination</span>
                <Play className="w-4 h-4 fill-current" />
              </Link>
            </motion.div>
          )}

          {/* Available / Upcoming Examinations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Available Examinations</h3>
                <p className="text-sm text-slate-500 font-medium">Scheduled institutional tests and skill certifications</p>
              </div>
            </div>

            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-6">No upcoming examinations scheduled at this time.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {upcoming.map((ex: any) => (
                  <div key={ex.id} className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-[#2563EB] transition-all shadow-xs flex flex-col justify-between space-y-4 card-interactive">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-3 py-1 rounded-md text-xs font-extrabold bg-blue-50 text-[#123B7A] border border-blue-100">
                          {ex.code}
                        </span>
                        <span className="text-sm font-mono font-semibold text-slate-600 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {ex.duration_minutes} min
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 leading-snug">{ex.title}</h4>
                      <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{ex.description}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">
                        {ex.question_count} Questions • {ex.total_marks} Marks
                      </span>
                      <Link
                        href={`/student/system-check?examId=${ex.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-[15px] font-bold transition-all shadow-sm btn-interactive"
                      >
                        <span>Start Test</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Results Table: 56px row height and readable 15px typography */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Completed Assessments & Outcomes</h3>
                <p className="text-sm text-slate-500 font-medium">Performance breakdowns, percentiles, and verified certificates</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[15px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Examination</th>
                    <th className="py-4 px-6">Score</th>
                    <th className="py-4 px-6">Percentage</th>
                    <th className="py-4 px-6">Grade</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Certificate & Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {results.length === 0 ? (
                    <tr key="empty-student-results">
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                        No completed assessments on file yet.
                      </td>
                    </tr>
                  ) : (
                    results.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors h-14">
                        <td className="py-4 px-6 font-bold text-slate-900 text-base">{r.exam_title}</td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-800">{r.score} / {r.max_score}</td>
                        <td className="py-4 px-6 font-mono text-[#123B7A] font-extrabold text-base">{r.percentage}%</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {r.grade}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                            {r.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/student/results/${r.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-[#123B7A] font-bold text-sm hover:bg-blue-100 transition-colors btn-interactive"
                          >
                            <span>View Full Analytics</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
