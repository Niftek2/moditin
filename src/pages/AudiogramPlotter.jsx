import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea
} from "recharts";
import { AlertTriangle, Save, RotateCcw, Info, Activity, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDemo } from "../components/demo/DemoContext";
import html2canvas from "html2canvas";

// ─── Constants ───────────────────────────────────────────────────────────────

const FREQUENCIES = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
const FREQ_LABELS = {
  250: "250", 500: "500", 1000: "1k",
  2000: "2k", 3000: "3k", 4000: "4k",
  6000: "6k", 8000: "8k"
};

const SEVERITY_BANDS = [
  { label: "Normal",     min: -10, max: 25,  color: "#E8F5E9" },
  { label: "Mild",       min: 25,  max: 40,  color: "#FFF9C4" },
  { label: "Moderate",   min: 40,  max: 55,  color: "#FFE0B2" },
  { label: "Mod-Severe", min: 55,  max: 70,  color: "#FFCCBC" },
  { label: "Severe",     min: 70,  max: 90,  color: "#FFCDD2" },
  { label: "Profound",   min: 90,  max: 120, color: "#F3E5F5" },
];

const DB_MIN = -10;
const DB_MAX = 120;
const DEFAULT_DB = 40;

// ─── Custom scatter dot shapes ────────────────────────────────────────────────

function RightEarDot(props) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle cx={cx} cy={cy} r={8} fill="white" stroke="#DC2626" strokeWidth={2.5} />
  );
}

function LeftEarDot(props) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  const d = 7;
  return (
    <g>
      <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} stroke="#2563EB" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d} stroke="#2563EB" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function AudiogramTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  const ear = pt.ear === "right" ? "Right" : "Left";
  const freqLabel = FREQ_LABELS[pt.freq] || pt.freq;
  return (
    <div className="bg-white border border-[#D8CDE5] rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-[#1A1028]">{freqLabel} Hz — {pt.db} dB HL</p>
      <p className="text-[#4A4A4A]">{ear} ear</p>
    </div>
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function getSeverityLabel(points) {
  if (!points.length) return null;
  const avg = points.reduce((s, p) => s + p.db, 0) / points.length;
  const band = SEVERITY_BANDS.find(b => avg >= b.min && avg < b.max);
  return band?.label || null;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AudiogramPlotter() {
  const queryClient = useQueryClient();
  const { isDemoMode, demoData } = useDemo();

  const [currentUser, setCurrentUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedStudentId, setSelectedStudentId] = useState(urlParams.get("studentId") || "");
  const [activeEar, setActiveEar] = useState("right");
  const [activeFreq, setActiveFreq] = useState(null);
  const [dbInput, setDbInput] = useState(DEFAULT_DB);
  const [rightPoints, setRightPoints] = useState([]);
  const [leftPoints, setLeftPoints] = useState([]);
  const [audiogramLabel, setAudiogramLabel] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!isDemoMode) {
      base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
    }
  }, [isDemoMode]);

  // ── Students ─────────────────────────────────────────────────────────────────
  const { data: studentsRaw = [] } = useQuery({
    queryKey: ["students", currentUser?.email, isDemoMode],
    queryFn: () => {
      if (isDemoMode) return demoData.students || [];
      return base44.entities.Student.filter({ created_by: currentUser?.email });
    },
    enabled: isDemoMode || !!currentUser?.email,
  });
  const students = isDemoMode ? (demoData.students || []) : studentsRaw;

  // ── Existing snapshot ─────────────────────────────────────────────────────────
  const { data: snapshot, isLoading: snapshotLoading } = useQuery({
    queryKey: ["audiologySnapshot", selectedStudentId],
    queryFn: async () => {
      if (isDemoMode) {
        return (demoData.audiologySnapshots || []).find(s => s.studentId === selectedStudentId) || null;
      }
      const results = await base44.entities.StudentAudiologySnapshot.filter({ studentId: selectedStudentId });
      return results[0] || null;
    },
    enabled: !!selectedStudentId,
  });

  // Populate chart when snapshot loads
  useEffect(() => {
    if (!selectedStudentId) return;
    if (snapshot?.audiogramData) {
      try {
        const parsed = JSON.parse(snapshot.audiogramData);
        setRightPoints(parsed.right || []);
        setLeftPoints(parsed.left || []);
        setAudiogramLabel(parsed.label || "");
      } catch {
        setRightPoints([]);
        setLeftPoints([]);
        setAudiogramLabel("");
      }
    } else {
      setRightPoints([]);
      setLeftPoints([]);
      setAudiogramLabel("");
    }
    setHasUnsaved(false);
    setActiveFreq(null);
  }, [snapshot?.id, selectedStudentId]);

  // ── Save ──────────────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId) throw new Error("No student selected");

      // Capture chart as image
      let audiogramImageUrl = null;
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, { backgroundColor: "#ffffff", scale: 2 });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
        const file = new File([blob], "audiogram.png", { type: "image/png" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        audiogramImageUrl = file_url;
      }

      // Always do a fresh lookup to avoid stale closure issue
      const existing = await base44.entities.StudentAudiologySnapshot.filter({ studentId: selectedStudentId });
      if (existing.length > 0) {
        return base44.entities.StudentAudiologySnapshot.update(existing[0].id, { audiogramImageUrl });
      }
      return base44.entities.StudentAudiologySnapshot.create({ studentId: selectedStudentId, audiogramImageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audiologySnapshot", selectedStudentId] });
      setSaveSuccess(true);
      setHasUnsaved(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  // ── Plot a point ──────────────────────────────────────────────────────────────
  const handlePlotPoint = useCallback(() => {
    if (activeFreq === null) return;
    const db = Number(dbInput);
    if (isNaN(db) || db < DB_MIN || db > DB_MAX) return;

    const newPoint = { freq: activeFreq, db, ear: activeEar };

    if (activeEar === "right") {
      setRightPoints(prev => {
        const filtered = prev.filter(p => p.freq !== activeFreq);
        return [...filtered, newPoint].sort((a, b) => a.freq - b.freq);
      });
    } else {
      setLeftPoints(prev => {
        const filtered = prev.filter(p => p.freq !== activeFreq);
        return [...filtered, newPoint].sort((a, b) => a.freq - b.freq);
      });
    }

    // Auto-advance to next unplotted frequency
    const currentPoints = activeEar === "right" ? rightPoints : leftPoints;
    const plotted = new Set([...currentPoints.map(p => p.freq), activeFreq]);
    const next = FREQUENCIES.find(f => !plotted.has(f));
    setActiveFreq(next || null);

    setHasUnsaved(true);
  }, [activeFreq, dbInput, activeEar, rightPoints, leftPoints]);

  // ── Remove a point ────────────────────────────────────────────────────────────
  const handleRemovePoint = useCallback((ear, freq) => {
    if (ear === "right") setRightPoints(prev => prev.filter(p => p.freq !== freq));
    else setLeftPoints(prev => prev.filter(p => p.freq !== freq));
    setHasUnsaved(true);
  }, []);

  // ── Clear ─────────────────────────────────────────────────────────────────────
  const handleClearAll = useCallback(() => {
    setRightPoints([]);
    setLeftPoints([]);
    setActiveFreq(null);
    setHasUnsaved(true);
  }, []);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const hasAnyPoints = rightPoints.length > 0 || leftPoints.length > 0;

  const freqIndex = (freq) => FREQUENCIES.indexOf(freq);
  const rightChartData = rightPoints.map(p => ({ x: freqIndex(p.freq), y: p.db, freq: p.freq, ear: "right" }));
  const leftChartData  = leftPoints.map(p  => ({ x: freqIndex(p.freq), y: p.db, freq: p.freq, ear: "left"  }));

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#EADDF5] flex items-center justify-center shrink-0">
          <Activity className="w-6 h-6 text-[#400070]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1028]">Audiogram Plotter</h1>
          <p className="text-[#4A4A4A] mt-0.5">
            Plot hearing threshold data for reference during IEP meetings and instructional planning.
            Saved to the student's Audiology profile.
          </p>
        </div>
      </div>

      {/* FERPA disclaimer */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4" role="note">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-0.5">Educational reference tool only — not diagnostic.</p>
          <p>Do not reproduce or upload official audiograms. Enter threshold estimates from your working
          knowledge of the student for instructional planning only. Follow your district's FERPA and
          data privacy procedures.</p>
        </div>
      </div>

      {/* Student selector */}
      <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#1A1028]">Select Student</h2>
        <div className="max-w-xs space-y-3">
          <Select
            value={selectedStudentId}
            onValueChange={(val) => {
              setSelectedStudentId(val);
              setRightPoints([]);
              setLeftPoints([]);
              setActiveFreq(null);
              setHasUnsaved(false);
            }}
          >
            <SelectTrigger aria-label="Select a student">
              <SelectValue placeholder="Choose a student…" />
            </SelectTrigger>
            <SelectContent>
              {students.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.studentInitials || s.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-1.5">
            <Label htmlFor="audiogram-label">
              Audiogram Label{" "}
              <span className="text-[10px] font-normal text-[#4A4A4A]">(optional)</span>
            </Label>
            <Input
              id="audiogram-label"
              placeholder="e.g., Spring 2026"
              value={audiogramLabel}
              onChange={e => { setAudiogramLabel(e.target.value); setHasUnsaved(true); }}
            />
          </div>
        </div>

        {selectedStudent && snapshot?.audiogramData && !hasUnsaved && (
          <div className="flex items-center gap-2 text-xs text-[#6B2FB9] font-medium">
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            Loaded saved audiogram
            {(() => {
              try {
                const p = JSON.parse(snapshot.audiogramData);
                return p.label ? `: "${p.label}"` : "";
              } catch { return ""; }
            })()}
          </div>
        )}
      </div>

      {/* Chart + data entry */}
      {selectedStudentId && (
        <>
          {/* Audiogram chart */}
          <div ref={chartRef} className="bg-white rounded-2xl border border-[var(--modal-border)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-base font-bold text-[#1A1028]">
                Audiogram
                {audiogramLabel && (
                  <span className="ml-2 text-sm font-normal text-[#4A4A4A]">— {audiogramLabel}</span>
                )}
              </h2>
              <div className="flex items-center gap-4 text-xs text-[#4A4A4A]">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <circle cx="7" cy="7" r="5" fill="white" stroke="#DC2626" strokeWidth="2" />
                  </svg>
                  Right ear
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <line x1="2" y1="2" x2="12" y2="12" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="2" x2="2" y2="12" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Left ear
                </span>
              </div>
            </div>

            {snapshotLoading ? (
              <div className="h-64 flex items-center justify-center text-sm text-[#4A4A4A]">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 10, right: 60, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE8F4" />

                  {SEVERITY_BANDS.map(band => (
                    <ReferenceArea
                      key={band.label}
                      y1={band.min}
                      y2={band.max}
                      fill={band.color}
                      fillOpacity={0.6}
                      ifOverflow="hidden"
                    />
                  ))}

                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={[-0.5, 7.5]}
                    ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
                    tickFormatter={(v) => FREQ_LABELS[FREQUENCIES[v]] || v}
                    tick={{ fontSize: 11, fill: "#4A4A4A" }}
                    label={{ value: "Frequency (Hz)", position: "insideBottom", offset: -15, fontSize: 11, fill: "#4A4A4A" }}
                  />

                  <YAxis
                    dataKey="y"
                    type="number"
                    domain={[DB_MAX, DB_MIN]}
                    ticks={[-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]}
                    tick={{ fontSize: 11, fill: "#4A4A4A" }}
                    label={{ value: "dB HL", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#4A4A4A" }}
                    reversed
                  />

                  <Tooltip content={<AudiogramTooltip />} />

                  <Scatter
                    name="Right Ear"
                    data={rightChartData}
                    shape={<RightEarDot />}
                    line={{ stroke: "#DC2626", strokeWidth: 1.5 }}
                    lineType="joint"
                  />

                  <Scatter
                    name="Left Ear"
                    data={leftChartData}
                    shape={<LeftEarDot />}
                    line={{ stroke: "#2563EB", strokeWidth: 1.5 }}
                    lineType="joint"
                  />

                  {SEVERITY_BANDS.map(band => (
                    <ReferenceLine
                      key={`label-${band.label}`}
                      y={(band.min + band.max) / 2}
                      stroke="transparent"
                      label={{ value: band.label, position: "right", fontSize: 9, fill: "#9E9E9E" }}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Data entry panel */}
          <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-[#1A1028]">Enter Thresholds</h2>

            {/* Ear selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-[#1A1028]">Ear:</span>
              <button
                onClick={() => setActiveEar("right")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  activeEar === "right"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-[#4A4A4A] border-[var(--modal-border)] hover:border-red-300"
                }`}
                aria-pressed={activeEar === "right"}
              >
                Right (O)
              </button>
              <button
                onClick={() => setActiveEar("left")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  activeEar === "left"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-[#4A4A4A] border-[var(--modal-border)] hover:border-blue-300"
                }`}
                aria-pressed={activeEar === "left"}
              >
                Left (X)
              </button>
            </div>

            {/* Frequency selector */}
            <div className="space-y-2">
              <Label>Frequency (Hz)</Label>
              <div className="flex flex-wrap gap-2">
                {FREQUENCIES.map(freq => {
                  const alreadyPlotted = activeEar === "right"
                    ? rightPoints.some(p => p.freq === freq)
                    : leftPoints.some(p => p.freq === freq);
                  const isActive = activeFreq === freq;
                  return (
                    <button
                      key={freq}
                      onClick={() => setActiveFreq(freq)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all relative ${
                        isActive
                          ? "bg-[#400070] text-white border-[#400070]"
                          : alreadyPlotted
                          ? "bg-[#EADDF5] text-[#400070] border-[#C4A8E0]"
                          : "bg-white text-[#4A4A4A] border-[var(--modal-border)] hover:border-[#6B2FB9]"
                      }`}
                      aria-pressed={isActive}
                      aria-label={`${FREQ_LABELS[freq]} Hz${alreadyPlotted ? " (plotted)" : ""}`}
                    >
                      {FREQ_LABELS[freq]}
                      {alreadyPlotted && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#6B2FB9]" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#4A4A4A]">
                Purple dot = already plotted for this ear. Select to overwrite.
              </p>
            </div>

            {/* dB input + plot button */}
            <div className="flex items-end gap-3 flex-wrap">
              <div className="space-y-1.5">
                <Label htmlFor="db-input">
                  Threshold (dB HL){" "}
                  <span className="text-[10px] font-normal text-[#4A4A4A]">−10 to 120, step 5</span>
                </Label>
                <Input
                  id="db-input"
                  type="number"
                  min={DB_MIN}
                  max={DB_MAX}
                  step={5}
                  value={dbInput}
                  onChange={e => setDbInput(Number(e.target.value))}
                  className="w-28"
                  aria-label="dB HL threshold value"
                />
              </div>
              <button
                onClick={handlePlotPoint}
                disabled={activeFreq === null}
                className="inline-flex items-center gap-2 bg-[#400070] hover:bg-[#6B2FB9] text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={activeFreq ? `Plot ${FREQ_LABELS[activeFreq]} Hz at ${dbInput} dB` : "Select a frequency first"}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                {activeFreq ? `Plot ${FREQ_LABELS[activeFreq]} Hz` : "Select a frequency"}
              </button>
            </div>

            {/* Plotted points summary */}
            {hasAnyPoints && (
              <div className="space-y-3 pt-2">
                {rightPoints.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                        <circle cx="6" cy="6" r="4" fill="white" stroke="#DC2626" strokeWidth="2" />
                      </svg>
                      Right ear
                      {getSeverityLabel(rightPoints) && (
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-normal text-[10px]">
                          ~{getSeverityLabel(rightPoints)}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rightPoints.map(p => (
                        <span key={p.freq} className="inline-flex items-center gap-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg px-2.5 py-1">
                          {FREQ_LABELS[p.freq]} Hz: {p.db} dB
                          <button
                            onClick={() => handleRemovePoint("right", p.freq)}
                            className="ml-0.5 text-red-400 hover:text-red-700 transition-colors"
                            aria-label={`Remove right ear ${FREQ_LABELS[p.freq]} Hz`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {leftPoints.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                        <line x1="2" y1="2" x2="10" y2="10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                        <line x1="10" y1="2" x2="2" y2="10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Left ear
                      {getSeverityLabel(leftPoints) && (
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-normal text-[10px]">
                          ~{getSeverityLabel(leftPoints)}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {leftPoints.map(p => (
                        <span key={p.freq} className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1">
                          {FREQ_LABELS[p.freq]} Hz: {p.db} dB
                          <button
                            onClick={() => handleRemovePoint("left", p.freq)}
                            className="ml-0.5 text-blue-400 hover:text-blue-700 transition-colors"
                            aria-label={`Remove left ear ${FREQ_LABELS[p.freq]} Hz`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="bg-white rounded-2xl border border-[var(--modal-border)] p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleClearAll}
                disabled={!hasAnyPoints}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A4A4A] border border-[var(--modal-border)] rounded-xl px-4 py-2.5 hover:bg-[#F7F3FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Clear All
              </button>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-sm font-medium text-green-700" role="status">✓ Saved to student profile</span>
                )}
                {saveMutation.isError && (
                  <span className="text-sm font-medium text-red-600" role="alert">Save failed — please try again</span>
                )}
                {hasUnsaved && !saveSuccess && (
                  <span className="text-xs text-amber-700">Unsaved changes</span>
                )}
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={!hasAnyPoints || saveMutation.isPending || isDemoMode}
                  className="inline-flex items-center gap-2 bg-[#400070] hover:bg-[#6B2FB9] text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Save audiogram to student profile"
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  {saveMutation.isPending ? "Saving…" : "Save to Profile"}
                </button>
              </div>
            </div>
            {isDemoMode && (
              <p className="text-xs text-[#4A4A4A] mt-2 text-right">Saving is disabled in demo mode.</p>
            )}
          </div>

          {/* Where to find it */}
          <div className="flex gap-3 bg-[#F3EBF9] border border-[#C4A8E0] rounded-xl p-4">
            <Info className="w-5 h-5 text-[#6B2FB9] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-[#1A1028]">
              <span className="font-semibold">To view this audiogram on a student's profile: </span>
              open the student → Audiology tab. Saved threshold data is stored there.
            </p>
          </div>
        </>
      )}

      {/* Footer disclaimer */}
      <p className="text-xs text-[#4A4A4A] text-center pb-4">
        Educational reference tool only · Not diagnostic · No medical documents stored ·
        Follow district/state FERPA and data privacy procedures
      </p>

    </div>
  );
}