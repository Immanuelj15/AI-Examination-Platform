"use client";

import React, { useState, useEffect } from "react";
import {
  Camera, Eye, AlertCircle, Wifi, WifiOff, CheckCircle2,
  ChevronDown, ChevronUp, Bug, Shield, Users, AlertTriangle, X,
  Smartphone, Lock, MessageSquare, Send, QrCode
} from "lucide-react";
import { useProctoring } from "@/hooks/useProctoring";

interface ProctoringHUDProps {
  sessionId: number | string;
  onWarning?: (msg: string) => void;
  apiBaseUrl?: string;
  wsUrl?: string;
}

export function ProctoringHUD({
  sessionId,
  onWarning,
  apiBaseUrl,
  wsUrl
}: ProctoringHUDProps) {
  const [minimized, setMinimized] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const {
    videoRef,
    cameraStatus,
    proctoringState,
    faceCount,
    faceDetected,
    faceConfidence,
    gazeState,
    facePositionStatus,
    smoothedBox,
    activeWarnings,
    events,
    fps,
    detectionLatencyMs,
    webSocketConnected,
    isStreaming,
    clearWarning,
    isScreenFrozen,
    freezeReason,
    supervisorWarning,
    setSupervisorWarning,
    terminatedBySupervisor,
    isDualCameraActive,
    dualCameraFrame,
    chatMessages,
    sendCandidateChatMessage
  } = useProctoring({
    sessionId,
    apiBaseUrl,
    wsUrl,
    onWarning
  });

  // Toggle debug mode on Shift + D
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "D" || e.key === "d")) {
        setDebugMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendCandidateChatMessage(chatInput.trim());
    setChatInput("");
  };

  // Guide box color classification
  const isMultiple = faceCount >= 2 || proctoringState.includes("MULTIPLE");
  const isWarning =
    !faceDetected ||
    facePositionStatus !== "GOOD" ||
    proctoringState.includes("WARNING") ||
    proctoringState === "FACE_UNCERTAIN";

  const guideColor = isMultiple
    ? "border-rose-500 bg-rose-500/10 text-rose-300"
    : isWarning
    ? "border-amber-400 bg-amber-400/10 text-amber-200"
    : "border-emerald-400 bg-emerald-400/10 text-emerald-300";

  const mobilePairingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/student/mobile-camera/${sessionId}`
    : `/student/mobile-camera/${sessionId}`;

  return (
    <>
      {/* 1. SCREEN FREEZE OVERLAY (Remote Intervention) */}
      {isScreenFrozen && (
        <div className="fixed inset-0 z-9999 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 text-white select-none">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Examiner Intervention Active</span>
              <h2 className="text-2xl font-extrabold text-white">Assessment Interface Paused</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {freezeReason || "The examiner has paused this session for integrity verification. Your timer is protected."}
              </p>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>Awaiting proctor unfreeze authorization...</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUPERVISOR BROADCAST WARNING MODAL */}
      {supervisorWarning && (
        <div className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 text-white select-none">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-7 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Official Proctor Directive</span>
              <h3 className="text-xl font-bold text-white">Integrity Notice</h3>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                "{supervisorWarning}"
              </p>
            </div>
            <button
              onClick={() => setSupervisorWarning(null)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
            >
              I Understand & Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* 3. REMOTE TERMINATION MODAL */}
      {terminatedBySupervisor && (
        <div className="fixed inset-0 z-9999 bg-slate-950 flex items-center justify-center p-6 text-white select-none">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-500 mx-auto flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Session Disqualified</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                This examination session has been officially terminated by the live examiner for critical protocol violations.
              </p>
            </div>
            <button
              onClick={() => (window.location.href = "/student/dashboard")}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Return to Student Dashboard
            </button>
          </div>
        </div>
      )}

      {/* 4. DUAL-CAMERA PAIRING MODAL */}
      {showPairingModal && (
        <div className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 text-white select-none">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowPairingModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">360° Second-Screen Pairing</h3>
                <p className="text-xs text-slate-400">Scan QR on your mobile device</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center shadow-inner">
              {/* Dynamic QR Code */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mobilePairingUrl)}`}
                alt="Mobile Camera Pairing QR"
                className="w-44 h-44 object-contain"
              />
              <span className="text-[11px] font-mono text-slate-700 mt-2">Scan with mobile camera</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>Or open directly on your mobile browser:</p>
              <input
                type="text"
                readOnly
                value={mobilePairingUrl}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-400 select-all"
              />
            </div>

            <button
              onClick={() => setShowPairingModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#123B7A] text-white font-bold text-sm hover:bg-[#1A4C9C] transition-colors"
            >
              Done / Return to Exam
            </button>
          </div>
        </div>
      )}

      {/* 5. INTERCOM LIVE CHAT DRAWER */}
      {chatOpen && (
        <div className="fixed bottom-20 right-64 z-50 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white font-sans animate-in slide-in-from-bottom-2">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">Proctor Live Intercom</span>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-56 overflow-y-auto p-3 space-y-2 text-xs">
            {chatMessages.length === 0 ? (
              <p className="text-center text-slate-500 pt-16 text-[11px]">No active proctor messages.</p>
            ) : (
              chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl max-w-[85%] ${
                    m.sender === "candidate"
                      ? "ml-auto bg-[#123B7A] text-white"
                      : "mr-auto bg-slate-800 text-slate-200 border border-slate-700"
                  }`}
                >
                  <p className="text-[11px] leading-relaxed">{m.text}</p>
                  <span className="text-[9px] text-slate-400 mt-1 block text-right">{m.time}</span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChat} className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask examiner for technical help..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* 6. MAIN PROCTORING HUD */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-auto select-none font-sans">
        {/* Real-time Non-Accusatory Warning Banners */}
        {activeWarnings.map((msg, i) => (
          <div
            key={`${msg}-${i}`}
            className="bg-amber-500/95 backdrop-blur-md text-white text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 max-w-xs border border-amber-400 animate-in fade-in slide-in-from-bottom-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-100" />
            <span className="font-semibold text-[11px] leading-tight flex-1">{msg}</span>
            <button
              onClick={() => clearWarning(i)}
              className="text-amber-200 hover:text-white p-1 rounded-md cursor-pointer"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Development Debug Overlay */}
        {debugMode && (
          <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 text-[10px] font-mono text-slate-300 shadow-2xl backdrop-blur-md w-60 space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-emerald-400 font-bold">
              <span className="flex items-center gap-1">
                <Bug className="w-3 h-3" /> PROCTORING DEBUG
              </span>
              <span>{fps} FPS ({detectionLatencyMs}ms)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">State:</span>
              <span className="font-bold text-amber-400">{proctoringState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Faces:</span>
              <span className="font-bold text-white">{faceCount} (Conf: {(faceConfidence * 100).toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gaze:</span>
              <span className="text-blue-400 font-semibold">{gazeState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dual Cam:</span>
              <span className={isDualCameraActive ? "text-emerald-400" : "text-slate-400"}>
                {isDualCameraActive ? "STREAMING" : "STANDBY"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">WebSocket:</span>
              <span className={webSocketConnected ? "text-emerald-400" : "text-rose-400"}>
                {webSocketConnected ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>
          </div>
        )}

        {/* Main Box */}
        <div className="w-56 bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md transition-all">
          {/* Header Bar */}
          <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-slate-300 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cameraStatus === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
              <span className="font-bold tracking-tight text-white text-[10px]">AI Proctor Shield</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`p-1 rounded hover:bg-slate-800 ${chatOpen ? "text-blue-400" : "text-slate-400"}`}
                title="Live Intercom Chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowPairingModal(true)}
                className={`p-1 rounded hover:bg-slate-800 ${isDualCameraActive ? "text-emerald-400" : "text-slate-400"}`}
                title="Pair Mobile 360° Room Camera"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`p-1 rounded hover:bg-slate-800 ${debugMode ? "text-emerald-400" : "text-slate-400"}`}
                title="Toggle Telemetry Debug Mode (Shift+D)"
              >
                <Bug className="w-3 h-3" />
              </button>
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400"
                title={minimized ? "Expand preview" : "Minimize preview"}
              >
                {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Video Frame */}
          {!minimized && (
            <div className="relative h-36 bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isStreaming ? "block" : "hidden"}`}
              />

              {!isStreaming && (
                <div className="text-center p-3">
                  <Camera className="w-6 h-6 text-slate-500 mx-auto mb-1 animate-pulse" />
                  <p className="text-[10px] text-slate-400">Camera initialization...</p>
                </div>
              )}

              {/* Secondary Dual Camera Picture-in-Picture */}
              {isDualCameraActive && dualCameraFrame && (
                <div className="absolute top-2 right-2 w-16 h-12 rounded-lg overflow-hidden border border-emerald-400/80 shadow-md bg-black">
                  <img src={dualCameraFrame} alt="Secondary View" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[6px] font-mono text-center text-emerald-300">
                    360° ROOM
                  </span>
                </div>
              )}

              {/* Guide Overlay */}
              {isStreaming && smoothedBox && (
                <div
                  className={`absolute border-2 rounded-xl pointer-events-none transition-all duration-75 flex flex-col justify-between p-1 ${guideColor}`}
                  style={{
                    left: `${smoothedBox.x * 100}%`,
                    top: `${smoothedBox.y * 100}%`,
                    width: `${smoothedBox.width * 100}%`,
                    height: `${smoothedBox.height * 100}%`
                  }}
                >
                  <div className="flex justify-between items-center text-[8px] font-mono bg-black/60 px-1 py-0.5 rounded backdrop-blur-xs">
                    <span>{isMultiple ? "MULTIPLE" : "VERIFIED"}</span>
                    <span>{(faceConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-center text-[7px] font-mono tracking-wider bg-black/60 py-0.5 rounded">
                    {gazeState.replace("GAZE_", "")}
                  </div>
                </div>
              )}

              {/* Face Position Status */}
              {isStreaming && facePositionStatus !== "GOOD" && facePositionStatus !== "NONE" && (
                <div className="absolute top-2 inset-x-2 bg-black/70 backdrop-blur-xs rounded px-2 py-0.5 text-center text-[9px] text-amber-300 font-semibold border border-amber-400/40">
                  {facePositionStatus === "TOO_CLOSE" && "Move back slightly"}
                  {facePositionStatus === "TOO_FAR" && "Move closer to camera"}
                  {facePositionStatus === "OFF_CENTER" && "Center face in camera"}
                  {facePositionStatus === "PARTIAL_OUTSIDE" && "Keep face in frame"}
                </div>
              )}
            </div>
          )}

          {/* Telemetry Footer */}
          <div className="p-2 space-y-1 bg-slate-900 text-[10px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                {isMultiple ? (
                  <Users className="w-3 h-3 text-rose-400" />
                ) : (
                  <CheckCircle2 className={`w-3 h-3 ${faceDetected ? "text-emerald-400" : "text-amber-400"}`} />
                )}
                <span>{isMultiple ? "Multiple People" : faceDetected ? "Face Verified" : "Searching Face"}</span>
              </span>
              <span className={`font-mono font-bold ${isMultiple ? "text-rose-400" : "text-emerald-400"}`}>
                {faceCount} {faceCount === 1 ? "Person" : "Persons"}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3 h-3 text-purple-400" />
                Dual-Cam Feed
              </span>
              <span className={`font-mono font-semibold text-[9px] ${isDualCameraActive ? "text-emerald-400" : "text-slate-400"}`}>
                {isDualCameraActive ? "Active" : "Not Paired"}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1 text-[9px]">
                {webSocketConnected ? (
                  <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                )}
                {webSocketConnected ? "Protected" : "Reconnecting"}
              </span>
              <span className="text-[9px] text-slate-500 font-medium">Privacy Preserved</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
