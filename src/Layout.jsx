import React, { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import TermsAgreementModal, { hasAgreedToTerms } from "./components/shared/TermsAgreementModal";
import StickyTermsFooter from "./components/shared/StickyTermsFooter";
import PrivacyReminderBanner from "./components/shared/PrivacyReminderBanner";

export default function Layout({ children, currentPageName }) {
  const [agreed, setAgreed] = useState(hasAgreedToTerms());

  return (
    <div className="min-h-screen bg-[var(--modal-bg)]">
      {/* Top accent bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50" style={{ background: "linear-gradient(90deg, #400070 0%, #6B2FB9 100%)" }} />
      <Sidebar currentPage={currentPageName} />
      <main className="lg:pl-64 pt-1">
        <div className="p-4 pt-16 lg:pt-8 lg:p-8 pb-10 max-w-7xl mx-auto">
          <PrivacyReminderBanner />
          {children}
        </div>
      </main>
      <StickyTermsFooter />
      {!agreed && <TermsAgreementModal onAgree={() => setAgreed(true)} />}
    </div>
  );
}