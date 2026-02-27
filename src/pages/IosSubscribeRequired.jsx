import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function IosSubscribeRequiredPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubscribeWithApple = () => {
    window.location.href = "modalapp://subscribe";
  };

  const handleRestore = async () => {
    window.location.href = "modalapp://restore";

    // Re-check entitlement after triggering restore deep link
    setChecking(true);
    setMessage("");
    try {
      const res = await base44.functions.invoke("checkIosEntitlement");
      const isEntitled = res?.data?.isEntitled || false;
      if (isEntitled) {
        navigate("/Dashboard", { replace: true });
      } else {
        setMessage("Subscription not detected yet. Try Restore again.");
      }
    } catch {
      setMessage("Could not verify subscription. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F3FA] to-[#EADDF5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/f8b2256fa_modalitinerantlogo2.png"
            alt="Modal Itinerant"
            className="h-14 object-contain mx-auto mb-6"
          />
          <div className="w-16 h-16 rounded-full bg-[#400070]/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[#400070]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1028] mb-3">Subscription Required</h1>
          <p className="text-base text-[#6B5E80]">
            To continue, subscribe with Apple in the app.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleSubscribeWithApple}
            className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white h-12 rounded-xl font-semibold"
          >
            Subscribe with Apple
          </Button>

          <Button
            onClick={handleRestore}
            disabled={checking}
            variant="outline"
            className="w-full border-[#D8CCE8] text-[#400070] hover:bg-[#F7F3FA] h-12 rounded-xl font-semibold"
          >
            {checking ? "Checking…" : "Restore purchase"}
          </Button>
        </div>

        {message && (
          <p className="text-sm text-center text-[#6B5E80] mt-4">{message}</p>
        )}
      </div>
    </div>
  );
}