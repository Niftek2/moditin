import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClipboardCheck, Plus } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";

const CATEGORIES = ["Classroom Access", "Instructional Delivery", "Hearing Technology", "Assessments", "Communication Supports", "Environmental", "Other"];

export default function AccommodationsPage() {
  const [selectedStudent, setSelectedStudent] = useState("");
  const queryClient = useQueryClient();

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: accommodations = [] } = useQuery({
    queryKey: ["accommodations"],
    queryFn: () => base44.entities.Accommodation.list("-created_date", 200),
  });

  const { data: studentAccommodations = [] } = useQuery({
    queryKey: ["studentAccommodations", selectedStudent],
    queryFn: () => base44.entities.StudentAccommodation.filter({ studentId: selectedStudent }),
    enabled: !!selectedStudent,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ accommodationId, isAssigned, saId }) => {
      if (isAssigned) {
        await base44.entities.StudentAccommodation.delete(saId);
      } else {
        await base44.entities.StudentAccommodation.create({ studentId: selectedStudent, accommodationId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["studentAccommodations"] }),
  });

  const assignedIds = new Set(studentAccommodations.map(sa => sa.accommodationId));
  const saMap = {};
  studentAccommodations.forEach(sa => { saMap[sa.accommodationId] = sa.id; });

  const grouped = {};
  CATEGORIES.forEach(c => { grouped[c] = []; });
  accommodations.forEach(a => {
    if (grouped[a.category]) grouped[a.category].push(a);
  });

  return (
    <div>
      <PageHeader title="Accommodations" subtitle="Select and manage accommodations per student" />

      <div className="mb-6">
        <label htmlFor="student-select" className="block text-sm font-semibold text-[var(--modal-text)] mb-1">
          Student
        </label>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger
            id="student-select"
            className="w-64 bg-[var(--modal-card)] border-[var(--modal-border)] text-[var(--modal-text)]"
            aria-label="Select a student"
          >
            <SelectValue placeholder="Select a student..." />
          </SelectTrigger>
          <SelectContent>
            {students.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.studentInitials} ({s.gradeBand})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedStudent ? (
        <div className="modal-card p-12 text-center" role="status" aria-live="polite">
          <ClipboardCheck className="w-10 h-10 text-[var(--modal-text-muted)] mx-auto mb-3" aria-hidden="true" />
          <p className="text-[var(--modal-text-muted)]">Select a student to view and manage accommodations.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map(category => (
            <section key={category} className="modal-card p-5" aria-labelledby={`category-${category.replace(/\s+/g, "-").toLowerCase()}`}>
              <h3
                id={`category-${category.replace(/\s+/g, "-").toLowerCase()}`}
                className="font-semibold text-[var(--modal-text)] mb-3"
              >
                {category}
              </h3>
              {grouped[category].length === 0 ? (
                <p className="text-sm text-[var(--modal-text-muted)]">No accommodations in this category yet.</p>
              ) : (
                <ul className="space-y-2" role="list">
                  {grouped[category].map(acc => {
                    const isAssigned = assignedIds.has(acc.id);
                    const checkboxId = `acc-${acc.id}`;
                    return (
                      <li key={acc.id}>
                        <label
                          htmlFor={checkboxId}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--modal-card-hover)] cursor-pointer transition-colors"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={isAssigned}
                            onCheckedChange={() => toggleMutation.mutate({ accommodationId: acc.id, isAssigned, saId: saMap[acc.id] })}
                            className="mt-0.5 border-[var(--modal-border)] data-[state=checked]:bg-[#400070] data-[state=checked]:border-[#400070]"
                            aria-describedby={acc.description ? `${checkboxId}-desc` : undefined}
                          />
                          <div>
                            <span className="text-sm text-[var(--modal-text)] font-medium block">{acc.name}</span>
                            {acc.description && (
                              <span id={`${checkboxId}-desc`} className="text-sm text-[var(--modal-text-muted)] mt-0.5 block">
                                {acc.description}
                              </span>
                            )}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}