import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Save, Link2 } from "lucide-react";
import { computeSummary, LING6_SOUNDS, SOUND_LABELS, soundStatusColor } from "./ling6Utils";
import PIIGuard from "../shared/PIIGuard";
import { checkPII } from "../shared/PIIGuard";

export default function Ling6SummaryScreen({ session, trials, onSave, onSaveAndLink, saving }) {
  const [notes, setNotes] = useState("");
  const piiHits = checkPII(notes);
  const summary = computeSummary(trials);

  const statusLabel = {
    Identified: "Identified",
    Detected: "Detected",
    NoResponse: "No Response",
    Incorrect: "Incorrect",
    NotTested: "Not Tested",
  };

  const statusBg = {
    Identified: "bg-green-100 text-green-800 border-green-300",
    Detected: "bg-yellow-100 text-yellow-800 border-yellow-300",
    NoResponse: "bg-gray-100 text-gray-600 border-gray-200",
    Incorrect: "bg-red-100 text-red-700 border-red-300",
    NotTested: "bg-white text-[var(--modal-text-muted)] border-[var(--modal-border)]",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--modal-text)]">Session Summary</h2>
        <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">Not diagnostic · For educational planning only</p>
      </div>

      {/* Telepractice banner */}
      {session.setting === "Telepractice" && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          Telepractice results depend on device audio and environment. Use professional judgment and follow your school/district procedures.
        </div>
      )}

      {/* Big numbers */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="modal-card p-5 text-center">
          <p className="text-4xl font-bold text-yellow-600">{summary.detectedPct}%</p>
          <p className="text-sm text-[var(--modal-text-muted)] mt-1">Detected</p>
          <p className="text-xs text-[var(--modal-text-muted)]">{summary.detected}/{summary.testedCount} sounds</p>
        </div>
        <div className="modal-card p-5 text-center">
          <p className="text-4xl font-bold text-green-600">{summary.identifiedPct}%</p>
          <p className="text-sm text-[var(--modal-text-muted)] mt-1">Identified</p>
          <p className="text-xs text-[var(--modal-text-muted)]">{summary.identified}/{summary.testedCount} sounds</p>
        </div>
      </div>

      {/* Sound grid */}
      <div className="modal-card p-5 mb-4">
        <h3 className="text-sm font-bold text-[#400070] uppercase tracking-wider mb-3">By Sound</h3>
        <div className="grid grid-cols-3 gap-2">
          {LING6_SOUNDS.map((sound) => {
            const st = summary.bySound[sound]?.status || "NotTested";
            return (
              <div key={sound} className={`p-3 rounded-xl border text-center ${statusBg[st]}`}>
                <p className="font-bold text-base">{SOUND_LABELS[sound]}</p>
                <p className="text-xs mt-0.5">{statusLabel[st]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session details */}
      <div className="modal-card p-5 mb-4">
        <h3 className="text-sm font-bold text-[#400070] uppercase tracking-wider mb-3">Session Details</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {[
            ["Delivery", session.deliveryMethod === "LiveVoice" ? "Live Voice" : "Sound Clip"],
            ["Ear Tested", session.earTested],
            ["Tech Worn", session.hearingTechWorn],
            ["Tech Status", session.techStatus],
            ["Environment", session.environment],
            ["Distance", session.distance],
            ["Setting", session.setting],
          ].map(([label, val]) => (
            <div key={label}>
              <span className="text-[var(--modal-text-muted)]">{label}: </span>
              <span className="font-medium text-[var(--modal-text)]">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="modal-card p-5 mb-6">
        <h3 className="text-sm font-bold text-[#400070] uppercase tracking-wider mb-2">
          Notes <span className="text-xs font-normal text-[var(--modal-text-muted)] normal-case">(optional)</span>
        </h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add session notes... (no identifying information)"
          className="resize-none rounded-xl border-[var(--modal-border)] min-h-[80px]"
        />
        {piiHits.length > 0 && (
          <PIIGuard text={notes} />
        )}
      </div>

      {/* Save buttons */}
      <div className="space-y-3">
        <Button
          className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-12 text-base font-semibold"
          onClick={() => onSave(notes)}
          disabled={saving || piiHits.length > 0}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving…" : "Save to Student"}
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-xl h-11 border-[#6B2FB9] text-[#400070] font-semibold"
          onClick={() => onSaveAndLink(notes)}
          disabled={saving || piiHits.length > 0}
        >
          <Link2 className="w-4 h-4 mr-2" />
          Save + Link to Service Log
        </Button>
      </div>

      <p className="text-center text-xs text-[var(--modal-text-muted)] mt-4">
        Not diagnostic. For educational planning only. Follow state, district, and school procedures.
      </p>
    </div>
  );
}