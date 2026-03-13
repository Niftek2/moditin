import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useScrollRestore } from "../components/shared/useScrollRestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import StudentForm from "../components/students/StudentForm";
import BulkEnrollForm from "../components/students/BulkEnrollForm";
import PullToRefresh from "../components/shared/PullToRefresh";
import { useDemo } from "../components/demo/DemoContext";

const COLOR_MAP = {
  red:    { bg: "bg-red-50",    text: "text-gray-900", dot: "bg-red-300",    border: "border-l-red-300" },
  orange: { bg: "bg-orange-50", text: "text-gray-900", dot: "bg-orange-300", border: "border-l-orange-300" },
  yellow: { bg: "bg-yellow-50", text: "text-gray-900", dot: "bg-yellow-300", border: "border-l-yellow-300" },
  green:  { bg: "bg-green-50",  text: "text-gray-900", dot: "bg-green-300",  border: "border-l-green-300" },
  blue:   { bg: "bg-blue-50",   text: "text-gray-900", dot: "bg-blue-300",   border: "border-l-blue-300" },
  purple: { bg: "bg-purple-50", text: "text-gray-900", dot: "bg-purple-300", border: "border-l-purple-300" },
  pink:   { bg: "bg-pink-50",   text: "text-gray-900", dot: "bg-pink-300",   border: "border-l-pink-300" },
  gray:   { bg: "bg-gray-50",   text: "text-gray-900", dot: "bg-gray-300",   border: "border-l-gray-300" },
};

export default function StudentsPage() {
  useScrollRestore("Students");
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { isDemoMode, demoData } = useDemo();
  const [currentUserEmail, setCurrentUserEmail] = React.useState(null);
  React.useEffect(() => {
    if (!isDemoMode) {
      base44.auth.me().then(u => setCurrentUserEmail(u?.email)).catch(() => {});
    }
  }, [isDemoMode]);

  const { data: studentsReal = [], isLoading } = useQuery({
    queryKey: ["students", currentUserEmail],
    queryFn: () => base44.entities.Student.filter({ created_by: currentUserEmail }, "-created_date"),
    enabled: !!currentUserEmail && !isDemoMode,
  });

  const students = isDemoMode ? demoData.students : studentsReal;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["students"] }); setShowForm(false); },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (rows) => {
      const ownedRows = rows.map(row => ({ ...row, created_by: currentUserEmail }));
      return base44.entities.Student.bulkCreate(ownedRows);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["students"] }); setShowBulkForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["students"] }); setEditing(null); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Student.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });

  const handleSubmit = (data) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = students.filter(s =>
    s.studentInitials?.toLowerCase().includes(search.toLowerCase()) ||
    s.gradeBand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ["students"] });

  const handleAddStudent = () => {
    setEditing(null);
    setShowForm(true);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div>
      <PageHeader
        title="Students"
        subtitle={`${students.length} student${students.length !== 1 ? "s" : ""} on your caseload`}
        action={!isDemoMode && (
          <div className="flex gap-2">
            <Button onClick={() => setShowBulkForm(true)} variant="outline" className="border-2 border-[#400070] text-[#400070] hover:bg-[#400070] hover:text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Bulk Enroll
            </Button>
            <Button onClick={handleAddStudent} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Add Student
            </Button>
          </div>
        )}
      />

      {students.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--modal-text-muted)]" />
          <Input
            placeholder="Search by initials or grade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-[var(--modal-border)] text-[var(--modal-text)] placeholder:text-[var(--modal-text-muted)]"
          />
        </div>
      )}

      {students.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Add your first student to start tracking goals, services, and equipment."
          actionLabel="Add Student"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((student) => {
            const colorTag = student.colorTag || "gray";
            const colors = COLOR_MAP[colorTag];
            return (
            <div key={student.id} className={`${colors.bg} modal-card p-4 flex items-center justify-between hover:shadow-md transition-all group border-l-4 ${colors.border}`}>
              <Link to={createPageUrl(`StudentDetail?id=${student.id}`)} className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center shrink-0 border border-current`}>
                  <span className={`text-sm font-bold ${colors.text}`}>{student.studentInitials?.slice(0, 2) || "?"}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[var(--modal-text)] font-semibold">{student.studentInitials}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--modal-text-muted)]">
                    <span>{student.gradeBand}</span>
                    {student.serviceDeliveryModel && <><span>·</span><span>{student.serviceDeliveryModel}</span></>}
                    {student.consultOnly && (
                      <span className="bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full text-[10px]">Consult Only</span>
                    )}
                  </div>
                </div>
              </Link>
              {!isDemoMode && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="text-[var(--modal-text-muted)] hover:text-[#400070] h-8 w-8"
                  onClick={() => { setEditing(student); setShowForm(true); }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-[var(--modal-text-muted)] hover:text-red-400 h-8 w-8"
                  onClick={() => { if (confirm("Delete this student?")) deleteMutation.mutate(student.id); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              )}
              <Link to={createPageUrl(`StudentDetail?id=${student.id}`)}>
                <ChevronRight className="w-4 h-4 text-[var(--modal-text-muted)] ml-2" />
              </Link>
              </div>
              );
              })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[var(--modal-card)] border-[var(--modal-border)] max-w-lg">
          <StudentForm student={editing} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkForm} onOpenChange={setShowBulkForm}>
        <DialogContent className="bg-[var(--modal-card)] border-[var(--modal-border)] max-w-2xl">
          <BulkEnrollForm
            onSubmit={(rows) => bulkCreateMutation.mutate(rows)}
            onCancel={() => setShowBulkForm(false)}
            isSaving={bulkCreateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
    </PullToRefresh>
  );
}