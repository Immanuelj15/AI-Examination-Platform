"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, BarChart3, ArrowRight, ShieldCheck } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function StudentResultsListPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("evalora_token");
        const res = await fetch(`${API_BASE}/results`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Candidate Results & Score Reports</h1>
              <p className="text-xs text-slate-500">Official transcripts, percentiles, and verified certificates</p>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">All Examination Outcomes</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Examination</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr key="loading-results">
                      <td colSpan={6} className="py-8 text-center text-slate-400">Loading results...</td>
                    </tr>
                  ) : results.length === 0 ? (
                    <tr key="empty-results">
                      <td colSpan={6} className="py-8 text-center text-slate-400">No results recorded yet.</td>
                    </tr>
                  ) : (
                    results.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{r.exam_title}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{r.total_score} / {r.max_score}</td>
                        <td className="py-3.5 px-4 font-mono text-[#123B7A] font-bold">{r.percentage}%</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {r.grade}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/student/results/${r.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-blue-50 text-[#123B7A] font-bold text-[11px] hover:bg-blue-100 transition-colors"
                          >
                            <span>View Full Analytics</span>
                            <ArrowRight className="w-3 h-3" />
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
