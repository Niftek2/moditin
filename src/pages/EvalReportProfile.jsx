import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Trash2, CheckCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function EvalReportProfile() {
  const queryClient = useQueryClient();
  const [userEmail, setUserEmail] = useState(null);
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    teacherName: "",
    title: "",
    districtDisplayName: "",
    signatureBlock: "",
    districtLogoUrl: "",
  });

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {});
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ["teacherProfile", userEmail],
    queryFn: () => base44.entities.TeacherProfile.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const profile = profiles[0];

  useEffect(() => {
    if (profile) {
      setForm({
        teacherName: profile.teacherName || "",
        title: profile.title || "",
        districtDisplayName: profile.districtDisplayName || "",
        signatureBlock: profile.signatureBlock || "",
        districtLogoUrl: profile.districtLogoUrl || "",
      });
      if (profile.districtLogoUrl) setLogoPreview(profile.districtLogoUrl);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) return base44.entities.TeacherProfile.update(profile.id, data);
      return base44.entities.TeacherProfile.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherProfile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes('png') && !file.type.includes('image')) {
      alert("Please upload a PNG image.");
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, districtLogoUrl: file_url }));
      setLogoPreview(file_url);
    } catch (e) {
      alert("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  const handleSave = () => saveMutation.mutate(form);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link to={createPageUrl("EvalReportDashboard")}>
          <Button variant="ghost" size="icon" className="text-[var(--modal-text-muted)]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--modal-text)]">Profile & Logo Settings</h1>
          <p className="text-sm text-[var(--modal-text-muted)]">Configure your evaluator information and district logo</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Evaluator Info */}
        <div className="modal-card p-6 space-y-4">
          <h2 className="font-bold text-[var(--modal-text)]">Evaluator Information</h2>

          <div className="space-y-2">
            <Label>Teacher Name</Label>
            <Input value={form.teacherName} onChange={e => setForm(p => ({ ...p, teacherName: e.target.value }))}
              placeholder="Your name as it appears on reports" className="border-[var(--modal-border)]" />
          </div>

          <div className="space-y-2">
            <Label>Title / Role</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Teacher of the Deaf and Hard of Hearing" className="border-[var(--modal-border)]" />
          </div>

          <div className="space-y-2">
            <Label>District Display Name</Label>
            <Input value={form.districtDisplayName} onChange={e => setForm(p => ({ ...p, districtDisplayName: e.target.value }))}
              placeholder="e.g., XYZ Unified School District" className="border-[var(--modal-border)]" />
            <p className="text-xs text-[var(--modal-text-muted)]">This appears in report headers — do not include full school names</p>
          </div>

          <div className="space-y-2">
            <Label>Signature Block</Label>
            <Textarea value={form.signatureBlock} onChange={e => setForm(p => ({ ...p, signatureBlock: e.target.value }))}
              placeholder="e.g., Teacher of the Deaf, M.Ed., Credential #XXXXX" rows={3}
              className="border-[var(--modal-border)]" />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="modal-card p-6 space-y-4">
          <h2 className="font-bold text-[var(--modal-text)]">District Logo</h2>
          <p className="text-sm text-[var(--modal-text-muted)]">Upload a PNG logo to appear on the first page of all exported reports. Transparency is preserved.</p>

          {logoPreview ? (
            <div className="space-y-3">
              <div className="border border-[var(--modal-border)] rounded-xl p-4 bg-gray-50 flex items-center justify-center min-h-[100px]">
                <img src={logoPreview} alt="District logo" style={{ maxHeight: 80, maxWidth: 280, objectFit: "contain" }} />
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span><Upload className="w-3.5 h-3.5 mr-1.5" /> Replace Logo</span>
                  </Button>
                  <input type="file" accept="image/png,image/*" className="sr-only" onChange={handleLogoUpload} />
                </label>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600"
                  onClick={() => { setLogoPreview(null); setForm(p => ({ ...p, districtLogoUrl: "" })); }}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-[var(--modal-border)] rounded-xl p-8 text-center hover:border-[#400070] transition-colors">
                <Upload className="w-8 h-8 text-[var(--modal-text-muted)] mx-auto mb-2" />
                <p className="text-sm font-medium text-[var(--modal-text)]">{uploading ? "Uploading..." : "Click to upload PNG logo"}</p>
                <p className="text-xs text-[var(--modal-text-muted)] mt-1">PNG recommended · Max 5MB · Transparency supported</p>
              </div>
              <input type="file" accept="image/png,image/*" className="sr-only" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Saved
            </div>
          )}
          <Button className="bg-[#400070] hover:bg-[#5B00A0] text-white"
            onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}