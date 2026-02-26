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
  const navigate = useNavigate();
  useAndroidBack();

  // Global iOS route guard
  useEffect(() => {
    const checkIosEntitlement = async () => {
      // Only check iOS routes
      if (!currentPageName?.startsWith("Ios")) {
        return;
      }

      try {
        const user = await base44.auth.me();
        if (!user) return; // Not logged in, auth will handle redirect

        const res = await base44.functions.invoke("checkIosEntitlement");
        const isEntitled = res?.data?.isEntitled || false;

        if (!isEntitled) {
          navigate("/ios/subscribe-required");
        }
      } catch (error) {
        console.error("Error checking iOS entitlement:", error);
      }
    };

    checkIosEntitlement();
  }, [currentPageName, navigate]);

  // /join page renders without the full app shell
  if (currentPageName === "Join") {
    return <>{children}</>;
  }

  // iOS pages bypass the main app shell
  if (currentPageName?.startsWith("Ios")) {
    return <>{children}</>;
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