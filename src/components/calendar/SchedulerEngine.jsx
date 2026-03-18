/**
 * SchedulerEngine — pure-function utility module.
 * No React components. No side-effects. No PII in AI payloads.
 *
 * Exports:
 *   isWithinWorkingHours   — slot boundary check against teacher working hours
 *   isWithinAvailability   — slot check against student availability windows
 *   hasConflict            — slot overlap check with travel buffer padding
 *   findFirstAvailableSlot — greedy next-available-slot search (15-min granularity)
 *   groupStudentsByLocation — cluster students by locationId
 *   runGreedySchedule      — deterministic schedule generator
 *   runAIOptimize          — anonymized LLM travel-optimization pass (opt-in only)
 */

import { format, addMinutes } from "date-fns";
import { base44 } from "@/api/base44Client";

// ---------------------------------------------------------------------------
// Time-window helpers
// ---------------------------------------------------------------------------

/** Returns true if [slotStart, slotEnd) lies entirely within the teacher's working hours for that day. */
export function isWithinWorkingHours(slotStart, slotEnd, workingHours) {
  const [startHH, startMM] = (workingHours?.start || "08:00").split(":").map(Number);
  const [endHH,   endMM]   = (workingHours?.end   || "17:00").split(":").map(Number);
  const dayStr = format(slotStart, "yyyy-MM-dd");
  const wStart = new Date(`${dayStr}T${pad(startHH)}:${pad(startMM)}`);
  const wEnd   = new Date(`${dayStr}T${pad(endHH)}:${pad(endMM)}`);
  return slotStart >= wStart && slotEnd <= wEnd;
}

/**
 * Returns true if slotStart falls within any availability window the student has
 * for that day-of-week.  If no windows are defined the student is treated as
 * always available.
 */
export function isWithinAvailability(slotStart, student) {
  const windows = student?.availabilityWindows;
  if (!windows) return true;
  const dow = slotStart.getDay();
  const dayWindows = windows[dow];
  if (!dayWindows || dayWindows.length === 0) return false;
  const timeStr = format(slotStart, "HH:mm");
  return dayWindows.some(w => timeStr >= w.start && timeStr < w.end);
}

// ---------------------------------------------------------------------------
// Conflict detection
// ---------------------------------------------------------------------------

/**
 * Returns true if [slotStart, slotEnd) overlaps any committed event after
 * padding each committed event with ±travelBuffer minutes.
 */
export function hasConflict(slotStart, slotEnd, committedEvents, travelBuffer = 0) {
  return committedEvents.some(e => {
    const eStart = new Date(e.startDateTime);
    const eEnd   = new Date(e.endDateTime);
    const bufferedStart = new Date(eStart.getTime() - travelBuffer * 60000);
    const bufferedEnd   = new Date(eEnd.getTime()   + travelBuffer * 60000);
    return slotStart < bufferedEnd && slotEnd > bufferedStart;
  });
}

// ---------------------------------------------------------------------------
// Slot finder
// ---------------------------------------------------------------------------

/**
 * Greedy search: walks through a single day in 15-min steps and returns the
 * first slot of `durationMinutes` that:
 *   • lies within working hours
 *   • does not conflict with any committedEvents (travel-buffer aware)
 *
 * Returns { start: ISO, end: ISO } or null.
 */
export function findFirstAvailableSlot(date, durationMinutes, committedEvents, workingHours, travelBuffer = 0) {
  const [startHH, startMM] = (workingHours?.start || "08:00").split(":").map(Number);
  const [endHH,   endMM]   = (workingHours?.end   || "17:00").split(":").map(Number);
  const dayStr = format(date, "yyyy-MM-dd");
  let   cursor = new Date(`${dayStr}T${pad(startHH)}:${pad(startMM)}`);
  const dayEnd = new Date(`${dayStr}T${pad(endHH)}:${pad(endMM)}`);

  while (cursor < dayEnd) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    if (slotEnd > dayEnd) break;
    if (
      isWithinWorkingHours(cursor, slotEnd, workingHours) &&
      !hasConflict(cursor, slotEnd, committedEvents, travelBuffer)
    ) {
      return { start: cursor.toISOString(), end: slotEnd.toISOString() };
    }
    cursor = addMinutes(cursor, 15);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Location grouping
// ---------------------------------------------------------------------------

/** Cluster students by locationId for travel-minimizing scheduling. */
export function groupStudentsByLocation(students) {
  return students.reduce((acc, s) => {
    const key = s.locationId || "unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
}

// ---------------------------------------------------------------------------
// Deterministic greedy scheduler
// ---------------------------------------------------------------------------

/**
 * Generates an array of draft CalendarEvent shells (not yet persisted).
 *
 * Algorithm (greedy / deterministic):
 *   For each day in dateRange:
 *     For each locationId group (travel-minimizing order):
 *       For each student in the group:
 *         Find first available slot respecting workingHours, travelBuffer,
 *         and the student's availabilityWindows.
 *         Append to drafts and treat as occupied for subsequent searches.
 */
export function runGreedySchedule({
  students,
  dateRange,
  committedEvents,
  workingHours,
  travelBuffer = 0,
  durationMinutes = 30,
}) {
  const { startDate, endDate } = dateRange;
  const grouped   = groupStudentsByLocation(students);
  const drafts    = [];

  const allDays = [];
  let d = new Date(startDate);
  const stop = new Date(endDate);
  while (d <= stop) {
    allDays.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  for (const day of allDays) {
    const dayStr = format(day, "yyyy-MM-dd");

    // committed + already-drafted events for this day
    const occupied = [
      ...committedEvents.filter(e => format(new Date(e.startDateTime), "yyyy-MM-dd") === dayStr),
      ...drafts.filter(e => format(new Date(e.startDateTime), "yyyy-MM-dd") === dayStr),
    ];

    for (const locationStudents of Object.values(grouped)) {
      for (const student of locationStudents) {
        const slot = findFirstAvailableSlot(day, durationMinutes, occupied, workingHours, travelBuffer);
        if (!slot) continue;
        if (!isWithinAvailability(new Date(slot.start), student)) continue;

        const draft = {
          title:         `Session — ${student.studentInitials || "Student"}`,
          eventType:     "DirectService",
          startDateTime: slot.start,
          endDateTime:   slot.end,
          setting:       student.serviceDeliveryModel || "InPerson",
          studentId:     student.id,
          studentInitials: student.studentInitials || "",
          locationLabel: student.locationId || undefined,
          driveTimeMinutes: travelBuffer,
          driveTimeIncluded: travelBuffer > 0,
          isDraft: true,
        };

        drafts.push(draft);
        occupied.push(draft);
      }
    }
  }

  return drafts;
}

// ---------------------------------------------------------------------------
// AI optimization pass  (opt-in — caller must invoke explicitly)
// ---------------------------------------------------------------------------

/**
 * Sends an ANONYMIZED payload to the LLM (locationId + durations only — NO
 * student names, initials, IDs, or any PII) and returns reordered draft events
 * grouped by location to minimise travel.
 *
 * Falls back to the original draft array on any error.
 */
export async function runAIOptimize({ drafts, travelBuffer = 0 }) {
  // Build anonymized payload: index → locationId + timing only
  const anonymized = drafts.map((d, i) => ({
    index:           i,
    locationId:      d.locationLabel || "unassigned",
    travelBuffer,
    sessionDuration: Math.round((new Date(d.endDateTime) - new Date(d.startDateTime)) / 60000),
    startDateTime:   d.startDateTime,
  }));

  let result;
  try {
    result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a schedule optimizer. Reorder these anonymous session slots to minimise travel between different locationIds by grouping sessions at the same locationId consecutively on each day where possible. Do NOT add, remove, or rename any items. Return the same array reordered.
Sessions: ${JSON.stringify(anonymized)}`,
      response_json_schema: {
        type: "object",
        properties: {
          optimized: {
            type: "array",
            items: {
              type: "object",
              properties: {
                index:           { type: "integer" },
                locationId:      { type: "string" },
                startDateTime:   { type: "string" },
                sessionDuration: { type: "integer" },
              },
            },
          },
        },
      },
    });
  } catch {
    return drafts; // graceful fallback
  }

  if (!result?.optimized?.length) return drafts;

  // Re-map anonymized result back onto original draft objects (PII restored from original array)
  return result.optimized.map(opt => {
    const original = drafts[opt.index] ?? drafts[0];
    const newStart = new Date(opt.startDateTime);
    const newEnd   = addMinutes(newStart, opt.sessionDuration);
    return {
      ...original,
      startDateTime: newStart.toISOString(),
      endDateTime:   newEnd.toISOString(),
      locationLabel: opt.locationId !== "unassigned" ? opt.locationId : original.locationLabel,
    };
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function pad(n) { return String(n).padStart(2, "0"); }