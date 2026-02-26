import React from "react";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";

export default function IosSubscribeRequiredPage() {
  const handleSubscribeWithApple = () => {
    window.location.href = "modalapp://subscribe";
  };

  const handleAlreadySubscribed = () => {
    window.location.href = "/ios/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F3FA] to-[#EADDF5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/f8b2256fa_modalitinerantlogo2.png"
            alt="Modal Itinerant"
            className="h-14 object-contain mx-auto mb-4"
          />
        </div>

        {/* Lock icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#400070] bg-opacity-10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#400070]" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1A1028] mb-3">
            Subscription Required
          </h1>
          <p className="text-base text-[#6B5E80]">
            To continue, subscribe with Apple in the app.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleSubscribeWithApple}
            className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white h-12 rounded-xl font-semibold"
          >
            Subscribe with Apple
          </Button>

          <Button
            onClick={handleAlreadySubscribed}
            variant="outline"
            className="w-full border-[#D8CCE8] text-[#400070] hover:bg-[#F7F3FA] h-12 rounded-xl font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            I already subscribed
          </Button>
        </div>
      </div>
    </div>
  );
}