import React, { useState } from "react";
import { Shield } from "lucide-react";

const SECTIONS = {
  terms: [
    {
      title: "1. Agreement to Terms",
      content: [
        'Modal Itinerant (\u201cApp\u201d) is owned and operated by Modal Education, LLC (\u201cCompany,\u201d \u201cwe,\u201d \u201cus,\u201d or \u201cour\u201d).',
        "By accessing, registering for, subscribing to, or using the App, you ("User") agree to be legally bound by these Terms. If you do not agree, you must not use the App.",
        "By using the App, you represent that you are at least 18 years old, authorized to use the App in a professional capacity, and understand and accept the limitations described below.",
      ],
    },
    {
      title: "2. Nature of the App",
      content: [
        "Modal Itinerant is an educational productivity and organizational tool designed to support Teachers of the Deaf and Hard of Hearing.",
        "The App may assist with instructional planning, goal drafting, service tracking, equipment logging, worksheet generation, and assessment organization.",
        "The App does not provide medical advice, audiological diagnosis, legal advice, guarantee regulatory compliance, replace professional licensure, or replace district, state, or federal procedures.",
        "All content and outputs are provided for informational and productivity purposes only.",
      ],
    },
    {
      title: "3. Professional Responsibility",
      content: [
        "You are solely responsible for all professional decisions. You must independently review and verify all generated content. AI-generated outputs may contain inaccuracies. The Company does not supervise, review, or validate your documentation.",
      ],
    },
    {
      title: "4. Student Privacy Requirements",
      content: [
        "Users agree not to enter: full student names, dates of birth, addresses, student ID numbers, school names, district names, medical or psychological records, or any identifiable student information.",
        "Students must be referenced by initials only. If you enter identifiable student data, you do so in violation of these Terms and at your own risk.",
      ],
    },
    {
      title: "5. Assessment References & Third-Party Tools",
      content: [
        "The App may reference standardized assessments for informational purposes. All trademarks remain property of their respective owners. Modal Education, LLC is not affiliated with or endorsed by assessment publishers and does not sell or reproduce proprietary test materials.",
        "Users are responsible for obtaining proper authorization and licensure to administer any assessments referenced.",
      ],
    },
    {
      title: "6. Artificial Intelligence (AI) Disclaimer",
      content: [
        "AI outputs may contain errors or omissions. AI does not replace professional evaluation or diagnosis. AI-generated content must be reviewed before use. You assume full responsibility for use of AI-generated material.",
      ],
    },
    {
      title: "15. Subscriptions",
      content: [
        "Subscriptions are offered monthly or annually. Subscriptions are non-refundable and cancelable at any time. If canceled, access continues through the end of the billing period. No prorated refunds will be issued for unused time. Free trials convert automatically unless canceled before expiration.",
      ],
    },
    {
      title: "16. No Warranty",
      content: [
        "The App is provided \"AS IS\" and \"AS AVAILABLE.\" We disclaim all warranties including merchantability, fitness for a particular purpose, accuracy, and regulatory compliance suitability.",
      ],
    },
    {
      title: "17. Limitation of Liability",
      content: [
        "Modal Education, LLC shall not be liable for direct, indirect, consequential damages, regulatory penalties, professional liability claims, data loss, or compliance violations. Total liability shall not exceed the amount paid during the preceding subscription period.",
      ],
    },
    {
      title: "18. Indemnification",
      content: [
        "You agree to indemnify and hold harmless Modal Education, LLC from any claims arising from your use of the App, violation of these Terms, improper data entry, FERPA violations, or professional decisions made using the App.",
      ],
    },
    {
      title: "19. Mandatory Arbitration & Class Action Waiver",
      content: [
        "Any dispute shall be resolved exclusively through binding arbitration under the American Arbitration Association. You waive the right to a jury trial and participation in class action lawsuits.",
      ],
    },
    {
      title: "20. Force Majeure",
      content: [
        "Modal Education, LLC shall not be liable for service interruptions caused by events beyond reasonable control. Such events do not entitle users to refunds.",
      ],
    },
    {
      title: "21. Termination",
      content: [
        "We reserve the right to suspend or terminate access for violation of privacy requirements, improper use, legal risk exposure, or breach of these Terms. No refunds will be issued upon termination.",
      ],
    },
    {
      title: "22. Governing Law",
      content: ["These Terms shall be governed by the laws of the applicable state."],
    },
    {
      title: "23. Severability",
      content: [
        "If any provision is found unenforceable, remaining provisions remain in full force and effect.",
      ],
    },
  ],
  privacy: [
    {
      title: "7. Information We Collect",
      content: [
        "We collect only the minimum necessary: account information (name, email, subscription status) and non-identifiable usage analytics. Billing is processed by secure third-party providers — we do not store full payment card details. We do not request identifiable student records.",
      ],
    },
    {
      title: "8. Data Use & Sharing",
      content: [
        "Modal Education, LLC does not sell user data, share educational content for marketing, or distribute user-generated educational content. We may use anonymized aggregate analytics to improve the product.",
      ],
    },
    {
      title: "9. Data Security",
      content: [
        "We implement commercially reasonable security safeguards. No internet-based system can guarantee absolute security. By using the App, you acknowledge inherent online risks.",
      ],
    },
    {
      title: "10. FERPA & HIPAA Clarification",
      content: [
        "Modal Education, LLC does not act as a School Official under FERPA, is not a HIPAA Business Associate, and does not certify regulatory compliance. You remain solely responsible for compliance with FERPA, IDEA, ADA, and applicable state and district policies.",
      ],
    },
    {
      title: "11. Roles (DPA)",
      content: [
        "You are the Data Controller. Modal Education, LLC acts only as a Data Processor for limited account-related data.",
      ],
    },
    {
      title: "12. Prohibited Data (DPA)",
      content: [
        "You agree not to enter identifiable student records, Protected Health Information (PHI), or confidential medical records.",
      ],
    },
    {
      title: "13. Subprocessors (DPA)",
      content: [
        "We may use third-party providers for hosting and payment processing, contractually required to maintain commercially reasonable safeguards.",
      ],
    },
    {
      title: "14. Data Retention (DPA)",
      content: [
        "Account data is retained during active subscription and for a commercially reasonable period after cancellation. Users are responsible for exporting documentation before account deletion.",
      ],
    },
  ],
};

export default function PrivacyPolicyPage() {
  const [tab, setTab] = useState("terms");

  return (
    <div className="min-h-screen bg-[var(--modal-bg)] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#EADDF5] flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-[#400070]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--modal-text)]">
              Legal Documents
            </h1>
            <p className="text-sm text-[var(--modal-text-muted)]">
              Effective Date: 2/23/2026 · Modal Education, LLC
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-6 mb-8 border-b border-[var(--modal-border)]">
          <button
            onClick={() => setTab("terms")}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
              tab === "terms"
                ? "border-[#400070] text-[#400070]"
                : "border-transparent text-[var(--modal-text-muted)] hover:text-[var(--modal-text)]"
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setTab("privacy")}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
              tab === "privacy"
                ? "border-[#400070] text-[#400070]"
                : "border-transparent text-[var(--modal-text-muted)] hover:text-[var(--modal-text)]"
            }`}
          >
            Privacy Policy & DPA
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed text-[var(--modal-text)]">
          {SECTIONS[tab].map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-[#400070] mb-2 uppercase tracking-wide text-xs">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.content.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[var(--modal-text-muted)] mt-10 text-center">
          © {new Date().getFullYear()} Modal Education, LLC. All rights reserved.
        </p>
      </div>
    </div>
  );
}