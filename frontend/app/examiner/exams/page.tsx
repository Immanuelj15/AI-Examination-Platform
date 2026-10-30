"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileCheck2, Plus, ArrowRight, Clock, Video, Eye,
  Copy, Archive, Check, Sparkles, RefreshCw, AlertCircle,
  Award, ShieldAlert, Users, Layers
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function ExaminerExamsListPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/exams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDuplicate = async (id: number) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/exams/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFeedback("✓ Exam duplicated successfully as a new draft.");
        setTimeout(() => setFeedback(null), 3500);
        await fetchExams();
      }
    } catch (e) {
      alert("Failed to duplicate exam.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel or archive this exam?")) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/exams/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(`✓ ${data.message}`);
        setTimeout(() => setFeedback(null), 3500);
        await fetchExams();
      } else {
        const err = await res.json();
        alert(err.detail || "Action failed.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishResults = async (id: number) => {
    if (!confirm("Are you sure you want to finalize and publish results for all candidates in this exam?")) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/exams/${id}/publish-results`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(`✓ ${data.message}`);
        setTimeout(() => setFeedback(null), 3500);
        await fetchExams();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to publish results.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Examinations Orchestration</h1>
              <p className="text-xs text-slate-500">Configure schedules, candidate access, proctoring rules and results</p>
            </div>
          </div>

          <Link
            href="/examiner/exams/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create New Exam</span>
          </Link>
        </header>

        {feedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-8 py-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}

        <main className="p-8 max-w-6xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Managed Examinations</h3>
              <span className="text-xs font-bold text-slate-500">{exams.length} Total Assessments</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Exam Name & Code</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Questions</th>
                    <th className="py-3 px-4">Candidates</th>
                    <th className="py-3 px-4">Proctoring</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr key="loading-examiner-exams">
                      <td colSpan={7} className="py-12 text-center">
                        <RefreshCw className="w-6 h-6 text-[#123B7A] animate-spin mx-auto mb-2" />
                        <span className="text-xs text-slate-500 font-semibold">Loading examinations...</span>
                      </td>
                    </tr>
                  ) : exams.length === 0 ? (
                    <tr key="empty-examiner-exams">
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No examinations found. Click "+ Create New Exam" to begin.
                      </td>
                    </tr>
                  ) : (
                    exams.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 text-sm">{ex.title}</p>
                          <p className="text-[11px] font-mono text-slate-500 font-medium">{ex.code}</p>
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
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{ex.duration_minutes} min</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{ex.question_count} Qs ({ex.total_marks} Marks)</td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-600">{ex.candidate_count || 0} Students</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                            {ex.camera_required ? "Camera + Landmarker" : "Standard"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicate(ex.id)}
                              disabled={actionLoading === ex.id}
                              title="Duplicate Exam as Draft"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Publish Results */}
                            <button
                              onClick={() => handlePublishResults(ex.id)}
                              disabled={actionLoading === ex.id}
                              title="Publish Results to Candidates"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#123B7A] hover:bg-blue-50 transition-colors"
                            >
                              <Award className="w-4 h-4" />
                            </button>

                            {/* Delete/Cancel/Archive */}
                            <button
                              onClick={() => handleDeleteOrCancel(ex.id)}
                              disabled={actionLoading === ex.id}
                              title="Cancel / Archive Exam"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </div>
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
