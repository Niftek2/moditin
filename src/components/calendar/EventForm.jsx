import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { X, Car, Video, Calendar, Clock, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVENT_TYPE_LABELS } from "./calendarUtils";
import RecurrenceFields from "./RecurrenceFields";

const DRIVE_CHIPS = [0, 10, 15, 20, 30, 45, 60];
const REMINDER_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1 day", value: 1440 },
];

const toLocalDateTimeInput = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalDateTimeInput = (val) => {
  if (!val) return "";
  return new Date(val).toISOString();
};

export default function EventForm({ event, students, initialDate, onSave, onCancel }) {
  const isEdit = !!event?.id;
  const defaultStart = initialDate ? `${format(initialDate, "yyyy-MM-dd")}T09:00` : toLocalDateTimeInput(new Date().toISOString());
  const defaultEnd = initialDate ? `${format(initialDate, "yyyy-MM-dd")}T10:00` : toLocalDateTimeInput(new Date(Date.now() + 3600000).toISOString());

  const [form, setForm] = useState({
    title: event?.title || "",
    eventType: event?.eventType || "DirectService",
    startDateTime: event?.startDateTime ? toLocalDateTimeInput(event.startDateTime) : defaultStart,
    endDateTime: event?.endDateTime ? toLocalDateTimeInput(event.endDateTime) : defaultEnd,
    setting: event?.setting || "InPerson",
    studentId: event?.studentId || "",
    locationLabel: event?.locationLabel || "",
    notes: event?.notes || "",
    driveTimeMinutes: event?.driveTimeMinutes || 0,
    driveTimeIncluded: event?.driveTimeIncluded || false,
    reminderMinutes: event?.reminderMinutes || [15],
    recurrenceType: event?.recurrenceType || "None",
    recurrenceDaysOfWeek: event?.recurrenceDaysOfWeek || [],
    recurrenceDayOfMonth: event?.recurrenceDayOfMonth || null,
    recurrenceInterval: event?.recurrenceInterval || 1,
    recurrenceEndDate: event?.recurrenceEndDate || "",
  });

  const needsDrive = ["InPerson", "Hybrid"].includes(form.setting);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleReminder = (mins) => {
    set("reminderMinutes", form.reminderMinutes.includes(mins)
      ? form.reminderMinutes.filter(m => m !== mins)
      : [...form.reminderMinutes, mins]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const student = students?.find(s => s.id === form.studentId);
    onSave({
      ...form,
      startDateTime: fromLocalDateTimeInput(form.startDateTime),
      endDateTime: fromLocalDateTimeInput(form.endDateTime),
      driveTimeIncluded: needsDrive && form.driveTimeMinutes > 0,
      studentInitials: student?.studentInitials || "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[var(--modal-border)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--modal-border)] sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-[var(--modal-text)]">{isEdit ? "Edit Event" : "New Event"}</h2>
          <button onClick={onCancel} className="text-[var(--modal-text-muted)] hover:text-[var(--modal-text)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Event Type */}
           <div>
             <label className="text-sm font-bold text-[var(--modal-text)] mb-2 block">Event Type</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
                <button type="button" key={val}
                  onClick={() => set("eventType", val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.eventType === val
                      ? "bg-[#400070] text-white border-[#400070]"
                      : "bg-white text-[var(--modal-text-muted)] border-[var(--modal-border)] hover:border-[#400070]"
                  }`}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-bold text-[var(--modal-text)] mb-2 block">Title</label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} required placeholder="e.g. Service session" />
          </div>

          {/* Student */}
          {students?.length > 0 && (
            <div>
              <label className="text-sm font-bold text-[var(--modal-text)] mb-2 block">Student (optional)</label>
              <Select value={form.studentId} onValueChange={v => set("studentId", v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.studentInitials} · {s.gradeBand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-[var(--modal-text)] mb-2 block">Start</label>
              <input type="datetime-local" value={form.startDateTime} onChange={e => set("startDateTime", e.target.value)}
                required className="w-full border border-[var(--modal-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#6B2FB9]" />
            </div>
            <div>
              <label className="text-sm font-bold text-[var(--modal-text)] mb-2 block">End</label>
              <input type="datetime-local" value={form.endDateTime} onChange={e => set("endDateTime", e.target.value)}
                required className="w-full border border-[var(--modal-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#6B2FB9]" />
            </div>
          </div>

          {/* Setting */}
          <div>
            <label className="text-sm font-bold text-[var(--modal-text)] mb-2 block">Setting</label>
            <div className="flex flex-wrap gap-2">
              {["InPerson", "Telepractice", "Hybrid", "NotApplicable"].map(s => (
                <button type="button" key={s}
                  onClick={() => set("setting", s)}
                  className={`flex-1 min-w-max py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    form.setting === s
                      ? "bg-[#400070] text-white border-[#400070]"
                      : "bg-white text-[var(--modal-text-muted)] border-[var(--modal-border)] hover:border-[#400070]"
                  }`}
                >{s === "NotApplicable" ? "N/A" : s === "Telepractice" ? "Telepractice" : s === "InPerson" ? "In-Person" : "Hybrid"}</button>
              ))}
            </div>
          </div>

          {/* Drive Time (InPerson/Hybrid only) */}
          {needsDrive && (
            <div>
              <label className="text-sm font-bold text-[var(--modal-text)] mb-2 block">Drive time from previous appointment (min)</label>
              <div className="flex flex-wrap gap-2">
                {DRIVE_CHIPS.map(m => (
                  <button type="button" key={m}
                    onClick={() => set("driveTimeMinutes", m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      form.driveTimeMinutes === m
                        ? "bg-[#6B2FB9] text-white border-[#6B2FB9]"
                        : "bg-white text-[var(--modal-text-muted)] border-[var(--modal-border)] hover:border-[#6B2FB9]"
                    }`}
                  >{m === 0 ? "None" : `${m}m`}</button>
                ))}
                <input type="number" min="0" max="180" placeholder="Custom"
                  className="w-20 border border-[var(--modal-border)] rounded-xl px-2 py-1 text-xs focus:outline-none focus:border-[#6B2FB9]"
                  onChange={e => set("driveTimeMinutes", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="text-sm font-bold text-[var(--modal-text)] mb-2 block">Location <span className="text-[var(--modal-text-muted)] font-normal text-xs">(generic label only)</span></label>
            <Input value={form.locationLabel} onChange={e => set("locationLabel", e.target.value)} placeholder="e.g. 'School A' or 'Home'" />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-bold text-[var(--modal-text)] mb-2 block">Notes <span className="text-[var(--modal-text-muted)] font-normal text-xs">(no identifying info)</span></label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Optional session notes..." />
          </div>

          {/* Recurrence */}
          <RecurrenceFields form={form} set={set} />

          {/* Reminders */}
          <div>
            <label className="text-sm font-bold text-[var(--modal-text)] mb-2 block">Reminders</label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map(r => (
                <button type="button" key={r.value}
                  onClick={() => toggleReminder(r.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.reminderMinutes.includes(r.value)
                      ? "bg-[#400070] text-white border-[#400070]"
                      : "bg-white text-[var(--modal-text-muted)] border-[var(--modal-border)] hover:border-[#400070]"
                  }`}
                >{r.label} before</button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-[#400070] hover:bg-[#5B00A0] text-white">
              {isEdit ? "Update Event" : "Save Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}