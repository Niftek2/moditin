import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const QUALITATIVE_OPTIONS = ["Emerging", "Developing", "Mastering"];

export default function LogProgressModal({ studentGoalId, studentId, goalText, onClose }) {
  const queryClient = useQueryClient();
  const [progressType, setProgressType] = useState("percentage");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [percentageValue, setPercentageValue] = useState("");
  const [numericalScore, setNumericalScore] = useState("");
  const [numericalMaxScore, setNumericalMaxScore] = useState("");
  const [qualitativeStatus, setQualitativeStatus] = useState("Developing");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!date) { setError("Please select a date."); return; }
    if (progressType === "percentage" && (percentageValue === "" || isNaN(percentageValue))) {
      setError("Please enter a valid percentage."); return;
    }
    if (progressType === "numerical_score" && (!numericalScore || !numericalMaxScore)) {
      setError("Please enter both score and max score."); return;
    }

    setSaving(true);
    try {
      const entry = { studentGoalId, studentId, date, progressType, notes };
      if (progressType === "percentage") entry.percentageValue = parseFloat(percentageValue);
      if (progressType === "numerical_score") {
        entry.numericalScore = parseFloat(numericalScore);
        entry.numericalMaxScore = parseFloat(numericalMaxScore);
      }
      if (progressType === "qualitative_status") entry.qualitativeStatus = qualitativeStatus;

      await base44.entities.GoalProgressEntry.create(entry);
      queryClient.invalidateQueries({ queryKey: ["goalProgress", studentGoalId] });
      onClose();
    } catch (e) {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="log-progress-title">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--modal-border)]">
          <h2 id="log-progress-title" className="font-bold text-[var(--modal-text)]">Log Progress Check-In</h2>
          <button onClick={onClose} aria-label="Close"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          {goalText && (
            <p className="text-xs text-[var(--modal-text-muted)] bg-[#F7F3FA] rounded-xl p-3 line-clamp-2">{goalText}</p>
          )}

          <div>
            <label className="text-xs font-semibold text-[var(--modal-text)] mb-1.5 block">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--modal-text)] mb-1.5 block">Progress Type</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "percentage", label: "Percentage" },
                { value: "numerical_score", label: "Score" },
                { value: "qualitative_status", label: "Status" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setProgressType(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    progressType === opt.value
                      ? "bg-[#400070] text-white border-[#400070]"
                      : "bg-white text-[var(--modal-text)] border-[var(--modal-border)] hover:border-[#6B2FB9]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {progressType === "percentage" && (
            <div>
              <label className="text-xs font-semibold text-[var(--modal-text)] mb-1.5 block">Percentage (0–100)</label>
              <Input
                type="number" min="0" max="100"
                placeholder="e.g. 75"
                value={percentageValue}
                onChange={e => setPercentageValue(e.target.value)}
              />
            </div>
          )}

          {progressType === "numerical_score" && (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-semibold text-[var(--modal-text)] mb-1.5 block">Score</label>
                <Input type="number" min="0" placeholder="e.g. 4" value={numericalScore} onChange={e => setNumericalScore(e.target.value)} />
              </div>
              <span className="text-[var(--modal-text-muted)] pb-2">out of</span>
              <div className="flex-1">
                <label className="text-xs font-semibold text-[var(--modal-text)] mb-1.5 block">Max Score</label>
                <Input type="number" min="1" placeholder="e.g. 5" value={numericalMaxScore} onChange={e => setNumericalMaxScore(e.target.value)} />
              </div>
            </div>
          )}

          {progressType === "qualitative_status" && (
            <div>
              <label className="text-xs font-semibold text-[var(--modal-text)] mb-1.5 block">Status</label>
              <div className="flex gap-2">
                {QUALITATIVE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setQualitativeStatus(opt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                      qualitativeStatus === opt
                        ? "bg-[#400070] text-white border-[#400070]"
                        : "bg-white text-[var(--modal-text)] border-[var(--modal-border)] hover:border-[#6B2FB9]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[var(--modal-text)] mb-1.5 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any observations or context..."
              rows={2}
              className="w-full rounded-xl border border-[var(--modal-border)] px-3 py-2 text-sm text-[var(--modal-text)] resize-none focus:outline-none focus:ring-1 focus:ring-[#6B2FB9]"
            />
          </div>

          {error && <p className="text-red-600 text-xs" role="alert">{error}</p>}

          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-11">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Check-In"}
          </Button>
        </div>
      </div>
    </div>
  );
}