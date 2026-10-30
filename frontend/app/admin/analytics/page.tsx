"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, Award, ShieldAlert, CheckCircle2, Loader2, ArrowUpRight } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("evalora_token");
        const res = await fetch(`${API_BASE}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-screen bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#123B7A]" />
        </div>
      </div>
    );
  }

  const completionRateData = [
    { day: "Mon", rate: 94 },
    { day: "Tue", rate: 96 },
    { day: "Wed", rate: 92 },
    { day: "Thu", rate: 98 },
    { day: "Fri", rate: 95 },
    { day: "Sat", rate: 99 },
    { day: "Sun", rate: 97 },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Institutional Assessment Analytics</h1>
              <p className="text-xs text-slate-500">Cross-departmental performance metrics, score distributions, and integrity signals</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Platform Health: {data.system_health || "Optimal"}</span>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Candidate Registry</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{data.total_students} Students</div>
              <p className="text-xs text-slate-500 mt-1">{data.total_examiners} Active Examiners</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mean Platform Score</div>
              <div className="text-2xl font-bold text-[#123B7A] mt-1">{data.average_platform_score}%</div>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> +3.4% vs last cohort
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completed Examinations</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{data.completed_exams}</div>
              <p className="text-xs text-slate-500 mt-1">{data.active_exams} currently active / published</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live & Flagged Sessions</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{data.live_sessions} Live</div>
              <p className="text-xs text-rose-600 mt-1 font-semibold">{data.flagged_sessions} Suspicious Sessions</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Score Range Distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.score_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#123B7A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Topic Performance */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Subject Topic Competency (%)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topic_performance || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="topic" type="category" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#2563EB" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Completion Rate Trend & Proctoring Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Assessment Completion Rate (%)</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={completionRateData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#123B7A" strokeWidth={3} dot={{ fill: "#2563EB", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Proctoring Telemetry Breakdown</h2>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.proctoring_signals || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                    >
                      {(data.proctoring_signals || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#123B7A"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] space-y-1 text-slate-500 pt-2 border-t border-slate-100">
                {(data.proctoring_signals || []).map((sig: any) => (
                  <div key={sig.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sig.color }} />
                      {sig.name}
                    </span>
                    <span className="font-bold text-slate-800">{sig.value} incidents</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
