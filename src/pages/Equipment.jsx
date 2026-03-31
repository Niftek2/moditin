import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemo } from "../components/demo/DemoContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, LayoutList, Users } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import HearingAidIcon from "../components/shared/HearingAidIcon";
import TroubleshootingWizard from "../components/equipment/TroubleshootingWizard";
import EquipmentStats from "../components/equipment/EquipmentStats";
import MaintenanceScheduleCard from "../components/equipment/MaintenanceScheduleCard";
import EquipmentCard from "../components/equipment/EquipmentCard";

const EQUIPMENT_TYPES = ["Hearing Aids", "Cochlear Implants", "FM/DM", "Soundfield", "Accessories", "Batteries", "Chargers", "Earmolds", "Loaners"];
const STATUSES = ["Active", "NeedsRepair", "Loaned", "Retired"];
const REMINDER_SCHEDULES = ["None", "Daily", "Weekly", "Monthly"];
const CHECK_TYPES = ["DailyCheck", "WeeklyCheck", "IssueReport", "Repair", "Replacement"];

export default function EquipmentPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const { isDemoMode, demoData } = useDemo();
  useEffect(() => {
    if (!isDemoMode) base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, [isDemoMode]);

  const [groupByStudent, setGroupByStudent] = useState(true);
  const [showEquipForm, setShowEquipForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState(null);
  const [editingEquip, setEditingEquip] = useState(null);
  const [selectedStudentForWizard, setSelectedStudentForWizard] = useState(null);
  const [equipForm, setEquipForm] = useState({ studentId: "", type: "", description: "", serialNumber: "", status: "Active", reminderSchedule: "None" });
  const [logForm, setLogForm] = useState({ date: new Date().toISOString().split("T")[0], checkType: "DailyCheck", issueDescription: "", actionTaken: "", resolved: false });

  const queryClient = useQueryClient();

  const { data: equipmentRaw = [] } = useQuery({ queryKey: ["equipment", currentUser?.id], queryFn: () => base44.entities.Equipment.filter({ created_by: currentUser?.email }), enabled: !!currentUser?.id && !isDemoMode });
  const equipment = isDemoMode ? (demoData.equipment || []) : equipmentRaw;

  const { data: studentsRaw = [] } = useQuery({ queryKey: ["students", currentUser?.email], queryFn: () => base44.entities.Student.filter({ created_by: currentUser?.email }), enabled: !!currentUser?.email && !isDemoMode });
  const students = isDemoMode ? (demoData.students || []) : studentsRaw;

  const { data: logsRaw = [] } = useQuery({ queryKey: ["equipLogs", currentUser?.id], queryFn: () => base44.entities.EquipmentLog.filter({ created_by: currentUser?.email }, "-date", 200), enabled: !!currentUser?.id && !isDemoMode });
  const logs = isDemoMode ? (demoData.equipmentLogs || []) : logsRaw;

  const { data: troubleshootSessions = [] } = useQuery({ queryKey: ["troubleshootSessions", currentUser?.id], queryFn: () => base44.entities.EquipmentTroubleshootSession.filter({ created_by: currentUser?.email }, "-created_date", 100), enabled: !!currentUser?.id && !isDemoMode });

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  // Mutations
  const createEquipMut = useMutation({
    mutationFn: (data) => base44.entities.Equipment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["equipment"] }); setShowEquipForm(false); },
  });
  const updateEquipMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["equipment"] }); setShowEquipForm(false); setEditingEquip(null); },
  });
  const deleteEquipMut = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["equipment"] }); },
  });
  const createLogMut = useMutation({
    mutationFn: (data) => base44.entities.EquipmentLog.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["equipLogs"] }); setShowLogForm(false); },
  });
  const createTroubleshootMut = useMutation({
    mutationFn: (data) => base44.functions.invoke('equipmentTroubleshoot', { action: 'createSession', sessionData: data, studentId: selectedStudentForWizard }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["troubleshootSessions"] }); setShowWizard(false); setSelectedStudentForWizard(null); },
  });

  const openAdd = () => {
    setEditingEquip(null);
    setEquipForm({ studentId: "", type: "", description: "", serialNumber: "", status: "Active", reminderSchedule: "None" });
    setShowEquipForm(true);
  };

  const openEdit = (eq) => {
    setEditingEquip(eq);
    setEquipForm({ studentId: eq.studentId, type: eq.type, description: eq.description || "", serialNumber: eq.serialNumber || "", status: eq.status || "Active", reminderSchedule: eq.reminderSchedule || "None" });
    setShowEquipForm(true);
  };

  const openLogCheck = (eq) => {
    setSelectedEquip(eq);
    setLogForm({ date: new Date().toISOString().split("T")[0], checkType: "DailyCheck", issueDescription: "", actionTaken: "", resolved: false });
    setShowLogForm(true);
  };

  // Group equipment by student
  const grouped = {};
  equipment.forEach(eq => {
    const key = eq.studentId || "__unassigned__";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(eq);
  });

  const renderEquipCard = (eq) => (
    <EquipmentCard
      key={eq.id}
      eq={eq}
      logs={logs}
      isDemoMode={isDemoMode}
      onLogCheck={() => openLogCheck(eq)}
      onTroubleshoot={() => { setSelectedStudentForWizard(eq.studentId); setShowWizard(true); }}
      onEdit={() => openEdit(eq)}
      onDelete={() => { if (confirm("Delete this equipment?")) deleteEquipMut.mutate(eq.id); }}
    />
  );

  return (
    <div>
      <PageHeader
        title="Equipment Inventory"
        subtitle="Track hearing equipment, maintenance schedules, and repair history"
        action={
          !isDemoMode && (
            <Button onClick={openAdd} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Add Equipment
            </Button>
          )
        }
      />

      {equipment.length === 0 ? (
        <EmptyState icon={HearingAidIcon} title="No equipment tracked" description="Add hearing equipment to start tracking checks and maintenance." actionLabel="Add Equipment" onAction={openAdd} />
      ) : (
        <>
          <EquipmentStats equipment={equipment} logs={logs} />
          <MaintenanceScheduleCard equipment={equipment} logs={logs} />

          {/* View toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setGroupByStudent(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${groupByStudent ? "bg-[#400070] text-white border-[#400070]" : "bg-white text-[var(--modal-text-muted)] border-[var(--modal-border)] hover:bg-[#F7F3FA]"}`}
            >
              <Users className="w-3.5 h-3.5" /> By Student
            </button>
            <button
              onClick={() => setGroupByStudent(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${!groupByStudent ? "bg-[#400070] text-white border-[#400070]" : "bg-white text-[var(--modal-text-muted)] border-[var(--modal-border)] hover:bg-[#F7F3FA]"}`}
            >
              <LayoutList className="w-3.5 h-3.5" /> All Items
            </button>
          </div>

          {groupByStudent ? (
            <div className="space-y-6">
              {Object.entries(grouped).map(([studentId, items]) => {
                const student = studentMap[studentId];
                const hasIssues = items.some(eq => logs.some(l => l.equipmentId === eq.id && l.checkType === "IssueReport" && !l.resolved));
                return (
                  <div key={studentId}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-[#EADDF5] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#400070]">
                          {student ? student.studentInitials.slice(0, 2) : "?"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-[var(--modal-text)]">
                        {student ? student.studentInitials : "Unassigned"}
                      </h3>
                      {student?.gradeBand && <span className="text-xs text-[var(--modal-text-muted)]">· {student.gradeBand}</span>}
                      {hasIssues && <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">⚠ Open issue</span>}
                      <span className="text-xs text-[var(--modal-text-muted)] ml-auto">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="space-y-2 pl-9">
                      {items.map(renderEquipCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {equipment.map(renderEquipCard)}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Equipment Dialog */}
      <Dialog open={showEquipForm} onOpenChange={(open) => { setShowEquipForm(open); if (!open) setEditingEquip(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingEquip ? "Edit Equipment" : "Add Equipment"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={equipForm.studentId} onValueChange={(v) => setEquipForm(p => ({ ...p, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.studentInitials}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={equipForm.type} onValueChange={(v) => setEquipForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{EQUIPMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={equipForm.description} onChange={(e) => setEquipForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g., Phonak Sky M70 — bilateral" />
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input value={equipForm.serialNumber} onChange={(e) => setEquipForm(p => ({ ...p, serialNumber: e.target.value }))} placeholder="e.g., HX-10293" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={equipForm.status} onValueChange={(v) => setEquipForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Check Reminder</Label>
                <Select value={equipForm.reminderSchedule} onValueChange={(v) => setEquipForm(p => ({ ...p, reminderSchedule: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REMINDER_SCHEDULES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => { setShowEquipForm(false); setEditingEquip(null); }}>Cancel</Button>
              <Button
                onClick={() => editingEquip ? updateEquipMut.mutate({ id: editingEquip.id, data: equipForm }) : createEquipMut.mutate(equipForm)}
                disabled={!equipForm.studentId || !equipForm.type}
                className="bg-[#400070] hover:bg-[#5B00A0] text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Check Dialog */}
      <Dialog open={showLogForm} onOpenChange={setShowLogForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Equipment Check</DialogTitle>
            {selectedEquip && <p className="text-sm text-[var(--modal-text-muted)]">{selectedEquip.type}{selectedEquip.serialNumber ? ` · S/N ${selectedEquip.serialNumber}` : ""}</p>}
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={logForm.date} onChange={(e) => setLogForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Check Type</Label>
                <Select value={logForm.checkType} onValueChange={(v) => setLogForm(p => ({ ...p, checkType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CHECK_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/([A-Z])/g, " $1").trim()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Issue Description</Label>
              <Textarea value={logForm.issueDescription} onChange={(e) => setLogForm(p => ({ ...p, issueDescription: e.target.value }))} className="h-20" placeholder="Describe any issues observed..." />
            </div>
            <div className="space-y-2">
              <Label>Action Taken</Label>
              <Input value={logForm.actionTaken} onChange={(e) => setLogForm(p => ({ ...p, actionTaken: e.target.value }))} placeholder="What was done to resolve or document?" />
            </div>
            {(logForm.checkType === "IssueReport" || logForm.checkType === "Repair") && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="resolved" checked={logForm.resolved} onChange={(e) => setLogForm(p => ({ ...p, resolved: e.target.checked }))} className="w-4 h-4 accent-[#400070]" />
                <Label htmlFor="resolved" className="cursor-pointer font-normal">Mark as resolved</Label>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowLogForm(false)}>Cancel</Button>
              <Button onClick={() => createLogMut.mutate({ ...logForm, equipmentId: selectedEquip?.id })} className="bg-[#400070] hover:bg-[#5B00A0] text-white">Save Log</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Troubleshooting Wizard */}
      {showWizard && selectedStudentForWizard && (
        <TroubleshootingWizard
          studentInitials={students.find(s => s.id === selectedStudentForWizard)?.studentInitials || ""}
          onComplete={(sessionData) => createTroubleshootMut.mutate(sessionData)}
          onCancel={() => { setShowWizard(false); setSelectedStudentForWizard(null); }}
        />
      )}
    </div>
  );
}