import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { EVENT_TYPE_LABELS } from "./calendarUtils";

export default function DriveConflictModal({ conflict, onAdjustTime, onEditDriveTime, onOverride, onClose }) {
  const [bypassReason, setBypassReason] = useState("");
  const [showReason, setShowReason] = useState(false);

  const handleOverride = () => {
    if (!showReason) { setShowReason(true); return; }
    if (!bypassReason.trim()) return;
    onOverride(bypassReason);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-amber-200">
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--modal-text)]">Drive-Time Conflict</h3>
              <p className="text-sm text-[var(--modal-text-muted)] mt-1">
                You have only <strong>{conflict.gapMinutes} min</strong> between appointments but entered <strong>{conflict.driveMinutes} min</strong> of drive time.
              </p>
              {conflict.priorEvent && (
                <p className="text-xs text-[var(--modal-text-muted)] mt-1">
                  Previous: {EVENT_TYPE_LABELS[conflict.priorEvent.eventType]} ends at {format(parseISO(conflict.priorEvent.endDateTime), "h:mm a")}
                </p>
              )}
            </div>
          </div>

          {showReason && (
            <div className="mb-4">
              <label className="text-sm font-semibold text-[var(--modal-text)] block mb-1">Reason for override <span className="text-red-500">*</span></label>
              <Textarea
                value={bypassReason}
                onChange={e => setBypassReason(e.target.value)}
                placeholder="Explain why you're overriding the conflict..."
                className="text-sm"
                rows={3}
              />
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={onAdjustTime} variant="outline" className="w-full justify-start">
              Adjust Event Time
            </Button>
            <Button onClick={onEditDriveTime} variant="outline" className="w-full justify-start">
              Edit Drive Time
            </Button>
            <Button
              onClick={handleOverride}
              disabled={showReason && !bypassReason.trim()}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {showReason ? "Confirm Override" : "Override Anyway"}
            </Button>
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end">
          <button onClick={onClose} className="text-xs text-[var(--modal-text-muted)] hover:underline">Cancel</button>
        </div>
      </div>
    </div>
  );
}