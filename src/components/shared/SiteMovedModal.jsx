import React, { useEffect, useState } from "react";
import { ArrowRight, Archive, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const NEW_SITE_URL = "https://dhhitinerant.com";
const DISMISS_KEY = "site_moved_dismissed_v1";

export default function SiteMovedModal() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === "true"
  );
  const [seconds, setSeconds] = useState(15);
  const [staying, setStaying] = useState(false);

  useEffect(() => {
    if (dismissed || staying) return;
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          window.location.href = NEW_SITE_URL;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [dismissed, staying]);

  const handleStay = async () => {
    setStaying(true);
    sessionStorage.setItem(DISMISS_KEY, "true");
    let loggedIn = false;
    try {
      loggedIn = await base44.auth.isAuthenticated();
    } catch (e) {
      loggedIn = false;
    }
    if (!loggedIn && window.location.pathname !== "/Join") {
      // Signed-out visitors go to the sign-in page to access their archived account
      window.location.href = "/Join";
      return;
    }
    setStaying(false);
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="This site has moved"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div
          className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg, #400070 0%, #6B2FB9 100%)" }}
        >
          <ArrowRight className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[#1A1028] mb-2">We've Moved!</h2>
        <p className="text-[#4A4A4A] mb-1">
          Modal Itinerant is now located at our new home:
        </p>
        <p className="font-bold text-[#400070] text-lg mb-4">dhhitinerant.com</p>
        <p className="text-sm text-[#4A4A4A] mb-6">
          You'll be redirected automatically in{" "}
          <span className="font-semibold">{seconds}</span> second{seconds === 1 ? "" : "s"}.
          Or stay here to view your archived account and export your data for
          transfer to the new site.
        </p>
        <a
          href={NEW_SITE_URL}
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-base mb-3"
          style={{ background: "linear-gradient(135deg, #400070 0%, #6B2FB9 100%)" }}
        >
          Go to the New Site Now
          <ArrowRight className="w-4 h-4" />
        </a>
        <button
          onClick={handleStay}
          disabled={staying}
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[#D8CDE5] text-[#400070] font-semibold text-sm hover:bg-[#F7F3FA] transition-colors disabled:opacity-60"
        >
          {staying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
          Stay & View My Archived Account
        </button>
        <p className="text-xs text-[#A0A0A0] mt-3">
          You can export your data from Settings → Export My Data.
        </p>
      </div>
    </div>
  );
}