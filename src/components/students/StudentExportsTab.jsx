import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";

export default function StudentExportsTab({ studentId }) {
  const [docxLoading, setDocxLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExportDocx = async () => {
    setError("");
    setDocxLoading(true);
    try {
      const res = await base44.functions.invoke("generateReport", { studentId });
      if (res.data?.url) {
        window.open(res.data.url, "_blank");
      } else {
        setError(res.data?.error || "Export failed. Please try again.");
      }
    } catch (e) {
      setError(e.message || "Export failed.");
    } finally {
      setDocxLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setError("");
    setPdfLoading(true);
    try {
      const res = await base44.functions.invoke("exportServiceLog", { studentId });
      if (res.data?.url) {
        window.open(res.data.url, "_blank");
      } else {
        setError(res.data?.error || "Export failed. Please try again.");
      }
    } catch (e) {
      setError(e.message || "Export failed.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="modal-card p-6" id="tab-Exports" role="tabpanel">
      <h2 className="font-bold text-[var(--modal-text)] mb-2">Exports</h2>
      <p className="text-xs text-[var(--modal-text-muted)] mb-6">Generate and download student documents. Files are created on demand and not stored.</p>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#400070]" />
            <div>
              <p className="text-sm font-semibold text-[var(--modal-text)]">IEP Summary (DOCX)</p>
              <p className="text-xs text-[var(--modal-text-muted)]">Goals, accommodations, and service minutes</p>
            </div>
          </div>
          <Button
            onClick={handleExportDocx}
            disabled={docxLoading}
            className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2 h-9 text-sm"
          >
            {docxLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#6B2FB9]" />
            <div>
              <p className="text-sm font-semibold text-[var(--modal-text)]">Service Log (PDF)</p>
              <p className="text-xs text-[var(--modal-text-muted)]">Full session history with dates and minutes</p>
            </div>
          </div>
          <Button
            onClick={handleExportPdf}
            disabled={pdfLoading}
            variant="outline"
            className="border-[#400070] text-[#400070] gap-2 h-9 text-sm"
          >
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-4 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}