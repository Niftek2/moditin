import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { EQUIPMENT_LABELS, ISSUE_LABELS } from "./troubleshootingSteps";

export default function TroubleshootingHistory({ sessions }) {
  const [expanded, setExpanded] = useState(null);

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[var(--modal-text-muted)]">No troubleshooting sessions yet</p>
      </div>
    );
  }

  const outcomeColors = {
    Resolved: "bg-green-100 text-green-700",
    PartiallyResolved: "bg-amber-100 text-amber-700",
    Referred: "bg-blue-100 text-blue-700"
  };

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <div key={session.id} className="modal-card overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === session.id ? null : session.id)}
            className="w-full p-4 text-left hover:bg-[var(--modal-card-hover)] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium text-[var(--modal-text)]">
                    {EQUIPMENT_LABELS[session.equipmentType]}
                  </p>
                  <p className="text-xs text-[var(--modal-text-muted)]">
                    {ISSUE_LABELS[session.issueType]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-[10px] border-0 ${outcomeColors[session.outcome] || ""}`}>
                  {session.outcome}
                </Badge>
                {expanded === session.id ? (
                  <ChevronUp className="w-4 h-4 text-[var(--modal-text-muted)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--modal-text-muted)]" />
                )}
              </div>
            </div>
            <p className="text-xs text-[var(--modal-text-muted)]">
              {new Date(session.created_date).toLocaleDateString()}
            </p>
          </button>

          {expanded === session.id && (
            <div className="px-4 pb-4 space-y-3 border-t border-[var(--modal-border)] pt-3">
              {session.recurringFlag && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Recurring issue detected. Consider contacting audiology.</p>
                </div>
              )}

              {session.stepsTaken && session.stepsTaken.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase mb-2">Steps Completed</p>
                  <div className="space-y-1">
                    {session.stepsTaken.map((step, idx) => (
                      <p key={idx} className="text-xs text-[var(--modal-text)]">
                        <span className="font-medium">Step {step.stepNumber}:</span> {step.response}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {session.notes && (
                <div>
                  <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase mb-1">Notes</p>
                  <p className="text-xs text-[var(--modal-text)]">{session.notes}</p>
                </div>
              )}

              {session.referralSuggested && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  Referral recommended. Follow district procedures.
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}