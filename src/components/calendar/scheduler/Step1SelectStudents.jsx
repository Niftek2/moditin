import React from "react";
import { MapPin, User } from "lucide-react";

function iepSummary(s) {
  const parts = [];
  if (s.directMinutes) {
    const freq = s.directMinutesFrequency?.toLowerCase() || "wk";
    parts.push(`${s.directMinutes} min direct/${freq}`);
  }
  if (s.indirectMinutes) {
    const freq = s.indirectMinutesFrequency?.toLowerCase() || "wk";
    parts.push(`${s.indirectMinutes} min indirect/${freq}`);
  }
  return parts.join(" · ") || "No IEP minutes set";
}

export default function Step1SelectStudents({ students, selectedIds, onSelectionChange }) {
  const toggle = (id) => {
    onSelectionChange(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const grouped = students.reduce((acc, s) => {
    const key = s.locationId || "No Location";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) =>
    a === "No Location" ? 1 : b === "No Location" ? -1 : a.localeCompare(b)
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-[var(--modal-text)] mb-1">Select Students</h3>
        <p className="text-sm text-[var(--modal-text-muted)]">
          Choose which students to include. Their IEP minutes determine how many sessions per week they need.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectionChange(students.map(s => s.id))}
          className="text-xs font-semibold text-[#400070] hover:underline"
        >
          Select all
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => onSelectionChange([])}
          className="text-xs text-gray-400 hover:underline"
        >
          Clear
        </button>
        <span className="ml-auto text-xs text-gray-400">
          {selectedIds.length} of {students.length} selected
        </span>
      </div>

      {students.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No students found. Add students first.</p>
        </div>
      )}

      <div className="space-y-4">
        {sortedGroups.map(([location, locationStudents]) => (
          <div key={location}>
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-[#400070]" />
              <span className="text-xs font-bold text-[#400070] uppercase tracking-wide">{location}</span>
              <span className="text-xs text-gray-400">· {locationStudents.length} student{locationStudents.length !== 1 ? "s" : ""}</span>
              <button
                onClick={() => {
                  const ids = locationStudents.map(s => s.id);
                  const allSelected = ids.every(id => selectedIds.includes(id));
                  onSelectionChange(prev =>
                    allSelected
                      ? prev.filter(id => !ids.includes(id))
                      : [...new Set([...prev, ...ids])]
                  );
                }}
                className="ml-auto text-xs text-[#400070]/60 hover:text-[#400070] hover:underline"
              >
                {locationStudents.every(s => selectedIds.includes(s.id)) ? "Deselect group" : "Select group"}
              </button>
            </div>

            <div className="border border-[var(--modal-border)] rounded-xl overflow-hidden">
              {locationStudents.map((s, idx) => {
                const isSelected = selectedIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      idx > 0 ? "border-t border-[var(--modal-border)]" : ""
                    } ${isSelected ? "bg-[#F7F3FA]" : "hover:bg-gray-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(s.id)}
                      className="accent-[#400070] w-4 h-4 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[var(--modal-text)]">
                          {s.studentInitials}
                        </span>
                        {s.gradeBand && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {s.gradeBand}
                          </span>
                        )}
                        {s.consultOnly && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                            Consult Only
                          </span>
                        )}
                        {s.serviceDeliveryModel && (
                          <span className="text-xs text-gray-400">{s.serviceDeliveryModel}</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--modal-text-muted)] mt-0.5 truncate">
                        {iepSummary(s)}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                      isSelected ? "bg-[#400070]" : "bg-gray-200"
                    }`} />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}