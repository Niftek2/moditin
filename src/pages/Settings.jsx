import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Trash2, ExternalLink, Loader2, Sparkles } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import DeleteAccountDialog from "../components/shared/DeleteAccountDialog";
import { useSubscription } from "../components/shared/SubscriptionGate";
import { format, fromUnixTime } from "date-fns";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", schoolDistrict: "", estimatedUsers: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const { subStatus } = useSubscription();

  const handleManageBilling = async () => {
    if (window.self !== window.top) {
      alert("Billing portal is only available from the published app.");
      return;
    }
    setLoadingPortal(true);
    try {
      const res = await base44.functions.invoke("stripePortal", { returnUrl: window.location.href });
      if (res.data?.url) window.location.href = res.data.url;
    } catch {
      alert("Could not open billing portal. Please try again.");
    } finally {
      setLoadingPortal(false);
    }
  };

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const inquiryMutation = useMutation({
    mutationFn: (data) => base44.entities.SchoolInquiry.create(data),
    onSuccess: () => setSubmitted(true),
  });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account and subscription management" />

      <div className="space-y-6 max-w-2xl">
        {/* Account */}
        <div className="modal-card p-6">
          <h3 className="font-semibold text-[var(--modal-text)] mb-4">Account</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[var(--modal-text-muted)]">Name</p>
              <p className="text-sm text-[var(--modal-text)]">{user?.full_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--modal-text-muted)]">Email</p>
              <p className="text-sm text-[var(--modal-text)]">{user?.email || "—"}</p>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="modal-card p-6">
          <h3 className="font-semibold text-[var(--modal-text)] mb-4">Subscription</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-xl border border-[var(--modal-border)] bg-[#400070]/10">
              <p className="text-sm font-semibold text-[var(--modal-text)]">Monthly</p>
              <p className="text-2xl font-bold text-[var(--modal-text)] mt-1">$19.99<span className="text-sm font-normal text-[var(--modal-text-muted)]">/mo</span></p>
              <p className="text-xs text-[var(--modal-text-muted)] mt-1">7-day free trial · Cancel anytime</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--modal-border)] bg-[#400070]/10">
              <p className="text-sm font-semibold text-[var(--modal-text)]">Annual</p>
              <p className="text-2xl font-bold text-[var(--modal-text)] mt-1">$179.99<span className="text-sm font-normal text-[var(--modal-text-muted)]">/yr</span></p>
              <p className="text-xs text-green-700 mt-1">Save $59.89/year · 7-day free trial</p>
            </div>
          </div>
          <p className="text-xs text-[var(--modal-text-muted)]">After cancellation, you retain read-only export access for 30 days.</p>
        </div>

        {/* School Pricing Inquiry */}
        <div className="modal-card p-6">
          <h3 className="font-semibold text-[var(--modal-text)] mb-2">School/District Pricing</h3>
          <p className="text-xs text-[var(--modal-text-muted)] mb-4">Interested in pricing for your school or district? Fill out the form below.</p>

          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-[var(--modal-text)] font-medium">Thank you!</p>
              <p className="text-xs text-[var(--modal-text-muted)]">We'll be in touch shortly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[var(--modal-text-muted)]">Name *</Label>
                  <Input value={inquiryForm.name} onChange={(e) => setInquiryForm(p => ({ ...p, name: e.target.value }))} className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]" />
                  </div>
                  <div className="space-y-2">
                  <Label className="text-[var(--modal-text-muted)]">Email *</Label>
                  <Input type="email" value={inquiryForm.email} onChange={(e) => setInquiryForm(p => ({ ...p, email: e.target.value }))} className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]" />
                  </div>
                  <div className="space-y-2">
                  <Label className="text-[var(--modal-text-muted)]">School/District *</Label>
                  <Input value={inquiryForm.schoolDistrict} onChange={(e) => setInquiryForm(p => ({ ...p, schoolDistrict: e.target.value }))} className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]" />
                  </div>
                  <div className="space-y-2">
                  <Label className="text-[var(--modal-text-muted)]">Estimated Users</Label>
                  <Input type="number" value={inquiryForm.estimatedUsers} onChange={(e) => setInquiryForm(p => ({ ...p, estimatedUsers: e.target.value }))} className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]" />
                  </div>
                  </div>
                  <div className="space-y-2">
                  <Label className="text-[var(--modal-text-muted)]">Notes</Label>
                  <Textarea value={inquiryForm.notes} onChange={(e) => setInquiryForm(p => ({ ...p, notes: e.target.value }))} className="bg-white border-[var(--modal-border)] text-[var(--modal-text)] h-20" />
              </div>
              <Button
                onClick={() => inquiryMutation.mutate({ ...inquiryForm, estimatedUsers: inquiryForm.estimatedUsers ? parseInt(inquiryForm.estimatedUsers) : undefined })}
                disabled={!inquiryForm.name || !inquiryForm.email || !inquiryForm.schoolDistrict}
                className="bg-[#400070] hover:bg-[#5B00A0] text-white"
              >
                Submit Inquiry
              </Button>
            </div>
          )}
        </div>

        {/* Data Privacy */}
        <div className="modal-card p-6">
          <h3 className="font-semibold text-[var(--modal-text)] mb-2">Data Privacy</h3>
          <p className="text-xs text-[var(--modal-text-muted)]">
            All student data is stored using initials only (e.g., Aa.Bb.). Full names, dates of birth, addresses, 
            student IDs, school names, and district names are strictly prohibited. Modal Itinerant includes PII detection 
            guardrails to help protect student privacy.
          </p>
        </div>

        {/* Delete Account */}
        <div className="modal-card p-6 border border-red-200">
          <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-xs text-[var(--modal-text-muted)] mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </Button>
        </div>
      </div>

      <DeleteAccountDialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} />
    </div>
  );
}