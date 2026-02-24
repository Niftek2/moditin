import React, { useState, useEffect, createContext, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { format, fromUnixTime } from "date-fns";

const SubscriptionContext = createContext(null);

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export function SubscriptionProvider({ children }) {
  const [subStatus, setSubStatus] = useState(null); // null = loading
  const [checking, setChecking] = useState(true);

  const checkStatus = async () => {
    try {
      const res = await base44.functions.invoke("stripeStatus", {});
      setSubStatus(res.data);
    } catch {
      // If function fails (e.g. not logged in), treat as no subscription
      setSubStatus({ isActive: false, status: "none" });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ subStatus, checking, refetch: checkStatus }}>
      {children}
    </SubscriptionContext.Provider>);

}

export default function SubscriptionGate({ children }) {
  const { subStatus, checking } = useSubscription();
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const handleSubscribe = async () => {
    // Block if in iframe (preview)
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app, not the preview.");
      return;
    }
    setLoadingCheckout(true);
    try {
      const res = await base44.functions.invoke("stripeCheckout", {
        successUrl: window.location.href + "?subscribed=1",
        cancelUrl: window.location.href
      });
      if (res.data?.url) window.location.href = res.data.url;
    } catch (err) {
      alert("Could not start checkout. Please try again.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--modal-bg)]">
        <Loader2 className="w-8 h-8 animate-spin text-[#400070]" />
      </div>);

  }

  if (subStatus?.isActive) {
    return <>{children}</>;
  }

  const benefits = [
    "7-day free trial, no charge today",
    "AI goal writing + activity ideas",
    "Fast session logging + service hours",
    "Equipment tracking + reminders",
    "Cancel anytime",
  ];

  // Paywall screen
  return (
    <div className="min-h-screen bg-[var(--modal-bg)] flex items-start justify-center px-4 pt-6 pb-10 sm:items-center sm:pt-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-[440px]"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/f8b2256fa_modalitinerantlogo2.png"
            alt="Modal Itinerant"
            className="h-16 sm:h-20 object-contain mb-4"
          />
          <h1 className="text-[32px] sm:text-[38px] font-extrabold text-[var(--modal-text)] leading-tight mb-2 tracking-tight">
            Modal Itinerant
          </h1>
          <p className="text-[var(--modal-text-muted)] text-sm leading-relaxed max-w-[300px]">
            Designed specifically for itinerant Teachers of the Deaf and Hard of Hearing.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[var(--modal-border)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--modal-text-muted)]">Start your free trial</span>
          <div className="flex-1 h-px bg-[var(--modal-border)]" />
        </div>

        {/* Benefits card */}
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--modal-text-muted)] mb-2 px-1">
            What you get
          </p>
          <div className="bg-gradient-to-br from-white to-[#F7F3FA] border border-[var(--modal-border)] rounded-2xl p-4 shadow-sm space-y-3">
            {benefits.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm text-[var(--modal-text)]">
                <div className="w-5 h-5 rounded-full bg-[#400070] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Trial pill */}
        <div className="flex justify-center mb-3">
          <span className="inline-block bg-[#EADDF5] text-[#400070] text-xs font-medium px-3 py-1 rounded-full">
            7-day free trial
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={loadingCheckout}
          className="w-full bg-[#400070] hover:bg-[#5B00A0] active:bg-[#32005A] disabled:opacity-60 text-white flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors"
          style={{ minHeight: "56px", padding: "10px 24px" }}
        >
          {loadingCheckout ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span className="text-base font-semibold leading-tight">Start Free Trial</span>
              <span className="text-[12px] leading-tight" style={{ opacity: 0.8 }}>$17.99/month after trial</span>
            </>
          )}
        </button>

        {/* Reassurance */}
        <p className="text-center text-xs text-[var(--modal-text-muted)] mt-3">
          No credit card today. Cancel before day 7 to avoid charges.
        </p>
      </motion.div>
    </div>
  );
}