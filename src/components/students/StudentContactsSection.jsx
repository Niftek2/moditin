import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, UserCheck } from "lucide-react";
import { useDemo } from "../demo/DemoContext";

const SCHOOL_ROLES = [
  "Case Manager",
  "Special Education Teacher",
  "General Education Teacher",
  "Speech-Language Pathologist",
  "Audiologist",
  "Interpreter",
  "Para-educator / Aide",
  "School Psychologist",
  "Administrator",
  "Social Worker",
  "Other School Staff",
];

export default function StudentContactsSection({ studentId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "" });
  const { isDemoMode, demoData } = useDemo();

  const { data: contacts } = useQuery({
    queryKey: ["studentContacts", studentId, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) return demoData.contacts.find(c => c.studentId === studentId) || null;
      const me = await base44.auth.me();
      const all = await base44.entities.StudentContacts.filter({ studentId, created_by: me.email });
      return all[0] || null;
    },
    enabled: !!studentId,
  });

  const saveMutation = useMutation({
    mutationFn: async (newMember) => {
      const me = await base44.auth.me();
      const currentMembers = contacts?.additionalTeamMembers || [];
      const updated = [...currentMembers, newMember];
      if (contacts?.id) {
        return base44.entities.StudentContacts.update(contacts.id, { additionalTeamMembers: updated });
      } else {
        return base44.entities.StudentContacts.create({ studentId, created_by: me.email, additionalTeamMembers: updated });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentContacts", studentId] });
      setForm({ name: "", email: "", role: "" });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (index) => {
      const updated = (contacts?.additionalTeamMembers || []).filter((_, i) => i !== index);
      return base44.entities.StudentContacts.update(contacts.id, { additionalTeamMembers: updated });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["studentContacts", studentId] }),
  });

  const members = contacts?.additionalTeamMembers || [];

  return (
    <div className="modal-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[var(--modal-text)] flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#6B2FB9]" />
          School Staff Contacts
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--modal-text-muted)] hidden sm:block">For your reference only · not shared · not exported</span>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Contact
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[#F7F3FA] rounded-xl p-4 mb-4 space-y-3 border border-[var(--modal-border)]">
          <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase tracking-wider">New School Staff Contact</p>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] text-sm">Name</Label>
            <Input
              placeholder="First name or initials only"
              value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] text-sm">Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm(p => ({ ...p, role: v }))}>
              <SelectTrigger className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {SCHOOL_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--modal-text)] text-sm">Email (optional)</Label>
            <Input
              type="email"
              placeholder="School email address"
              value={form.email}
              onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="border-[var(--modal-border)] text-[var(--modal-text)]">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate({ name: form.name, email: form.email, role: form.role })}
              disabled={!form.name.trim() || !form.role || saveMutation.isPending}
              className="bg-[#400070] hover:bg-[#5B00A0] text-white"
            >
              Save Contact
            </Button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <p className="text-sm text-[var(--modal-text-muted)] text-center py-4">No school staff contacts added yet.</p>
      ) : (
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
              <div>
                <p className="text-sm font-medium text-[var(--modal-text)]">{m.name}</p>
                <p className="text-xs text-[var(--modal-text-muted)]">{m.role}{m.email ? ` · ${m.email}` : ""}</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(i)}
                className="p-1.5 rounded-lg text-[var(--modal-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}