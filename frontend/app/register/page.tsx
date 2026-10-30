"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock, Mail, ArrowRight, CheckCircle2, AlertCircle,
  User, GraduationCap, Briefcase, Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function RegisterPage() {
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "EXAMINER">("STUDENT");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg("Please fill in all registration fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    const res = await register(fullName, email, password, role);
    setSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.message || "Registration failed. An account with this email may already exist.");
    } else {
      setSuccessMsg("Account successfully created! Redirecting to your dashboard...");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between select-none font-sans">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#123B7A] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            E
          </div>
          <span className="text-lg font-bold text-[#123B7A]">Evalora</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link href="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
            Sign In
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#123B7A] text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Candidate & Faculty Onboarding</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create an Account</h2>
            <p className="text-xs text-slate-500">Sign up to take assessments or author proctored examinations</p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. candidate@example.com"
                  className="w-full pl-10 pr-4 h-11 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("STUDENT")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    role === "STUDENT"
                      ? "border-[#123B7A] bg-blue-50 text-[#123B7A] ring-1 ring-[#123B7A]"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("EXAMINER")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    role === "EXAMINER"
                      ? "border-[#123B7A] bg-blue-50 text-[#123B7A] ring-1 ring-[#123B7A]"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>Examiner</span>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
          </form>

          <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-[#123B7A] hover:underline">
              Sign In to existing account
            </Link>
          </p>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        Evalora Enterprise Security • ISO 27001 Certified • Automated RBAC Session Invalidation
      </footer>
    </div>
  );
}
