import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LABELING_ACTIVITIES } from "./activity-config";
import { format } from "date-fns";

export default function LabelingActivitySetup({ onStart }) {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [sessionDate, setSessionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(format(new Date(), "HH:mm"));
  const [selectedActivity, setSelectedActivity] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const canStart = selectedStudent && sessionDate && selectedActivity;

  const handleStart = () => {
    onStart({
      studentId: selectedStudent,
      sessionDate,
      startTime,
      activityType: selectedActivity,
      activityConfig: LABELING_ACTIVITIES[selectedActivity],
    });
  };

  return (
    <div className="space-y-8">
      {/* Student Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold text-[var(--modal-text)]">Select Student *</Label>
        <Select value={selectedStudent} onValueChange={setSelectedStudent} required>
          <SelectTrigger className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium h-12">
            <SelectValue placeholder="Choose a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.studentInitials}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[var(--modal-text)]">Session Date *</Label>
          <Input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[var(--modal-text)]">Start Time *</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium"
            required
          />
        </div>
      </div>

      {/* Activity Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold text-[var(--modal-text)]">Activity Selection</Label>
        <div className="grid grid-cols-1 gap-3">
          {Object.values(LABELING_ACTIVITIES).map(activity => (
            <button
              key={activity.id}
              type="button"
              onClick={() => setSelectedActivity(activity.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                selectedActivity === activity.id
                  ? "border-[#400070] bg-[#EADDF5]"
                  : "border-[var(--modal-border)] bg-white hover:bg-[var(--modal-card-hover)]"
              }`}
            >
              <p className="font-bold text-[var(--modal-text)]">{activity.title}</p>
              <p className="text-sm text-[var(--modal-text-muted)]">{activity.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <Button
        onClick={handleStart}
        disabled={!canStart}
        className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white font-semibold h-12 rounded-xl disabled:opacity-40"
      >
        Start Activity
      </Button>
    </div>
  );
}