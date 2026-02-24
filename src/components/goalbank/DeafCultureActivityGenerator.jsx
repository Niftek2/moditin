import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import AIDisclaimer from "@/components/shared/AIDisclaimer";
import { useSubscription } from "@/components/shared/SubscriptionGate";

const ACTIVITY_TYPES = [
  "Community History",
  "Identity Reflection",
  "Deaf Professionals",
  "Accessibility Audit",
  "Self-Advocacy Scenarios",
  "Communication Analysis",
];

const GRADE_BANDS = ["PK", "K–2", "3–5", "6–8", "9–12"];
const READING_LEVELS = ["Emergent", "Early", "Developing", "Expanding", "Academic"];

export default function DeafCultureActivityGenerator({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [opts, setOpts] = useState({
    gradeBand: "3–5",
    activityType: "",
    readingLevel: "Developing",
  });

  const handleGenerate = async () => {
    if (!opts.activityType) return;
    setLoading(true);
    setResult(null);

    const res = await base44.functions.invoke("generateDeafCultureActivity", {
      gradeBand: opts.gradeBand,
      activityType: opts.activityType,
      readingLevel: opts.readingLevel,
    });

    setResult(res.data.activity);
    setLoading(false);
  };

  const handleCopy = () => {
    const text = [
      `ACTIVITY: ${result.title}`,
      `\nOBJECTIVE:\n${result.objective}`,
      `\nMATERIALS:\n${result.materials.join("\n")}`,
      `\nPROCEDURE:\n${result.procedure.map((p, i) => `${i + 1}. ${p}`).join("\n")}`,
      `\nREFLECTION QUESTIONS:\n${result.reflectionQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
      `\nSUGGESTED DURATION: ${result.suggestedDuration}`,
      `\nNOTES:\n${result.notes}`,
    ]
      .filter(Boolean)
      .join("");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--modal-card)] border-[var(--modal-border)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deaf Culture & Identity Activity Generator</DialogTitle>
          <DialogDescription className="text-[var(--modal-text-muted)]">
            Generate text-based activities affirming Deaf culture, identity, and self-advocacy.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase">
                  Grade Band
                </label>
                <Select
                  value={opts.gradeBand}
                  onValueChange={(v) => setOpts((p) => ({ ...p, gradeBand: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_BANDS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase">
                  Activity Type *
                </label>
                <Select
                  value={opts.activityType}
                  onValueChange={(v) => setOpts((p) => ({ ...p, activityType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--modal-text-muted)] uppercase">
                  Reading Level
                </label>
                <Select
                  value={opts.readingLevel}
                  onValueChange={(v) => setOpts((p) => ({ ...p, readingLevel: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {READING_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AIDisclaimer />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!opts.activityType || loading}
                className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Generate Activity
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 text-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            <div className="bg-white border border-[var(--modal-border)] rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-bold text-[var(--modal-text)]">{result.title}</p>
                <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">Grade Band: {result.gradeBandTarget}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] font-semibold mb-1">
                  Objective
                </p>
                <p className="text-sm text-[var(--modal-text)]">{result.objective}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] font-semibold mb-1">
                  Materials
                </p>
                <ul className="text-sm text-[var(--modal-text)] space-y-1">
                  {result.materials.map((m, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[var(--modal-text-muted)]">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] font-semibold mb-1">
                  Procedure
                </p>
                <ol className="text-sm text-[var(--modal-text)] space-y-1">
                  {result.procedure.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[var(--modal-text-muted)] shrink-0 font-semibold">{i + 1}.</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] font-semibold mb-1">
                  Reflection Questions
                </p>
                <ol className="text-sm text-[var(--modal-text)] space-y-1">
                  {result.reflectionQuestions.map((q, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[var(--modal-text-muted)] shrink-0 font-semibold">{i + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] font-semibold mb-1">
                  Suggested Duration
                </p>
                <p className="text-sm text-[var(--modal-text)]">{result.suggestedDuration}</p>
              </div>

              {result.notes && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--modal-text-muted)] font-semibold mb-1">
                    Notes
                  </p>
                  <p className="text-xs text-[var(--modal-text-muted)] italic">{result.notes}</p>
                </div>
              )}

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  This activity is generated as a template. Customize all placeholders and review for alignment with your curriculum and student needs before use.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setResult(null)}>
                ← Generate Another
              </Button>
              <Button onClick={onClose} className="bg-[#400070] hover:bg-[#5B00A0] text-white">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}