import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Sparkles, Loader2 } from "lucide-react";

const FOCUS_OPTIONS = ["Auditory Skills", "Language", "Self-Advocacy", "Access/Accommodations", "Academic Support", "Other"];
const SUPPORTS_OPTIONS = ["Visual supports", "Repetition", "Pre-teaching vocabulary", "Reduced background noise", "Preferential seating", "HAT system", "Captions", "Check for understanding", "Other"];
const SETTING_OPTIONS = ["1:1 quiet", "Small group", "Gen ed classroom", "Background noise present", "Distance listening", "Other"];
const DATA_TYPES = ["Accuracy %", "Trials", "Rubric 1–4", "Frequency count", "Duration", "Observation only"];
const RESPONSE_OPTIONS = ["Improved with cues", "Met target", "Partial progress", "Needs reteach", "Fatigue/attention impacted", "Equipment impacted access", "Other"];

function ChipGroup({ label, options, selected, onChange, multi = true }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--modal-text)]">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => {
              if (multi) {
                onChange(selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt]);
              } else {
                onChange(selected === opt ? "" : opt);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selected.includes?.(opt) || selected === opt
                ? "bg-[#400070] text-white"
                : "bg-white/5 border border-[var(--modal-border)] text-[var(--modal-text)] hover:border-[#400070]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SessionNotesForm({ studentGoals = [] }) {
  const [focus, setFocus] = useState([]);
  const [skillsTargeted, setSkillsTargeted] = useState("");
  const [supports, setSupports] = useState([]);
  const [setting, setSetting] = useState([]);
  const [dataType, setDataType] = useState("");
  const [dataResult, setDataResult] = useState("");
  const [response, setResponse] = useState([]);
  const [nextStep, setNextStep] = useState("");
  const [linkedGoals, setLinkedGoals] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerateNote = async () => {
    setLoading(true);
    try {
      const linkedGoalTitles = studentGoals
        .filter(g => linkedGoals.includes(g.id))
        .map(g => g.goalText || g.title)
        .slice(0, 2);

      const payload = {
        focus: focus.join(", "),
        skillsTargeted,
        supports: supports.join(", "),
        setting: setting.join(", "),
        dataType,
        dataResult,
        response: response.join(", "),
        nextStep,
        linkedGoals: linkedGoalTitles.join("; "),
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate an ORIGINAL short session note draft for an itinerant TODHH session. Do not include any identifying information. Do not include names, initials, schools, staff, dates, or unique personal details. Use "the student" or "XX". Write 2–4 sentences. Professional tone. Include supports and measurable data if provided. Return ONLY the note text.

Input data:
- Focus: ${payload.focus || "not specified"}
- Skills: ${payload.skillsTargeted || "not specified"}
- Supports: ${payload.supports || "not specified"}
- Setting: ${payload.setting || "not specified"}
- Data Type: ${payload.dataType}
- Data Result: ${payload.dataResult || "not specified"}
- Response/Outcome: ${payload.response || "not specified"}
- Next Step: ${payload.nextStep || "not specified"}
- Linked Goals: ${payload.linkedGoals || "none"}`,
      });

      setNotes(result || "");
    } catch (error) {
      console.error("Error generating note:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[var(--modal-text)] mb-4">Session Notes</h3>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            <strong>Reminder:</strong> Do NOT include identifying student information in notes. No names, initials, schools, dates of birth, or IEP numbers.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <ChipGroup label="Focus of Session" options={FOCUS_OPTIONS} selected={focus} onChange={setFocus} />

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--modal-text)]">Skills Targeted</label>
          <Input
            value={skillsTargeted}
            onChange={(e) => setSkillsTargeted(e.target.value)}
            placeholder="e.g., 2-step directions in quiet setting"
            className="bg-white/5 border-[var(--modal-border)] text-white"
          />
        </div>

        <ChipGroup label="Supports Used" options={SUPPORTS_OPTIONS} selected={supports} onChange={setSupports} />

        <ChipGroup label="Setting" options={SETTING_OPTIONS} selected={setting} onChange={setSetting} />

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--modal-text)]">Data Type</label>
          <Select value={dataType} onValueChange={setDataType}>
            <SelectTrigger className="bg-white/5 border-[var(--modal-border)] text-white">
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              {DATA_TYPES.map(dt => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--modal-text)]">Data Result</label>
          <Input
            value={dataResult}
            onChange={(e) => setDataResult(e.target.value)}
            placeholder="e.g., 80% accuracy, 7/10 trials correct"
            className="bg-white/5 border-[var(--modal-border)] text-white"
          />
        </div>

        <ChipGroup label="Response/Outcome" options={RESPONSE_OPTIONS} selected={response} onChange={setResponse} />

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--modal-text)]">Next Step</label>
          <Input
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder="One sentence describing the next step"
            className="bg-white/5 border-[var(--modal-border)] text-white"
          />
        </div>

        {studentGoals.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--modal-text)]">Link to Goals (optional)</label>
            <Select value={linkedGoals[0] || ""} onValueChange={(v) => setLinkedGoals(v ? [v] : [])}>
              <SelectTrigger className="bg-white/5 border-[var(--modal-border)] text-white">
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {studentGoals.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.goalText || g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--modal-text)]">Session Summary</label>
            <Button
              onClick={handleGenerateNote}
              disabled={loading || (!focus.length && !skillsTargeted)}
              className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Short Note
                </>
              )}
            </Button>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="AI-generated or manual session summary..."
            className="bg-white/5 border-[var(--modal-border)] text-white h-24"
          />
        </div>
      </div>
    </div>
  );
}