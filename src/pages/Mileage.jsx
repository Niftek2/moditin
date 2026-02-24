import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Car, Plus } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

export default function MileagePage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], miles: "", purpose: "" });
  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ["mileageEntries"],
    queryFn: () => base44.entities.MileageEntry.list("-date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MileageEntry.create(data),
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ["mileageEntries"] });
      const previous = queryClient.getQueryData(["mileageEntries"]);
      const optimistic = { ...newEntry, id: `optimistic-${Date.now()}` };
      queryClient.setQueryData(["mileageEntries"], (old = []) => [optimistic, ...old]);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["mileageEntries"], ctx.previous);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mileageEntries"] }); setShowForm(false); },
  });

  const handleSubmit = () => {
    createMutation.mutate({
      ...form,
      miles: parseFloat(form.miles),
      monthKey: form.date.slice(0, 7),
    });
    setForm({ date: new Date().toISOString().split("T")[0], miles: "", purpose: "" });
  };

  const monthEntries = entries.filter(e => e.monthKey === selectedMonth);
  const totalMiles = monthEntries.reduce((s, e) => s + (e.miles || 0), 0);

  return (
    <div>
      <PageHeader
        title="Mileage Log"
        subtitle="Track your travel miles"
        action={
          <Button onClick={() => setShowForm(true)} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Log Miles
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-48 bg-white border-[var(--modal-border)] text-[var(--modal-text)]" />
        <div className="modal-card px-4 py-2">
          <span className="text-xs text-[var(--modal-text-muted)]">Total: </span>
          <span className="text-sm font-bold text-[var(--modal-text)]">{totalMiles.toFixed(1)} miles</span>
        </div>
      </div>

      {monthEntries.length === 0 ? (
        <EmptyState icon={Car} title="No mileage this month" description="Log your travel miles for reimbursement tracking." actionLabel="Log Miles" onAction={() => setShowForm(true)} />
      ) : (
        <div className="modal-card overflow-hidden">
          <div className="divide-y divide-[var(--modal-border)]">
            {monthEntries.map(entry => (
              <div key={entry.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--modal-text)]">{entry.purpose}</p>
                  <p className="text-xs text-[var(--modal-text-muted)]">{entry.date}</p>
                </div>
                <span className="text-sm font-medium text-[var(--modal-purple-glow)]">{entry.miles} mi</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[var(--modal-card)] border-[var(--modal-border)] max-w-md">
          <DialogHeader><DialogTitle className="text-[var(--modal-text)]">Log Mileage</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]" />
            </div>
            <div className="space-y-2">
              <Label>Miles</Label>
              <Input type="number" min="0" step="0.1" value={form.miles} onChange={(e) => setForm(p => ({ ...p, miles: e.target.value }))} className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]" placeholder="12.5" />
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Input value={form.purpose} onChange={(e) => setForm(p => ({ ...p, purpose: e.target.value }))} className="bg-white border-[var(--modal-border)] text-[var(--modal-text)]" placeholder="Travel to school site" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-[var(--modal-border)] text-[var(--modal-text)]">Cancel</Button>
              <Button onClick={handleSubmit} disabled={!form.miles || !form.purpose} className="bg-[#400070] hover:bg-[#5B00A0] text-white">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}