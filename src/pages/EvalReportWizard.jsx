import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wand2, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";

import WizardShell from "@/components/evalreport/WizardShell";
import Step1ReportSetup from "@/components/evalreport/Step1ReportSetup";
import Step2Assessments from "@/components/evalreport/Step2Assessments";
import Step3Background from "@/components/evalreport/Step3Background";
import Step4Hearing from "@/components/evalreport/Step4Hearing";
import Step5AssessmentForms from "@/components/evalreport/Step5AssessmentForms";
import Step6PresentLevels from "@/components/evalreport/Step6PresentLevels";
import Step7Accommodations from "@/components/evalreport/Step7Accommodations";
import Step8Recommendations from "@/components/evalreport/Step8Recommendations";
import Step9Preview from "@/components/evalreport/Step9Preview";
import Step10Export from "@/components/evalreport/Step10Export";

const urlParams = new URLSearchParams(window.location.search);
const DRAFT_ID = urlParams.get("id");

const EMPTY_DATA = {
  reportSetup: {},
  assessmentChecklist: { selectedAssessments: [] },
  background: {},
  hearing: {},
  assessmentForms: { assessmentForms: {} },
  presentLevels: { areas: [], notes: {} },
  accommodations: { selected: [], custom: [] },
  recommendations: { recommendations: [] },
};

export default function EvalReportWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState(EMPTY_DATA);
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {});
  }, []);

  const { data: draft } = useQuery({
    queryKey: ["reportDraft", DRAFT_ID],
    queryFn: () => base44.entities.ReportDraft.filter({ id: DRAFT_ID }),
    enabled: !!DRAFT_ID,
    select: data => data?.[0],
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["teacherProfile", userEmail],
    queryFn: () => base44.entities.TeacherProfile.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });
  const profile = profiles[0];

  // Load draft data
  useEffect(() => {
    if (draft) {
      try {
        const saved = draft.reportDataJson ? JSON.parse(draft.reportDataJson) : {};
        setStepData({ ...EMPTY_DATA, ...saved });
        setCurrentStep(draft.currentStep || 1);
        if (draft.generatedDocumentJson) {
          setGenerated(JSON.parse(draft.generatedDocumentJson));
        }
      } catch (e) {
        console.error("Failed to parse draft data", e);
      }
    }
  }, [draft]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.ReportDraft.update(DRAFT_ID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportDraft"] });
      queryClient.invalidateQueries({ queryKey: ["reportDrafts"] });
    }
  });

  // Autosave with debounce
  const triggerSave = useCallback((data, step) => {
    if (!DRAFT_ID) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(() => {
      saveMutation.mutate({
        reportDataJson: JSON.stringify(data),
        currentStep: step,
        studentInitials: data.reportSetup?.studentInitials || "",
        reportType: data.reportSetup?.reportType || "",
        evaluatorName: data.reportSetup?.evaluatorName || "",
        reportDate: data.reportSetup?.reportDate || "",
        selectedAssessmentsJson: JSON.stringify(data.assessmentChecklist?.selectedAssessments || []),
        status: "In Progress",
      }, { onSettled: () => setSaving(false) });
    }, 1500);
  }, [DRAFT_ID, saveMutation]);

  const handleStepDataChange = (stepKey, data) => {
    const updated = { ...stepData, [stepKey]: data };
    setStepData(updated);
    triggerSave(updated, currentStep);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const selectedAssessments = stepData.assessmentChecklist?.selectedAssessments || [];
      const assessmentForms = stepData.assessmentForms?.assessmentForms || {};

      const assessmentsPayload = selectedAssessments.map(a => ({
        assessmentType: a.name,
        assessmentDate: a.date,
        rawScores: assessmentForms[a.name]?.rawScores || {},
        observations: assessmentForms[a.name]?.observations || "",
        strengths: assessmentForms[a.name]?.strengths || "",
        needs: assessmentForms[a.name]?.needs || "",
        implications: assessmentForms[a.name]?.implications || "",
      }));

      const plData = stepData.presentLevels || {};
      const accData = stepData.accommodations || {};
      const recData = stepData.recommendations || {};

      const result = await base44.functions.invoke("generateReport", {
        reportData: stepData.reportSetup || {},
        assessments: assessmentsPayload,
        backgroundData: stepData.background || {},
        hearingData: stepData.hearing || {},
        presentLevels: {
          areas: plData.areas || [],
          ...Object.fromEntries(Object.entries(plData.notes || {}).map(([k, v]) => [k, v])),
        },
        accommodations: [
          ...(accData.selected || []),
          ...(accData.custom || []),
        ],
        recommendations: recData.recommendations || [],
      });

      const generatedData = result.data;
      setGenerated(generatedData);

      // Save generated content
      if (DRAFT_ID) {
        saveMutation.mutate({
          generatedDocumentJson: JSON.stringify(generatedData),
          status: "Draft Generated",
        });
      }
    } catch (e) {
      console.error("Generation error:", e);
      alert("Generation failed: " + e.message);
    }
    setGenerating(false);
  };

  const handleEditSection = (key, value) => {
    setGenerated(prev => ({ ...prev, [key]: value }));
    if (DRAFT_ID) {
      saveMutation.mutate({ generatedDocumentJson: JSON.stringify({ ...generated, [key]: value }) });
    }
  };

  const handleNext = () => {
    if (currentStep === 8 && !generated) {
      // Auto-go to step 9 and trigger generation
      setCurrentStep(9);
      handleGenerate();
      return;
    }
    setCurrentStep(s => Math.min(s + 1, 10));
    triggerSave(stepData, Math.min(currentStep + 1, 10));
  };

  const handleBack = () => setCurrentStep(s => Math.max(s - 1, 1));

  // Build assessments for export
  const exportAssessments = () => {
    const selected = stepData.assessmentChecklist?.selectedAssessments || [];
    const forms = stepData.assessmentForms?.assessmentForms || {};
    const generatedNarratives = generated?.assessmentNarratives || [];

    return selected.map(a => {
      const narrative = generatedNarratives.find(n => n.assessmentType === a.name);
      return {
        assessmentType: a.name,
        assessmentDate: a.date,
        generatedNarrative: narrative?.generatedNarrative || "",
        customNarrative: forms[a.name]?.observations || "",
      };
    });
  };

  const getNextLabel = () => {
    if (currentStep === 8) return generated ? "Preview Report →" : "Generate & Preview →";
    if (currentStep === 9) return "Export Step →";
    if (currentStep === 10) return "Finish";
    return "Next →";
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1ReportSetup data={stepData.reportSetup} onChange={d => handleStepDataChange("reportSetup", d)} />;
      case 2: return <Step2Assessments data={stepData.assessmentChecklist} onChange={d => handleStepDataChange("assessmentChecklist", d)} />;
      case 3: return <Step3Background data={stepData.background} onChange={d => handleStepDataChange("background", d)} />;
      case 4: return <Step4Hearing data={stepData.hearing} onChange={d => handleStepDataChange("hearing", d)} />;
      case 5: return (
        <Step5AssessmentForms
          data={{
            selectedAssessments: stepData.assessmentChecklist?.selectedAssessments || [],
            assessmentForms: stepData.assessmentForms?.assessmentForms || {},
          }}
          onChange={d => handleStepDataChange("assessmentForms", { assessmentForms: d.assessmentForms })}
        />
      );
      case 6: return <Step6PresentLevels data={stepData.presentLevels} onChange={d => handleStepDataChange("presentLevels", d)} />;
      case 7: return <Step7Accommodations data={stepData.accommodations} onChange={d => handleStepDataChange("accommodations", d)} />;
      case 8: return (
        <div>
          <Step8Recommendations data={stepData.recommendations} onChange={d => handleStepDataChange("recommendations", d)} />
          <div className="mt-6 pt-4 border-t border-[var(--modal-border)]">
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2 py-5"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Draft...</> : <><Wand2 className="w-5 h-5" /> Generate Report Draft Now</>}
            </Button>
            {generated && <p className="text-center text-sm text-green-600 mt-2">✓ Draft generated — proceed to Preview</p>}
          </div>
        </div>
      );
      case 9: return (
        <Step9Preview
          reportData={stepData.reportSetup || {}}
          generated={generated}
          assessments={generated?.assessmentNarratives || exportAssessments()}
          onEditSection={handleEditSection}
        />
      );
      case 10: return (
        <Step10Export
          reportData={stepData.reportSetup || {}}
          generated={generated}
          assessments={exportAssessments()}
          profile={profile}
        />
      );
      default: return null;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl("EvalReportDashboard")}>
          <Button variant="ghost" size="icon" className="text-[var(--modal-text-muted)]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[var(--modal-text)]">IEP DHH Evaluation Report Draft Generator</h1>
          <p className="text-xs text-[var(--modal-text-muted)]">Step {currentStep} of 10</p>
        </div>
      </div>

      <WizardShell
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={getNextLabel()}
        saving={saving}
        studentInitials={stepData.reportSetup?.studentInitials}
      >
        {renderStep()}
      </WizardShell>
    </div>
  );
}