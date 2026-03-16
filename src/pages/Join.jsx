import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowRight, FlaskConical, LogIn } from "lucide-react";
import DemoEmailGate from "../components/demo/DemoEmailGate";
import { Link } from "react-router-dom";

export default function JoinPage() {
  const [showDemoGate, setShowDemoGate] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0030] via-[#2d0060] to-[#400070] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/1d36446be_ModalitinerantLogo.png"
          alt="Modal Itinerant"
          className="h-32 object-contain mx-auto mb-8"
          style={{ filter: "brightness(0) invert(1)" }}
        />

        <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-white/60 text-sm mb-10">
          Tools for itinerant teachers of the Deaf &amp; Hard of Hearing
        </p>

        {/* Primary: Sign In */}
        <Button
          onClick={() => base44.auth.redirectToLogin("/Dashboard")}
          className="w-full bg-white hover:bg-white/90 text-[#400070] h-12 text-base rounded-xl gap-2 font-bold shadow-lg mb-3"
        >
          <LogIn className="w-5 h-5" />
          Sign In
        </Button>

        {/* Secondary: Sign Up / See Plans */}
        <Link to="/DistrictPricing">
          <Button
            variant="outline"
            className="w-full border-white/30 text-white hover:bg-white/10 bg-transparent h-12 text-base rounded-xl gap-2"
          >
            Create an account
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>

        <div className="mt-8 border-t border-white/10 pt-8">
          <p className="text-white/40 text-xs mb-3">Not ready to commit?</p>
          <button
            onClick={() => setShowDemoGate(true)}
            className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 text-sm font-medium transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            Explore with sample data
          </button>
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