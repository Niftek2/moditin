import React, { useState } from "react";
import { X, Share, PlusSquare, MoreVertical, Download, Smartphone } from "lucide-react";
import { usePWAInstall } from "./PWAInstallContext";

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function Step({ number, icon: Icon, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-[#400070] text-white flex items-center justify-center shrink-0 text-xs font-bold">
        {number}
      </div>
      <div className="w-9 h-9 rounded-xl bg-[#F0EAF7] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#6B2FB9]" />
      </div>
      <p className="text-sm text-[var(--modal-text-muted)] leading-snug pt-1.5">{children}</p>
    </div>
  );
}

export default function PWAInstallGuideModal({ onClose }) {
  const { canInstall, promptInstall } = usePWAInstall();
  const [installed, setInstalled] = useState(false);
  const ios = isIos();

  const handleInstall = async () => {
    const ok = await promptInstall();
    if (ok) setInstalled(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-label="Get the App"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/80 rounded-full p-1.5 text-gray-500 hover:text-gray-800 shadow"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/f8b2256fa_modalitinerantlogo2.png"
            alt="Modal Itinerant"
            className="h-12 mx-auto object-contain mb-3"
          />
          <h2 className="text-xl font-bold text-[var(--modal-text)]">Get the App</h2>
          <p className="text-sm text-[var(--modal-text-muted)] mt-1">Free • No App Store required</p>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {ios ? (
            /* iOS Safari guide */
            <div className="space-y-4">
              <Step number={1} icon={Share}>
                Tap the <span className="font-semibold text-[var(--modal-text)]">Share</span> button in Safari's toolbar
              </Step>
              <Step number={2} icon={PlusSquare}>
                Scroll and tap <span className="font-semibold text-[var(--modal-text)]">"Add to Home Screen"</span>
              </Step>
              <Step number={3} icon={Smartphone}>
                Tap <span className="font-semibold text-[var(--modal-text)]">Add</span> — the app appears on your home screen
              </Step>
            </div>
          ) : canInstall ? (
            /* Android with native prompt */
            <div>
              {installed ? (
                <p className="text-center text-sm text-[var(--modal-text-muted)] py-4">
                  Follow the on-screen prompt to finish installing. 🎉
                </p>
              ) : (
                <button
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-2 bg-[#400070] hover:bg-[#52008C] text-white font-semibold rounded-xl py-3.5 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Install Now
                </button>
              )}
            </div>
          ) : (
            /* Android manual / desktop */
            <div className="space-y-4">
              <Step number={1} icon={MoreVertical}>
                Open the <span className="font-semibold text-[var(--modal-text)]">⋮ menu</span> in Chrome's toolbar
              </Step>
              <Step number={2} icon={Download}>
                Tap <span className="font-semibold text-[var(--modal-text)]">"Add to Home Screen"</span> or "Install app"
              </Step>
              <Step number={3} icon={Smartphone}>
                Confirm — the app appears on your home screen
              </Step>
            </div>
          )}

          <p className="text-center text-xs text-[var(--modal-text-disabled)] pt-1">
            Works on iPhone (Safari) and Android (Chrome)
          </p>
        </div>
      </div>
    </div>
  );
}