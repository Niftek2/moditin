import React from "react";
import { Building2, Users, CreditCard } from "lucide-react";

export default function DashboardScreen() {
  return (
    <div className="bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold">District Manager</p>
          <p className="text-white/70 text-[10px]">manager@yourdistrict.org</p>
        </div>
      </div>
      <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-white/70" />
            <span className="text-white text-xs font-semibold">Subscription</span>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Free Trial</span>
        </div>
        <p className="text-white font-bold text-sm">District Plan</p>
      </div>
      <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white/70" />
            <span className="text-white text-xs font-semibold">Teacher Licenses</span>
          </div>
          <span className="text-white/80 text-[10px]">3 / 10 used</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3">
          <div className="h-3 rounded-full bg-purple-400" style={{ width: "30%" }} />
        </div>
      </div>
    </div>
  );
}