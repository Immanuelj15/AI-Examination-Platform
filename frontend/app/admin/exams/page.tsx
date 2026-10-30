"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileCheck2, Plus, Search, Calendar, Clock, Award, Users, CheckCircle, Shield, AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
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
    fetchExams();
  }, []);

  const filtered = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || e.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Enterprise Examination Oversight</h1>
              <p className="text-xs text-slate-500">Monitor all institutional assessments, schedules, and proctoring policies</p>
            </div>
          </div>

          <Link
            href="/examiner/exams/create"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#123B7A] text-white text-xs font-semibold hover:bg-[#1E4B94] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Exam Wizard</span>
          </Link>
        </header>

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search assessments by title or code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
              />
            </div>

            <div className="flex items-center gap-2">
              {["ALL", "PUBLISHED", "ACTIVE", "DRAFT", "COMPLETED"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === status
                      ? "bg-[#123B7A] text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Assessment</th>
                    <th className="px-6 py-3.5">Duration</th>
                    <th className="px-6 py-3.5">Marks & Pass</th>
                    <th className="px-6 py-3.5">Proctoring Lock</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.length === 0 ? (
                    <tr key="empty-exams">
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No examinations match the selected query.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(ex => (
                      <tr key={ex.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{ex.title}</div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">{ex.code}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {ex.duration_minutes} minutes
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{ex.total_marks} Marks</div>
                          <div className="text-[10px] text-slate-400">Pass: {ex.passing_percentage}%</div>
                        </td>
                        <td className="px-6 py-4">
                          {ex.camera_required ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              <Shield className="w-3 h-3" /> AI Vision Active
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Standard</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              ex.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : ex.status === "PUBLISHED"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {ex.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href="/admin/live-monitoring"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#123B7A] hover:underline"
                          >
                            Live Sessions →
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
