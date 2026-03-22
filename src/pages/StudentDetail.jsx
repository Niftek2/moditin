import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  ArrowLeft, Target, Clock, CalendarDays, Plus, Ear, Zap, FileText, Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { redactPII } from "@/components/shared/PIIGuard";
import StudentAccommodationsTab from "@/components/students/StudentAccommodationsTab";
import StudentExportsTab from "@/components/students/StudentExportsTab";
import { trackStudentView } from "@/components/layout/Sidebar";
import HearingAidIcon from "../components/shared/HearingAidIcon";
import PageHeader from "../components/shared/PageHeader";
import Ling6SessionHistory from "../components/ling6/Ling6SessionHistory";
import AudiologySnapshotView from "../components/audiology/AudiologySnapshotView";
import StudentInteractiveHistory from "../components/interactive/StudentInteractiveHistory";
import ActivityHistory from "../components/labeling/ActivityHistory";
import GoalBankModal from "../components/goalbank/GoalBankModal";
import GoalProgressTracker from "../components/goals/GoalProgressTracker";
import StudentContactsSection from "../components/students/StudentContactsSection";
import StudentScheduleSection from "../components/students/StudentScheduleSection";
import { useDemo } from "../components/demo/DemoContext";

const TABS = ["Overview", "Details", "Goals", "Accommodations", "Schedule", "Service Log", "Equipment", "Listening", "Audiology", "Interactive", "Activities", "Contacts", "Exports"];

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState as useCollapsibleState } from "react";

export default function StudentDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("id");
  const defaultTab = params.get("tab") || "Overview";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [expandedSection, setExpandedSection] = useCollapsibleState(null);
  const navigate = useNavigate();
  const [showGoalBank, setShowGoalBank] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = React.useState(null);
  const { isDemoMode, demoData } = useDemo();

  React.useEffect(() => {
    if (!isDemoMode) {
      base44.auth.me().then(u => setCurrentUserEmail(u?.email)).catch(() => {});
    }
  }, [isDemoMode]);

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["student", studentId, currentUserEmail, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return demoData.students.find(s => s.id === studentId) || null;
      }
      const results = await base44.entities.Student.filter({ id: studentId, created_by: currentUserEmail });
      return results[0] || null;
    },
    enabled: isDemoMode ? !!studentId : (!!studentId && !!currentUserEmail),
  });

  const { data: studentGoals = [] } = useQuery({
    queryKey: ["studentGoals", studentId, currentUserEmail, isDemoMode],
    queryFn: () => {
      if (isDemoMode) return demoData.studentGoals.filter(g => g.studentId === studentId);
      return base44.entities.StudentGoal.filter({ studentId, created_by: currentUserEmail });
    },
    enabled: isDemoMode ? !!studentId : (!!studentId && !!currentUserEmail),
  });

  React.useEffect(() => {
    if (student) {
      trackStudentView(studentId, student.studentInitials);
    }
  }, [student?.id]);

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", isDemoMode],
    queryFn: () => {
      if (isDemoMode) return demoData.goalBank;
      return base44.entities.Goal.list();
    },
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment", studentId, currentUserEmail, isDemoMode],
    queryFn: () => {
      if (isDemoMode) return demoData.equipment.filter(e => e.studentId === studentId);
      return base44.entities.Equipment.filter({ studentId, created_by: currentUserEmail });
    },
    enabled: isDemoMode ? !!studentId : (!!studentId && !!currentUserEmail),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", studentId, currentUserEmail, isDemoMode],
    queryFn: () => {
      if (isDemoMode) return demoData.services.filter(s => s.studentId === studentId);
      return base44.entities.ServiceEntry.filter({ studentId, created_by: currentUserEmail });
    },
    enabled: isDemoMode ? !!studentId : (!!studentId && !!currentUserEmail),
  });

  const { data: iepMeetings = [] } = useQuery({
    queryKey: ["iepMeetings", studentId, currentUserEmail, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) return (demoData.calendarEvents || []).filter(e => e.studentId === studentId && e.eventType === "IEPMeeting");
      return base44.entities.CalendarEvent.filter({ studentId, eventType: "IEPMeeting", created_by: currentUserEmail });
    },
    enabled: isDemoMode ? !!studentId : (!!studentId && !!currentUserEmail),
  });

  const now = new Date();
  const nextIepMeeting = iepMeetings
    .filter(e => new Date(e.startDateTime) >= now)
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))[0] || null;
  const lastIepMeeting = iepMeetings
    .filter(e => new Date(e.startDateTime) < now)
    .sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime))[0] || null;

  if (!isDemoMode && (!currentUserEmail || studentLoading)) {
    return <div className="text-center py-16 text-[var(--modal-text-muted)]">Loading...</div>;
  }

  if (isDemoMode && studentLoading) {
    return <div className="text-center py-16 text-[var(--modal-text-muted)]">Loading...</div>;
  }

  if (!student) {
    return <div className="text-center py-16 text-red-600 font-semibold">Student not found or you do not have permission to view this student.</div>;
  }

  const goalMap = {};
  goals.forEach(g => { goalMap[g.id] = g; });

  const totalMinutes = services.reduce((sum, s) => sum + (s.minutes || 0), 0);

  return (
    <div>
      <button
        onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate(createPageUrl("Students"))}
        className="inline-flex items-center gap-2 text-sm text-[var(--modal-text-muted)] hover:text-[#400070] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      <PageHeader
        title={student.studentInitials}
        subtitle={`${student.gradeBand} · ${student.serviceDeliveryModel} · ${student.primaryEligibility || "No eligibility set"}`}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-thin" role="tablist" aria-label="Student information sections">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`tab-${tab}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] ${
              activeTab === tab
                ? "bg-[#400070] text-white"
                : "bg-white text-[var(--modal-text)] border border-[var(--modal-border)] hover:border-[#6B2FB9] hover:text-[#6B2FB9]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3 Main Cards: Overview */}
      {activeTab === "Overview" && (
        <div className="space-y-4 mb-6">
          {/* Card 1: Goals */}
          <div className="modal-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--modal-text)] flex items-center gap-2">
                <Target className="w-5 h-5 text-[#6B2FB9]" aria-hidden="true" />
                Goals
              </h2>
              <p className="text-xl font-bold text-[#6B2FB9]" aria-label="Active goals">{studentGoals.filter(g => g.status === "Active").length}</p>
            </div>
            <p className="text-xs text-[var(--modal-text-muted)] mb-4">
              {studentGoals.length === 0 ? "No goals assigned" : `Last updated: ${studentGoals[0]?.updated_date ? new Date(studentGoals[0].updated_date).toLocaleDateString() : "—"}`}
            </p>
            <Button onClick={() => setShowGoalBank(true)} className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-12" aria-label="Add a new goal for this student">
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> Add Goal
            </Button>
          </div>

          {/* Card 2: Sessions */}
          <div className="modal-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--modal-text)] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#6B2FB9]" aria-hidden="true" />
                Sessions
              </h2>
              <p className="text-xl font-bold text-[#6B2FB9]" aria-label="Total hours">{(totalMinutes / 60).toFixed(1)}h</p>
            </div>
            <p className="text-xs text-[var(--modal-text-muted)] mb-4">
              {services.length === 0 ? "No sessions logged" : `Last logged: ${services[0]?.date || "—"}`}
            </p>
            <Link to={createPageUrl("ServiceHours")} className="w-full">
              <Button className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-12" aria-label="Log a new session for this student">
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> Log Session
              </Button>
            </Link>
          </div>

          {/* Card 3: Profile */}
          <div className="modal-card p-6">
            <h2 className="text-lg font-bold text-[var(--modal-text)] mb-4">Profile</h2>
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs text-[var(--modal-text-muted)] font-semibold">Communication Modality</p>
                <p className="text-sm text-[var(--modal-text)]">{student.communicationModality || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--modal-text-muted)] font-semibold">Reading Level</p>
                <p className="text-sm text-[var(--modal-text)]">{student.readingLevelBand || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--modal-text-muted)] font-semibold">Equipment Count</p>
                <p className="text-sm text-[var(--modal-text)]">{equipment.length} item{equipment.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <Link to={createPageUrl(`StudentDetail?id=${studentId}&tab=Details`)} className="w-full">
              <Button variant="outline" className="w-full border-[var(--modal-border)] text-[var(--modal-text)] hover:text-[#400070] rounded-xl h-12" aria-label="Edit student profile">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* View More Sections (Collapsible - one open at a time) */}
      {activeTab === "Overview" && (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-bold text-[var(--modal-text-muted)] uppercase tracking-wider">More Information</h3>
          
          {/* Equipment */}
          <div>
            <button
              className="w-full modal-card p-4 rounded-2xl flex items-center justify-between hover:shadow-md transition-all h-14 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]"
              aria-expanded={expandedSection === "equipment"}
              onClick={() => setExpandedSection(s => s === "equipment" ? null : "equipment")}
            >
              <span className="font-semibold text-[var(--modal-text)]">Equipment & Device</span>
              <ChevronDown className={`w-4 h-4 text-[var(--modal-text-muted)] transition-transform ${expandedSection === "equipment" ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {expandedSection === "equipment" && (
              <div className="modal-card p-4 mt-2 border-t border-[var(--modal-border)]">
                {equipment.length === 0 ? (
                  <p className="text-sm text-[var(--modal-text-muted)]">No equipment recorded</p>
                ) : (
                  <div className="space-y-2" role="list">
                    {equipment.slice(0, 5).map(eq => (
                      <div key={eq.id} className="p-3 bg-[#F7F3FA] rounded-lg" role="listitem">
                        <p className="text-sm font-semibold text-[var(--modal-text)]">{eq.type}</p>
                        <p className="text-xs text-[var(--modal-text-muted)]">{eq.description || "—"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {(student.notes || student.warmNotes) && (
            <div>
              <button
                className="w-full modal-card p-4 rounded-2xl flex items-center justify-between hover:shadow-md transition-all h-14 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]"
                aria-expanded={expandedSection === "notes"}
                onClick={() => setExpandedSection(s => s === "notes" ? null : "notes")}
              >
                <span className="font-semibold text-[var(--modal-text)]">Notes</span>
                <ChevronDown className={`w-4 h-4 text-[var(--modal-text-muted)] transition-transform ${expandedSection === "notes" ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {expandedSection === "notes" && (
                <div className="modal-card p-4 mt-2 space-y-3 border-t border-[var(--modal-border)]">
                  {student.warmNotes && (
                    <div>
                      <p className="text-xs text-[var(--modal-text-muted)] font-semibold mb-1">Warm Notes</p>
                      <p className="text-sm text-[var(--modal-text)]">{redactPII(student.warmNotes)}</p>
                    </div>
                  )}
                  {student.notes && (
                    <div>
                      <p className="text-xs text-[var(--modal-text-muted)] font-semibold mb-1">General Notes</p>
                      <p className="text-sm text-[var(--modal-text)]">{redactPII(student.notes)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content - Secondary Tabs */}
      {activeTab === "Details" && (
        <div className="modal-card p-6 space-y-4" id="tab-Details" role="tabpanel" aria-labelledby="tab-Details">
          <h2 className="font-bold text-[var(--modal-text)] flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#6B2FB9]" aria-hidden="true" /> Student Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--modal-text-muted)] mb-1 font-semibold">Grade Band</p>
              <p className="text-sm text-[var(--modal-text)]">{student.gradeBand || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--modal-text-muted)] mb-1 font-semibold">Service Delivery</p>
              <p className="text-sm text-[var(--modal-text)]">{student.serviceDeliveryModel || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--modal-text-muted)] mb-1 font-semibold">Modality</p>
              <p className="text-sm text-[var(--modal-text)]">{student.communicationModality || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--modal-text-muted)] mb-1 font-semibold">Reading Level</p>
              <p className="text-sm text-[var(--modal-text)]">{student.readingLevelBand || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--modal-text-muted)] mb-1 font-semibold">Annual Review Due</p>
              <p className="text-sm text-[var(--modal-text)]">{student.iepAnnualReviewDate || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--modal-text-muted)] mb-1 font-semibold">IEP Meeting Scheduled</p>
              {nextIepMeeting ? (
                <p className="text-sm text-[#400070] font-semibold">
                  {new Date(nextIepMeeting.startDateTime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  {nextIepMeeting.title && nextIepMeeting.title !== "IEP Meeting" && (
                    <span className="text-xs font-normal text-[var(--modal-text-muted)] ml-1">· {nextIepMeeting.title}</span>
                  )}
                </p>
              ) : lastIepMeeting ? (
                <p className="text-sm text-[var(--modal-text-muted)]">
                  Last: {new Date(lastIepMeeting.startDateTime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              ) : (
                <p className="text-sm text-[var(--modal-text-muted)]">None scheduled</p>
              )}
            </div>
            <div>
              <p className="text-xs text-[var(--modal-text-muted)] mb-1 font-semibold">ASL Focus</p>
              <p className="text-sm text-[var(--modal-text)]">{student.aslInstructionFocus ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      )}



      {activeTab === "Goals" && (
        <div className="modal-card p-6" id="tab-Goals" role="tabpanel" aria-labelledby="tab-Goals">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--modal-text)]">Assigned Goals</h2>
            <button onClick={() => setShowGoalBank(true)} className="text-xs text-[#6B2FB9] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]">Browse Goal Bank</button>
          </div>
          {studentGoals.length === 0 ? (
            <p className="text-sm text-[var(--modal-text-muted)] text-center py-6">No goals assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {studentGoals.map(sg => {
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
                    {!isDemoMode && (
                      <GoalProgressTracker
                        studentGoalId={sg.id}
                        studentId={studentId}
                        goalText={goal?.annualGoal}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "Service Log" && (
        <div className="modal-card p-6" id="tab-Service Log" role="tabpanel" aria-labelledby="tab-Service Log">
          <h2 className="font-bold text-[var(--modal-text)] mb-4">Service Log</h2>
          {services.length === 0 ? (
            <p className="text-sm text-[var(--modal-text-muted)] text-center py-6">No service entries yet.</p>
          ) : (
            <div className="divide-y divide-[var(--modal-border)]">
              {services.map(entry => (
                <div key={entry.id} className="py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-[var(--modal-text)]">{entry.sessionType || entry.category?.replace(/([A-Z])/g, " $1").trim() || "Direct"}</p>
                      <p className="text-xs text-[var(--modal-text-muted)]">{entry.sessionDate || entry.date || "—"}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#6B2FB9]">{entry.durationMinutes || entry.minutes || 0} min</span>
                  </div>
                  {entry.notes && <p className="text-xs text-[var(--modal-text-muted)] mt-1 italic">{redactPII(entry.notes)}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Equipment" && (
        <div className="modal-card p-6" id="tab-Equipment" role="tabpanel" aria-labelledby="tab-Equipment">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--modal-text)]">Equipment</h2>
            <Link to={createPageUrl("Equipment")} className="text-xs text-[#6B2FB9] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]">Manage Equipment</Link>
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
        <div id="tab-Listening" role="tabpanel" aria-labelledby="tab-Listening">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-[var(--modal-text)]">Listening Check History</h2>
              <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">Not diagnostic · For educational planning only</p>
            </div>
            <Link to={createPageUrl(`Ling6Check?studentId=${studentId}`)}>
              <Button className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl text-sm h-10" size="sm" aria-label="Create a new listening check">
                <Plus className="w-4 h-4 mr-1" aria-hidden="true" /> New Listening Check
              </Button>
            </Link>
          </div>
          <Ling6SessionHistory studentId={studentId} />
        </div>
      )}

      {activeTab === "Audiology" && (
        <div id="tab-Audiology" role="tabpanel" aria-labelledby="tab-Audiology">
          <AudiologySnapshotView studentId={studentId} />
        </div>
      )}

      {activeTab === "Interactive" && (
        <div id="tab-Interactive" role="tabpanel" aria-labelledby="tab-Interactive">
          <StudentInteractiveHistory studentId={studentId} />
        </div>
      )}

      {activeTab === "Activities" && (
        <div id="tab-Activities" role="tabpanel" aria-labelledby="tab-Activities">
          <ActivityHistory studentId={studentId} />
        </div>
      )}

      {activeTab === "Schedule" && (
        <div id="tab-Schedule" role="tabpanel" aria-labelledby="tab-Schedule">
          <StudentScheduleSection studentId={studentId} student={student} />
        </div>
      )}

      {activeTab === "Contacts" && (
        <div id="tab-Contacts" role="tabpanel" aria-labelledby="tab-Contacts">
          <StudentContactsSection studentId={studentId} />
        </div>
      )}

      {activeTab === "Accommodations" && (
        <StudentAccommodationsTab studentId={studentId} />
      )}

      {activeTab === "Exports" && (
        <StudentExportsTab studentId={studentId} />
      )}

      <GoalBankModal
        open={showGoalBank}
        onClose={() => setShowGoalBank(false)}
        studentId={studentId}
        studentData={student}
      />
    </div>
  );
}