import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Users, User, Building2, GraduationCap, Globe, LogIn, ArrowLeft, ArrowRight, FlaskConical } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

const INDIVIDUAL_PLAN = {
  key: "individual",
  name: "Individual",
  icon: User,
  priceUSD: 179,
  priceCAD: 325,
  monthlyUSD: 19.99,
  perLabel: "/year",
  seatLabel: "1 seat",
  description: "Perfect for a single itinerant teacher of the Deaf/HH.",
  trial: "14-day free trial",
  trialDays: 14,
  minSeats: 1,
  maxSeats: 1,
  priceIdUSD: "price_1T4B1rG8v8oKpU6my9bQBS46",       // $179/year
  monthlyPriceIdUSD: "price_1T6xs1G8v8oKpU6mG5VLBRA6", // $19.99/month
  priceIdCAD: "price_1T6xgSG8v8oKpU6mtmnmPVet",
  cta: "Start Free Trial",
  highlight: true,
  badge: "Most Popular",
  features: [
    "Full access to Modal Itinerant",
    "AI-powered goal bank",
    "Service log & calendar",
    "Listening checks & audiology tools",
    "Worksheet & activity generators",
    "14-day free trial — no charge until trial ends",
  ],
};

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
    highlight: false,
    features: [
      "Everything in Individual",
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
    highlight: false,
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
    highlight: false,
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
    highlight: false,
    features: [
      "Unlimited seats",
      "Custom onboarding",
      "Dedicated account manager",
      "Volume pricing",
      "SLA available",
    ],
  },
];

const USD_PLANS = [INDIVIDUAL_PLAN, ...DISTRICT_PLANS];

export default function DistrictPricingPage() {
  const navigate = useNavigate();
  const errorRef = useRef(null);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [currency, setCurrency] = useState("USD");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [seats, setSeats] = useState(2);
  const [emails, setEmails] = useState([""]);
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionState, setInstitutionState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCAD = currency === "CAD";

  const handleSelectPlan = (plan) => {
    if (plan.key === "cooperative") {
      window.open("https://www.modaleducation.com/contact-5", "_blank");
      return;
    }
    setSelectedPlan(plan);
    setSeats(plan.minSeats);
    setEmails(Array(plan.minSeats).fill(""));
    setError("");
  };

  const handleSeatChange = (n) => {
    const clamped = Math.min(Math.max(n, selectedPlan.minSeats), selectedPlan.maxSeats);
    setSeats(clamped);
    setEmails(prev => {
      const next = [...prev];
      while (next.length < clamped) next.push("");
      return next.slice(0, clamped);
    });
  };

  const handleEmailChange = (i, val) => {
    setEmails(prev => { const n = [...prev]; n[i] = val; return n; });
  };

  const handleCheckout = async () => {
    setError("");
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app, not inside the preview.");
      return;
    }
    if (!purchaserEmail || !purchaserName) {
      setError("Please enter your name and email.");
      setTimeout(() => errorRef.current?.focus(), 50);
      return;
    }
    if (selectedPlan.key !== "individual" && (!institutionName || !institutionState)) {
      setError("Please enter your institution name and state.");
      setTimeout(() => errorRef.current?.focus(), 50);
      return;
    }
    if (selectedPlan.key !== "individual" && emails.some(e => !e || !e.includes("@"))) {
      setError("Please enter a valid email address for each teacher license.");
      return;
    }

    setLoading(true);
    try {
      if (selectedPlan.key === "individual") {
        // Pick monthly or annual price based on billing toggle
        const individualPriceId = billingPeriod === "monthly"
          ? selectedPlan.monthlyPriceIdUSD
          : (isCAD ? selectedPlan.priceIdCAD : selectedPlan.priceIdUSD);
        // Use simple stripeCheckout for individual
        const res = await base44.functions.invoke("stripeCheckout", {
          priceId: individualPriceId,
          trialDays: selectedPlan.trialDays,
          successUrl: window.location.origin + "/Dashboard?checkout_success=1",
          cancelUrl: window.location.href,
          email: purchaserEmail,
        });
        if (res.data?.url) {
          window.location.href = res.data.url;
        } else {
          setError(res.data?.error || "Something went wrong. Please try again.");
        }
      } else {
        const priceId = isCAD ? selectedPlan.priceIdCAD : selectedPlan.priceIdUSD;
        const res = await base44.functions.invoke("districtCheckout", {
          priceId,
          quantity: seats,
          teacherEmails: emails,
          purchaserEmail,
          purchaserName,
          institutionName,
          institutionState,
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
      <div className="text-center pt-14 pb-10 px-4">
        {/* Back + Sign In row */}
        <div className="flex items-center justify-between max-w-6xl mx-auto mb-8">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate(createPageUrl("Join"))}
            className="flex items-center gap-1.5 text-white/85 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => base44.auth.redirectToLogin("/Dashboard")}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Already have an account? Sign in
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/1d36446be_ModalitinerantLogo.png"
            alt="Modal Itinerant"
            className="h-20 w-auto"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Choose your plan</h1>
        <p className="text-white/60 text-base max-w-xl mx-auto mb-8">
          Purpose-built for itinerant teachers of the Deaf and Hard of Hearing. Free trial on every plan.
        </p>

        {/* Currency Toggle — only show for multi-seat plans */}
        <div className="inline-flex items-center bg-white/10 rounded-full p-1 gap-1" role="group" aria-label="Currency selection">
          <button
            onClick={() => setCurrency("USD")}
            aria-pressed={!isCAD}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!isCAD ? "bg-white text-[#400070]" : "text-white/70 hover:text-white"}`}
          ><span aria-hidden="true">🇺🇸</span> USD</button>
          <button
            onClick={() => setCurrency("CAD")}
            aria-pressed={isCAD}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${isCAD ? "bg-white text-[#400070]" : "text-white/70 hover:text-white"}`}
          ><span aria-hidden="true">🇨🇦</span> CAD</button>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-4 pb-24">

        {/* Helper line */}
        <p className="text-center text-white/50 text-sm mb-10 max-w-xl mx-auto">
          Choose the plan that fits your role. Individual teachers typically start with the Individual plan, while schools and districts can choose a multi-seat option.
        </p>

        {/* SECTION 1: Individual */}
        <h2 className="text-white font-bold text-xl mb-5">For Individual Teachers</h2>

        {/* Billing toggle */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center bg-white/10 rounded-full p-1 gap-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${billingPeriod === "monthly" ? "bg-white text-[#400070]" : "text-white/70 hover:text-white"}`}
            >Monthly</button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${billingPeriod === "annual" ? "bg-white text-[#400070]" : "text-white/70 hover:text-white"}`}
            >Annual <span className="text-xs font-bold text-green-400">Save $39</span></button>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          {(() => {
            const plan = INDIVIDUAL_PLAN;
            const Icon = plan.icon;
            const annualPrice = isCAD ? plan.priceCAD : plan.priceUSD;
            const isMonthly = billingPeriod === "monthly";
            return (
              <div className="relative rounded-2xl p-6 flex flex-col bg-white border-2 border-yellow-400 shadow-xl shadow-yellow-400/20 w-full max-w-xs">
                <div className="absolute -top-3 left-6">
                  <span className="bg-yellow-400 text-[#400070] text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#EADDF5] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#400070]" />
                </div>
                <h3 className="font-bold text-lg text-[#400070] mb-0.5">{plan.name}</h3>
                <p className="text-xs text-[#6B2FB9] mb-4">{plan.seatLabel}</p>
                {isMonthly ? (
                  <>
                    <div className="mb-0.5">
                      <span className="text-3xl font-bold text-[#400070]">${plan.monthlyUSD}</span>
                      <span className="text-sm text-[#6B2FB9] ml-1">/month</span>
                    </div>
                    <p className="text-xs text-[#6B2FB9] mb-0.5">or ${annualPrice} billed annually</p>
                    <p className="text-xs text-green-600 font-semibold mb-2">Save $39 with annual billing</p>
                  </>
                ) : (
                  <>
                    <div className="mb-0.5">
                      <span className="text-3xl font-bold text-[#400070]">{isCAD ? "CA$" : "$"}{annualPrice}</span>
                      <span className="text-sm text-[#6B2FB9] ml-1">/year</span>
                    </div>
                    <p className="text-xs text-[#6B2FB9] mb-0.5">or ${plan.monthlyUSD} / month</p>
                    <p className="text-xs text-green-600 font-semibold mb-2">Save $39 with annual billing</p>
                  </>
                )}
                <p className="text-xs text-green-600 font-medium mb-4">✓ {plan.trial}</p>
                <p className="text-xs text-gray-600 mb-4 flex-1">{plan.description}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#400070]" />
                      <span className="text-xs text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={() => handleSelectPlan(plan)} className="w-full rounded-xl font-semibold bg-[#400070] hover:bg-[#5B00A0] text-white">
                  {plan.cta}
                </Button>
              </div>
            );
          })()}
        </div>

        {/* Demo link for individual teachers */}
        <div className="flex justify-center mb-12">
          <button
            onClick={() => { window.location.href = "/Dashboard?demo=1"; }}
            className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 text-sm font-medium transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            Not ready to commit? Explore with sample data first
          </button>
        </div>

        {/* SECTION 2: Schools & Districts */}
        <h2 className="text-white font-bold text-xl mb-3">For Schools &amp; Districts</h2>
        <p className="text-white/50 text-sm mb-6">Multi-seat plans for programs, schools, districts, and cooperatives.</p>
        <Link to="/SchoolsDistricts">
          <div className="flex items-center justify-between bg-white/10 border border-white/20 hover:bg-white/15 transition-all rounded-2xl px-6 py-5 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Buying for a school or district?</p>
                <p className="text-white/60 text-sm">See plans from 2 seats up to 50+ — with a free demo</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors flex-shrink-0 ml-4" />
          </div>
        </Link>

        <p className="text-center text-white/40 text-sm mt-10">
          No charge until your 14-day free trial ends. Cancel anytime.
        </p>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="checkout-dialog-title">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 id="checkout-dialog-title" className="text-lg font-bold text-[#400070]">{selectedPlan.name} Plan</h2>
                <p className="text-xs text-gray-500">{selectedPlan.trial} — no charge until trial ends</p>
              </div>
              <button onClick={() => setSelectedPlan(null)} aria-label="Close checkout" className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="purchaser-name" className="text-sm font-bold text-gray-700 mb-1.5 block">Your Name</label>
                <Input id="purchaser-name" placeholder="Full name" value={purchaserName} onChange={e => setPurchaserName(e.target.value)} autoComplete="name" aria-invalid={!!error && !purchaserName} />
                </div>
                <div>
                <label htmlFor="purchaser-email" className="text-sm font-bold text-gray-700 mb-1.5 block">Your Email</label>
                <Input id="purchaser-email" type="email" placeholder="you@district.org" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} autoComplete="email" aria-invalid={!!error && !purchaserEmail} />
              </div>

              {selectedPlan.key !== "individual" && (
                <div>
                  <label htmlFor="institution-name" className="text-sm font-bold text-gray-700 mb-1.5 block">Institution Name</label>
                  <Input id="institution-name" placeholder="e.g. Springfield USD, Regional DHH Program" value={institutionName} onChange={e => setInstitutionName(e.target.value)} />
                </div>
              )}

              {selectedPlan.key !== "individual" && (
                <div>
                  <label htmlFor="institution-state" className="text-sm font-bold text-gray-700 mb-1.5 block">State / Province</label>
                  <Input id="institution-state" placeholder="e.g. Kansas, Ontario" value={institutionState} onChange={e => setInstitutionState(e.target.value)} />
                </div>
              )}

              {selectedPlan.key !== "individual" && (
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1.5 block">
                    Number of Teacher Licenses
                    <span className="text-gray-400 font-normal ml-1">({selectedPlan.minSeats}–{selectedPlan.maxSeats})</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button type="button" aria-label="Decrease seats" onClick={() => handleSeatChange(seats - 1)}
                      className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#400070] text-lg font-bold">−</button>
                    <span className="text-2xl font-bold text-[#400070] w-8 text-center" aria-live="polite" aria-label={`${seats} seats`}>{seats}</span>
                    <button type="button" aria-label="Increase seats" onClick={() => handleSeatChange(seats + 1)}
                      className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#400070] text-lg font-bold">+</button>
                    <span className="text-sm text-gray-500">
                      = {isCAD ? "CA$" : "$"}{((isCAD ? selectedPlan.priceCAD : selectedPlan.priceUSD) * seats).toLocaleString()} yr
                    </span>
                  </div>
                </div>
              )}

              {selectedPlan.key !== "individual" && (
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1.5 block">
                    Teacher Email Addresses
                    <span className="text-gray-400 font-normal ml-1">(each will receive login instructions)</span>
                  </label>
                  <div className="space-y-2">
                    {emails.map((email, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                        <Input
                          type="email"
                          placeholder={`teacher${i + 1}@district.org`}
                          value={email}
                          onChange={e => handleEmailChange(i, e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing summary */}
              <div className="bg-[#F7F3FA] rounded-xl p-4">
                <div className="flex justify-between text-sm font-semibold text-gray-700">
                  <span>
                    {selectedPlan.key === "individual"
                      ? "Individual — 1 seat / year"
                      : `${seats} seats × ${isCAD ? "CA$" : "$"}${isCAD ? selectedPlan.priceCAD : selectedPlan.priceUSD}/seat/yr`}
                  </span>
                  <span className="text-[#400070]">
                    {selectedPlan.key === "individual"
                      ? `${isCAD ? "CA$" : "$"}${isCAD ? selectedPlan.priceCAD : selectedPlan.priceUSD}/yr`
                      : `${isCAD ? "CA$" : "$"}${((isCAD ? selectedPlan.priceCAD : selectedPlan.priceUSD) * seats).toLocaleString()}`}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ No charge for {selectedPlan.trialDays} days
                </p>
              </div>

              {error && <p ref={errorRef} tabIndex={-1} className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2" role="alert">{error}</p>}

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
    </div>
  );
}