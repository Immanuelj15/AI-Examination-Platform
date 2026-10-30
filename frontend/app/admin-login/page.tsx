"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle,
  KeyRound, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const { login, loginAsDemo } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please provide administrator credentials.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (!success) {
      setErrorMsg("Invalid administrative credentials. Access denied.");
    }
  };

  const handleAdminDemo = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    const success = await loginAsDemo("ADMIN");
    setSubmitting(false);
    if (!success) {
      setErrorMsg("Failed to authenticate as Admin. Please ensure backend is running.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans select-none">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            🛡️
          </div>
          <span className="text-base font-extrabold tracking-tight text-white">Evalora Admin Console</span>
        </Link>
        <Link href="/login" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          Candidate Portal
        </Link>
      </header>

      {/* Main Form Box */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center space-y-2 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center font-bold mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Administrative Sign In</h2>
            <p className="text-xs text-slate-400">Restricted Institutional Access • System Supervisors Only</p>
          </div>

          {/* Quick Admin Test Button */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-rose-400">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Root Authority Access
              </span>
              <span className="text-[10px] text-slate-500">One-click test</span>
            </div>
            <button
              type="button"
              onClick={handleAdminDemo}
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              👑 Sign in as Root Institutional Admin
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs font-semibold text-rose-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 h-11 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 h-11 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Access Administrative Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-800 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict IP & Audit Log Enforcement Active</span>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        Evalora Enterprise Administrative Shield • Unauthorized Access is strictly logged and audited.
      </footer>
    </div>
  );
}

