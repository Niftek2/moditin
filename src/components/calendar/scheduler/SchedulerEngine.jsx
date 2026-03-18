/**
 * SchedulerEngine — pure-function utility module.
 * IEP-aware, location-clustered, teacher-block-respecting greedy scheduler.
 */

import { format, addMinutes } from "date-fns";
import { base44 } from "@/api/base44Client";

function pad(n) { return String(n).padStart(2, "0"); }

// ---------------------------------------------------------------------------
// How many sessions per week does this student need?
// ---------------------------------------------------------------------------
export function weeklySessionsNeeded(student, durationMinutes = 30) {
  if (student.consultOnly) return 0;
  const { directMinutes = 0, directMinutesFrequency = "Weekly" } = student;
  if (!directMinutes) return 0;
  const mult = {
    Daily: 5,
    Weekly: 1,
    Monthly: 1 / 4.33,
    Annually: 1 / 36,
  }[directMinutesFrequency] ?? 1;
  return Math.max(1, Math.round((directMinutes * mult) / durationMinutes));
}

// ---------------------------------------------------------------------------
// Working-hours check
// ---------------------------------------------------------------------------
export function isWithinWorkingHours(slotStart, slotEnd, workingHours) {
  const [startHH, startMM] = (workingHours?.start || "08:00").split(":").map(Number);
  const [endHH, endMM]     = (workingHours?.end   || "17:00").split(":").map(Number);
  const dayStr = format(slotStart, "yyyy-MM-dd");
  const wStart = new Date(`${dayStr}T${pad(startHH)}:${pad(startMM)}`);
  const wEnd   = new Date(`${dayStr}T${pad(endHH)}:${pad(endMM)}`);
  return slotStart >= wStart && slotEnd <= wEnd;
}

// ---------------------------------------------------------------------------
// Student availability check (green grid)
// ---------------------------------------------------------------------------
export function isWithinAvailability(slotStart, studentAvailSet) {
  if (!studentAvailSet || studentAvailSet.size === 0) return true;
  const dow  = slotStart.getDay();
  const time = format(slotStart, "HH:mm");
  return studentAvailSet.has(`${dow}-${time}`);
}

// ---------------------------------------------------------------------------
// Teacher-blocked check (red grid)
// ---------------------------------------------------------------------------
export function isTeacherBlocked(slotStart, teacherBlockedSet) {
  if (!teacherBlockedSet || teacherBlockedSet.size === 0) return false;
  const dow  = slotStart.getDay();
  const time = format(slotStart, "HH:mm");
  return teacherBlockedSet.has(`${dow}-${time}`);
}

// ---------------------------------------------------------------------------
// Conflict check (against events already placed)
// ---------------------------------------------------------------------------
export function hasConflict(slotStart, slotEnd, occupiedEvents, travelMinutes = 0) {
  return occupiedEvents.some(e => {
    const eStart = new Date(e.startDateTime);
    const eEnd   = new Date(e.endDateTime);
    const buffStart = new Date(eStart.getTime() - travelMinutes * 60000);
    const buffEnd   = new Date(eEnd.getTime()   + travelMinutes * 60000);
    return slotStart < buffEnd && slotEnd > buffStart;
  });
}

// ---------------------------------------------------------------------------
// Find next available slot on a given day for a given student
// ---------------------------------------------------------------------------
export function findFirstAvailableSlot({
  date, durationMinutes, occupiedEvents, workingHours, workingDays,
  teacherBlockedSet, studentAvailSet, travelMinutes = 0,
}) {
  const dow = date.getDay();
  if (workingDays && !workingDays.includes(dow)) return null;

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
      !isTeacherBlocked(cursor, teacherBlockedSet) &&
      isWithinAvailability(cursor, studentAvailSet) &&
      !hasConflict(cursor, slotEnd, occupiedEvents, travelMinutes)
    ) {
      return { start: cursor.toISOString(), end: slotEnd.toISOString() };
    }
    cursor = addMinutes(cursor, 15);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Greedy IEP-aware scheduler
// ---------------------------------------------------------------------------
export function runGreedySchedule({
  students,
  dateRange,
  committedEvents,
  workingHours,
  workingDays = [1, 2, 3, 4, 5],
  travelMatrix = {},     // { "locA|locB": minutes }
  durationMinutes = 30,
  studentAvailability = {}, // { studentId: Set<"dayNum-HH:mm"> }
  teacherBlockedSet = new Set(),
}) {
  const { startDate, endDate } = dateRange;
  const drafts = [];

  // Build day list
  const allDays = [];
  let d = new Date(startDate + "T12:00:00");
  const stop = new Date(endDate + "T12:00:00");
  while (d <= stop) {
    allDays.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  // Group students by location for clustering
  const grouped = {};
  for (const s of students) {
    const key = s.locationId || "__none__";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const locationGroups = Object.values(grouped);

  // Track how many sessions each student has been given per week
  const sessionCount = {};
  const weeklyNeeded = {};
  students.forEach(s => {
    sessionCount[s.id] = 0;
    weeklyNeeded[s.id] = weeklySessionsNeeded(s, durationMinutes);
  });

  // Build week buckets
  const weeks = {};
  allDays.forEach(day => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dow = day.getDay();
    // Week key: date of the Monday of that week
    const monday = new Date(day);
    monday.setDate(day.getDate() - ((dow + 6) % 7));
    const weekKey = format(monday, "yyyy-MM-dd");
    if (!weeks[weekKey]) weeks[weekKey] = [];
    weeks[weekKey].push(dayStr);
  });

  const allDayStrings = allDays.map(d => format(d, "yyyy-MM-dd"));

  for (const dayStr of allDayStrings) {
    const day = new Date(dayStr + "T12:00:00");
    const dow = day.getDay();
    if (workingDays && !workingDays.includes(dow)) continue;

    // committed + already-drafted events for this day
    const occupied = [
      ...committedEvents.filter(e => format(new Date(e.startDateTime), "yyyy-MM-dd") === dayStr),
      ...drafts.filter(e => format(new Date(e.startDateTime), "yyyy-MM-dd") === dayStr),
    ];

    // Figure out current location from last event on this day (for travel buffer)
    const getTravel = (fromLoc, toLoc) => {
      if (!fromLoc || !toLoc || fromLoc === toLoc) return 0;
      return travelMatrix[`${fromLoc}|${toLoc}`] || travelMatrix[`${toLoc}|${fromLoc}`] || 0;
    };

    for (const group of locationGroups) {
      for (const student of group) {
        // Check weekly quota
        const monday = new Date(day);
        monday.setDate(day.getDate() - ((dow + 6) % 7));
        const weekKey = format(monday, "yyyy-MM-dd");
        const sessionsSoFarThisWeek = drafts.filter(e => {
          const eDow = new Date(e.startDateTime);
          const eMonday = new Date(eDow);
          eMonday.setDate(eDow.getDate() - ((eDow.getDay() + 6) % 7));
          return format(eMonday, "yyyy-MM-dd") === weekKey && e.studentId === student.id;
        }).length;

        const needed = weeklyNeeded[student.id] || 1;
        if (sessionsSoFarThisWeek >= needed) continue;

        // Determine travel buffer from last event on day
        const lastEvent = occupied.length > 0 ? occupied[occupied.length - 1] : null;
        const lastLoc = lastEvent?.locationLabel || null;
        const travelMinutes = getTravel(lastLoc, student.locationId || null);

        const slot = findFirstAvailableSlot({
          date: day,
          durationMinutes,
          occupiedEvents: occupied,
          workingHours,
          workingDays,
          teacherBlockedSet,
          studentAvailSet: studentAvailability[student.id],
          travelMinutes,
        });

        if (!slot) continue;

        const draft = {
          title:           `${student.studentInitials || "Session"}`,
          eventType:       "DirectService",
          startDateTime:   slot.start,
          endDateTime:     slot.end,
          setting:         student.serviceDeliveryModel || "InPerson",
          studentId:       student.id,
          studentInitials: student.studentInitials || "",
          locationLabel:   student.locationId || undefined,
          driveTimeMinutes: travelMinutes,
          driveTimeIncluded: travelMinutes > 0,
          isDraft:         true,
        };

        drafts.push(draft);
        occupied.push(draft);

        // If travel needed, push a placeholder travel block
        if (travelMinutes > 0 && lastLoc) {
          const travelStart = new Date(slot.end);
          const travelEnd   = addMinutes(travelStart, 0); // already incorporated in buffer
          // We don't add a real travel event but the buffer is in the conflict check
        }
      }
    }
  }

  return drafts;
}

// ---------------------------------------------------------------------------
// AI optimization pass (opt-in)
// ---------------------------------------------------------------------------
export async function runAIOptimize({ drafts, travelMatrix = {} }) {
  const anonymized = drafts.map((d, i) => ({
    index:           i,
    locationId:      d.locationLabel || "unassigned",
    sessionDuration: Math.round((new Date(d.endDateTime) - new Date(d.startDateTime)) / 60000),
    startDateTime:   d.startDateTime,
  }));

  let result;
  try {
    result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a schedule optimizer. Reorder these anonymous session slots to minimize travel between different locationIds by grouping sessions at the same locationId consecutively on each day where possible. Do NOT add, remove, or rename any items. Return the same array reordered.
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
    return drafts;
  }

  if (!result?.optimized?.length) return drafts;

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