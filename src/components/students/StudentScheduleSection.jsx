import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CalendarDays, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import EventForm from "../calendar/EventForm";

export default function StudentScheduleSection({ studentId, student }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["calendarEvents", studentId],
    queryFn: () => base44.entities.CalendarEvent.filter({ studentId }),
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

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents", studentId] });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
    },
  });

  const upcoming = events
    .filter(e => new Date(e.startDateTime) >= new Date(Date.now() - 86400000))
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  const past = events
    .filter(e => new Date(e.startDateTime) < new Date(Date.now() - 86400000))
    .sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime));

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[var(--modal-text)]">Schedule</h2>
          <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">Synced with your main Calendar</p>
        </div>
        <Button onClick={handleNew} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-9 text-sm">
          <Plus className="w-4 h-4 mr-1" /> Add Event
        </Button>
      </div>

      {isLoading && <p className="text-sm text-[var(--modal-text-muted)] text-center py-6">Loading...</p>}

      {!isLoading && events.length === 0 && (
        <div className="modal-card p-10 text-center">
          <CalendarDays className="w-10 h-10 text-[var(--modal-border)] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[var(--modal-text-muted)]">No events scheduled</p>
          <p className="text-xs text-[var(--modal-text-muted)] mt-1">Add a service session or meeting for this student.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[var(--modal-text-muted)] uppercase tracking-wider">Upcoming</h3>
          {upcoming.map(event => (
            <EventRow key={event.id} event={event} onEdit={() => handleEdit(event)} onDelete={() => deleteMutation.mutate(event.id)} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[var(--modal-text-muted)] uppercase tracking-wider">Past</h3>
          {past.slice(0, 10).map(event => (
            <EventRow key={event.id} event={event} onEdit={() => handleEdit(event)} onDelete={() => deleteMutation.mutate(event.id)} past />
          ))}
        </div>
      )}

      {showForm && (
        <EventForm
          event={editingEvent}
          students={students}
          onSave={(data) => saveMutation.mutate(data)}
          onCancel={() => { setShowForm(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}

function EventRow({ event, onEdit, onDelete, past }) {
  const start = parseISO(event.startDateTime);
  const end = parseISO(event.endDateTime);
  const durationMins = Math.round((end - start) / 60000);

  return (
    <div className={`modal-card p-4 flex items-start justify-between gap-3 ${past ? "opacity-60" : ""}`}>
      <div className="flex gap-3 items-start flex-1 min-w-0">
        <div className="bg-[#EADDF5] rounded-xl p-2 flex-shrink-0">
          <CalendarDays className="w-4 h-4 text-[#6B2FB9]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--modal-text)] truncate">{event.title}</p>
          <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">
            {format(start, "EEE, MMM d · h:mm a")}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-[var(--modal-text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" /> {durationMins} min
            </span>
            <span className="text-xs bg-[#EADDF5] text-[#400070] px-2 py-0.5 rounded-full font-medium">
              {event.eventType?.replace(/([A-Z])/g, " $1").trim()}
            </span>
            {event.setting && event.setting !== "NotApplicable" && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{event.setting}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onEdit} className="text-xs text-[#6B2FB9] hover:underline px-2 py-1">Edit</button>
        <button onClick={onDelete} className="text-[var(--modal-text-muted)] hover:text-red-500 p-1 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}