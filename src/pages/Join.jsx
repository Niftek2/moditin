import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Sparkles, ArrowRight, FlaskConical } from "lucide-react";
import DemoEmailGate from "../components/demo/DemoEmailGate";

const MONTHLY_PRICE_ID = "price_1T4B1rG8v8oKpU6mPPumccla"; // $17.99/month

export default function JoinPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemoGate, setShowDemoGate] = useState(false);

  const handleCheckout = async () => {
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("stripeCheckout", {
        priceId: MONTHLY_PRICE_ID,
        successUrl: window.location.origin + "/Dashboard?checkout_success=1",
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/f8b2256fa_modalitinerantlogo2.png"
            alt="Modal Itinerant"
            className="h-48 object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-[#1A1028]">Start your free trial</h1>
          <p className="text-sm text-[#6B5E80] mt-1">7 days free, then $17.99/month</p>
        </div>

        {/* Pricing card */}
        <div className="bg-white rounded-2xl border border-[#D8CCE8] shadow-md p-6 mb-6">
          <div className="flex items-end gap-1 mb-1">
            <span className="text-4xl font-bold text-[#1A1028]">$17.99</span>
            <span className="text-[#6B5E80] mb-1">/month</span>
          </div>
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

        {/* District / Program pricing link */}
        <div className="mt-6 rounded-xl border border-[#D8CCE8] bg-[#F7F3FA] p-4 text-center">
          <p className="text-sm font-semibold text-[#400070] mb-1">Purchasing for a district or program?</p>
          <p className="text-xs text-[#6B5E80] mb-3">See volume pricing for Starter, Program, and District plans.</p>
          <a href="/DistrictPricing">
            <Button className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2">
              View District & Program Pricing <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-[#6B5E80] mb-2">
            Already have an account?{" "}
            <button
              onClick={() => base44.auth.redirectToLogin("/Dashboard")}
              className="text-[#400070] font-semibold underline hover:text-[#5B00A0]"
            >
              Sign in
            </button>
          </p>
        </div>

        <div className="mt-2 text-center">
          <p className="text-sm text-[#6B5E80] mb-2">Not ready to subscribe?</p>
          <Button
            variant="outline"
            onClick={() => setShowDemoGate(true)}
            className="border-[#D8CCE8] text-[#400070] hover:bg-[#F7F3FA] gap-2"
          >
            <FlaskConical className="w-4 h-4" />
            Explore with sample data
          </Button>
        </div>
      </div>

      {showDemoGate && (
        <DemoEmailGate
          onEnter={() => { setShowDemoGate(false); window.location.href = "/Dashboard?demo=1"; }}
          onCancel={() => setShowDemoGate(false)}
        />
      )}
    </div>
  );
}