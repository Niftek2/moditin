import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X, Play, Square, Plus, CheckCircle2 } from "lucide-react";
import { SOUND_LABELS, playLing6Sound } from "./ling6Utils";

const RESPONSE_TYPES = [
  { value: "Identified", label: "✓ Identified", color: "bg-green-500 text-white hover:bg-green-600" },
  { value: "Detected", label: "◎ Detected", color: "bg-yellow-400 text-white hover:bg-yellow-500" },
  { value: "NoResponse", label: "— No Response", color: "bg-gray-400 text-white hover:bg-gray-500" },
  { value: "Incorrect", label: "✗ Incorrect", color: "bg-red-400 text-white hover:bg-red-500" },
];

const PROMPT_LEVELS = ["Independent", "Repetition", "ClosedSet", "OpenSet", "VisualCue"];
const PROMPT_LABELS = {
  Independent: "Independent",
  Repetition: "Repetition",
  ClosedSet: "Closed Set",
  OpenSet: "Open Set",
  VisualCue: "Visual Cue",
};

function emptyTrial() {
  return { responseType: "", promptLevel: "Independent", latencySeconds: null, confidence: "Sure", responseDetail: "" };
}

export default function TrialPanel({ sound, deliveryMethod, existingTrials, onSaveTrial, onMarkComplete, onClose }) {
  const [trials, setTrials] = useState(existingTrials?.length > 0 ? existingTrials : [emptyTrial()]);
  const [activeIdx, setActiveIdx] = useState(existingTrials?.length > 0 ? existingTrials.length : 0);
  const [playing, setPlaying] = useState(false);

  const activeTrial = trials[activeIdx] || emptyTrial();
  const updateActive = (patch) => {
    setTrials((prev) => {
      const next = [...prev];
      next[activeIdx] = { ...next[activeIdx], ...patch };
      return next;
    });
  };

  const handleSaveTrial = () => {
    if (!activeTrial.responseType) return;
    onSaveTrial(sound, activeIdx + 1, activeTrial);
  };

  const handleAddTrial = () => {
    if (trials.length >= 3) return;
    const saved = [...trials];
    if (!saved[activeIdx]) saved[activeIdx] = emptyTrial();
    setTrials([...saved, emptyTrial()]);
    setActiveIdx(saved.length);
  };

  const handlePlay = () => {
    if (playing) return;
    setPlaying(true);
    playLing6Sound(sound, () => setPlaying(false));
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--modal-border)] shrink-0">
        <div>
          <h3 className="font-bold text-lg text-[var(--modal-text)]">Sound: {SOUND_LABELS[sound]}</h3>
          <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">Not diagnostic · For educational planning only</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F7F3FA] text-[var(--modal-text-muted)]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* SoundClip play button */}
        {deliveryMethod === "SoundClip" && (
          <button
            onClick={handlePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold mb-5 transition-all ${
              playing ? "bg-[#400070] text-white" : "bg-[#EADDF5] text-[#400070] hover:bg-[#d8c8f0]"
            }`}
          >
            {playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {playing ? "Playing…" : "Play Sound Clip"}
          </button>
        )}

        {/* Trial tabs */}
        {trials.length > 1 && (
          <div className="flex gap-2 mb-4">
            {trials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeIdx === i ? "bg-[#400070] text-white" : "bg-[#EADDF5] text-[#400070]"
                }`}
              >
                Trial {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Response type */}
        <p className="text-sm font-semibold text-[var(--modal-text)] mb-2">Response</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {RESPONSE_TYPES.map((rt) => (
            <button
              key={rt.value}
              onClick={() => updateActive({ responseType: rt.value })}
              className={`px-3 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                activeTrial.responseType === rt.value
                  ? `${rt.color} border-transparent shadow`
                  : "bg-white border-[var(--modal-border)] text-[var(--modal-text)] hover:border-[#6B2FB9]"
              }`}
            >
              {rt.label}
            </button>
          ))}
        </div>

        {/* Prompt level */}
        <p className="text-sm font-semibold text-[var(--modal-text)] mb-2">Prompt Level</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {PROMPT_LEVELS.map((p) => (
            <button
              key={p}
              onClick={() => updateActive({ promptLevel: p })}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                activeTrial.promptLevel === p
                  ? "bg-[#400070] text-white border-[#400070]"
                  : "bg-white text-[var(--modal-text)] border-[var(--modal-border)] hover:border-[#6B2FB9]"
              }`}
            >
              {PROMPT_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Latency */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-[var(--modal-text)] mb-2">
            Latency: {activeTrial.latencySeconds != null ? `${activeTrial.latencySeconds}s` : "Not recorded"}
            <span className="text-xs font-normal text-[var(--modal-text-muted)] ml-2">(optional)</span>
          </p>
          <Slider
            min={0}
            max={10}
            step={0.5}
            value={[activeTrial.latencySeconds ?? 0]}
            onValueChange={([v]) => updateActive({ latencySeconds: v })}
            className="w-full"
          />
        </div>

        {/* Confidence */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-[var(--modal-text)] mb-2">Confidence</p>
          <div className="flex gap-2">
            {["Sure", "Unsure"].map((c) => (
              <button
                key={c}
                onClick={() => updateActive({ confidence: c })}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  activeTrial.confidence === c
                    ? "bg-[#400070] text-white border-[#400070]"
                    : "bg-white text-[var(--modal-text)] border-[var(--modal-border)] hover:border-[#6B2FB9]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Response detail */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-[var(--modal-text)] mb-1">
            Detail <span className="text-xs font-normal text-[var(--modal-text-muted)]">(optional — what student said/pointed)</span>
          </p>
          <input
            type="text"
            value={activeTrial.responseDetail || ""}
            onChange={(e) => updateActive({ responseDetail: e.target.value })}
            placeholder="e.g., pointed to /sh/"
            className="w-full px-3 py-2 rounded-xl border border-[var(--modal-border)] text-sm focus:outline-none focus:border-[#6B2FB9]"
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-[var(--modal-border)] space-y-2 shrink-0">
        <Button
          className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl"
          disabled={!activeTrial.responseType}
          onClick={handleSaveTrial}
        >
          Save Trial {activeIdx + 1}
        </Button>
        {trials.length < 3 && (
          <Button
            variant="outline"
            className="w-full rounded-xl border-[var(--modal-border)] text-[#400070]"
            onClick={handleAddTrial}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Trial
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full rounded-xl border-green-300 text-green-700 hover:bg-green-50"
          onClick={() => onMarkComplete(sound)}
        >
          <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Sound Complete
        </Button>
      </div>
    </div>
  );
}