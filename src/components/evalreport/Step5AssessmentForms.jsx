import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ASSESSMENT_FIELDS = {
  DTAP: [
    { id: "languageScore", label: "Language Score" },
    { id: "nonlanguageScore", label: "Nonlanguage Score" },
    { id: "noiseImpact", label: "Noise Impact Observations", textarea: true },
    { id: "discriminationObservations", label: "Discrimination Observations", textarea: true },
    { id: "listeningFatigue", label: "Listening Fatigue Notes", textarea: true },
    { id: "processingObservations", label: "Processing Observations", textarea: true },
  ],
  "LING Sounds": [
    { id: "quietAccess", label: "Access to Sounds in Quiet", textarea: true },
    { id: "noiseAccess", label: "Access to Sounds in Noise", textarea: true },
    { id: "distancePerformance", label: "Distance Performance", textarea: true },
    { id: "overallSummary", label: "Overall Access Summary", textarea: true },
  ],
  "TAPS-4": [
    { id: "numbers", label: "Numbers Score" },
    { id: "words", label: "Words Score" },
    { id: "sentences", label: "Sentences Score" },
    { id: "memoryNotes", label: "Memory/Auditory Processing Notes", textarea: true },
  ],
  "OWLS-II": [
    { id: "receptiveScore", label: "Receptive Score" },
    { id: "expressiveScore", label: "Expressive Score" },
    { id: "strengths", label: "Strengths", textarea: true },
    { id: "developing", label: "Areas Developing", textarea: true },
  ],
  TACL: [
    { id: "score", label: "Score" },
    { id: "comprehensionFindings", label: "Comprehension Findings", textarea: true },
    { id: "strengths", label: "Strengths", textarea: true },
  ],
  TEXL: [
    { id: "expressiveData", label: "Expressive Language Data", textarea: true },
    { id: "qualitativeNotes", label: "Qualitative Notes", textarea: true },
  ],
  "TNL-2": [
    { id: "comprehensionScore", label: "Narrative Comprehension Score" },
    { id: "expressionScore", label: "Narrative Expression Score" },
    { id: "findings", label: "Findings", textarea: true },
  ],
  "One Word Picture Vocabulary Test": [
    { id: "score", label: "Standard Score" },
    { id: "strengths", label: "Vocabulary Strengths", textarea: true },
    { id: "vocabularyNeeds", label: "Vocabulary Areas of Need", textarea: true },
  ],
  "Craig Speechreading": [
    { id: "scorePercent", label: "Score / Percent Correct" },
    { id: "visualAttention", label: "Visual Attention Observations", textarea: true },
    { id: "visualDependence", label: "Dependence on Visual Cues", textarea: true },
  ],
  "TOSCRF-2": [
    { id: "score", label: "Score" },
    { id: "fluencyObservations", label: "Reading Fluency Observations", textarea: true },
  ],
  SIFTER: [
    { id: "academics", label: "Academics (1–5)" },
    { id: "attention", label: "Attention (1–5)" },
    { id: "communication", label: "Communication (1–5)" },
    { id: "participation", label: "Participation (1–5)" },
    { id: "behavior", label: "Behavior (1–5)" },
    { id: "comments", label: "Comments", textarea: true },
  ],
  "Functional Listening Evaluation": [
    { id: "quietClose", label: "Quiet / Close" },
    { id: "quietDistance", label: "Quiet / Distance" },
    { id: "noiseClose", label: "Noise / Close" },
    { id: "noiseDistance", label: "Noise / Distance" },
    { id: "comments", label: "Comments", textarea: true },
  ],
  "SKI-HI Language Development": [
    { id: "developmentalObservations", label: "Developmental Observations", textarea: true },
    { id: "languageStrengths", label: "Language Strengths", textarea: true },
    { id: "languageNeeds", label: "Language Needs", textarea: true },
  ],
  "DHH Advocacy Rubric": [
    { id: "rubricScore", label: "Rubric Score" },
    { id: "strengths", label: "Advocacy Strengths", textarea: true },
    { id: "barriers", label: "Identified Barriers", textarea: true },
    { id: "demonstratedSkills", label: "Demonstrated Advocacy Skills", textarea: true },
    { id: "targetSkills", label: "Target Advocacy Skills", textarea: true },
  ],
  "Informal Observation": [
    { id: "freeformNotes", label: "Structured Notes", textarea: true },
    { id: "strengths", label: "Strengths Observed", textarea: true },
    { id: "accessConcerns", label: "Access Concerns", textarea: true },
  ],
  Other: [
    { id: "freeformNotes", label: "Notes", textarea: true },
    { id: "strengths", label: "Strengths", textarea: true },
    { id: "accessConcerns", label: "Concerns", textarea: true },
  ],
};

function AssessmentForm({ assessment, assessmentData, onChange }) {
  const fields = ASSESSMENT_FIELDS[assessment.name] || ASSESSMENT_FIELDS.Other;
  const scores = assessmentData.rawScores || {};
  const setScore = (id, val) => onChange({ ...assessmentData, rawScores: { ...scores, [id]: val } });
  const setField = (id, val) => onChange({ ...assessmentData, [id]: val });

  return (
    <div className="border border-[#400070] border-opacity-30 rounded-xl p-5 space-y-4 bg-purple-50/30">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[var(--modal-text)] text-base">{assessment.name}</h3>
        {assessment.date && (
          <span className="text-xs bg-white border border-[var(--modal-border)] rounded-lg px-2 py-1 text-[var(--modal-text-muted)]">
            {assessment.date}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map(field => (
          <div key={field.id} className={field.textarea ? "md:col-span-2 space-y-1" : "space-y-1"}>
            <Label className="text-xs">{field.label}</Label>
            {field.textarea ? (
              <Textarea value={scores[field.id] || ""} onChange={e => setScore(field.id, e.target.value)}
                rows={2} className="border-[var(--modal-border)] text-sm" />
            ) : (
              <Input value={scores[field.id] || ""} onChange={e => setScore(field.id, e.target.value)}
                className="border-[var(--modal-border)] text-sm" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Strengths (general)</Label>
          <Textarea value={assessmentData.strengths || ""} onChange={e => setField("strengths", e.target.value)}
            rows={2} className="border-[var(--modal-border)] text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Areas of Need</Label>
          <Textarea value={assessmentData.needs || ""} onChange={e => setField("needs", e.target.value)}
            rows={2} className="border-[var(--modal-border)] text-sm" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs">Educational Implications</Label>
          <Textarea value={assessmentData.implications || ""} onChange={e => setField("implications", e.target.value)}
            rows={2} className="border-[var(--modal-border)] text-sm" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs">Observations / Additional Notes</Label>
          <Textarea value={assessmentData.observations || ""} onChange={e => setField("observations", e.target.value)}
            rows={2} className="border-[var(--modal-border)] text-sm" />
        </div>
      </div>
    </div>
  );
}

export default function Step5AssessmentForms({ data, onChange }) {
  const assessments = data.selectedAssessments || [];
  const assessmentForms = data.assessmentForms || {};

  const setAssessmentData = (name, formData) => {
    onChange({ ...data, assessmentForms: { ...assessmentForms, [name]: formData } });
  };

  if (assessments.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-[var(--modal-text)] mb-4">Step 5: Assessment Forms</h2>
        <div className="text-center py-12 text-[var(--modal-text-muted)]">
          <p className="font-medium">No assessments selected.</p>
          <p className="text-sm mt-1">Go back to Step 2 to select the assessments you completed.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--modal-text)] mb-1">Step 5: Assessment Forms</h2>
      <p className="text-sm text-[var(--modal-text-muted)] mb-6">Enter results for each selected assessment. Only selected assessments appear below.</p>
      <div className="space-y-6">
        {assessments.map(assessment => (
          <AssessmentForm
            key={assessment.name}
            assessment={assessment}
            assessmentData={assessmentForms[assessment.name] || {}}
            onChange={d => setAssessmentData(assessment.name, d)}
          />
        ))}
      </div>
    </div>
  );
}