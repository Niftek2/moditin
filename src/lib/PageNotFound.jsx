import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function PageNotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleIosRedirect = async () => {
      const isIosMode = typeof window !== "undefined" && window.ModalApp?.platform === "ios";
      if (!isIosMode) return;

      try {
        const user = await base44.auth.me();
        if (!user) {
          // Not logged in, go to iOS login
          navigate("/IosLogin", { replace: true });
        } else {
          // Logged in, check entitlement
          const res = await base44.functions.invoke("checkIosEntitlement");
          const isEntitled = res?.data?.isEntitled || false;
          if (isEntitled) {
            navigate("/Dashboard", { replace: true });
          } else {
            navigate("/IosSubscribeRequired", { replace: true });
          }
        }
      } catch (error) {
        console.error("Error in iOS 404 redirect:", error);
        navigate("/IosSubscribeRequired", { replace: true });
      }
    };

    handleIosRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0B0713] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#400070]/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-[#7C3AED]">?</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-sm text-[#9B8FB5] mb-6">The page you're looking for doesn't exist.</p>
        <Link to={createPageUrl("Dashboard")}>
          <Button className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}