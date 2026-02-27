import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function IosPostAuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          navigate("/IosLogin", { replace: true });
          return;
        }

        const res = await base44.functions.invoke("checkIosEntitlement");
        const isEntitled = res?.data?.isEntitled || false;

        if (isEntitled) {
          navigate("/Dashboard", { replace: true });
        } else {
          navigate("/IosSubscribeRequired", { replace: true });
        }
      } catch {
        navigate("/IosLogin", { replace: true });
      }
    };

    check();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F3FA] to-[#EADDF5] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#400070]" />
    </div>
  );
}