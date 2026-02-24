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

  // Paywall screen
  return (
    <div className="min-h-screen bg-[var(--modal-bg)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="modal-card max-w-md w-full p-8 text-center space-y-6">

        <div className="flex flex-col items-center gap-1">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/f8b2256fa_modalitinerantlogo2.png"
            alt="Modal Itinerant"
            className="w-24 h-24 object-contain"
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[var(--modal-text)] mb-2">Start Your Free Trial</h1>
          <p className="text-[var(--modal-text-muted)] text-sm leading-relaxed">Get full access to Modal Itinerant — SMART goal writing, session logging, interactive activities, and more.

          </p>
        </div>

        <div className="bg-[#F7F3FA] rounded-xl p-4 space-y-2">
          {[
          "7-day free trial — no charge today",
          "AI-powered goal writing & activities",
          "Session logging & service hours",
          "Equipment tracking & reminders",
          "Cancel anytime"].
          map((feature) =>
          <div key={feature} className="flex items-center gap-2 text-sm text-[var(--modal-text)]">
              <div className="w-4 h-4 rounded-full bg-[#400070] flex items-center justify-center shrink-0">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {feature}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleSubscribe}
            disabled={loadingCheckout}
            className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-12 text-base font-semibold">

            {loadingCheckout ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loadingCheckout ? "Redirecting..." : "Start Free Trial — $17.99/mo"}
          </Button>
          <p className="text-xs text-[var(--modal-text-muted)]">
            No credit card required during trial. Cancel anytime before trial ends.
          </p>
        </div>
      </motion.div>
    </div>);

}