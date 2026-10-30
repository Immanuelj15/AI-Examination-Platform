"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function LoginPage() {
  const { login, loginAsDemo, isLoading } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please provide both email and password.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (!success) {
      setErrorMsg("Invalid credentials. Please verify your email and password.");
    }
  };

  const handleDemoClick = async (role: "ADMIN" | "EXAMINER" | "STUDENT") => {
    setErrorMsg(null);
    setSubmitting(true);
    const success = await loginAsDemo(role);
    setSubmitting(false);
    if (!success) {
      setErrorMsg(`Failed to authenticate as ${role}. Please ensure backend is running.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#123B7A] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            E
          </div>
          <span className="text-lg font-bold text-[#123B7A]">Evalora</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
            Back to Website
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Left Hero Box */}
          <div className="md:col-span-5 bg-[#123B7A] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/60 border border-blue-400/30 text-xs font-semibold text-blue-200">
                <Sparkles className="w-4 h-4 text-blue-300" />
                <span>Enterprise Assessment Cloud</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                Unified Institutional Assessment Portal
              </h2>
              <p className="text-sm text-blue-100/90 leading-relaxed">
                Log in to coordinate examinations, complete proctored evaluations, or grade candidate submissions with AI rubric assistance.
              </p>
            </div>

            <div className="space-y-3.5 pt-8 border-t border-blue-900/60 relative z-10 text-sm">
              <div className="flex items-center gap-2.5 text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Client-Side Computer Vision Telemetry</span>
              </div>
              <div className="flex items-center gap-2.5 text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Authoritative Server-Side Timers</span>
              </div>
              <div className="flex items-center gap-2.5 text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Tamper-Resistant Cryptographic Verification</span>
              </div>
            </div>
          </div>

          {/* Right Form Box */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {t("auth.signInTitle", "Sign in to Evalora")}
              </h3>
              <p className="text-sm sm:text-[15px] text-slate-500 font-medium mt-1.5">
                {t("auth.signInSubtitle", "Select your portal or enter your institutional credentials")}
              </p>
            </div>

            {/* Instant Demo Role Switcher */}
            <div className="mb-6 p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#123B7A]">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#2563EB]" />
                  Quick Demo Access
                </span>
                <span className="text-xs text-slate-400 font-normal">One-click test</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDemoClick("ADMIN")}
                  disabled={submitting}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 hover:border-[#123B7A] hover:bg-slate-50 transition-all text-center shadow-xs btn-interactive"
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoClick("EXAMINER")}
                  disabled={submitting}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 hover:border-[#123B7A] hover:bg-slate-50 transition-all text-center shadow-xs btn-interactive"
                >
                  👨‍🏫 Examiner
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoClick("STUDENT")}
                  disabled={submitting}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 hover:border-[#123B7A] hover:bg-slate-50 transition-all text-center shadow-xs btn-interactive"
                >
                  🎓 Student
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm font-semibold text-rose-700 flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t("auth.email", "Institutional Email Address")}
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@institution.edu"
                    className="w-full pl-11 pr-4 h-12 text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    {t("auth.password", "Password")}
                  </label>
                  <span className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer">
                    {t("auth.forgotPassword", "Forgot password?")}
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-4 h-12 text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2.5 text-sm text-slate-600 cursor-pointer">
                  {t("auth.rememberMe", "Remember this workstation for 7 days")}
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 px-6 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-base font-bold transition-all shadow-sm flex items-center justify-center gap-2.5 disabled:opacity-50 btn-interactive"
              >
                {submitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{t("auth.signInButton", "Access Assessment Cloud")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        Evalora Enterprise Security • ISO 27001 Certified • Automated RBAC Session Invalidation
      </footer>
    </div>
  );
}
