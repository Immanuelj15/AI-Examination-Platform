"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Menu, X, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { LanguageSelector } from "./LanguageSelector";

export function Navbar() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-15 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#123B7A] flex items-center justify-center text-white shadow-xs group-hover:bg-[#1E4B94] transition-colors">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-[#123B7A]">Evalora</span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200/60 uppercase tracking-wider">
              Assessment Cloud
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links: Standard corporate website navigation */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-lg text-slate-700 hover:text-[#123B7A] hover:bg-slate-100/80 transition-all font-medium whitespace-nowrap"
          >
            Home
          </Link>

          <Link
            href="#about"
            className="px-3.5 py-1.5 rounded-lg text-slate-700 hover:text-[#123B7A] hover:bg-slate-100/80 transition-all font-medium whitespace-nowrap"
          >
            About Us
          </Link>
          
          <Link
            href="#features"
            className="px-3.5 py-1.5 rounded-lg text-slate-700 hover:text-[#123B7A] hover:bg-slate-100/80 transition-all font-medium whitespace-nowrap"
          >
            Features
          </Link>

          <Link
            href="#workflow"
            className="px-3.5 py-1.5 rounded-lg text-slate-700 hover:text-[#123B7A] hover:bg-slate-100/80 transition-all font-medium whitespace-nowrap"
          >
            Workflow
          </Link>
          
          <Link
            href="#security"
            className="px-3.5 py-1.5 rounded-lg text-slate-700 hover:text-[#123B7A] hover:bg-slate-100/80 transition-all font-medium whitespace-nowrap"
          >
            Security
          </Link>
          
          <Link
            href="#contact"
            className="px-3.5 py-1.5 rounded-lg text-slate-700 hover:text-[#123B7A] hover:bg-slate-100/80 transition-all font-medium whitespace-nowrap"
          >
            Contact
          </Link>
        </nav>

        {/* Actions & Language Selector */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <LanguageSelector />

          {mounted && user ? (
            <div className="flex items-center gap-2">
              <Link
                href={
                  user.role === "ADMIN"
                    ? "/admin/dashboard"
                    : user.role === "EXAMINER"
                    ? "/examiner/dashboard"
                    : "/student/dashboard"
                }
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#123B7A] text-white text-xs font-bold hover:bg-[#1E4B94] transition-all shadow-xs active:scale-95"
              >
                <span>Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#123B7A] text-white text-xs font-bold hover:bg-[#1E4B94] transition-all shadow-xs active:scale-95"
              >
                <span>Launch Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSelector />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 px-5 py-4 space-y-2 bg-white shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#123B7A]"
          >
            Home
          </Link>
          <Link
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#123B7A]"
          >
            About Us
          </Link>
          <Link
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#123B7A]"
          >
            Features
          </Link>
          <Link
            href="#workflow"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#123B7A]"
          >
            Workflow
          </Link>
          <Link
            href="#security"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#123B7A]"
          >
            Security
          </Link>
          <Link
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#123B7A]"
          >
            Contact
          </Link>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl bg-[#123B7A] text-white text-sm font-bold shadow-sm"
            >
              Sign In to Assessment Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
