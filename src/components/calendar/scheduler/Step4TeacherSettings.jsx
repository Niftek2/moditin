import React from "react";
import { Input } from "@/components/ui/input";
import { Clock, Calendar } from "lucide-react";
import WeeklyGrid from "./WeeklyGrid";

const DAY_LABELS = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri" };
const SESSION_LENGTHS = [15, 20, 30, 45, 60];

export default function Step4TeacherSettings({
  workingHours, onWorkingHoursChange,
  workingDays, onWorkingDaysChange,
  teacherBlocked, onTeacherBlockedChange,
  dateRange, onDateRangeChange,
  durationMinutes, onDurationChange,
}) {
  const startHour = parseInt((workingHours.start || "08:00").split(":")[0]);
  const endHour = Math.min(parseInt((workingHours.end || "17:00").split(":")[0]) + 1, 18);

  const toggleWorkingDay = (num) => {
    onWorkingDaysChange(prev =>
      prev.includes(num)
        ? prev.filter(d => d !== num)
        : [...prev, num].sort((a, b) => a - b)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-[var(--modal-text)] mb-1">Your Schedule & Preferences</h3>
        <p className="text-sm text-[var(--modal-text-muted)]">
          Set your working hours and block out times you're unavailable. The scheduler works around these constraints.
        </p>
      </div>

      {/* Date range */}
      <div>
        <label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Schedule Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Start date</p>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={e => onDateRangeChange(prev => ({ ...prev, startDate: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">End date</p>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={e => onDateRangeChange(prev => ({ ...prev, endDate: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Session length */}
      <div>
        <label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Default Session Length
        </label>
        <div className="flex gap-2 flex-wrap">
          {SESSION_LENGTHS.map(m => (
            <button
              key={m}
              onClick={() => onDurationChange(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                durationMinutes === m
                  ? "bg-[#400070] text-white border-[#400070]"
                  : "border-[var(--modal-border)] text-gray-600 hover:border-[#400070]/30 hover:bg-[#F7F3FA]"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      {/* Working hours */}
      <div>
        <label className="text-xs font-bold text-gray-600 mb-2 block">Working Hours</label>
        <div className="flex items-center gap-3">
          <Input
            type="time"
            value={workingHours.start}
            onChange={e => onWorkingHoursChange(prev => ({ ...prev, start: e.target.value }))}
            className="h-9 text-sm w-32"
          />
          <span className="text-gray-400 text-sm">to</span>
          <Input
            type="time"
            value={workingHours.end}
            onChange={e => onWorkingHoursChange(prev => ({ ...prev, end: e.target.value }))}
            className="h-9 text-sm w-32"
          />
        </div>
      </div>

      {/* Working days */}
      <div>
        <label className="text-xs font-bold text-gray-600 mb-2 block">Working Days</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(num => (
            <button
              key={num}
              onClick={() => toggleWorkingDay(num)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                workingDays.includes(num)
                  ? "bg-[#400070] text-white border-[#400070]"
                  : "border-[var(--modal-border)] text-gray-500 hover:bg-gray-50"
              }`}
            >
              {DAY_LABELS[num]}
            </button>
          ))}
        </div>
      </div>

      {/* Teacher blocked times */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-gray-600">Block Off Your Unavailable Times</label>
          {teacherBlocked.size > 0 && (
            <button
              onClick={() => onTeacherBlockedChange(new Set())}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Click or drag to mark times you're{" "}
          <span className="text-red-500 font-semibold">not available</span> — meetings, lunch, prep, etc.
        </p>
        <WeeklyGrid
          value={teacherBlocked}
          onChange={onTeacherBlockedChange}
          activeColor="red"
          startHour={startHour}
          endHour={endHour}
        />
        {teacherBlocked.size > 0 && (
          <p className="text-xs text-[#400070] mt-2 font-medium">
            {teacherBlocked.size} time slot{teacherBlocked.size !== 1 ? "s" : ""} blocked
          </p>
        )}
      </div>
    </div>
  );
}