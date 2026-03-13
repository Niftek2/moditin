import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, Users, User, Building2, GraduationCap, Globe, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const USD_PLANS = [
  {
    key: "individual",
    name: "Individual",
    icon: User,
    priceUSD: 230,
    priceCAD: 325,
    perLabel: "/year",
    seatLabel: "1 seat",
    description: "Perfect for a single itinerant teacher of the Deaf/HH",
    trial: "7-day free trial",
    trialDays: 7,
    minSeats: 1,
    maxSeats: 1,
    priceIdUSD: "price_1T6xgSG8v8oKpU6mWxd1o56o",
    priceIdCAD: "price_1T6xgSG8v8oKpU6mtmnmPVet",
    cta: "Start Free Trial",
    highlight: false,
    features: [
      "Full access to Modal Itinerant",
      "AI-powered goal bank",
      "Service log & calendar",
      "Listening checks & audiology tools",
      "7-day free trial — no charge until trial ends",
    ],
  },
  {
    key: "starter",
    name: "Starter",
    icon: Users,
    priceUSD: 220,
    priceCAD: 299,
    perLabel: "/seat/year",
    seatLabel: "2–4 seats",
    description: "Great for small teams or school-based programs",
    trial: "14-day free trial",
    trialDays: 14,
    minSeats: 2,
    maxSeats: 4,
    priceIdUSD: "price_1T6xgSG8v8oKpU6mjlatbmy2",
    priceIdCAD: "price_1T6xgSG8v8oKpU6mYiDbrVsr",
    cta: "Choose this Plan",
    highlight: true,
    features: [
      "Everything in Individual",
      "2–4 teacher licenses",
      "Centralized team management",
      "14-day free trial — no charge until trial ends",
      "Email setup for each teacher",
    ],
  },
  {
    key: "district",
    name: "District",
    icon: Building2,
    priceUSD: 200,
    priceCAD: 272,
    perLabel: "/seat/year",
    seatLabel: "5–15 seats",
    description: "Built for district-wide itinerant programs",
    trial: "14-day free trial",
    trialDays: 14,
    minSeats: 5,
    maxSeats: 15,
    priceIdUSD: "price_1T6xgSG8v8oKpU6mvbhONM6m",
    priceIdCAD: "price_1T6xgSG8v8oKpU6mJTCqotgt",
    cta: "Choose this Plan",
    highlight: false,
    features: [
      "Everything in Starter",
      "5–15 teacher licenses",
      "Priority support",
      "14-day free trial — no charge until trial ends",
      "Email setup for each teacher",
    ],
  },
  {
    key: "program",
    name: "Program",
    icon: GraduationCap,
    priceUSD: 175,
    priceCAD: 238,
    perLabel: "/seat/year",
    seatLabel: "16–30 seats",
    description: "For large regional programs and ESAs",
    trial: "14-day free trial",
    trialDays: 14,
    minSeats: 16,
    maxSeats: 30,
    priceIdUSD: "price_1T6xgSG8v8oKpU6mTNO5gH8o",
    priceIdCAD: "price_1T6xgSG8v8oKpU6mD1nlX0ii",
    cta: "Choose this Plan",
    highlight: false,
    features: [
      "Everything in District",
      "16–30 teacher licenses",
      "Dedicated onboarding support",
      "14-day free trial — no charge until trial ends",
      "Email setup for each teacher",
    ],
  },
  {
    key: "cooperative",
    name: "Cooperative / ESA",
    icon: Globe,
    priceUSD: null,
    priceCAD: null,
    perLabel: "",
    seatLabel: "30+ seats",
    description: "Custom pricing for large cooperatives and ESAs",
    trial: null,
    trialDays: null,
    minSeats: 31,
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

export default function DistrictPricingPage() {
  const [currency, setCurrency] = useState("USD");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [seats, setSeats] = useState(2);
  const [emails, setEmails] = useState([""]);
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
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
    // Block checkout in iframe
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app, not inside the preview.");
      return;
    }

    if (!purchaserEmail || !purchaserName) {
      setError("Please enter your name and email.");
      return;
    }
    if (selectedPlan.key !== "individual" && emails.some(e => !e || !e.includes("@"))) {
      setError("Please enter a valid email address for each teacher license.");
      return;
    }

    setLoading(true);
    try {
      const priceId = isCAD ? selectedPlan.priceIdCAD : selectedPlan.priceIdUSD;
      const res = await base44.functions.invoke("districtCheckout", {
        priceId,
        quantity: selectedPlan.key === "individual" ? 1 : seats,
        teacherEmails: selectedPlan.key === "individual" ? [purchaserEmail] : emails,
        purchaserEmail,
        purchaserName,
        planName: selectedPlan.name,
        trialDays: selectedPlan.trialDays,
        currency,
        successUrl: window.location.origin + "/Dashboard",
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
      <div className="text-center pt-16 pb-10 px-4">
        <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=60&h=60&fit=crop&crop=center" alt="" className="hidden" />
        <div className="flex justify-center mb-6">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/1d36446be_ModalitinerantLogo.png"
            alt="Modal Itinerant Logo"
            className="h-24 w-auto"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/80 text-sm font-medium">Free trial — credit card required, no charge until trial ends</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">District & Program Pricing</h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
          Purpose-built tools for itinerant teachers of the Deaf and Hard of Hearing. Choose the plan that fits your team.
        </p>

        {/* Currency Toggle */}
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

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {USD_PLANS.map(plan => {
            const Icon = plan.icon;
            const price = isCAD ? plan.priceCAD : plan.priceUSD;
            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl p-6 flex flex-col transition-all duration-200 ${
                  plan.highlight
                    ? "bg-white border-2 border-yellow-400 shadow-xl shadow-yellow-400/20 scale-105"
                    : "bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-yellow-400 text-[#400070] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">Most Popular</span>
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.highlight ? "bg-[#EADDF5]" : "bg-white/20"}`}>
                  <Icon className={`w-5 h-5 ${plan.highlight ? "text-[#400070]" : "text-white"}`} />
                </div>

                <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? "text-[#400070]" : "text-white"}`}>{plan.name}</h3>
                <p className={`text-xs mb-4 ${plan.highlight ? "text-[#6B2FB9]" : "text-white/60"}`}>{plan.seatLabel}</p>

                {price ? (
                  <div className="mb-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? "text-[#400070]" : "text-white"}`}>
                      {isCAD ? "CA$" : "$"}{price}
                    </span>
                    <span className={`text-sm ml-1 ${plan.highlight ? "text-[#6B2FB9]" : "text-white/60"}`}>{plan.perLabel}</span>
                  </div>
                ) : (
                  <div className="mb-1">
                    <span className={`text-2xl font-bold ${plan.highlight ? "text-[#400070]" : "text-white"}`}>Custom</span>
                  </div>
                )}

                {plan.trial && (
                  <p className={`text-xs mb-4 font-medium ${plan.highlight ? "text-green-600" : "text-green-400"}`}>✓ {plan.trial}</p>
                )}

                <p className={`text-xs mb-4 flex-1 ${plan.highlight ? "text-gray-600" : "text-white/60"}`}>{plan.description}</p>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-[#400070]" : "text-green-400"}`} />
                      <span className={`text-xs ${plan.highlight ? "text-gray-700" : "text-white/70"}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full rounded-xl font-semibold ${
                    plan.highlight
                      ? "bg-[#400070] hover:bg-[#5B00A0] text-white"
                      : plan.key === "cooperative"
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

        {/* Footer note */}
        <p className="text-center text-white/50 text-sm mt-10">
          All prices shown are per seat, billed annually. No charge until your free trial ends. Cancel anytime.
        </p>

        {/* Demo CTA for district decision makers */}
        <div className="mt-10 max-w-2xl mx-auto bg-white/5 border border-white/15 rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FlaskConical className="w-4 h-4 text-amber-300" />
            <span className="text-amber-300 text-sm font-semibold uppercase tracking-wide">Not ready to commit?</span>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">See exactly what your teachers will use</h3>
          <p className="text-white/60 text-sm max-w-md mx-auto mb-5">
            Explore the full platform with sample data — no sign-up, no credit card. Walk through the tools your team would use every day before making a district-wide decision.
          </p>
          <Link to={createPageUrl("Dashboard") + "?demo=1"}>
            <button className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-400/20">
              <FlaskConical className="w-4 h-4" />
              Preview the Platform — No Sign-Up Required
            </button>
          </Link>
          <p className="text-white/30 text-xs mt-3">Sample data only · Nothing is saved · Exit anytime</p>
        </div>
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
              <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Purchaser info */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Your Name</label>
                <Input
                  placeholder="Full name"
                  value={purchaserName}
                  onChange={e => setPurchaserName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Your Email</label>
                <Input
                  type="email"
                  placeholder="you@district.org"
                  value={purchaserEmail}
                  onChange={e => setPurchaserEmail(e.target.value)}
                />
              </div>

              {/* Seats selector (multi-seat plans only) */}
              {selectedPlan.key !== "individual" && (
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1.5 block">
                    Number of Teacher Licenses
                    <span className="text-gray-400 font-normal ml-1">({selectedPlan.minSeats}–{selectedPlan.maxSeats})</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSeatChange(seats - 1)}
                      className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#400070] text-lg font-bold"
                    >−</button>
                    <span className="text-2xl font-bold text-[#400070] w-8 text-center">{seats}</span>
                    <button
                      type="button"
                      onClick={() => handleSeatChange(seats + 1)}
                      className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#400070] text-lg font-bold"
                    >+</button>
                    <span className="text-sm text-gray-500 ml-1">
                      = {isCAD ? "CA$" : "$"}{((isCAD ? selectedPlan.priceCAD : selectedPlan.priceUSD) * seats).toLocaleString()}/{isCAD ? "CAD" : "USD"} yr
                    </span>
                  </div>
                </div>
              )}

              {/* Teacher emails (multi-seat only) */}
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
                    {selectedPlan.key === "individual" ? "1 seat" : `${seats} seats`} × {isCAD ? "CA$" : "$"}{isCAD ? selectedPlan.priceCAD : selectedPlan.priceUSD}/seat/yr
                  </span>
                  <span className="text-[#400070]">
                    {isCAD ? "CA$" : "$"}{((isCAD ? selectedPlan.priceCAD : selectedPlan.priceUSD) * (selectedPlan.key === "individual" ? 1 : seats)).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ No charge until {selectedPlan.trialDays === 7 ? "7 days" : "14 days"} from now
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
              )}

              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-12 text-base font-semibold"
              >
                {loading ? "Redirecting to Checkout..." : `Start ${selectedPlan.trial}`}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                Secure checkout powered by Stripe. You will receive login instructions by email after checkout.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}