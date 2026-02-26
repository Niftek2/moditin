import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Sparkles, ArrowRight } from "lucide-react";

const MONTHLY_PRICE_ID = "price_1T4B1rG8v8oKpU6mPPumccla"; // $17.99/month
const ANNUAL_PRICE_ID = "price_1T4B1rG8v8oKpU6my9bQBS46";  // $179/year

export default function JoinPage() {
  const [plan, setPlan] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const priceId = plan === "annual" ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;
      const res = await base44.functions.invoke("stripeCheckout", {
        priceId,
        successUrl: window.location.origin + "/Dashboard",
        cancelUrl: window.location.href,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError("Could not start checkout. Please try again.");
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F3FA] to-[#EADDF5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/f8b2256fa_modalitinerantlogo2.png"
            alt="Modal Itinerant"
            className="h-14 object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-[#1A1028]">Start your free trial</h1>
          <p className="text-sm text-[#6B5E80] mt-1">7 days free, then choose your plan</p>
        </div>

        {/* Plan toggle */}
        <div className="flex bg-white rounded-2xl p-1.5 border border-[#D8CCE8] shadow-sm mb-6">
          <button
            onClick={() => setPlan("monthly")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              plan === "monthly"
                ? "bg-[#400070] text-white shadow"
                : "text-[#6B5E80] hover:text-[#400070]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPlan("annual")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
              plan === "annual"
                ? "bg-[#400070] text-white shadow"
                : "text-[#6B5E80] hover:text-[#400070]"
            }`}
          >
            Annual
            <span className={`absolute -top-2 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              plan === "annual" ? "bg-green-400 text-white" : "bg-green-100 text-green-700"
            }`}>
              Save 16%
            </span>
          </button>
        </div>

        {/* Pricing card */}
        <div className="bg-white rounded-2xl border border-[#D8CCE8] shadow-md p-6 mb-6">
          <div className="flex items-end gap-1 mb-1">
            <span className="text-4xl font-bold text-[#1A1028]">
              {plan === "annual" ? "$179" : "$17.99"}
            </span>
            <span className="text-[#6B5E80] mb-1">
              {plan === "annual" ? "/year" : "/month"}
            </span>
            </div>
            {plan === "annual" && (
            <p className="text-xs text-[#6B5E80] mb-3">That's ~$14.92/month, billed annually</p>
            )}
          <p className="text-sm font-semibold text-[#400070] mb-4">
            7-day free trial included
          </p>
          <ul className="space-y-2 text-sm text-[#3B3147]">
            {[
              "Unlimited students",
              "AI goal writing & activities",
              "Worksheet generator",
              "Calendar & service hour tracking",
              "Ling 6 sound checks",
              "Labeling activities",
              "Equipment tracking",
              "Mileage & reminders",
            ].map(feature => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center mb-4">{error}</p>
        )}

        <Button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white h-12 text-base rounded-xl gap-2 shadow-md"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting…</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Start free trial <ArrowRight className="w-4 h-4" /></>
          )}
        </Button>

        <p className="text-[11px] text-[#8B7EA0] text-center mt-4">
          No charge for 7 days. Cancel anytime from your account settings. By signing up you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}