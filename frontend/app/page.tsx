"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Eye, Sparkles, BrainCircuit, Globe, Award,
  Lock, ArrowRight, CheckCircle2, ChevronRight, BarChart3,
  Layers, Users, Video, AlertTriangle, Cpu, Zap, FileSpreadsheet,
  Check, Play, Server, Clock, Fingerprint, ShieldAlert,
  GraduationCap, Building2, Briefcase, RefreshCw, FileCheck2,
  Scan, Radar, Activity, Mic, Wifi, WifiOff, FileText, Share2,
  CheckCircle, ArrowUpRight
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useLanguage } from "@/context/LanguageContext";
import { fadeUp, staggerContainer, fadeIn, scaleIn } from "@/lib/animations/variants";

export default function LandingPage() {
  const { t } = useLanguage();
  
  // Interactive Command Center tab
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<"proctoring" | "grading" | "multilingual">("proctoring");

  // Multilingual sample switcher
  const [sampleLang, setSampleLang] = useState<"en" | "ta" | "hi">("en");
  const sampleQuestions = {
    en: {
      q: "What is the average time complexity of searching in a Balanced Binary Search Tree (AVL / Red-Black)?",
      opts: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correct: "O(log n)"
    },
    ta: {
      q: "சமநிலைப்படுத்தப்பட்ட இரும தேடல் மரத்தில் (AVL / Red-Black) தேடுவதற்கான சராசரி நேர சிக்கல்தன்மை என்ன?",
      opts: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correct: "O(log n)"
    },
    hi: {
      q: "संतुलित बाइनरी सर्च ट्री (AVL / Red-Black) में खोजने की औसत समय जटिलता क्या है?",
      opts: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correct: "O(log n)"
    }
  };

  // Live cycling telemetry stream for Proctoring HUD
  const [telemetryIndex, setTelemetryIndex] = useState(0);
  const telemetryLogs = [
    { time: "14:32:12", event: "Facial Landmarker: 468 mesh points locked", status: "Optimal", delta: "+0 pts", color: "text-emerald-400" },
    { time: "14:32:16", event: "Gaze Yaw: -1.2° (Normal Workspace Focus)", status: "Verified", delta: "+0 pts", color: "text-emerald-400" },
    { time: "14:32:20", event: "Ambient Acoustic Noise: 16 dB (Silent)", status: "Clean", delta: "+0 pts", color: "text-emerald-400" },
    { time: "14:32:24", event: "Client Edge FPS: 31.4 • Zero Video Upstream", status: "Private", delta: "+0 pts", color: "text-blue-400" },
    { time: "14:32:28", event: "Authoritative Time Ping: 18ms latency", status: "In-Sync", delta: "+0 pts", color: "text-emerald-400" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryIndex((prev) => (prev + 1) % telemetryLogs.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [telemetryLogs.length]);

  // Interactive 5-Step Workflow State
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const workflowSteps = [
    {
      id: "create",
      title: "1. Question Bank & Authoring",
      badge: "Multilingual & AI-Assisted",
      shortDesc: "Author MCQs, multi-select, and subjective coding prompts in English, Tamil, Hindi, and more.",
      detail: "Examiners organize questions by taxonomy tags, difficulty curves, and rubrics. Automated AI generation creates robust distractor options in seconds with full LaTeX math formula support.",
      icon: FileSpreadsheet,
      metric: "6 Question Types"
    },
    {
      id: "schedule",
      title: "2. Exam Blueprint & Scheduling",
      badge: "Authoritative Server Clocks",
      shortDesc: "Configure start windows, strict time bounds, randomized question orders, and proctoring rules.",
      detail: "Zero trust in client device clocks. Authoritative server-side countdowns ensure strict automated submission deadlines while cryptographically binding exam tokens to student sessions.",
      icon: Clock,
      metric: "Sub-Second Accuracy"
    },
    {
      id: "proctor",
      title: "3. Edge AI Proctoring",
      badge: "0 KB/s Video Stream",
      shortDesc: "MediaPipe client-side computer vision evaluates head yaw, gaze deviation, and multiple faces.",
      detail: "Runs 100% on the candidate's browser edge. Raw webcam footage never streams to servers, preserving complete student privacy and operating smoothly even on 512 Kbps rural networks.",
      icon: ShieldCheck,
      metric: "100% Privacy-Preserving"
    },
    {
      id: "grade",
      title: "4. AI Rubric Evaluation",
      badge: "Semantic Concept Matching",
      shortDesc: "Automated semantic evaluation of descriptive answers against canonical model answers and rubrics.",
      detail: "Evaluates nuanced conceptual mastery with fine-grained concept scoring badges. Human examiners retain full supervisory authority with instantaneous one-click overrides.",
      icon: BrainCircuit,
      metric: "Instant Grader Proposals"
    },
    {
      id: "certify",
      title: "5. Results & Digital Credentials",
      badge: "Cryptographic SHA-256",
      shortDesc: "Instant score generation, percentile ranking, and tamper-evident downloadable certificates.",
      detail: "Candidates receive cryptographically verifiable digital certificates equipped with unique validation hashes and QR codes for employer and university registrar instant verification.",
      icon: Award,
      metric: "Verifiable PDF & QR"
    }
  ];

  // Interactive Offline Simulator State (in Bento Grid)
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [offlineSyncMessage, setOfflineSyncMessage] = useState("Connected to Authoritative Cloud");

  const toggleOfflineSimulation = () => {
    if (!isSimulatedOffline) {
      setIsSimulatedOffline(true);
      setOfflineSyncMessage("Network Dropped! Stored to IndexedDB Cache");
      setTimeout(() => {
        setIsSimulatedOffline(false);
        setOfflineSyncMessage("Reconnected! 4 Answers Synced in 38ms");
        setTimeout(() => setOfflineSyncMessage("Connected to Authoritative Cloud"), 3500);
      }, 3000);
    }
  };

  // Interactive Proctoring Toggles in Bento Card
  const [proctorToggles, setProctorToggles] = useState({
    faceLock: true,
    gazeYaw: true,
    tabGuard: true,
    audioShield: true
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-[#123B7A] selection:text-white overflow-x-hidden">
      <Navbar />

      {/* ========================================================= */}
      {/* 1. HERO SECTION WITH AMBIENT GLOWS & ROCK-SOLID VISIBILITY */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 lg:pt-20 pb-12 lg:pb-16 bg-gradient-to-b from-blue-50/40 via-white to-[#F8FAFC] border-b border-slate-200/70">
        {/* Ambient radial ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] bg-gradient-to-b from-blue-300/25 via-indigo-200/15 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -top-20 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-0 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              {/* Release Pill Badge with Pulse Indicator */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-blue-200/80 shadow-xs hover:border-blue-300 transition-colors">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-[#123B7A] tracking-wide uppercase">
                  Evalora Assessment Cloud 2.0
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
                  Client-Side Edge AI
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-[1.14]">
                Smarter Assessments. <br />
                <span className="bg-gradient-to-r from-[#123B7A] via-[#1E4B94] to-[#2563EB] bg-clip-text text-transparent">
                  Uncompromising Integrity.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                The enterprise examination platform engineered for universities, recruitment teams, and certification boards.
                Featuring zero-bandwidth edge computer vision proctoring, multilingual question banking, and automated AI rubric grading.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-1">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#123B7A] text-white text-sm font-bold hover:bg-[#1E4B94] transition-all shadow-md shadow-blue-900/15 active:scale-[0.98] group"
                >
                  <span>Start Assessing Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#interactive-demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all shadow-xs active:scale-[0.98] hover:border-slate-300 group"
                >
                  <Play className="w-3.5 h-3.5 text-[#123B7A] group-hover:scale-110 transition-transform" />
                  <span>Explore Live Demo</span>
                </a>
              </div>

              {/* Trust Micro-Pills with subtle hover */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-4 pt-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>SOC-2 & ISO 27001</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>Zero Raw Video Streaming</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Authoritative Server Clocks</span>
                </span>
              </div>
            </div>

            {/* Right Interactive Command Center Mockup */}
            <div
              id="interactive-demo"
              className="lg:col-span-6 relative"
            >
              <div className="relative mx-auto w-full max-w-xl">
                {/* Glowing aura */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-3xl blur-2xl opacity-20" />

                {/* Main Card Container */}
                <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden backdrop-blur-xs">
                  
                  {/* Window Title Bar */}
                  <div className="h-11 bg-slate-900 px-4 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500/90" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/90" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/90" />
                      <span className="text-xs font-mono text-slate-400 ml-2">evalora.telemetry.live</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        MONITORING ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Interactive Switcher Tabs on Top of Mockup */}
                  <div className="grid grid-cols-3 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveInteractiveTab("proctoring")}
                      className={`py-2 rounded-lg transition-all ${
                        activeInteractiveTab === "proctoring"
                          ? "bg-white text-[#123B7A] shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      AI Proctoring HUD
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInteractiveTab("grading")}
                      className={`py-2 rounded-lg transition-all ${
                        activeInteractiveTab === "grading"
                          ? "bg-white text-[#123B7A] shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      AI Rubric Grader
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInteractiveTab("multilingual")}
                      className={`py-2 rounded-lg transition-all ${
                        activeInteractiveTab === "multilingual"
                          ? "bg-white text-[#123B7A] shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Multilingual Bank
                    </button>
                  </div>

                  {/* Tab Content with AnimatePresence */}
                  <AnimatePresence mode="wait">
                    {/* Tab 1: AI Proctoring HUD */}
                    {activeInteractiveTab === "proctoring" && (
                      <motion.div
                        key="tab-proctoring"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="p-5 space-y-4 bg-slate-950 text-white"
                      >
                        {/* Top Metric Bar */}
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-200">National Engineering Assessment</p>
                            <p className="text-[11px] font-mono text-slate-400">NET-2026-ENG • Candidate: Karthik N.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Animated Audio Equalizer Bars */}
                            <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                              <Mic className="w-3 h-3 text-slate-400 mr-0.5" />
                              {[8, 14, 10, 18, 9].map((h, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ height: [4, h, 6] }}
                                  transition={{ duration: 0.7 + i * 0.15, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                  className="w-0.5 bg-emerald-400 rounded-full"
                                  style={{ height: h }}
                                />
                              ))}
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Risk: 08/100 (Optimal)
                            </span>
                          </div>
                        </div>

                        {/* Mockup Camera Canvas with Animated Laser Scan Line & Landmark Wireframe */}
                        <div className="relative h-48 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                          {/* Simulated Grid Wireframe */}
                          <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25" />
                          
                          {/* Animated Vertical Laser Scan Bar */}
                          <motion.div
                            animate={{ y: ["-100%", "300%"] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent shadow-[0_0_12px_#34d399] pointer-events-none"
                          />

                          {/* Face Mesh Center Circle with Pulsing Ring & 360-degree Rotating Radar Beam */}
                          <div className="relative w-28 h-28 rounded-full border-2 border-dashed border-emerald-400/80 flex items-center justify-center">
                            {/* Rotating Radar Sweep Wedge */}
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                              className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(52,211,153,0.3)_360deg)] pointer-events-none"
                            />

                            {/* Expanding Pulse Ring */}
                            <motion.div
                              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute inset-0 rounded-full border border-emerald-400/50"
                            />
                            
                            {/* Simulated Landmark Dots */}
                            {[
                              { top: "25%", left: "35%" },
                              { top: "25%", left: "65%" },
                              { top: "45%", left: "50%" },
                              { top: "68%", left: "38%" },
                              { top: "68%", left: "62%" },
                              { top: "48%", left: "22%" },
                              { top: "48%", left: "78%" },
                            ].map((pos, idx) => (
                              <motion.div
                                key={idx}
                                style={pos}
                                animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.8, delay: idx * 0.2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"
                              />
                            ))}

                            <div className="w-20 h-20 rounded-full border border-emerald-500/40 flex items-center justify-center z-10">
                              <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider">
                                FACE LOCK
                              </span>
                            </div>
                            {/* Corner bounding marks */}
                            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                          </div>

                          {/* Telemetry Overlays */}
                          <div className="absolute top-2.5 left-2.5 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-slate-800">
                            Confidence: 99.4%
                          </div>
                          <div className="absolute top-2.5 right-2.5 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-blue-400 border border-slate-800">
                            Faces: 1 (Verified)
                          </div>
                          <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-slate-800">
                            Gaze: Workspace Locked
                          </div>
                          <div className="absolute bottom-2.5 right-2.5 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                            Bandwidth: 0 KB/s Video
                          </div>
                        </div>

                        {/* Live Telemetry Cycling Stream with Smooth Transitions */}
                        <div className="space-y-1.5 text-[11px] font-mono">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={telemetryIndex}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.25 }}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                            >
                              <span className={telemetryLogs[telemetryIndex].color}>
                                {telemetryLogs[telemetryIndex].time} • {telemetryLogs[telemetryIndex].event}
                              </span>
                              <span className="text-slate-400 font-bold">{telemetryLogs[telemetryIndex].status}</span>
                            </motion.div>
                          </AnimatePresence>

                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-400">
                            <span>14:32:00 • Single Candidate Biometrics Active</span>
                            <span className="text-emerald-400">+0 pts</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab 2: AI Rubric Grader */}
                    {activeInteractiveTab === "grading" && (
                      <motion.div
                        key="tab-grading"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="p-5 space-y-4 bg-slate-50 text-slate-900"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            AI Grading Proposal
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-600">Question 3 of 5</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                          <p className="text-xs font-bold text-slate-800">Prompt: What is Database Normalization?</p>
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                            "Normalization reduces data redundancy and improves integrity through normal forms like 1NF, 2NF, 3NF."
                          </p>
                        </div>

                        {/* Evaluation Breakdown with Interactive Concept Badges */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700">AI Suggested Score</span>
                            <span className="font-mono font-bold text-emerald-700 text-sm">4.5 / 5.0 Marks</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            <motion.span whileHover={{ scale: 1.05 }} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded border border-emerald-200 cursor-default">
                              ✓ Redundancy Reduction (+2.0)
                            </motion.span>
                            <motion.span whileHover={{ scale: 1.05 }} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded border border-emerald-200 cursor-default">
                              ✓ Integrity Preservation (+1.5)
                            </motion.span>
                            <motion.span whileHover={{ scale: 1.05 }} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded border border-emerald-200 cursor-default">
                              ✓ Normal Forms (+1.0)
                            </motion.span>
                          </div>
                          <div className="pt-1 flex items-center justify-end gap-2">
                            <span className="text-[11px] text-slate-500 font-medium">Examiner Override Ready</span>
                            <button type="button" className="px-3 py-1 bg-[#123B7A] text-white rounded-lg text-xs font-bold hover:bg-[#1E4B94] transition-colors shadow-xs active:scale-95">
                              Approve Score
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab 3: Multilingual Question Bank */}
                    {activeInteractiveTab === "multilingual" && (
                      <motion.div
                        key="tab-multilingual"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="p-5 space-y-4 bg-slate-50 text-slate-900"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-[#123B7A] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Universal Translation Engine
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setSampleLang("en")}
                              className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${sampleLang === "en" ? "bg-[#123B7A] text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                            >
                              English
                            </button>
                            <button
                              type="button"
                              onClick={() => setSampleLang("ta")}
                              className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${sampleLang === "ta" ? "bg-[#123B7A] text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                            >
                              தமிழ்
                            </button>
                            <button
                              type="button"
                              onClick={() => setSampleLang("hi")}
                              className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${sampleLang === "hi" ? "bg-[#123B7A] text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                            >
                              हिन्दी
                            </button>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                          <p className="text-sm font-bold text-slate-900 leading-relaxed">
                            {sampleQuestions[sampleLang].q}
                          </p>
                          <div className="space-y-1.5">
                            {sampleQuestions[sampleLang].opts.map((opt, i) => (
                              <div
                                key={i}
                                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                                  opt === sampleQuestions[sampleLang].correct
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                                    : "bg-slate-50 border-slate-200 text-slate-700"
                                }`}
                              >
                                <span>{String.fromCharCode(65 + i)}. {opt}</span>
                                {opt === sampleQuestions[sampleLang].correct && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Floating Bobbing Badges around preview */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-5 -left-5 bg-white border border-slate-200 p-3 rounded-xl shadow-lg flex items-center gap-3 hidden sm:flex z-20"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Anti-Cheat Protected</p>
                    <p className="text-[11px] text-slate-500 font-medium">Zero raw video streaming • 100% private</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 bg-white border border-slate-200 py-1.5 px-3 rounded-xl shadow-md flex items-center gap-2 hidden sm:flex z-20"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-700">Sub-Second IndexedDB Sync</span>
                </motion.div>
              </div>
            </div>

          </div>

          {/* Core Technical Specifications & Architecture Standards (Real Engineering Metrics) */}
          <div className="mt-12 pt-8 border-t border-slate-200/90 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
            <div className="pt-4 md:pt-0 px-2 sm:px-4">
              <div className="text-3xl lg:text-4xl font-black text-[#123B7A] tracking-tight font-mono">0 KB/s</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mt-1">Upstream Video</div>
              <div className="text-[11px] text-slate-500 font-medium">100% Client-Side Privacy</div>
            </div>

            <div className="pt-4 md:pt-0 px-2 sm:px-4">
              <div className="text-3xl lg:text-4xl font-black text-[#123B7A] tracking-tight font-mono">&lt; 120ms</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mt-1">Answer Sync Latency</div>
              <div className="text-[11px] text-slate-500 font-medium">IndexedDB Local Persistence</div>
            </div>

            <div className="pt-4 md:pt-0 px-2 sm:px-4">
              <div className="text-3xl lg:text-4xl font-black text-[#123B7A] tracking-tight font-mono">468 Pts</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mt-1">Biometric Face Mesh</div>
              <div className="text-[11px] text-slate-500 font-medium">MediaPipe 3D Landmark & Gaze</div>
            </div>

            <div className="pt-4 md:pt-0 px-2 sm:px-4">
              <div className="text-3xl lg:text-4xl font-black text-[#123B7A] tracking-tight font-mono">SHA-256</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mt-1">Cryptographic Proof</div>
              <div className="text-[11px] text-slate-500 font-medium">Tamper-Evident QR Credentials</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. ENTERPRISE ECOSYSTEM DEPLOYMENT BAND */}
      {/* ========================================================= */}
      <section id="about" className="py-6 bg-slate-50/70 border-b border-slate-200/80 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
            <div className="flex-shrink-0 text-center lg:text-left">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block">
                Enterprise Infrastructure
              </span>
              <span className="text-xs font-bold text-slate-700">
                Engineered for High-Stakes Assessments
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {[
                { icon: GraduationCap, label: "Universities & Colleges" },
                { icon: Briefcase, label: "Enterprise Recruitment" },
                { icon: Award, label: "Certification Boards" },
                { icon: Building2, label: "Corporate Academies" },
                { icon: ShieldCheck, label: "Government Licensing" }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-[#123B7A] hover:shadow-xs transition-all cursor-default"
                  >
                    <Icon className="w-4 h-4 text-[#123B7A]" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. NEW INTERACTIVE WORKFLOW PIPELINE WITH ENERGY PULSE */}
      {/* ========================================================= */}
      <section id="workflow" className="py-16 lg:py-20 bg-white border-b border-slate-200/70 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#2563EB] tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              End-To-End Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              The Complete Assessment Lifecycle
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              From question bank authoring to instant cryptographic certification, every stage is fully automated, secure, and synchronized.
            </p>
          </div>

          {/* 5-Step Pipeline Steps Bar with Animated Connecting Energy Line */}
          <div className="relative">
            {/* Background connecting bar (hidden on small screens) */}
            <div className="hidden lg:block absolute top-7 left-12 right-12 h-1 bg-slate-200 -z-0">
              {/* Animated energy line pulsing across */}
              <motion.div
                animate={{
                  left: ["0%", "100%"],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 h-1 w-24 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent shadow-[0_0_8px_#2563eb]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
              {workflowSteps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = activeWorkflowStep === idx;
                return (
                  <motion.button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveWorkflowStep(idx)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isActive
                        ? "bg-[#123B7A] text-white border-[#123B7A] shadow-lg shadow-blue-900/20"
                        : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-blue-50 text-[#123B7A]"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive ? "bg-white/20 text-blue-100" : "bg-slate-100 text-slate-600"
                      }`}>
                        Step 0{idx + 1}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold leading-snug">{step.title}</h4>
                    <p className={`text-xs mt-1 leading-normal line-clamp-2 ${isActive ? "text-blue-100" : "text-slate-500"}`}>
                      {step.shortDesc}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Active Step Feature Showcase Card with AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeWorkflowStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#123B7A] to-slate-900 text-white border border-slate-800 shadow-xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-white/10">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{workflowSteps[activeWorkflowStep].badge}</span>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {workflowSteps[activeWorkflowStep].title}
                  </h3>
                  
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                    {workflowSteps[activeWorkflowStep].detail}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-blue-200">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>{workflowSteps[activeWorkflowStep].metric}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Fully Integrated API & DB</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Zero Friction Role Transition</span>
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
                    {React.createElement(workflowSteps[activeWorkflowStep].icon, { className: "w-8 h-8" })}
                  </div>
                  <div className="text-lg font-bold text-white">Production Ready</div>
                  <p className="text-xs text-slate-300 max-w-xs">
                    Try this live now across Examiner, Student, and Admin consoles.
                  </p>
                  <Link
                    href="/login"
                    className="px-5 py-2.5 rounded-xl bg-white text-[#123B7A] font-bold text-xs hover:bg-blue-50 transition-colors shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Launch Workflow</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. CAPABILITIES BENTO GRID WITH CARD HOVER ELEVATION */}
      {/* ========================================================= */}
      <section id="features" className="py-16 lg:py-20 bg-[#F8FAFC] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#2563EB] tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Enterprise Assessment Cloud
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Engineered for Mission-Critical Exams
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Every component is built for high concurrency, zero client tampering, and seamless human-in-the-loop governance.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento 1: Large Span AI Proctoring with Interactive Toggles */}
            <motion.div
              id="proctoring"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="md:col-span-2 bg-gradient-to-br from-slate-900 to-[#123B7A] text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group"
            >
              <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              
              <div className="space-y-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center border border-white/10">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  Client-Side Computer Vision Proctoring
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                  Leverages MediaPipe client-side facial landmarking to evaluate gaze alignment, multiple faces, and tab departure without streaming candidate video to the server. Operates seamlessly on low-bandwidth 512 Kbps connections.
                </p>
              </div>

              {/* Interactive Policy Toggles inside Bento */}
              <div className="relative z-10 bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  Active Proctoring Guards (Live Toggle Test)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setProctorToggles(prev => ({ ...prev, faceLock: !prev.faceLock }))}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                      proctorToggles.faceLock ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300" : "bg-slate-800/60 border-slate-700 text-slate-400"
                    }`}
                  >
                    <span>Face Lock</span>
                    <span className={`w-2 h-2 rounded-full ${proctorToggles.faceLock ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProctorToggles(prev => ({ ...prev, gazeYaw: !prev.gazeYaw }))}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                      proctorToggles.gazeYaw ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300" : "bg-slate-800/60 border-slate-700 text-slate-400"
                    }`}
                  >
                    <span>Gaze Yaw</span>
                    <span className={`w-2 h-2 rounded-full ${proctorToggles.gazeYaw ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProctorToggles(prev => ({ ...prev, tabGuard: !prev.tabGuard }))}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                      proctorToggles.tabGuard ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300" : "bg-slate-800/60 border-slate-700 text-slate-400"
                    }`}
                  >
                    <span>Tab Guard</span>
                    <span className={`w-2 h-2 rounded-full ${proctorToggles.tabGuard ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProctorToggles(prev => ({ ...prev, audioShield: !prev.audioShield }))}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                      proctorToggles.audioShield ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300" : "bg-slate-800/60 border-slate-700 text-slate-400"
                    }`}
                  >
                    <span>Audio Shield</span>
                    <span className={`w-2 h-2 rounded-full ${proctorToggles.audioShield ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10 pt-2 border-t border-white/10 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Face Lock & Landmarker</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Gaze Yaw Telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Tab & Window Blur Guard</span>
                </div>
              </div>
            </motion.div>

            {/* Bento 2: AI Subjective Rubric Grader */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs hover:border-amber-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  AI Subjective Rubric Grader
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Evaluates short and long textual answers against canonical model answers and rubrics, providing examiners with instant concept matching and one-click override.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 flex items-center justify-between">
                <span>Matched Concepts: 3/3</span>
                <span className="font-bold text-emerald-700">90% Confidence</span>
              </div>
            </motion.div>

            {/* Bento 3: Multilingual Question Engine */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs hover:border-blue-200 hover:shadow-md transition-all space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#123B7A] flex items-center justify-center border border-blue-200">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Multilingual Authoring
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Native question prompts and options across English, Tamil, Hindi, Malayalam, Telugu, and Kannada with live student language switching.
              </p>
            </motion.div>

            {/* Bento 4: Offline-First PWA Protection with Live Interactive Simulator */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <Zap className="w-6 h-6" />
                  </div>
                  <button
                    type="button"
                    onClick={toggleOfflineSimulation}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                  >
                    Test Offline Drop
                  </button>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Sub-Second Sync & PWA
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Answers persist incrementally to local IndexedDB storage during transient internet dropouts and sync seamlessly upon reconnection.
                </p>
              </div>

              {/* Offline Status Mini Banner */}
              <div className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all ${
                isSimulatedOffline
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}>
                {isSimulatedOffline ? <WifiOff className="w-4 h-4 text-amber-600 animate-bounce" /> : <Wifi className="w-4 h-4 text-emerald-600" />}
                <span className="truncate">{offlineSyncMessage}</span>
              </div>
            </motion.div>

            {/* Bento 5: Cryptographic Digital Certificates */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Verifiable Credentials
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated generation of tamper-evident digital certificates featuring cryptographic SHA-256 validation hashes and verifiable QR keys.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. BANK-GRADE SECURITY & COMPLIANCE SECTION */}
      {/* ========================================================= */}
      <section id="security" className="py-16 lg:py-20 bg-white border-y border-slate-200/80 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#2563EB] tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Enterprise Defense
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Bank-Grade Security Architecture
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Engineered according to rigorous international data standards to prevent credential sharing and test compromise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.15 }}
              className="p-7 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all space-y-3 cursor-default group"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Short-Lived Exam Tokens</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Cryptographically binds candidate ID, exam ID, and hardware fingerprints to prevent credential sharing and remote session hijacking.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.15 }}
              className="p-7 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all space-y-3 cursor-default group"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Authoritative Server Clocks</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Never trusts client device time. Automatic submission triggers directly from server-side countdown timestamps.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.15 }}
              className="p-7 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all space-y-3 cursor-default group"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Immutable Audit Trails</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every action (exam creation, question edits, grade approval, login attempt) is persisted with IP, role, and UTC timestamps.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. CALL TO ACTION SECTION (WITH PULSING AMBIENT SHIMMER) */}
      {/* ========================================================= */}
      <section className="py-16 lg:py-20 bg-[#123B7A] text-white relative overflow-hidden">
        {/* Glow ambient animated background circles */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.28, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Enterprise Assessment Infrastructure</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
            Ready to Modernize Your Examination Workflow?
          </h2>

          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Experience the enterprise standard for campus placements, corporate recruitment, and university examinations with client-side AI proctoring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="relative w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#123B7A] text-base font-bold hover:bg-blue-50 transition-all shadow-xl active:scale-[0.98] hover:shadow-2xl hover:-translate-y-0.5 overflow-hidden group"
            >
              <motion.div
                animate={{ x: ["-150%", "250%"] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#123B7A]/10 to-transparent skew-x-12 pointer-events-none"
              />
              <span>Start Assessing Now</span>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-white/30 hover:border-white text-white text-base font-bold hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              Sign In to Demo Portal
            </Link>
          </div>

          <p className="text-xs text-blue-200/80 pt-2 font-medium">
            Pre-configured with Examiner, Student, and Admin demo roles • Instant test execution
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. ENTERPRISE FOOTER */}
      {/* ========================================================= */}
      <footer id="contact" className="bg-slate-900 text-slate-400 text-sm py-12 lg:py-16 border-t border-slate-800 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2.5 text-white font-bold text-lg">
                <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-black text-sm shadow-xs">
                  E
                </div>
                <span>Evalora</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enterprise AI assessment cloud, automated grading, and proctoring infrastructure.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Solutions</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/login" className="hover:text-white transition-colors">University Examinations</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Campus Placements</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Corporate Hiring</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Coding Assessments</Link></li>
              </ul>
            </div>

            {/* Technology */}
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Technology</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#proctoring" className="hover:text-white transition-colors">AI Proctoring Engine</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">LLM Rubric Evaluation</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security & RBAC</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Multilingual Core</Link></li>
              </ul>
            </div>

            {/* Compliance */}
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Compliance</h4>
              <ul className="space-y-2.5 text-xs">
                <li><span className="text-slate-300">ISO 27001 Certified</span></li>
                <li><span className="text-slate-300">GDPR & DPDP Ready</span></li>
                <li><span className="text-slate-300">WCAG 2.1 AA Compliant</span></li>
                <li><span className="text-slate-300">Authoritative Timers</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Evalora Assessment Systems Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Assessment</span>
              <span className="hover:text-slate-300 cursor-pointer transition-colors">Security Disclosures</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
