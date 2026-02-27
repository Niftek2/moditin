import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function IosLoginPage() {
  const handleContinue = () => {
    base44.auth.redirectToLogin("/IosPostAuth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F3FA] to-[#EADDF5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/f8b2256fa_modalitinerantlogo2.png"
          alt="Modal Itinerant"
          className="h-28 object-contain mx-auto mb-8"
        />

        <h1 className="text-2xl font-bold text-[#1A1028] mb-2">Welcome back</h1>
        <p className="text-sm text-[#6B5E80] mb-10">Sign in to continue to Modal Itinerant</p>

        <Button
          onClick={handleContinue}
          className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white h-12 rounded-xl font-semibold mb-4"
        >
          Log in
        </Button>

        <button
          onClick={handleContinue}
          className="text-sm text-[#400070] hover:text-[#5B00A0] font-semibold underline"
        >
          Create account
        </button>
      </div>
    </div>
  );
}