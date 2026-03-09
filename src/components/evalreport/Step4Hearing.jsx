import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LOSS_TYPES = ["Sensorineural", "Conductive", "Mixed", "ANSD", "Auditory Processing", "Unknown"];
const SEVERITY_OPTS = ["Mild", "Moderate", "Moderately-Severe", "Severe", "Profound", "Mixed range", "Unknown"];
const LATERALITY_OPTS = ["Bilateral", "Unilateral – Right", "Unilateral – Left", "Asymmetric"];
const EAR_OPTS = ["Right", "Left", "Both equally", "Not applicable"];
const DEVICE_TYPES = ["Behind-the-ear hearing aids", "Receiver-in-canal hearing aids", "Cochlear implant(s)", "BAHA/bone-anchored device", "No device", "Other"];

export default function Step4Hearing({ data, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--modal-text)] mb-1">Step 4: Hearing / Audiology Section</h2>
      <p className="text-sm text-[var(--modal-text-muted)] mb-6">Enter hearing access and audiological information. This section generates the hearing summary in the report.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Laterality</Label>
          <Select value={data.laterality || ""} onValueChange={v => set("laterality", v)}>
            <SelectTrigger className="border-[var(--modal-border)]"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{LATERALITY_OPTS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Severity</Label>
          <Select value={data.severity || ""} onValueChange={v => set("severity", v)}>
            <SelectTrigger className="border-[var(--modal-border)]"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{SEVERITY_OPTS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Right Ear Type</Label>
          <Select value={data.rightEarType || ""} onValueChange={v => set("rightEarType", v)}>
            <SelectTrigger className="border-[var(--modal-border)]"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{LOSS_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Left Ear Type</Label>
          <Select value={data.leftEarType || ""} onValueChange={v => set("leftEarType", v)}>
            <SelectTrigger className="border-[var(--modal-border)]"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{LOSS_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Better Ear</Label>
          <Select value={data.betterEar || ""} onValueChange={v => set("betterEar", v)}>
            <SelectTrigger className="border-[var(--modal-border)]"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{EAR_OPTS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Most Recent Audiogram Date</Label>
          <Input type="date" value={data.audiogramDate || ""} onChange={e => set("audiogramDate", e.target.value)} className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Device Type</Label>
          <Select value={data.deviceType || ""} onValueChange={v => set("deviceType", v)}>
            <SelectTrigger className="border-[var(--modal-border)]"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{DEVICE_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Device Model / Brand</Label>
          <Input value={data.deviceModel || ""} onChange={e => set("deviceModel", e.target.value)}
            placeholder="e.g., Phonak Naída L90" className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Recommended Wear Time</Label>
          <Input value={data.recommendedWearTime || ""} onChange={e => set("recommendedWearTime", e.target.value)}
            placeholder="e.g., All waking hours" className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Assistive Listening Device (ALD) Use</Label>
          <Input value={data.aldUse || ""} onChange={e => set("aldUse", e.target.value)}
            placeholder="e.g., Roger FM system in classroom" className="border-[var(--modal-border)]" />
        </div>
      </div>

      <div className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Speech Recognition Summary</Label>
          <Textarea value={data.speechRecognition || ""} onChange={e => set("speechRecognition", e.target.value)}
            rows={2} placeholder="Summary of speech recognition testing findings" className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Tympanometry Findings</Label>
          <Textarea value={data.tympanometry || ""} onChange={e => set("tympanometry", e.target.value)}
            rows={2} placeholder="e.g., Type A bilaterally, normal middle ear pressure" className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Educational Impact Notes</Label>
          <Textarea value={data.educationalImpact || ""} onChange={e => set("educationalImpact", e.target.value)}
            rows={2} placeholder="How hearing loss affects learning in the classroom setting" className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Auditory Access Notes</Label>
          <Textarea value={data.auditoryAccessNotes || ""} onChange={e => set("auditoryAccessNotes", e.target.value)}
            rows={2} placeholder="Additional access notes" className="border-[var(--modal-border)]" />
        </div>
      </div>
    </div>
  );
}