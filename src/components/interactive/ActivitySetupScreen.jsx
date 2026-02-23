import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { TEMPLATE_LABELS, TEMPLATE_DESCRIPTIONS, TEMPLATE_ICONS, buildGenerationPrompt } from "./activityTemplates";

const TEMPLATES = Object.keys(TEMPLATE_LABELS);

export default function ActivitySetupScreen({ onActivityGenerated }) {
  const [studentId, setStudentId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [templateType, setTemplateType] = useState("");
  const [numItems, setNumItems] = useState("5");
  const [difficulty, setDifficulty] = useState("Developing");
  const [setting, setSetting] = useState("InPerson");
  const [loading, setLoading] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: studentGoals = [] } = useQuery({
    queryKey: ["studentGoals-interactive", studentId],
    queryFn: () => base44.entities.StudentGoal.filter({ studentId, status: "Active" }),
    enabled: !!studentId,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.list(),
  });

  const selectedStudent = students.find(s => s.id === studentId);
  const goalMap = {};
  goals.forEach(g => { goalMap[g.id] = g; });

  const selectedGoal = goalId ? goalMap[studentGoals.find(sg => sg.id === goalId)?.goalId] : null;

  const handleGenerate = async () => {
    if (!studentId || !templateType) return;
    setLoading(true);

    const prompt = buildGenerationPrompt({
      templateType,
      gradeBand: selectedStudent?.gradeBand || "3-5",
      difficulty,
      numItems: parseInt(numItems),
      goalText: selectedGoal?.annualGoal || "",
    });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                questionText: { type: "string" },
                answerChoices: { type: "array", items: { type: "string" } },
                correctAnswer: { type: "string" },
              },
            },
          },
        },
      },
    });

    setLoading(false);
    onActivityGenerated({
      items: result.items,
      studentId,
      student: selectedStudent,
      studentGoalId: goalId || null,
      goalText: selectedGoal?.annualGoal || null,
      templateType,
      numItems: parseInt(numItems),
      difficulty,
      setting,
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#EADDF5] flex items-center justify-center mx-auto mb-3">
          <Zap className="w-7 h-7 text-[#6B2FB9]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--modal-text)]">New Interactive Activity</h2>
        <p className="text-sm text-[var(--modal-text-muted)] mt-1">Set up your activity, then generate in seconds.</p>
      </div>

      <div className="modal-card p-6 space-y-4">
        {/* Student */}
        <div className="space-y-2">
          <Label>Student <span className="text-red-400">*</span></Label>
          <Select value={studentId} onValueChange={v => { setStudentId(v); setGoalId(""); }}>
            <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              {students.map(s => <SelectItem key={s.id} value={s.id}>{s.studentInitials} · {s.gradeBand}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Goal */}
        {studentId && (
          <div className="space-y-2">
            <Label>Link to Goal <span className="text-[10px] font-normal text-[var(--modal-text-muted)]">(optional)</span></Label>
            <Select value={goalId} onValueChange={setGoalId}>
              <SelectTrigger><SelectValue placeholder="Select active goal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No goal linked</SelectItem>
                {studentGoals.map(sg => {
                  const g = goalMap[sg.goalId];
                  return g ? <SelectItem key={sg.id} value={sg.id}>{g.domain} — {g.annualGoal?.slice(0, 60)}...</SelectItem> : null;
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Template */}
        <div className="space-y-2">
          <Label>Activity Template <span className="text-red-400">*</span></Label>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTemplateType(t)}
                className={`text-left p-3 rounded-xl border text-xs transition-all ${
                  templateType === t
                    ? "border-[#6B2FB9] bg-[#EADDF5] text-[#400070]"
                    : "border-[var(--modal-border)] bg-white hover:border-[#6B2FB9] text-[var(--modal-text)]"
                }`}
              >
                <span className="text-base mr-1">{TEMPLATE_ICONS[t]}</span>
                <span className="font-medium">{TEMPLATE_LABELS[t]}</span>
                <p className="text-[10px] text-[var(--modal-text-muted)] mt-0.5 leading-tight">{TEMPLATE_DESCRIPTIONS[t]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Number of items, difficulty, setting */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Items</Label>
            <Select value={numItems} onValueChange={setNumItems}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["3","4","5","6","7","8","10"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Emerging","Developing","Mastering"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Setting</Label>
            <Select value={setting} onValueChange={setSetting}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["InPerson","Telepractice","Hybrid"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!studentId || !templateType || loading}
          className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white gap-2 h-12 text-base"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Activity...</> : <><Sparkles className="w-5 h-5" /> Generate Activity</>}
        </Button>
      </div>

      <p className="text-[10px] text-[var(--modal-text-muted)] text-center">Instructional activity only · Not diagnostic</p>
    </div>
  );
}