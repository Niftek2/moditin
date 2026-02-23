import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Loader2, Copy, Check, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import AIDisclaimer from "@/components/shared/AIDisclaimer";

const DOMAINS = ["Auditory Skills", "Language Skills", "Self-Advocacy Skills"];
const TOPICS = {
  "Auditory Skills": [
    "Auditory Awareness / Localization",
    "Sound Discrimination & Identification",
    "Phonological Awareness",
    "Auditory Memory / Critical Elements",
    "Auditory Comprehension",
    "Listening in Background Noise",
  ],
  "Language Skills": [
    "Vocabulary Strategies",
    "Figurative Language & Idioms",
    "Expressive / Receptive Vocabulary",
    "Syntax & Sentence Complexity",
    "Literacy Comprehension",
  ],
  "Self-Advocacy Skills": [
    "Equipment Knowledge & Use",
    "Identifying & Reporting Device Problems",
    "Understanding Own Hearing Loss",
    "Compensatory Strategies",
    "Accommodation Knowledge",
    "Self-Esteem & Hearing Identity",
  ],
};
const GRADE_BANDS = ["PK", "K–2", "3–5", "6–8", "9–12"];
const SETTINGS = [
  "Quiet 1:1 setting",
  "Small group (2–4 students)",
  "General education classroom",
  "Noisy/reverberant environment",
];
const SKILL_LEVELS = ["Emerging", "Developing", "Proficient"];
const DEVICES = ["Hearing Aids", "Cochlear Implant", "BAHA", "None", "Unknown"];
const CRITERION_STYLES = [
  { value: "A", label: "80% accuracy in 4 of 5 trials" },
  { value: "B", label: "80% accuracy across 3 consecutive data points" },
];
const HAT_OPTIONS = ["Yes", "No", "Unknown"];

function buildPrompt(opts) {
  return `You are an expert Teacher of the Deaf and Hard of Hearing (TODHH) writing original, professional IEP goals. 
Generate ORIGINAL goals — do NOT copy from any goal bank or published resource. Never reproduce copyrighted text.

USER INPUTS:
- Domain: ${opts.domain}
- Topic: ${opts.topic}
- Grade Band: ${opts.grade}
- Setting: ${opts.setting}
- Current Skill Level: ${opts.skillLevel}
- Hearing Device: ${opts.device}
- HAT Use: ${opts.hat}
- Criterion Style: ${opts.criterionStyle === "B" ? "80% accuracy across 3 consecutive data points" : "80% accuracy in 4 of 5 trials"}
- Communication approach: Listening and Spoken Language (LSL) unless otherwise noted
- Free-form notes from educator: ${opts.freeText || "None"}

OUTPUT REQUIREMENTS:
Return a JSON object with exactly these fields:
{
  "domain": string,
  "topic": string,
  "goalOption1": {
    "annualGoal": string,   // full measurable goal sentence
    "objectives": [string], // 3-6 scaffolded short-term objectives
    "measurementNotes": string,
    "standardsAlignment": [string]  // 0-3 Common Core codes, empty array if grade unknown
  },
  "goalOption2": {
    "annualGoal": string,
    "objectives": [string],
    "measurementNotes": string,
    "standardsAlignment": [string]
  }
}

RULES FOR EVERY GOAL:
1. Use placeholder "XX" for student name.
2. Use "[he/she/they]" for pronouns.
3. Use "#" for numbers/percentages where appropriate.
4. Each annual goal MUST include: setting/condition, observable skill, support level, criterion, timeframe ("by the end of the annual IEP period").
5. Structure: "In [setting], XX will [observable skill] [support level] with [criterion] across [timeframe]."
6. Objectives: scaffolded easier → harder, each starting with "XX will…"
7. Reflect TODHH realities: distance, noise, HAT, repair strategies, classroom participation.
8. Generate 2 goal options at different difficulty levels.
9. Goals must be appropriate for mainstream settings with LSL approach.
10. Measurement notes should be 1-2 sentences describing data collection method.
11. At the end of measurementNotes for option 1, append: "Generated goal is original and intended as a starting template. Edit to match district requirements."

Do NOT include any copyrighted text, goal bank names, or external source references.`;
}

function highlightPlaceholders(text) {
  if (!text) return text;
  return text
    .replace(/\bXX\b/g, '<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5">XX</mark>')
    .replace(/\[he\/she\/they\]/g, '<mark class="bg-blue-100 text-blue-800 rounded px-0.5">[he/she/they]</mark>')
    .replace(/#(?=\s|$|%)/g, '<mark class="bg-green-100 text-green-800 rounded px-0.5">#</mark>');
}

function GoalOutput({ goal, highlight }) {
  const [copied, setCopied] = useState(false);

  const fullText = [
    `ANNUAL GOAL:\n${goal.annualGoal}`,
    `\nSHORT-TERM OBJECTIVES:\n${goal.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}`,
    `\nMEASUREMENT / DATA NOTES:\n${goal.measurementNotes}`,
    goal.standardsAlignment?.length
      ? `\nSTANDARDS ALIGNMENT:\n${goal.standardsAlignment.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[var(--modal-border)] rounded-xl p-4 space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 text-xs">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] mb-1 font-semibold">Annual Goal</p>
        {highlight ? (
          <p
            className="text-sm text-[var(--modal-text)] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightPlaceholders(goal.annualGoal) }}
          />
        ) : (
          <p className="text-sm text-[var(--modal-text)] leading-relaxed">{goal.annualGoal}</p>
        )}
      </div>

      {goal.objectives?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] mb-1 font-semibold">Short-Term Objectives</p>
          <ol className="space-y-1">
            {goal.objectives.map((obj, i) => (
              <li key={i} className="text-sm text-[var(--modal-text)] flex gap-2">
                <span className="text-[var(--modal-purple-glow)] font-semibold shrink-0">{i + 1}.</span>
                {highlight ? (
                  <span dangerouslySetInnerHTML={{ __html: highlightPlaceholders(obj) }} />
                ) : (
                  <span>{obj}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {goal.measurementNotes && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] mb-1 font-semibold">Measurement / Data Notes</p>
          <p className="text-xs text-[var(--modal-text-muted)] leading-relaxed italic">{goal.measurementNotes}</p>
        </div>
      )}

      {goal.standardsAlignment?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] mb-1 font-semibold">Standards Alignment</p>
          <p className="text-xs text-[var(--modal-text-muted)]">{goal.standardsAlignment.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}

export default function AIGoalCreator({ open, onClose, onSave }) {
  const [step, setStep] = useState("form"); // "form" | "results"
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [highlight, setHighlight] = useState(false);
  const [expandAdvanced, setExpandAdvanced] = useState(false);

  const [opts, setOpts] = useState({
    domain: "",
    topic: "",
    grade: "3–5",
    setting: "General education classroom",
    skillLevel: "Developing",
    device: "Unknown",
    hat: "Unknown",
    criterionStyle: "A",
    freeText: "",
  });

  const set = (key, val) => setOpts((p) => ({ ...p, [key]: val, ...(key === "domain" ? { topic: "" } : {}) }));

  const handleGenerate = async () => {
    setLoading(true);
    setStep("results");
    const schema = {
      type: "object",
      properties: {
        domain: { type: "string" },
        topic: { type: "string" },
        goalOption1: {
          type: "object",
          properties: {
            annualGoal: { type: "string" },
            objectives: { type: "array", items: { type: "string" } },
            measurementNotes: { type: "string" },
            standardsAlignment: { type: "array", items: { type: "string" } },
          },
        },
        goalOption2: {
          type: "object",
          properties: {
            annualGoal: { type: "string" },
            objectives: { type: "array", items: { type: "string" } },
            measurementNotes: { type: "string" },
            standardsAlignment: { type: "array", items: { type: "string" } },
          },
        },
      },
    };
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(opts),
      response_json_schema: schema,
    });
    setResult(res);
    setLoading(false);
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setResult(null);
    const schema = {
      type: "object",
      properties: {
        domain: { type: "string" },
        topic: { type: "string" },
        goalOption1: {
          type: "object",
          properties: {
            annualGoal: { type: "string" },
            objectives: { type: "array", items: { type: "string" } },
            measurementNotes: { type: "string" },
            standardsAlignment: { type: "array", items: { type: "string" } },
          },
        },
        goalOption2: {
          type: "object",
          properties: {
            annualGoal: { type: "string" },
            objectives: { type: "array", items: { type: "string" } },
            measurementNotes: { type: "string" },
            standardsAlignment: { type: "array", items: { type: "string" } },
          },
        },
      },
    };
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(opts) + "\n\nIMPORTANT: Generate DIFFERENT wording from previous output while targeting the same skill.",
      response_json_schema: schema,
    });
    setResult(res);
    setLoading(false);
  };

  const handleSaveGoal = async (goalData) => {
    if (onSave) {
      await onSave({
        domain: result?.domain || opts.domain,
        annualGoal: goalData.annualGoal,
        objectives: goalData.objectives,
        progressMonitoring: goalData.measurementNotes,
        gradeBand: opts.grade,
        baselineLevel: opts.skillLevel,
        isCustom: true,
      });
    }
  };

  const handleClose = () => {
    setStep("form");
    setResult(null);
    setLoading(false);
    onClose();
  };

  const topics = opts.domain ? TOPICS[opts.domain] || [] : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[var(--modal-card)] border-[var(--modal-border)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--modal-purple-glow)]" />
            AI Goal Creator
          </DialogTitle>
          <DialogDescription className="text-[var(--modal-text-muted)]">
            Generate original TODHH-style IEP goals. All output is original — not copied from any goal bank.
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4 mt-2">
            {/* Domain + Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase tracking-wide">Domain *</label>
                <Select value={opts.domain} onValueChange={(v) => set("domain", v)}>
                  <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase tracking-wide">Topic</label>
                <Select value={opts.topic} onValueChange={(v) => set("topic", v)} disabled={!opts.domain}>
                  <SelectTrigger><SelectValue placeholder={opts.domain ? "Select topic" : "Choose domain first"} /></SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grade + Setting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase tracking-wide">Grade Band</label>
                <Select value={opts.grade} onValueChange={(v) => set("grade", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADE_BANDS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase tracking-wide">Setting</label>
                <Select value={opts.setting} onValueChange={(v) => set("setting", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SETTINGS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced toggle */}
            <button
              onClick={() => setExpandAdvanced(!expandAdvanced)}
              className="flex items-center gap-1.5 text-xs text-[var(--modal-text-muted)] hover:text-[var(--modal-text)] transition-colors"
            >
              {expandAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Advanced options (device, HAT, skill level, criterion style)
            </button>

            {expandAdvanced && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--modal-card-hover)] rounded-xl p-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase tracking-wide">Skill Level</label>
                  <Select value={opts.skillLevel} onValueChange={(v) => set("skillLevel", v)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase tracking-wide">Device</label>
                  <Select value={opts.device} onValueChange={(v) => set("device", v)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEVICES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase tracking-wide">HAT Use</label>
                  <Select value={opts.hat} onValueChange={(v) => set("hat", v)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HAT_OPTIONS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase tracking-wide">Criterion</label>
                  <Select value={opts.criterionStyle} onValueChange={(v) => set("criterionStyle", v)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CRITERION_STYLES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Free text */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase tracking-wide">Additional notes (optional)</label>
              <textarea
                value={opts.freeText}
                onChange={(e) => set("freeText", e.target.value)}
                placeholder="e.g., Student uses bilateral hearing aids, struggles with multi-step directions in noisy gym..."
                className="w-full h-20 bg-white border border-[var(--modal-border)] rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#400070] text-[var(--modal-text)] placeholder:text-gray-400"
              />
            </div>

            <AIDisclaimer />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleGenerate}
                disabled={!opts.domain}
                className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2"
              >
                <Sparkles className="w-4 h-4" /> Generate Goals
              </Button>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4 mt-2">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs text-[var(--modal-text-muted)]">
                  Domain: <strong>{opts.domain}</strong>{opts.topic ? ` · ${opts.topic}` : ""} · Grade: <strong>{opts.grade}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHighlight(!highlight)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${highlight ? "bg-yellow-100 border-yellow-300 text-yellow-800" : "border-[var(--modal-border)] text-[var(--modal-text-muted)] hover:bg-gray-50"}`}
                >
                  {highlight ? "✓ Placeholders highlighted" : "Highlight placeholders"}
                </button>
                <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={loading} className="gap-1.5 text-xs">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> More like this
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setStep("form")} className="text-xs">
                  ← Edit inputs
                </Button>
              </div>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#400070]" />
                <p className="text-sm text-[var(--modal-text-muted)]">Generating original goals…</p>
              </div>
            )}

            {!loading && result && (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--modal-text-muted)] mb-2">Option 1 — Standard</p>
                  <GoalOutput goal={result.goalOption1} highlight={highlight} />
                  {onSave && (
                    <Button size="sm" onClick={() => handleSaveGoal(result.goalOption1)} className="mt-2 bg-[#400070] hover:bg-[#5B00A0] text-white text-xs gap-1.5">
                      Save to Goal Bank
                    </Button>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--modal-text-muted)] mb-2">Option 2 — Higher Challenge</p>
                  <GoalOutput goal={result.goalOption2} highlight={highlight} />
                  {onSave && (
                    <Button size="sm" onClick={() => handleSaveGoal(result.goalOption2)} className="mt-2 bg-[#400070] hover:bg-[#5B00A0] text-white text-xs gap-1.5">
                      Save to Goal Bank
                    </Button>
                  )}
                </div>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Generated goals are original and intended as starting templates. Edit all placeholders (XX, #, [he/she/they]) and review for compliance with your district, school, and state regulations before use in any IEP.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}