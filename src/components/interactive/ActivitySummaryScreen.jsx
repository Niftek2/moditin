import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, Save, RotateCcw } from "lucide-react";
import { TEMPLATE_LABELS, PROMPT_LEVEL_LABELS } from "./activityTemplates";
import PIIWarning, { checkPII } from "../shared/PIIGuard";

export default function ActivitySummaryScreen({ config, responses, durationMinutes, onSave, onStartNew }) {
  const [notes, setNotes] = useState("");
  const [piiWarnings, setPiiWarnings] = useState([]);
  const [saved, setSaved] = useState(false);

  const totalItems = responses.length;
  const totalCorrect = responses.filter(r => r.isCorrect).length;
  const pct = totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;

  // Prompt breakdown
  const promptCounts = {};
  responses.forEach(r => {
    if (r.promptLevel) promptCounts[r.promptLevel] = (promptCounts[r.promptLevel] || 0) + 1;
  });
  const promptSummary = Object.entries(promptCounts).map(([k, v]) => `${v} ${PROMPT_LEVEL_LABELS[k]}`).join(", ");

  const scoreColor = pct >= 80 ? "text-green-600 bg-green-50 border-green-200"
    : pct >= 60 ? "text-yellow-700 bg-yellow-50 border-yellow-200"
    : "text-gray-600 bg-gray-50 border-gray-200";

  const saveMutation = useMutation({
    mutationFn: async (linkToService) => {
      // Create session
      const session = await base44.entities.InteractiveActivitySession.create({
        studentId: config.studentId,
        linkedGoalId: config.studentGoalId || undefined,
        templateType: config.templateType,
        setting: config.setting,
        difficulty: config.difficulty,
        gradeBand: config.student?.gradeBand,
        totalItems,
        totalCorrect,
        percentCorrect: pct,
        durationMinutes: durationMinutes || 0,
        promptSummary,
        teacherNotes: notes,
        goalText: config.goalText || "",
        studentInitials: config.student?.studentInitials || "",
      });

      // Save all items
      await Promise.all(responses.map(r =>
        base44.entities.InteractiveActivityItem.create({
          activitySessionId: session.id,
          itemNumber: r.itemNumber,
          questionText: r.questionText,
          answerChoices: r.answerChoices,
          correctAnswer: r.correctAnswer,
          selectedAnswer: r.selectedAnswer,
          isCorrect: r.isCorrect,
          promptLevel: r.promptLevel,
          responseLatencySeconds: r.responseLatencySeconds || 0,
        })
      ));

      if (linkToService) {
        await base44.entities.ServiceEntry.create({
          studentId: config.studentId,
          date: new Date().toISOString().slice(0, 10),
          category: "DirectService",
          minutes: Math.round((durationMinutes || 0) * 60) > 0 ? Math.max(1, durationMinutes) : 30,
          entryMethod: "Manual",
          notes: `Interactive Activity: ${TEMPLATE_LABELS[config.templateType]} — ${pct}% correct`,
          monthKey: new Date().toISOString().slice(0, 7),
        });
      }

      setSaved(true);
      onSave && onSave(session);
    },
  });

  const handleExportPDF = () => {
    const printContent = document.getElementById("activity-summary-print");
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Activity Summary</title><style>
      body { font-family: -apple-system, sans-serif; max-width: 700px; margin: 0 auto; padding: 32px; color: #1A1028; }
      .header { background: #400070; color: white; padding: 16px 20px; border-radius: 10px; margin-bottom: 24px; }
      .score { font-size: 2.5rem; font-weight: 700; }
      .section { margin-bottom: 20px; }
      h3 { color: #400070; font-size: 14px; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #EADDF5; color: #400070; padding: 8px; text-align: left; }
      td { padding: 7px 8px; border-bottom: 1px solid #eee; }
      .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #999; text-align: center; }
    </style></head><body>
      <div class="header">
        <div style="font-size:11px;opacity:.8;margin-bottom:4px">Modal Itinerant · Interactive Activity</div>
        <div style="font-size:18px;font-weight:700">${TEMPLATE_LABELS[config.templateType]}</div>
        <div style="font-size:11px;margin-top:4px">${config.student?.studentInitials || ""} · ${new Date().toLocaleDateString()} · ${config.difficulty}</div>
      </div>
      <div class="section">
        <h3>Score</h3>
        <div class="score">${pct}%</div>
        <div style="font-size:13px;margin-top:4px">${totalCorrect} of ${totalItems} correct · ${durationMinutes || 0} min · ${config.setting}</div>
      </div>
      ${config.goalText ? `<div class="section"><h3>Linked Goal</h3><div style="font-size:13px">${config.goalText}</div></div>` : ""}
      <div class="section">
        <h3>Prompt Breakdown</h3>
        <div style="font-size:13px">${promptSummary || "None recorded"}</div>
      </div>
      <div class="section">
        <h3>Item Detail</h3>
        <table><tr><th>#</th><th>Question</th><th>Answer</th><th>Correct</th><th>Prompt</th></tr>
        ${responses.map(r => `<tr><td>${r.itemNumber}</td><td>${r.questionText}</td><td>${r.selectedAnswer || "—"}</td><td>${r.isCorrect ? "✓" : "✗"}</td><td>${r.promptLevel || "—"}</td></tr>`).join("")}
        </table>
      </div>
      ${notes ? `<div class="section"><h3>Teacher Notes</h3><div style="font-size:13px">${notes}</div></div>` : ""}
      <div class="footer">For instructional planning only. Not diagnostic. Do not include identifiable student information.<br>Modal Education · Generated ${new Date().toLocaleDateString()}</div>
    </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Score card */}
      <div className={`modal-card p-6 border-2 text-center ${scoreColor}`}>
        <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Session Complete</p>
        <p className="text-5xl font-bold mb-1">{pct}%</p>
        <p className="text-sm">{totalCorrect} of {totalItems} correct</p>
        <div className="flex justify-center gap-3 mt-3 flex-wrap">
          <Badge variant="outline" className="text-[10px]">{durationMinutes || 0} min</Badge>
          <Badge variant="outline" className="text-[10px]">{config.setting}</Badge>
          <Badge variant="outline" className="text-[10px]">{config.difficulty}</Badge>
          <Badge variant="outline" className="text-[10px]">{TEMPLATE_LABELS[config.templateType]}</Badge>
        </div>
      </div>

      {/* Prompt breakdown */}
      {promptSummary && (
        <div className="modal-card p-4">
          <p className="text-xs font-bold text-[#400070] uppercase tracking-wider mb-2">Prompt Breakdown</p>
          <p className="text-sm text-[var(--modal-text)]">{promptSummary}</p>
        </div>
      )}

      {/* Item detail */}
      <div className="modal-card p-4">
        <p className="text-xs font-bold text-[#400070] uppercase tracking-wider mb-3">Item Review</p>
        <div className="space-y-2">
          {responses.map((r, i) => (
            <div key={i} className={`flex items-start gap-3 p-2 rounded-lg text-xs ${r.isCorrect ? "bg-green-50" : "bg-gray-50"}`}>
              <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${r.isCorrect ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-600"}`}>{r.itemNumber}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--modal-text)] truncate">{r.questionText}</p>
                <p className="text-[var(--modal-text-muted)]">→ {r.selectedAnswer || "No answer"} · {r.promptLevel || "No prompt"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="modal-card p-4 space-y-2">
        <Label>Teacher Notes <span className="text-[10px] font-normal text-[var(--modal-text-muted)]">— no identifying details</span></Label>
        {piiWarnings.length > 0 && <PIIWarning warnings={piiWarnings} />}
        <Textarea
          placeholder="Session observations, next steps... (no PII)"
          value={notes}
          onChange={e => { setNotes(e.target.value); setPiiWarnings(checkPII(e.target.value)); }}
          className="h-20"
        />
      </div>

      {/* Actions */}
      {!saved ? (
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => saveMutation.mutate(false)}
            disabled={saveMutation.isPending || piiWarnings.length > 0}
            className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving..." : "Save to Student"}
          </Button>
          <Button
            onClick={() => saveMutation.mutate(true)}
            disabled={saveMutation.isPending || piiWarnings.length > 0}
            variant="outline"
            className="w-full gap-2"
          >
            <Save className="w-4 h-4" /> Save + Link to Service Log
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="w-full gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-center p-3 bg-green-50 rounded-xl border border-green-200">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700 font-medium">Session saved to student profile!</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} className="flex-1 gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
            <Button onClick={onStartNew} className="flex-1 bg-[#400070] hover:bg-[#5B00A0] text-white gap-2">
              <RotateCcw className="w-4 h-4" /> New Activity
            </Button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-[var(--modal-text-muted)] text-center">Instructional activity only · Not diagnostic · No identifiable information stored</p>
    </div>
  );
}