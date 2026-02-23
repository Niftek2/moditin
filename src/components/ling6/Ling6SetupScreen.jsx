import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Mic, Volume2 } from "lucide-react";

const DISCLAIMER_TEXT =
  "I understand this is a screening/support tool only, not diagnostic. I will follow my district, state, and school procedures.";

function ChipGroup({ label, options, value, onChange, required }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-[var(--modal-text)] mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              value === opt.value
                ? "bg-[#400070] text-white border-[#400070] shadow-sm"
                : "bg-white text-[var(--modal-text)] border-[var(--modal-border)] hover:border-[#6B2FB9] hover:text-[#6B2FB9]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Ling6SetupScreen({ student, onStart }) {
  const [form, setForm] = useState({
    setting: student?.serviceDeliveryModel || "InPerson",
    deliveryMethod: "",
    earTested: "Both",
    hearingTechWorn: "HA",
    techStatus: "On",
    environment: "Quiet",
    distance: "3ft",
    caregiverPresent: false,
    disclaimerAccepted: false,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const canStart =
    form.deliveryMethod &&
    form.earTested &&
    form.disclaimerAccepted;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--modal-text)]">Ling 6 Sound Check</h1>
        <p className="text-sm text-[var(--modal-text-muted)] mt-1">Quick listening check. <strong>Not diagnostic.</strong></p>
        {student && (
          <div className="mt-2">
            <Badge className="bg-[#EADDF5] text-[#400070] border-0">
              Student: {student.studentInitials}
            </Badge>
          </div>
        )}
      </div>

      <div className="modal-card p-6 mb-4">
        {/* Delivery Method — most prominent */}
        <div className="mb-5 p-4 rounded-xl border-2 border-[#6B2FB9] bg-[#F7F3FA]">
          <p className="text-sm font-bold text-[#400070] mb-3">
            Delivery Method <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => set("deliveryMethod", "LiveVoice")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.deliveryMethod === "LiveVoice"
                  ? "border-[#400070] bg-[#400070] text-white"
                  : "border-[var(--modal-border)] bg-white hover:border-[#6B2FB9]"
              }`}
            >
              <Mic className="w-6 h-6" />
              <span className="font-semibold text-sm">Live Voice</span>
              <span className={`text-xs text-center ${form.deliveryMethod === "LiveVoice" ? "text-white/80" : "text-[var(--modal-text-muted)]"}`}>
                You present sounds
              </span>
            </button>
            <button
              type="button"
              onClick={() => set("deliveryMethod", "SoundClip")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.deliveryMethod === "SoundClip"
                  ? "border-[#400070] bg-[#400070] text-white"
                  : "border-[var(--modal-border)] bg-white hover:border-[#6B2FB9]"
              }`}
            >
              <Volume2 className="w-6 h-6" />
              <span className="font-semibold text-sm">Sound Clip</span>
              <span className={`text-xs text-center ${form.deliveryMethod === "SoundClip" ? "text-white/80" : "text-[var(--modal-text-muted)]"}`}>
                App plays tones
              </span>
            </button>
          </div>
          {form.deliveryMethod === "SoundClip" && (
            <p className="text-xs text-[var(--modal-text-muted)] mt-2 text-center">
              Use a comfortable, consistent volume on your device.
            </p>
          )}
        </div>

        <ChipGroup
          label="Setting"
          options={[
            { value: "InPerson", label: "In Person" },
            { value: "Telepractice", label: "Telepractice" },
            { value: "Hybrid", label: "Hybrid" },
          ]}
          value={form.setting}
          onChange={(v) => set("setting", v)}
        />

        <ChipGroup
          label="Ear Tested"
          required
          options={[
            { value: "Both", label: "Both" },
            { value: "Left", label: "Left" },
            { value: "Right", label: "Right" },
          ]}
          value={form.earTested}
          onChange={(v) => set("earTested", v)}
        />

        <ChipGroup
          label="Hearing Tech Worn"
          options={[
            { value: "HA", label: "HA" },
            { value: "CI", label: "CI" },
            { value: "BAHA", label: "BAHA" },
            { value: "None", label: "None" },
            { value: "Unknown", label: "Unknown" },
            { value: "Other", label: "Other" },
          ]}
          value={form.hearingTechWorn}
          onChange={(v) => set("hearingTechWorn", v)}
        />

        <ChipGroup
          label="Tech Status"
          options={[
            { value: "On", label: "On" },
            { value: "Off", label: "Off" },
            { value: "Unknown", label: "Unknown" },
            { value: "NotApplicable", label: "N/A" },
          ]}
          value={form.techStatus}
          onChange={(v) => set("techStatus", v)}
        />

        <ChipGroup
          label="Environment"
          options={[
            { value: "Quiet", label: "Quiet" },
            { value: "TypicalClassroom", label: "Typical" },
            { value: "Noisy", label: "Noisy" },
            { value: "Other", label: "Other" },
          ]}
          value={form.environment}
          onChange={(v) => set("environment", v)}
        />

        <ChipGroup
          label="Distance"
          options={[
            { value: "1ft", label: "1 ft" },
            { value: "3ft", label: "3 ft" },
            { value: "6ft", label: "6 ft" },
            { value: "10ft", label: "10 ft" },
            { value: "Other", label: "Other" },
          ]}
          value={form.distance}
          onChange={(v) => set("distance", v)}
        />

        {form.setting === "Telepractice" && (
          <div className="flex items-center gap-3 mt-2 mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
            <Checkbox
              id="caregiver"
              checked={form.caregiverPresent}
              onCheckedChange={(v) => set("caregiverPresent", !!v)}
            />
            <label htmlFor="caregiver" className="text-sm text-[var(--modal-text)] cursor-pointer">
              Caregiver present during session
            </label>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="disclaimer"
                  checked={form.disclaimerAccepted}
                  onCheckedChange={(v) => set("disclaimerAccepted", !!v)}
                />
                <label htmlFor="disclaimer" className="text-sm text-[var(--modal-text)] cursor-pointer leading-relaxed">
                  {DISCLAIMER_TEXT}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-12 text-base font-semibold"
        disabled={!canStart}
        onClick={() => onStart(form)}
      >
        Start Check
      </Button>
    </div>
  );
}