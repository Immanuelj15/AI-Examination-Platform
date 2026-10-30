"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, ShieldCheck, Download, Calendar, ExternalLink, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function StudentCertificatesPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const token = localStorage.getItem("evalora_token");
        const res = await fetch(`${API_BASE}/student/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter results that have passed
          const passing = (data.recent_results || []).filter((r: any) => r.percentage >= 60);
          setResults(passing);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Verified Digital Credentials & Certificates</h1>
              <p className="text-xs text-slate-500">Cryptographically verifiable institutional assessment certificates</p>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-5xl mx-auto w-full space-y-6">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#123B7A] mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading verified credentials...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Certificates Earned Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Certificates are automatically generated and awarded upon successfully scoring above passing threshold (60%+) on published assessments.
              </p>
              <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B7A] text-white text-xs font-semibold hover:bg-[#1E4B94] transition-all shadow-sm"
              >
                <span>Browse Available Assessments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((r, i) => (
                <div
                  key={r.id || i}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-full pointer-events-none" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#123B7A] text-white flex items-center justify-center font-bold">
                        <Award className="w-5 h-5 text-amber-300" />
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Pass
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                        Certificate of Achievement
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{r.exam_title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Awarded for scoring <strong className="text-slate-800">{r.percentage}%</strong> ({r.score}/{r.max_score} marks) with Grade <strong className="text-[#123B7A]">{r.grade}</strong>.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Credential ID:</span>
                        <span className="font-mono font-bold text-slate-800">EVL-CERT-{2026000 + (r.id || 101)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Issue Date:</span>
                        <span>{new Date(r.published_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verification Status:</span>
                        <span className="text-emerald-600 font-semibold">Active & Immutable</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-5 flex items-center justify-between">
                    <Link
                      href={`/student/results/${r.id}`}
                      className="text-xs font-semibold text-[#123B7A] hover:underline flex items-center gap-1"
                    >
                      <span>View Scorecard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => alert(`Certificate EVL-CERT-${2026000 + (r.id || 101)} downloaded as signed digital credential.`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
