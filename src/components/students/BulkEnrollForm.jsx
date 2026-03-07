import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const GRADE_BANDS = ["PK", "K", "1-2", "3-5", "6-8", "9-12", "Transition", "Adult"];
const SERVICE_MODELS = ["InPerson", "Telepractice", "Hybrid"];
const COLOR_OPTIONS = [
  { value: "red", dot: "bg-red-500" },
  { value: "orange", dot: "bg-orange-500" },
  { value: "yellow", dot: "bg-yellow-500" },
  { value: "green", dot: "bg-green-500" },
  { value: "blue", dot: "bg-blue-500" },
  { value: "purple", dot: "bg-purple-500" },
  { value: "pink", dot: "bg-pink-500" },
  { value: "gray", dot: "bg-gray-400" },
];

const emptyRow = () => ({
  studentInitials: "",
  gradeBand: "",
  serviceDeliveryModel: "",
  colorTag: "gray",
  _key: Math.random(),
});

export default function BulkEnrollForm({ onSubmit, onCancel, isSaving }) {
  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()]);

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
    const valid = rows.filter(r => r.studentInitials.trim());
    if (valid.length === 0) return;
    onSubmit(valid.map(({ _key, ...r }) => r));
  };

  const filledCount = rows.filter(r => r.studentInitials.trim()).length;

  return (
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
        {rows.map((row, i) => (
          <div key={row._key} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto_auto_2rem] gap-2 items-center">
            <Input
              placeholder="Fi.La."
              value={row.studentInitials}
              maxLength={6}
              onChange={(e) => updateRow(i, "studentInitials", e.target.value.slice(0, 6))}
              className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium h-9 text-sm"
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
        ))}

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
  );
}