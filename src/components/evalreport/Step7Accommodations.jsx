import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

const STANDARD_SUPPORTS = [
  "Preferential seating near teacher and primary speaker",
  "Visual supports (written directions, visual schedules, graphic organizers)",
  "Access to captioning or CART services",
  "Written directions provided in addition to verbal",
  "Interpreter access as appropriate to communication mode",
  "Assistive listening device (ALD/FM/DM system) use in classroom",
  "Noise reduction strategies (carpet, acoustic panels, reduced background noise)",
  "Extended processing time for verbal information",
  "Preview-review instructional strategy",
  "Check for understanding before independent tasks",
  "Small group or quiet environment for testing",
  "Directions repeated or rephrased as needed",
  "Visual-first instructional delivery",
  "Daily equipment checks by educational staff",
  "Communication clarification support",
];

export default function Step7Accommodations({ data, onChange }) {
  const selected = data.selected || [];
  const custom = data.custom || [];
  const [newCustom, setNewCustom] = useState("");

  const toggleStandard = (support) => {
    if (selected.includes(support)) {
      onChange({ ...data, selected: selected.filter(s => s !== support) });
    } else {
      onChange({ ...data, selected: [...selected, support] });
    }
  };

  const addCustom = () => {
    if (!newCustom.trim()) return;
    onChange({ ...data, custom: [...custom, newCustom.trim()] });
    setNewCustom("");
  };

  const removeCustom = (idx) => {
    onChange({ ...data, custom: custom.filter((_, i) => i !== idx) });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--modal-text)] mb-1">Step 7: Accommodations & Access Supports</h2>
      <p className="text-sm text-[var(--modal-text-muted)] mb-6">Select all applicable access supports. You can also add custom supports.</p>

      <div className="space-y-2 mb-6">
        {STANDARD_SUPPORTS.map(support => (
          <label key={support} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected.includes(support) ? "border-[#400070] bg-purple-50" : "border-[var(--modal-border)] hover:bg-gray-50"}`}>
            <Checkbox
              checked={selected.includes(support)}
              onCheckedChange={() => toggleStandard(support)}
              className="mt-0.5 border-2 shrink-0"
            />
            <span className="text-sm text-[var(--modal-text)]">{support}</span>
          </label>
        ))}
      </div>

      {/* Custom supports */}
      <div className="border-t border-[var(--modal-border)] pt-4 space-y-3">
        <Label className="font-bold">Custom Supports</Label>
        {custom.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 p-3 bg-purple-50 border border-[#400070] border-opacity-30 rounded-xl">
            <span className="flex-1 text-sm">{item}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => removeCustom(idx)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input value={newCustom} onChange={e => setNewCustom(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustom()}
            placeholder="Type a custom support..." className="border-[var(--modal-border)]" />
          <Button onClick={addCustom} variant="outline" className="border-[var(--modal-border)] gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      {(selected.length > 0 || custom.length > 0) && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-700 font-medium">{selected.length + custom.length} support{selected.length + custom.length !== 1 ? "s" : ""} selected</p>
        </div>
      )}
    </div>
  );
}