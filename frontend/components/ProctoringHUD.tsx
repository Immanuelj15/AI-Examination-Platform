"use client";

import React, { useState, useEffect } from "react";
import {
  Camera, Eye, AlertCircle, Wifi, WifiOff, CheckCircle2,
  ChevronDown, ChevronUp, Bug, Shield, Users, AlertTriangle, X
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
    clearWarning
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
        setDebugMode(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Guide box color classification
  const isMultiple = faceCount >= 2 || proctoringState.includes("MULTIPLE");
  const isWarning = !faceDetected || facePositionStatus !== "GOOD" || proctoringState.includes("WARNING") || proctoringState === "FACE_UNCERTAIN";

  const guideColor = isMultiple
    ? "border-rose-500 bg-rose-500/10 text-rose-300"
    : isWarning
    ? "border-amber-400 bg-amber-400/10 text-amber-200"
    : "border-emerald-400 bg-emerald-400/10 text-emerald-300";

  return (
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
            className="text-amber-200 hover:text-white p-1 rounded-md"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Development Debug Overlay (Shift+D or Bug icon) */}
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
            <span className="text-slate-500">Position:</span>
            <span className="text-slate-300">{facePositionStatus}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">WebSocket:</span>
            <span className={webSocketConnected ? "text-emerald-400" : "text-rose-400"}>
              {webSocketConnected ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>
          <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800">
            Recent discrete events: {events.length}
          </div>
        </div>
      )}

      {/* Main Proctoring Box */}
      <div className="w-52 bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md transition-all">
        {/* Header Bar */}
        <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-slate-300 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cameraStatus === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
            <span className="font-bold tracking-tight text-white text-[10px]">AI Proctor Shield</span>
          </div>
          <div className="flex items-center gap-1">
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

        {/* Video Frame & Face Guide Overlay (Collapsible) */}
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

            {/* Smooth Tracking Guide Overlay (Anti-Jitter) */}
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

            {/* Face Position Warning Overlay */}
            {isStreaming && facePositionStatus !== "GOOD" && facePositionStatus !== "NONE" && (
              <div className="absolute top-2 inset-x-2 bg-black/70 backdrop-blur-xs rounded px-2 py-0.5 text-center text-[9px] text-amber-300 font-semibold border border-amber-400/40">
                {facePositionStatus === "TOO_CLOSE" && "Please move back slightly"}
                {facePositionStatus === "TOO_FAR" && "Please move closer to camera"}
                {facePositionStatus === "OFF_CENTER" && "Center your face in camera"}
                {facePositionStatus === "PARTIAL_OUTSIDE" && "Keep full face inside frame"}
              </div>
            )}
          </div>
        )}

        {/* Telemetry Metrics Footer */}
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
              <Eye className="w-3 h-3 text-blue-400" />
              Gaze Alignment
            </span>
            <span className="text-blue-300 font-semibold font-mono text-[9px]">
              {gazeState.replace("GAZE_", "")}
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
  );
}
