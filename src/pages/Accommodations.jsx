import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCheck, Download } from "lucide-react";
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
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-64 bg-white/5 border-[var(--modal-border)] text-white">
            <SelectValue placeholder="Select a student..." />
          </SelectTrigger>
          <SelectContent>
            {students.map(s => <SelectItem key={s.id} value={s.id}>{s.studentInitials} ({s.gradeBand})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!selectedStudent ? (
        <div className="modal-card p-12 text-center">
          <ClipboardCheck className="w-10 h-10 text-[var(--modal-text-muted)] mx-auto mb-3" />
          <p className="text-[var(--modal-text-muted)]">Select a student to view and manage accommodations.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map(category => (
            <div key={category} className="modal-card p-5">
              <h3 className="font-semibold text-white mb-3">{category}</h3>
              {grouped[category].length === 0 ? (
                <p className="text-sm text-[var(--modal-text-muted)]">No accommodations in this category yet.</p>
              ) : (
                <div className="space-y-2">
                  {grouped[category].map(acc => {
                    const isAssigned = assignedIds.has(acc.id);
                    return (
                      <label key={acc.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                        <Checkbox
                          checked={isAssigned}
                          onCheckedChange={() => toggleMutation.mutate({ accommodationId: acc.id, isAssigned, saId: saMap[acc.id] })}
                          className="mt-0.5 border-[var(--modal-border)] data-[state=checked]:bg-[#400070] data-[state=checked]:border-[#400070]"
                        />
                        <div>
                          <p className="text-sm text-white font-medium">{acc.name}</p>
                          {acc.description && <p className="text-sm text-[var(--modal-text)] mt-0.5">{acc.description}</p>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}