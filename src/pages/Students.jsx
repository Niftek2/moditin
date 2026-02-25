import React, { useState } from "react";
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
import PullToRefresh from "../components/shared/PullToRefresh";
import { useSubscription } from "../components/shared/SubscriptionGate";
import StudentLimitModal from "../components/students/StudentLimitModal";

const FREE_STUDENT_LIMIT = 3;

const COLOR_MAP = {
  red: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  green: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  blue: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  pink: { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500" },
  gray: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
};

export default function StudentsPage() {
  useScrollRestore("Students");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { subStatus } = useSubscription();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["students"] }); setShowForm(false); },
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

  const isFreeLimitExceeded = !subStatus?.isPro && !subStatus?.isTrial && students.length > FREE_STUDENT_LIMIT;
  const canAddStudent = subStatus?.isPro || subStatus?.isTrial || students.length < FREE_STUDENT_LIMIT;

  const handleAddStudent = () => {
    if (!canAddStudent) {
      alert(`You've reached the 3-student free limit. Upgrade to add unlimited students.`);
      return;
    }
    setEditing(null);
    setShowForm(true);
  };

  const handleUpgradeFromModal = async () => {
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app, not the preview.");
      return;
    }
    const res = await base44.functions.invoke("stripeCheckout", {
      successUrl: window.location.origin + "/?subscribed=1",
      cancelUrl: window.location.origin + "/",
    });
    if (res.data?.url) window.location.href = res.data.url;
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {isFreeLimitExceeded && (
        <StudentLimitModal
          students={students}
          onStudentsKept={() => queryClient.invalidateQueries({ queryKey: ["students"] })}
          onUpgrade={handleUpgradeFromModal}
        />
      )}
    <div>
      <PageHeader
        title="Students"
        subtitle={`${students.length} student${students.length !== 1 ? "s" : ""} on your caseload`}
        action={
          <Button onClick={handleAddStudent} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Student
          </Button>
        }
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
            <div key={student.id} className={`${colors.bg} modal-card p-4 flex items-center justify-between hover:shadow-md transition-all group border-l-4 ${colors.dot}`}>
              <Link to={createPageUrl(`StudentDetail?id=${student.id}`)} className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center shrink-0 border border-current`}>
                  <span className={`text-sm font-bold ${colors.text}`}>{student.studentInitials?.slice(0, 2) || "?"}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[var(--modal-text)] font-semibold">{student.studentInitials}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--modal-text-muted)]">
                    <span>{student.gradeBand}</span>
                    <span>·</span>
                    <span>{student.serviceDeliveryModel}</span>
                  </div>
                </div>
              </Link>
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
    </div>
    </PullToRefresh>
  );
}