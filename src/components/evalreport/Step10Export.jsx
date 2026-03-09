import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { FileDown, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function Step10Export({ reportData, generated, assessments, profile }) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState(null);

  // Validation
  const missing = [];
  if (!reportData.studentInitials) missing.push("Student initials");
  if (!reportData.evaluatorName) missing.push("Evaluator name");
  if (!reportData.reportDate) missing.push("Report date");
  if (!reportData.reportType) missing.push("Report type");
  if (!generated) missing.push("Generated report content (complete Steps 1–8 and generate)");

  const handleExport = async () => {
    if (missing.length > 0) return;

    // Block if in iframe (checkout/export protection)
    if (window.self !== window.top) {
      alert("Document export works only from the published app, not from an embedded preview.");
      return;
    }

    setExporting(true);
    setError(null);
    try {
      // eslint-disable-next-line no-unused-vars
      // Prepare logo as base64 if available
      let logoBase64 = null;
      if (profile?.districtLogoUrl) {
        try {
          const resp = await fetch(profile.districtLogoUrl);
          const blob = await resp.blob();
          logoBase64 = await new Promise(res => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("Could not load logo:", e);
        }
      }

      const sections = {
        background: generated.backgroundNarrative || "",
        hearing: generated.hearingNarrative || "",
        presentLevels: generated.presentLevelsSummary || {},
        accommodations: generated.accommodationsText || "",
        recommendations: generated.recommendationsText || "",
      };

      const response = await base44.functions.invoke("exportReportDocx", {
        reportData,
        sections,
        assessments: assessments || [],
        profile: profile || {},
        logoBase64,
      });

      // The function returns a buffer — we need to handle binary response
      // Since base44 functions return JSON, we request via fetch directly
      const funcUrl = `/api/functions/exportReportDocx`;
      const user = await base44.auth.me();
      const token = await base44.auth.getToken?.();

      // Fallback: invoke via base44 and handle blob
      const fetchResp = await fetch(funcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ reportData, sections, assessments: assessments || [], profile: profile || {}, logoBase64 }),
        credentials: "include",
      });

      if (!fetchResp.ok) throw new Error("Export failed. Please try again.");

      const blob = await fetchResp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DHH_Evaluation_${reportData.studentInitials || "Report"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExported(true);
    } catch (e) {
      console.error("Export error:", e);
      setError(e.message || "Export failed. Please try again.");
    }
    setExporting(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--modal-text)] mb-1">Step 10: Export Word Document</h2>
      <p className="text-sm text-[var(--modal-text-muted)] mb-6">Download your evaluation draft as a Microsoft Word (.docx) file with yellow-highlighted generated content.</p>

      {/* Requirements checklist */}
      <div className="modal-card p-5 mb-6 space-y-3">
        <h3 className="font-bold text-sm text-[var(--modal-text)]">Export Checklist</h3>
        {[
          { label: "Student initials", ok: !!reportData.studentInitials },
          { label: "Evaluator name", ok: !!reportData.evaluatorName },
          { label: "Report date", ok: !!reportData.reportDate },
          { label: "Report type", ok: !!reportData.reportType },
          { label: "Report content generated", ok: !!generated },
          { label: "Assessments selected", ok: (assessments?.length || 0) > 0 },
          { label: "District logo (optional)", ok: !!profile?.districtLogoUrl },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2.5 text-sm">
            {item.ok ? (
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className={item.ok ? "text-[var(--modal-text)]" : "text-amber-700"}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* What's included */}
      <div className="modal-card p-5 mb-6">
        <h3 className="font-bold text-sm text-[var(--modal-text)] mb-3">Document will include:</h3>
        <ul className="text-sm space-y-1.5 text-[var(--modal-text-muted)]">
          <li>✓ Cover page with district logo, report metadata, assessment checklist</li>
          <li>✓ Mandatory disclaimer on page one</li>
          <li>✓ Background information section</li>
          <li>✓ Hearing and auditory access section</li>
          <li>✓ Assessment result sections (selected assessments only)</li>
          <li>✓ Present levels of performance</li>
          <li>✓ Accommodations and access supports</li>
          <li>✓ Service recommendations</li>
          <li>✓ Evaluator signature block</li>
          <li className="text-yellow-700 font-medium">✓ <span className="bg-yellow-200 px-1 rounded">All generated/inserted content highlighted yellow</span></li>
        </ul>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {exported && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Document exported successfully! Check your Downloads folder.
        </div>
      )}

      <Button
        className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2 w-full py-6 text-base"
        onClick={handleExport}
        disabled={missing.length > 0 || exporting}
      >
        {exporting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Generating Document...</>
        ) : (
          <><FileDown className="w-5 h-5" /> Download Word Document (.docx)</>
        )}
      </Button>

      {missing.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-700 font-medium mb-1">Complete the following before export:</p>
          {missing.map(m => <p key={m} className="text-xs text-amber-600">• {m}</p>)}
        </div>
      )}

      <p className="text-xs text-[var(--modal-text-muted)] mt-4 text-center">
        This draft requires teacher review. All highlighted content must be verified before official use.
      </p>
    </div>
  );
}