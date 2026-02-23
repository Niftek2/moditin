import React from "react";
import { format, isSameDay, isToday } from "date-fns";
import { getWeekDays, getEventsForDay, EVENT_COLORS } from "./calendarUtils";
import EventCard from "./EventCard";

export default function WeekView({ date, events, onEventClick, onDayClick }) {
  const days = getWeekDays(date);

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 min-w-[600px]">
        {/* Header */}
        {days.map(day => (
          <button
            key={day.toISOString()}
            onClick={() => onDayClick(day)}
            className={`py-2 text-center border-b border-[var(--modal-border)] transition-colors hover:bg-[#F7F3FA] ${
              isToday(day) ? "bg-[#EADDF5]" : ""
            }`}
          >
            <p className="text-xs text-[var(--modal-text-muted)]">{format(day, "EEE")}</p>
            <p className={`text-sm font-bold mt-0.5 ${isToday(day) ? "text-[#400070]" : "text-[var(--modal-text)]"}`}>
              {format(day, "d")}
            </p>
          </button>
        ))}

        {/* Events row */}
        {days.map(day => {
          const dayEvents = getEventsForDay(events, day);
          return (
            <div
              key={day.toISOString()}
              className={`p-1 border-r border-[var(--modal-border)] min-h-[120px] ${isToday(day) ? "bg-[#F7F3FA]" : ""}`}
            >
              {dayEvents.slice(0, 4).map(event => (
                <EventCard key={event.id} event={event} onClick={onEventClick} compact />
              ))}
              {dayEvents.length > 4 && (
                <p className="text-[10px] text-[var(--modal-text-muted)] px-1 mt-1">+{dayEvents.length - 4} more</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}