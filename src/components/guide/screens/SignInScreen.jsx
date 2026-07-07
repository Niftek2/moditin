import React from "react";
import { LogIn } from "lucide-react";

export default function SignInScreen() {
  return (
    <div className="bg-gradient-to-br from-[#14002a] via-[#1f0040] to-[#2d0060] p-6 flex justify-center">
      <div className="bg-[#1a0f2e] border border-white/10 rounded-2xl p-5 w-64">
        <p className="text-white font-bold text-lg mb-0.5">Welcome back</p>
        <p className="text-white/50 text-[10px] mb-4">Sign in to access your dashboard</p>
        <div className="bg-gradient-to-r from-[#6B2FB9] to-[#8B5CF6] text-white text-xs font-bold text-center rounded-lg py-2.5 mb-2 flex items-center justify-center gap-1.5">
          <LogIn className="w-3.5 h-3.5" /> Sign In
        </div>
        <div className="border border-white/20 text-white text-xs font-bold text-center rounded-lg py-2.5 mb-3">
          Create an account →
        </div>
        <p className="text-white/40 text-[9px] text-center">✓ 14-day free trial &nbsp; ✓ Cancel anytime</p>
      </div>
    </div>
  );
}