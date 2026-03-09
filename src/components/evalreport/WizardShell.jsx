import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle } from "lucide-react";

const STEPS = [
  { id: 1, label: "Report Setup" },
  { id: 2, label: "Assessments" },
  { id: 3, label: "Background" },
  { id: 4, label: "Hearing" },
  { id: 5, label: "Assessment Forms" },
  { id: 6, label: "Present Levels" },
  { id: 7, label: "Accommodations" },
  { id: 8, label: "Recommendations" },
  { id: 9, label: "Preview & Edit" },
  { id: 10, label: "Export" },
];

export default function WizardShell({ currentStep, onStepClick, children, onBack, onNext, nextLabel, saving, studentInitials }) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Privacy Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
        <span className="text-amber-600 text-lg leading-none mt-0.5">⚠</span>
        <p className="text-sm text-amber-800 font-medium">
          <strong>Privacy Reminder:</strong> Use initials only. Do not enter DOB, school name, student ID, or other identifying information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Step sidebar */}
        <div className="modal-card p-4 h-fit">
          {studentInitials && (
            <div className="mb-4 pb-4 border-b border-[var(--modal-border)]">
              <p className="text-xs text-[var(--modal-text-muted)]">Student</p>
              <p className="font-bold text-[var(--modal-text)]">{studentInitials}</p>
            </div>
          )}
          <nav className="space-y-1">
            {STEPS.map(step => {
              const done = step.id < currentStep;
              const active = step.id === currentStep;
              return (
                <button
                  key={step.id}
                  onClick={() => onStepClick?.(step.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    active
                      ? "bg-[#400070] text-white font-semibold"
                      : done
                      ? "text-green-700 hover:bg-green-50"
                      : "text-[var(--modal-text-muted)] hover:bg-gray-50"
                  }`}
                >
                  {done ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 opacity-40" />
                  )}
                  <span className="truncate">{step.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          <div className="modal-card p-6 min-h-[500px]">
            {children}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={onBack} disabled={currentStep === 1}
              className="border-[var(--modal-border)]">
              ← Back
            </Button>
            <div className="flex items-center gap-3">
              {saving && <span className="text-xs text-[var(--modal-text-muted)]">Saving...</span>}
              <Button onClick={onNext} className="bg-[#400070] hover:bg-[#5B00A0] text-white">
                {nextLabel || (currentStep === 10 ? "Finish" : "Next →")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}