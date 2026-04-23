import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isBefore, startOfDay
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle2, AlertCircle, Calendar, Plus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventForm from "../calendar/EventForm";
import { useDemo } from "../demo/DemoContext";

const EVENT_COLORS = {
  DirectService: "bg-[#6B2FB9] text-white",
  Consultation: "bg-blue-500 text-white",
  Evaluation: "bg-amber-500 text-white",
  IEPMeeting: "bg-rose-500 text-white",
  Planning: "bg-teal-500 text-white",
  Travel: "bg-gray-400 text-white",
  Other: "bg-slate-500 text-white",
};

export default function StudentCalendarView({ studentId, student }) {
  const queryClient = useQueryClient();
  const { isDemoMode, demoData } = useDemo();
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [rescheduleEvent, setRescheduleEvent] = useState(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["calendarEvents", studentId, isDemoMode],
    queryFn: () => {
      if (isDemoMode) return demoData.calendarEvents.filter(e => e.studentId === studentId);
      return base44.entities.CalendarEvent.filter({ studentId });
    },
    enabled: !!studentId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", studentId, isDemoMode],
    queryFn: () => {
      if (isDemoMode) return demoData.services.filter(s => s.studentId === studentId);
      return base44.entities.ServiceEntry.filter({ studentId });
    },
    enabled: !!studentId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingEvent?.id
        ? base44.entities.CalendarEvent.update(editingEvent.id, data)
        : base44.entities.CalendarEvent.create({ ...data, studentId, studentInitials: student?.studentInitials || "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents", studentId] });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      setShowForm(false);
      setEditingEvent(null);
    },
  });

  // Build day grid
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Map events by day
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      const key = format(parseISO(ev.startDateTime), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  // Determine attendance status — if a service entry exists for the event's date, count as attended
  const servicesByDate = useMemo(() => {
    const map = {};
    services.forEach(s => {
      const d = s.date || s.sessionDate;
      if (d) map[d] = (map[d] || 0) + (s.minutes ?? s.durationMinutes ?? 0);
    });
    return map;
  }, [services]);

  const getAttendanceStatus = (event) => {
    const eventDate = format(parseISO(event.startDateTime), "yyyy-MM-dd");
    const isPast = isBefore(parseISO(event.startDateTime), startOfDay(new Date()));
    if (!isPast) return "upcoming";
    if (event.eventType !== "DirectService") return "past";
    return servicesByDate[eventDate] ? "attended" : "missed";
  };

  // Stats for current month
  const monthStats = useMemo(() => {
    const monthEvents = events.filter(e => {
      const d = parseISO(e.startDateTime);
      return d >= monthStart && d <= monthEnd;
    });
    const directPast = monthEvents.filter(e =>
      e.eventType === "DirectService" && isBefore(parseISO(e.startDateTime), startOfDay(new Date()))
    );
    const attended = directPast.filter(e => servicesByDate[format(parseISO(e.startDateTime), "yyyy-MM-dd")]).length;
    const missed = directPast.length - attended;
    const upcoming = monthEvents.filter(e => !isBefore(parseISO(e.startDateTime), startOfDay(new Date()))).length;
    return { attended, missed, upcoming, total: monthEvents.length };
  }, [events, monthStart, monthEnd, servicesByDate]);

  const selectedDayEvents = eventsByDay[format(selectedDay, "yyyy-MM-dd")] || [];

  const handleReschedule = (event) => {
    setRescheduleEvent(event);
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingEvent(null);
    setRescheduleEvent(null);
    setShowForm(true);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setRescheduleEvent(null);
    setShowForm(true);
  };

  if (isLoading) {
    return <p className="text-sm text-[var(--modal-text-muted)] text-center py-6">Loading calendar…</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header with month nav */}
      <div className="modal-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor(subMonths(cursor, 1))}
              className="p-1.5 rounded-lg hover:bg-[#F7F3FA] text-[var(--modal-text-muted)]"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-bold text-[var(--modal-text)] min-w-[140px] text-center">
              {format(cursor, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCursor(addMonths(cursor, 1))}
              className="p-1.5 rounded-lg hover:bg-[#F7F3FA] text-[var(--modal-text-muted)]"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setCursor(new Date()); setSelectedDay(new Date()); }}
              className="ml-2 text-xs text-[#6B2FB9] hover:underline"
            >
              Today
            </button>
          </div>
          <Button onClick={handleNew} size="sm" className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-9 text-sm">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {/* Month stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatPill icon={CheckCircle2} label="Attended" value={monthStats.attended} color="text-green-700 bg-green-100" />
          <StatPill icon={AlertCircle} label="Missed" value={monthStats.missed} color="text-amber-700 bg-amber-100" />
          <StatPill icon={Calendar} label="Upcoming" value={monthStats.upcoming} color="text-[#400070] bg-[#EADDF5]" />
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-[10px] font-bold text-[var(--modal-text-muted)] text-center uppercase">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay[key] || [];
            const inMonth = isSameMonth(day, cursor);
            const isSelected = isSameDay(day, selectedDay);
            const isToday = isSameDay(day, new Date());
            const hasMissed = dayEvents.some(e => getAttendanceStatus(e) === "missed");
            const hasAttended = dayEvents.some(e => getAttendanceStatus(e) === "attended");
            const hasUpcoming = dayEvents.some(e => getAttendanceStatus(e) === "upcoming");

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square p-1 rounded-lg text-xs flex flex-col items-center justify-start transition-all relative ${
                  isSelected
                    ? "bg-[#400070] text-white"
                    : isToday
                      ? "bg-[#EADDF5] text-[#400070] font-bold"
                      : inMonth
                        ? "hover:bg-[#F7F3FA] text-[var(--modal-text)]"
                        : "text-[var(--modal-text-muted)] opacity-40"
                }`}
              >
                <span className={`font-semibold ${isSelected ? "text-white" : ""}`}>{format(day, "d")}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {hasAttended && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-green-200" : "bg-green-500"}`} />}
                    {hasMissed && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-amber-200" : "bg-amber-500"}`} />}
                    {hasUpcoming && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-purple-200" : "bg-[#6B2FB9]"}`} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 text-[10px] text-[var(--modal-text-muted)] flex-wrap">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Attended</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Missed</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#6B2FB9]" /> Upcoming</span>
        </div>
      </div>

      {/* Selected day events */}
      <div className="modal-card p-4">
        <h3 className="font-semibold text-[var(--modal-text)] mb-3">
          {format(selectedDay, "EEEE, MMM d")}
        </h3>
        {selectedDayEvents.length === 0 ? (
          <div className="text-center py-6">
            <CalendarDays className="w-8 h-8 text-[var(--modal-border)] mx-auto mb-2" />
            <p className="text-sm text-[var(--modal-text-muted)]">No sessions scheduled</p>
            <button
              onClick={handleNew}
              className="text-xs text-[#6B2FB9] hover:underline mt-2"
            >
              + Add a session for this day
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDayEvents
              .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
              .map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  status={getAttendanceStatus(event)}
                  onEdit={() => handleEdit(event)}
                  onReschedule={() => handleReschedule(event)}
                />
              ))}
          </div>
        )}
      </div>

      {showForm && (
        <EventForm
          event={rescheduleEvent
            ? { ...rescheduleEvent, id: undefined, startDateTime: "", endDateTime: "", title: `${rescheduleEvent.title} (rescheduled)` }
            : editingEvent}
          students={student ? [student] : []}
          initialDate={rescheduleEvent ? null : selectedDay}
          onSave={(data) => saveMutation.mutate(data)}
          onCancel={() => { setShowForm(false); setEditingEvent(null); setRescheduleEvent(null); }}
        />
      )}
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className={`rounded-xl px-2 py-2 flex items-center gap-1.5 ${color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-bold leading-none">{value}</p>
        <p className="text-[9px] uppercase tracking-wide font-semibold opacity-80">{label}</p>
      </div>
    </div>
  );
}

function EventCard({ event, status, onEdit, onReschedule }) {
  const start = parseISO(event.startDateTime);
  const end = parseISO(event.endDateTime);
  const durationMins = Math.round((end - start) / 60000);

  const statusConfig = {
    attended: { label: "Attended", badge: "bg-green-100 text-green-700", icon: CheckCircle2 },
    missed:   { label: "Missed",   badge: "bg-amber-100 text-amber-700", icon: AlertCircle },
    upcoming: { label: "Upcoming", badge: "bg-[#EADDF5] text-[#400070]", icon: Calendar },
    past:     { label: "Past",     badge: "bg-gray-100 text-gray-600",   icon: Clock },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-3 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${statusConfig.badge}`}>
              <StatusIcon className="w-3 h-3" /> {statusConfig.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${EVENT_COLORS[event.eventType] || EVENT_COLORS.Other}`}>
              {event.eventType?.replace(/([A-Z])/g, " $1").trim()}
            </span>
          </div>
          <p className="text-sm font-semibold text-[var(--modal-text)] mt-1 truncate">{event.title}</p>
          <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">
            {format(start, "h:mm a")} – {format(end, "h:mm a")} · {durationMins} min
            {event.setting && event.setting !== "NotApplicable" && ` · ${event.setting}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {status === "missed" && (
          <button
            onClick={onReschedule}
            className="flex items-center gap-1 text-xs font-semibold bg-[#400070] hover:bg-[#5B00A0] text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <RotateCw className="w-3 h-3" /> Reschedule
          </button>
        )}
        <button
          onClick={onEdit}
          className="text-xs text-[#6B2FB9] hover:underline px-2 py-1"
        >
          Edit
        </button>
      </div>
    </div>
  );
}