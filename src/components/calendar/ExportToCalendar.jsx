import React, { useState, useRef, useEffect } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatICSDate(isoString) {
  return new Date(isoString).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function generateICS(event) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HearingItinerantApp//EN",
    "BEGIN:VEVENT",
    `UID:${event.id || Date.now()}@hearingitinerant`,
    `DTSTART:${formatICSDate(event.startDateTime)}`,
    `DTEND:${formatICSDate(event.endDateTime)}`,
    `SUMMARY:${event.title}`,
    event.locationLabel ? `LOCATION:${event.locationLabel}` : "",
    event.notes ? `DESCRIPTION:${event.notes.replace(/\n/g, "\\n")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  return lines;
}

function getGoogleCalendarUrl(event) {
  const start = new Date(event.startDateTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = new Date(event.endDateTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    ...(event.locationLabel ? { location: event.locationLabel } : {}),
    ...(event.notes ? { details: event.notes } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getOutlookUrl(event) {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: event.startDateTime,
    enddt: event.endDateTime,
    ...(event.locationLabel ? { location: event.locationLabel } : {}),
    ...(event.notes ? { body: event.notes } : {}),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export default function ExportToCalendar({ event, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const downloadICS = () => {
    const ics = generateICS(event);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title || "event"}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(o => !o)}
        className="gap-2 text-[#400070] border-[#400070]/30 hover:bg-[#400070]/5"
      >
        <CalendarPlus className="w-4 h-4" />
        Export to Calendar
      </Button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border border-[var(--modal-border)] rounded-xl shadow-lg z-50 w-52 overflow-hidden">
          <a
            href={getGoogleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--modal-text)] hover:bg-[#F7F3FA] transition-colors"
          >
            <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
            Google Calendar
          </a>
          <a
            href={getOutlookUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--modal-text)] hover:bg-[#F7F3FA] transition-colors border-t border-[var(--modal-border)]"
          >
            <img src="https://outlook.live.com/favicon.ico" alt="" className="w-4 h-4" />
            Outlook Calendar
          </a>
          <button
            onClick={downloadICS}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--modal-text)] hover:bg-[#F7F3FA] transition-colors border-t border-[var(--modal-border)]"
          >
            <CalendarPlus className="w-4 h-4 text-[var(--modal-text-muted)]" />
            Download .ics file
          </button>
        </div>
      )}
    </div>
  );
}