import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, CheckCircle2, X } from "lucide-react";
import { createPageUrl } from "../../utils";

function getRequiredMinutesPerMonth(minutes, frequency) {
  if (!minutes || !frequency) return null;
  switch (frequency) {
    case "Daily":    return minutes * 20;
    case "Weekly":   return minutes * 4;
    case "Monthly":  return minutes;
    case "Annually": return Math.round(minutes / 10);
    default:         return null;
  }
}

export default function ComplianceAlert({ students, services, onDismiss }) {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Normalize service entries
  const normalizedServices = (services || []).map(s => ({
    minutes: s.minutes ?? s.durationMinutes ?? 0,
    monthKey: s.monthKey ?? (s.date ?? s.sessionDate ?? "").slice(0, 7),
    studentId: s.studentId,
    category: s.category ?? (s.sessionType === "Direct" ? "DirectService" : "Planning"),
  }));

  const monthServices = normalizedServices.filter(s => s.monthKey === currentMonthKey);

  // Assess each student
  const studentStatuses = (students || [])
    .filter(s => !s.consultOnly)
    .map(student => {
      const reqDirect = getRequiredMinutesPerMonth(student.directMinutes, student.directMinutesFrequency);
      const reqIndirect = getRequiredMinutesPerMonth(student.indirectMinutes, student.indirectMinutesFrequency);
      if (!reqDirect && !reqIndirect) return null;

      const studentServices = monthServices.filter(s => s.studentId === student.id);
      const loggedDirect = studentServices.filter(s => s.category === "DirectService").reduce((sum, s) => sum + s.minutes, 0);
      const loggedIndirect = studentServices.filter(s => ["Planning", "Consultation"].includes(s.category)).reduce((sum, s) => sum + s.minutes, 0);

      const directBehind = reqDirect && loggedDirect < reqDirect;
      const indirectBehind = reqIndirect && reqIndirect > 0 && loggedIndirect < reqIndirect;
      const isBehind = directBehind || indirectBehind;

      // Calculate worst pct for sorting
      const directPct = reqDirect ? Math.round((loggedDirect / reqDirect) * 100) : 100;
      const indirectPct = reqIndirect && reqIndirect > 0 ? Math.round((loggedIndirect / reqIndirect) * 100) : 100;
      const worstPct = Math.min(directPct, indirectPct);

      return { student, isBehind, worstPct, loggedDirect, reqDirect, loggedIndirect, reqIndirect };
    })
    .filter(Boolean);

  const behindStudents = studentStatuses.filter(s => s.isBehind).sort((a, b) => a.worstPct - b.worstPct);
  const onTrackCount = studentStatuses.filter(s => !s.isBehind).length;

  if (studentStatuses.length === 0) return null;

  const allOnTrack = behindStudents.length === 0;

  return (
    <div className={`modal-card p-4 border-l-4 ${allOnTrack ? "border-l-green-500" : "border-l-amber-500"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 mb-3">
          {allOnTrack
            ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          }
          <div>
            <h3 className="text-sm font-bold text-[var(--modal-text)]">
              {allOnTrack ? "All students on track!" : `${behindStudents.length} student${behindStudents.length > 1 ? "s" : ""} behind on minutes`}
            </h3>
            <p className="text-xs text-[var(--modal-text-muted)]">{monthLabel}</p>
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-[var(--modal-text-muted)] hover:text-[var(--modal-text)] shrink-0 mt-0.5" aria-label="Dismiss alert">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!allOnTrack && (
        <div className="space-y-2 mb-3">
          {behindStudents.slice(0, 3).map(({ student, worstPct, loggedDirect, reqDirect }) => (
            <div key={student.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0">
                  {student.studentInitials?.charAt(0) || "?"}
                </div>
                <span className="text-xs font-semibold text-[var(--modal-text)]">{student.studentInitials}</span>
              </div>
              <span className="text-xs text-amber-700 font-medium">{worstPct}% logged</span>
            </div>
          ))}
          {behindStudents.length > 3 && (
            <p className="text-xs text-[var(--modal-text-muted)] text-center">+{behindStudents.length - 3} more</p>
          )}
        </div>
      )}

      <Link
        to={createPageUrl("ComplianceReport")}
        className="flex items-center justify-between w-full text-xs font-semibold text-[#400070] hover:text-[#5B00A0] transition-colors"
      >
        View full compliance report
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}