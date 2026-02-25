import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function CompletionScreen({ 
  result, 
  studentId, 
  sessionDate, 
  startTime, 
  activityType,
  onClose 
}) {
  const [linking, setLinking] = useState(false);
  const [correctLabels, setCorrectLabels] = useState(0);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getActivityTitle = () => {
    return activityType === "hearingAid" ? "Hearing Aid" : "Cochlear Implant";
  };

  const handleAddToSession = async () => {
    setLinking(true);
    try {
      const summary = `---\nLabeling Activity: ${getActivityTitle()}\nIdentified ${correctLabels}/${result.totalLabels} components.\nDuration: ${formatDuration(result.durationSeconds)}.\n---`;

      // Search for existing session
      const sessions = await base44.entities.ServiceEntry.filter({
        studentId,
        sessionDate,
      });

      let sessionId = null;

      if (sessions.length > 0) {
        // Find session within ±60 min tolerance
        const targetMinutes = parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]);
        const matchedSession = sessions.find(s => {
          const sMin = parseInt(s.startTime?.split(":")[0] || 0) * 60 + parseInt(s.startTime?.split(":")[1] || 0);
          return Math.abs(sMin - targetMinutes) <= 60;
        });

        if (matchedSession) {
          sessionId = matchedSession.id;
          const updatedNotes = (matchedSession.notes || "") + "\n" + summary;
          await base44.entities.ServiceEntry.update(sessionId, { notes: updatedNotes });
        }
      }

      if (!sessionId) {
        // Create lightweight session
        const newSession = await base44.entities.ServiceEntry.create({
          studentId,
          sessionDate,
          startTime,
          duration: Math.ceil(result.durationSeconds / 60),
          notes: summary,
        });
        sessionId = newSession.id;
      }

      // Record the activity
      await base44.entities.LabelingActivityRecord.create({
        studentId,
        activityType,
        sessionDate,
        startTime,
        durationMinutes: Math.ceil(result.durationSeconds / 60),
        correctLabels,
        totalLabels: result.totalLabels,
        durationSeconds: result.durationSeconds,
        linkedToSession: true,
        sessionId,
      });

      onClose();
    } catch (error) {
      console.error("Error linking session:", error);
      // Still close gracefully
      onClose();
    }
  };

  const handleSkip = async () => {
    setLinking(true);
    try {
      await base44.entities.LabelingActivityRecord.create({
        studentId,
        activityType,
        sessionDate,
        startTime,
        durationMinutes: Math.ceil(result.durationSeconds / 60),
        correctLabels,
        totalLabels: result.totalLabels,
        durationSeconds: result.durationSeconds,
        linkedToSession: false,
        sessionId: null,
      });
      onClose();
    } catch (error) {
      console.error("Error saving activity:", error);
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 space-y-6 modal-card">
      {/* Header */}
      <div className="flex items-center justify-center gap-3">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-[var(--modal-text)]">Activity Complete</h2>
      </div>

      {/* Summary */}
      <div className="space-y-4 bg-[var(--modal-bg)] rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-[var(--modal-text-muted)] text-sm">Activity</span>
          <span className="font-semibold text-[var(--modal-text)]">{getActivityTitle()}</span>
        </div>
        <div className="space-y-2">
          <label className="text-[var(--modal-text-muted)] text-sm">How many labels were correct?</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max={result.totalLabels}
              value={correctLabels}
              onChange={(e) => setCorrectLabels(Math.min(Math.max(parseInt(e.target.value) || 0, 0), result.totalLabels))}
              className="w-16 px-3 py-2 border-2 border-[var(--modal-border)] rounded-lg font-semibold text-[#400070] text-center"
            />
            <span className="text-[var(--modal-text)] font-semibold">/ {result.totalLabels}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--modal-text-muted)] text-sm">Duration</span>
          <span className="font-semibold text-[var(--modal-text)]">{formatDuration(result.durationSeconds)}</span>
        </div>
      </div>

      {/* Prompt */}
      <div className="text-center">
        <p className="text-[var(--modal-text)] font-semibold">Add this to session notes?</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleSkip}
          disabled={linking}
          className="flex-1 border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-semibold hover:bg-[var(--modal-card-hover)]"
        >
          No, Close
        </Button>
        <Button
          onClick={handleAddToSession}
          disabled={linking}
          className="flex-1 bg-[#400070] hover:bg-[#5B00A0] text-white font-semibold"
        >
          {linking ? "Saving..." : "Yes, Add to Session"}
        </Button>
      </div>
    </div>
  );
}