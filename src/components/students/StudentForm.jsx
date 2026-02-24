import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import PIIWarning, { checkPII } from "../shared/PIIGuard";

const GRADE_BANDS = ["PK", "K", "1-2", "3-5", "6-8", "9-12"];
const SERVICE_MODELS = ["InPerson", "Telepractice", "Hybrid"];
const COMMUNICATION_MODALITIES = ["LSL", "ASL", "Bilingual ASL/English", "Total Communication", "Other"];
const PRIMARY_LANGUAGES = ["ASL", "English", "ASL/English Bilingual", "Other"];
const READING_LEVELS = ["Emergent (PreK-K)", "Early (1-2)", "Developing (3-5)", "Expanding (6-8)", "Academic (9-12)"];

export default function StudentForm({ student, onSubmit, onCancel }) {
  const [form, setForm] = useState(student || {
    studentInitials: "",
    gradeBand: "",
    primaryEligibility: "",
    serviceDeliveryModel: "",
    iepStartDate: "",
    iepAnnualReviewDate: "",
    notes: "",
    warmNotes: "",
    studentGoals: "",
    communicationModality: "",
    primaryLanguage: "",
    readingLevelBand: "",
    aslInstructionFocus: false,
  });
  const [piiWarnings, setPiiWarnings] = useState([]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === "notes" || field === "warmNotes" || field === "studentGoals" || field === "studentInitials") {
      setPiiWarnings(checkPII(value));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4 modal-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--modal-text)]">{student ? "Edit Student" : "Add Student"}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="text-[var(--modal-text)] hover:text-[var(--modal-text-muted)]">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {piiWarnings.length > 0 && <PIIWarning warnings={piiWarnings} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-x-hidden">
        <div className="space-y-2">
            <Label className="text-[var(--modal-text)] font-semibold text-sm">Student Initials *</Label>
            <Input
              placeholder="Fi.La."
              value={form.studentInitials}
              onChange={(e) => {
                const val = e.target.value.slice(0, 6);
                updateField("studentInitials", val);
              }}
              maxLength={6}
              className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] placeholder:text-[var(--modal-text-muted)] font-medium"
              required
            />
            <p className="text-xs text-[var(--modal-text-muted)]">Format: Fi.La. — first and last initial only, no full names</p>
            </div>

        <div className="space-y-2">
          <Label className="text-[var(--modal-text)] font-semibold text-sm">Grade Band *</Label>
          <Select value={form.gradeBand} onValueChange={(v) => updateField("gradeBand", v)} required>
            <SelectTrigger className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium">
              <SelectValue placeholder="Select grade band" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_BANDS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--modal-text)] font-semibold text-sm">Service Delivery Model *</Label>
          <Select value={form.serviceDeliveryModel} onValueChange={(v) => updateField("serviceDeliveryModel", v)} required>
            <SelectTrigger className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--modal-text)] font-semibold text-sm">Primary Eligibility</Label>
          <Input
            value={form.primaryEligibility}
            onChange={(e) => updateField("primaryEligibility", e.target.value)}
            className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium"
            placeholder="e.g., DHH"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--modal-text)] font-semibold text-sm">School Code</Label>
          <Input
            placeholder="ELMW"
            value={form.schoolCode || ""}
            onChange={(e) => updateField("schoolCode", e.target.value.slice(0, 4).toUpperCase())}
            maxLength={4}
            className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] placeholder:text-[var(--modal-text-muted)] font-medium"
          />
          <p className="text-xs text-[var(--modal-text-muted)]">Up to 4 letters only — no full school or district names</p>
          </div>

          <div className="space-y-2">
          <Label className="text-[var(--modal-text)] font-semibold text-sm">IEP Start Date</Label>
          <Input
            type="date"
            value={form.iepStartDate}
            onChange={(e) => updateField("iepStartDate", e.target.value)}
            className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium"
          />
          </div>

          <div className="space-y-2">
          <Label className="text-[var(--modal-text)] font-semibold text-sm">IEP Annual Review Date</Label>
          <Input
            type="date"
            value={form.iepAnnualReviewDate}
            onChange={(e) => updateField("iepAnnualReviewDate", e.target.value)}
            className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium"
          />
          </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--modal-text)] font-semibold text-sm">Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] h-20 font-medium"
          placeholder="General notes (no PII)"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--modal-text)] font-semibold text-sm">Warm Notes</Label>
        <Textarea
          value={form.warmNotes}
          onChange={(e) => updateField("warmNotes", e.target.value)}
          className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] h-20 font-medium"
          placeholder="Interests, motivators, etc."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--modal-text)] font-semibold text-sm">Student Goals</Label>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-2">
          <p className="text-xs text-blue-900 font-semibold mb-1">⚠️ Privacy Reminder</p>
          <p className="text-xs text-blue-900 font-medium">Goals should contain NO identifiable student information. Use only student initials when needed.</p>
        </div>
        <Textarea
          value={form.studentGoals || ""}
          onChange={(e) => updateField("studentGoals", e.target.value)}
          className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] h-20 font-medium"
          placeholder="e.g., 'Will improve listening discrimination using auditory activities...'"
        />
      </div>

      {/* Communication & Language Profile */}
      <div className="border-t-2 border-[var(--modal-border)] pt-6 mt-6">
        <h3 className="text-base font-bold text-[var(--modal-text)] mb-4">Communication & Language Profile</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] font-semibold text-sm">Communication Modality</Label>
            <Select value={form.communicationModality || ""} onValueChange={(v) => updateField("communicationModality", v)}>
              <SelectTrigger className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium">
                <SelectValue placeholder="Select modality" />
              </SelectTrigger>
              <SelectContent>
                {COMMUNICATION_MODALITIES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] font-semibold text-sm">Primary Language</Label>
            <Select value={form.primaryLanguage || ""} onValueChange={(v) => updateField("primaryLanguage", v)}>
              <SelectTrigger className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] font-semibold text-sm">Reading Level Band</Label>
            <Select value={form.readingLevelBand || ""} onValueChange={(v) => updateField("readingLevelBand", v)}>
              <SelectTrigger className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {READING_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id="aslInstructionFocus"
              checked={form.aslInstructionFocus || false}
              onCheckedChange={(checked) => updateField("aslInstructionFocus", checked)}
              className="border-2 border-[var(--modal-border)]"
            />
            <Label htmlFor="aslInstructionFocus" className="text-[var(--modal-text)] font-medium cursor-pointer">
              ASL Instruction Focus
            </Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t-2 border-[var(--modal-border)] mt-6">
        <Button type="button" variant="outline" onClick={onCancel} className="border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-semibold hover:bg-gray-100">
          Cancel
        </Button>
        <Button type="submit" className="bg-[#400070] hover:bg-[#5B00A0] text-white font-semibold">
          {student ? "Save Changes" : "Add Student"}
        </Button>
      </div>
    </form>
  );
}