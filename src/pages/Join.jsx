import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowRight, FlaskConical, LogIn, Target, Clock, Ear, FileText, Zap, CheckCircle } from "lucide-react";
import DemoEmailGate from "../components/demo/DemoEmailGate";
import { Link } from "react-router-dom";

const FEATURES = [
  { icon: Clock, text: "Service log & smart session notes" },
  { icon: Target, text: "AI-powered IEP goal bank" },
  { icon: Ear, text: "Ling 6 checks & audiology tools" },
  { icon: FileText, text: "Eval report wizard" },
  { icon: Zap, text: "Interactive activities & worksheets" },
];

export default function JoinPage() {
  const [showDemoGate, setShowDemoGate] = useState(false);

  return (
    <div className="min-h-screen bg-[#0d0020] flex overflow-hidden relative">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-[#400070]/40 blur-[140px]" />
        <div className="absolute -bottom-40 -right-20 w-[600px] h-[600px] rounded-full bg-[#6B2FB9]/30 blur-[140px]" />
      </div>

      {/* LEFT PANEL — branding & features */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] px-20 py-16 relative z-10">
        <div>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/1d36446be_ModalitinerantLogo.png"
            alt="Modal Itinerant"
            className="h-16 object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>

        <div className="space-y-12">
          <div>
            <p className="text-[#C084FC] text-sm font-semibold tracking-widest uppercase mb-5">
              Built for itinerant teachers of the Deaf &amp; HH
            </p>
            <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight">
              Every tool you need,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C084FC] to-[#818CF8]">
                built for your caseload.
              </span>
            </h1>
          </div>

          <ul className="space-y-5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#C084FC]" />
                </div>
                <span className="text-white/80 text-base">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {["#7C3AED","#9333EA","#A855F7","#C084FC"].map((c, i) => (
              <div key={i} className="w-9 h-9 rounded-full border-2 border-[#0d0020]" style={{ backgroundColor: c }} />
            ))}
          </div>
          <p className="text-white/50 text-sm">Trusted by itinerant teachers across North America</p>
        </div>
      </div>

      {/* RIGHT PANEL — auth card */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div
            className="rounded-3xl p-10"
            style={{
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            {/* Mobile logo */}
            <div className="flex lg:hidden justify-center mb-10">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/1d36446be_ModalitinerantLogo.png"
                alt="Modal Itinerant"
                className="h-16 object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-white/50 text-sm mb-10">Sign in to access your dashboard</p>

            {/* Sign In */}
            <Button
              onClick={() => base44.auth.redirectToLogin(window.location.origin + "/Dashboard")}
              className="w-full text-base rounded-2xl font-bold mb-4 gap-2"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #5B00A0 100%)",
                color: "white",
                height: "56px",
                border: "none",
                boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
              }}
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Button>

            {/* Create account */}
            <Link to="/DistrictPricing" className="block">
              <Button
                variant="outline"
                className="w-full text-base rounded-2xl gap-2 font-semibold"
                style={{
                  height: "56px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "white",
                }}
              >
                Create an account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            {/* Trust badges */}
            <div className="mt-8 flex items-center justify-center gap-5 flex-wrap">
              {["14-day free trial", "Cancel anytime"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-white/40 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-[#A855F7]" />
                  {t}
                </span>
              ))}
            </div>

            {/* Divider */}
            <div className="mt-8 border-t border-white/10 pt-7 text-center">
              <p className="text-white/30 text-xs mb-3">Not ready to commit?</p>
              <button
                onClick={() => setShowDemoGate(true)}
                className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 text-sm font-medium transition-colors"
              >
                <FlaskConical className="w-4 h-4" />
                Explore with sample data
              </button>
            </div>
          </div>
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