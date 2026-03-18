/**
 * SchedulerPanel — UI shell for the Intelligent Scheduler Beta.
 * Drives SchedulerEngine pure functions; handles save/finalize lifecycle.
 */

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Sparkles, CheckCircle2, X, Loader2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { runGreedySchedule, runAIOptimize } from "./SchedulerEngine";

export default function SchedulerPanel({ students, committedEvents, currentUser, onClose }) {
  const qc = useQueryClient();

  const [startDate, setStartDate]           = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate]               = useState(format(new Date(Date.now() + 6 * 86400000), "yyyy-MM-dd"));
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedIds, setSelectedIds]       = useState([]);
  const [drafts, setDrafts]                 = useState([]);
  const [savedDraftIds, setSavedDraftIds]   = useState([]);
  const [generating, setGenerating]         = useState(false);
  const [aiOptimizing, setAIOptimizing]     = useState(false);
  const [finalizing, setFinalizing]         = useState(false);

  const travelBuffer  = currentUser?.globalTravelBuffer || 0;
  const workingHours  = currentUser?.workingHours;

  // ── Generate (deterministic greedy) ─────────────────────────────────────
  const handleGenerate = () => {
    setGenerating(true);
    const selected = students.filter(s => selectedIds.includes(s.id));
    const result   = runGreedySchedule({
      students: selected,
      dateRange: { startDate, endDate },
      committedEvents,
      workingHours,
      travelBuffer,
      durationMinutes,
    });
    setDrafts(result);
    setSavedDraftIds([]);
    setGenerating(false);
  };

  // ── AI Optimize (explicit opt-in only) ──────────────────────────────────
  const handleAIOptimize = async () => {
    setAIOptimizing(true);
    const optimized = await runAIOptimize({ drafts, travelBuffer });
    setDrafts(optimized);
    setAIOptimizing(false);
  };

  // ── Save drafts to DB (isDraft: true) ────────────────────────────────────
  const handleSaveDrafts = async () => {
    if (!drafts.length) return;
    const saved = await base44.entities.CalendarEvent.bulkCreate(drafts);
    qc.invalidateQueries({ queryKey: ["calendarEvents"] });
    setSavedDraftIds((saved || []).map(e => e.id));
    setDrafts([]);
  };

  // ── Finalize: flip isDraft → false ───────────────────────────────────────
  const handleFinalize = async () => {
    setFinalizing(true);
    await Promise.all(
      savedDraftIds.map(id => base44.entities.CalendarEvent.update(id, { isDraft: false }))
    );
    qc.invalidateQueries({ queryKey: ["calendarEvents"] });
    setSavedDraftIds([]);
    setFinalizing(false);
    onClose();
  };

  const toggleStudent = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-40 flex flex-col border-l border-[var(--modal-border)]">

      {/* BETA warning banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 font-medium leading-snug">
          BETA: Automated slots are suggestions. Verify against IEP requirements before finalizing.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--modal-border)]">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#400070]" />
          <h2 className="font-bold text-[#400070] text-base">Intelligent Scheduler</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Date range */}
        <div>
          <label className="text-xs font-bold text-gray-600 mb-1.5 block">Date Range</label>
          <div className="flex items-center gap-2">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 text-sm h-9" />
            <span className="text-gray-400 text-sm">–</span>
            <Input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)}   className="flex-1 text-sm h-9" />
          </div>
        </div>

        {/* Session duration */}
        <div>
          <label className="text-xs font-bold text-gray-600 mb-1.5 block">Session Duration (min)</label>
          <Input
            type="number" min={15} step={15}
            value={durationMinutes}
            onChange={e => setDurationMinutes(Number(e.target.value))}
            className="w-28 text-sm h-9"
          />
        </div>

        {/* Travel buffer info */}
        {travelBuffer > 0 && (
          <div className="text-xs text-[#6B2FB9] bg-[#F7F3FA] rounded-lg px-3 py-2">
            Travel buffer: <span className="font-semibold">{travelBuffer} min</span> (from your profile)
          </div>
        )}

        {/* Student picker */}
        <div>
          <label className="text-xs font-bold text-gray-600 mb-1.5 block">
            Students <span className="font-normal text-gray-400">({selectedIds.length} selected)</span>
          </label>
          <div className="max-h-44 overflow-y-auto border border-[var(--modal-border)] rounded-xl divide-y divide-[var(--modal-border)]">
            {students.length === 0 && (
              <p className="text-xs text-gray-400 p-3">No students found.</p>
            )}
            {students.map(s => (
              <label key={s.id} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-[#F7F3FA]">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(s.id)}
                  onChange={() => toggleStudent(s.id)}
                  className="accent-[#400070]"
                />
                <span className="text-sm text-gray-700 font-medium">{s.studentInitials}</span>
                {s.locationId && (
                  <span className="text-xs text-gray-400 ml-auto">@ {s.locationId}</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={generating || selectedIds.length === 0}
          className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white gap-2"
        >
          {generating
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <CalendarDays className="w-4 h-4" />}
          Generate Schedule
        </Button>

        {/* Draft results */}
        {drafts.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-600">{drafts.length} draft slot(s) generated</p>

            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {drafts.map((d, i) => (
                <div key={i} className="border border-dashed border-[#6B2FB9]/60 rounded-lg px-3 py-2 bg-purple-50 text-xs">
                  <p className="font-semibold text-[#400070]">{d.studentInitials}</p>
                  <p className="text-gray-500">
                    {format(new Date(d.startDateTime), "EEE MMM d")} · {format(new Date(d.startDateTime), "h:mm a")}–{format(new Date(d.endDateTime), "h:mm a")}
                  </p>
                  {d.locationLabel && <p className="text-gray-400">@ {d.locationLabel}</p>}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {/* AI Optimize — explicit click only, never auto-triggered */}
              <Button
                onClick={handleAIOptimize}
                disabled={aiOptimizing}
                variant="outline"
                className="flex-1 text-[#400070] border-[#400070]/30 gap-1.5 text-sm"
              >
                {aiOptimizing
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Sparkles className="w-3.5 h-3.5" />}
                AI Optimize
              </Button>
              <Button onClick={handleSaveDrafts} className="flex-1 bg-[#400070] hover:bg-[#5B00A0] text-white text-sm">
                Save Drafts
              </Button>
            </div>
          </div>
        )}

        {/* Finalize panel */}
        {savedDraftIds.length > 0 && (
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-800">
                {savedDraftIds.length} draft event(s) saved
              </p>
            </div>
            <p className="text-xs text-green-700">
              These appear in your calendar with dashed borders. Review them, then finalize when ready.
            </p>
            <Button
              onClick={handleFinalize}
              disabled={finalizing}
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              {finalizing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle2 className="w-4 h-4" />}
              Finalize Schedule
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}