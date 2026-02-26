import React, { useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { differenceInDays, fromUnixTime } from "date-fns";
import { isIosPlatform } from "./platformUtils";

export default function FreemiumBanner({ subStatus }) {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleUpgrade = async () => {
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app, not the preview.");
      return;
    }
    setLoadingCheckout(true);
    try {
      const res = await base44.functions.invoke("stripeCheckout", {
        successUrl: window.location.origin + "/?subscribed=1",
        cancelUrl: window.location.origin + "/",
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        alert("Could not start checkout: " + (res.data?.error || "Unknown error"));
      }
    } catch (err) {
      alert("Could not start checkout: " + (err?.response?.data?.error || err?.message || "Unknown error"));
    } finally {
      setLoadingCheckout(false);
    }
  };

  const isTrial = subStatus?.isTrial;
  const trialDaysLeft = isTrial && subStatus?.trialEnd
    ? Math.max(0, differenceInDays(fromUnixTime(subStatus.trialEnd), new Date()))
    : null;

  const studentCount = subStatus?.studentCount ?? 0;
  const atLimit = !isTrial && !subStatus?.isPro && studentCount >= 3;

  // Don't show banner if pro
  if (subStatus?.isPro) return null;

  return (
    <div className={`mb-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-sm ${
      atLimit
        ? "bg-amber-50 border border-amber-200"
        : isTrial
        ? "bg-[#EADDF5] border border-[#C9B3E0]"
        : "bg-[#F3EDF9] border border-[#D8CDE5]"
    }`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Sparkles className="w-4 h-4 text-[#400070] shrink-0" />
        <span className="text-[var(--modal-text)] truncate">
          {isTrial
            ? `Trial active — ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left. Unlimited access until then.`
            : atLimit
            ? `You've reached the 3-student free limit. Upgrade to add more.`
            : `Free plan — up to 3 students. ${3 - studentCount} spot${3 - studentCount !== 1 ? "s" : ""} remaining.`
          }
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleUpgrade}
          disabled={loadingCheckout}
          className="text-xs font-semibold text-white bg-[#400070] hover:bg-[#5B00A0] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1"
        >
          {loadingCheckout ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Upgrade
        </button>
        {!atLimit && (
          <button onClick={() => setDismissed(true)} className="text-[var(--modal-text-muted)] hover:text-[var(--modal-text)]">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}