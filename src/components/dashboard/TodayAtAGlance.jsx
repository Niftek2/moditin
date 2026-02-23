import React from "react";
import { format, parseISO, isToday } from "date-fns";

function GlanceTile({ label, value, subtext, accent }) {
  return (
    <div className="flex-1 min-w-0 text-center px-4 py-4">
      <p className="text-3xl font-bold text-[var(--modal-text)]">{value}</p>
      <p className="text-xs font-semibold text-[var(--modal-text)] mt-0.5">{label}</p>
      <p className="text-[11px] text-[var(--modal-text-muted)] mt-0.5">{subtext}</p>
    </div>
  );
}

export default function TodayAtAGlance({ calendarEvents }) {
  const now = new Date();

  const todayEvents = calendarEvents.filter(e => {
    try { return isToday(parseISO(e.startDateTime)); } catch { return false; }
  }).sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  // Sessions today = all today's events (direct service type counts as a "session")
  const sessionsToday = todayEvents.length;

  // Students seen = distinct students from today's events (any event with a studentInitials)
  const studentsSeenSet = new Set(
    todayEvents.filter(e => e.studentInitials).map(e => e.studentInitials)
  );
  const studentsSeen = studentsSeenSet.size;

  // Notes pending = today's direct service events missing notes
  const notesPending = todayEvents.filter(
    e => e.eventType === "DirectService" && !e.notes
  ).length;

  // Next up = next future event today
  const nextUp = todayEvents.find(e => new Date(e.startDateTime) > now);
  const nextUpText = nextUp
    ? `${format(parseISO(nextUp.startDateTime), "h:mm a")}${nextUp.studentInitials ? " · " + nextUp.studentInitials : ""}`
    : "No more sessions";

  return (
    <div className="modal-card p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider">Today at a Glance</h2>
        <span className="text-xs text-[var(--modal-text-muted)]">
          {format(now, "EEEE, MMMM d")}
        </span>
      </div>

      {sessionsToday === 0 ? (
        <p className="text-sm text-[var(--modal-text-muted)] text-center py-4">No sessions scheduled today.</p>
      ) : (
        <div className="flex flex-wrap sm:flex-nowrap divide-y sm:divide-y-0 sm:divide-x divide-[var(--modal-border)]">
          <GlanceTile label="Sessions Today" value={sessionsToday} subtext="scheduled" />
          <GlanceTile label="Students Seen" value={studentsSeen} subtext="with sessions" />
          <GlanceTile label="Notes Pending" value={notesPending} subtext="need documentation" />
          <div className="flex-1 min-w-0 text-center px-4 py-4">
            <p className="text-sm font-bold text-[#400070]">{nextUpText}</p>
            <p className="text-xs font-semibold text-[var(--modal-text)] mt-0.5">Next Up</p>
            <p className="text-[11px] text-[var(--modal-text-muted)] mt-0.5">upcoming session</p>
          </div>
        </div>
      )}
    </div>
  );
}