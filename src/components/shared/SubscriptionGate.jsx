import React, { useState, useEffect, createContext, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { useDemo } from "../demo/DemoContext";

const SubscriptionContext = createContext(null);

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export function SubscriptionProvider({ children }) {
  const [subStatus, setSubStatus] = useState(null);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  const checkStatus = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const res = await base44.functions.invoke("stripeStatus", {});
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "manager";
      setSubStatus({ ...res.data, isPro: isAdmin || res.data.isPro });
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
    <SubscriptionContext.Provider value={{ subStatus, checking, refetch: checkStatus, user }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export default function SubscriptionGate({ children }) {
  const { checking, subStatus, user, refetch } = useSubscription();
  const { isDemoMode } = useDemo();
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 8;

  const isCheckoutSuccess = typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("checkout_success") === "1";

  useEffect(() => {
    if (!isCheckoutSuccess || checking) return;
    if (subStatus?.isPro) {
      // Clean up the param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout_success");
      window.history.replaceState({}, "", url.toString());
      return;
    }
    if (attempts >= MAX_ATTEMPTS) return;
    const t = setTimeout(() => {
      setAttempts(a => a + 1);
      refetch();
    }, 2000);
    return () => clearTimeout(t);
  }, [isCheckoutSuccess, checking, subStatus, attempts]);

  if (isDemoMode) return <>{children}</>;

  // Show spinner during initial load OR while polling after checkout
  if (checking || (isCheckoutSuccess && !subStatus?.isPro && attempts < MAX_ATTEMPTS)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--modal-bg)]">
        <Loader2 className="w-8 h-8 animate-spin text-[#400070] mb-3" />
        {isCheckoutSuccess && !checking && (
          <p className="text-[#400070] font-semibold text-sm">Activating your account…</p>
        )}
      </div>
    );
  }

  if (subStatus && !subStatus.isPro && user?.role !== "admin" && user?.role !== "manager") {
    window.location.href = "/DistrictPricing";
    return null;
  }

  return <>{children}</>;
}