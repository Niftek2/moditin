import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Clock, CheckCircle, Archive, Pencil, Copy, Trash2, User } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";

const STATUS_COLORS = {
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  "Draft Generated": "bg-amber-50 text-amber-700 border-amber-200",
  "Exported": "bg-green-50 text-green-700 border-green-200",
  "Archived": "bg-gray-50 text-gray-500 border-gray-200",
};

const STATUS_ICONS = {
  "In Progress": Clock,
  "Draft Generated": FileText,
  "Exported": CheckCircle,
  "Archived": Archive,
};

export default function EvalReportDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {});
  }, []);

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ["reportDrafts", userEmail],
    queryFn: () => base44.entities.ReportDraft.filter({ created_by: userEmail, archived: false }, "-updated_date"),
    enabled: !!userEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ReportDraft.create(data),
    onSuccess: (draft) => {
      queryClient.invalidateQueries({ queryKey: ["reportDrafts"] });
      navigate(createPageUrl(`EvalReportWizard?id=${draft.id}`));
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (draft) => {
      const { id, created_date, updated_date, ...rest } = draft;
      return base44.entities.ReportDraft.create({
        ...rest,
        studentInitials: rest.studentInitials + " (Copy)",
        status: "In Progress",
        currentStep: 1,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reportDrafts"] }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => base44.entities.ReportDraft.update(id, { archived: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reportDrafts"] }),
  });

  const filtered = drafts.filter(d => {
    const matchSearch = !search || d.studentInitials?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: drafts.length,
    inProgress: drafts.filter(d => d.status === "In Progress").length,
    generated: drafts.filter(d => d.status === "Draft Generated").length,
    exported: drafts.filter(d => d.status === "Exported").length,
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--modal-text)]">IEP DHH Evaluation Reports</h1>
          <p className="text-sm text-[var(--modal-text-muted)] mt-1">Generate professional draft evaluation reports for Teachers of the Deaf and Hard of Hearing</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("EvalReportProfile")}>
            <Button variant="outline" className="border-[var(--modal-border)] gap-2">
              <User className="w-4 h-4" /> Profile & Logo
            </Button>
          </Link>
          <Button
            className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2"
            onClick={() => createMutation.mutate({ status: "In Progress", currentStep: 1, studentInitials: "" })}
            disabled={createMutation.isPending}
          >
            <Plus className="w-4 h-4" /> New Report
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Drafts", value: stats.total, color: "text-[#400070]" },
          { label: "In Progress", value: stats.inProgress, color: "text-blue-600" },
          { label: "Generated", value: stats.generated, color: "text-amber-600" },
          { label: "Exported", value: stats.exported, color: "text-green-600" },
        ].map(stat => (
          <div key={stat.label} className="modal-card p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-[var(--modal-text-muted)] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--modal-text-muted)]" />
          <Input
            placeholder="Search by student initials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 border-[var(--modal-border)]"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44 border-[var(--modal-border)]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Draft Generated">Draft Generated</SelectItem>
            <SelectItem value="Exported">Exported</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Draft list */}
      {isLoading ? (
        <div className="text-center py-12 text-[var(--modal-text-muted)]">Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 modal-card">
          <FileText className="w-12 h-12 text-[var(--modal-border)] mx-auto mb-3" />
          <p className="font-semibold text-[var(--modal-text)]">No reports found</p>
          <p className="text-sm text-[var(--modal-text-muted)] mt-1 mb-4">Create your first evaluation report draft</p>
          <Button
            className="bg-[#400070] hover:bg-[#5B00A0] text-white gap-2"
            onClick={() => createMutation.mutate({ status: "In Progress", currentStep: 1, studentInitials: "" })}
          >
            <Plus className="w-4 h-4" /> New Report
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(draft => {
            const StatusIcon = STATUS_ICONS[draft.status] || FileText;
            const selectedAssessments = draft.selectedAssessmentsJson ? JSON.parse(draft.selectedAssessmentsJson) : [];
            return (
              <div key={draft.id} className="modal-card p-4 flex items-center justify-between hover:shadow-md transition-all group">
                <Link to={createPageUrl(`EvalReportWizard?id=${draft.id}`)} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
                    <StatusIcon className="w-5 h-5 text-[#400070]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[var(--modal-text)]">{draft.studentInitials || "Untitled"}</p>
                      <Badge className={`text-xs border ${STATUS_COLORS[draft.status] || ""}`}>{draft.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--modal-text-muted)] mt-1">
                      <span>{draft.reportType || "Report type not set"}</span>
                      {selectedAssessments.length > 0 && <><span>·</span><span>{selectedAssessments.length} assessment{selectedAssessments.length !== 1 ? "s" : ""}</span></>}
                      {draft.updated_date && <><span>·</span><span>Edited {format(new Date(draft.updated_date), "MMM d, yyyy")}</span></>}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--modal-text-muted)] hover:text-[#400070]"
                    onClick={() => navigate(createPageUrl(`EvalReportWizard?id=${draft.id}`))}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--modal-text-muted)] hover:text-[#400070]"
                    onClick={() => duplicateMutation.mutate(draft)}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--modal-text-muted)] hover:text-red-400"
                    onClick={() => { if (confirm("Archive this report?")) archiveMutation.mutate(draft.id); }}>
                    <Archive className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}