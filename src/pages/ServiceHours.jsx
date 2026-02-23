import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Play, Square, Plus, Timer } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import SessionNotesForm from "../components/servicehours/SessionNotesForm";

const CATEGORIES = ["DirectService", "Planning", "Consultation", "Evaluation", "IEPMeeting", "Travel"];
const CATEGORY_LABELS = {
  DirectService: "Direct Service", Planning: "Planning", Consultation: "Consultation",
  Evaluation: "Evaluation", IEPMeeting: "IEP Meeting", Travel: "Travel"
};

export default function ServiceHoursPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerCategory, setTimerCategory] = useState("DirectService");
  const [timerStudentId, setTimerStudentId] = useState("");
  const intervalRef = useRef(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "DirectService",
    minutes: "",
    studentId: "",
    notes: "",
    sessionNotes: "",
  });

  const [activeTab, setActiveTab] = useState("basic");

  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ["serviceEntries"],
    queryFn: () => base44.entities.ServiceEntry.list("-date", 500),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: studentGoals = [] } = useQuery({
    queryKey: ["studentGoals", form.studentId],
    queryFn: () => form.studentId ? base44.entities.StudentGoal.filter({ studentId: form.studentId }) : [],
    enabled: !!form.studentId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceEntry.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["serviceEntries"] }); setShowForm(false); },
  });

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const handleTimerStop = () => {
    setTimerRunning(false);
    const minutes = Math.ceil(timerSeconds / 60);
    if (minutes > 0) {
      const date = new Date().toISOString().split("T")[0];
      createMutation.mutate({
        date,
        category: timerCategory,
        minutes,
        studentId: timerStudentId || undefined,
        entryMethod: "Timer",
        monthKey: date.slice(0, 7),
      });
    }
    setTimerSeconds(0);
  };

  const handleManualSubmit = () => {
    createMutation.mutate({
      ...form,
      minutes: parseInt(form.minutes),
      entryMethod: "Manual",
      monthKey: form.date.slice(0, 7),
    });
    setForm({ date: new Date().toISOString().split("T")[0], category: "DirectService", minutes: "", studentId: "", notes: "", sessionNotes: "" });
    setActiveTab("basic");
  };

  const monthEntries = entries.filter(e => e.monthKey === selectedMonth);
  const totalMinutes = monthEntries.reduce((s, e) => s + (e.minutes || 0), 0);

  const byCategory = {};
  CATEGORIES.forEach(c => { byCategory[c] = 0; });
  monthEntries.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + (e.minutes || 0); });

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s.studentInitials; });

  return (
    <div>
      <PageHeader
        title="Service Hours"
        subtitle="Track and report your service time"
        action={
          <Button onClick={() => setShowForm(true)} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Log Time
          </Button>
        }
      />

      {/* Timer */}
      <div className="modal-card p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${timerRunning ? "bg-red-500/20" : "bg-[#400070]/20"}`}>
              <Timer className={`w-6 h-6 ${timerRunning ? "text-red-400" : "text-[var(--modal-purple-glow)]"}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--modal-text)] font-mono">{formatTime(timerSeconds)}</p>
              <p className="text-xs text-[var(--modal-text-muted)]">
                {timerRunning ? "Recording..." : "Ready to start"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={timerCategory} onValueChange={setTimerCategory}>
              <SelectTrigger className="w-36 bg-white/5 border-[var(--modal-border)] text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={timerStudentId} onValueChange={setTimerStudentId}>
              <SelectTrigger className="w-32 bg-white/5 border-[var(--modal-border)] text-white text-xs">
                <SelectValue placeholder="Student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No student</SelectItem>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.studentInitials}</SelectItem>)}
              </SelectContent>
            </Select>
            {!timerRunning ? (
              <Button onClick={() => setTimerRunning(true)} className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Start</span>
              </Button>
            ) : (
              <Button onClick={handleTimerStop} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
                <Square className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Stop</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="flex items-center gap-3 mb-6">
        <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-48 bg-white/5 border-[var(--modal-border)] text-white" />
        <div className="modal-card px-4 py-2">
          <span className="text-xs text-[var(--modal-text-muted)]">Total: </span>
          <span className="text-sm font-bold text-[var(--modal-text)]">{(totalMinutes / 60).toFixed(1)} hours</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {CATEGORIES.map(c => (
          <div key={c} className="modal-card p-3">
            <p className="text-xs text-[var(--modal-text-muted)]">{CATEGORY_LABELS[c]}</p>
            <p className="text-lg font-bold text-[var(--modal-text)]">{byCategory[c]} min</p>
          </div>
        ))}
      </div>

      {/* Entries */}
      {monthEntries.length === 0 ? (
        <EmptyState icon={Clock} title="No entries this month" description="Start logging time using the timer or manual entry." />
      ) : (
        <div className="modal-card overflow-hidden">
          <div className="divide-y divide-[var(--modal-border)]">
            {monthEntries.map(entry => (
              <div key={entry.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--modal-text)]">{CATEGORY_LABELS[entry.category] || entry.category}</p>
                  <p className="text-xs text-[var(--modal-text-muted)]">
                    {entry.date} {entry.studentId ? `· ${studentMap[entry.studentId] || ""}` : ""} {entry.entryMethod ? `· ${entry.entryMethod}` : ""}
                  </p>
                </div>
                <span className="text-sm font-medium text-[var(--modal-purple-glow)]">{entry.minutes} min</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Entry Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[var(--modal-card)] border-[var(--modal-border)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">Log Service Time</DialogTitle></DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-[var(--modal-border)] mb-4">
              <TabsTrigger value="basic" className="data-[state=active]:bg-[#400070] data-[state=active]:text-white">Basic Info</TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-[#400070] data-[state=active]:text-white">Session Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-[var(--modal-text-muted)]">Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} className="bg-white/5 border-[var(--modal-border)] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--modal-text-muted)]">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="bg-white/5 border-[var(--modal-border)] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--modal-text-muted)]">Minutes</Label>
                <Input type="number" min="1" value={form.minutes} onChange={(e) => setForm(p => ({ ...p, minutes: e.target.value }))} className="bg-white/5 border-[var(--modal-border)] text-white" placeholder="30" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--modal-text-muted)]">Student (optional)</Label>
                <Select value={form.studentId} onValueChange={(v) => setForm(p => ({ ...p, studentId: v }))}>
                  <SelectTrigger className="bg-white/5 border-[var(--modal-border)] text-white"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {students.map(s => <SelectItem key={s.id} value={s.id}>{s.studentInitials}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--modal-text-muted)]">General Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} className="bg-white/5 border-[var(--modal-border)] text-white h-20" />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} className="border-[var(--modal-border)] text-[var(--modal-text-muted)]">Cancel</Button>
                <Button onClick={handleManualSubmit} disabled={!form.minutes} className="bg-[#400070] hover:bg-[#5B00A0] text-white">Save Entry</Button>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <SessionNotesForm studentGoals={studentGoals} />
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowForm(false)} className="border-[var(--modal-border)] text-[var(--modal-text-muted)]">Close</Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}