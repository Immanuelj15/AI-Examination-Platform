"use client";

import React, { useEffect, useState } from "react";
import {
  Video, Eye, ShieldAlert, AlertTriangle, RefreshCw,
  Clock, Search, UserCheck, XCircle, Bell, Wifi, Camera
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ProctoringReviewDrawer } from "@/components/ProctoringReviewDrawer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function ExaminerLivePage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLive = async () => {
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/proctoring/live-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
        if (!selectedCandidate && data.length > 0) {
          setSelectedCandidate(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const timer = setInterval(fetchLive, 8000);
    return () => clearInterval(timer);
  }, []);

  const filtered = candidates.filter((c) => {
    const matchesRisk = filterRisk === "ALL" || c.suspicion_level === filterRisk;
    const matchesSearch = c.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
                          c.exam_title.toLowerCase().includes(search.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-18 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Examiner Live Assessment Feed</h1>
              <p className="text-sm text-slate-500">Live candidate monitoring, telemetry status, and suspicion scoring</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Engine Connected</span>
            </div>
            <button
              onClick={fetchLive}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 btn-interactive transition-all"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Candidate Table */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 overflow-y-auto p-6 lg:p-8 space-y-5">
            {/* Filters */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter candidate or assessment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20 transition-all shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                {["ALL", "LOW", "MEDIUM", "HIGH"].map((risk) => (
                  <button
                    key={risk}
                    onClick={() => setFilterRisk(risk)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      filterRisk === risk
                        ? "bg-[#123B7A] text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {risk}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">Assessment</th>
                      <th className="px-6 py-4">Remaining</th>
                      <th className="px-6 py-4">Camera</th>
                      <th className="px-6 py-4">Suspicion</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filtered.map((c) => {
                      const isSelected = selectedCandidate?.session_id === c.session_id;
                      return (
                        <tr
                          key={c.session_id}
                          onClick={() => setSelectedCandidate(c)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50/80 font-medium" : "hover:bg-slate-50/70"
                          }`}
                        >
                          <td className="px-6 py-4 font-bold text-slate-900 text-[15px]">{c.candidate_name}</td>
                          <td className="px-6 py-4 text-slate-600">{c.exam_title}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-slate-700">
                              <Clock className="w-4 h-4 text-slate-400" />
                              {c.time_remaining}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
                              <Camera className="w-4 h-4" /> {c.camera_status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full font-bold text-xs inline-block ${
                                c.suspicion_level === "HIGH"
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : c.suspicion_level === "MEDIUM"
                                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                                  : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {c.suspicion_score} ({c.suspicion_level})
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Detail Panel */}
          <div className="w-96 border-l border-slate-200 bg-white p-6 flex flex-col justify-between overflow-y-auto">
            {selectedCandidate ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Telemetry</h3>
                  <p className="text-xl font-bold text-slate-900 mt-1">{selectedCandidate.candidate_name}</p>
                  <p className="text-sm text-slate-500">{selectedCandidate.exam_title}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Session ID:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedCandidate.session_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Connection:</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5" /> Online
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Calculated Suspicion:</span>
                    <span className="font-bold text-rose-600 text-base">{selectedCandidate.suspicion_score} / 100</span>
                  </div>
                </div>

                {/* Incident Event Timeline */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">Incident Event Timeline</h4>
                  <div className="space-y-2.5">
                    {(selectedCandidate.recent_events || selectedCandidate.timeline || []).map((item: any, i: number) => (
                      <button
                        key={item.id || i}
                        onClick={() => {
                          setSelectedEvent({
                            id: item.id || 100 + i,
                            event_type: item.event_type || item.event || "INCIDENT",
                            severity: item.severity || "MEDIUM",
                            duration_ms: item.duration_ms,
                            confidence: item.confidence,
                            face_count: item.face_count,
                            review_status: item.review_status || "UNREVIEWED",
                            examiner_notes: item.examiner_notes,
                            time: item.time,
                            details: item.details
                          });
                          setDrawerOpen(true);
                        }}
                        className="w-full text-left flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#123B7A]/40 hover:bg-blue-50/50 transition-all cursor-pointer shadow-2xs"
                      >
                        <span className="font-mono text-xs text-slate-500 shrink-0 mt-0.5">{item.time}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{item.event_type || item.event}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Click to review incident details</p>
                        </div>
                        <span className="text-xs font-bold text-[#123B7A] bg-blue-100/70 px-2 py-0.5 rounded">
                          {item.severity || "MED"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                Select a candidate from the left grid to view live signal telemetry.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Incident Review Drawer */}
      <ProctoringReviewDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        event={selectedEvent}
        candidateName={selectedCandidate?.candidate_name}
        onStatusUpdated={() => fetchLive()}
      />
    </div>
  );
}
