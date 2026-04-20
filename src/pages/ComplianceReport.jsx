import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CheckCircle2, AlertTriangle, ChevronRight, Clock, ArrowLeft } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { createPageUrl } from "../utils";
import { useDemo } from "../components/demo/DemoContext";

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

function StatusBadge({ pct }) {
  if (pct >= 100) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Met</span>;
  if (pct >= 70)  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">On Track</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Behind</span>;
}

function StudentComplianceCard({ student, services, monthKey }) {
  const reqDirect = getRequiredMinutesPerMonth(student.directMinutes, student.directMinutesFrequency);
  const reqIndirect = getRequiredMinutesPerMonth(student.indirectMinutes, student.indirectMinutesFrequency);

  const studentServices = (services || []).filter(s => {
    const mk = s.monthKey ?? (s.date ?? s.sessionDate ?? "").slice(0, 7);
    return mk === monthKey && s.studentId === student.id;
  });

  const loggedDirect = studentServices
    .filter(s => (s.category ?? (s.sessionType === "Direct" ? "DirectService" : "")) === "DirectService")
    .reduce((sum, s) => sum + (s.minutes ?? s.durationMinutes ?? 0), 0);

  const loggedIndirect = studentServices
    .filter(s => ["Planning", "Consultation"].includes(s.category ?? (s.sessionType === "Indirect" ? "Planning" : "")))
    .reduce((sum, s) => sum + (s.minutes ?? s.durationMinutes ?? 0), 0);

  const directPct = reqDirect ? Math.min(100, Math.round((loggedDirect / reqDirect) * 100)) : null;
  const indirectPct = reqIndirect && reqIndirect > 0 ? Math.min(100, Math.round((loggedIndirect / reqIndirect) * 100)) : null;

  if (!reqDirect && !reqIndirect) return null;

  return (
    <Link
      to={createPageUrl(`StudentDetail?id=${student.id}`)}
      className="modal-card p-4 flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all block"
    >
      <div className="w-9 h-9 rounded-full bg-[#6B2FB9] text-white text-sm font-bold flex items-center justify-center shrink-0">
        {student.studentInitials?.charAt(0) || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-sm font-bold text-[var(--modal-text)]">{student.studentInitials}</p>
          <ChevronRight className="w-4 h-4 text-[var(--modal-border)] shrink-0" />
        </div>
        <div className="space-y-2">
          {reqDirect != null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--modal-text-muted)]">Direct — {loggedDirect}/{reqDirect} min</span>
                <StatusBadge pct={directPct} />
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${directPct >= 100 ? "bg-green-500" : directPct >= 70 ? "bg-yellow-400" : "bg-amber-500"}`}
                  style={{ width: `${directPct}%` }}
                />
              </div>
            </div>
          )}
          {indirectPct != null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--modal-text-muted)]">Indirect — {loggedIndirect}/{reqIndirect} min</span>
                <StatusBadge pct={indirectPct} />
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${indirectPct >= 100 ? "bg-green-500" : indirectPct >= 70 ? "bg-yellow-400" : "bg-amber-500"}`}
                  style={{ width: `${indirectPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ComplianceReport() {
  const [user, setUser] = useState(null);
  const { isDemoMode, demoData } = useDemo();

  // Allow selecting months — default to current
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);

  useEffect(() => {
    if (isDemoMode) return;
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, [isDemoMode]);

  const { data: studentsRaw = [] } = useQuery({
    queryKey: ["students-compliance", user?.email],
    queryFn: () => base44.entities.Student.filter({ created_by: user?.email }),
    enabled: !!user?.email && !isDemoMode,
  });
  const students = isDemoMode ? demoData.students : studentsRaw;

  const { data: servicesRaw = [] } = useQuery({
    queryKey: ["services-compliance", user?.email, selectedMonth],
    queryFn: () => base44.entities.ServiceEntry.filter({ created_by: user?.email, monthKey: selectedMonth }),
    enabled: !!user?.email && !isDemoMode,
  });
  const services = isDemoMode ? demoData.services : servicesRaw;

  const activeStudents = students.filter(s => !s.consultOnly);

  // Summary stats
  const studentStats = activeStudents.map(student => {
    const reqDirect = getRequiredMinutesPerMonth(student.directMinutes, student.directMinutesFrequency);
    const reqIndirect = getRequiredMinutesPerMonth(student.indirectMinutes, student.indirectMinutesFrequency);
    if (!reqDirect && !reqIndirect) return null;

    const studentServices = services.filter(s => {
      const mk = s.monthKey ?? (s.date ?? s.sessionDate ?? "").slice(0, 7);
      return mk === selectedMonth && s.studentId === student.id;
    });
    const loggedDirect = studentServices.filter(s => (s.category ?? (s.sessionType === "Direct" ? "DirectService" : "")) === "DirectService").reduce((sum, s) => sum + (s.minutes ?? s.durationMinutes ?? 0), 0);
    const loggedIndirect = studentServices.filter(s => ["Planning", "Consultation"].includes(s.category ?? "")).reduce((sum, s) => sum + (s.minutes ?? s.durationMinutes ?? 0), 0);

    const directPct = reqDirect ? Math.round((loggedDirect / reqDirect) * 100) : 100;
    const indirectPct = reqIndirect && reqIndirect > 0 ? Math.round((loggedIndirect / reqIndirect) * 100) : 100;
    const worstPct = Math.min(directPct, indirectPct);
    return { student, worstPct, isBehind: worstPct < 100 };
  }).filter(Boolean);

  const onTrackCount = studentStats.filter(s => !s.isBehind).length;
  const behindCount = studentStats.filter(s => s.isBehind).length;

  const monthLabel = (mk) => {
    const [y, m] = mk.split("-");
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link to={createPageUrl("Dashboard")} className="text-[var(--modal-text-muted)] hover:text-[var(--modal-text)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader title="Compliance Report" subtitle="Monthly service minute compliance by student" />
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 flex-wrap">
        {monthOptions.map(mk => (
          <button
            key={mk}
            onClick={() => setSelectedMonth(mk)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedMonth === mk
                ? "bg-[#400070] text-white border-[#400070]"
                : "bg-white text-[var(--modal-text)] border-[var(--modal-border)] hover:border-[#6B2FB9]"
            }`}
          >
            {monthLabel(mk)}
          </button>
        ))}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="modal-card p-4 text-center">
          <p className="text-2xl font-bold text-[var(--modal-text)]">{studentStats.length}</p>
          <p className="text-xs text-[var(--modal-text-muted)] mt-1">Tracked</p>
        </div>
        <div className="modal-card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{onTrackCount}</p>
          <p className="text-xs text-[var(--modal-text-muted)] mt-1">On Track</p>
        </div>
        <div className="modal-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{behindCount}</p>
          <p className="text-xs text-[var(--modal-text-muted)] mt-1">Behind</p>
        </div>
      </div>

      {/* Behind Students */}
      {behindCount > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-bold text-amber-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Needs Attention
          </h2>
          {studentStats
            .filter(s => s.isBehind)
            .sort((a, b) => a.worstPct - b.worstPct)
            .map(({ student }) => (
              <StudentComplianceCard key={student.id} student={student} services={services} monthKey={selectedMonth} />
            ))}
        </div>
      )}

      {/* On Track Students */}
      {onTrackCount > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-bold text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> On Track
          </h2>
          {studentStats
            .filter(s => !s.isBehind)
            .map(({ student }) => (
              <StudentComplianceCard key={student.id} student={student} services={services} monthKey={selectedMonth} />
            ))}
        </div>
      )}

      {studentStats.length === 0 && (
        <div className="modal-card p-8 text-center">
          <Clock className="w-10 h-10 text-[var(--modal-border)] mx-auto mb-3" />
          <p className="text-sm text-[var(--modal-text-muted)]">No students with IEP service minutes set.</p>
          <p className="text-xs text-[var(--modal-text-muted)] mt-1">Add required minutes to student profiles to track compliance.</p>
        </div>
      )}
    </div>
  );
}