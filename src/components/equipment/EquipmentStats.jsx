import React from "react";
import { Wrench, AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default function EquipmentStats({ equipment, logs }) {
  const active = equipment.filter(e => e.status === "Active").length;
  const needsRepair = equipment.filter(e => e.status === "NeedsRepair").length;
  const loaned = equipment.filter(e => e.status === "Loaned").length;
  const openIssues = logs.filter(l => l.checkType === "IssueReport" && !l.resolved).length;

  const stats = [
    { label: "Active", value: active, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200" },
    { label: "Needs Repair", value: needsRepair, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
    { label: "Loaned Out", value: loaned, icon: Clock, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { label: "Open Issues", value: openIssues, icon: Wrench, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(s => (
        <div key={s.label} className={`rounded-xl border p-4 flex items-center gap-3 ${s.bg}`}>
          <s.icon className={`w-5 h-5 shrink-0 ${s.color}`} />
          <div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--modal-text-muted)]">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}