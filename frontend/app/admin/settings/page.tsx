"use client";

import React, { useState } from "react";
import { Settings, Shield, Sliders, Cpu, Save, CheckCircle2, Lock } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    heartbeatSeconds: 10,
    faceAbsencePenalty: 10,
    multipleFacesPenalty: 25,
    gazeAwayPenalty: 10,
    tabSwitchPenalty: 15,
    windowBlurPenalty: 10,
    fullscreenExitPenalty: 15,
    suspicionThreshold: 50,
    llmModel: "gpt-4o-mini",
    sessionTimeoutHours: 2,
    strictBrowserLock: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">System & Algorithmic Configurations</h1>
              <p className="text-xs text-slate-500">Tune AI computer-vision suspicion weights, LLM grading parameters, and security policies</p>
            </div>
          </div>

          {saved && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Platform settings updated</span>
            </div>
          )}
        </header>

        <main className="p-6 max-w-4xl mx-auto w-full space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Proctoring Suspicion Algorithm Weights */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sliders className="w-4 h-4 text-[#123B7A]" />
                <h2 className="text-sm font-bold text-slate-900">Proctoring Suspicion Scoring Engine</h2>
              </div>
              <p className="text-xs text-slate-500">
                Adjust penalty increments added to candidate suspicion score (0–100) per detected violation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Face Absent Penalty (+pts)</label>
                  <input
                    type="number"
                    value={settings.faceAbsencePenalty}
                    onChange={e => setSettings({ ...settings, faceAbsencePenalty: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Multiple Faces Detected Penalty (+pts)</label>
                  <input
                    type="number"
                    value={settings.multipleFacesPenalty}
                    onChange={e => setSettings({ ...settings, multipleFacesPenalty: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gaze Away / Head Turn Penalty (+pts)</label>
                  <input
                    type="number"
                    value={settings.gazeAwayPenalty}
                    onChange={e => setSettings({ ...settings, gazeAwayPenalty: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tab Switch / Blur Penalty (+pts)</label>
                  <input
                    type="number"
                    value={settings.tabSwitchPenalty}
                    onChange={e => setSettings({ ...settings, tabSwitchPenalty: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telemetry Heartbeat Interval (seconds)</label>
                  <input
                    type="number"
                    value={settings.heartbeatSeconds}
                    onChange={e => setSettings({ ...settings, heartbeatSeconds: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Session Flagging Threshold (0–100)</label>
                  <input
                    type="number"
                    value={settings.suspicionThreshold}
                    onChange={e => setSettings({ ...settings, suspicionThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
                  />
                </div>
              </div>
            </div>

            {/* AI Evaluation Configuration */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Cpu className="w-4 h-4 text-[#123B7A]" />
                <h2 className="text-sm font-bold text-slate-900">LLM Subjective Evaluation Provider</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selected Foundation Model</label>
                  <select
                    value={settings.llmModel}
                    onChange={e => setSettings({ ...settings, llmModel: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
                  >
                    <option value="gpt-4o-mini">OpenAI GPT-4o-mini (Recommended - Low Latency)</option>
                    <option value="gpt-4o">OpenAI GPT-4o (High Reasoning)</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate View Restriction</label>
                  <div className="text-xs text-slate-500 pt-2 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Internal reasoning strictly hidden from candidate scorecard
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#123B7A] text-white text-xs font-bold hover:bg-[#1E4B94] transition-all shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save Platform Configurations</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
