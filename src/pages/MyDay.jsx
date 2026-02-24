import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  Plus, CalendarDays, Bell, Car, AlertCircle, Sun, Coffee, Moon, Check, Clock
} from "lucide-react";
import {
  format, parseISO, isToday, isPast, addDays, addWeeks, addMonths, isWithinInterval,
  differenceInDays
} from "date-fns";
import { EVENT_TYPE_LABELS, EVENT_COLORS } from "../components/calendar/calendarUtils";
import ReminderCard from "../components/reminders/ReminderCard";
import ReminderForm from "../components/reminders/ReminderForm";
import EventForm from "../components/calendar/EventForm";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", Icon: Sun };
  if (h < 17) return { text: "Good afternoon", Icon: Coffee };
  return { text: "Good evening", Icon: Moon };
}

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

export default function MyDay() {
  const [user, setUser] = useState(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editReminder, setEditReminder] = useState(null);
  const qc = useQueryClient();
  const now = new Date();
  const { text: greetText, Icon: GreetIcon } = getGreeting();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ["calendarEvents-myday"],
    queryFn: () => base44.entities.CalendarEvent.list("-startDateTime", 200),
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => base44.entities.PersonalReminder.list("-dueDateTime", 200),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const createReminderMutation = useMutation({
    mutationFn: (data) => base44.entities.PersonalReminder.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); setShowReminderForm(false); },
  });

  const updateReminderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PersonalReminder.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); setEditReminder(null); },
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendarEvents-myday"] }); setShowEventForm(false); },
  });

  // Today's events
  const todayEvents = calendarEvents
    .filter(e => isToday(parseISO(e.startDateTime)))
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  // Drive time for today
  const totalDriveMinutes = todayEvents.reduce((sum, e) => sum + (e.driveTimeIncluded ? (e.driveTimeMinutes || 0) : 0), 0);
  const inPersonEvents = todayEvents.filter(e => e.setting === "InPerson");

  // Today's reminders
  const todayReminders = reminders.filter(r => {
    if (r.status === "Completed") return false;
    const due = parseISO(r.dueDateTime);
    if (isToday(due)) return true;
    if (isPast(due) && r.status === "Pending") return true;
    if (r.status === "Snoozed" && r.snoozeUntil && isToday(parseISO(r.snoozeUntil))) return true;
    return false;
  }).sort((a, b) => new Date(a.dueDateTime) - new Date(b.dueDateTime));

  // Upcoming IEPs
  const upcomingIEPs = students.filter(s => {
    if (!s.iepAnnualReviewDate) return false;
    const d = parseISO(s.iepAnnualReviewDate);
    return isWithinInterval(d, { start: now, end: addDays(now, 30) });
  }).sort((a, b) => new Date(a.iepAnnualReviewDate) - new Date(b.iepAnnualReviewDate));

  const handleCompleteReminder = async (reminder) => {
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

  const handleSnoozeReminder = async (reminder, mins) => {
    await base44.entities.PersonalReminder.update(reminder.id, {
      status: "Snoozed",
      snoozeUntil: new Date(Date.now() + mins * 60000).toISOString(),
    });
    qc.invalidateQueries({ queryKey: ["reminders"] });
  };

  const handleSaveReminder = (data) => {
    if (editReminder) {
      updateReminderMutation.mutate({ id: editReminder.id, data });
    } else {
      createReminderMutation.mutate(data);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="modal-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#EADDF5] flex items-center justify-center">
            <GreetIcon className="w-5 h-5 text-[#6B2FB9]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--modal-text)]">
              {greetText}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-sm text-[var(--modal-text-muted)]">
              {format(now, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowEventForm(true)}
            size="sm"
            className="flex-1 bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2"
          >
            <CalendarDays className="w-4 h-4" /> Add Appointment
          </Button>
          <Button
            onClick={() => { setEditReminder(null); setShowReminderForm(true); }}
            size="sm"
            variant="outline"
            className="flex-1 border-[#6B2FB9] text-[#6B2FB9] hover:bg-[#EADDF5] rounded-xl gap-2"
          >
            <Bell className="w-4 h-4" /> Add Reminder
          </Button>
        </div>
      </div>

      {/* Today's Schedule */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider">Today's Schedule</h2>
          <Link to={createPageUrl("Calendar")} className="text-xs text-[#6B2FB9] hover:underline font-medium">Full calendar</Link>
        </div>

        {todayEvents.length === 0 ? (
          <div className="modal-card p-6 text-center">
            <CalendarDays className="w-8 h-8 text-[var(--modal-border)] mx-auto mb-2" />
            <p className="text-sm text-[var(--modal-text-muted)]">No appointments today — enjoy the flexibility!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map(e => {
              const colors = EVENT_COLORS[e.eventType] || EVENT_COLORS.Other;
              return (
                <div key={e.id} className={`flex items-center gap-3 p-4 rounded-2xl border ${colors.bg} ${colors.border}`}>
                  <div className="w-1.5 h-12 rounded-full shrink-0" style={{ backgroundColor: colors.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${colors.text}`}>{e.title}</p>
                    <p className={`text-xs ${colors.text} opacity-75 mt-0.5`}>
                      {format(parseISO(e.startDateTime), "h:mm a")} – {format(parseISO(e.endDateTime), "h:mm a")}
                      {e.studentInitials ? ` · ${e.studentInitials}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white ${colors.text}`}>
                      {EVENT_TYPE_LABELS[e.eventType]}
                    </span>
                    {e.setting && e.setting !== "NotApplicable" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[var(--modal-text-muted)]">
                        {e.setting === "InPerson" ? "In-Person" : e.setting}
                      </span>
                    )}
                    {e.driveTimeIncluded && e.driveTimeMinutes > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[var(--modal-text-muted)] flex items-center gap-0.5">
                        <Car className="w-2.5 h-2.5" />{e.driveTimeMinutes}m
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Drive time summary */}
            {inPersonEvents.length >= 2 && totalDriveMinutes > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl mt-1">
                <Car className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700 font-medium">
                  Total drive time today: ~{totalDriveMinutes} min
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Today's Reminders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider">
            Today's Reminders
            {todayReminders.length > 0 && (
              <span className="ml-2 text-xs bg-[#400070] text-white rounded-full px-1.5 py-0.5">{todayReminders.length}</span>
            )}
          </h2>
          <Link to={createPageUrl("Reminders")} className="text-xs text-[#6B2FB9] hover:underline font-medium">All reminders</Link>
        </div>

        {todayReminders.length === 0 ? (
          <div className="modal-card p-5 text-center">
            <Bell className="w-7 h-7 text-[var(--modal-border)] mx-auto mb-2" />
            <p className="text-sm text-[var(--modal-text-muted)]">No reminders due today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayReminders.map(r => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onComplete={handleCompleteReminder}
                onSnooze={handleSnoozeReminder}
                onEdit={(r) => { setEditReminder(r); setShowReminderForm(true); }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming IEP Alerts */}
      {upcomingIEPs.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider mb-3">Upcoming IEP Reviews</h2>
          <div className="space-y-2">
            {upcomingIEPs.map(s => {
              const daysLeft = differenceInDays(parseISO(s.iepAnnualReviewDate), now);
              const urgent = daysLeft <= 7;
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border ${
                    urgent ? "bg-amber-50 border-amber-200" : "bg-white border-[var(--modal-border)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`w-4 h-4 shrink-0 ${urgent ? "text-amber-500" : "text-[#6B2FB9]"}`} />
                    <div>
                      <p className="text-sm font-bold text-[var(--modal-text)]">{s.studentInitials}</p>
                      <p className="text-xs text-[var(--modal-text-muted)]">
                        {format(parseISO(s.iepAnnualReviewDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      urgent ? "bg-amber-100 text-amber-700" : "bg-[#EADDF5] text-[#400070]"
                    }`}>
                      {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft} days`}
                    </span>
                    <button
                      onClick={() => {
                        setEditReminder(null);
                        setShowReminderForm(true);
                      }}
                      className="text-[10px] text-[#6B2FB9] border border-[#6B2FB9] px-2 py-1 rounded-full hover:bg-[#EADDF5] transition-colors font-medium"
                    >
                      + Reminder
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modals */}
      {showReminderForm && (
        <ReminderForm
          reminder={editReminder}
          onSave={handleSaveReminder}
          onClose={() => { setShowReminderForm(false); setEditReminder(null); }}
        />
      )}
      {showEventForm && (
        <EventForm
          event={null}
          defaultDate={now}
          students={students}
          onSave={async (data) => { createEventMutation.mutate(data); }}
          onClose={() => setShowEventForm(false)}
        />
      )}
    </div>
  );
}