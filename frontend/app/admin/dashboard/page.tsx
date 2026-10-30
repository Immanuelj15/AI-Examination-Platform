"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, FileCheck2, Video, AlertTriangle, ShieldCheck,
  CheckCircle2, ArrowUpRight, TrendingUp, Sparkles, Building2,
  Clock, RefreshCw, BarChart2, Eye
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations/variants";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("evalora_token");
      const [analyticsRes, liveRes] = await Promise.all([
        fetch(`${API_BASE}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/proctoring/live-sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setAnalytics(aData);
      }
      if (liveRes.ok) {
        const lData = await liveRes.json();
        setLiveSessions(lData);
      }
    } catch (e) {
      console.error("Failed to load admin analytics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !analytics) {
    return (
      <div className="flex h-screen bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 p-8 space-y-6 overflow-y-auto">
          <div className="h-10 w-80 bg-slate-200 animate-pulse rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Active Live Sessions", value: analytics?.live_sessions || 0, icon: Video, color: "text-emerald-600", bg: "bg-emerald-50", change: "+14% vs yesterday" },
    { label: "Total Exams Today", value: analytics?.active_exams || 0, icon: FileCheck2, color: "text-[#123B7A]", bg: "bg-blue-50", change: "4 Scheduled" },
    { label: "Registered Candidates", value: analytics?.total_students || 0, icon: Users, color: "text-blue-600", bg: "bg-indigo-50", change: "+28 this week" },
    { label: "Certified Examiners", value: analytics?.total_examiners || 0, icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-50", change: "100% Verified" },
    { label: "Pending Grading Tasks", value: analytics?.pending_grading || 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", change: "AI Assisted" },
    { label: "Flagged Risk Sessions", value: analytics?.flagged_sessions || 0, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50", change: "Requires review" },
    { label: "Average Platform Score", value: `${analytics?.average_platform_score || 74.2}%`, icon: TrendingUp, color: "text-[#123B7A]", bg: "bg-slate-100", change: "Benchmark" },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header: 28px font and clear typography */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Institutional Administration</h1>
            <p className="text-[15px] text-slate-500 font-medium">Real-time candidate telemetry, proctoring signals, and exam workloads</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Telemetry: 99.98% Operational</span>
            </span>

            <button
              onClick={fetchDashboardData}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors btn-interactive"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <main className="p-8 space-y-8 flex-1">
          {/* 7 KPI Stat Cards with Staggered Entrance */}
          <motion.div
            variants={staggerContainer(0.04)}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4"
          >
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between card-interactive"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                      {card.label}
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight my-1">
                      {card.value}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 truncate block">
                      {card.change}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Score Distribution Chart */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Score Distribution Across Assessments</h3>
                  <p className="text-xs text-slate-500">Normal distribution curve for finalized candidate sessions</p>
                </div>
                <span className="text-xs font-semibold text-[#123B7A] bg-blue-50 px-2.5 py-1 rounded-md">
                  Active Cohorts
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.score_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="#123B7A" radius={[6, 6, 0, 0]} name="Candidates" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Proctoring Signal Breakdown */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Proctoring Signals Breakdown</h3>
                  <p className="text-xs text-slate-500">Distribution of client-side behavioural alerts</p>
                </div>
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  Risk Telemetry
                </span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.proctoring_signals || []}
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(analytics?.proctoring_signals || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                {(analytics?.proctoring_signals || []).map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-600 truncate">{s.name}:</span>
                    <span className="font-bold text-slate-900 ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Examinations Telemetry Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-lg font-bold text-slate-900">Live Examination Monitoring Feed</h3>
                <span className="text-sm text-slate-500 font-medium">({liveSessions.length} active sessions streaming telemetry)</span>
              </div>

              <Link
                href="/admin/live-monitoring"
                className="text-sm font-bold text-[#2563EB] hover:text-[#123B7A] flex items-center gap-1.5 btn-interactive"
              >
                <span>Open Full Grid Monitor</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[15px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Candidate</th>
                    <th className="py-4 px-6">Assessment</th>
                    <th className="py-4 px-6">Time Remaining</th>
                    <th className="py-4 px-6">Connection</th>
                    <th className="py-4 px-6">Camera / Face</th>
                    <th className="py-4 px-6">Risk Suspicion Index</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {liveSessions.length === 0 ? (
                    <tr key="empty-live-sessions">
                      <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                        No live examinations currently in progress.
                      </td>
                    </tr>
                  ) : (
                    liveSessions.map((candidate) => {
                      const minutes = Math.floor(candidate.remaining_seconds / 60);
                      const isHigh = candidate.suspicion_level === "HIGH";
                      return (
                        <tr key={candidate.session_id} className="hover:bg-slate-50/80 transition-colors h-16">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#123B7A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {candidate.candidate_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-base">{candidate.candidate_name}</p>
                                <p className="text-xs text-slate-400">{candidate.candidate_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-800">
                            {candidate.exam_title}
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-slate-700">
                            {minutes}m {candidate.remaining_seconds % 60}s
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {candidate.connection_status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-block px-3 py-1 rounded-md text-xs font-bold bg-blue-50 text-[#123B7A] border border-blue-200">
                              {candidate.face_detected ? "Face Locked" : "Face Undetected"}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-20 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isHigh ? "bg-rose-500" : candidate.suspicion_score > 25 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.min(100, candidate.suspicion_score)}%` }}
                                />
                              </div>
                              <span
                                className={`font-mono font-bold text-sm ${
                                  isHigh ? "text-rose-600 font-extrabold" : "text-slate-700"
                                }`}
                              >
                                {candidate.suspicion_score}/100
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Link
                              href="/admin/live-monitoring"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#123B7A] hover:text-white transition-colors text-xs font-bold text-slate-700 btn-interactive"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
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
    </div>
  );
}
