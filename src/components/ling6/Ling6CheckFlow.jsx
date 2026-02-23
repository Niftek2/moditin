import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight } from "lucide-react";
import SoundTile from "./SoundTile";
import TrialPanel from "./TrialPanel";
import { LING6_SOUNDS, computeSummary } from "./ling6Utils";

export default function Ling6CheckFlow({ session, student, onComplete }) {
  // trials: { [sound]: [{ responseType, promptLevel, latencySeconds, confidence, responseDetail }] }
  const [trials, setTrials] = useState({});
  // completedSounds: Set of sounds marked done
  const [completedSounds, setCompletedSounds] = useState(new Set());
  const [selectedSound, setSelectedSound] = useState(null);

  const getSoundStatus = (sound) => {
    const soundTrials = trials[sound];
    if (!soundTrials || soundTrials.length === 0) return "NotTested";
    if (completedSounds.has(sound)) {
      // Best response
      if (soundTrials.some(t => t.responseType === "Identified")) return "Identified";
      if (soundTrials.some(t => t.responseType === "Detected")) return "Detected";
      if (soundTrials.some(t => t.responseType === "Incorrect")) return "Incorrect";
      return "NoResponse";
    }
    return "InProgress";
  };

  const handleSaveTrial = (sound, trialNumber, trialData) => {
    setTrials(prev => {
      const existing = prev[sound] || [];
      const updated = [...existing];
      updated[trialNumber - 1] = { ...trialData, trialNumber };
      return { ...prev, [sound]: updated };
    });
  };

  const handleMarkComplete = (sound) => {
    setCompletedSounds(prev => new Set([...prev, sound]));
    setSelectedSound(null);
  };

  const allTrialsList = Object.entries(trials).flatMap(([sound, ts]) =>
    ts.map(t => ({ ...t, sound }))
  );

  const allComplete = completedSounds.size === LING6_SOUNDS.length;

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 max-w-5xl mx-auto min-h-[70vh]">
      {/* Left: grid */}
      <div className="flex-1">
        {/* Session header bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl bg-white border border-[var(--modal-border)] text-xs">
          {student && <span className="font-bold text-[#400070]">{student.studentInitials}</span>}
          <span className="text-[var(--modal-text-muted)]">·</span>
          <span>{new Date().toLocaleDateString()}</span>
          <span className="text-[var(--modal-text-muted)]">·</span>
          <Badge className={`text-xs border-0 ${session.deliveryMethod === "LiveVoice" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
            {session.deliveryMethod === "LiveVoice" ? "Live Voice" : "Sound Clip"}
          </Badge>
          <Badge className="bg-[#EADDF5] text-[#400070] border-0 text-xs">Ear: {session.earTested}</Badge>
          <Badge className="bg-[#EADDF5] text-[#400070] border-0 text-xs">{session.hearingTechWorn}</Badge>
          <span className="ml-auto text-[var(--modal-text-muted)] italic">Not diagnostic.</span>
        </div>

        {/* Telepractice banner */}
        {session.setting === "Telepractice" && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Telepractice results depend on device audio and environment. Use professional judgment and follow your school/district procedures.
          </div>
        )}

        {/* Sound grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {LING6_SOUNDS.map((sound) => (
            <SoundTile
              key={sound}
              sound={sound}
              status={getSoundStatus(sound)}
              isSelected={selectedSound === sound}
              onClick={() => setSelectedSound(selectedSound === sound ? null : sound)}
              deliveryMethod={session.deliveryMethod}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--modal-text-muted)]">
            {completedSounds.size} / {LING6_SOUNDS.length} sounds complete
          </p>
          <Button
            className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl"
            onClick={() => onComplete(allTrialsList)}
            disabled={completedSounds.size === 0}
          >
            View Summary <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Right: trial panel (desktop slide-in, mobile bottom overlay handled via selectedSound) */}
      {selectedSound && (
        <>
          {/* Desktop right panel */}
          <div className="hidden lg:block w-80 shrink-0 border border-[var(--modal-border)] rounded-2xl overflow-hidden" style={{ maxHeight: "600px" }}>
            <TrialPanel
              sound={selectedSound}
              deliveryMethod={session.deliveryMethod}
              existingTrials={trials[selectedSound] || []}
              onSaveTrial={handleSaveTrial}
              onMarkComplete={handleMarkComplete}
              onClose={() => setSelectedSound(null)}
            />
          </div>

          {/* Mobile bottom sheet overlay */}
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedSound(null)}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl overflow-hidden"
              style={{ maxHeight: "80vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              <TrialPanel
                sound={selectedSound}
                deliveryMethod={session.deliveryMethod}
                existingTrials={trials[selectedSound] || []}
                onSaveTrial={handleSaveTrial}
                onMarkComplete={handleMarkComplete}
                onClose={() => setSelectedSound(null)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}