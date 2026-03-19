import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function StudentAccommodationsTab({ studentId }) {
  const { data: studentAccommodations = [], isLoading: loadingSA } = useQuery({
    queryKey: ["studentAccommodations", studentId],
    queryFn: () => base44.entities.StudentAccommodation.filter({ studentId }),
    enabled: !!studentId,
  });

  const { data: accommodations = [], isLoading: loadingA } = useQuery({
    queryKey: ["accommodations"],
    queryFn: () => base44.entities.Accommodation.list(),
  });

  const accomMap = {};
  accommodations.forEach(a => { accomMap[a.id] = a; });

  if (loadingSA || loadingA) {
    return <div className="modal-card p-6 text-sm text-[var(--modal-text-muted)]">Loading…</div>;
  }

  return (
    <div className="modal-card p-6" id="tab-Accommodations" role="tabpanel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[var(--modal-text)]">Accommodations</h2>
        <Link to={createPageUrl("Accommodations")} className="text-xs text-[#6B2FB9] hover:underline">
          Manage All
        </Link>
      </div>
      {studentAccommodations.length === 0 ? (
        <p className="text-sm text-[var(--modal-text-muted)] text-center py-6">No accommodations assigned yet.</p>
      ) : (
        <div className="space-y-3">
          {studentAccommodations.map(sa => {
            const accom = accomMap[sa.accommodationId];
            return (
              <div key={sa.id} className="p-3 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
                <div className="flex items-start gap-2 justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--modal-text)]">{accom?.name || "Unknown"}</p>
                    {accom?.description && <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">{accom.description}</p>}
                    {sa.notes && <p className="text-xs text-[var(--modal-text-muted)] mt-1 italic">{sa.notes}</p>}
                  </div>
                  {accom?.category && (
                    <Badge className="text-[10px] bg-[#EADDF5] text-[#400070] border-0 shrink-0">{accom.category}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}