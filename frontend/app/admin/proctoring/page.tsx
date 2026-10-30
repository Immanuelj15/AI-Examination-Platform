"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Video, AlertTriangle, Eye, ArrowRight, UserCheck, ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ProctoringReviewDrawer } from "@/components/ProctoringReviewDrawer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AdminProctoringPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedCandidateName, setSelectedCandidateName] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchProctorData = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("evalora_token") : null;
      const res = await fetch(`${API_BASE}/proctoring/sessions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProctorData();
  }, []);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">AI Proctoring Intelligence & Signal Stream</h1>
              <p className="text-xs text-slate-500">Autonomous multi-signal computer vision telemetry across active examinations</p>
            </div>
          </div>

          <Link
            href="/admin/live-monitoring"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#123B7A] text-white text-xs font-semibold hover:bg-[#1E4B94] transition-all shadow-sm"
          >
            <Video className="w-4 h-4" />
            <span>Open Real-Time Grid</span>
          </Link>
        </header>

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Top diagnostic stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Monitored Examinees</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{sessions.length}</div>
              <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle className="w-3.5 h-3.5" /> 10-second vision heartbeat
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Flagged Sessions</div>
              <div className="text-2xl font-bold text-rose-600 mt-1">
                {sessions.filter(s => s.is_flagged || s.suspicion_score > 35).length}
              </div>
              <div className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Exceeds integrity threshold
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Suspicion Index</div>
              <div className="text-2xl font-bold text-[#123B7A] mt-1">
                {sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + (s.suspicion_score || 0), 0) / sessions.length) : 0}
                <span className="text-xs text-slate-400 font-normal"> / 100</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Multi-factor algorithmic weighting</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Client Privacy Status</div>
              <div className="text-sm font-bold text-slate-900 mt-2">Zero Raw Video Stored</div>
              <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Edge inference only
              </div>
            </div>
          </div>

          {/* Session Proctoring Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#123B7A]" />
              Active Proctoring Sessions & Incident Logs
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Session & Candidate</th>
                    <th className="px-5 py-3">Assessment</th>
                    <th className="px-5 py-3">Suspicion Score</th>
                    <th className="px-5 py-3">Last Known Incident</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.length === 0 ? (
                    <tr key="empty-proctoring-sessions">
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        No active proctoring telemetry feeds available.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s, idx) => {
                      const score = s.suspicion_score || 0;
                      const badgeColor =
                        score > 50 ? "bg-rose-100 text-rose-700 border-rose-200" :
                        score > 25 ? "bg-amber-100 text-amber-700 border-amber-200" :
                        "bg-emerald-100 text-emerald-700 border-emerald-200";

                      return (
                        <tr key={s.id ?? `proctor-session-${idx}`} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{s.student?.full_name || `Candidate #${s.student_id}`}</div>
                            <div className="text-[11px] text-slate-400 font-mono">Session ID: {s.id}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-slate-800">{s.exam?.title || "Assessment"}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${badgeColor}`}>
                                {score} / 100
                              </span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${score > 50 ? "bg-rose-500" : score > 25 ? "bg-amber-500" : "bg-emerald-500"}`}
                                  style={{ width: `${Math.min(100, score)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {s.latest_event ? (
                              <span className="text-[11px] font-medium text-slate-600">
                                {s.latest_event.event_type} ({s.latest_event.severity})
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">No anomalies detected</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                              {s.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => {
                                const ev = (s.recent_events && s.recent_events[0]) || s.latest_event || {
                                  id: s.id,
                                  event_type: s.suspicion_score > 35 ? "SUSPICION_ALERT" : "NORMAL_MONITORING",
                                  severity: s.suspicion_level || "LOW",
                                  time: "Recent",
                                  confidence: 0.92,
                                  details: { suspicion_score: s.suspicion_score, camera_status: s.camera_status }
                                };
                                setSelectedEvent(ev);
                                setSelectedCandidateName(s.candidate_name || s.student?.full_name || `Candidate #${s.student_id}`);
                                setDrawerOpen(true);
                              }}
                              className="text-xs font-semibold text-[#123B7A] hover:underline"
                            >
                              Review Incidents →
                            </button>
                            <Link
                              href="/admin/live-monitoring"
                              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                            >
                              Live Grid
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Review Drawer */}
      <ProctoringReviewDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        event={selectedEvent}
        candidateName={selectedCandidateName}
        onStatusUpdated={() => fetchProctorData()}
      />
    </div>
  );
}
