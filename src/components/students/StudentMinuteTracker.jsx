import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const FREQ_LABELS = {
  Daily: "day",
  Weekly: "week",
  Monthly: "month",
  Annually: "year",
  Other: "period",
};

function getRequiredMinutesPerMonth(minutes, frequency) {
  if (!minutes || !frequency) return null;
  switch (frequency) {
    case "Daily":    return minutes * 20; // ~20 school days/month
    case "Weekly":   return minutes * 4;
    case "Monthly":  return minutes;
    case "Annually": return Math.round(minutes / 10); // ~10 months
    default:         return null;
  }
}

export default function StudentMinuteTracker({ student, services, studentId }) {
  const directRequired = student?.directMinutes;
  const directFreq = student?.directMinutesFrequency;
  const indirectRequired = student?.indirectMinutes;
  const indirectFreq = student?.indirectMinutesFrequency;

  // Use current month — normalize both live (ServiceEntry) and demo (services) shapes
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const normalizedServices = (services || []).map(s => ({
    minutes: s.minutes ?? s.durationMinutes ?? 0,
    date: s.date ?? s.sessionDate ?? "",
    monthKey: s.monthKey ?? (s.date ?? s.sessionDate ?? "").slice(0, 7),
    // Demo data has sessionType "Direct"/"Indirect"; live data has category
    category: s.category ?? (s.sessionType === "Direct" ? "DirectService" : s.sessionType === "Indirect" ? "Planning" : "DirectService"),
  }));
  const monthServices = normalizedServices.filter(s => s.monthKey === currentMonthKey);

  const directLogged = monthServices
    .filter(s => s.category === "DirectService")
    .reduce((sum, s) => sum + (s.minutes || 0), 0);

  const indirectLogged = monthServices
    .filter(s => ["Planning", "Consultation"].includes(s.category))
    .reduce((sum, s) => sum + (s.minutes || 0), 0);

  const reqDirectPerMonth = getRequiredMinutesPerMonth(directRequired, directFreq);
  const reqIndirectPerMonth = getRequiredMinutesPerMonth(indirectRequired, indirectFreq);

  const hasAnyData = reqDirectPerMonth || reqIndirectPerMonth;
  if (!hasAnyData) {
    return (
      <div className="modal-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[var(--modal-text)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6B2FB9]" /> Service Minutes — {currentMonthKey}
          </h3>
          <Link to={`${createPageUrl("ServiceHours")}?studentId=${studentId}`}>
            <Button size="sm" className="bg-[#400070] hover:bg-[#5B00A0] text-white h-8 text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Log Session
            </Button>
          </Link>
        </div>
        <p className="text-xs text-[var(--modal-text-muted)]">No IEP service minutes set. Edit the student profile to add required minutes.</p>
      </div>
    );
  }

  return (
    <div className="modal-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[var(--modal-text)] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#6B2FB9]" /> Service Minutes — {currentMonthKey}
        </h3>
        <Link to={`${createPageUrl("ServiceHours")}?studentId=${studentId}`}>
          <Button size="sm" className="bg-[#400070] hover:bg-[#5B00A0] text-white h-8 text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> Log Session
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {reqDirectPerMonth != null && (
          <MinuteRow
            label="Direct Service"
            logged={directLogged}
            required={reqDirectPerMonth}
            freq={directFreq}
            iepMinutes={directRequired}
          />
        )}
        {reqIndirectPerMonth != null && reqIndirectPerMonth > 0 && (
          <MinuteRow
            label="Indirect (Planning/Consult)"
            logged={indirectLogged}
            required={reqIndirectPerMonth}
            freq={indirectFreq}
            iepMinutes={indirectRequired}
          />
        )}
      </div>
    </div>
  );
}

function getStatus(logged, required) {
  if (logged >= required) return logged > required ? "over" : "met";
  return "behind";
}

function MinuteRow({ label, logged, required, freq, iepMinutes }) {
  const status = getStatus(logged, required);
  const remaining = Math.max(0, required - logged);
  const pct = Math.min(100, Math.round((logged / required) * 100));

  const statusConfig = {
    met:    { label: "Met",           color: "text-green-700",  bg: "bg-green-100",  bar: "bg-green-500" },
    over:   { label: "Over-serviced", color: "text-blue-700",   bg: "bg-blue-100",   bar: "bg-blue-500" },
    behind: { label: "Behind",        color: "text-amber-700",  bg: "bg-amber-100",  bar: "bg-amber-500" },
  }[status];

  return (
    <div className="bg-[#F7F3FA] rounded-xl p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-[var(--modal-text)]">{label}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${statusConfig.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-[var(--modal-text-muted)] shrink-0">{pct}%</span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="text-xs font-bold text-[var(--modal-text)]">{required}</p>
          <p className="text-[10px] text-[var(--modal-text-muted)]">Required</p>
        </div>
        <div>
          <p className="text-xs font-bold text-[#6B2FB9]">{logged}</p>
          <p className="text-[10px] text-[var(--modal-text-muted)]">Logged</p>
        </div>
        <div>
          <p className={`text-xs font-bold ${status === "behind" ? "text-amber-600" : "text-green-600"}`}>
            {status === "behind" ? remaining : `+${logged - required}`}
          </p>
          <p className="text-[10px] text-[var(--modal-text-muted)]">{status === "behind" ? "Remaining" : "Over"}</p>
        </div>
      </div>
      {iepMinutes && freq && (
        <p className="text-[10px] text-[var(--modal-text-muted)] mt-1.5">
          IEP: {iepMinutes} min/{FREQ_LABELS[freq] || freq} → ~{required} min/month
        </p>
      )}
    </div>
  );
}