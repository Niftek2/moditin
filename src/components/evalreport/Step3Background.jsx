import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const COMM_HOME_OPTIONS = ["Spoken language", "Sign language (ASL)", "Spoken + Sign", "Visual supports", "AAC device", "Other"];

export default function Step3Background({ data, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });
  const setDevice = (field, val) => onChange({ ...data, deviceIndependence: { ...(data.deviceIndependence || {}), [field]: val } });
  const di = data.deviceIndependence || {};

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--modal-text)] mb-1">Step 3: Background Information</h2>
      <p className="text-sm text-[var(--modal-text-muted)] mb-6">Enter background information. No identifying details — use general descriptions.</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Audiological History</Label>
          <Textarea value={data.audiologicalHistory || ""} onChange={e => set("audiologicalHistory", e.target.value)}
            rows={2} placeholder="Brief history of hearing loss identification, testing, etc." className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Amplification History</Label>
          <Textarea value={data.amplificationHistory || ""} onChange={e => set("amplificationHistory", e.target.value)}
            rows={2} placeholder="Device history, age of fitting, consistency, etc." className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Communication Methods at Home</Label>
          <Select value={data.communicationHome || ""} onValueChange={v => set("communicationHome", v)}>
            <SelectTrigger className="border-[var(--modal-border)]">
              <SelectValue placeholder="Select primary home communication method" />
            </SelectTrigger>
            <SelectContent>
              {COMM_HOME_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Family Language Access</Label>
          <Textarea value={data.familyLanguageAccess || ""} onChange={e => set("familyLanguageAccess", e.target.value)}
            rows={2} placeholder="Languages used in the home, bilingual context, etc." className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>General Health History</Label>
          <Textarea value={data.generalHealthHistory || ""} onChange={e => set("generalHealthHistory", e.target.value)}
            rows={2} placeholder="Relevant medical history (no identifying information)" className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Family History of Hearing Loss</Label>
          <Textarea value={data.familyHistoryHL || ""} onChange={e => set("familyHistoryHL", e.target.value)}
            rows={2} placeholder="e.g., Family history of hereditary hearing loss — no names" className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Developmental History</Label>
          <Textarea value={data.developmentalHistory || ""} onChange={e => set("developmentalHistory", e.target.value)}
            rows={2} placeholder="Relevant developmental milestones, early intervention history, etc." className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Caregiver Concerns</Label>
          <Textarea value={data.caregiverConcerns || ""} onChange={e => set("caregiverConcerns", e.target.value)}
            rows={2} placeholder="Concerns raised by family — no names of family members" className="border-[var(--modal-border)]" />
        </div>

        <div className="space-y-2">
          <Label>Access Concerns</Label>
          <Textarea value={data.accessConcerns || ""} onChange={e => set("accessConcerns", e.target.value)}
            rows={2} placeholder="Access barriers noted in classroom or learning environment" className="border-[var(--modal-border)]" />
        </div>

        {/* Device independence */}
        <div className="border border-[var(--modal-border)] rounded-xl p-4 space-y-3">
          <Label className="text-sm font-bold">Hearing Device Independence Skills</Label>
          {[
            { id: "batteryManagement", label: "Battery management" },
            { id: "charging", label: "Charging devices" },
            { id: "reportingIssues", label: "Reporting device issues" },
            { id: "cleaning", label: "Cleaning devices" },
            { id: "puttingOnOff", label: "Putting on/taking off devices" },
          ].map(skill => (
            <div key={skill.id} className="flex items-center gap-2">
              <Checkbox id={`di-${skill.id}`} checked={!!di[skill.id]}
                onCheckedChange={checked => setDevice(skill.id, checked)} />
              <Label htmlFor={`di-${skill.id}`} className="font-normal cursor-pointer">{skill.label}</Label>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Home Support Notes</Label>
          <Textarea value={data.homeSupportNotes || ""} onChange={e => set("homeSupportNotes", e.target.value)}
            rows={2} placeholder="Additional notes about home support, resources, etc." className="border-[var(--modal-border)]" />
        </div>
      </div>
    </div>
  );
}