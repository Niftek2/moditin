import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Trash2, Loader2, Pencil, Sparkles, ExternalLink, Smartphone } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import DeleteAccountDialog from "../components/shared/DeleteAccountDialog";
import AudioSettings from "../components/shared/AudioSettings";
import PWAInstallGuideModal from "../components/shared/PWAInstallGuideModal";

const isIosMode = typeof window !== "undefined" && (
  window.ModalApp?.platform === "ios" ||
  new URLSearchParams(window.location.search).get("platform") === "ios"
);

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", schoolDistrict: "", estimatedUsers: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [subStatus, setSubStatus] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Change password
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
  const [passwordStatus, setPasswordStatus] = useState(null); // "saving" | "success" | "error"
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setProfileForm({ firstName: u?.firstName || "", email: u?.email || "" });
      const demoEmails = ["demo@modaleducation.com", "niftek2@gmail.com"];
      setIsDemo(demoEmails.includes(u?.email?.toLowerCase()));
    }).catch(() => {});
    if (!isIosMode) {
      base44.functions.invoke("stripeStatus", {}).then(res => setSubStatus(res.data)).catch(() => {});
    }
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

  const handleSubscribe = async () => {
    if (window.self !== window.top) {
      alert("Checkout only works from the published app. Please open the app directly.");
      return;
    }
    setSubLoading(true);
    const res = await base44.functions.invoke("stripeCheckout", {
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    });
    setSubLoading(false);
    if (res.data?.url) window.location.href = res.data.url;
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!passwordForm.current) { setPasswordError("Please enter your current password."); return; }
    if (passwordForm.newPass.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
    if (passwordForm.newPass !== passwordForm.confirm) { setPasswordError("Passwords do not match."); return; }
    setPasswordStatus("saving");
    try {
      await base44.auth.updateMe({ password: passwordForm.newPass, currentPassword: passwordForm.current });
      setPasswordStatus("success");
      setPasswordForm({ current: "", newPass: "", confirm: "" });
      setChangingPassword(false);
      setTimeout(() => setPasswordStatus(null), 4000);
    } catch (e) {
      setPasswordError(e.message || "Failed to change password. Please check your current password.");
      setPasswordStatus("error");
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    const res = await base44.functions.invoke("stripePortal", { returnUrl: window.location.href });
    setPortalLoading(false);
    if (res.data?.url) window.location.href = res.data.url;
  };

  const handleShowInstallGuide = () => {
    setShowInstallGuide(true);
    base44.analytics.track({ eventName: "pwa_install_guide_clicked" });
  };

  const inquiryMutation = useMutation({
    mutationFn: (data) => base44.entities.SchoolInquiry.create(data),
    onSuccess: () => setSubmitted(true),
  });

  return (
    <>
      <div>
      <PageHeader title="Settings" subtitle="Account settings" />

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

        {/* Change Password */}
        <div className="modal-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[var(--modal-text)]">Password</h3>
            {!changingPassword && (
              <Button variant="ghost" size="sm" onClick={() => setChangingPassword(true)} className="gap-1 text-[#400070] hover:text-[#5B00A0] h-8 px-2">
                <Pencil className="w-3.5 h-3.5" /> Change
              </Button>
            )}
          </div>

          {passwordStatus === "success" && (
            <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" /> Password updated successfully!
            </div>
          )}

          {changingPassword ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[var(--modal-text-muted)]">Current Password</Label>
                <Input
                  type="password"
                  value={passwordForm.current}
                  onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                  placeholder="Your current password"
                  className="bg-white border-[var(--modal-border)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[var(--modal-text-muted)]">New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.newPass}
                  onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="bg-white border-[var(--modal-border)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[var(--modal-text-muted)]">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                  className="bg-white border-[var(--modal-border)]"
                />
              </div>
              {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}
              <div className="flex gap-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordStatus === "saving"}
                  className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2"
                >
                  {passwordStatus === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Update Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setChangingPassword(false); setPasswordForm({ current: "", newPass: "", confirm: "" }); setPasswordError(""); }}
                  className="border-[var(--modal-border)]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--modal-text-muted)]">••••••••••</p>
          )}
        </div>

        {/* Add to Home Screen */}
        <div className="modal-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[var(--modal-text)]">Add App to Your Phone</h3>
              <p className="text-xs text-[var(--modal-text-muted)] mt-1">Save Modal Itinerant to your iPhone home screen for easy access.</p>
            </div>
            <button
              onClick={handleShowInstallGuide}
              className="flex items-center gap-2 text-sm font-semibold text-[#400070] hover:text-[#5B00A0] transition-colors whitespace-nowrap ml-4"
            >
              <Smartphone className="w-4 h-4" />
              How to
            </button>
          </div>
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

        {/* Subscription — always shown (except iOS) */}
        {!isIosMode && (
        <div className="modal-card p-6 border-2 border-[var(--modal-border)]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#400070]" />
            <h3 className="font-semibold text-[var(--modal-text)]">Subscription & Billing</h3>
          </div>
          {subLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--modal-text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading subscription status…
            </div>
          ) : subStatus?.isActive ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${subStatus.isTrial ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                  {subStatus.isTrial ? "Free Trial" : "Active"}
                </span>
                {subStatus.trialEnd && subStatus.isTrial && (
                  <span className="text-xs text-[var(--modal-text-muted)]">
                    Trial ends {new Date(subStatus.trialEnd * 1000).toLocaleDateString()}
                  </span>
                )}
                {subStatus.currentPeriodEnd && !subStatus.isTrial && (
                  <span className="text-xs text-[var(--modal-text-muted)]">
                    Renews {new Date(subStatus.currentPeriodEnd * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--modal-text-muted)]">To cancel or update your plan, click "Manage Billing" below. You can cancel anytime from the billing portal.</p>
              <Button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="w-full sm:w-auto gap-2 bg-[#400070] hover:bg-[#5B00A0] text-white"
              >
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Manage / Cancel Subscription
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">No Active Subscription</span>
              <p className="text-xs text-[var(--modal-text-muted)]">No active subscription found. If you believe this is an error, please contact support.</p>
            </div>
          )}
        </div>
        )}

        {/* Delete Account */}
        {!isDemo && <div className="modal-card p-6 border border-red-200">
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
        </div>}
      </div>

      </div>
      <DeleteAccountDialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} />
      {showInstallGuide && <PWAInstallGuideModal onClose={() => setShowInstallGuide(false)} />}
    </>
  );
}