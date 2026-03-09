import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";

function Section({ title, content, onEdit, onRegenerate }) {
  if (!content) return null;
  const text = typeof content === "object" ? Object.entries(content).map(([k, v]) => `${k.toUpperCase()}\n${v}`).join("\n\n") : content;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-[var(--modal-text)] text-sm uppercase tracking-wide text-[#400070]">{title}</h3>
        {onRegenerate && (
          <Button variant="ghost" size="sm" className="text-xs text-[var(--modal-text-muted)] gap-1 h-7" onClick={onRegenerate}>
            <RefreshCw className="w-3 h-3" /> Regenerate
          </Button>
        )}
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <Textarea
          value={text}
          onChange={e => onEdit?.(e.target.value)}
          rows={Math.max(3, text.split("\n").length + 1)}
          className="border-0 bg-transparent text-sm text-[var(--modal-text)] resize-none focus:ring-0 p-0 font-serif leading-relaxed"
        />
      </div>
      <p className="text-xs text-amber-600 mt-1">✎ Yellow areas = generated content — review and edit before export</p>
    </div>
  );
}

function AssessmentSection({ assessment }) {
  if (!assessment?.generatedNarrative) return null;
  return (
    <div className="mb-4">
      <h4 className="font-semibold text-sm text-[var(--modal-text)] mb-1">{assessment.assessmentType}</h4>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-[var(--modal-text)] font-serif leading-relaxed whitespace-pre-wrap">
        {assessment.generatedNarrative}
      </div>
    </div>
  );
}

export default function Step9Preview({ reportData, generated, assessments, onEditSection }) {
  if (!generated) {
    return (
      <div className="text-center py-16">
        <p className="font-semibold text-[var(--modal-text)]">Report not yet generated</p>
        <p className="text-sm text-[var(--modal-text-muted)] mt-1">Click "Generate Report" to create the draft narrative.</p>
      </div>
    );
  }

  const formatPresent = (pl) => {
    if (!pl || typeof pl !== "object") return "";
    return Object.entries(pl).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}:\n${v}`).join("\n\n");
  };

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-[var(--modal-border)]">
        <h2 className="text-xl font-bold text-[var(--modal-text)] mb-1">Step 9: Preview & Edit Draft</h2>
        <p className="text-sm text-[var(--modal-text-muted)]">Review all generated content below. Yellow sections are auto-generated — edit directly in the fields before export.</p>
      </div>

      {/* Cover summary */}
      <div className="mb-6 p-4 bg-gray-50 border border-[var(--modal-border)] rounded-xl text-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><span className="text-[var(--modal-text-muted)]">Student:</span> <strong className="bg-yellow-100 px-1 rounded">{reportData.studentInitials}</strong></div>
          <div><span className="text-[var(--modal-text-muted)]">Type:</span> <strong>{reportData.reportType}</strong></div>
          <div><span className="text-[var(--modal-text-muted)]">Evaluator:</span> <strong>{reportData.evaluatorName}</strong></div>
          <div><span className="text-[var(--modal-text-muted)]">Date:</span> <strong>{reportData.reportDate}</strong></div>
          {reportData.communicationMode && <div><span className="text-[var(--modal-text-muted)]">Comm Mode:</span> <strong>{reportData.communicationMode}</strong></div>}
          {reportData.gradeLevel && <div><span className="text-[var(--modal-text-muted)]">Grade:</span> <strong>{reportData.gradeLevel}</strong></div>}
        </div>
      </div>

      <Section
        title="Background Information"
        content={generated.backgroundNarrative}
        onEdit={v => onEditSection?.("backgroundNarrative", v)}
      />
      <Section
        title="Hearing & Auditory Access"
        content={generated.hearingNarrative}
        onEdit={v => onEditSection?.("hearingNarrative", v)}
      />

      {assessments && assessments.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-[var(--modal-text)] text-sm uppercase tracking-wide text-[#400070] mb-3">Assessment Results</h3>
          {assessments.map(a => <AssessmentSection key={a.assessmentType} assessment={a} />)}
          <p className="text-xs text-amber-600 mt-1">✎ Yellow areas = generated content — review and edit before export</p>
        </div>
      )}

      {generated.presentLevelsSummary && Object.keys(generated.presentLevelsSummary).length > 0 && (
        <Section
          title="Present Levels of Performance"
          content={formatPresent(generated.presentLevelsSummary)}
          onEdit={v => onEditSection?.("presentLevelsSummary", v)}
        />
      )}

      {generated.accommodationsText && (
        <Section
          title="Accommodations & Access Supports"
          content={generated.accommodationsText}
          onEdit={v => onEditSection?.("accommodationsText", v)}
        />
      )}

      {generated.recommendationsText && (
        <Section
          title="Service Recommendations"
          content={generated.recommendationsText}
          onEdit={v => onEditSection?.("recommendationsText", v)}
        />
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <strong>Important:</strong> This is a draft only. All highlighted content must be reviewed, verified, and edited by the evaluating teacher before use in official documentation.
      </div>
    </div>
  );
}