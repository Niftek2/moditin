import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import DayView from "../components/calendar/DayView";
import WeekView from "../components/calendar/WeekView";
import MonthView from "../components/calendar/MonthView";
import EventForm from "../components/calendar/EventForm";
import EventDetailModal from "../components/calendar/EventDetailModal";
import DriveConflictModal from "../components/calendar/DriveConflictModal";
import { checkDriveConflict, getEventsForDay } from "../components/calendar/calendarUtils";

const VIEWS = ["Day", "Week", "Month"];

export default function CalendarPage() {
  const [view, setView] = useState("Day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formInitialDate, setFormInitialDate] = useState(null);
  const [driveConflict, setDriveConflict] = useState(null);
  const [pendingSave, setPendingSave] = useState(null);

  const qc = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ["calendarEvents"],
    queryFn: () => base44.entities.CalendarEvent.list("-startDateTime", 200),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const createEvent = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendarEvents"] }); resetForm(); },
  });

  const updateEvent = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendarEvents"] }); resetForm(); },
  });

  const deleteEvent = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendarEvents"] }); setSelectedEvent(null); },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setFormInitialDate(null);
    setDriveConflict(null);
    setPendingSave(null);
  };

  const handleSave = (formData) => {
    const saveDate = parseISO(formData.startDateTime);
    const conflict = checkDriveConflict(events, formData, saveDate);
    if (conflict && !formData.bypassDriveWarning) {
      setDriveConflict(conflict);
      setPendingSave(formData);
      return;
    }
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data: formData });
    } else {
      createEvent.mutate(formData);
    }
  };

  const handleOverride = (reason) => {
    const data = { ...pendingSave, bypassDriveWarning: true, bypassReason: reason };
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data });
    } else {
      createEvent.mutate(data);
    }
    setDriveConflict(null);
    setPendingSave(null);
  };

  const navigate = (dir) => {
    if (view === "Day") setCurrentDate(d => dir > 0 ? addDays(d, 1) : subDays(d, 1));
    else if (view === "Week") setCurrentDate(d => dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => dir > 0 ? addMonths(d, 1) : subMonths(d, 1));
  };

  const getHeaderLabel = () => {
    if (view === "Day") return format(currentDate, "EEEE, MMMM d, yyyy");
    if (view === "Week") return `Week of ${format(currentDate, "MMM d, yyyy")}`;
    return format(currentDate, "MMMM yyyy");
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-[var(--modal-text)]">Calendar</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View switcher */}
          <div className="flex bg-[#F7F3FA] rounded-xl p-1 border border-[var(--modal-border)]">
            {VIEWS.map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  view === v ? "bg-[#400070] text-white shadow" : "text-[var(--modal-text-muted)] hover:text-[#400070]"
                }`}
              >{v}</button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-[#EADDF5] text-[var(--modal-text-muted)] hover:text-[#400070] transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-semibold text-[#400070] hover:bg-[#EADDF5] rounded-xl transition-all">
              Today
            </button>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-[#EADDF5] text-[var(--modal-text-muted)] hover:text-[#400070] transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Date label */}
      <p className="text-sm text-[var(--modal-text-muted)] mb-3">{getHeaderLabel()}</p>

      {/* Calendar view */}
      <div className="modal-card flex-1 overflow-hidden">
        {view === "Day" && (
          <DayView
            date={currentDate}
            events={events}
            onEventClick={setSelectedEvent}
            onAddClick={(d) => { setFormInitialDate(d); setShowForm(true); }}
          />
        )}
        {view === "Week" && (
          <WeekView
            date={currentDate}
            events={events}
            onEventClick={setSelectedEvent}
            onDayClick={(d) => { setCurrentDate(d); setView("Day"); }}
          />
        )}
        {view === "Month" && (
          <MonthView
            date={currentDate}
            events={events}
            onDayClick={(d) => { setCurrentDate(d); setView("Day"); }}
          />
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <EventForm
          event={editingEvent}
          students={students}
          initialDate={formInitialDate || currentDate}
          onSave={handleSave}
          onCancel={resetForm}
        />
      )}

      {selectedEvent && !showForm && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(e) => { setEditingEvent(e); setSelectedEvent(null); setShowForm(true); }}
          onDelete={(e) => { if (confirm("Delete this event?")) deleteEvent.mutate(e.id); }}
        />
      )}

      {driveConflict && (
        <DriveConflictModal
          conflict={driveConflict}
          onAdjustTime={() => { setDriveConflict(null); }}
          onEditDriveTime={() => { setDriveConflict(null); }}
          onOverride={handleOverride}
          onClose={() => { setDriveConflict(null); setPendingSave(null); }}
        />
      )}
    </div>
  );
}