import React, { useState } from "react";
import { History, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Wrench } from "lucide-react";
import { format, parseISO } from "date-fns";

const CHECK_TYPE_LABELS = {
  DailyCheck: "Daily Check",
  WeeklyCheck: "Weekly Check",
  IssueReport: "Issue Report",
  Repair: "Repair",
  Replacement: "Replacement",
};

const CHECK_TYPE_COLORS = {
  DailyCheck: "bg-green-100 text-green-700",
  WeeklyCheck: "bg-blue-100 text-blue-700",
  IssueReport: "bg-red-100 text-red-700",
  Repair: "bg-amber-100 text-amber-700",
  Replacement: "bg-purple-100 text-purple-700",
};

export default function RepairHistory({ equipmentId, logs, maxVisible = 5 }) {
  const [expanded, setExpanded] = useState(false);

  const eqLogs = logs
    .filter(l => l.equipmentId === equipmentId)
    .sort((a, b) => (b.date > a.date ? 1 : -1));

  if (eqLogs.length === 0) {
    return <p className="text-xs text-[var(--modal-text-muted)] italic">No maintenance logs yet.</p>;
  }

  const visible = expanded ? eqLogs : eqLogs.slice(0, maxVisible);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-2">
        <History className="w-3.5 h-3.5 text-[#6B2FB9]" />
        <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase tracking-wide">Maintenance History</p>
      </div>
      <div className="space-y-1.5">
        {visible.map(log => (
          <div key={log.id} className="flex gap-3 text-xs">
            <div className="flex flex-col items-center shrink-0">
              {log.resolved
                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                : log.checkType === "IssueReport"
                ? <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5" />
                : <Wrench className="w-3.5 h-3.5 text-[#6B2FB9] mt-0.5" />}
              <div className="w-px flex-1 bg-[var(--modal-border)] mt-1 mb-0" />
            </div>
            <div className="pb-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${CHECK_TYPE_COLORS[log.checkType] || "bg-gray-100 text-gray-600"}`}>
                  {CHECK_TYPE_LABELS[log.checkType] || log.checkType}
                </span>
                <span className="text-[var(--modal-text-muted)]">{format(parseISO(log.date), "MMM d, yyyy")}</span>
                {log.resolved && <span className="text-green-600 font-semibold text-[10px]">✓ Resolved</span>}
              </div>
              {log.issueDescription && <p className="text-[var(--modal-text)] leading-snug">{log.issueDescription}</p>}
              {log.actionTaken && <p className="text-[var(--modal-text-muted)] leading-snug mt-0.5">→ {log.actionTaken}</p>}
            </div>
          </div>
        ))}
      </div>
      {eqLogs.length > maxVisible && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-[#6B2FB9] font-semibold flex items-center gap-1 hover:underline"
        >
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {eqLogs.length - maxVisible} more</>}
        </button>
      )}
    </div>
  );
}