import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  ArrowLeft, Target, Clock, CalendarDays, Plus, Ear
} from "lucide-react";
import HearingAidIcon from "../components/shared/HearingAidIcon";
import PageHeader from "../components/shared/PageHeader";
import Ling6SessionHistory from "../components/ling6/Ling6SessionHistory";
import AudiologySnapshotView from "../components/audiology/AudiologySnapshotView";
import StudentInteractiveHistory from "../components/interactive/StudentInteractiveHistory";

const TABS = ["Overview", "Audiology", "Interactive", "Contacts", "Goals", "Accommodations", "Service Log", "Equipment", "Listening", "Exports"];

export default function StudentDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("id");
  const defaultTab = params.get("tab") || "Overview";
  const [activeTab, setActiveTab] = useState(defaultTab);

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
      <Link to={createPageUrl("Students")} className="inline-flex items-center gap-2 text-sm text-[var(--modal-text-muted)] hover:text-[#400070] mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Link>

      <PageHeader
        title={student.studentInitials}
        subtitle={`${student.gradeBand} · ${student.serviceDeliveryModel} · ${student.primaryEligibility || "No eligibility set"}`}
      />

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="modal-card p-4 text-center">
          <Target className="w-5 h-5 text-[#6B2FB9] mx-auto mb-2" />
          <p className="text-xl font-bold text-[var(--modal-text)]">{studentGoals.filter(g => g.status === "Active").length}</p>
          <p className="text-xs text-[var(--modal-text-muted)]">Active Goals</p>
        </div>
        <div className="modal-card p-4 text-center">
          <div className="flex justify-center mb-2">
            <HearingAidIcon size={20} strokeColor="#6B2FB9" />
          </div>
          <p className="text-xl font-bold text-[var(--modal-text)]">{equipment.length}</p>
          <p className="text-xs text-[var(--modal-text-muted)]">Equipment</p>
        </div>
        <div className="modal-card p-4 text-center">
          <Clock className="w-5 h-5 text-[#6B2FB9] mx-auto mb-2" />
          <p className="text-xl font-bold text-[var(--modal-text)]">{(totalMinutes / 60).toFixed(1)}h</p>
          <p className="text-xs text-[var(--modal-text-muted)]">Total Hours</p>
        </div>
        <div className="modal-card p-4 text-center">
          <CalendarDays className="w-5 h-5 text-[#6B2FB9] mx-auto mb-2" />
          <p className="text-sm font-bold text-[var(--modal-text)]">{student.iepAnnualReviewDate || "—"}</p>
          <p className="text-xs text-[var(--modal-text-muted)]">Annual Review</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-thin">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? "bg-[#400070] text-white"
                : "bg-white text-[var(--modal-text)] border border-[var(--modal-border)] hover:border-[#6B2FB9] hover:text-[#6B2FB9]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Overview" && (
        <div>
          <div className="modal-card p-6 mb-6">
            <h2 className="font-semibold text-[var(--modal-text)] mb-3">Goals</h2>
            {studentGoals.length === 0 ? (
              <p className="text-sm text-[var(--modal-text-muted)] text-center py-6">No goals assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {studentGoals.slice(0, 5).map(sg => {
                  const goal = goalMap[sg.goalId];
                  return (
                    <div key={sg.id} className="p-3 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
                      <p className="text-sm text-[var(--modal-text)]">{goal?.annualGoal || "Goal not found"}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] bg-[#EADDF5] text-[#400070] border-0">{goal?.domain}</Badge>
                        <Badge variant="secondary" className={`text-[10px] border-0 ${sg.status === "Active" ? "bg-green-100 text-green-700" : sg.status === "Met" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                          {sg.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {(student.notes || student.warmNotes) && (
            <div className="modal-card p-6">
              <h2 className="font-semibold text-[var(--modal-text)] mb-3">Notes</h2>
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
      )}

      {activeTab === "Goals" && (
        <div className="modal-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--modal-text)]">Assigned Goals</h2>
            <Link to={createPageUrl(`GoalBank?studentId=${studentId}`)} className="text-xs text-[#6B2FB9] hover:underline">Browse Goal Bank</Link>
          </div>
          {studentGoals.length === 0 ? (
            <p className="text-sm text-[var(--modal-text-muted)] text-center py-6">No goals assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {studentGoals.map(sg => {
                const goal = goalMap[sg.goalId];
                return (
                  <div key={sg.id} className="p-3 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-[var(--modal-text)]">{goal?.annualGoal || "Goal not found"}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px] bg-[#EADDF5] text-[#400070] border-0">{goal?.domain}</Badge>
                          <Badge variant="secondary" className={`text-[10px] border-0 ${sg.status === "Active" ? "bg-green-100 text-green-700" : sg.status === "Met" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
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
      )}

      {activeTab === "Service Log" && (
        <div className="modal-card p-6">
          <h2 className="font-semibold text-[var(--modal-text)] mb-4">Service Log</h2>
          {services.length === 0 ? (
            <p className="text-sm text-[var(--modal-text-muted)] text-center py-6">No service entries yet.</p>
          ) : (
            <div className="divide-y divide-[var(--modal-border)]">
              {services.map(entry => (
                <div key={entry.id} className="flex justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--modal-text)]">{entry.category?.replace(/([A-Z])/g, " $1").trim()}</p>
                    <p className="text-xs text-[var(--modal-text-muted)]">{entry.date}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#6B2FB9]">{entry.minutes} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Equipment" && (
        <div className="modal-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--modal-text)]">Equipment</h2>
            <Link to={createPageUrl("Equipment")} className="text-xs text-[#6B2FB9] hover:underline">Manage Equipment</Link>
          </div>
          {equipment.length === 0 ? (
            <p className="text-sm text-[var(--modal-text-muted)] text-center py-6">No equipment recorded.</p>
          ) : (
            <div className="space-y-3">
              {equipment.map(eq => (
                <div key={eq.id} className="p-3 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)] flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-[var(--modal-text)]">{eq.type}</p>
                    <p className="text-xs text-[var(--modal-text-muted)]">{eq.description || "—"}</p>
                  </div>
                  <Badge className={`text-xs border-0 ${eq.status === "Active" ? "bg-green-100 text-green-700" : eq.status === "NeedsRepair" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                    {eq.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Listening" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-[var(--modal-text)]">Ling 6 Check History</h2>
              <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">Not diagnostic · For educational planning only</p>
            </div>
            <Link to={createPageUrl(`Ling6Check?studentId=${studentId}`)}>
              <Button className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl text-sm" size="sm">
                <Plus className="w-4 h-4 mr-1" /> New Check
              </Button>
            </Link>
          </div>
          <Ling6SessionHistory studentId={studentId} />
        </div>
      )}

      {activeTab === "Audiology" && (
        <AudiologySnapshotView studentId={studentId} />
      )}

      {activeTab === "Interactive" && (
        <StudentInteractiveHistory studentId={studentId} />
      )}

      {(activeTab === "Contacts" || activeTab === "Accommodations" || activeTab === "Exports") && (
        <div className="modal-card p-10 text-center text-[var(--modal-text-muted)]">
          <p className="text-sm">This section is available from the main navigation.</p>
        </div>
      )}
    </div>
  );
}