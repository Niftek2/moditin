import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CalendarDays, Sparkles, Loader2 } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import AIDisclaimer from "../components/shared/AIDisclaimer";

export default function ActivityPlannerPage() {
  const [studentId, setStudentId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [serviceModel, setServiceModel] = useState("InPerson");
  const [sessionLength, setSessionLength] = useState("30");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(u => setCurrentUserEmail(u?.email)).catch(() => {});
  }, []);

  const queryClient = useQueryClient();

  const { data: students = [] } = useQuery({
    queryKey: ["students", currentUserEmail],
    queryFn: () => base44.entities.Student.filter({ created_by: currentUserEmail }),
    enabled: !!currentUserEmail,
  });
  const { data: studentGoals = [] } = useQuery({
    queryKey: ["studentGoals", studentId],
    queryFn: () => base44.entities.StudentGoal.filter({ studentId }),
    enabled: !!studentId,
  });
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", currentUserEmail],
    queryFn: () => base44.entities.Goal.filter({ created_by: currentUserEmail }, "-created_date", 200),
    enabled: !!currentUserEmail,
  });
  const { data: plans = [] } = useQuery({
    queryKey: ["activityPlans", currentUserEmail],
    queryFn: () => base44.entities.ActivityPlan.filter({ created_by: currentUserEmail }, "-created_date", 50),
    enabled: !!currentUserEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ActivityPlan.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activityPlans"] }),
  });

  const goalMap = {};
  goals.forEach(g => { goalMap[g.id] = g; });

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  const selectedGoal = goalId ? goalMap[studentGoals.find(sg => sg.id === goalId)?.goalId] : null;
  const selectedStudentGoal = studentGoals.find(sg => sg.id === goalId);

  const handleGenerate = async () => {
    setLoading(true);
    const goal = goalMap[selectedStudentGoal?.goalId];
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert TODHH session planner. Create a therapy session plan.
Student grade band: ${studentMap[studentId]?.gradeBand}
Goal: ${goal?.annualGoal}
Objectives: ${goal?.objectives?.join("; ")}
Measurement type: ${goal?.measurementType}
Service model: ${serviceModel}
Session length: ${sessionLength} minutes

Return JSON with: warmup, coreActivity, wrapUp, telepracticeAdaptations, materialsList (array of strings), dataCollectionPrompt.`,
      response_json_schema: {
        type: "object",
        properties: {
          warmup: { type: "string" },
          coreActivity: { type: "string" },
          wrapUp: { type: "string" },
          telepracticeAdaptations: { type: "string" },
          materialsList: { type: "array", items: { type: "string" } },
          dataCollectionPrompt: { type: "string" },
        },
      },
    });

    setPlan(result);
    const saved = await createMutation.mutateAsync({
      studentId,
      studentGoalId: goalId,
      serviceModel,
      sessionLength: parseInt(sessionLength),
      ...result,
      date: new Date().toISOString().split("T")[0],
    });
    setLoading(false);
  };

  return (
    <div>
      <PageHeader title="Activity Planner" subtitle="AI-powered session planning" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Config */}
        <div className="modal-card p-5 space-y-4">
          <h3 className="font-semibold text-[var(--modal-text)] text-sm">Session Setup</h3>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text-muted)]">Student</Label>
            <Select value={studentId} onValueChange={(v) => { setStudentId(v); setGoalId(""); }}>
              <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.studentInitials} ({s.gradeBand})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {studentId && (
            <div className="space-y-2">
              <Label className="text-[var(--modal-text-muted)]">Goal</Label>
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"><SelectValue placeholder="Select goal" /></SelectTrigger>
                <SelectContent>
                  {studentGoals.filter(sg => sg.status === "Active").map(sg => (
                    <SelectItem key={sg.id} value={sg.id}>{goalMap[sg.goalId]?.annualGoal?.slice(0, 60) || "Goal"}...</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-[var(--modal-text-muted)]">Service Model</Label>
            <Select value={serviceModel} onValueChange={setServiceModel}>
              <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="InPerson">In Person</SelectItem>
                <SelectItem value="Telepractice">Telepractice</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text-muted)]">Session Length (min)</Label>
            <Input type="number" value={sessionLength} onChange={(e) => setSessionLength(e.target.value)} className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]" />
          </div>
          <Button onClick={handleGenerate} disabled={!studentId || !goalId || loading} className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Plan
          </Button>
          <AIDisclaimer compact />
        </div>

        {/* Plan Display */}
        <div className="lg:col-span-2 space-y-4">
          {plan ? (
            <>
              {selectedGoal && (
                <div className="modal-card p-5">
                  <h3 className="text-xs uppercase tracking-wider text-[var(--modal-text-muted)] mb-2">Goal</h3>
                  <p className="text-sm text-[var(--modal-text)]">{selectedGoal.annualGoal}</p>
                  {selectedGoal.objectives?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-[var(--modal-text-muted)] mb-1">Objectives</p>
                      <ol className="space-y-1">{selectedGoal.objectives.map((o, i) => <li key={i} className="text-xs text-[var(--modal-text)]">{i + 1}. {o}</li>)}</ol>
                    </div>
                  )}
                </div>
              )}
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Warmup", content: plan.warmup },
                  { label: "Core Activity", content: plan.coreActivity },
                  { label: "Wrap-Up", content: plan.wrapUp },
                ].map((section) => (
                  <div key={section.label} className="modal-card p-4">
                    <h4 className="text-xs uppercase tracking-wider text-[var(--modal-purple-glow)] mb-2">{section.label}</h4>
                    <p className="text-sm text-[var(--modal-text)]">{section.content}</p>
                  </div>
                ))}
              </div>
              {plan.telepracticeAdaptations && (
                <div className="modal-card p-4">
                  <h4 className="text-xs uppercase tracking-wider text-[var(--modal-text-muted)] mb-2">Telepractice Adaptations</h4>
                  <p className="text-sm text-[var(--modal-text)]">{plan.telepracticeAdaptations}</p>
                </div>
              )}
              {plan.materialsList?.length > 0 && (
                <div className="modal-card p-4">
                  <h4 className="text-xs uppercase tracking-wider text-[var(--modal-text-muted)] mb-2">Materials</h4>
                  <ul className="space-y-1">{plan.materialsList.map((m, i) => <li key={i} className="text-sm text-[var(--modal-text)] flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--modal-purple-glow)]" />{m}</li>)}</ul>
                </div>
              )}
              <div className="modal-card p-4">
                <h4 className="text-xs uppercase tracking-wider text-[var(--modal-text-muted)] mb-2">Data Collection Prompt</h4>
                <p className="text-sm text-[var(--modal-text)]">{plan.dataCollectionPrompt}</p>
              </div>
            </>
          ) : (
            <EmptyState icon={CalendarDays} title="No plan generated" description="Select a student, goal, and session details, then click Generate Plan." />
          )}
        </div>
      </div>
    </div>
  );
}