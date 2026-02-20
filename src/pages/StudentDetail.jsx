import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  ArrowLeft, Target, Headphones, Clock, ClipboardCheck, UserCircle, CalendarDays
} from "lucide-react";
import PageHeader from "../components/shared/PageHeader";

export default function StudentDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("id");
  const queryClient = useQueryClient();

  const { data: student } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const students = await base44.entities.Student.list();
      return students.find(s => s.id === studentId);
    },
    enabled: !!studentId,
  });

  const { data: studentGoals = [] } = useQuery({
    queryKey: ["studentGoals", studentId],
    queryFn: () => base44.entities.StudentGoal.filter({ studentId }),
    enabled: !!studentId,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.list(),
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment", studentId],
    queryFn: () => base44.entities.Equipment.filter({ studentId }),
    enabled: !!studentId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", studentId],
    queryFn: () => base44.entities.ServiceEntry.filter({ studentId }),
    enabled: !!studentId,
  });

  if (!student) {
    return <div className="text-center py-16 text-[var(--modal-text-muted)]">Loading...</div>;
  }

  const goalMap = {};
  goals.forEach(g => { goalMap[g.id] = g; });

  const totalMinutes = services.reduce((sum, s) => sum + (s.minutes || 0), 0);

  return (
    <div>
      <Link to={createPageUrl("Students")} className="inline-flex items-center gap-2 text-sm text-[var(--modal-text-muted)] hover:text-white mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Link>

      <PageHeader
        title={student.studentInitials}
        subtitle={`${student.gradeBand} · ${student.serviceDeliveryModel} · ${student.primaryEligibility || "No eligibility set"}`}
      />

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="modal-card p-4 text-center">
          <Target className="w-5 h-5 text-[var(--modal-purple-glow)] mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{studentGoals.filter(g => g.status === "Active").length}</p>
          <p className="text-xs text-[var(--modal-text-muted)]">Active Goals</p>
        </div>
        <div className="modal-card p-4 text-center">
          <Headphones className="w-5 h-5 text-[var(--modal-purple-glow)] mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{equipment.length}</p>
          <p className="text-xs text-[var(--modal-text-muted)]">Equipment</p>
        </div>
        <div className="modal-card p-4 text-center">
          <Clock className="w-5 h-5 text-[var(--modal-purple-glow)] mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{(totalMinutes / 60).toFixed(1)}h</p>
          <p className="text-xs text-[var(--modal-text-muted)]">Total Hours</p>
        </div>
        <div className="modal-card p-4 text-center">
          <CalendarDays className="w-5 h-5 text-[var(--modal-purple-glow)] mx-auto mb-2" />
          <p className="text-sm font-bold text-white">{student.iepAnnualReviewDate || "—"}</p>
          <p className="text-xs text-[var(--modal-text-muted)]">Annual Review</p>
        </div>
      </div>

      {/* Goals Section */}
      <div className="modal-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Assigned Goals</h2>
          <Link to={createPageUrl(`GoalBank?studentId=${studentId}`)} className="text-xs text-[var(--modal-purple-glow)] hover:underline">Browse Goal Bank</Link>
        </div>
        {studentGoals.length === 0 ? (
          <p className="text-sm text-[var(--modal-text-muted)] text-center py-6">No goals assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {studentGoals.map(sg => {
              const goal = goalMap[sg.goalId];
              return (
                <div key={sg.id} className="p-3 rounded-xl bg-white/5 border border-[var(--modal-border)]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-white">{goal?.annualGoal || "Goal not found"}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] bg-[#400070]/30 text-[var(--modal-purple-glow)] border-0">{goal?.domain}</Badge>
                        <Badge variant="secondary" className={`text-[10px] border-0 ${sg.status === "Active" ? "bg-green-500/20 text-green-400" : sg.status === "Met" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>
                          {sg.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      {(student.notes || student.warmNotes) && (
        <div className="modal-card p-6">
          <h2 className="font-semibold text-white mb-3">Notes</h2>
          {student.warmNotes && (
            <div className="mb-3">
              <p className="text-xs text-[var(--modal-text-muted)] mb-1">Warm Notes</p>
              <p className="text-sm text-[var(--modal-text)]">{student.warmNotes}</p>
            </div>
          )}
          {student.notes && (
            <div>
              <p className="text-xs text-[var(--modal-text-muted)] mb-1">General Notes</p>
              <p className="text-sm text-[var(--modal-text)]">{student.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}