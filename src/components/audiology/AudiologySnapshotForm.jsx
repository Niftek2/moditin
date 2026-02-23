import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import PIIWarning, { checkPII } from "../shared/PIIGuard";

const HL_TYPES = ["Sensorineural", "Conductive", "Mixed", "ANSD", "CentralAuditoryProcessingConcerns", "Unknown", "Other"];
const HL_TYPE_LABELS = {
  Sensorineural: "Sensorineural", Conductive: "Conductive", Mixed: "Mixed",
  ANSD: "ANSD", CentralAuditoryProcessingConcerns: "CAPD (educational reference only)",
  Unknown: "Unknown", Other: "Other"
};
const HL_DETAIL_TAGS = ["Unilateral", "Bilateral", "Asymmetric", "Fluctuating", "Progressive", "Sudden", "HistoryOfOtitisMedia", "HistoryOfTubes", "EnlargedVestibularAqueduct", "Genetic", "NoiseExposure", "NotKnown"];
const LATERALITY = ["Bilateral", "Left", "Right", "Unknown"];
const CONFIGURATIONS = ["Flat", "Sloping", "Rising", "CookieBite", "NotKnown"];
const SEVERITY = ["Mild", "Moderate", "ModeratelySevere", "Severe", "Profound", "MixedRange", "Unknown"];
const ONSET = ["Congenital", "Acquired", "Unknown"];
const PROGRESSION = ["Stable", "Progressive", "Fluctuating", "Unknown"];
const ETIOLOGY = ["Known", "Unknown", "NotShared"];
const EQUIPMENT_OPTIONS = ["HearingAids", "CochlearImplant", "BAHA", "FM_DM", "Soundfield", "CROS", "None", "Other"];
const EQUIPMENT_LABELS = {
  HearingAids: "Hearing Aids", CochlearImplant: "Cochlear Implant", BAHA: "BAHA",
  FM_DM: "FM/DM System", Soundfield: "Soundfield", CROS: "CROS", None: "None", Other: "Other"
};

export default function AudiologySnapshotForm({ snapshot, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(snapshot || {
    lastAudiogramDate: "", hearingLossType: "", hearingLossTypeOther: "",
    hearingLossDetail: [], hearingLossLaterality: "", configuration: "",
    severityRange: "", onset: "", progression: "", etiologyKnown: "",
    etiologyNotes: "", equipmentUsed: [], equipmentDetails: "",
    listeningAccessNotes: "", hlHistoryNotes: "", confirmNoIdentifying: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [piiWarnings, setPiiWarnings] = useState([]);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    const noteFields = ["etiologyNotes", "equipmentDetails", "listeningAccessNotes", "hlHistoryNotes"];
    if (noteFields.includes(field)) setPiiWarnings(checkPII(value));
  };

  const toggleArray = (field, value) => {
    setForm(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.confirmNoIdentifying) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Warning Banner */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800">
          <strong>Do NOT upload or paste audiogram documents or any medical reports.</strong> Enter only non-identifiable summary information needed for instruction. This is an educational snapshot only.
        </p>
      </div>

      {piiWarnings.length > 0 && <PIIWarning warnings={piiWarnings} />}

      {/* Core Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Last Audiogram Date</Label>
          <Input type="date" value={form.lastAudiogramDate || ""} onChange={e => set("lastAudiogramDate", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Hearing Loss Type</Label>
          <Select value={form.hearingLossType} onValueChange={v => set("hearingLossType", v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {HL_TYPES.map(t => <SelectItem key={t} value={t}>{HL_TYPE_LABELS[t]}</SelectItem>)}
            </SelectContent>
          </Select>
          {form.hearingLossType === "Other" && (
            <Input placeholder="Specify (no identifying details)" value={form.hearingLossTypeOther || ""} onChange={e => set("hearingLossTypeOther", e.target.value)} />
          )}
        </div>

        <div className="space-y-2">
          <Label>Laterality</Label>
          <Select value={form.hearingLossLaterality} onValueChange={v => set("hearingLossLaterality", v)}>
            <SelectTrigger><SelectValue placeholder="Select laterality" /></SelectTrigger>
            <SelectContent>
              {LATERALITY.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Equipment */}
      <div className="space-y-2">
        <Label>Equipment Used</Label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map(eq => (
            <button
              type="button" key={eq}
              onClick={() => toggleArray("equipmentUsed", eq)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                (form.equipmentUsed || []).includes(eq)
                  ? "bg-[#400070] text-white border-[#400070]"
                  : "bg-white text-[var(--modal-text)] border-[var(--modal-border)] hover:border-[#6B2FB9]"
              }`}
            >
              {EQUIPMENT_LABELS[eq]}
            </button>
          ))}
        </div>
      </div>

      {/* HL Detail tags */}
      <div className="space-y-2">
        <Label>Hearing Loss Detail Tags</Label>
        <div className="flex flex-wrap gap-2">
          {HL_DETAIL_TAGS.map(tag => (
            <button
              type="button" key={tag}
              onClick={() => toggleArray("hearingLossDetail", tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                (form.hearingLossDetail || []).includes(tag)
                  ? "bg-[#EADDF5] text-[#400070] border-[#C4A8E8]"
                  : "bg-white text-[var(--modal-text)] border-[var(--modal-border)] hover:border-[#6B2FB9]"
              }`}
            >
              {tag.replace(/([A-Z])/g, " $1").trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(v => !v)}
        className="flex items-center gap-2 text-sm text-[#6B2FB9] font-medium hover:text-[#400070]"
      >
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showAdvanced ? "Hide" : "Show"} more details
      </button>

      {showAdvanced && (
        <div className="space-y-4 border border-[var(--modal-border)] rounded-xl p-4 bg-[#F7F3FA]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Configuration</Label>
              <Select value={form.configuration} onValueChange={v => set("configuration", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CONFIGURATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity Range</Label>
              <Select value={form.severityRange} onValueChange={v => set("severityRange", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{SEVERITY.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Onset</Label>
              <Select value={form.onset} onValueChange={v => set("onset", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{ONSET.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Progression</Label>
              <Select value={form.progression} onValueChange={v => set("progression", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{PROGRESSION.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etiology</Label>
              <Select value={form.etiologyKnown} onValueChange={v => set("etiologyKnown", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{ETIOLOGY.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Etiology Notes <span className="text-[10px] font-normal text-[var(--modal-text-muted)]">— no identifying details</span></Label>
            <Textarea placeholder="Non-identifiable notes only" value={form.etiologyNotes || ""} onChange={e => set("etiologyNotes", e.target.value)} className="h-16" />
          </div>

          <div className="space-y-2">
            <Label>Equipment Details <span className="text-[10px] font-normal text-[var(--modal-text-muted)]">— no identifying details</span></Label>
            <Textarea placeholder="e.g., bilateral BTEs, FM receiver on left" value={form.equipmentDetails || ""} onChange={e => set("equipmentDetails", e.target.value)} className="h-16" />
          </div>
        </div>
      )}

      {/* Instructional Notes */}
      <div className="space-y-2">
        <Label>Listening Access Notes <span className="text-[10px] font-normal text-[var(--modal-text-muted)]">— no identifying details</span></Label>
        <Textarea placeholder='e.g., "benefits from preferential seating," "needs quiet environment"' value={form.listeningAccessNotes || ""} onChange={e => set("listeningAccessNotes", e.target.value)} className="h-20" />
      </div>

      <div className="space-y-2">
        <Label>HL History Notes <span className="text-[10px] font-normal text-[var(--modal-text-muted)]">— HL-related only, no identifying details</span></Label>
        <Textarea placeholder="HL-related history relevant to instruction only" value={form.hlHistoryNotes || ""} onChange={e => set("hlHistoryNotes", e.target.value)} className="h-20" />
      </div>

      {/* Confirmation checkbox */}
      <div className="flex items-start gap-3 bg-[#F7F3FA] border border-[var(--modal-border)] rounded-xl p-4">
        <Checkbox
          id="confirmNoIdentifying"
          checked={!!form.confirmNoIdentifying}
          onCheckedChange={v => set("confirmNoIdentifying", v)}
          className="mt-0.5"
        />
        <label htmlFor="confirmNoIdentifying" className="text-sm text-[var(--modal-text)] cursor-pointer">
          I confirm I am not entering identifying information or uploading documents. This is an educational summary only.
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          type="submit"
          disabled={!form.confirmNoIdentifying || saving}
          className="bg-[#400070] hover:bg-[#5B00A0] text-white"
        >
          {saving ? "Saving..." : "Save Snapshot"}
        </Button>
      </div>

      <p className="text-[10px] text-[var(--modal-text-muted)] text-center">
        Educational summary only · Not diagnostic · No medical documents stored · Follow district/state and school procedures
      </p>
    </form>
  );
}