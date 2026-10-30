"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "../locales/en.json";
import ta from "../locales/ta.json";
import hi from "../locales/hi.json";
import ml from "../locales/ml.json";
import te from "../locales/te.json";
import kn from "../locales/kn.json";

export type LanguageCode = "en" | "ta" | "hi" | "ml" | "te" | "kn";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
];

const dictionaries: Record<LanguageCode, any> = {
  en,
  ta,
  hi,
  ml,
  te,
  kn,
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (keyPath: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (k) => k,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    const saved = localStorage.getItem("evalora_lang") as LanguageCode;
    if (saved && dictionaries[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("evalora_lang", lang);
  };

  const t = (keyPath: string, fallback?: string): string => {
    const keys = keyPath.split(".");
    let current = dictionaries[language];
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        // Fallback to English dictionary
        let enCurrent = dictionaries["en"];
        for (const ek of keys) {
          if (enCurrent && typeof enCurrent === "object" && ek in enCurrent) {
            enCurrent = enCurrent[ek];
          } else {
            return fallback || keyPath;
          }
        }
        return typeof enCurrent === "string" ? enCurrent : (fallback || keyPath);
      }
    }
    return typeof current === "string" ? current : (fallback || keyPath);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
