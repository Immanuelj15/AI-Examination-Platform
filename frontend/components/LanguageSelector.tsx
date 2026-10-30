"use client";

import React, { useState } from "react";
import { Globe, Check } from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from "@/context/LanguageContext";

export function LanguageSelector({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          variant === "dark"
            ? "bg-[#1E293B] border-slate-700 text-white hover:bg-slate-700"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
        aria-label="Select language"
      >
        <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
        <span>{currentLang.nativeLabel}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              Select Language
            </div>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-[#123B7A] transition-colors text-left"
              >
                <div>
                  <span className="font-medium text-slate-900">{lang.nativeLabel}</span>
                  <span className="text-[11px] text-slate-400 ml-2">({lang.label})</span>
                </div>
                {language === lang.code && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
