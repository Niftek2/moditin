import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Car, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

export default function MileagePage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], miles: "", purpose: "" });
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const { data: entries = [] } = useQuery({
    queryKey: ["mileageEntries", currentUser?.email],
    queryFn: () => base44.entities.MileageEntry.filter({ created_by: currentUser?.email }, "-date", 500),
    enabled: !!currentUser?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MileageEntry.create(data),
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ["mileageEntries"] });
      const previous = queryClient.getQueryData(["mileageEntries"]);
      const optimistic = { ...newEntry, id: `optimistic-${Date.now()}` };
      queryClient.setQueryData(["mileageEntries", currentUser?.email], (old = []) => [optimistic, ...old]);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["mileageEntries", currentUser?.email], ctx.previous);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mileageEntries"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MileageEntry.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mileageEntries"] }); setShowForm(false); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MileageEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mileageEntries"] }),
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({ date: new Date().toISOString().split("T")[0], miles: "", purpose: "" });
    setShowForm(true);
  };

  const openEdit = (entry) => {
    setEditingId(entry.id);
    setForm({ date: entry.date, miles: entry.miles.toString(), purpose: entry.purpose || "" });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload = { ...form, miles: parseFloat(form.miles), monthKey: form.date.slice(0, 7) };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setForm({ date: new Date().toISOString().split("T")[0], miles: "", purpose: "" });
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this mileage entry?")) deleteMutation.mutate(id);
  };

  const monthEntries = entries.filter(e => e.monthKey === selectedMonth);
  const totalMiles = monthEntries.reduce((s, e) => s + (e.miles || 0), 0);

  return (
    <div>
      <PageHeader
        title="Mileage Log"
        subtitle="Track your travel miles"
        action={
          <Button onClick={openAdd} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2">
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
        <EmptyState icon={Car} title="No mileage this month" description="Log your travel miles for reimbursement tracking." actionLabel="Log Miles" onAction={openAdd} />
      ) : (
        <div className="modal-card overflow-hidden">
          <div className="divide-y divide-[var(--modal-border)]">
            {monthEntries.map(entry => (
              <div key={entry.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--modal-text)]">{entry.purpose}</p>
                  <p className="text-xs text-[var(--modal-text-muted)]">{entry.date}</p>
                </div>
                <span className="text-sm font-medium text-[var(--modal-purple-glow)] shrink-0">{entry.miles} mi</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(entry)} className="text-[var(--modal-text-muted)] hover:text-[#6B2FB9] transition-colors p-1">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(entry.id)} className="text-[var(--modal-text-muted)] hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingId(null); }}>
        <DialogContent className="bg-white border-[var(--modal-border)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[var(--modal-text)]">{editingId ? "Edit Mileage" : "Log Mileage"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold text-[var(--modal-text)]">Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-[var(--modal-text)]">Miles</Label>
              <Input type="number" min="0" step="0.1" value={form.miles} onChange={(e) => setForm(p => ({ ...p, miles: e.target.value }))} className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium" placeholder="12.5" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-[var(--modal-text)]">Purpose</Label>
              <Input value={form.purpose} onChange={(e) => setForm(p => ({ ...p, purpose: e.target.value }))} className="bg-white border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-medium" placeholder="Travel to school site" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="border-2 border-[var(--modal-border)] text-[var(--modal-text)] font-semibold">Cancel</Button>
              <Button onClick={handleSubmit} disabled={!form.miles || !form.purpose} className="bg-[#400070] hover:bg-[#5B00A0] text-white font-semibold">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}