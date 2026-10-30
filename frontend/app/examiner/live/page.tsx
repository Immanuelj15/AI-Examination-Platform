"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Video, Eye, ShieldAlert, AlertTriangle, RefreshCw,
  Clock, Search, UserCheck, XCircle, Bell, Wifi, Camera,
  Shield, Lock, Unlock, MessageSquare, Send, Smartphone, Check
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

  // Intervention UI State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningPreset, setWarningPreset] = useState("Please focus on your screen and maintain exam posture.");
  const [customWarning, setCustomWarning] = useState("");
  const [isScreenFrozen, setIsScreenFrozen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [interventionNotice, setInterventionNotice] = useState<string | null>(null);

  const interventionWsRef = useRef<WebSocket | null>(null);

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

  // Connect intervention WebSocket when candidate selected
  useEffect(() => {
    if (!selectedCandidate) return;

    if (interventionWsRef.current) {
      interventionWsRef.current.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.hostname}:8000/ws/proctor-intervention/${selectedCandidate.session_id}`
    );
    interventionWsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "DELIVERED") {
          setInterventionNotice(`Command ${data.command} delivered to candidate.`);
          setTimeout(() => setInterventionNotice(null), 4000);
        }
      } catch {}
    };

    return () => {
      ws.close();
    };
  }, [selectedCandidate?.session_id]);

  const sendInterventionCommand = (payload: any) => {
    if (interventionWsRef.current && interventionWsRef.current.readyState === WebSocket.OPEN) {
      interventionWsRef.current.send(JSON.stringify(payload));
      setInterventionNotice(`Dispatched ${payload.action} signal...`);
      setTimeout(() => setInterventionNotice(null), 3000);
    } else {
      alert("Intervention channel connecting... Please retry in a moment.");
    }
  };

  const handleSendWarning = () => {
    const text = customWarning.trim() || warningPreset;
    sendInterventionCommand({
      action: "WARNING",
      message: text
    });
    setWarningModalOpen(false);
    setCustomWarning("");
  };

  const handleToggleFreeze = () => {
    const nextState = !isScreenFrozen;
    setIsScreenFrozen(nextState);
    sendInterventionCommand({
      action: nextState ? "FREEZE" : "UNFREEZE",
      message: nextState
        ? "Assessment paused by examiner for biometric verification."
        : "Assessment resumed."
    });
  };

  const handleTerminateSession = () => {
    if (
      confirm(
        `Are you sure you want to disqualify and TERMINATE session #${selectedCandidate?.session_id} for ${selectedCandidate?.candidate_name}? This cannot be undone.`
      )
    ) {
      sendInterventionCommand({
        action: "TERMINATE",
        message: "Session terminated due to critical proctoring infractions."
      });
    }
  };

  const handleSendDirectChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendInterventionCommand({
      action: "CHAT",
      message: chatMessage.trim()
    });
    setChatMessage("");
  };

  const filtered = candidates.filter((c) => {
    const matchesRisk = filterRisk === "ALL" || c.suspicion_level === filterRisk;
    const matchesSearch =
      c.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
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
            {interventionNotice && (
              <span className="px-3.5 py-1.5 rounded-full bg-blue-100 text-[#123B7A] text-xs font-bold border border-blue-200 animate-in fade-in">
                {interventionNotice}
              </span>
            )}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Engine Connected</span>
            </div>
            <button
              onClick={fetchLive}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 btn-interactive transition-all cursor-pointer"
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

          {/* Right Detail Panel & Live Remote Intervention Hub */}
          <div className="w-96 border-l border-slate-200 bg-white p-6 flex flex-col justify-between overflow-y-auto space-y-6">
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
                    <span className="font-mono font-bold text-slate-800">#{selectedCandidate.session_id}</span>
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

                {/* REMOTE PROCTOR INTERVENTION CONTROL HUB */}
                <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" /> Live Intervention Hub
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setWarningModalOpen(true)}
                      className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Send Warning</span>
                    </button>

                    <button
                      onClick={handleToggleFreeze}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isScreenFrozen
                          ? "bg-emerald-600/30 border-emerald-500 text-emerald-300"
                          : "bg-blue-600/20 border-blue-500/40 hover:bg-blue-600/30 text-blue-300"
                      }`}
                    >
                      {isScreenFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span>{isScreenFrozen ? "Unfreeze Screen" : "Freeze Screen"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setChatDrawerOpen(!chatDrawerOpen)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span>Direct Intercom</span>
                    </button>

                    <button
                      onClick={handleTerminateSession}
                      className="p-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Disqualify</span>
                    </button>
                  </div>

                  {/* Inline Intercom Chat Box */}
                  {chatDrawerOpen && (
                    <form onSubmit={handleSendDirectChat} className="pt-2 border-t border-slate-800 flex gap-2">
                      <input
                        type="text"
                        placeholder="Type direct message to candidate..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400"
                      />
                      <button
                        type="submit"
                        className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
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

      {/* Broadcast Warning Dialog Modal */}
      {warningModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Issue Official Warning</h3>
                <p className="text-xs text-slate-500">Candidate: {selectedCandidate?.candidate_name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Preset Violation Directives</label>
              {[
                "Please focus on your screen and maintain exam posture.",
                "Multiple faces detected. Ensure nobody else enters your workspace.",
                "Unusual ambient audio / whispers detected. Please maintain total silence.",
                "Secondary device detected. Remove all unauthorized phones or notes."
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setWarningPreset(p);
                    setCustomWarning("");
                  }}
                  className={`w-full text-left text-xs p-2.5 rounded-xl border transition-all cursor-pointer ${
                    warningPreset === p && !customWarning
                      ? "border-[#123B7A] bg-blue-50 text-[#123B7A] font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Or Custom Warning Text</label>
              <textarea
                rows={2}
                placeholder="Enter specific instructions to candidate..."
                value={customWarning}
                onChange={(e) => setCustomWarning(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setWarningModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWarning}
                className="px-4 py-2 rounded-xl bg-[#123B7A] hover:bg-[#1A4C9C] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Dispatch Warning Immediately
              </button>
            </div>
          </div>
        </div>
      )}

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
