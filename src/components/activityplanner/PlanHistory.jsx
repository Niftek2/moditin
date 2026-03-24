import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function PlanHistory({ plans, studentMap, goalMap, studentGoalMap, onSelect, onDelete }) {
  if (!plans.length) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-[var(--modal-text)] mb-3">Recent Plans</h3>
      <div className="space-y-2">
        {plans.map(plan => {
          const student = studentMap[plan.studentId];
          const sg = studentGoalMap[plan.studentGoalId];
          const goal = sg ? goalMap[sg.goalId] : null;
          return (
            <div
              key={plan.id}
              className="modal-card p-4 flex items-center justify-between gap-3 hover:shadow-md transition-all group cursor-pointer"
              onClick={() => onSelect(plan)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--modal-text)]">
                    {student?.studentInitials || "Unknown"}
                  </span>
                  {plan.date && (
                    <span className="text-xs text-[var(--modal-text-muted)]">
                      · {format(new Date(plan.date), "MMM d, yyyy")}
                    </span>
                  )}
                  <span className="text-xs bg-[#EADDF5] text-[#400070] px-1.5 py-0.5 rounded-full font-medium">
                    {plan.serviceModel || "InPerson"}
                  </span>
                </div>
                {goal && (
                  <p className="text-xs text-[var(--modal-text-muted)] truncate mt-0.5">
                    {goal.annualGoal?.slice(0, 80)}…
                  </p>
                )}
                {plan.communicationFocus?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {plan.communicationFocus.map(f => (
                      <span key={f} className="text-[10px] bg-[#F7F3FA] text-[#6B2FB9] border border-[#EADDF5] px-1.5 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-[var(--modal-text-muted)] hover:text-red-500"
                  onClick={e => { e.stopPropagation(); onDelete(plan.id); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <ChevronRight className="w-4 h-4 text-[var(--modal-text-muted)]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}