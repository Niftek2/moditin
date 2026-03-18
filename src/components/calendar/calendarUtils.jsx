import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMinutes } from "date-fns";

export const EVENT_COLORS = {
  DirectService: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300", dot: "#7C3AED" },
  Consultation: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", dot: "#2563EB" },
  Evaluation: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", dot: "#D97706" },
  IEPMeeting: { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-300", dot: "#E11D48" },
  Planning: { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-300", dot: "#0D9488" },
  Travel: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", dot: "#6B7280" },
  Other: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-300", dot: "#4338CA" },
};

export const EVENT_TYPE_LABELS = {
  DirectService: "Direct Service",
  Consultation: "Consultation",
  Evaluation: "Evaluation",
  IEPMeeting: "IEP Meeting",
  Planning: "Planning",
  Travel: "Travel",
  Other: "Other",
};

export const SETTING_LABELS = {
  InPerson: "In-Person",
  Telepractice: "Telepractice",
  Hybrid: "Hybrid",
  NotApplicable: "N/A",
};

export function getWeekDays(date) {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

export function getEventsForDay(events, day) {
  return events
    .filter(e => isSameDay(parseISO(e.startDateTime), day))
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
}

// travelBufferMinutes: optional override (used by SchedulerEngine); falls back to event's own driveTimeMinutes
export function checkDriveConflict(events, newEvent, day, travelBufferMinutes) {
  if (!["InPerson", "Hybrid"].includes(newEvent.setting)) return null;

  const driveMinutes = travelBufferMinutes != null
    ? travelBufferMinutes
    : (newEvent.driveTimeIncluded ? newEvent.driveTimeMinutes : null);
  if (!driveMinutes) return null;

  const dayEvents = getEventsForDay(events, day).filter(e => e.id !== newEvent.id);

  // Check PRIOR event (original direction)
  const priorEvents = dayEvents.filter(e => new Date(e.endDateTime) <= new Date(newEvent.startDateTime));
  if (priorEvents.length > 0) {
    const prior = priorEvents[priorEvents.length - 1];
    if (["InPerson", "Hybrid"].includes(prior.setting)) {
      const gapMinutes = Math.round((new Date(newEvent.startDateTime) - new Date(prior.endDateTime)) / 60000);
      if (gapMinutes < driveMinutes) {
        return { gapMinutes, driveMinutes, priorEvent: prior };
      }
    }
  }

  // Check NEXT event (bi-directional addition)
  const nextEvents = dayEvents.filter(e => new Date(e.startDateTime) >= new Date(newEvent.endDateTime));
  if (nextEvents.length > 0) {
    const next = nextEvents[0];
    if (["InPerson", "Hybrid"].includes(next.setting)) {
      const gapMinutes = Math.round((new Date(next.startDateTime) - new Date(newEvent.endDateTime)) / 60000);
      if (gapMinutes < driveMinutes) {
        return { gapMinutes, driveMinutes, priorEvent: next };
      }
    }
  }

  return null;
}

export function formatTimeRange(start, end) {
  return `${format(parseISO(start), "h:mm a")} – ${format(parseISO(end), "h:mm a")}`;
}