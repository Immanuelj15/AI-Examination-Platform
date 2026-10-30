"use client";

import React, { useEffect, useState } from "react";
import {
  Video, Eye, ShieldAlert, AlertTriangle, RefreshCw,
  Clock, Search, UserCheck, XCircle, Bell, Wifi, Camera
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function LiveMonitoringPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
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
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Real-Time Examination Monitoring Grid</h1>
              <p className="text-xs text-slate-500">Live candidate computer vision heartbeats, facial presence, and behavioral events</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Feed</span>
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Risk Filter:</span>
            {["ALL", "HIGH", "MEDIUM", "LOW"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterRisk(lvl)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  filterRisk === lvl
                    ? "bg-[#123B7A] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate or exam..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Split Grid Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Candidates Cards Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="text-center py-20 text-slate-400 text-xs">Scanning live video heartbeats...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
                <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No active candidates match filter</h4>
                <p className="text-xs text-slate-400 mt-1">Adjust your risk filters or ensure candidate sessions are in progress.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((c) => {
                  const isSelected = selectedCandidate?.session_id === c.session_id;
                  const isHighRisk = c.suspicion_level === "HIGH";

                  return (
                    <div
                      key={c.session_id}
                      onClick={() => setSelectedCandidate(c)}
                      className={`cursor-pointer bg-white rounded-xl border p-4 transition-all shadow-xs ${
                        isSelected
                          ? "ring-2 ring-[#123B7A] border-transparent shadow-md"
                          : "border-slate-200 hover:border-slate-300"
                      } ${isHighRisk ? "border-l-4 border-l-rose-500" : ""}`}
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#123B7A] text-white flex items-center justify-center font-bold text-xs">
                            {c.candidate_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-tight">{c.candidate_name}</p>
                            <p className="text-[10px] text-slate-500">{c.exam_title}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isHighRisk
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : c.suspicion_level === "MEDIUM"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {c.suspicion_level} RISK
                        </span>
                      </div>

                      {/* Mock Video Window Preview */}
                      <div className="h-32 bg-slate-950 rounded-lg relative overflow-hidden flex items-center justify-center mb-3">
                        <div className="text-center">
                          <Camera className="w-6 h-6 text-slate-500 mx-auto mb-1 animate-pulse" />
                          <span className="text-[10px] font-mono text-emerald-400">TELEMETRY STREAM</span>
                        </div>

                        <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-mono text-emerald-400">
                          {c.face_detected ? "FACE PRESENT" : "UNDETECTED"}
                        </div>

                        <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                          SCORE: {c.suspicion_score}/100
                        </div>
                      </div>

                      {/* Footer telemetry */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-mono text-slate-700 font-semibold">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {Math.floor(c.remaining_seconds / 60)}m left
                        </span>
                        <span className="text-blue-600 font-semibold hover:underline">
                          View Timeline & Events →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Candidate Inspector Drawer */}
          {selectedCandidate && (
            <div className="w-80 border-l border-slate-200 bg-white p-5 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Session Inspection
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedCandidate.candidate_name}</h3>
                  <p className="text-xs text-slate-500">{selectedCandidate.candidate_email}</p>
                </div>

                {/* Score Gauge */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-semibold">Proctoring Suspicion</span>
                    <span className="font-mono font-bold text-rose-600">
                      {selectedCandidate.suspicion_score} / 100
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selectedCandidate.suspicion_score > 50
                          ? "bg-rose-500"
                          : selectedCandidate.suspicion_score > 25
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${selectedCandidate.suspicion_score}%` }}
                    />
                  </div>
                </div>

                {/* Recent Events Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Recent Proctoring Events
                  </h4>
                  {selectedCandidate.recent_events?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No violations recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCandidate.recent_events?.map((ev: any) => (
                        <div
                          key={ev.id}
                          className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-slate-800">{ev.event_type}</span>
                            <span className="font-mono text-slate-400 text-[10px]">{ev.time}</span>
                          </div>
                          <p className="text-slate-500 text-[10px]">{ev.details?.message || "Signal detected"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => alert(`Warning dispatched to candidate ${selectedCandidate.candidate_name}`)}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Send Focus Warning</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
