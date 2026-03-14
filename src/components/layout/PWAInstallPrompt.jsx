import React, { useState, useEffect } from "react";
import { X, Share, Plus } from "lucide-react";

const DISMISS_KEY = "pwa_prompt_dismissed_until";
const DISMISS_DAYS = 30;

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  // Safari on iOS — not Chrome/Firefox/etc.
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
  return isIos && isSafari;
}

function isStandalone() {
  return typeof window !== "undefined" && window.navigator.standalone === true;
}

export default function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosSafari() || isStandalone()) return;
    try {
      const until = localStorage.getItem(DISMISS_KEY);
      if (until && Date.now() < parseInt(until, 10)) return;
    } catch {}
    // Show after a short delay so it doesn't clash with page load
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(until));
    } catch {}
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-[var(--modal-border)] p-4 animate-in slide-in-from-bottom-4 duration-300"
      role="dialog"
      aria-label="Add to Home Screen prompt"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/f8b2256fa_modalitinerantlogo2.png"
            alt="Modal Itinerant"
            className="w-8 h-8 rounded-xl object-contain"
          />
          <p className="text-sm font-bold text-[var(--modal-text)]">Add to Home Screen</p>
        </div>
        <button onClick={dismiss} className="text-[var(--modal-text-muted)] hover:text-[var(--modal-text)] p-1" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F0F0F0] flex items-center justify-center shrink-0">
            <Share className="w-5 h-5 text-[#007AFF]" />
          </div>
          <p className="text-xs text-[var(--modal-text-muted)]">
            Tap the <span className="font-semibold text-[var(--modal-text)]">Share</span> button in Safari's toolbar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F0F0F0] flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-[#007AFF]" />
          </div>
          <p className="text-xs text-[var(--modal-text-muted)]">
            Scroll down and tap <span className="font-semibold text-[var(--modal-text)]">"Add to Home Screen"</span> for one-tap access
          </p>
        </div>
      </div>

      <button
        onClick={dismiss}
        className="w-full text-center text-xs font-semibold text-[#400070] bg-[#F7F3FA] hover:bg-[#EADDF5] rounded-xl py-2.5 transition-colors"
      >
        Got it
      </button>
    </div>
  );
}