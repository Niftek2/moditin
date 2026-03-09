import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const CATEGORIES = [
  "DHH Service Support",
  "Assistive Listening Device Support",
  "Low-Incidence Support",
  "Interpreter Access",
  "Statewide Testing Accommodations",
  "Service Delivery Recommendations",
  "Consultation / Service Model Notes",
  "Other",
];

export default function Step8Recommendations({ data, onChange }) {
  const recs = data.recommendations || [];

  const addRec = () => {
    onChange({ ...data, recommendations: [...recs, { category: "", notes: "" }] });
  };

  const updateRec = (idx, field, val) => {
    onChange({
      ...data,
      recommendations: recs.map((r, i) => i === idx ? { ...r, [field]: val } : r)
    });
  };

  const removeRec = (idx) => {
    onChange({ ...data, recommendations: recs.filter((_, i) => i !== idx) });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--modal-text)] mb-1">Step 8: Service Recommendations</h2>
      <p className="text-sm text-[var(--modal-text-muted)] mb-2">Add service recommendations. All recommendation language is draft only and will be highlighted yellow in the exported document.</p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
        <p className="text-xs text-amber-800">⚠ Recommendations are draft language only. They do not represent final IEP team decisions until reviewed and approved by the full team.</p>
      </div>

      <div className="space-y-4 mb-4">
        {recs.map((rec, idx) => (
          <div key={idx} className="border border-[var(--modal-border)] rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--modal-text)]">Recommendation {idx + 1}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => removeRec(idx)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Category</Label>
              <Select value={rec.category || ""} onValueChange={v => updateRec(idx, "category", v)}>
                <SelectTrigger className="border-[var(--modal-border)]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Recommendation Language</Label>
              <Textarea value={rec.notes || ""} onChange={e => updateRec(idx, "notes", e.target.value)}
                rows={3} placeholder="Draft recommendation text..." className="border-[var(--modal-border)] text-sm" />
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="border-[var(--modal-border)] gap-2" onClick={addRec}>
        <Plus className="w-4 h-4" /> Add Recommendation
      </Button>
    </div>
  );
}