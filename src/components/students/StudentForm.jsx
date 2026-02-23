import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import PIIWarning, { checkPII } from "../shared/PIIGuard";

const GRADE_BANDS = ["PK", "K", "1-2", "3-5", "6-8", "9-12"];
const SERVICE_MODELS = ["InPerson", "Telepractice", "Hybrid"];

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
  });
  const [piiWarnings, setPiiWarnings] = useState([]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === "notes" || field === "warmNotes" || field === "studentInitials") {
      setPiiWarnings(checkPII(value));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-white">{student ? "Edit Student" : "Add Student"}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="text-[var(--modal-text-muted)] hover:text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {piiWarnings.length > 0 && <PIIWarning warnings={piiWarnings} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[var(--modal-text-muted)]">Student Initials *</Label>
          <Input
            placeholder="Fi.La."
            value={form.studentInitials}
            onChange={(e) => {
              const val = e.target.value.slice(0, 6);
              updateField("studentInitials", val);
            }}
            maxLength={6}
            className="bg-white/5 border-[var(--modal-border)] text-white placeholder:text-[var(--modal-text-muted)]/50"
            required
          />
          <p className="text-[10px] text-[var(--modal-text-muted)]">Format: Fi.La. — first and last initial only, no full names</p>
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--modal-text-muted)]">Grade Band *</Label>
          <Select value={form.gradeBand} onValueChange={(v) => updateField("gradeBand", v)} required>
            <SelectTrigger className="bg-white/5 border-[var(--modal-border)] text-white">
              <SelectValue placeholder="Select grade band" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_BANDS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--modal-text-muted)]">Service Delivery Model *</Label>
          <Select value={form.serviceDeliveryModel} onValueChange={(v) => updateField("serviceDeliveryModel", v)} required>
            <SelectTrigger className="bg-white/5 border-[var(--modal-border)] text-white">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--modal-text-muted)]">Primary Eligibility</Label>
          <Input
            value={form.primaryEligibility}
            onChange={(e) => updateField("primaryEligibility", e.target.value)}
            className="bg-white/5 border-[var(--modal-border)] text-white"
            placeholder="e.g., DHH"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--modal-text-muted)]">School Code</Label>
          <Input
            placeholder="ELMW"
            value={form.schoolCode || ""}
            onChange={(e) => updateField("schoolCode", e.target.value.slice(0, 4).toUpperCase())}
            maxLength={4}
            className="bg-white/5 border-[var(--modal-border)] text-white placeholder:text-[var(--modal-text-muted)]/50"
          />
          <p className="text-[10px] text-[var(--modal-text-muted)]">Up to 4 letters only — no full school or district names</p>
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--modal-text-muted)]">IEP Start Date</Label>
          <Input
            type="date"
            value={form.iepStartDate}
            onChange={(e) => updateField("iepStartDate", e.target.value)}
            className="bg-white/5 border-[var(--modal-border)] text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[var(--modal-text-muted)]">IEP Annual Review Date</Label>
          <Input
            type="date"
            value={form.iepAnnualReviewDate}
            onChange={(e) => updateField("iepAnnualReviewDate", e.target.value)}
            className="bg-white/5 border-[var(--modal-border)] text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--modal-text-muted)]">Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          className="bg-white/5 border-[var(--modal-border)] text-white h-20"
          placeholder="General notes (no PII)"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--modal-text-muted)]">Warm Notes</Label>
        <Textarea
          value={form.warmNotes}
          onChange={(e) => updateField("warmNotes", e.target.value)}
          className="bg-white/5 border-[var(--modal-border)] text-white h-20"
          placeholder="Interests, motivators, etc."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="border-[var(--modal-border)] text-[var(--modal-text-muted)] hover:text-white">
          Cancel
        </Button>
        <Button type="submit" className="bg-[#400070] hover:bg-[#5B00A0] text-white">
          {student ? "Save Changes" : "Add Student"}
        </Button>
      </div>
    </form>
  );
}