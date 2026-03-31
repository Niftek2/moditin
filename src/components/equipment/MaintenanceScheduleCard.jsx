import React from "react";
import { Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";

const SCHEDULE_INTERVALS = {
  Daily: 1,
  Weekly: 7,
  Monthly: 30,
  None: null,
};

function getMaintenanceStatus(lastLogDate, schedule) {
  const interval = SCHEDULE_INTERVALS[schedule];
  if (!interval || !lastLogDate) return schedule === "None" ? "none" : "overdue";
  const daysSince = differenceInDays(new Date(), parseISO(lastLogDate));
  if (daysSince <= interval) return "ok";
  if (daysSince <= interval * 1.5) return "due_soon";
  return "overdue";
}

export default function MaintenanceScheduleCard({ equipment, logs }) {
  const relevantEquipment = equipment.filter(e => e.reminderSchedule && e.reminderSchedule !== "None" && e.status !== "Retired");

  if (relevantEquipment.length === 0) return null;

  return (
    <div className="modal-card p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-[#400070]" />
        <h2 className="font-semibold text-[var(--modal-text)]">Maintenance Schedule</h2>
      </div>
      <div className="space-y-2">
        {relevantEquipment.map(eq => {
          const eqLogs = logs.filter(l => l.equipmentId === eq.id).sort((a, b) => b.date > a.date ? 1 : -1);
          const lastLog = eqLogs[0];
          const status = getMaintenanceStatus(lastLog?.date, eq.reminderSchedule);

          const statusConfig = {
            ok: { label: "Up to date", color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
            due_soon: { label: "Due soon", color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle },
            overdue: { label: "Overdue", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
          }[status] || { label: "No checks yet", color: "text-gray-500", bg: "bg-gray-50", icon: AlertTriangle };

          const StatusIcon = statusConfig.icon;

          return (
            <div key={eq.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${statusConfig.bg}`}>
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-4 h-4 shrink-0 ${statusConfig.color}`} />
                <div>
                  <p className="text-sm font-medium text-[var(--modal-text)]">{eq.type} {eq.serialNumber ? `· ${eq.serialNumber}` : ""}</p>
                  <p className="text-xs text-[var(--modal-text-muted)]">
                    {eq.reminderSchedule} check · Last: {lastLog ? format(parseISO(lastLog.date), "MMM d, yyyy") : "Never"}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}