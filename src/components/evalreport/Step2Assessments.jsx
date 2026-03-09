import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_ASSESSMENTS = [
  "DTAP", "LING Sounds", "TAPS-4", "OWLS-II", "TACL", "TEXL", "TNL-2",
  "One Word Picture Vocabulary Test", "Craig Speechreading", "TOSCRF-2",
  "SIFTER", "Functional Listening Evaluation", "SKI-HI Language Development",
  "DHH Advocacy Rubric", "Informal Observation", "Other"
];

export default function Step2Assessments({ data, onChange }) {
  const selected = data.selectedAssessments || [];

  const toggle = (name) => {
    const exists = selected.find(a => a.name === name);
    if (exists) {
      onChange({ ...data, selectedAssessments: selected.filter(a => a.name !== name) });
    } else {
      onChange({ ...data, selectedAssessments: [...selected, { name, date: "" }] });
    }
  };

  const setDate = (name, date) => {
    onChange({
      ...data,
      selectedAssessments: selected.map(a => a.name === name ? { ...a, date } : a)
    });
  };

  const isSelected = (name) => !!selected.find(a => a.name === name);
  const getDate = (name) => selected.find(a => a.name === name)?.date || "";

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--modal-text)] mb-1">Step 2: Assessment Checklist</h2>
      <p className="text-sm text-[var(--modal-text-muted)] mb-6">
        Select all assessments completed. Only selected assessments will appear in Step 5 and in the final report.
      </p>

      <div className="space-y-3">
        {ALL_ASSESSMENTS.map(name => (
          <div key={name} className={`rounded-xl border transition-all ${isSelected(name) ? "border-[#400070] bg-purple-50" : "border-[var(--modal-border)] bg-white"}`}>
            <div className="flex items-center gap-3 p-4">
              <Checkbox
                id={`assess-${name}`}
                checked={isSelected(name)}
                onCheckedChange={() => toggle(name)}
                className="border-2"
              />
              <Label htmlFor={`assess-${name}`} className="font-medium cursor-pointer flex-1">{name}</Label>
              {isSelected(name) && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-[var(--modal-text-muted)] whitespace-nowrap">Date administered:</Label>
                  <Input
                    type="date"
                    value={getDate(name)}
                    onChange={e => setDate(name, e.target.value)}
                    className="border-[var(--modal-border)] w-44 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-700 font-medium">{selected.length} assessment{selected.length !== 1 ? "s" : ""} selected</p>
          <p className="text-xs text-green-600 mt-0.5">Each will have a dedicated form in Step 5.</p>
        </div>
      )}
    </div>
  );
}