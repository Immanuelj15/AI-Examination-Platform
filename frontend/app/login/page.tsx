"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle,
  KeyRound, Sparkles, User, GraduationCap, Briefcase
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function LoginPage() {
  const { login, loginAsDemo, register } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<"SIGN_IN" | "SIGN_UP">("SIGN_IN");

  // Sign In Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up Fields
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"STUDENT" | "EXAMINER">("STUDENT");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please provide both email and password.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (!success) {
      setErrorMsg("Invalid credentials. Please verify your email and password.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg("Please fill in all registration fields.");
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    const res = await register(fullName, regEmail, regPassword, regRole);
    setSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.message || "Registration failed. Please try a different email.");
    } else {
      setSuccessMsg("Account successfully created! Redirecting to your dashboard...");
    }
  };

  const handleDemoClick = async (role: "EXAMINER" | "STUDENT") => {
    setErrorMsg(null);
    setSuccessMsg(null);
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
                <span>Authoritative Server-Side Clocks</span>
              </div>
              <div className="flex items-center gap-2.5 text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Tamper-Resistant Cryptographic Verification</span>
              </div>
            </div>
          </div>

          {/* Right Form Box */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
            {/* Tab Switcher: Sign In vs Create Account */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("SIGN_IN");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  mode === "SIGN_IN"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("SIGN_UP");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  mode === "SIGN_UP"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mb-5">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {mode === "SIGN_IN" ? "Sign in to Evalora" : "Create New Account"}
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {mode === "SIGN_IN"
                  ? "Select your portal or enter your institutional credentials"
                  : "Register as a Student candidate or Examiner faculty"}
              </p>
            </div>

            {/* Quick Demo Access (ONLY Examiner and Student - Admin hidden for security) */}
            {mode === "SIGN_IN" && (
              <div className="mb-5 p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#123B7A]">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#2563EB]" />
                    Quick Demo Access
                  </span>
                  <span className="text-xs text-slate-400 font-normal">One-click test</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDemoClick("EXAMINER")}
                    disabled={submitting}
                    className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 hover:border-[#123B7A] hover:bg-slate-50 transition-all text-center shadow-xs cursor-pointer"
                  >
                    👨‍🏫 Examiner
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoClick("STUDENT")}
                    disabled={submitting}
                    className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 hover:border-[#123B7A] hover:bg-slate-50 transition-all text-center shadow-xs cursor-pointer"
                  >
                    🎓 Student
                  </button>
                </div>
              </div>
            )}

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-semibold text-rose-700 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-emerald-700 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form 1: Sign In */}
            {mode === "SIGN_IN" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@institution.edu"
                      className="w-full pl-10 pr-4 h-11 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Password
                    </label>
                    <span className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 h-11 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 px-6 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-500 pt-2">
                  New to Evalora?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("SIGN_UP");
                      setErrorMsg(null);
                    }}
                    className="font-bold text-[#123B7A] hover:underline cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              </form>
            ) : (
              /* Form 2: Create Account / Sign Up */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-10 pr-4 h-11 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. candidate@example.com"
                      className="w-full pl-10 pr-4 h-11 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole("STUDENT")}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        regRole === "STUDENT"
                          ? "border-[#123B7A] bg-blue-50 text-[#123B7A] ring-1 ring-[#123B7A]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span>Student (Candidate)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole("EXAMINER")}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        regRole === "EXAMINER"
                          ? "border-[#123B7A] bg-blue-50 text-[#123B7A] ring-1 ring-[#123B7A]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      <span>Examiner (Faculty)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-4 h-11 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <span>Creating account...</span>
                  ) : (
                    <>
                      <span>Create Account & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-500 pt-2">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("SIGN_IN");
                      setErrorMsg(null);
                    }}
                    className="font-bold text-[#123B7A] hover:underline cursor-pointer"
                  >
                    Sign In here
                  </button>
                </p>
              </form>
            )}
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
