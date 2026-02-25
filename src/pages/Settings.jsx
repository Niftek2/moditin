import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Trash2, ExternalLink, Loader2, Sparkles, Pencil, Check, X } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import DeleteAccountDialog from "../components/shared/DeleteAccountDialog";
import AudioSettings from "../components/shared/AudioSettings";
import { useSubscription } from "../components/shared/SubscriptionGate";
import { format, fromUnixTime } from "date-fns";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", schoolDistrict: "", estimatedUsers: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(null);
  const { subStatus } = useSubscription();

  const handleCheckout = async (priceId) => {
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app.");
      return;
    }
    setLoadingCheckout(priceId);
    try {
      const res = await base44.functions.invoke("stripeCheckout", {
        successUrl: window.location.href + "?subscribed=1",
        cancelUrl: window.location.href,
        priceId,
      });
      if (res.data?.url) window.location.href = res.data.url;
    } catch {
      alert("Could not open checkout. Please try again.");
    } finally {
      setLoadingCheckout(null);
    }
  };

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
    base44.auth.me().then((u) => {
      setUser(u);
      setProfileForm({ firstName: u?.firstName || "", email: u?.email || "" });
    }).catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    await base44.auth.updateMe({ firstName: profileForm.firstName.trim() });
    setUser(u => ({ ...u, firstName: profileForm.firstName.trim() }));
    setSavingProfile(false);
    setProfileSaved(true);
    setEditingProfile(false);
    setTimeout(() => setProfileSaved(false), 3000);
  };

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--modal-text)]">Account</h3>
            {!editingProfile && (
              <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)} className="gap-1 text-[#400070] hover:text-[#5B00A0] h-8 px-2">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
          </div>

          {editingProfile ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[var(--modal-text-muted)]">First Name</Label>
                <Input
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm(p => ({ ...p, firstName: e.target.value }))}
                  placeholder="Your first name"
                  className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[var(--modal-text-muted)]">Email</Label>
                <Input value={profileForm.email} disabled className="bg-gray-50 border-[var(--modal-border)] text-[var(--modal-text-muted)]" />
                <p className="text-xs text-[var(--modal-text-muted)]">Email cannot be changed here</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={savingProfile || !profileForm.firstName.trim()} className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2">
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save
                </Button>
                <Button variant="outline" onClick={() => { setEditingProfile(false); setProfileForm({ firstName: user?.firstName || "", email: user?.email || "" }); }} className="border-[var(--modal-border)]">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {profileSaved && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Profile updated!
                </div>
              )}
              <div>
                <p className="text-xs text-[var(--modal-text-muted)]">First Name</p>
                <p className="text-sm text-[var(--modal-text)]">{user?.firstName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--modal-text-muted)]">Email</p>
                <p className="text-sm text-[var(--modal-text)]">{user?.email || "—"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Subscription */}
        <div className="modal-card p-6">
          <h3 className="font-semibold text-[var(--modal-text)] mb-4">Subscription</h3>
          {subStatus?.isActive ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
                <div className="w-10 h-10 rounded-full bg-[#400070] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--modal-text)]">Modal Pro — Active</p>
                  <p className="text-xs text-[var(--modal-text-muted)]">
                    {subStatus.isTrial
                      ? `Free trial ends ${format(fromUnixTime(subStatus.trialEnd), "MMM d, yyyy")}`
                      : `Renews ${format(fromUnixTime(subStatus.currentPeriodEnd), "MMM d, yyyy")}`}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleManageBilling}
                disabled={loadingPortal}
                variant="outline"
                className="border-[var(--modal-border)] text-[var(--modal-text)] hover:text-[#400070] gap-2"
              >
                {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Manage Billing
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[var(--modal-border)] bg-[#F7F3FA]">
                <p className="text-sm font-semibold text-[var(--modal-text)]">Modal Itinerant — $17.99/mo or $179/yr</p>
                <p className="text-xs text-[var(--modal-text-muted)] mt-1">7-day free trial · Cancel anytime</p>
              </div>
              <p className="text-xs text-[var(--modal-text-muted)]">You currently don't have an active subscription.</p>
            </div>
          )}
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

        {/* Audio Settings */}
        <div className="modal-card p-6">
          <h3 className="font-semibold text-[var(--modal-text)] mb-4">Audio Settings</h3>
          <AudioSettings />
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