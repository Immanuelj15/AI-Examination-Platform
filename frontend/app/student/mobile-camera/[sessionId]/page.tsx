"use client";

import React, { useEffect, useState, useRef, use } from "react";
import {
  Camera, ShieldCheck, Wifi, WifiOff, Smartphone, RefreshCw, CheckCircle2, AlertTriangle
} from "lucide-react";

export default function MobileDualCameraPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [framesSent, setFramesSent] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // Initialize camera and WebSocket
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let stream: MediaStream | null = null;

    const setupStream = async () => {
      try {
        setErrorMsg(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreamActive(true);
        }

        // Connect WebSocket
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/dual-camera/${sessionId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onclose = () => {
          setWsConnected(false);
        };

        ws.onerror = () => {
          setWsConnected(false);
        };

        // Frame capture and transmission loop (approx 2 fps, lightweight)
        interval = setInterval(() => {
          if (
            ws.readyState === WebSocket.OPEN &&
            videoRef.current &&
            canvasRef.current &&
            videoRef.current.readyState >= 2
          ) {
            const v = videoRef.current;
            const c = canvasRef.current;
            c.width = 320;
            c.height = 240;
            const ctx = c.getContext("2d");
            if (ctx) {
              ctx.drawImage(v, 0, 0, 320, 240);
              const dataUrl = c.toDataURL("image/jpeg", 0.5);
              ws.send(dataUrl);
              setFramesSent((prev) => prev + 1);
            }
          }
        }, 800);
      } catch (err: any) {
        console.error("Camera access failed:", err);
        setErrorMsg(err.message || "Camera access permission denied.");
      }
    };

    setupStream();

    return () => {
      if (interval) clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [sessionId, facingMode]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header bar */}
      <header className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">360° Secondary Proctor Feed</h1>
            <p className="text-xs text-slate-400 font-mono">Session: #{sessionId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
              wsConnected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
          >
            {wsConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{wsConnected ? "STREAMING LIVE" : "CONNECTING..."}</span>
          </div>
        </div>
      </header>

      {/* Main Video Viewport */}
      <main className="flex-1 flex flex-col p-4 space-y-4 max-w-lg mx-auto w-full">
        {errorMsg ? (
          <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-6 text-center space-y-3 my-auto">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-rose-300">Camera Access Blocked</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Please grant camera permissions in your mobile browser settings to enable secondary 360° room proctoring.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Viewport Guidelines Overlay */}
              <div className="absolute inset-4 border border-dashed border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-xs">
                  <span>SIDE ROOM ALIGNED</span>
                  <span>{framesSent} FRAMES SYNCED</span>
                </div>
                <div className="text-center text-[11px] text-white/80 bg-black/60 px-3 py-1.5 rounded-md backdrop-blur-xs">
                  Position camera 2-3 ft to your side capturing hands & desk
                </div>
              </div>
            </div>

            {/* Placement instructions card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Placement Instructions</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                <li>Lean phone against a mug or stand at a 45° angle to your side.</li>
                <li>Ensure both your workspace, keyboard, and candidate profile are visible.</li>
                <li>Keep this tab open for the entire duration of your exam.</li>
              </ul>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() =>
                    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Switch Camera ({facingMode})
                </button>
                <span className="text-[11px] text-slate-500 font-mono">Status: Verified</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

