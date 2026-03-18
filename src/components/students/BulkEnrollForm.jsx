import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2, Upload, ClipboardPaste, Download, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { checkPII } from "@/components/shared/PIIGuard";

const GRADE_BANDS = ["PK", "K", "1-2", "3-5", "6-8", "9-12", "Transition", "Adult"];
const SERVICE_MODELS = ["InPerson", "Telepractice", "Hybrid"];
const COLOR_OPTIONS = [
  { value: "red",    dot: "bg-red-300" },
  { value: "orange", dot: "bg-orange-300" },
  { value: "yellow", dot: "bg-yellow-300" },
  { value: "green",  dot: "bg-green-300" },
  { value: "blue",   dot: "bg-blue-300" },
  { value: "purple", dot: "bg-purple-300" },
  { value: "pink",   dot: "bg-pink-300" },
  { value: "gray",   dot: "bg-gray-300" },
];

const emptyRow = () => ({
  studentInitials: "",
  gradeBand: "",
  serviceDeliveryModel: "",
  colorTag: "gray",
  _key: Math.random(),
});

// Parse a date string into YYYY-MM-DD or return ""
function parseDate(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

// Normalize grade band value from spreadsheet
function normalizeGrade(raw) {
  if (!raw) return "";
  const val = String(raw).trim();
  const match = GRADE_BANDS.find(g => g.toLowerCase() === val.toLowerCase());
  return match || "";
}

// Normalize service model
function normalizeServiceModel(raw) {
  if (!raw) return "";
  const val = String(raw).trim().toLowerCase();
  if (val.includes("tele")) return "Telepractice";
  if (val.includes("hybrid")) return "Hybrid";
  if (val.includes("person") || val.includes("in")) return "InPerson";
  const match = SERVICE_MODELS.find(m => m.toLowerCase() === val);
  return match || "";
}

// Map a parsed CSV/paste row to a Student row
function mapRow(raw, existingInitials) {
  const initials = String(raw["Initials"] || raw["initials"] || "").trim().slice(0, 6);
  const allText = Object.values(raw).join(" ");
  const piiWarnings = checkPII(allText);
  const isDuplicate = existingInitials.includes(initials.toLowerCase());

  return {
    studentInitials: initials,
    gradeBand: normalizeGrade(raw["Grade"] || raw["grade"] || raw["GradeBand"] || ""),
    serviceDeliveryModel: normalizeServiceModel(raw["ServiceModel"] || raw["servicemodel"] || raw["ServiceDeliveryModel"] || ""),
    iepAnnualReviewDate: parseDate(raw["AnnualReview"] || raw["annualreview"] || raw["IEPAnnualReview"] || ""),
    triennialEvaluationDate: parseDate(raw["TriennialDate"] || raw["triennialdate"] || raw["TriennialEvaluationDate"] || ""),
    schoolCode: String(raw["SchoolCode"] || raw["schoolcode"] || raw["School"] || "").trim().toUpperCase().slice(0, 4),
    colorTag: "gray",
    _key: Math.random(),
    _piiWarnings: piiWarnings,
    _isDuplicate: isDuplicate,
  };
}

function downloadTemplate() {
  const headers = "Initials,Grade,ServiceModel,AnnualReview,TriennialDate,SchoolCode\n";
  const example = "Fi.La.,3-5,InPerson,2025-09-01,2027-09-01,PARK\n";
  const blob = new Blob([headers + example], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bulk_enroll_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkEnrollForm({ onSubmit, onCancel, isSaving }) {
  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()]);
  const [dragOver, setDragOver] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef();

  const updateRow = (index, field, value) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const valid = rows.filter(r => r.studentInitials.trim() && !r._piiWarnings?.length && !r._isDuplicate);
    if (valid.length === 0) return;
    onSubmit(valid.map(({ _key, _piiWarnings, _isDuplicate, ...r }) => r));
  };

  const injectRows = (parsedRows) => {
    const existingInitials = rows.map(r => r.studentInitials.toLowerCase()).filter(Boolean);
    const newRows = parsedRows.map(r => mapRow(r, existingInitials));
    setRows(prev => [...prev, ...newRows]);
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => injectRows(results.data),
    });
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handlePasteSubmit = () => {
    // Tab-delimited paste from Excel/Google Sheets
    const lines = pasteText.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return;
    const headers = lines[0].split("\t").map(h => h.trim());
    const dataRows = lines.slice(1).map(line => {
      const cells = line.split("\t");
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cells[i] || ""; });
      return obj;
    });
    injectRows(dataRows);
    setPasteText("");
    setPasteModalOpen(false);
  };

  const filledCount = rows.filter(r => r.studentInitials.trim() && !r._piiWarnings?.length && !r._isDuplicate).length;
  const flaggedCount = rows.filter(r => r._piiWarnings?.length || r._isDuplicate).length;

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl flex flex-col max-h-[90vh] modal-card">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b-2 border-[var(--modal-border)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--modal-text)]">Bulk Enroll Students</h2>
            <p className="text-sm text-[var(--modal-text-muted)] mt-0.5">Add multiple students at once — only initials are required</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Import Zone */}
        <div className="px-6 pt-4">
          <div
            className={`border-2 border-dashed rounded-xl p-4 transition-colors ${dragOver ? "border-[#400070] bg-[#F7F3FA]" : "border-[var(--modal-border)] bg-gray-50"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[var(--modal-text-muted)] font-medium">Import from spreadsheet:</span>
              <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3.5 h-3.5" /> Upload CSV
              </Button>
              <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
                onClick={() => setPasteModalOpen(true)}>
                <ClipboardPaste className="w-3.5 h-3.5" /> Paste from Spreadsheet
              </Button>
              <Button type="button" size="sm" variant="ghost" className="gap-1.5 h-8 text-xs text-[var(--modal-text-muted)]"
                onClick={downloadTemplate}>
                <Download className="w-3.5 h-3.5" /> Download CSV Template
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0])} />
            </div>
            {dragOver && <p className="text-xs text-[#400070] font-medium mt-2">Drop your CSV file here…</p>}
            {!dragOver && <p className="text-xs text-[var(--modal-text-muted)] mt-1.5">Or drag & drop a CSV file here. Headers: Initials, Grade, ServiceModel, AnnualReview, TriennialDate, SchoolCode</p>}
          </div>

          {flaggedCount > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {flaggedCount} row{flaggedCount !== 1 ? "s" : ""} flagged for PII or duplicate initials — highlighted in red below. Fix or remove before enrolling.
            </div>
          )}
        </div>

        {/* Column Headers */}
        <div className="px-6 pt-4 pb-2 grid grid-cols-[1fr_1fr_1fr_1fr_auto_auto_2rem] gap-2 items-center">
          <Label className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase tracking-wide">Initials *</Label>
          <Label className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase tracking-wide">Grade Band</Label>
          <Label className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase tracking-wide">Delivery Model</Label>
          <Label className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase tracking-wide">IEP Annual Review</Label>
          <Label className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase tracking-wide">Triennial Date</Label>
          <Label className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase tracking-wide">Color</Label>
          <div />
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-4">
          {rows.map((row, i) => {
            const isFlagged = row._piiWarnings?.length > 0 || row._isDuplicate;
            return (
              <div key={row._key}>
                <div className={`grid grid-cols-[1fr_1fr_1fr_1fr_auto_auto_2rem] gap-2 items-center rounded-lg px-1 py-0.5 ${isFlagged ? "bg-red-50 border border-red-300" : ""}`}>
                  <Input
                    placeholder="Fi.La."
                    value={row.studentInitials}
                    maxLength={6}
                    onChange={(e) => updateRow(i, "studentInitials", e.target.value.slice(0, 6))}
                    className={`bg-white border-2 text-[var(--modal-text)] font-medium h-9 text-sm ${isFlagged ? "border-red-400" : "border-[var(--modal-border)]"}`}
                  />
                  <Select value={row.gradeBand} onValueChange={(v) => updateRow(i, "gradeBand", v)}>
                    <SelectTrigger className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium h-9 text-sm">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_BANDS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={row.serviceDeliveryModel} onValueChange={(v) => updateRow(i, "serviceDeliveryModel", v)}>
                    <SelectTrigger className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium h-9 text-sm">
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={row.iepAnnualReviewDate || ""}
                    onChange={(e) => updateRow(i, "iepAnnualReviewDate", e.target.value)}
                    className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium h-9 text-sm"
                  />
                  <Input
                    type="date"
                    value={row.triennialEvaluationDate || ""}
                    onChange={(e) => updateRow(i, "triennialEvaluationDate", e.target.value)}
                    className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium h-9 text-sm"
                    title="3-year re-evaluation (triennial) due date"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 border-[var(--modal-border)] hover:border-[#400070] transition-all ${COLOR_OPTIONS.find(c => c.value === (row.colorTag || "gray"))?.dot}`}
                        title="Pick color"
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="center">
                      <div className="flex gap-1.5">
                        {COLOR_OPTIONS.map(color => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => updateRow(i, "colorTag", color.value)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${row.colorTag === color.value ? "border-[#400070] scale-110" : "border-transparent hover:border-gray-400"} ${color.dot}`}
                            title={color.value}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(i)}
                    className="h-9 w-8 text-[var(--modal-text-muted)] hover:text-red-400"
                    disabled={rows.length === 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {isFlagged && (
                  <p className="text-xs text-red-600 px-2 mt-0.5">
                    {row._isDuplicate ? "⚠ Duplicate initials" : ""}
                    {row._piiWarnings?.length ? `⚠ Possible PII detected: ${row._piiWarnings.join(", ")} — use initials only` : ""}
                  </p>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            className="w-full mt-2 border-dashed border-2 border-[var(--modal-border)] text-[var(--modal-text-muted)] hover:text-[#400070] hover:border-[#400070] gap-2"
          >
            <Plus className="w-4 h-4" /> Add Another Row
          </Button>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-6 border-t-2 border-[var(--modal-border)] bg-gray-50 rounded-b-2xl">
          <p className="text-sm text-[var(--modal-text-muted)]">
            {filledCount > 0 ? `${filledCount} student${filledCount !== 1 ? "s" : ""} ready to enroll` : "Fill in initials to enroll"}
            {flaggedCount > 0 && <span className="text-red-500 ml-2">({flaggedCount} flagged)</span>}
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="border-2 border-[var(--modal-border)] font-semibold">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={filledCount === 0 || isSaving}
              className="bg-[#400070] hover:bg-[#5B00A0] text-white font-semibold"
            >
              {isSaving ? "Enrolling..." : `Enroll ${filledCount > 0 ? filledCount : ""} Student${filledCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </form>

      {/* Paste Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--modal-text)]">Paste from Spreadsheet</h3>
              <button onClick={() => { setPasteModalOpen(false); setPasteText(""); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--modal-text-muted)] mb-3">
              Copy rows from Excel or Google Sheets (including the header row) and paste below. Columns should be: <strong>Initials, Grade, ServiceModel, AnnualReview, TriennialDate, SchoolCode</strong>
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Initials\tGrade\tServiceModel\tAnnualReview\tTriennialDate\tSchoolCode\nFi.La.\t3-5\tInPerson\t2025-09-01\t2027-09-01\tPARK"}
              className="w-full h-40 border-2 border-[var(--modal-border)] rounded-xl p-3 text-sm font-mono text-[var(--modal-text)] focus:outline-none focus:border-[#400070] resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setPasteModalOpen(false); setPasteText(""); }}>Cancel</Button>
              <Button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="bg-[#400070] hover:bg-[#5B00A0] text-white"
              >
                Import Rows
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}