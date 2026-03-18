import React, { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import WeeklyGrid from "./WeeklyGrid";

function pad(n) { return String(n).padStart(2, "0"); }

/**
 * Convert a student's saved availabilityWindows → Set<"dayNum-HH:mm">
 * so the grid can display pre-existing availability.
 */
function windowsToSet(windows) {
  if (!windows) return new Set();
  const set = new Set();
  for (const [day, slots] of Object.entries(windows)) {
    for (const slot of (slots || [])) {
      let [h, m] = slot.start.split(":").map(Number);
      const [endH, endM] = slot.end.split(":").map(Number);
      while (h * 60 + m < endH * 60 + endM) {
        set.add(`${day}-${pad(h)}:${pad(m)}`);
        m += 30;
        if (m >= 60) { h++; m = 0; }
      }
    }
  }
  return set;
}

export default function Step2StudentAvailability({ students, studentAvailability, onChange }) {
  const [expanded, setExpanded] = useState(students[0]?.id || null);

  const handleExpand = (student) => {
    if (expanded === student.id) {
      setExpanded(null);
    } else {
      setExpanded(student.id);
      // Pre-populate from saved profile data if not already set
      if (!studentAvailability[student.id]) {
        const init = windowsToSet(student.availabilityWindows);
        onChange(prev => ({ ...prev, [student.id]: init }));
      }
    }
  };

  const updateStudent = (studentId, newSet) => {
    onChange(prev => ({ ...prev, [studentId]: newSet }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-[var(--modal-text)] mb-1">Student Availability</h3>
        <p className="text-sm text-[var(--modal-text-muted)]">
          Click or drag to mark when each student{" "}
          <span className="font-semibold text-green-600">is available</span> to be seen.
          If you leave a student blank, the scheduler uses your working hours.
        </p>
      </div>

      <div className="space-y-2">
        {students.map(student => {
          const isOpen = expanded === student.id;
          const avail = studentAvailability[student.id] || new Set();
          const slotCount = avail.size;

          return (
            <div key={student.id} className="border border-[var(--modal-border)] rounded-xl overflow-hidden">
              {/* Header */}
              <button
                onClick={() => handleExpand(student)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--modal-text)]">
                      {student.studentInitials}
                    </span>
                    {student.locationId && (
                      <span className="text-xs text-gray-400">@ {student.locationId}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {slotCount > 0
                      ? `${slotCount} time slot${slotCount !== 1 ? "s" : ""} marked available`
                      : "No constraints — will use your working hours"}
                  </p>
                </div>
                {slotCount > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />
                )}
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>

              {/* Grid */}
              {isOpen && (
                <div className="border-t border-[var(--modal-border)] p-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500">
                      Click or drag to mark{" "}
                      <span className="font-semibold text-green-600">available</span> windows
                    </p>
                    {slotCount > 0 && (
                      <button
                        onClick={() => updateStudent(student.id, new Set())}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <WeeklyGrid
                    value={avail}
                    onChange={(set) => updateStudent(student.id, set)}
                    activeColor="green"
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