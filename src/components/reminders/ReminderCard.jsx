import React from "react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { Check, Clock, Pencil, RotateCcw, Trash2 } from "lucide-react";

const PRIORITY_STYLES = {
  High: { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  Medium: { dot: "bg-purple-400", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  Low: { dot: "bg-gray-300", badge: "bg-gray-50 text-gray-600 border-gray-200" },
};

const SNOOZE_OPTIONS = [5, 10, 30, 60];

export default function ReminderCard({ reminder, onComplete, onSnooze, onEdit, onDelete, compact = false }) {
  const due = parseISO(reminder.dueDateTime);
  const isOverdue = isPast(due) && reminder.status === "Pending";
  const isSnoozed = reminder.status === "Snoozed";
  const priority = PRIORITY_STYLES[reminder.priority] || PRIORITY_STYLES.Medium;

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      isOverdue
        ? "bg-amber-50 border-amber-200"
        : isSnoozed
        ? "bg-[#F7F3FA] border-[var(--modal-border)]"
        : "bg-white border-[var(--modal-border)]"
    }`}>
      <div className="flex items-start gap-3">
        {/* Priority dot */}
        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${priority.dot}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--modal-text)] leading-snug">{reminder.title}</p>
            <div className="flex items-center gap-2 shrink-0">
              {onEdit && (
                <button onClick={() => onEdit(reminder)} className="text-[var(--modal-text-muted)] hover:text-[#6B2FB9] transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(reminder)} className="text-[var(--modal-text-muted)] hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priority.badge}`}>
              {reminder.priority}
            </span>
            {reminder.linkedStudentInitials && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EADDF5] text-[#400070] border border-[#D4B9F0]">
                {reminder.linkedStudentInitials}
              </span>
            )}
            {isOverdue && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                Overdue
              </span>
            )}
            {isSnoozed && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                Snoozed
              </span>
            )}
            {reminder.recurrence !== "None" && (
              <span className="text-[10px] text-[var(--modal-text-muted)] flex items-center gap-0.5">
                <RotateCcw className="w-2.5 h-2.5" />
                {reminder.recurrence === "CustomIntervalDays"
                  ? `Every ${reminder.customIntervalDays}d`
                  : reminder.recurrence}
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--modal-text-muted)] mt-1.5">
            Due {isToday(due) ? `Today at ${format(due, "h:mm a")}` : format(due, "MMM d · h:mm a")}
          </p>

          {reminder.description && !compact && (
            <p className="text-xs text-[var(--modal-text-muted)] mt-1 line-clamp-2">{reminder.description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      {(onComplete || onSnooze) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--modal-border)]">
          {onComplete && reminder.status !== "Completed" && (
            <button
              onClick={() => onComplete(reminder)}
              className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Complete
            </button>
          )}
          {onSnooze && SNOOZE_OPTIONS.map(m => (
            <button
              key={m}
              onClick={() => onSnooze(reminder, m)}
              className="flex items-center gap-0.5 text-[10px] text-[var(--modal-text-muted)] border border-[var(--modal-border)] px-2 py-1 rounded-full hover:border-[#400070] hover:text-[#400070] transition-colors"
            >
              <Clock className="w-2.5 h-2.5" />+{m < 60 ? `${m}m` : "1h"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}