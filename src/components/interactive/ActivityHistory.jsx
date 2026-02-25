import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2 } from "lucide-react";
import { TEMPLATE_LABELS, TEMPLATE_ICONS } from "./activityTemplates";
import EmptyState from "../shared/EmptyState";

export default function ActivityHistory({ onSelectActivity }) {
  const { data: activities = [], refetch } = useQuery({
    queryKey: ["activityLog"],
    queryFn: () => base44.entities.ActivityLog.list("-created_date", 100),
  });

  const handleReuse = (activity) => {
    onSelectActivity(activity);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this activity?")) return;
    await base44.entities.ActivityLog.delete(id);
    refetch();
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Emerging: "bg-blue-100 text-blue-800",
      Developing: "bg-yellow-100 text-yellow-800",
      Mastering: "bg-green-100 text-green-800",
    };
    return colors[difficulty] || "bg-gray-100 text-gray-800";
  };

  if (activities.length === 0) {
    return (
      <EmptyState
        title="No saved activities yet"
        description="Generate and save activities to reuse them with your students."
      />
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="modal-card p-4 space-y-3 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{TEMPLATE_ICONS[activity.templateType]}</span>
                <h3 className="font-semibold text-[var(--modal-text)]">{activity.title}</h3>
              </div>
              <p className="text-sm text-[var(--modal-text-muted)] mb-2">
                {TEMPLATE_LABELS[activity.templateType]}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-purple-100 text-purple-800">
                  {activity.gradeBand}
                </Badge>
                <Badge className={getDifficultyColor(activity.difficulty)}>
                  {activity.difficulty}
                </Badge>
                <Badge className="bg-indigo-100 text-indigo-800">
                  {activity.languageLevel}
                </Badge>
              </div>
              {activity.linkedGoalText && (
                <p className="text-xs text-[var(--modal-text-muted)] mt-2 italic">
                  Goal: {activity.linkedGoalText.substring(0, 60)}...
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-[var(--modal-border)]">
            <Button
              onClick={() => handleReuse(activity)}
              variant="outline"
              size="sm"
              className="gap-2 text-[var(--modal-text)] border-[var(--modal-border)]"
            >
              <RotateCcw className="w-3 h-3" />
              Reuse
            </Button>
            <span className="text-xs text-[var(--modal-text-muted)] ml-auto flex items-center">
              {new Date(activity.created_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}