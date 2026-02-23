import React from "react";
import { format, isSameDay } from "date-fns";
import { Plus } from "lucide-react";
import EventCard from "./EventCard";
import { getEventsForDay } from "./calendarUtils";

export default function DayView({ date, events, onEventClick, onAddClick }) {
  const dayEvents = getEventsForDay(events, date);

  return (
    <div className="flex flex-col h-full">
      <div className="text-center py-3 border-b border-[var(--modal-border)]">
        <p className="text-sm text-[var(--modal-text-muted)]">{format(date, "EEEE")}</p>
        <p className="text-2xl font-bold text-[var(--modal-text)]">{format(date, "d")}</p>
        <p className="text-xs text-[var(--modal-text-muted)]">{format(date, "MMMM yyyy")}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EADDF5] flex items-center justify-center mb-3">
              <Plus className="w-8 h-8 text-[#6B2FB9]" />
            </div>
            <p className="text-sm font-semibold text-[var(--modal-text)]">No events today</p>
            <p className="text-xs text-[var(--modal-text-muted)] mt-1">Tap + to add your first appointment</p>
          </div>
        ) : (
          dayEvents.map(event => (
            <EventCard key={event.id} event={event} onClick={onEventClick} />
          ))
        )}
      </div>

      <div className="p-4">
        <button
          onClick={() => onAddClick(date)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#400070] hover:bg-[#5B00A0] text-white font-semibold shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" /> Add Event
        </button>
      </div>
    </div>
  );
}