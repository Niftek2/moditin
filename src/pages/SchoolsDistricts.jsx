import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Users, Building2, GraduationCap, Globe, ArrowLeft, FlaskConical, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import DemoEmailGate from "../components/demo/DemoEmailGate";

const DISTRICT_PLANS = [
  {
    key: "starter",
    name: "Starter",
    icon: Users,
    priceUSD: 225,
    priceCAD: 299,
    perLabel: "/seat/year",
    seatLabel: "2–5 seats",
    description: "Great for small teams or school-based programs.",
    trial: "14-day free trial",
    trialDays: 14,
    minSeats: 2,
    maxSeats: 5,
    priceIdUSD: "price_1T6xgSG8v8oKpU6mjlatbmy2",
    priceIdCAD: "price_1T6xgSG8v8oKpU6mYiDbrVsr",
    cta: "Choose This Plan",
    features: [
      "Full access for every licensed teacher",
      "2–5 teacher licenses",
      "District manager dashboard",
      "Centralized team management",
      "14-day free trial — no charge until trial ends",
    ],
  },
  {
    key: "district",
    name: "District",
    icon: Building2,
    priceUSD: 199,
    priceCAD: 272,
    perLabel: "/seat/year",
    seatLabel: "6–20 seats",
    description: "Built for district-wide itinerant programs.",
    trial: "14-day free trial",
    trialDays: 14,
    minSeats: 6,
    maxSeats: 20,
    priceIdUSD: "price_1T6xgSG8v8oKpU6mvbhONM6m",
    priceIdCAD: "price_1T6xgSG8v8oKpU6mJTCqotgt",
    cta: "Choose This Plan",
    features: [
      "Everything in Starter",
      "6–20 teacher licenses",
      "Priority support",
      "14-day free trial — no charge until trial ends",
    ],
  },
  {
    key: "program",
    name: "Program",
    icon: GraduationCap,
    priceUSD: 175,
    priceCAD: 238,
    perLabel: "/seat/year",
    seatLabel: "21–50 seats",
    description: "For large regional programs and ESAs.",
    trial: "14-day free trial",
    trialDays: 14,
    minSeats: 21,
    maxSeats: 50,
    priceIdUSD: "price_1T6xgSG8v8oKpU6mTNO5gH8o",
    priceIdCAD: "price_1T6xgSG8v8oKpU6mD1nlX0ii",
    cta: "Choose This Plan",
    features: [
      "Everything in District",
      "21–50 teacher licenses",
      "Dedicated onboarding support",
      "14-day free trial — no charge until trial ends",
    ],
  },
  {
    key: "cooperative",
    name: "Cooperative / ESA",
    icon: Globe,
    priceUSD: null,
    priceCAD: null,
    perLabel: "",
    seatLabel: "50+ seats",
    description: "Custom pricing for large cooperatives and ESAs.",
    trial: null,
    trialDays: null,
    minSeats: 51,
    maxSeats: null,
    priceIdUSD: null,
    priceIdCAD: null,
    cta: "Contact Us",
    features: [
      "Unlimited seats",
      "Custom onboarding",
      "Dedicated account manager",
      "Volume pricing",
      "SLA available",
    ],
  },
];

export default function SchoolsDistrictsPage() {
  const [currency, setCurrency] = useState("USD");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [seats, setSeats] = useState(2);
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemoGate, setShowDemoGate] = useState(false);

  const isCAD = currency === "CAD";

  const handleSelectPlan = (plan) => {
    if (plan.key === "cooperative") {
      window.open("https://www.modaleducation.com/contact-5", "_blank");
      return;
    }
    setSelectedPlan(plan);
    setSeats(plan.minSeats);
    setError("");
  };

  const handleSeatChange = (n) => {
    const clamped = Math.min(Math.max(n, selectedPlan.minSeats), selectedPlan.maxSeats);
    setSeats(clamped);
  };

  const handleCheckout = async () => {
    setError("");
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app, not inside the preview.");
      return;
    }
    if (!purchaserEmail || !purchaserName) {
      setError("Please enter your name and email.");
      return;
    }
    setLoading(true);
    try {
      const priceId = isCAD ? selectedPlan.priceIdCAD : selectedPlan.priceIdUSD;
      const res = await base44.functions.invoke("districtCheckout", {
        priceId,
        quantity: seats,
        teacherEmails: [purchaserEmail],
        purchaserEmail,
        purchaserName,
        planName: selectedPlan.name,
        trialDays: selectedPlan.trialDays,
        currency,
        successUrl: window.location.origin + "/DistrictManagerDashboard?checkout_success=1",
        cancelUrl: window.location.href,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError(res.data?.error || "Something went wrong. Please try again.");
      }
    } catch (e) {
      setError(e.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070]">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-8">
        <div className="flex items-center justify-between mb-10">
          <Link to="/DistrictPricing" className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to pricing
          </Link>
          <button
            onClick={() => base44.auth.redirectToLogin("/Dashboard")}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Already have an account? Sign in
          </button>
        </div>

        <div className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">For Schools &amp; Districts</h1>
          <p className="text-white/60 text-base max-w-xl mx-auto mb-6">
            Multi-seat plans for programs, schools, districts, cooperatives, and ESAs. Every plan includes a 14-day free trial.
          </p>

          {/* Demo CTA for admins */}
          <div className="inline-flex items-center gap-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-5 py-3 mb-8">
            <FlaskConical className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span className="text-white/80 text-sm">Want to see it before buying?</span>
            <button
              onClick={() => setShowDemoGate(true)}
              className="text-amber-300 hover:text-amber-200 text-sm font-semibold underline underline-offset-2 transition-colors"
            >
              Explore with sample data
            </button>
          </div>

          {/* Currency toggle */}
          <div className="inline-flex items-center bg-white/10 rounded-full p-1 gap-1">
            <button
              onClick={() => setCurrency("USD")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!isCAD ? "bg-white text-[#400070]" : "text-white/70 hover:text-white"}`}
            >🇺🇸 USD</button>
            <button
              onClick={() => setCurrency("CAD")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${isCAD ? "bg-white text-[#400070]" : "text-white/70 hover:text-white"}`}
            >🇨🇦 CAD</button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start mt-8">
          {DISTRICT_PLANS.map(plan => {
            const Icon = plan.icon;
            const price = isCAD ? plan.priceCAD : plan.priceUSD;
            return (
              <div key={plan.key} className="relative rounded-2xl p-6 flex flex-col bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-white mb-0.5">{plan.name}</h3>
                <p className="text-xs text-white/60 mb-4">{plan.seatLabel}</p>
                {price ? (
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-white">{isCAD ? "CA$" : "$"}{price}</span>
                    <span className="text-sm text-white/60 ml-1">{plan.perLabel}</span>
                  </div>
                ) : (
                  <div className="mb-1">
                    <span className="text-2xl font-bold text-white">Custom</span>
                  </div>
                )}
                {plan.trial ? (
                  <p className="text-xs text-green-400 font-medium mb-4">✓ {plan.trial}</p>
                ) : (
                  <div className="mb-4" />
                )}
                <p className="text-xs text-white/60 mb-4 flex-1">{plan.description}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-400" />
                      <span className="text-xs text-white/70">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full rounded-xl font-semibold mt-auto ${
                    plan.key === "cooperative"
                      ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                      : "bg-white hover:bg-white/90 text-[#400070]"
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-white/40 text-sm mt-10">
          No charge until your 14-day free trial ends. Cancel anytime.
        </p>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-[#400070]">{selectedPlan.name} Plan</h2>
                <p className="text-xs text-gray-500">{selectedPlan.trial} — no charge until trial ends</p>
              </div>
              <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Your Name</label>
                <Input placeholder="Full name" value={purchaserName} onChange={e => setPurchaserName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Your Email</label>
                <Input type="email" placeholder="you@district.org" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">
                  Number of Teacher Licenses
                  <span className="text-gray-400 font-normal ml-1">({selectedPlan.minSeats}–{selectedPlan.maxSeats})</span>
                </label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => handleSeatChange(seats - 1)}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#400070] text-lg font-bold">−</button>
                  <span className="text-2xl font-bold text-[#400070] w-8 text-center">{seats}</span>
                  <button type="button" onClick={() => handleSeatChange(seats + 1)}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#400070] text-lg font-bold">+</button>
                  <span className="text-sm text-gray-500">
                    = {isCAD ? "CA$" : "$"}{((isCAD ? selectedPlan.priceCAD : selectedPlan.priceUSD) * seats).toLocaleString()} /yr
                  </span>
                </div>
              </div>
              <div className="bg-[#F7F3FA] rounded-xl p-3 border border-[#D8CDE5]">
                <p className="text-xs text-[#400070] font-semibold mb-0.5">✓ Add teachers after checkout</p>
                <p className="text-xs text-gray-500">Once your account is set up, you'll manage all teacher licenses from your District Manager Dashboard.</p>
              </div>
              <div className="bg-[#F7F3FA] rounded-xl p-4">
                <div className="flex justify-between text-sm font-semibold text-gray-700">
                  <span>{seats} seats × {isCAD ? "CA$" : "$"}{isCAD ? selectedPlan.priceCAD : selectedPlan.priceUSD}/seat/yr</span>
                  <span className="text-[#400070]">{isCAD ? "CA$" : "$"}{((isCAD ? selectedPlan.priceCAD : selectedPlan.priceUSD) * seats).toLocaleString()}</span>
                </div>
                <p className="text-xs text-green-600 mt-1 font-medium">✓ No charge for {selectedPlan.trialDays} days</p>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-12 text-base font-semibold"
              >
                {loading ? "Redirecting to Checkout…" : `Start ${selectedPlan.trial}`}
              </Button>
              <p className="text-xs text-gray-400 text-center">
                Secure checkout powered by Stripe. You'll receive login instructions by email after checkout.
              </p>
            </div>
          </div>
        </div>
      )}

      {showDemoGate && (
        <DemoEmailGate
          onEnter={() => { setShowDemoGate(false); window.location.href = "/Dashboard?demo=1"; }}
          onCancel={() => setShowDemoGate(false)}
        />
      )}
    </div>
  );
}