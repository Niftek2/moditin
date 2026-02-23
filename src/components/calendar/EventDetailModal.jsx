import React from "react";
import { format, parseISO } from "date-fns";
import { X, Clock, MapPin, User, Car, Video, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVENT_COLORS, EVENT_TYPE_LABELS, SETTING_LABELS } from "./calendarUtils";
import ExportToCalendar from "./ExportToCalendar";

export default function EventDetailModal({ event, onClose, onEdit, onDelete }) {
  if (!event) return null;
  const colors = EVENT_COLORS[event.eventType] || EVENT_COLORS.Other;
  const start = format(parseISO(event.startDateTime), "h:mm a");
  const end = format(parseISO(event.endDateTime), "h:mm a");
  const date = format(parseISO(event.startDateTime), "EEEE, MMMM d, yyyy");

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[var(--modal-border)]">
        {/* Header */}
        <div className={`p-5 rounded-t-2xl ${colors.bg} border-b ${colors.border}`}>
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wide ${colors.text}`}>
                {EVENT_TYPE_LABELS[event.eventType]}
              </span>
              <h3 className={`text-lg font-bold mt-0.5 ${colors.text}`}>{event.title}</h3>
            </div>
            <button onClick={onClose} className={`${colors.text} opacity-70 hover:opacity-100`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          <DetailRow icon={<Clock className="w-4 h-4" />} label="Time">
            <span>{date}</span>
            <span className="text-[var(--modal-text-muted)]">{start} – {end}</span>
          </DetailRow>

          {event.studentInitials && (
            <DetailRow icon={<User className="w-4 h-4" />} label="Student">
              <span>{event.studentInitials}</span>
            </DetailRow>
          )}

          <DetailRow icon={
            event.setting === "Telepractice" ? <Video className="w-4 h-4" /> : <Car className="w-4 h-4" />
          } label="Setting">
            <span>{SETTING_LABELS[event.setting]}</span>
          </DetailRow>

          {event.locationLabel && (
            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location">
              <span>{event.locationLabel}</span>
            </DetailRow>
          )}

          {event.driveTimeIncluded && event.driveTimeMinutes > 0 && (
            <DetailRow icon={<Car className="w-4 h-4" />} label="Drive Time">
              <span>{event.driveTimeMinutes} minutes</span>
            </DetailRow>
          )}

          {event.bypassDriveWarning && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Drive conflict overridden</p>
                {event.bypassReason && <p className="text-xs text-amber-700 mt-0.5">{event.bypassReason}</p>}
              </div>
            </div>
          )}

          {event.notes && (
            <div className="bg-[#F7F3FA] rounded-xl p-3">
              <p className="text-xs font-semibold text-[var(--modal-text-muted)] mb-1">Notes</p>
              <p className="text-sm text-[var(--modal-text)]">{event.notes}</p>
            </div>
          )}

          {event.reminderMinutes?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--modal-text-muted)] mb-1">Reminders</p>
              <div className="flex flex-wrap gap-1">
                {event.reminderMinutes.map(m => (
                  <span key={m} className="text-xs bg-[#EADDF5] text-[#400070] px-2 py-0.5 rounded-full font-semibold">
                    {m < 60 ? `${m}m before` : m === 1440 ? "1 day before" : `${m/60}h before`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <Button variant="outline" onClick={() => onEdit(event)} className="flex-1 gap-2">
            <Edit2 className="w-4 h-4" /> Edit
          </Button>
          <Button variant="outline" onClick={() => onDelete(event)} className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[var(--modal-text-muted)] mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-[var(--modal-text-muted)]">{label}</p>
        <div className="text-sm font-semibold text-[var(--modal-text)] flex flex-col">{children}</div>
      </div>
    </div>
  );
}