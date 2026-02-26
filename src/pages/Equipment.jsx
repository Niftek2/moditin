import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, AlertCircle, Wrench } from "lucide-react";
import HearingAidIcon from "../components/shared/HearingAidIcon";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import TroubleshootingWizard from "../components/equipment/TroubleshootingWizard";

const EQUIPMENT_TYPES = ["Hearing Aids", "Cochlear Implants", "FM/DM", "Soundfield", "Accessories", "Batteries", "Chargers", "Earmolds", "Loaners"];
const STATUSES = ["Active", "NeedsRepair", "Loaned", "Retired"];
const CHECK_TYPES = ["DailyCheck", "WeeklyCheck", "IssueReport", "Repair", "Replacement"];

export default function EquipmentPage() {
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);

  const [showEquipForm, setShowEquipForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState(null);
  const [selectedStudentForWizard, setSelectedStudentForWizard] = useState(null);
  const [equipForm, setEquipForm] = useState({ studentId: "", type: "", description: "", serialNumber: "", status: "Active", reminderSchedule: "None" });
  const [logForm, setLogForm] = useState({ date: new Date().toISOString().split("T")[0], checkType: "DailyCheck", issueDescription: "", actionTaken: "", resolved: false });

  const queryClient = useQueryClient();

  const { data: equipment = [] } = useQuery({ queryKey: ["equipment", currentUser?.id], queryFn: () => base44.entities.Equipment.filter({ created_by: currentUser?.email }), enabled: !!currentUser?.id });
  const { data: students = [] } = useQuery({ queryKey: ["students", currentUser?.email], queryFn: () => base44.entities.Student.filter({ created_by: currentUser?.email }), enabled: !!currentUser?.email });
  const { data: logs = [] } = useQuery({ queryKey: ["equipLogs", currentUser?.id], queryFn: () => base44.entities.EquipmentLog.filter({ created_by: currentUser?.email }, "-date", 100), enabled: !!currentUser?.id });
  const { data: troubleshootSessions = [] } = useQuery({ queryKey: ["troubleshootSessions", currentUser?.id], queryFn: () => base44.entities.EquipmentTroubleshootSession.filter({ created_by: currentUser?.email }, "-created_date", 100), enabled: !!currentUser?.id });

  const createEquipMut = useMutation({
    mutationFn: (data) => base44.entities.Equipment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["equipment"] }); setShowEquipForm(false); },
  });

  const createLogMut = useMutation({
    mutationFn: (data) => base44.entities.EquipmentLog.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["equipLogs"] }); setShowLogForm(false); },
  });

  const createTroubleshootMut = useMutation({
    mutationFn: (data) => base44.functions.invoke('equipmentTroubleshoot', { action: 'createSession', sessionData: data, studentId: selectedStudentForWizard }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["troubleshootSessions"] }); 
      setShowWizard(false);
      setSelectedStudentForWizard(null);
    },
  });

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s.studentInitials; });

  const statusColors = {
    Active: "bg-green-100 text-green-700",
    NeedsRepair: "bg-red-100 text-red-700",
    Loaned: "bg-blue-100 text-blue-700",
    Retired: "bg-gray-100 text-gray-600",
  };

  return (
    <div>
      <PageHeader
        title="Equipment"
        subtitle="Track hearing equipment and maintenance"
        action={
          <Button onClick={() => { setEquipForm({ studentId: "", type: "", description: "", serialNumber: "", status: "Active", reminderSchedule: "None" }); setShowEquipForm(true); }} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Equipment
          </Button>
        }
      />

      {equipment.length === 0 ? (
        <EmptyState icon={HearingAidIcon} title="No equipment tracked" description="Add hearing equipment to start tracking checks and maintenance." actionLabel="Add Equipment" onAction={() => setShowEquipForm(true)} />
      ) : (
        <div className="space-y-3">
          {equipment.map(eq => {
            const eqLogs = logs.filter(l => l.equipmentId === eq.id);
            const unresolvedCount = eqLogs.filter(l => l.checkType === "IssueReport" && !l.resolved).length;
            return (
              <div key={eq.id} className="modal-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#400070]/20 flex items-center justify-center">
                      <HearingAidIcon size={20} strokeColor="var(--modal-purple-glow)" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--modal-text)]">{eq.type}</p>
                      <p className="text-xs text-[var(--modal-text-muted)]">{studentMap[eq.studentId] || "Unassigned"} {eq.serialNumber ? `· S/N: ${eq.serialNumber}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] border-0 ${statusColors[eq.status]}`}>{eq.status}</Badge>
                    {unresolvedCount > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{unresolvedCount}</span>
                      </div>
                    )}
                  </div>
                </div>
                {eq.description && <p className="text-xs text-[var(--modal-text-muted)] mb-3 ml-13">{eq.description}</p>}
                <div className="flex gap-2 mt-2">
                   <Button size="sm" variant="outline" className="text-xs border-[var(--modal-border)] text-[var(--modal-text-muted)] gap-1" onClick={() => { setSelectedEquip(eq); setLogForm({ ...logForm, date: new Date().toISOString().split("T")[0] }); setShowLogForm(true); }}>
                     <ClipboardList className="w-3.5 h-3.5" /> Log Check
                   </Button>
                   <Button size="sm" variant="outline" className="text-xs border-[var(--modal-border)] text-[var(--modal-text-muted)] gap-1" onClick={() => { setSelectedStudentForWizard(eq.studentId); setShowWizard(true); }}>
                     <Wrench className="w-3.5 h-3.5" /> Troubleshoot
                   </Button>
                 </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Equipment Dialog */}
       <Dialog open={showEquipForm} onOpenChange={setShowEquipForm}>
         <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
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
              <Input value={equipForm.description} onChange={(e) => setEquipForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g., Phonak Sky M70" />
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input value={equipForm.serialNumber} onChange={(e) => setEquipForm(p => ({ ...p, serialNumber: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEquipForm(false)}>Cancel</Button>
              <Button onClick={() => createEquipMut.mutate(equipForm)} disabled={!equipForm.studentId || !equipForm.type} className="bg-[#400070] hover:bg-[#5B00A0] text-white">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Check Dialog */}
      <Dialog open={showLogForm} onOpenChange={setShowLogForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Equipment Check</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
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
            <div className="space-y-2">
              <Label>Issue Description</Label>
              <Textarea value={logForm.issueDescription} onChange={(e) => setLogForm(p => ({ ...p, issueDescription: e.target.value }))} className="h-20" />
            </div>
            <div className="space-y-2">
              <Label>Action Taken</Label>
              <Input value={logForm.actionTaken} onChange={(e) => setLogForm(p => ({ ...p, actionTaken: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowLogForm(false)}>Cancel</Button>
              <Button onClick={() => createLogMut.mutate({ ...logForm, equipmentId: selectedEquip?.id })} className="bg-[#400070] hover:bg-[#5B00A0] text-white">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Troubleshooting Wizard Modal */}
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