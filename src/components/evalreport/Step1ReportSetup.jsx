import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

const REPORT_TYPES = ["Initial Evaluation", "Triennial Evaluation", "Annual Update", "Supplemental Report"];
const COMM_MODES = ["Spoken English", "ASL", "Spoken English + ASL", "Total Communication", "Other"];
const GRADE_LEVELS = ["PK", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Transition", "Adult"];
const PRONOUN_OPTIONS = ["she/her", "he/him", "they/them", "custom"];

function detectPII(text) {
  if (!text) return null;
  if (text.length > 8) return "This field should contain initials only (2–6 characters).";
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text)) return "Do not enter a date of birth.";
  if (/\s/.test(text.trim()) && text.trim().split(" ").length > 1) return "Initials only — no full names.";
  return null;
}

export default function Step1ReportSetup({ data, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });
  const piiWarning = detectPII(data.studentInitials);

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--modal-text)] mb-1">Step 1: Report Setup</h2>
      <p className="text-sm text-[var(--modal-text-muted)] mb-6">Enter basic report information. Student initials only — no full names.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Student Initials */}
        <div className="space-y-2">
          <Label>Student Initials <span className="text-red-500">*</span></Label>
          <Input
            value={data.studentInitials || ""}
            onChange={e => set("studentInitials", e.target.value.slice(0, 8))}
            placeholder="Fi.La."
            maxLength={8}
            className="border-[var(--modal-border)] font-medium"
          />
          {piiWarning && (
            <div className="flex items-center gap-1.5 text-amber-600 text-xs">
              <AlertTriangle className="w-3 h-3" /> {piiWarning}
            </div>
          )}
          <p className="text-xs text-[var(--modal-text-muted)]">Format: Fi.La. — first and last initials only</p>
        </div>

        {/* Report Type */}
        <div className="space-y-2">
          <Label>Report Type <span className="text-red-500">*</span></Label>
          <Select value={data.reportType || ""} onValueChange={v => set("reportType", v)}>
            <SelectTrigger className="border-[var(--modal-border)]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Evaluator Name */}
        <div className="space-y-2">
          <Label>Evaluator Name <span className="text-red-500">*</span></Label>
          <Input value={data.evaluatorName || ""} onChange={e => set("evaluatorName", e.target.value)}
            placeholder="Your name" className="border-[var(--modal-border)]" />
          {data.evaluatorName && /\b([A-Z][a-z]{1,}\.?\s){2,}/.test(data.evaluatorName) && (
            <div className="flex items-center gap-1.5 text-amber-600 text-xs">
              <AlertTriangle className="w-3 h-3" /> Make sure this is the evaluator's name, not a student name.
            </div>
          )}
        </div>

        {/* Report Date */}
        <div className="space-y-2">
          <Label>Report Date <span className="text-red-500">*</span></Label>
          <Input type="date" value={data.reportDate || ""} onChange={e => set("reportDate", e.target.value)}
            className="border-[var(--modal-border)]" />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>Evaluation Start Date</Label>
          <Input type="date" value={data.evaluationStartDate || ""} onChange={e => set("evaluationStartDate", e.target.value)}
            className="border-[var(--modal-border)]" />
        </div>

        {/* Completion Date */}
        <div className="space-y-2">
          <Label>Evaluation Completion Date</Label>
          <Input type="date" value={data.evaluationCompletionDate || ""} onChange={e => set("evaluationCompletionDate", e.target.value)}
            className="border-[var(--modal-border)]" />
        </div>

        {/* Communication Mode */}
        <div className="space-y-2">
          <Label>Communication Mode</Label>
          <Select value={data.communicationMode || ""} onValueChange={v => set("communicationMode", v)}>
            <SelectTrigger className="border-[var(--modal-border)]">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              {COMM_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Pronouns */}
        <div className="space-y-2">
          <Label>Pronouns</Label>
          <Select value={data.pronouns || ""} onValueChange={v => set("pronouns", v)}>
            <SelectTrigger className="border-[var(--modal-border)]">
              <SelectValue placeholder="Select pronouns" />
            </SelectTrigger>
            <SelectContent>
              {PRONOUN_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {data.pronouns === "custom" && (
            <Input value={data.customPronouns || ""} onChange={e => set("customPronouns", e.target.value)}
              placeholder="Enter pronouns..." className="border-[var(--modal-border)] mt-2" />
          )}
        </div>

        {/* Grade Level */}
        <div className="space-y-2">
          <Label>Grade Level</Label>
          <Select value={data.gradeLevel || ""} onValueChange={v => set("gradeLevel", v)}>
            <SelectTrigger className="border-[var(--modal-border)]">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Home Language */}
        <div className="space-y-2">
          <Label>Home Language</Label>
          <Input value={data.homeLanguage || ""} onChange={e => set("homeLanguage", e.target.value)}
            placeholder="e.g., English, Spanish, ASL" className="border-[var(--modal-border)]" />
        </div>
      </div>

      {/* General Notes */}
      <div className="space-y-2 mt-4">
        <Label>General Notes <span className="text-xs font-normal text-[var(--modal-text-muted)]">(no identifying information)</span></Label>
        <Textarea value={data.generalNotes || ""} onChange={e => set("generalNotes", e.target.value)}
          rows={3} placeholder="Optional background context..." className="border-[var(--modal-border)]" />
      </div>
    </div>
  );
}