import React, { useState } from "react";
import { Smartphone, ArrowRight } from "lucide-react";
import PWAInstallGuideModal from "./PWAInstallGuideModal";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
}

export default function GetTheAppCard() {
  const [open, setOpen] = useState(false);

  // Already installed — no need to show
  if (isStandalone()) return null;

  return (
    <>
      <div className="rounded-2xl border border-[#D8CDE5] bg-white p-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#F0EAF7] flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-[#6B2FB9]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--modal-text)]">Use Modal Itinerant on the go</p>
          <p className="text-xs text-[var(--modal-text-muted)]">Add it to your home screen — free, no App Store.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-sm font-semibold text-[#400070] hover:text-[#52008C] shrink-0 whitespace-nowrap"
        >
          Get the App <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      {open && <PWAInstallGuideModal onClose={() => setOpen(false)} />}
    </>
  );
}