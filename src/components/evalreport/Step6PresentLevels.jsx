import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const AREAS = [
  { id: "academic language", label: "Academic Language" },
  { id: "communication", label: "Communication" },
  { id: "social participation", label: "Social Participation" },
  { id: "auditory access", label: "Auditory Access" },
  { id: "advocacy skills", label: "Advocacy Skills" },
  { id: "technology use", label: "Technology Use" },
  { id: "visual communication access", label: "Visual Communication Access" },
];

const AREA_NOTES = {
  "academic language": "academicLanguageNotes",
  "communication": "communicationNotes",
  "social participation": "socialParticipationNotes",
  "auditory access": "auditoryAccessNotes",
  "advocacy skills": "advocacyNotes",
  "technology use": "technologyNotes",
  "visual communication access": "visualAccessNotes",
};

export default function Step6PresentLevels({ data, onChange }) {
  const selected = data.areas || [];
  const notes = data.notes || {};

  const toggleArea = (id) => {
    if (selected.includes(id)) {
      onChange({ ...data, areas: selected.filter(a => a !== id) });
    } else {
      onChange({ ...data, areas: [...selected, id] });
    }
  };

  const setNote = (noteKey, val) => {
    onChange({ ...data, notes: { ...notes, [noteKey]: val } });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--modal-text)] mb-1">Step 6: Present Levels Summary</h2>
      <p className="text-sm text-[var(--modal-text-muted)] mb-6">Select which summary areas to include. Add notes to guide the generated narrative.</p>

      <div className="space-y-4">
        {AREAS.map(area => {
          const noteKey = AREA_NOTES[area.id];
          const isSelected = selected.includes(area.id);
          return (
            <div key={area.id} className={`rounded-xl border transition-all ${isSelected ? "border-[#400070] bg-purple-50" : "border-[var(--modal-border)]"}`}>
              <div className="flex items-center gap-3 p-4">
                <Checkbox id={`pl-${area.id}`} checked={isSelected}
                  onCheckedChange={() => toggleArea(area.id)} className="border-2" />
                <Label htmlFor={`pl-${area.id}`} className="font-medium cursor-pointer">{area.label}</Label>
              </div>
              {isSelected && (
                <div className="px-4 pb-4">
                  <Textarea
                    value={notes[noteKey] || ""}
                    onChange={e => setNote(noteKey, e.target.value)}
                    rows={2}
                    placeholder={`Notes for ${area.label} summary (optional — leave blank to use generated language)`}
                    className="border-[var(--modal-border)] text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}