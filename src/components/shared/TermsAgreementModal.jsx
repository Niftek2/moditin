import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";

const TERMS_KEY = "modal_itinerant_terms_agreed_v1";

const checkboxItems = [
  { id: "noAdvice", label: "I understand this App does not provide medical or legal advice." },
  { id: "noStudentPII", label: "I will not enter identifiable student information (full names, DOB, addresses, IDs, school/district names, or records)." },
  { id: "noRefunds", label: "I understand subscriptions are non-refundable." },
  { id: "arbitration", label: "I agree to mandatory arbitration and waive class action rights." },
  { id: "indemnify", label: "I agree to indemnify and hold harmless Modal Education, LLC." },
];

export function hasAgreedToTerms() {
  return localStorage.getItem(TERMS_KEY) === "true";
}

export default function TermsAgreementModal({ onAgree }) {
  const [checked, setChecked] = useState({});

  const allChecked = checkboxItems.every((item) => checked[item.id]);

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAgree = () => {
    localStorage.setItem(TERMS_KEY, "true");
    onAgree();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[var(--modal-border)] shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-[#EADDF5] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#400070]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--modal-text)]">
                Terms of Service, Privacy Policy & DPA
              </h2>
              <p className="text-sm text-[var(--modal-text-muted)]">
                Effective Date: 2/23/2026 · Modal Education, LLC
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--modal-text-muted)] mt-2">
            Please read and scroll through the full agreement before confirming below.
          </p>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
          <div className="prose prose-sm max-w-none text-[var(--modal-text)] space-y-5 text-sm leading-relaxed">

            <Section title="1. Agreement to Terms">
              <p>Modal Itinerant ("App") is owned and operated by Modal Education, LLC ("Company," "we," "us," or "our").</p>
              <p>By accessing, registering for, subscribing to, or using the App, you ("User") agree to be legally bound by these Terms. If you do not agree, you must not use the App.</p>
              <p>By using the App, you represent that you are at least 18 years old, authorized to use the App in a professional capacity, and understand and accept the limitations described below.</p>
            </Section>

            <Section title="2. Nature of the App">
              <p>Modal Itinerant is an educational productivity and organizational tool designed to support Teachers of the Deaf and Hard of Hearing.</p>
              <p>The App may assist with instructional planning, goal drafting, service tracking, equipment logging, worksheet generation, and assessment organization.</p>
              <p><strong>The App does not</strong> provide medical advice, audiological diagnosis, legal advice, guarantee regulatory compliance, replace professional licensure, or replace district, state, or federal procedures.</p>
              <p>All content and outputs are provided for informational and productivity purposes only.</p>
            </Section>

            <Section title="3. Professional Responsibility">
              <p>You are solely responsible for all professional decisions. You must independently review and verify all generated content. AI-generated outputs may contain inaccuracies. The Company does not supervise, review, or validate your documentation.</p>
            </Section>

            <Section title="4. Student Privacy Requirements">
              <p>Users agree <strong>not</strong> to enter: full student names, dates of birth, addresses, student ID numbers, school names, district names, medical or psychological records, or any identifiable student information.</p>
              <p>Students must be referenced by initials only. If you enter identifiable student data, you do so in violation of these Terms and at your own risk.</p>
            </Section>

            <Section title="5. Assessment References & Third-Party Tools">
              <p>The App may reference standardized assessments for informational purposes. All trademarks remain property of their respective owners. Modal Education, LLC is not affiliated with or endorsed by assessment publishers and does not sell or reproduce proprietary test materials.</p>
              <p>Users are responsible for obtaining proper authorization and licensure to administer any assessments referenced.</p>
            </Section>

            <Section title="6. Artificial Intelligence (AI) Disclaimer">
              <p>AI outputs may contain errors or omissions. AI does not replace professional evaluation or diagnosis. AI-generated content must be reviewed before use. You assume full responsibility for use of AI-generated material.</p>
            </Section>

            <Section title="Privacy Policy">
              <p className="font-semibold">7. Information We Collect</p>
              <p>We collect only the minimum necessary: account information (name, email, subscription status) and non-identifiable usage analytics. Billing is processed by secure third-party providers — we do not store full payment card details. We do not request identifiable student records.</p>
              <p className="font-semibold">8. Data Use & Sharing</p>
              <p>Modal Education, LLC does not sell user data, share educational content for marketing, or distribute user-generated educational content. We may use anonymized aggregate analytics to improve the product.</p>
              <p className="font-semibold">9. Data Security</p>
              <p>We implement commercially reasonable security safeguards. No internet-based system can guarantee absolute security. By using the App, you acknowledge inherent online risks.</p>
              <p className="font-semibold">10. FERPA & HIPAA Clarification</p>
              <p>Modal Education, LLC does not act as a School Official under FERPA, is not a HIPAA Business Associate, and does not certify regulatory compliance. You remain solely responsible for compliance with FERPA, IDEA, ADA, and applicable state and district policies.</p>
            </Section>

            <Section title="Data Processing Addendum (DPA)">
              <p><strong>11. Roles:</strong> You are the Data Controller. Modal Education, LLC acts only as a Data Processor for limited account-related data.</p>
              <p><strong>12. Prohibited Data:</strong> You agree not to enter identifiable student records, Protected Health Information (PHI), or confidential medical records.</p>
              <p><strong>13. Subprocessors:</strong> We may use third-party providers for hosting and payment processing, contractually required to maintain commercially reasonable safeguards.</p>
              <p><strong>14. Data Retention:</strong> Account data is retained during active subscription and for a commercially reasonable period after cancellation. Users are responsible for exporting documentation before account deletion.</p>
            </Section>

            <Section title="Subscription & Payment Terms">
              <p><strong>15. Subscriptions</strong> are offered monthly or annually. Subscriptions are non-refundable and cancelable at any time. If canceled, access continues through the end of the billing period. No prorated refunds will be issued for unused time. Free trials convert automatically unless canceled before expiration.</p>
            </Section>

            <Section title="Legal Protections">
              <p><strong>16. No Warranty:</strong> The App is provided "AS IS" and "AS AVAILABLE." We disclaim all warranties including merchantability, fitness for a particular purpose, accuracy, and regulatory compliance suitability.</p>
              <p><strong>17. Limitation of Liability:</strong> Modal Education, LLC shall not be liable for direct, indirect, consequential damages, regulatory penalties, professional liability claims, data loss, or compliance violations. Total liability shall not exceed the amount paid during the preceding subscription period.</p>
              <p><strong>18. Indemnification:</strong> You agree to indemnify and hold harmless Modal Education, LLC from any claims arising from your use of the App, violation of these Terms, improper data entry, FERPA violations, or professional decisions made using the App.</p>
              <p><strong>19. Mandatory Arbitration & Class Action Waiver:</strong> Any dispute shall be resolved exclusively through binding arbitration under the American Arbitration Association. You waive the right to a jury trial and participation in class action lawsuits.</p>
              <p><strong>20. Force Majeure:</strong> Modal Education, LLC shall not be liable for service interruptions caused by events beyond reasonable control. Such events do not entitle users to refunds.</p>
              <p><strong>21. Termination:</strong> We reserve the right to suspend or terminate access for violation of privacy requirements, improper use, legal risk exposure, or breach of these Terms. No refunds will be issued upon termination.</p>
              <p><strong>22. Governing Law:</strong> These Terms shall be governed by the laws of the applicable state.</p>
              <p><strong>23. Severability:</strong> If any provision is found unenforceable, remaining provisions remain in full force and effect.</p>
            </Section>

          </div>
        </ScrollArea>

        {/* Acknowledgments */}
        <div className="px-6 py-5 border-t border-[var(--modal-border)] bg-[#F7F3FA] rounded-b-2xl shrink-0">
          <p className="text-sm font-semibold text-[var(--modal-text)] mb-3">
            Required Acknowledgments — please check all boxes to continue:
          </p>
          <div className="space-y-3 mb-5">
            {checkboxItems.map((item) => (
              <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  checked={!!checked[item.id]}
                  onCheckedChange={() => toggle(item.id)}
                  className="mt-0.5 shrink-0 border-[#400070] data-[state=checked]:bg-[#400070] data-[state=checked]:text-white"
                />
                <span className="text-sm text-[var(--modal-text)] leading-snug">{item.label}</span>
              </label>
            ))}
          </div>
          <Button
            onClick={handleAgree}
            disabled={!allChecked}
            className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-11 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            I Agree — Continue to Modal Itinerant
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-bold text-[#400070] mb-2 text-sm uppercase tracking-wide">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}