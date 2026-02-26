import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Bell, ShieldAlert, CheckCircle2, Trash2 } from "lucide-react";
import { isPast, parseISO, addDays, addWeeks, addMonths, isToday, isFuture } from "date-fns";
import ReminderForm from "../components/reminders/ReminderForm";
import ReminderCard from "../components/reminders/ReminderCard";

const TABS = ["Pending", "Snoozed", "Completed"];

function generateNextInstance(reminder) {
  const due = new Date(reminder.dueDateTime);
  let nextDue;
  switch (reminder.recurrence) {
    case "Daily": nextDue = addDays(due, 1); break;
    case "Weekly": nextDue = addWeeks(due, 1); break;
    case "Monthly": nextDue = addMonths(due, 1); break;
    case "CustomIntervalDays": nextDue = addDays(due, reminder.customIntervalDays || 1); break;
    default: return null;
  }
  return { ...reminder, id: undefined, dueDateTime: nextDue.toISOString(), status: "Pending", snoozeUntil: undefined, completedAt: undefined };
}

export default function Reminders() {
  const [tab, setTab] = useState("Pending");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const qc = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders", currentUser?.id],
    queryFn: () => base44.entities.PersonalReminder.filter({ created_by: currentUser?.email }, "-dueDateTime", 200),
    enabled: !!currentUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PersonalReminder.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PersonalReminder.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); setEditTarget(null); },
  });

  const handleSave = (data) => {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleComplete = async (reminder) => {
    await base44.entities.PersonalReminder.update(reminder.id, {
      status: "Completed",
      completedAt: new Date().toISOString(),
    });
    if (reminder.recurrence && reminder.recurrence !== "None") {
      const next = generateNextInstance(reminder);
      if (next) await base44.entities.PersonalReminder.create(next);
    }
    qc.invalidateQueries({ queryKey: ["reminders"] });
  };

  const handleDelete = async (reminder) => {
    if (!window.confirm("Delete this reminder?")) return;
    await base44.entities.PersonalReminder.delete(reminder.id);
    qc.invalidateQueries({ queryKey: ["reminders"] });
  };

  const handleSnooze = async (reminder, mins) => {
    const snoozeUntil = new Date(Date.now() + mins * 60000).toISOString();
    await base44.entities.PersonalReminder.update(reminder.id, { status: "Snoozed", snoozeUntil });
    qc.invalidateQueries({ queryKey: ["reminders"] });
  };

  const now = new Date();
  const filtered = reminders.filter(r => {
    if (tab === "Pending") return r.status === "Pending" || (r.status === "Snoozed" && r.snoozeUntil && new Date(r.snoozeUntil) < now);
    if (tab === "Snoozed") return r.status === "Snoozed" && r.snoozeUntil && new Date(r.snoozeUntil) > now;
    if (tab === "Completed") return r.status === "Completed";
    return false;
  }).sort((a, b) => new Date(a.dueDateTime) - new Date(b.dueDateTime));

  const pendingCount = reminders.filter(r => r.status === "Pending").length;
  const overdueCount = reminders.filter(r => r.status === "Pending" && isPast(parseISO(r.dueDateTime))).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--modal-text)]">Reminders</h1>
          <p className="text-sm text-[var(--modal-text-muted)] mt-0.5">
            {pendingCount} pending{overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}
          </p>
        </div>
        <Button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" /> Add Reminder
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#F7F3FA] rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? "bg-white text-[#400070] shadow-sm" : "text-[var(--modal-text-muted)] hover:text-[var(--modal-text)]"
            }`}
          >
            {t}
            {t === "Pending" && pendingCount > 0 && (
              <span className="ml-1.5 text-xs bg-[#400070] text-white rounded-full px-1.5 py-0.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-sm text-[var(--modal-text-muted)]">Loading reminders…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-[#EADDF5] flex items-center justify-center mx-auto mb-3">
            {tab === "Completed" ? <CheckCircle2 className="w-7 h-7 text-[#6B2FB9]" /> : <Bell className="w-7 h-7 text-[#6B2FB9]" />}
          </div>
          <p className="text-sm font-medium text-[var(--modal-text)] mb-1">
            {tab === "Pending" ? "No pending reminders" : tab === "Snoozed" ? "No snoozed reminders" : "No completed reminders yet"}
          </p>
          {tab === "Pending" && (
            <Button onClick={() => setShowForm(true)} size="sm" className="mt-3 bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2">
              <Plus className="w-3.5 h-3.5" /> Add your first reminder
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <ReminderCard
              key={r.id}
              reminder={r}
              onComplete={tab !== "Completed" ? handleComplete : null}
              onSnooze={tab !== "Completed" ? handleSnooze : null}
              onEdit={(r) => { setEditTarget(r); setShowForm(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Footer disclaimer */}
      <div className="mt-10 flex items-start gap-2 bg-[#F7F3FA] border border-[var(--modal-border)] rounded-xl px-4 py-3">
        <ShieldAlert className="w-4 h-4 text-[var(--modal-text-muted)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--modal-text-muted)]">
          Reminders are organizational tools only. Users remain responsible for compliance and deadlines.
        </p>
      </div>

      {showForm && (
        <ReminderForm
          reminder={editTarget}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}