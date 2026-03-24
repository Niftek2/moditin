import React from "react";
import { CalendarDays, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "../shared/EmptyState";

export default function PlanDisplay({ plan, selectedGoal, serviceModel, communicationFocus, hearingTech }) {
  if (!plan) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No plan generated yet"
        description="Select a student, goal, and session details, then click Generate Plan."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Goal */}
      {selectedGoal && (
        <div className="modal-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-[var(--modal-text-muted)] mb-1">IEP Goal</h3>
          <p className="text-sm text-[var(--modal-text)]">{selectedGoal.annualGoal}</p>
          {selectedGoal.objectives?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-[var(--modal-text-muted)] mb-1">Objectives</p>
              <ol className="space-y-1">
                {selectedGoal.objectives.map((o, i) => (
                  <li key={i} className="text-xs text-[var(--modal-text)]">{i + 1}. {o}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* TODHH Meta */}
      {(communicationFocus?.length > 0 || hearingTech) && (
        <div className="modal-card p-4 flex flex-wrap gap-4">
          {communicationFocus?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--modal-text-muted)] mb-1">Communication Focus</p>
              <div className="flex flex-wrap gap-1">
                {communicationFocus.map(f => (
                  <span key={f} className="text-xs bg-[#EADDF5] text-[#400070] font-medium px-2 py-0.5 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          )}
          {hearingTech && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--modal-text-muted)] mb-1">Hearing Tech</p>
              <p className="text-xs text-[var(--modal-text)]">{hearingTech}</p>
            </div>
          )}
        </div>
      )}

      {/* Session Activities */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Warm-Up", content: plan.warmup },
          { label: "Core Activity", content: plan.coreActivity },
          { label: "Wrap-Up", content: plan.wrapUp },
        ].map(section => (
          <div key={section.label} className="modal-card p-4">
            <h4 className="text-xs uppercase tracking-wider text-[var(--modal-purple-glow)] mb-2">{section.label}</h4>
            <p className="text-sm text-[var(--modal-text)]">{section.content}</p>
          </div>
        ))}
      </div>

      {/* Environmental Adaptations */}
      {plan.environmentalAdaptations && (
        <div className="modal-card p-4">
          <h4 className="text-xs uppercase tracking-wider text-[var(--modal-text-muted)] mb-2">Environmental Adaptations</h4>
          <p className="text-sm text-[var(--modal-text)]">{plan.environmentalAdaptations}</p>
        </div>
      )}

      {/* Visual Supports */}
      {plan.visualSupportsPlanned && (
        <div className="modal-card p-4">
          <h4 className="text-xs uppercase tracking-wider text-[var(--modal-text-muted)] mb-2">Visual Supports Planned</h4>
          <p className="text-sm text-[var(--modal-text)]">{plan.visualSupportsPlanned}</p>
        </div>
      )}

      {/* Materials */}
      {plan.materialsList?.length > 0 && (
        <div className="modal-card p-4">
          <h4 className="text-xs uppercase tracking-wider text-[var(--modal-text-muted)] mb-2">Materials</h4>
          <ul className="space-y-1">
            {plan.materialsList.map((m, i) => (
              <li key={i} className="text-sm text-[var(--modal-text)] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--modal-purple-glow)] shrink-0" />{m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Collection */}
      <div className="modal-card p-4 border-l-4 border-[#400070]">
        <h4 className="text-xs uppercase tracking-wider text-[var(--modal-text-muted)] mb-2">Data Collection Prompt</h4>
        <p className="text-sm text-[var(--modal-text)]">{plan.dataCollectionPrompt}</p>
      </div>
    </div>
  );
}