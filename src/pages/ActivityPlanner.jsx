import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/shared/PageHeader";
import PlanSetupForm from "../components/activityplanner/PlanSetupForm";
import PlanDisplay from "../components/activityplanner/PlanDisplay";
import PlanHistory from "../components/activityplanner/PlanHistory";
import { useDemo } from "../components/demo/DemoContext";

export default function ActivityPlannerPage() {
  const queryClient = useQueryClient();
  const { isDemoMode, demoData } = useDemo();

  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  useEffect(() => {
    if (!isDemoMode) {
      base44.auth.me().then(u => setCurrentUserEmail(u?.email)).catch(() => {});
    }
  }, [isDemoMode]);

  // ── Form state ──
  const [studentId, setStudentId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [serviceModel, setServiceModel] = useState("InPerson");
  const [sessionLength, setSessionLength] = useState("30");
  const [communicationFocus, setCommunicationFocus] = useState([]);
  const [hearingTech, setHearingTech] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null); // currently displayed plan

  // ── Data — all filtered to current user to prevent cross-user leakage ──
  const { data: students = [] } = useQuery({
    queryKey: ["students", currentUserEmail],
    queryFn: () => base44.entities.Student.filter({ created_by: currentUserEmail }, "-created_date"),
    enabled: !!currentUserEmail && !isDemoMode,
  });

  const { data: studentGoals = [] } = useQuery({
    queryKey: ["studentGoals", studentId, currentUserEmail],
    queryFn: () => base44.entities.StudentGoal.filter({ studentId, created_by: currentUserEmail }),
    enabled: !!studentId && !!currentUserEmail && !isDemoMode,
  });

  const { data: allStudentGoals = [] } = useQuery({
    queryKey: ["allStudentGoals", currentUserEmail],
    queryFn: () => base44.entities.StudentGoal.filter({ created_by: currentUserEmail }),
    enabled: !!currentUserEmail && !isDemoMode,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.list("-created_date", 300),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["activityPlans", currentUserEmail],
    // Filter by created_by so users only see their own plans
    queryFn: () => base44.entities.ActivityPlan.filter({ created_by: currentUserEmail }, "-created_date", 50),
    enabled: !!currentUserEmail && !isDemoMode,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ActivityPlan.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activityPlans", currentUserEmail] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ActivityPlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activityPlans", currentUserEmail] }),
  });

  // ── Lookup maps ──
  const studentMap = {};
  (isDemoMode ? demoData.students : students).forEach(s => { studentMap[s.id] = s; });

  const goalMap = {};
  goals.forEach(g => { goalMap[g.id] = g; });

  const studentGoalMap = {};
  allStudentGoals.forEach(sg => { studentGoalMap[sg.id] = sg; });

  const selectedStudentGoal = studentGoals.find(sg => sg.id === goalId);
  const selectedGoal = selectedStudentGoal ? goalMap[selectedStudentGoal.goalId] : null;

  // ── Generate plan via AI ──
  const handleGenerate = async () => {
    setLoading(true);
    const student = studentMap[studentId];
    const goal = goalMap[selectedStudentGoal?.goalId];

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert Teacher of the Deaf and Hard of Hearing (TODHH) session planner.
Create a detailed, TODHH-specific lesson plan for this session.

Student grade band: ${student?.gradeBand || "Unknown"}
Communication modality: ${student?.communicationModality || "Not specified"}
Primary language: ${student?.primaryLanguage || "Not specified"}
Communication focus for this session: ${communicationFocus.join(", ") || "Not specified"}
Hearing tech considerations: ${hearingTech || "None specified"}
IEP Goal: ${goal?.annualGoal || "Not specified"}
Objectives: ${goal?.objectives?.join("; ") || "None"}
Measurement type: ${goal?.measurementType || "Not specified"}
Service model: ${serviceModel}
Session length: ${sessionLength} minutes

Return a JSON object with these fields:
- warmup: a brief engaging warm-up activity (1-3 sentences)
- coreActivity: the main instructional activity aligned to the goal (2-4 sentences)
- wrapUp: a closure activity reinforcing learning (1-2 sentences)
- environmentalAdaptations: specific environmental or telepractice adaptations for this student's needs (1-2 sentences)
- visualSupportsPlanned: any visual supports or materials to prepare (1-2 sentences)
- materialsList: array of specific materials needed (5-8 items)
- dataCollectionPrompt: a precise data collection prompt aligned to the measurement type

Make the plan highly specific to Deaf/HH education — reference hearing technology, acoustic environment, visual access, communication modality, and auditory skill building where appropriate.`,
      response_json_schema: {
        type: "object",
        properties: {
          warmup: { type: "string" },
          coreActivity: { type: "string" },
          wrapUp: { type: "string" },
          environmentalAdaptations: { type: "string" },
          visualSupportsPlanned: { type: "string" },
          materialsList: { type: "array", items: { type: "string" } },
          dataCollectionPrompt: { type: "string" },
        },
      },
    });

    // Save to DB — created_by is automatically set to the current user
    const saved = await createMutation.mutateAsync({
      studentId,
      studentGoalId: goalId,
      serviceModel,
      sessionLength: parseInt(sessionLength),
      date: sessionDate,
      communicationFocus,
      hearingTechConsiderations: hearingTech,
      ...result,
    });

    setActivePlan({ ...result, communicationFocus, hearingTechConsiderations: hearingTech });
    setLoading(false);
  };

  // ── Load a past plan into the display ──
  const handleSelectPlan = (plan) => {
    // Verify this plan belongs to current user before displaying
    if (!isDemoMode && plan.created_by !== currentUserEmail) return;
    setActivePlan(plan);
    setStudentId(plan.studentId || "");
    setGoalId(plan.studentGoalId || "");
    setServiceModel(plan.serviceModel || "InPerson");
    setSessionLength(String(plan.sessionLength || 30));
    setCommunicationFocus(plan.communicationFocus || []);
    setHearingTech(plan.hearingTechConsiderations || "");
    setSessionDate(plan.date || new Date().toISOString().split("T")[0]);
  };

  const handleDeletePlan = (id) => {
    if (confirm("Delete this plan?")) {
      deleteMutation.mutate(id);
      if (activePlan?.id === id) setActivePlan(null);
    }
  };

  const displayedStudents = isDemoMode ? demoData.students : students;
  const canGenerate = !!studentId && !!goalId && !loading && (isDemoMode || !!currentUserEmail);

  return (
    <div>
      <PageHeader title="Lesson Planner" subtitle="AI-powered TODHH session planning" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Setup */}
        <div>
          <PlanSetupForm
            students={displayedStudents}
            studentGoals={studentGoals}
            goalMap={goalMap}
            studentId={studentId}
            setStudentId={setStudentId}
            goalId={goalId}
            setGoalId={setGoalId}
            serviceModel={serviceModel}
            setServiceModel={setServiceModel}
            sessionLength={sessionLength}
            setSessionLength={setSessionLength}
            communicationFocus={communicationFocus}
            setCommunicationFocus={setCommunicationFocus}
            hearingTech={hearingTech}
            setHearingTech={setHearingTech}
            sessionDate={sessionDate}
            setSessionDate={setSessionDate}
            onGenerate={handleGenerate}
            loading={loading}
            canGenerate={canGenerate}
          />

          <PlanHistory
            plans={plans}
            studentMap={studentMap}
            goalMap={goalMap}
            studentGoalMap={studentGoalMap}
            onSelect={handleSelectPlan}
            onDelete={handleDeletePlan}
          />
        </div>

        {/* Right: Plan Display */}
        <div className="lg:col-span-2">
          <PlanDisplay
            plan={activePlan}
            selectedGoal={selectedGoal}
            serviceModel={serviceModel}
            communicationFocus={activePlan?.communicationFocus || communicationFocus}
            hearingTech={activePlan?.hearingTechConsiderations || hearingTech}
          />
        </div>
      </div>
    </div>
  );
}