import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Mail, DollarSign, Users, Calendar, Building2, Pencil, Check, X } from "lucide-react";

const STATUS_COLORS = {
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-yellow-100 text-yellow-700",
  converted: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-600",
};

export default function QuotesAdmin() {
  const [authError, setAuthError] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const queryClient = useQueryClient();

  // Guard: admin only
  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user || user.role !== "admin") setAuthError(true);
    }).catch(() => setAuthError(true));
  }, []);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes-admin"],
    queryFn: () => base44.entities.Quote.list("-created_date", 200),
    enabled: !authError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes-admin"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Quote.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotes-admin"] }),
  });

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--modal-bg)]">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--modal-text)] mb-2">Access Denied</p>
          <p className="text-[var(--modal-text-muted)]">This page is restricted to administrators.</p>
        </div>
      </div>
    );
  }

  const totalRevenuePotential = quotes
    .filter(q => q.status !== "cancelled" && q.status !== "expired")
    .reduce((sum, q) => sum + (q.totalPrice || 0), 0);

  const converted = quotes.filter(q => q.status === "converted").length;

  return (
    <div className="min-h-screen bg-[var(--modal-bg)] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--modal-text)] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#400070]" /> Quote Management
            </h1>
            <p className="text-sm text-[var(--modal-text-muted)] mt-1">Admin only — all generated quotes</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Quotes", value: quotes.length, icon: FileText, color: "text-[#400070]" },
            { label: "Converted", value: converted, icon: Check, color: "text-green-600" },
            { label: "Pipeline Value", value: `$${totalRevenuePotential.toLocaleString()}`, icon: DollarSign, color: "text-blue-600" },
            { label: "Total Seats", value: quotes.reduce((s, q) => s + (q.seats || 0), 0), icon: Users, color: "text-purple-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="modal-card p-5">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="text-xs text-[var(--modal-text-muted)]">{label}</p>
                  <p className="text-xl font-bold text-[var(--modal-text)]">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quotes Table */}
        <div className="modal-card overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-[var(--modal-text-muted)]">Loading quotes…</div>
          ) : quotes.length === 0 ? (
            <div className="p-10 text-center text-[var(--modal-text-muted)]">No quotes yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--modal-border)] bg-[#F7F3FA]">
                    <th className="text-left px-5 py-3 text-[#400070] font-semibold">Quote #</th>
                    <th className="text-left px-5 py-3 text-[#400070] font-semibold">Contact</th>
                    <th className="text-left px-5 py-3 text-[#400070] font-semibold">School / District</th>
                    <th className="text-center px-4 py-3 text-[#400070] font-semibold">Seats</th>
                    <th className="text-right px-4 py-3 text-[#400070] font-semibold">Total</th>
                    <th className="text-center px-4 py-3 text-[#400070] font-semibold">Status</th>
                    <th className="text-left px-4 py-3 text-[#400070] font-semibold">Date</th>
                    <th className="text-left px-4 py-3 text-[#400070] font-semibold">Notes</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="border-b border-[var(--modal-border)] hover:bg-[#F9F6FD] transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-[var(--modal-text-muted)]">{quote.quoteNumber}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[var(--modal-text)]">{quote.contactName}</p>
                        <a href={`mailto:${quote.contactEmail}`} className="text-[#400070] text-xs hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" />{quote.contactEmail}
                        </a>
                        {quote.contactTitle && <p className="text-xs text-[var(--modal-text-muted)]">{quote.contactTitle}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[var(--modal-text)] flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[var(--modal-text-muted)]" />{quote.schoolName}
                        </p>
                        {quote.schoolAddress && <p className="text-xs text-[var(--modal-text-muted)]">{quote.schoolAddress}</p>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[var(--modal-text)]">
                          <Users className="w-3.5 h-3.5 text-[var(--modal-text-muted)]" />{quote.seats}
                        </span>
                        <p className="text-xs text-[var(--modal-text-muted)]">{quote.planName}</p>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-[var(--modal-text)]">
                        {quote.currency === "CAD" ? "CA$" : "$"}{(quote.totalPrice || 0).toLocaleString()}
                        <p className="text-xs text-[var(--modal-text-muted)] font-normal">{quote.currency}/yr</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {editingId === quote.id ? (
                          <Select value={editStatus} onValueChange={setEditStatus}>
                            <SelectTrigger className="w-28 text-xs h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["sent","viewed","converted","expired","cancelled"].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[quote.status] || STATUS_COLORS.sent}`}>
                            {quote.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-[var(--modal-text-muted)] whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{quote.quoteDate || new Date(quote.created_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-[160px]">
                        {editingId === quote.id ? (
                          <Textarea
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            className="text-xs h-16 resize-none"
                            placeholder="Internal notes…"
                          />
                        ) : (
                          <p className="text-xs text-[var(--modal-text-muted)] truncate">{quote.notes || <span className="italic opacity-40">No notes</span>}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {editingId === quote.id ? (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700"
                              onClick={() => updateMutation.mutate({ id: quote.id, data: { status: editStatus, notes: editNotes } })}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400"
                              onClick={() => setEditingId(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-[var(--modal-text-muted)]"
                              onClick={() => { setEditingId(quote.id); setEditNotes(quote.notes || ""); setEditStatus(quote.status || "sent"); }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm("Delete this quote?")) deleteMutation.mutate(quote.id); }}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}