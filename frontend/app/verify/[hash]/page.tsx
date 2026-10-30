"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, XCircle, Award, Calendar, User, BookOpen, ExternalLink, ArrowRight } from "lucide-react";

interface VerificationData {
  verified: boolean;
  certificate_number: string;
  verification_hash: string;
  issued_to: string;
  exam_title: string;
  issue_date: string;
  score: number;
  max_score: number;
  percentage: number;
  percentile: number;
  grade: string;
  status: string;
  issuer: string;
}

export default function PublicCertificateVerificationPage() {
  const params = useParams();
  const hash = params?.hash as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hash) return;
    const fetchVerification = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/results/public/verify-certificate/${hash}`);
        if (!res.ok) {
          throw new Error("Certificate could not be verified or record does not exist.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to verify certificate");
      } finally {
        setLoading(false);
      }
    };
    fetchVerification();
  }, [hash]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-[#123B7A] selection:text-white">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#123B7A] flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-[#123B7A] tracking-tight">Evalora</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] font-bold border border-blue-200/60 uppercase">
            Trust Registry
          </span>
        </Link>
        <Link
          href="/login"
          className="text-xs font-bold text-[#123B7A] hover:underline flex items-center gap-1"
        >
          <span>Assessment Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Verification Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-600 font-mono">Verifying SHA-256 Cryptographic Hash...</p>
            </div>
          ) : error ? (
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Credential Not Verified</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
              <div className="pt-4">
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl bg-[#123B7A] text-white text-xs font-bold shadow-md hover:bg-[#1E4B94] transition-all"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : data ? (
            <div>
              {/* Authentic Banner */}
              <div className="bg-emerald-600 p-6 text-white text-center space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/40 text-emerald-100 text-xs font-bold border border-emerald-400/40 uppercase">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Officially Verified Credential</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">Authentic Assessment Certificate</h1>
                <p className="text-xs text-emerald-100 font-mono">Credential ID: {data.certificate_number}</p>
              </div>

              {/* Certificate Details */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Awarded To</span>
                    <span className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#123B7A]" />
                      <span>{data.issued_to}</span>
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Assessment Title</span>
                    <span className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#123B7A]" />
                      <span>{data.exam_title}</span>
                    </span>
                  </div>
                </div>

                {/* Score & Ranking Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
                    <span className="text-[11px] font-bold text-blue-800 uppercase block">Total Score</span>
                    <span className="text-xl font-black text-[#123B7A] font-mono mt-1 block">
                      {data.score} / {data.max_score}
                    </span>
                    <span className="text-[11px] text-blue-600 font-semibold">({data.percentage}%)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
                    <span className="text-[11px] font-bold text-indigo-800 uppercase block">Percentile</span>
                    <span className="text-xl font-black text-indigo-900 font-mono mt-1 block">
                      {data.percentile}th
                    </span>
                    <span className="text-[11px] text-indigo-600 font-semibold">Top Tier Standing</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase block">Grade</span>
                    <span className="text-xl font-black text-emerald-900 font-mono mt-1 block">
                      {data.grade || "PASS"}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">Certified</span>
                  </div>
                </div>

                {/* Security Verification Footer */}
                <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Cryptographic Hash:</span>
                    <span className="font-bold text-slate-700">{data.verification_hash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Issued Authority:</span>
                    <span className="text-slate-700">{data.issuer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timestamp:</span>
                    <span className="text-slate-700">{new Date(data.issue_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 Evalora Assessment Systems. All certificates cryptographically immutable.
      </footer>
    </div>
  );
}

