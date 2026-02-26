import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Trash2, Loader2, Pencil } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import DeleteAccountDialog from "../components/shared/DeleteAccountDialog";
import AudioSettings from "../components/shared/AudioSettings";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", schoolDistrict: "", estimatedUsers: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

        {/* School Inquiry */}
        <div className="modal-card p-6">
          <h3 className="font-semibold text-[var(--modal-text)] mb-2">School/District Inquiry</h3>
          <p className="text-xs text-[var(--modal-text-muted)] mb-4">Interested in options for your school or district? Fill out the form below.</p>

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