import React, { useState } from "react";
import TermsAgreementModal from "./TermsAgreementModal";

export default function StickyTermsFooter() {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center lg:pl-64 bg-white">
        <div className="w-full max-w-7xl px-4 lg:px-8 py-1.5 flex items-center justify-between">
          <span className="text-[10px] text-[var(--modal-text-muted)]">© 2026 Modal Education LLC</span>
          <button
            onClick={() => setShowTerms(true)}
            className="text-[10px] text-[var(--modal-text-muted)] hover:text-[#400070] underline underline-offset-2 transition-colors"
          >
            Terms of Service &amp; Privacy Policy
          </button>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <TermsViewOnly onClose={() => setShowTerms(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function TermsViewOnly({ onClose }) {
  return (
    <>
      <div className="px-6 pt-6 pb-4 border-b border-[var(--modal-border)] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[var(--modal-text)]">Terms of Service, Privacy Policy & DPA</h2>
          <p className="text-sm text-[var(--modal-text-muted)]">Effective Date: 2/23/2026 · Modal Education, LLC</p>
        </div>
        <button onClick={onClose} className="text-[var(--modal-text-muted)] hover:text-[var(--modal-text)] text-2xl leading-none">&times;</button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-[var(--modal-text)] space-y-4 leading-relaxed">
        <TermsContent />
      </div>
      <div className="px-6 py-4 border-t border-[var(--modal-border)] shrink-0">
        <button
          onClick={onClose}
          className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-10 font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </>
  );
}

function TermsContent() {
  return (
    <div className="space-y-5">
      <S title="1. Agreement to Terms">
        <p>Modal Itinerant ("App") is owned and operated by Modal Education, LLC. By accessing or using the App, you agree to be legally bound by these Terms. If you do not agree, you must not use the App.</p>
        <p>You represent that you are at least 18 years old, authorized to use the App professionally, and understand the limitations described herein.</p>
      </S>
      <S title="2. Nature of the App">
        <p>Modal Itinerant is an educational productivity tool for Teachers of the Deaf and Hard of Hearing. It does <strong>not</strong> provide medical advice, audiological diagnosis, legal advice, guarantee regulatory compliance, or replace professional licensure.</p>
      </S>
      <S title="3. Professional Responsibility">
        <p>You are solely responsible for all professional decisions. AI-generated outputs may contain inaccuracies and must be independently reviewed. The Company does not validate your documentation.</p>
      </S>
      <S title="4. Student Privacy Requirements">
        <p>You must <strong>not</strong> enter full student names, dates of birth, addresses, student ID numbers, school or district names, or any identifying student information. Use initials only (e.g., Fi.La.).</p>
      </S>
      <S title="5. Assessment References & Third-Party Tools">
        <p>Assessment references are for informational purposes only. Modal Education, LLC is not affiliated with or endorsed by assessment publishers. Users are responsible for obtaining proper authorization to administer any referenced assessments.</p>
      </S>
      <S title="6. AI Disclaimer">
        <p>AI outputs may contain errors. You assume full responsibility for any use of AI-generated content. AI does not replace professional evaluation or diagnosis.</p>
      </S>
      <S title="Privacy Policy">
        <p><strong>Data Collected:</strong> Name, email, subscription status, and non-identifiable usage analytics. Billing handled by secure third parties.</p>
        <p><strong>Data Use:</strong> We do not sell user data or share educational content for marketing.</p>
        <p><strong>FERPA/HIPAA:</strong> Modal Education, LLC is not a School Official under FERPA and is not a HIPAA Business Associate. You remain solely responsible for compliance.</p>
      </S>
      <S title="Data Processing Addendum">
        <p>You are the Data Controller. Modal Education, LLC acts only as a Data Processor for limited account-related data. Do not enter student records, Protected Health Information, or confidential medical records.</p>
      </S>
      <S title="Subscription & Payment">
        <p>Subscriptions are non-refundable and cancelable at any time. Access continues through the end of the billing period upon cancellation. Free trials convert automatically unless canceled.</p>
      </S>
      <S title="Legal Protections">
        <p><strong>No Warranty:</strong> The App is provided "AS IS." We disclaim all warranties.</p>
        <p><strong>Limitation of Liability:</strong> Total liability shall not exceed the amount paid during the preceding subscription period.</p>
        <p><strong>Arbitration:</strong> Disputes resolved exclusively through binding arbitration. Class action rights are waived.</p>
        <p><strong>Governing Law:</strong> These Terms are governed by applicable state law.</p>
      </S>
    </div>
  );
}

function S({ title, children }) {
  return (
    <div>
      <h3 className="font-bold text-[#400070] text-xs uppercase tracking-wide mb-1.5">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}