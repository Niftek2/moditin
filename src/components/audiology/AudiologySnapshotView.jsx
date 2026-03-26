import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, AlertTriangle, CalendarDays, Ear, Activity, ExternalLink } from "lucide-react";
import AudiologySnapshotForm from "./AudiologySnapshotForm";
import { useDemo } from "../demo/DemoContext";
import { useNavigate } from "react-router-dom";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine
} from "recharts";

const FREQUENCIES = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
const FREQ_LABELS = { 250: "250", 500: "500", 1000: "1k", 2000: "2k", 3000: "3k", 4000: "4k", 6000: "6k", 8000: "8k" };
const SEVERITY_BANDS = [
  { label: "Normal",     min: -10, max: 25,  color: "#E8F5E9" },
  { label: "Mild",       min: 25,  max: 40,  color: "#FFF9C4" },
  { label: "Moderate",   min: 40,  max: 55,  color: "#FFE0B2" },
  { label: "Mod-Severe", min: 55,  max: 70,  color: "#FFCCBC" },
  { label: "Severe",     min: 70,  max: 90,  color: "#FFCDD2" },
  { label: "Profound",   min: 90,  max: 120, color: "#F3E5F5" },
];

function RightEarDot({ cx, cy }) {
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={6} fill="white" stroke="#DC2626" strokeWidth={2} />;
}
function LeftEarDot({ cx, cy }) {
  if (cx == null || cy == null) return null;
  const d = 5;
  return (
    <g>
      <line x1={cx-d} y1={cy-d} x2={cx+d} y2={cy+d} stroke="#2563EB" strokeWidth={2} strokeLinecap="round" />
      <line x1={cx+d} y1={cy-d} x2={cx-d} y2={cy+d} stroke="#2563EB" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}
function AudiogramTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  return (
    <div className="bg-white border border-[#D8CDE5] rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold">{FREQ_LABELS[pt.freq] || pt.freq} Hz — {pt.db} dB HL</p>
      <p className="text-[#4A4A4A]">{pt.ear === "right" ? "Right" : "Left"} ear</p>
    </div>
  );
}

function AudiogramChart({ audiogramData }) {
  let rightPoints = [], leftPoints = [], label = "";
  try {
    const parsed = JSON.parse(audiogramData);
    rightPoints = parsed.right || [];
    leftPoints = parsed.left || [];
    label = parsed.label || "";
  } catch {
    return null;
  }
  if (!rightPoints.length && !leftPoints.length) return null;

  const freqIndex = (freq) => FREQUENCIES.indexOf(freq);
  const rightData = rightPoints.map(p => ({ x: freqIndex(p.freq), y: p.db, freq: p.freq, ear: "right" }));
  const leftData  = leftPoints.map(p  => ({ x: freqIndex(p.freq), y: p.db, freq: p.freq, ear: "left"  }));

  return (
    <div className="modal-card p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-[var(--modal-text)] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#6B2FB9]" />
          Audiogram Plotter Data
          {label && <span className="text-xs font-normal text-[var(--modal-text-muted)]">— {label}</span>}
        </h3>
        <div className="flex items-center gap-3 text-xs text-[#4A4A4A]">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" fill="white" stroke="#DC2626" strokeWidth="2"/></svg>
            Right
          </span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <line x1="2" y1="2" x2="10" y2="10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
              <line x1="10" y1="2" x2="2" y2="10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Left
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 5, right: 50, bottom: 25, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDE8F4" />
          {SEVERITY_BANDS.map(b => (
            <ReferenceArea key={b.label} y1={b.min} y2={b.max} fill={b.color} fillOpacity={0.6} ifOverflow="hidden" />
          ))}
          <XAxis
            dataKey="x" type="number" domain={[-0.5, 7.5]}
            ticks={[0,1,2,3,4,5,6,7]}
            tickFormatter={(v) => FREQ_LABELS[FREQUENCIES[v]] || v}
            tick={{ fontSize: 10, fill: "#4A4A4A" }}
            label={{ value: "Frequency (Hz)", position: "insideBottom", offset: -12, fontSize: 10, fill: "#4A4A4A" }}
          />
          <YAxis
            dataKey="y" type="number" domain={[120, -10]}
            ticks={[-10,0,10,20,30,40,50,60,70,80,90,100,110,120]}
            tick={{ fontSize: 10, fill: "#4A4A4A" }}
            label={{ value: "dB HL", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#4A4A4A" }}
            reversed
          />
          <Tooltip content={<AudiogramTooltip />} />
          <Scatter name="Right" data={rightData} shape={<RightEarDot />} line={{ stroke: "#DC2626", strokeWidth: 1.5 }} lineType="joint" />
          <Scatter name="Left"  data={leftData}  shape={<LeftEarDot />}  line={{ stroke: "#2563EB", strokeWidth: 1.5 }} lineType="joint" />
          {SEVERITY_BANDS.map(b => (
            <ReferenceLine key={`lbl-${b.label}`} y={(b.min+b.max)/2} stroke="transparent"
              label={{ value: b.label, position: "right", fontSize: 8, fill: "#9E9E9E" }} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-[var(--modal-text-muted)] text-center">
        Educational reference · Plotted via Audiogram Plotter · Not diagnostic
      </p>
    </div>
  );
}

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
  const { isDemoMode, demoData } = useDemo();
  const navigate = useNavigate();

  const { data: snapshot, isLoading } = useQuery({
    queryKey: ["audiologySnapshot", studentId],
    queryFn: async () => {
      if (isDemoMode) return demoData.audiologySnapshots.find(s => s.studentId === studentId) || null;
      const results = await base44.entities.StudentAudiologySnapshot.filter({ studentId });
      return results[0] || null;
    },
    enabled: !!studentId,
    staleTime: 0,
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
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => setEditing(true)} className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl">
              Add Audiology Snapshot
            </Button>
            <Button variant="outline" onClick={() => navigate(`/AudiogramPlotter?studentId=${studentId}`)} className="rounded-xl border-[#C4A8E0] text-[#400070]">
              <Activity className="w-4 h-4 mr-1" /> Open Audiogram Plotter
            </Button>
          </div>
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

          {/* Audiogram Plotter data — shown if plotted thresholds exist */}
          {snapshot.audiogramData && <AudiogramChart audiogramData={snapshot.audiogramData} />}

          {/* Link to Audiogram Plotter */}
          <button
            onClick={() => navigate(`/AudiogramPlotter?studentId=${studentId}`)}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#6B2FB9] border border-[#C4A8E0] bg-[#F7F3FA] hover:bg-[#EADDF5] rounded-xl py-3 transition-colors"
          >
            <Activity className="w-4 h-4" />
            {snapshot.audiogramData ? "Edit in Audiogram Plotter" : "Plot Thresholds in Audiogram Plotter"}
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </button>

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