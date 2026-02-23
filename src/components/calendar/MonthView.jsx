import React from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { getEventsForDay, EVENT_COLORS } from "./calendarUtils";

export default function MonthView({ date, events, onDayClick }) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 text-center border-b border-[var(--modal-border)] pb-2 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <p key={d} className="text-xs font-semibold text-[var(--modal-text-muted)]">{d}</p>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {days.map(day => {
          const dayEvents = getEventsForDay(events, day);
          const inMonth = isSameMonth(day, date);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`min-h-[72px] p-1 border-b border-r border-[var(--modal-border)] text-left hover:bg-[#F7F3FA] transition-colors ${
                !inMonth ? "opacity-40" : ""
              } ${today ? "bg-[#EADDF5]" : ""}`}
            >
              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                today ? "bg-[#400070] text-white" : "text-[var(--modal-text)]"
              }`}>
                {format(day, "d")}
              </span>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map(event => {
                  const colors = EVENT_COLORS[event.eventType] || EVENT_COLORS.Other;
                  return (
                    <div key={event.id} className={`text-[10px] font-semibold px-1 rounded truncate ${colors.bg} ${colors.text}`}>
                      {event.studentInitials || event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <p className="text-[10px] text-[var(--modal-text-muted)] px-1">+{dayEvents.length - 2}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}