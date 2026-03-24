import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2 } from "lucide-react";
import AIDisclaimer from "../shared/AIDisclaimer";

const COMM_FOCUS_OPTIONS = [
  { value: "LSL", label: "Listening & Spoken Language (LSL)" },
  { value: "Spoken Language", label: "Spoken Language" },
  { value: "ASL", label: "ASL" },
  { value: "ASL/English Bilingual", label: "ASL/English Bilingual" },
  { value: "Total Communication", label: "Total Communication" },
  { value: "Visual Supports", label: "Visual Supports" },
  { value: "Auditory Training", label: "Auditory Training" },
];

export default function PlanSetupForm({
  students, studentGoals, goalMap, studentId, setStudentId,
  goalId, setGoalId, serviceModel, setServiceModel,
  sessionLength, setSessionLength, communicationFocus, setCommunicationFocus,
  hearingTech, setHearingTech, sessionDate, setSessionDate,
  onGenerate, loading, canGenerate,
}) {
  const toggleFocus = (val) => {
    setCommunicationFocus(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  return (
    <div className="modal-card p-5 space-y-4">
      <h3 className="font-semibold text-[var(--modal-text)] text-sm">Session Setup</h3>

      <div className="space-y-2">
        <Label className="text-[var(--modal-text-muted)]">Student</Label>
        <Select value={studentId} onValueChange={(v) => { setStudentId(v); setGoalId(""); }}>
          <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]">
            <SelectValue placeholder="Select student" />
          </SelectTrigger>
          <SelectContent>
            {students.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.studentInitials} ({s.gradeBand})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {studentId && (
        <div className="space-y-2">
          <Label className="text-[var(--modal-text-muted)]">Goal</Label>
          <Select value={goalId} onValueChange={setGoalId}>
            <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]">
              <SelectValue placeholder="Select goal" />
            </SelectTrigger>
            <SelectContent>
              {studentGoals.filter(sg => sg.status === "Active").map(sg => (
                <SelectItem key={sg.id} value={sg.id}>
                  {goalMap[sg.goalId]?.annualGoal?.slice(0, 60) || "Goal"}…
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-[var(--modal-text-muted)]">Session Date</Label>
        <Input
          type="date"
          value={sessionDate}
          onChange={e => setSessionDate(e.target.value)}
          className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--modal-text-muted)]">Service Model</Label>
        <Select value={serviceModel} onValueChange={setServiceModel}>
          <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="InPerson">In Person</SelectItem>
            <SelectItem value="Telepractice">Telepractice</SelectItem>
            <SelectItem value="Hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--modal-text-muted)]">Session Length (min)</Label>
        <Input
          type="number"
          value={sessionLength}
          onChange={e => setSessionLength(e.target.value)}
          className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--modal-text-muted)]">Communication Focus</Label>
        <div className="space-y-2 mt-1">
          {COMM_FOCUS_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`cf-${opt.value}`}
                checked={communicationFocus.includes(opt.value)}
                onCheckedChange={() => toggleFocus(opt.value)}
              />
              <label htmlFor={`cf-${opt.value}`} className="text-xs text-[var(--modal-text)] cursor-pointer">{opt.label}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--modal-text-muted)]">Hearing Tech Considerations</Label>
        <Input
          value={hearingTech}
          onChange={e => setHearingTech(e.target.value)}
          placeholder="e.g. Check HA batteries, FM system on"
          className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"
        />
      </div>

      <Button
        onClick={onGenerate}
        disabled={!canGenerate || loading}
        className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Generate Plan
      </Button>
      <AIDisclaimer compact />
    </div>
  );
}