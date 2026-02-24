import React, { useState } from "react";
import SubscriptionGate, { SubscriptionProvider } from "./components/shared/SubscriptionGate";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./components/layout/Sidebar";
import BottomNav from "./components/layout/BottomNav";
import TermsAgreementModal, { hasAgreedToTerms } from "./components/shared/TermsAgreementModal";
import StickyTermsFooter from "./components/shared/StickyTermsFooter";
import PrivacyReminderBanner from "./components/shared/PrivacyReminderBanner";
import NotificationBell from "./components/shared/NotificationBell";
import { useAndroidBack } from "./components/shared/useAndroidBack";

export default function Layout({ children, currentPageName }) {
  const [agreed, setAgreed] = useState(hasAgreedToTerms());
  useAndroidBack();

  return (
    <div
      className="min-h-screen bg-[var(--modal-bg)]"
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

      <main className="lg:pl-64 pt-1" id="main-content">
        <div
          className="p-4 pt-16 lg:pt-8 lg:p-8 pb-24 lg:pb-10 max-w-7xl mx-auto"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
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
  );
}