"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileCheck2, CheckSquare, Users, Video, ShieldAlert,
  Sparkles, Plus, ArrowRight, Clock, Award, BookOpen,
  Calendar, CheckCircle2, Layers, RefreshCw, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function ExaminerDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("evalora_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, examsRes] = await Promise.all([
        fetch(`${API_BASE}/examiner/dashboard`, { headers }),
        fetch(`${API_BASE}/exams`, { headers })
      ]);

      if (dashRes.ok) {
        const resData = await dashRes.json();
        setData(resData);
      }
      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExams(examsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const totalExams = data?.total_exams ?? exams.length;
  const draftExams = data?.draft_exams ?? exams.filter(e => e.status === "DRAFT").length;
  const scheduledExams = data?.scheduled_exams ?? exams.filter(e => e.status === "SCHEDULED").length;
  const liveExams = data?.live_exams ?? exams.filter(e => e.status === "LIVE" || e.status === "ACTIVE").length;
  const completedExams = data?.completed_exams ?? exams.filter(e => e.status === "COMPLETED").length;
  const pendingGrading = data?.pending_grading_count ?? 0;
  const questionBankCount = data?.question_bank_count ?? data?.total_questions_count ?? 12;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, Examiner
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Create assessments, manage your question bank and evaluate candidate performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/examiner/question-bank/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>+ Add Question</span>
            </Link>

            <Link
              href="/examiner/exams/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-sm font-bold transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Exam</span>
            </Link>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* STATS TILES (7 Specified Statistics) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {/* 1: My Exams */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">My Exams</span>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalExams}</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1">+3 this month</span>
            </div>

            {/* 2: Draft Exams */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Draft Exams</span>
              <div className="text-2xl font-black text-amber-600 mt-2 font-mono">{draftExams}</div>
              <span className="text-[11px] text-slate-400 font-medium mt-1">Incomplete drafts</span>
            </div>

            {/* 3: Scheduled Exams */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Scheduled</span>
              <div className="text-2xl font-black text-[#123B7A] mt-2 font-mono">{scheduledExams}</div>
              <span className="text-[11px] text-slate-400 font-medium mt-1">Upcoming access</span>
            </div>

            {/* 4: Live Exams */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Live Exams</span>
              <div className="text-2xl font-black text-emerald-600 mt-2 font-mono">{liveExams}</div>
              <span className="text-[11px] text-emerald-700 font-medium mt-1">Active sessions</span>
            </div>

            {/* 5: Completed Exams */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed</span>
              <div className="text-2xl font-black text-slate-700 mt-2 font-mono">{completedExams}</div>
              <span className="text-[11px] text-slate-400 font-medium mt-1">Archived/Finished</span>
            </div>

            {/* 6: Pending Grading */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between bg-amber-50/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending Grading</span>
              <div className="text-2xl font-black text-amber-700 mt-2 font-mono">{pendingGrading}</div>
              <span className="text-[11px] text-amber-800 font-semibold mt-1">Awaiting review</span>
            </div>

            {/* 7: Question Bank */}
            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs flex flex-col justify-between bg-blue-50/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#123B7A]">Question Bank</span>
              <div className="text-2xl font-black text-[#123B7A] mt-2 font-mono">{questionBankCount}</div>
              <span className="text-[11px] text-[#123B7A] font-semibold mt-1">Questions available</span>
            </div>
          </div>

          {/* Quick Action Highlights Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/examiner/grading"
              className="p-5 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-50 transition-colors shadow-xs flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Action Required</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">Review AI Grading Queue</h4>
                <p className="text-xs text-slate-600 mt-1">{pendingGrading} candidate answers pending subjective review</p>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-700" />
            </Link>

            <Link
              href="/examiner/question-bank"
              className="p-5 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-50 transition-colors shadow-xs flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#123B7A]">Repository</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">Manage Question Bank</h4>
                <p className="text-xs text-slate-600 mt-1">Organize multilingual items, rubrics & code problems</p>
              </div>
              <BookOpen className="w-5 h-5 text-[#123B7A]" />
            </Link>

            <Link
              href="/examiner/exams/new"
              className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 transition-colors shadow-xs flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Fast Launch</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">Create New Examination</h4>
                <p className="text-xs text-slate-600 mt-1">7-step assessment wizard with AI proctoring</p>
              </div>
              <Sparkles className="w-5 h-5 text-emerald-700" />
            </Link>
          </div>

          {/* Active Assessments Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Your Active & Scheduled Examinations</h3>
                <p className="text-xs text-slate-500">Live monitoring, candidate roster status, and evaluation tracking</p>
              </div>
              <Link
                href="/examiner/exams"
                className="text-xs font-bold text-[#123B7A] hover:underline flex items-center gap-1"
              >
                <span>View All Exams</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Assessment Title</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Questions</th>
                    <th className="py-3 px-4">Proctoring Telemetry</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr key="loading-dashboard-exams">
                      <td colSpan={7} className="py-12 text-center">
                        <RefreshCw className="w-6 h-6 text-[#123B7A] animate-spin mx-auto mb-2" />
                        <span className="text-xs text-slate-500 font-semibold">Loading assessment dashboard...</span>
                      </td>
                    </tr>
                  ) : exams.length === 0 ? (
                    <tr key="empty-dashboard-exams">
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No assessments created yet. Click "+ Create New Exam" to begin.
                      </td>
                    </tr>
                  ) : (
                    exams.slice(0, 5).map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-slate-900 text-sm">
                          {ex.title}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-500">
                          {ex.code}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ex.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : ex.status === "ACTIVE" || ex.status === "LIVE"
                              ? "bg-blue-50 text-[#123B7A] border border-blue-200"
                              : ex.status === "DRAFT"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {ex.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {ex.duration_minutes} min
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {ex.question_count} Qs
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-semibold text-slate-600">
                            {ex.camera_required ? "Camera + AI Landmarker" : "Standard"}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <Link
                            href="/examiner/exams"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#123B7A] hover:underline"
                          >
                            <span>Manage</span>
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
