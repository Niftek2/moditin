import React, { useState, useEffect, createContext, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

const SubscriptionContext = createContext(null);

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export function SubscriptionProvider({ children }) {
  const [subStatus, setSubStatus] = useState(null);
  const [checking, setChecking] = useState(true);

  const checkStatus = async () => {
    try {
      const res = await base44.functions.invoke("stripeStatus", {});
      setSubStatus(res.data);
    } catch {
      setSubStatus({ isActive: false, isPro: false, isTrial: false, studentCount: 0 });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ subStatus, checking, refetch: checkStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export default function SubscriptionGate({ children }) {
  const { checking } = useSubscription();

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--modal-bg)]">
        <Loader2 className="w-8 h-8 animate-spin text-[#400070]" />
      </div>
    );
  }

  // Always render children — freemium access is handled per-feature
  return <>{children}</>;
}