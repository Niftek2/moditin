import React from "react";
import { Building2 } from "lucide-react";

const PLANS = [
  { name: "Starter", seats: "2–5 seats", price: "$225" },
  { name: "District", seats: "6–20 seats", price: "$199", popular: true },
  { name: "Program", seats: "21–50 seats", price: "$175" },
];

export default function PricingScreen() {
  return (
    <div className="bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070] p-6">
      <h3 className="text-white font-bold text-lg mb-1">For Schools &amp; Districts</h3>
      <p className="text-white/60 text-xs mb-4">Multi-seat plans for programs, schools, districts, and cooperatives.</p>
      <div className="grid grid-cols-3 gap-3">
        {PLANS.map((p) => (
          <div key={p.name} className={`bg-white rounded-xl p-4 relative ${p.popular ? "ring-2 ring-yellow-400" : ""}`}>
            {p.popular && (
              <span className="absolute -top-2 left-3 bg-yellow-400 text-[9px] font-bold px-2 py-0.5 rounded-full">Most Popular</span>
            )}
            <Building2 className="w-4 h-4 text-[#6B2FB9] mb-2" />
            <p className="font-bold text-[#400070] text-sm">{p.name}</p>
            <p className="text-[10px] text-gray-500">{p.seats}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{p.price}<span className="text-[9px] text-gray-400 font-normal">/seat/yr</span></p>
            <p className="text-[9px] text-green-600 font-semibold mt-0.5">✓ 14-day free trial</p>
            <div className="mt-2 bg-[#400070] text-white text-[10px] font-bold text-center rounded-lg py-1.5">Start Free Trial</div>
          </div>
        ))}
      </div>
    </div>
  );
}