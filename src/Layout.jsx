import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import Sidebar from "./components/layout/Sidebar";
import BottomNav from "./components/layout/BottomNav";
import TermsAgreementModal, { hasAgreedToTerms } from "./components/shared/TermsAgreementModal";
import StickyTermsFooter from "./components/shared/StickyTermsFooter";
import PrivacyReminderBanner from "./components/shared/PrivacyReminderBanner";
import NotificationBell from "./components/shared/NotificationBell";
import { useAndroidBack } from "./components/shared/useAndroidBack";
import SubscriptionGate, { SubscriptionProvider } from "./components/shared/SubscriptionGate";

export default function Layout({ children, currentPageName }) {
  const [agreed, setAgreed] = useState(hasAgreedToTerms());
  const [iosBlocked, setIosBlocked] = useState(false);
  const navigate = useNavigate();
  useAndroidBack();

  // Detect iOS mode from wrapper or query param
  const isIosMode = typeof window !== "undefined" && (
    window.ModalApp?.platform === "ios" ||
    new URLSearchParams(window.location.search).get("platform") === "ios"
  );

  // Global iOS entitlement guard (covers ALL routes when in iOS mode)
  useEffect(() => {
    const checkIosEntitlement = async () => {
      const iosPassthroughPages = ["IosLogin", "IosPostAuth", "IosSubscribeRequired"];
      if (!isIosMode || iosPassthroughPages.includes(currentPageName)) {
        setIosBlocked(false);
        return;
      }

      try {
        const user = await base44.auth.me();
        if (!user) {
          navigate("/IosLogin", { replace: true });
          return;
        }

        const res = await base44.functions.invoke("checkIosEntitlement");
        const isEntitled = res?.data?.isEntitled || false;

        if (!isEntitled) {
          setIosBlocked(true);
          navigate("/IosSubscribeRequired", { replace: true });
        } else {
          setIosBlocked(false);
        }
      } catch (error) {
        console.error("Error checking iOS entitlement:", error);
        setIosBlocked(true);
        navigate("/IosSubscribeRequired", { replace: true });
      }
    };

    checkIosEntitlement();
  }, [currentPageName, isIosMode, navigate]);

  // /join page renders without the full app shell
  if (currentPageName === "Join") {
    return <>{children}</>;
  }

  // iOS pages bypass the main app shell
  if (currentPageName?.startsWith("Ios")) {
    return <>{children}</>;
  }

  // Block rendering of protected content if iOS user is not entitled
  if (isIosMode && iosBlocked) {
    return null;
  }

  return (
    <SubscriptionProvider>
      <SubscriptionGate>
        <div
          className="min-h-screen bg-[var(--modal-bg)] flex flex-col"
          role="application"
          aria-label="Modal Education Platform"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          {/* Top accent bar */}
          <div
            className="fixed top-0 left-0 right-0 h-1 z-50"
            style={{ background: "linear-gradient(90deg, var(--modal-purple) 0%, var(--modal-purple-glow) 100%)" }}
            aria-hidden="true"
          />

          <Sidebar currentPage={currentPageName} />

          <main className="lg:pl-64 pt-1 flex-1" id="main-content">
            <div
              className="p-4 pt-16 lg:pt-8 lg:p-8 max-w-7xl mx-auto"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex justify-end mb-4 -mt-2">
                <NotificationBell />
              </div>
              <PrivacyReminderBanner />

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPageName}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <BottomNav currentPage={currentPageName} />
          <StickyTermsFooter />
          {!agreed && <TermsAgreementModal onAgree={() => setAgreed(true)} />}
        </div>
      </SubscriptionGate>
    </SubscriptionProvider>
  );
}