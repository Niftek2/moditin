import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ClipboardList, Wrench, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import HearingAidIcon from "../shared/HearingAidIcon";
import RepairHistory from "./RepairHistory";

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  NeedsRepair: "bg-red-100 text-red-700",
  Loaned: "bg-blue-100 text-blue-700",
  Retired: "bg-gray-100 text-gray-600",
};

export default function EquipmentCard({ eq, logs, onLogCheck, onTroubleshoot, onEdit, onDelete, isDemoMode }) {
  const [expanded, setExpanded] = useState(false);
  const eqLogs = logs.filter(l => l.equipmentId === eq.id);
  const unresolvedCount = eqLogs.filter(l => l.checkType === "IssueReport" && !l.resolved).length;

  return (
    <div className="bg-white border border-[var(--modal-border)] rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EADDF5] flex items-center justify-center shrink-0">
              <HearingAidIcon size={18} strokeColor="var(--modal-purple)" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--modal-text)]">{eq.type}</p>
              {eq.description && <p className="text-xs text-[var(--modal-text-muted)]">{eq.description}</p>}
              {eq.serialNumber && (
                <p className="text-[10px] text-[var(--modal-text-muted)] font-mono mt-0.5">S/N: {eq.serialNumber}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge className={`text-[10px] border-0 ${STATUS_COLORS[eq.status] || "bg-gray-100 text-gray-600"}`}>
              {eq.status}
            </Badge>
            {unresolvedCount > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span className="text-[10px] font-semibold">{unresolvedCount} open</span>
              </div>
            )}
          </div>
        </div>

        {/* Action row */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {!isDemoMode && (
            <>
              <Button size="sm" variant="outline" className="text-xs gap-1 border-[var(--modal-border)] text-[var(--modal-text-muted)]" onClick={onLogCheck}>
                <ClipboardList className="w-3.5 h-3.5" /> Log Check
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1 border-[var(--modal-border)] text-[var(--modal-text-muted)]" onClick={onTroubleshoot}>
                <Wrench className="w-3.5 h-3.5" /> Troubleshoot
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1 border-[var(--modal-border)] text-[var(--modal-text-muted)]" onClick={onEdit}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1 border-red-200 text-red-600" onClick={onDelete}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-[#6B2FB9] font-semibold flex items-center gap-1 ml-auto hover:underline"
          >
            {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide history</> : <><ChevronDown className="w-3.5 h-3.5" /> {eqLogs.length > 0 ? `${eqLogs.length} log${eqLogs.length !== 1 ? "s" : ""}` : "History"}</>}
          </button>
        </div>
      </div>

      {/* Expanded history */}
      {expanded && (
        <div className="border-t border-[var(--modal-border)] bg-[#F7F3FA] px-4 py-4">
          <RepairHistory equipmentId={eq.id} logs={logs} />
        </div>
      )}
    </div>
  );
}