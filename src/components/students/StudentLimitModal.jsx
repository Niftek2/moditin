import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Users, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { isIosPlatform } from "../shared/platformUtils";

const FREE_STUDENT_LIMIT = 3;

export default function StudentLimitModal({ students, onStudentsKept, onUpgrade }) {
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < FREE_STUDENT_LIMIT) {
        next.add(id);
      }
      return next;
    });
  };

  const handleKeep = async () => {
    if (selected.size !== FREE_STUDENT_LIMIT) return;
    setSaving(true);
    const toDelete = students.filter((s) => !selected.has(s.id));
    await Promise.all(toDelete.map((s) => base44.entities.Student.delete(s.id)));
    setSaving(false);
    onStudentsKept();
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="bg-white border-[var(--modal-border)] max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-[var(--modal-text)]">Your trial has ended</h2>
          <p className="text-sm text-[var(--modal-text-muted)] mt-1">
            You have <strong>{students.length} students</strong> on your roster. The free plan allows up to{" "}
            <strong>{FREE_STUDENT_LIMIT}</strong>. Please select <strong>{FREE_STUDENT_LIMIT}</strong> students to keep,
            or upgrade to retain all students.
          </p>
        </div>

        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {students.map((student) => {
            const isSelected = selected.has(student.id);
            const isDisabled = !isSelected && selected.size >= FREE_STUDENT_LIMIT;
            return (
              <button
                key={student.id}
                onClick={() => toggleSelect(student.id)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-[#400070] bg-[#EADDF5]"
                    : isDisabled
                    ? "border-[var(--modal-border)] bg-gray-50 opacity-40 cursor-not-allowed"
                    : "border-[var(--modal-border)] bg-white hover:bg-[var(--modal-card-hover)]"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#400070]/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#400070]">{student.studentInitials?.slice(0, 2) || "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--modal-text)]">{student.studentInitials}</p>
                  <p className="text-xs text-[var(--modal-text-muted)]">{student.gradeBand} · {student.serviceDeliveryModel}</p>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-[#400070] shrink-0" />}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-center text-[var(--modal-text-muted)] mb-4">
          {selected.size} / {FREE_STUDENT_LIMIT} selected
          {selected.size === FREE_STUDENT_LIMIT && (
            <span className="text-green-600 font-medium"> — ready to confirm</span>
          )}
        </p>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleKeep}
            disabled={selected.size !== FREE_STUDENT_LIMIT || saving}
            className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Keep Selected Students
          </Button>
          <Button
            onClick={onUpgrade}
            variant="outline"
            className="w-full rounded-xl border-[#400070] text-[#400070] hover:bg-[#EADDF5] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Keep All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}