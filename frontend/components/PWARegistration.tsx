"use client";

import { useEffect, useState } from "react";
import { WifiOff, X } from "lucide-react";

export function PWARegistration() {
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // In development or on localhost, proactively unregister any active Service Worker and purge caches
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV !== "production" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
            console.log("[PWA] Development mode: unregistered service worker:", reg.scope);
          }
        });
        if ("caches" in window) {
          caches.keys().then((names) => {
            for (const name of names) {
              caches.delete(name);
              console.log("[PWA] Development mode: cleared cache:", name);
            }
          });
        }
        return;
      }

      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    const handleOnline = () => setOffline(false);
    const handleOffline = () => {
      setOffline(true);
      setDismissed(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-950/90 text-amber-100 border border-amber-500/30 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
      <span>
        <strong>Connection interrupted.</strong> Your session state and answers are being protected locally. Reconnect to continue.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 p-1 hover:bg-amber-800/50 rounded-lg text-amber-300 transition-colors"
        aria-label="Dismiss offline banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
