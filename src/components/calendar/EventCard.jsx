import React from "react";
import { parseISO, format } from "date-fns";
import { Car, Video, Users, Clock, MapPin } from "lucide-react";
import { EVENT_COLORS, EVENT_TYPE_LABELS, SETTING_LABELS } from "./calendarUtils";

const SettingIcon = ({ setting, className }) => {
  if (setting === "Telepractice") return <Video className={className} />;
  if (setting === "InPerson") return <Car className={className} />;
  if (setting === "Hybrid") return <Users className={className} />;
  return null;
};

export default function EventCard({ event, onClick, compact = false }) {
  const colors = EVENT_COLORS[event.eventType] || EVENT_COLORS.Other;
  const start = format(parseISO(event.startDateTime), "h:mm a");
  const end = format(parseISO(event.endDateTime), "h:mm a");

  if (compact) {
    return (
      <button
        onClick={() => onClick?.(event)}
        className={`w-full text-left px-2 py-1 rounded-lg border text-xs font-medium truncate ${colors.bg} ${colors.text} ${colors.border}`}
      >
        <span>{start} </span>
        <span>{event.studentInitials ? `${event.studentInitials} · ` : ""}{EVENT_TYPE_LABELS[event.eventType]}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick?.(event)}
      className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <SettingIcon setting={event.setting} className={`w-3.5 h-3.5 ${colors.text}`} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
              {EVENT_TYPE_LABELS[event.eventType]}
            </span>
          </div>
          <p className={`text-sm font-bold truncate ${colors.text}`}>{event.title}</p>
          <div className="flex items-center gap-1 mt-1">
            <Clock className={`w-3 h-3 ${colors.text} opacity-70`} />
            <span className={`text-xs ${colors.text} opacity-80`}>{start} – {end}</span>
          </div>
          {event.studentInitials && (
            <span className={`text-xs font-semibold ${colors.text} mt-0.5 inline-block`}>
              Student: {event.studentInitials}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white ${colors.text}`}>
            {SETTING_LABELS[event.setting]}
          </span>
          {event.driveTimeIncluded && event.driveTimeMinutes > 0 && (
            <span className="text-[10px] flex items-center gap-0.5 text-gray-500">
              <Car className="w-3 h-3" />{event.driveTimeMinutes}m
            </span>
          )}
        </div>
      </div>
    </button>
  );
}