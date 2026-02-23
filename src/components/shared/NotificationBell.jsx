import React, { useState } from "react";
import { Bell, X, Check, Clock, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO, addMinutes, isPast, isToday } from "date-fns";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const now = new Date();

  const { data: appNotifications = [] } = useQuery({
    queryKey: ["appNotifications"],
    queryFn: () => base44.entities.AppNotification.list("-triggerDateTime", 50),
    refetchInterval: 60000,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders-bell"],
    queryFn: () => base44.entities.PersonalReminder.list("-dueDateTime", 100),
    refetchInterval: 60000,
  });

  // App notifications (calendar-based)
  const visibleAppNotifs = appNotifications.filter(n => {
    if (n.isRead) return false;
    const trigger = new Date(n.triggerDateTime);
    if (trigger > now) return false;
    if (n.snoozedUntil && new Date(n.snoozedUntil) > now) return false;
    return true;
  });

  // Reminder alerts: due now/overdue and pending
  const dueReminders = reminders.filter(r => {
    if (r.status === "Completed") return false;
    if (r.status === "Snoozed" && r.snoozeUntil && new Date(r.snoozeUntil) > now) return false;
    const due = new Date(r.dueDateTime);
    const trigger = new Date(due.getTime() - (r.reminderLeadTimeMinutes || 15) * 60000);
    return trigger <= now && isPast(due) === false ? true : isPast(due);
  }).slice(0, 10);

  const totalUnread = visibleAppNotifs.length + dueReminders.length;

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.AppNotification.update(id, { isRead: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appNotifications"] }),
  });

  const snoozeAppNotif = useMutation({
    mutationFn: ({ id, mins }) => base44.entities.AppNotification.update(id, {
      snoozedUntil: addMinutes(new Date(), mins).toISOString()
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appNotifications"] }),
  });

  const snoozeReminder = async (id, mins) => {
    await base44.entities.PersonalReminder.update(id, {
      status: "Snoozed",
      snoozeUntil: new Date(Date.now() + mins * 60000).toISOString(),
    });
    qc.invalidateQueries({ queryKey: ["reminders-bell"] });
    qc.invalidateQueries({ queryKey: ["reminders"] });
  };

  const completeReminder = async (id) => {
    await base44.entities.PersonalReminder.update(id, { status: "Completed", completedAt: new Date().toISOString() });
    qc.invalidateQueries({ queryKey: ["reminders-bell"] });
    qc.invalidateQueries({ queryKey: ["reminders"] });
  };

  const markAll = async () => {
    await Promise.all(visibleAppNotifs.map(n => base44.entities.AppNotification.update(n.id, { isRead: true })));
    qc.invalidateQueries({ queryKey: ["appNotifications"] });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-[var(--modal-text-muted)] hover:text-[#400070] hover:bg-[#EADDF5] transition-all"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#400070] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-80 bg-white border border-[var(--modal-border)] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--modal-border)]">
              <h3 className="text-sm font-bold text-[var(--modal-text)]">
                Notifications {totalUnread > 0 && <span className="ml-1 text-xs bg-[#EADDF5] text-[#400070] rounded-full px-1.5 py-0.5">{totalUnread}</span>}
              </h3>
              <div className="flex items-center gap-2">
                {visibleAppNotifs.length > 0 && (
                  <button onClick={markAll} className="text-xs text-[#400070] hover:underline font-semibold">Mark all read</button>
                )}
                <button onClick={() => setOpen(false)}>
                  <X className="w-4 h-4 text-[var(--modal-text-muted)]" />
                </button>
              </div>
            </div>

            <div className="max-h-[28rem] overflow-y-auto">
              {totalUnread === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-[var(--modal-border)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--modal-text-muted)]">No new notifications</p>
                </div>
              ) : (
                <>
                  {/* Due reminders */}
                  {dueReminders.map(r => (
                    <div key={`r-${r.id}`} className="px-4 py-3 border-b border-[var(--modal-border)] last:border-0 hover:bg-[#F7F3FA]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--modal-text)] truncate">{r.title}</p>
                            {r.linkedStudentInitials && (
                              <p className="text-xs text-[#6B2FB9] font-medium">{r.linkedStudentInitials}</p>
                            )}
                            <p className="text-[10px] text-[var(--modal-text-muted)] mt-0.5">
                              Due {isToday(parseISO(r.dueDateTime)) ? `today at ${format(parseISO(r.dueDateTime), "h:mm a")}` : format(parseISO(r.dueDateTime), "MMM d")}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => completeReminder(r.id)} className="text-[var(--modal-text-muted)] hover:text-green-600 shrink-0" title="Mark complete">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {[5, 10, 30].map(m => (
                          <button key={m} onClick={() => snoozeReminder(r.id, m)}
                            className="text-[10px] text-[var(--modal-text-muted)] border border-[var(--modal-border)] px-2 py-0.5 rounded-full hover:border-[#400070] hover:text-[#400070] transition-colors flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />+{m}m
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* App notifications */}
                  {visibleAppNotifs.map(n => (
                    <div key={`n-${n.id}`} className="px-4 py-3 border-b border-[var(--modal-border)] last:border-0 hover:bg-[#F7F3FA]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--modal-text)] truncate">{n.title}</p>
                          <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-[var(--modal-text-muted)] mt-1">
                            {format(parseISO(n.triggerDateTime), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <button onClick={() => markRead.mutate(n.id)} className="text-[var(--modal-text-muted)] hover:text-green-600 shrink-0" title="Mark read">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {[5, 10, 30].map(m => (
                          <button key={m} onClick={() => snoozeAppNotif.mutate({ id: n.id, mins: m })}
                            className="text-[10px] text-[var(--modal-text-muted)] border border-[var(--modal-border)] px-2 py-0.5 rounded-full hover:border-[#400070] hover:text-[#400070] transition-colors flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />+{m}m
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}