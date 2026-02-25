import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import EmptyState from "../shared/EmptyState";
import { Activity } from "lucide-react";

const ACTIVITY_LABELS = {
  hearingAid: "Hearing Aid",
  cochlearImplant: "Cochlear Implant",
};

export default function ActivityHistory({ studentId }) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["labelingActivities", studentId],
    queryFn: () => base44.entities.LabelingActivityRecord.filter({
      studentId,
    }, "-created_date"),
  });

  if (isLoading) {
    return <div className="text-center text-[var(--modal-text-muted)]">Loading...</div>;
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No labeling activities yet"
        description="Complete a labeling activity to see history here"
      />
    );
  }

  return (
    <div className="space-y-3">
      {activities.map(activity => (
        <div key={activity.id} className="modal-card p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-[var(--modal-text)]">
                {ACTIVITY_LABELS[activity.activityType]}
              </p>
              <p className="text-xs text-[var(--modal-text-muted)]">
                {format(new Date(activity.sessionDate), "MMM d, yyyy")} at {activity.startTime}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#400070] text-lg">
                {activity.correctLabels}/{activity.totalLabels}
              </p>
              <p className="text-xs text-[var(--modal-text-muted)]">Correct</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-[var(--modal-text-muted)]">Duration:</span>
              <span className="font-medium text-[var(--modal-text)]">
                {Math.floor(activity.durationSeconds / 60)}m {activity.durationSeconds % 60}s
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[var(--modal-text-muted)]">Attempts:</span>
              <span className="font-medium text-[var(--modal-text)]">{activity.incorrectAttempts}</span>
            </div>
            {activity.linkedToSession && (
              <div className="flex items-center gap-1 text-green-600 font-medium">
                ✓ Added to session notes
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}