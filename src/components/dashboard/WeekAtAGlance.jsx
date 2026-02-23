import React from "react";
import { parseISO, isToday, startOfWeek, addDays, isSameDay, format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function WeekAtAGlance({ calendarEvents }) {
  const now = new Date();
  // Monday-anchored week
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const weekEvents = calendarEvents.filter(e => {
    try {
      const d = parseISO(e.startDateTime);
      return d >= weekDays[0] && d < addDays(weekDays[4], 1);
    } catch { return false; }
  });

  const totalScheduled = weekEvents.length;
  // "Completed" approximated by events whose endDateTime has passed
  const totalCompleted = weekEvents.filter(e => new Date(e.endDateTime) < now).length;
  const progressPct = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  return (
    <div className="modal-card p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider">Week at a Glance</h2>
      </div>

      {totalScheduled === 0 ? (
        <p className="text-sm text-[var(--modal-text-muted)] text-center py-4">No sessions scheduled this week.</p>
      ) : (
        <>
          {/* Day strip */}
          <div className="grid grid-cols-5 gap-2 mb-5">
            {weekDays.map((day, i) => {
              const dayEvents = weekEvents.filter(e => {
                try { return isSameDay(parseISO(e.startDateTime), day); } catch { return false; }
              });
              const dayCompleted = dayEvents.filter(e => new Date(e.endDateTime) < now).length;
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={i}
                  className={`rounded-2xl p-3 text-center border transition-all ${
                    isCurrentDay
                      ? "bg-[#EADDF5] border-[#6B2FB9]"
                      : "bg-white border-[var(--modal-border)]"
                  }`}
                >
                  <p className={`text-[11px] font-semibold mb-1 ${isCurrentDay ? "text-[#400070]" : "text-[var(--modal-text-muted)]"}`}>
                    {DAY_LABELS[i]}
                  </p>
                  <p className={`text-xl font-bold ${isCurrentDay ? "text-[#400070]" : "text-[var(--modal-text)]"}`}>
                    {dayEvents.length}
                  </p>
                  {/* Dot progress */}
                  {dayEvents.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1.5 flex-wrap">
                      {dayEvents.slice(0, 6).map((e, j) => {
                        const done = new Date(e.endDateTime) < now;
                        return (
                          <div
                            key={j}
                            className={`w-1.5 h-1.5 rounded-full ${done ? "bg-[#6B2FB9]" : "bg-[#D8C5F0]"}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Weekly summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--modal-text-muted)]">
              <span>Scheduled this week: <strong className="text-[var(--modal-text)]">{totalScheduled}</strong></span>
              <span>Completed: <strong className="text-[#6B2FB9]">{totalCompleted}</strong></span>
            </div>
            <div className="w-full h-2 bg-[#EADDF5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6B2FB9] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--modal-text-muted)] text-right">{progressPct}% complete</p>
          </div>
        </>
      )}

      <div className="mt-4 pt-3 border-t border-[var(--modal-border)]">
        <Link
          to={createPageUrl("ServiceHours")}
          className="text-xs text-[#6B2FB9] hover:underline font-medium"
        >
          View monthly hours report →
        </Link>
      </div>
    </div>
  );
}