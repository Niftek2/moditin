import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { X, ShieldAlert } from "lucide-react";
import { addMinutes } from "date-fns";

const LEAD_OPTIONS = [
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
];

const RECURRENCE_OPTIONS = ["None", "Daily", "Weekly", "Monthly", "CustomIntervalDays"];

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ReminderForm({ reminder, onSave, onClose }) {
  const isEdit = !!reminder;
  const [form, setForm] = useState({
    title: reminder?.title || "",
    description: reminder?.description || "",
    linkedStudentId: reminder?.linkedStudentId || "",
    linkedStudentInitials: reminder?.linkedStudentInitials || "",
    dueDateTime: reminder?.dueDateTime ? toLocalInput(reminder.dueDateTime) : "",
    reminderLeadTimeMinutes: reminder?.reminderLeadTimeMinutes ?? 15,
    recurrence: reminder?.recurrence || "None",
    customIntervalDays: reminder?.customIntervalDays || 7,
    priority: reminder?.priority || "Medium",
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleStudentChange = (e) => {
    const id = e.target.value;
    const student = students.find(s => s.id === id);
    set("linkedStudentId", id);
    set("linkedStudentInitials", student?.studentInitials || "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDateTime) return;
    const data = {
      ...form,
      dueDateTime: new Date(form.dueDateTime).toISOString(),
      customIntervalDays: form.recurrence === "CustomIntervalDays" ? Number(form.customIntervalDays) : undefined,
      status: reminder?.status || "Pending",
    };
    if (!data.linkedStudentId) {
      delete data.linkedStudentId;
      delete data.linkedStudentInitials;
    }
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-[#400070]">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#400070]">
          <h2 className="text-base font-bold text-[var(--modal-text)]">{isEdit ? "Edit Reminder" : "Add Reminder"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-[var(--modal-text-muted)]" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* PII warning */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Do not include identifiable student information.</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--modal-text)] mb-1">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="e.g. Prep for IEP meeting"
              className="w-full border border-[var(--modal-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B2FB9]/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--modal-text)] mb-1">Notes (optional)</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="No identifiable information"
              rows={2}
              className="w-full border border-[var(--modal-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B2FB9]/30 resize-none"
            />
          </div>

          {/* Link to student */}
          <div>
            <label className="block text-xs font-semibold text-[var(--modal-text)] mb-1">Link to Student (optional)</label>
            <select
              value={form.linkedStudentId}
              onChange={handleStudentChange}
              className="w-full border border-[var(--modal-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B2FB9]/30"
            >
              <option value="">— None —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.studentInitials}</option>
              ))}
            </select>
          </div>

          {/* Due date/time */}
          <div>
            <label className="block text-xs font-semibold text-[var(--modal-text)] mb-1">Due Date & Time <span className="text-red-400">*</span></label>
            <input
              type="datetime-local"
              required
              value={form.dueDateTime}
              onChange={e => set("dueDateTime", e.target.value)}
              className="w-full border border-[var(--modal-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B2FB9]/30"
            />
          </div>

          {/* Reminder lead time */}
          <div>
            <label className="block text-xs font-semibold text-[var(--modal-text)] mb-1">Remind me</label>
            <select
              value={form.reminderLeadTimeMinutes}
              onChange={e => set("reminderLeadTimeMinutes", Number(e.target.value))}
              className="w-full border border-[var(--modal-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B2FB9]/30"
            >
              {LEAD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-[var(--modal-text)] mb-1">Priority</label>
            <div className="flex gap-2">
              {["Low", "Medium", "High"].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("priority", p)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.priority === p
                      ? p === "High" ? "bg-amber-100 border-amber-400 text-amber-700"
                        : p === "Medium" ? "bg-purple-100 border-purple-400 text-purple-700"
                        : "bg-gray-100 border-gray-400 text-gray-700"
                      : "border-[var(--modal-border)] text-[var(--modal-text-muted)] hover:border-[#6B2FB9]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-semibold text-[var(--modal-text)] mb-1">Recurrence</label>
            <select
              value={form.recurrence}
              onChange={e => set("recurrence", e.target.value)}
              className="w-full border border-[var(--modal-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B2FB9]/30"
            >
              {RECURRENCE_OPTIONS.map(r => (
                <option key={r} value={r}>
                  {r === "CustomIntervalDays" ? "Custom interval" : r}
                </option>
              ))}
            </select>
            {form.recurrence === "CustomIntervalDays" && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-[var(--modal-text-muted)]">Every</span>
                <input
                  type="number"
                  min={1}
                  value={form.customIntervalDays}
                  onChange={e => set("customIntervalDays", e.target.value)}
                  className="w-16 border border-[var(--modal-border)] rounded-xl px-2 py-1 text-sm text-center focus:outline-none"
                />
                <span className="text-xs text-[var(--modal-text-muted)]">days</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 rounded-xl bg-[#400070] hover:bg-[#5B00A0] text-white">Save Reminder</Button>
          </div>
        </form>
      </div>
    </div>
  );
}