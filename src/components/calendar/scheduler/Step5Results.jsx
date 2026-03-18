import React, { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Loader2, Sparkles, ChevronDown, ChevronUp, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function getSessionsPerWeekFloat(student, durationMinutes) {
  const { directMinutes = 0, directMinutesFrequency = "Weekly" } = student;
  if (!directMinutes || student.consultOnly) return 0;
  const mult = { Daily: 5, Weekly: 1, Monthly: 1 / 4.33, Annually: 1 / 36 }[directMinutesFrequency] ?? 1;
  return (directMinutes * mult) / durationMinutes;
}

function SessionRow({ event }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors">
      <div className="w-1.5 h-1.5 rounded-full bg-[#400070] flex-shrink-0" />
      <span className="text-xs font-semibold text-[var(--modal-text)] w-10 flex-shrink-0">
        {event.studentInitials}
      </span>
      <span className="text-xs text-gray-600">
        {format(new Date(event.startDateTime), "EEE, MMM d")}
      </span>
      <span className="text-xs text-gray-400 ml-auto">
        {format(new Date(event.startDateTime), "h:mm")}–{format(new Date(event.endDateTime), "h:mm a")}
      </span>
      {event.locationLabel && (
        <span className="text-xs text-gray-300 hidden sm:inline">@ {event.locationLabel}</span>
      )}
    </div>
  );
}

export default function Step5Results({
  drafts, students, savedDraftIds, generating, aiOptimizing, finalizing,
  durationMinutes, onAIOptimize, onSaveDrafts, onFinalize, onRegenerate,
}) {
  const [openMonths, setOpenMonths] = useState({});

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-9 h-9 text-[#400070] animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--modal-text)]">Generating your master schedule…</p>
          <p className="text-xs text-gray-400 mt-1">Applying IEP requirements, availability, and travel grouping</p>
        </div>
      </div>
    );
  }

  // Group drafts by month
  const byMonth = {};
  for (const d of drafts) {
    const key = format(new Date(d.startDateTime), "MMMM yyyy");
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(d);
  }

  // Per-student compliance summary
  const dateStart = drafts.length > 0 ? new Date(drafts[0].startDateTime) : new Date();
  const dateEnd = drafts.length > 0 ? new Date(drafts[drafts.length - 1].startDateTime) : new Date();
  const totalWeeks = Math.max(1, Math.ceil((dateEnd - dateStart) / (7 * 86400000)));

  const studentSummary = students.map(s => {
    const scheduled = drafts.filter(d => d.studentId === s.id).length;
    const spw = getSessionsPerWeekFloat(s, durationMinutes);
    const required = Math.round(spw * totalWeeks);
    const ok = required === 0 || scheduled >= required * 0.9;
    return { student: s, scheduled, required, ok, spw };
  });

  const hasDrafts = drafts.length > 0;
  const hasSaved = savedDraftIds.length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--modal-text)]">
            {hasSaved ? "Schedule Saved to Calendar" : "Generated Master Schedule"}
          </h3>
          <p className="text-sm text-[var(--modal-text-muted)]">
            {hasDrafts
              ? `${drafts.length} sessions · ${Object.keys(byMonth).length} month${Object.keys(byMonth).length !== 1 ? "s" : ""}`
              : hasSaved
              ? `${savedDraftIds.length} draft events in your calendar`
              : "No sessions could be scheduled"}
          </p>
        </div>
        {!hasSaved && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 text-xs text-[#400070] hover:underline flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Student compliance grid */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {studentSummary.map(({ student, scheduled, required, ok, spw }) => (
            <div
              key={student.id}
              className={`rounded-xl border px-3 py-2.5 ${
                scheduled > 0
                  ? ok
                    ? "border-green-200 bg-green-50"
                    : "border-amber-200 bg-amber-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <p className="font-semibold text-sm text-[var(--modal-text)]">{student.studentInitials}</p>
                {scheduled > 0 && !ok && <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                {scheduled > 0 && ok && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
              </div>
              <p className={`text-xs mt-0.5 font-medium ${scheduled > 0 ? ok ? "text-green-700" : "text-amber-700" : "text-gray-400"}`}>
                {scheduled} session{scheduled !== 1 ? "s" : ""}
              </p>
              {spw > 0 && (
                <p className="text-xs text-gray-400">
                  ~{spw < 1 ? `${Math.round(spw * 10) / 10}/wk` : `${Math.round(spw)}/wk`} needed
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Month-by-month accordion */}
      {hasDrafts && (
        <div className="space-y-2">
          {Object.entries(byMonth).map(([month, events]) => {
            const isOpen = openMonths[month] !== false;
            return (
              <div key={month} className="border border-[var(--modal-border)] rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenMonths(prev => ({ ...prev, [month]: !isOpen }))}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-[var(--modal-text)]">{month}</span>
                    <span className="text-xs bg-[#F7F3FA] text-[#400070] px-2 py-0.5 rounded-full font-medium">
                      {events.length} session{events.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--modal-border)] divide-y divide-gray-50 max-h-56 overflow-y-auto">
                    {events.map((e, i) => <SessionRow key={i} event={e} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No results */}
      {!hasDrafts && !hasSaved && (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500">No sessions could be scheduled</p>
          <p className="text-xs text-gray-400 mt-1">
            Try expanding your date range, adjusting availability, or reducing blocked times.
          </p>
        </div>
      )}

      {/* Action buttons */}
      {hasDrafts && !hasSaved && (
        <div className="flex gap-2 pt-1">
          <Button
            onClick={onAIOptimize}
            disabled={aiOptimizing}
            variant="outline"
            className="flex-1 text-[#400070] border-[#400070]/30 gap-1.5 text-sm"
          >
            {aiOptimizing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" />}
            AI Optimize Travel
          </Button>
          <Button
            onClick={onSaveDrafts}
            className="flex-1 bg-[#400070] hover:bg-[#5B00A0] text-white text-sm"
          >
            Save to Calendar (Draft)
          </Button>
        </div>
      )}

      {hasSaved && (
        <div className="border border-green-200 bg-green-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-800">
              {savedDraftIds.length} events saved as drafts
            </p>
          </div>
          <p className="text-xs text-green-700 leading-relaxed">
            These appear in your calendar with dashed borders. Review and edit them freely — they won't count as committed sessions until you confirm below.
          </p>
          <Button
            onClick={onFinalize}
            disabled={finalizing}
            className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            {finalizing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle2 className="w-4 h-4" />}
            Commit All to Calendar
          </Button>
        </div>
      )}
    </div>
  );
}