import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Zap } from "lucide-react";
import {
  TEMPLATE_LABELS,
  TEMPLATE_DESCRIPTIONS,
  TEMPLATE_ICONS,
  TEMPLATE_SUPPORTS_TOPIC,
  TEMPLATE_SUPPORTS_CRITICAL_ELEMENTS,
  buildGenerationPrompt
} from "./activityTemplates";

const TEMPLATES = Object.keys(TEMPLATE_LABELS);

export default function ActivitySetupScreen({ onActivityGenerated, onShowDeafCultureGen }) {
  const [studentId, setStudentId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [templateType, setTemplateType] = useState("");
  const [numItems, setNumItems] = useState("5");
  const [difficulty, setDifficulty] = useState("Developing");
  const [setting, setSetting] = useState("InPerson");
  const [languageLevel, setLanguageLevel] = useState("Standard");
  const [topic, setTopic] = useState("");
  const [criticalElements, setCriticalElements] = useState("2");
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
      languageLevel,
      topic: TEMPLATE_SUPPORTS_TOPIC[templateType] ? topic : undefined,
      criticalElements: TEMPLATE_SUPPORTS_CRITICAL_ELEMENTS[templateType] ? parseInt(criticalElements) : undefined,
    });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          teacherDirections: { type: "string" },
          studentDirections: { type: "string" },
          passage: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                questionText: { type: "string" },
                correctAnswer: { type: "string" },
                soundToSay: { type: "string" },
                vocabularyWord: { type: "string" },
                imageSearchQuery: { type: "string" },
                scenario: { type: "string" },
                directionText: { type: "string" },
                criticalElementCount: { type: "integer" },
                answerChoices: { type: "array", items: { type: "string" } }
              },
              required: ["questionText", "correctAnswer", "answerChoices"]
            },
          },
        },
        required: ["teacherDirections", "studentDirections", "items"]
      },
    });

    // For VocabularyVisual: fetch real images via Unsplash-style URLs
    let itemsProcessed = result.items;
    if (templateType === "VocabularyVisual") {
      itemsProcessed = result.items.map(item => {
        const query = encodeURIComponent(item.imageSearchQuery || item.vocabularyWord || item.correctAnswer || "");
        // Use a simple placeholder image service with the query as seed
        const imageUrl = `https://source.unsplash.com/400x300/?${query}`;
        return { ...item, questionImageUrl: imageUrl };
      });
    }

    const stripEmoji = (str) => str ? str.replace(/[^\x00-\x7F\u00A0-\u024F\u1E00-\u1EFF]/g, '').trim() : str;

    await base44.entities.ActivityLog.create({
      templateType,
      title: stripEmoji(`${TEMPLATE_LABELS[templateType]} - ${selectedStudent?.gradeBand} ${difficulty}${topic ? ` (${topic})` : ""}`),
      gradeBand: selectedStudent?.gradeBand || "3-5",
      difficulty,
      languageLevel,
      activityContent: {
        items: itemsProcessed,
        teacherDirections: result.teacherDirections,
        studentDirections: result.studentDirections,
        passage: result.passage,
      },
      linkedGoalText: selectedGoal?.annualGoal,
      generatedDate: new Date().toISOString(),
    });

    setLoading(false);
    onActivityGenerated({
      items: itemsProcessed,
      teacherDirections: result.teacherDirections,
      studentDirections: result.studentDirections,
      passage: result.passage,
      studentId,
      student: selectedStudent,
      studentGoalId: goalId || null,
      goalText: selectedGoal?.annualGoal || null,
      templateType,
      numItems: parseInt(numItems),
      difficulty,
      setting,
      languageLevel,
      topic,
      criticalElements: parseInt(criticalElements),
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
          <Label className="text-[var(--modal-text)] font-semibold">Student <span className="text-red-600">*</span></Label>
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
            <Label className="text-[var(--modal-text)] font-semibold">Link to Goal <span className="text-[10px] font-normal text-[var(--modal-text-muted)]">(optional)</span></Label>
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

        {/* Activity Type */}
        <div className="space-y-2">
          <Label className="text-[var(--modal-text)] font-semibold">Activity Type <span className="text-red-600">*</span></Label>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setTemplateType(t); setTopic(""); }}
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

        {/* Topic/Theme (for supported templates) */}
        {templateType && TEMPLATE_SUPPORTS_TOPIC[templateType] && (
          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] font-semibold">
              {templateType === "ListeningComprehension" ? "Story Topic / Theme" : "Vocabulary Theme"}{" "}
              <span className="text-[10px] font-normal text-[var(--modal-text-muted)]">(optional)</span>
            </Label>
            <Input
              placeholder={
                templateType === "ListeningComprehension"
                  ? "e.g. going to the beach, animals, seasons..."
                  : "e.g. farm animals, kitchen items, sports..."
              }
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>
        )}

        {/* Critical Elements (for Following Directions) */}
        {templateType === "FollowingDirections" && (
          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] font-semibold">Critical Elements per Direction</Label>
            <Select value={criticalElements} onValueChange={setCriticalElements}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["1", "2", "3", "4"].map(n => (
                  <SelectItem key={n} value={n}>{n} critical element{n !== "1" ? "s" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-[var(--modal-text-muted)]">
              Each critical element is a specific attribute the student must remember (e.g. color, shape, size, location).
            </p>
          </div>
        )}

        {/* Deaf Culture Activity */}
        <div className="space-y-2">
          <Button onClick={onShowDeafCultureGen} variant="outline" className="w-full border-[var(--modal-border)] text-[var(--modal-text)] hover:text-[#400070] rounded-xl gap-2 text-sm py-6">
            <Sparkles className="w-4 h-4" /> Deaf Culture Activity Generator
          </Button>
        </div>

        {/* Settings row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] font-semibold">Items</Label>
            <Select value={numItems} onValueChange={setNumItems}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["3","4","5","6","7","8","10"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] font-semibold">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Emerging","Developing","Mastering"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] font-semibold">Setting</Label>
            <Select value={setting} onValueChange={setSetting}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["InPerson","Telepractice","Hybrid"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] font-semibold">Language Level</Label>
            <Select value={languageLevel} onValueChange={setLanguageLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Simplified","Standard","Advanced"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
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