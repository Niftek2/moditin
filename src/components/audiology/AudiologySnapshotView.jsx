import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, AlertTriangle, CalendarDays, Ear } from "lucide-react";
import AudiologySnapshotForm from "./AudiologySnapshotForm";

const EQUIPMENT_LABELS = {
  HearingAids: "Hearing Aids", CochlearImplant: "CI", BAHA: "BAHA",
  FM_DM: "FM/DM", Soundfield: "Soundfield", CROS: "CROS", None: "None", Other: "Other"
};

const HL_TYPE_LABELS = {
  Sensorineural: "Sensorineural", Conductive: "Conductive", Mixed: "Mixed",
  ANSD: "ANSD", CentralAuditoryProcessingConcerns: "CAPD (ref. only)",
  Unknown: "Unknown", Other: "Other"
};

export default function AudiologySnapshotView({ studentId }) {
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: snapshot, isLoading } = useQuery({
    queryKey: ["audiologySnapshot", studentId],
    queryFn: async () => {
      const results = await base44.entities.StudentAudiologySnapshot.filter({ studentId });
      return results[0] || null;
    },
    enabled: !!studentId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (snapshot?.id) {
        return base44.entities.StudentAudiologySnapshot.update(snapshot.id, data);
      } else {
        return base44.entities.StudentAudiologySnapshot.create({ ...data, studentId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audiologySnapshot", studentId] });
      setEditing(false);
    },
  });

  if (isLoading) return <div className="text-sm text-[var(--modal-text-muted)] py-6 text-center">Loading...</div>;

  if (editing) {
    return (
      <AudiologySnapshotForm
        snapshot={snapshot}
        onSubmit={(data) => saveMutation.mutate(data)}
        onCancel={() => setEditing(false)}
        saving={saveMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer banner */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800">
          <strong>Educational Snapshot only.</strong> Not diagnostic. No medical documents stored here. Do not upload or paste audiograms or medical reports. Follow district/state procedures.
        </p>
      </div>

      {!snapshot ? (
        <div className="modal-card p-10 text-center">
          <Ear className="w-8 h-8 text-[#6B2FB9] mx-auto mb-3 opacity-50" />
          <p className="text-sm text-[var(--modal-text-muted)] mb-4">No audiology snapshot recorded yet.</p>
          <Button onClick={() => setEditing(true)} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl">
            Add Audiology Snapshot
          </Button>
        </div>
      ) : (
        <>
          {/* At-a-glance row */}
          <div className="modal-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--modal-text)]">Audiology Snapshot <span className="text-xs font-normal text-[var(--modal-text-muted)]">(Educational)</span></h3>
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-[#6B2FB9] hover:text-[#400070]">
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Chip label="Last Audiogram" value={snapshot.lastAudiogramDate || "Unknown"} icon={<CalendarDays className="w-3 h-3" />} />
              <Chip label="Type" value={HL_TYPE_LABELS[snapshot.hearingLossType] || "—"} />
              <Chip label="Laterality" value={snapshot.hearingLossLaterality || "—"} />
              {(snapshot.equipmentUsed || []).map(eq => (
                <Chip key={eq} label="Equipment" value={EQUIPMENT_LABELS[eq] || eq} color="purple" />
              ))}
            </div>

            {/* Detail fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {snapshot.severityRange && <DetailItem label="Severity" value={snapshot.severityRange} />}
              {snapshot.configuration && <DetailItem label="Configuration" value={snapshot.configuration} />}
              {snapshot.onset && <DetailItem label="Onset" value={snapshot.onset} />}
              {snapshot.progression && <DetailItem label="Progression" value={snapshot.progression} />}
              {snapshot.etiologyKnown && <DetailItem label="Etiology" value={snapshot.etiologyKnown} />}
            </div>

            {(snapshot.hearingLossDetail || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {snapshot.hearingLossDetail.map(d => (
                  <Badge key={d} variant="secondary" className="text-[10px] bg-[#EADDF5] text-[#400070] border-0">{d.replace(/([A-Z])/g, " $1").trim()}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Instructional Notes */}
          {(snapshot.listeningAccessNotes || snapshot.hlHistoryNotes || snapshot.equipmentDetails || snapshot.etiologyNotes) && (
            <div className="modal-card p-5 space-y-4">
              <h3 className="font-semibold text-[var(--modal-text)]">Instructional Notes</h3>
              {snapshot.listeningAccessNotes && <NoteBlock label="Listening Access" text={snapshot.listeningAccessNotes} />}
              {snapshot.hlHistoryNotes && <NoteBlock label="HL History" text={snapshot.hlHistoryNotes} />}
              {snapshot.equipmentDetails && <NoteBlock label="Equipment Details" text={snapshot.equipmentDetails} />}
              {snapshot.etiologyNotes && <NoteBlock label="Etiology Notes" text={snapshot.etiologyNotes} />}
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <p className="text-[10px] text-[var(--modal-text-muted)] text-center pt-1">
        Educational summary only · Not diagnostic · No medical documents stored · Follow district/state and school procedures
      </p>
    </div>
  );
}

function Chip({ label, value, icon, color }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${color === "purple" ? "bg-[#EADDF5] border-[#C4A8E8] text-[#400070]" : "bg-[#F7F3FA] border-[var(--modal-border)] text-[var(--modal-text)]"}`}>
      {icon}
      <span className="text-[var(--modal-text-muted)]">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="bg-[#F7F3FA] rounded-lg p-2 border border-[var(--modal-border)]">
      <p className="text-[10px] text-[var(--modal-text-muted)] mb-0.5">{label}</p>
      <p className="text-xs font-medium text-[var(--modal-text)]">{value}</p>
    </div>
  );
}

function NoteBlock({ label, text }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--modal-text-muted)] mb-1">{label}</p>
      <p className="text-sm text-[var(--modal-text)]">{text}</p>
    </div>
  );
}