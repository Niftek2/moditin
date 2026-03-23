import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, Shield, FileText, AlertTriangle } from "lucide-react";

const PDF_URL = "https://media.base44.com/files/public/6998a9f042c4eb98ea121183/7104cf2c7_modal-itinerant-ferpa-fillable.pdf";

export default function FerpaDpaPage() {
  const [form, setForm] = useState({
    repName: "",
    title: "",
    institutionName: "",
    institutionAddress: "",
    institutionEmail: "",
    dateSigned: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const isValid = form.repName.trim() && form.title.trim() && form.institutionName.trim() && form.institutionEmail.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await base44.functions.invoke("sendFerpaDpa", { ...form });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F3FA]">
      {/* Header */}
      <div className="bg-[#400070] text-white py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/1d36446be_ModalitinerantLogo.png"
            alt="Modal Itinerant"
            className="h-10 object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div>
            <h1 className="text-2xl font-bold">FERPA Compliance Notice & Data Processing Agreement</h1>
            <p className="text-purple-200 text-sm mt-0.5">For Schools and Districts · Modal Education, LLC · v1.0</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* PDF Viewer */}
        <div className="modal-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--modal-border)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#6B2FB9]" />
            <h2 className="font-bold text-[var(--modal-text)]">Full Agreement Document (8 pages)</h2>
          </div>
          <div className="w-full" style={{ height: "600px" }}>
            <iframe
              src={`${PDF_URL}#toolbar=1&view=FitH`}
              className="w-full h-full border-0"
              title="FERPA DPA Document"
            />
          </div>
          <div className="px-6 py-3 bg-[#F7F3FA] border-t border-[var(--modal-border)]">
            <a
              href={PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#6B2FB9] hover:underline font-medium"
            >
              Open PDF in new tab ↗
            </a>
          </div>
        </div>

        {/* Execution Form */}
        {submitted ? (
          <div className="modal-card p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[var(--modal-text)] mb-2">Agreement Submitted</h2>
            <p className="text-[var(--modal-text-muted)] text-sm max-w-md mx-auto">
              A copy of this agreement has been sent to <strong>{form.institutionEmail}</strong> and to Modal Education, LLC.
              Please retain this for your records.
            </p>
          </div>
        ) : (
          <div className="modal-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#EADDF5] flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-[#400070]" />
              </div>
              <div>
                <h2 className="font-bold text-[var(--modal-text)]">Signature & Execution</h2>
                <p className="text-sm text-[var(--modal-text-muted)]">
                  Complete the fields below to execute this Agreement on behalf of your institution. A copy will be emailed to you and to Modal Education, LLC.
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                This document does not constitute legal advice. Educational institutions are encouraged to have this Agreement reviewed by qualified legal counsel before execution.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Printed Name of Authorized Representative <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.repName}
                    onChange={e => set("repName", e.target.value)}
                    placeholder="Full name"
                    className="border-[var(--modal-border)]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Title / Role <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.title}
                    onChange={e => set("title", e.target.value)}
                    placeholder="e.g., Director of Special Education"
                    className="border-[var(--modal-border)]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Full Legal Institution Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.institutionName}
                    onChange={e => set("institutionName", e.target.value)}
                    placeholder="e.g., Springfield Unified School District"
                    className="border-[var(--modal-border)]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Institution Address</Label>
                  <Input
                    value={form.institutionAddress}
                    onChange={e => set("institutionAddress", e.target.value)}
                    placeholder="Street, City, State, ZIP"
                    className="border-[var(--modal-border)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Institution Email Address for Notices <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    value={form.institutionEmail}
                    onChange={e => set("institutionEmail", e.target.value)}
                    placeholder="compliance@district.edu"
                    className="border-[var(--modal-border)]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date Signed</Label>
                  <Input
                    type="date"
                    value={form.dateSigned}
                    onChange={e => set("dateSigned", e.target.value)}
                    className="border-[var(--modal-border)]"
                  />
                </div>
              </div>

              <p className="text-xs text-[var(--modal-text-muted)] border-t border-[var(--modal-border)] pt-4">
                By clicking "Execute Agreement" below, I confirm that I am an authorized representative of the institution named above and that I have read, understood, and agree to the terms of this FERPA Compliance Notice and Data Processing Agreement on behalf of my institution.
              </p>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={!isValid || submitting}
                className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white h-12 text-base font-semibold"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                ) : (
                  <><Shield className="w-5 h-5" /> Execute Agreement</>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[var(--modal-text-muted)] pb-8">
          Questions? Contact <a href="mailto:contact@modalmath.com" className="text-[#6B2FB9] hover:underline">contact@modalmath.com</a> · Modal Education, LLC · Effective February 23, 2026
        </p>
      </div>
    </div>
  );
}