import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { addMinutes, eachDayOfInterval, isSameDay, parseISO, format, addDays } from "date-fns";
import { Sparkles, X, Calendar, Loader2, AlertTriangle, Check } from "lucide-react";

// ─── Pure scheduling functions ────────────────────────────────────────────────

/**
 * Greedy slot finder for a single student within a time window on a given day.
 * Returns { start: Date, end: Date } or null.
 */
function findOpenSlot(day, window, durationMinutes, existingEvents, travelBufferMinutes) {
  const [sh, sm] = window.start.split(":").map(Number);
  const [eh, em] = window.end.split(":").map(Number);

  let cursor = new Date(day);
  cursor.setHours(sh, sm, 0, 0);
  const windowEnd = new Date(day);
  windowEnd.setHours(eh, em, 0, 0);

  const sorted = [...existingEvents].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
  const bufMs = travelBufferMinutes * 60000;

  while (cursor < windowEnd) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    if (slotEnd > windowEnd) break;

    const conflict = sorted.find(e => {
      const eStart = new Date(e.startDateTime).getTime();
      const eEnd = new Date(e.endDateTime).getTime();
      return cursor.getTime() < eEnd + bufMs && slotEnd.getTime() > eStart - bufMs;
    });

    if (!conflict) return { start: cursor, end: slotEnd };

    // Jump past the conflicting event + travel buffer
    cursor = new Date(new Date(conflict.endDateTime).getTime() + bufMs);
  }

  return null;
}

/**
 * Deterministic greedy scheduler. Groups students by locationId per day.
 * Returns an array of proposed slot objects (not yet persisted).
 */
function buildSchedule(selectedStudents, committedEvents, startDate, endDate, travelBuffer, workingHours) {
  const proposed = [];
  const wStart = workingHours?.start || "08:00";
  const wEnd = workingHours?.end || "15:30";

  eachDayOfInterval({ start: startDate, end: endDate }).forEach(day => {
    const dow = day.getDay();
    if (dow === 0 || dow === 6) return; // skip weekends

    // Group students by locationId for travel-efficient batching
    const byLocation = {};
    selectedStudents.forEach(s => {
      const loc = s.locationId || "unassigned";
      if (!byLocation[loc]) byLocation[loc] = [];
      byLocation[loc].push(s);
    });

    const dayPlaced = committedEvents.filter(e => isSameDay(parseISO(e.startDateTime), day));

    Object.entries(byLocation).forEach(([locationId, students]) => {
      students.forEach(student => {
        // Respect student availability windows; fall back to teacher working hours
        const windows = student.availabilityWindows?.[dow];
        const availWindow = windows?.length > 0 ? windows[0] : { start: wStart, end: wEnd };

        const sessionDuration = student.directMinutes || 30;
        const slot = findOpenSlot(day, availWindow, sessionDuration, dayPlaced, travelBuffer);

        if (slot) {
          const entry = {
            startDateTime: slot.start.toISOString(),
            endDateTime: slot.end.toISOString(),
            _studentId: student.id,
            _studentInitials: student.studentInitials || "??",
            _locationId: locationId,
          };
          proposed.push(entry);
          // Treat placed slot as committed for subsequent students on the same day
          dayPlaced.push({ startDateTime: slot.start.toISOString(), endDateTime: slot.end.toISOString(), setting: "InPerson" });
        }
      });
    });
  });

  return proposed;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SchedulerEngine({ students, committedEvents, currentUser, onClose, onFinalized }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 4), "yyyy-MM-dd"));
  const [proposed, setProposed] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const travelBuffer = currentUser?.globalTravelBuffer || 15;
  const workingHours = currentUser?.workingHours || { start: "08:00", end: "15:30" };

  const toggleStudent = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleGenerate = () => {
    const selected = students.filter(s => selectedIds.includes(s.id));
    const slots = buildSchedule(
      selected,
      committedEvents,
      new Date(startDate + "T00:00:00"),
      new Date(endDate + "T23:59:59"),
      travelBuffer,
      workingHours
    );
    setProposed(slots);
    setHasGenerated(true);
  };

  // AI optimization: anonymized payload — NO student names or identifiable data
  const handleAIOptimize = async () => {
    if (proposed.length === 0) return;
    setIsAiLoading(true);
    try {
      const anonymized = proposed.map((slot, i) => ({
        ref: `S${i + 1}`,
        locationId: slot._locationId,          // location zone only
        sessionDurationMin: Math.round((new Date(slot.endDateTime) - new Date(slot.startDateTime)) / 60000),
        proposedStart: slot.startDateTime,
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a travel optimizer for an itinerant teacher scheduler. Reorder these sessions to minimize travel between different locationIds. Sessions at the same locationId should be grouped on the same day where possible. Travel buffer between sessions: ${travelBuffer} minutes. Return the refs in optimal order.

Sessions: ${JSON.stringify(anonymized)}`,
        response_json_schema: {
          type: "object",
          properties: {
            order: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (result?.order?.length === proposed.length) {
        const refMap = {};
        proposed.forEach((slot, i) => { refMap[`S${i + 1}`] = slot; });
        const reordered = result.order.map(ref => refMap[ref]).filter(Boolean);
        if (reordered.length === proposed.length) setProposed(reordered);
      }
    } catch (e) {
      console.error("AI Optimize error:", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (proposed.length === 0) return;
    setIsFinalizing(true);
    try {
      const events = proposed.map(slot => ({
        title: `Direct Service — ${slot._studentInitials}`,
        eventType: "DirectService",
        startDateTime: slot.startDateTime,
        endDateTime: slot.endDateTime,
        studentId: slot._studentId,
        studentInitials: slot._studentInitials,
        locationLabel: slot._locationId !== "unassigned" ? slot._locationId : undefined,
        setting: "InPerson",
        isDraft: false,
      }));
      await base44.entities.CalendarEvent.bulkCreate(events);
      onFinalized?.();
      onClose();
    } catch (e) {
      console.error("Finalize error:", e);
    } finally {
      setIsFinalizing(false);
    }
  };

  const removeSlot = (i) => setProposed(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* BETA Warning Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            BETA: Automated slots are suggestions. Verify against IEP requirements before finalizing.
          </p>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--modal-border)]">
          <div>
            <h2 className="font-bold text-[#400070] text-lg">Intelligent Scheduler</h2>
            <p className="text-xs text-[var(--modal-text-muted)]">
              Travel buffer: {travelBuffer} min · Working hours: {workingHours.start}–{workingHours.end}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--modal-text-muted)] mb-1 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-[var(--modal-border)] rounded-lg px-3 py-2 text-sm text-[var(--modal-text)]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--modal-text-muted)] mb-1 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-[var(--modal-border)] rounded-lg px-3 py-2 text-sm text-[var(--modal-text)]"
              />
            </div>
          </div>

          {/* Student Selection */}
          <div>
            <label className="text-xs font-semibold text-[var(--modal-text-muted)] mb-2 block">
              Select Students <span className="text-[#400070]">({selectedIds.length} selected)</span>
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1 border border-[var(--modal-border)] rounded-xl p-2">
              {students.length === 0 && (
                <p className="text-xs text-[var(--modal-text-muted)] p-2 text-center">No students found.</p>
              )}
              {students.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    selectedIds.includes(s.id)
                      ? "bg-[#EADDF5] text-[#400070] font-semibold"
                      : "hover:bg-gray-50 text-[var(--modal-text)]"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    selectedIds.includes(s.id) ? "bg-[#400070] border-[#400070]" : "border-gray-300"
                  }`}>
                    {selectedIds.includes(s.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="flex-1">{s.studentInitials || "—"}</span>
                  {s.locationId && (
                    <span className="text-xs text-[var(--modal-text-muted)] bg-gray-100 px-1.5 py-0.5 rounded">
                      {s.locationId}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={selectedIds.length === 0}
            className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white gap-2"
          >
            <Calendar className="w-4 h-4" />
            Generate Schedule
          </Button>

          {/* Proposed Slots */}
          {hasGenerated && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[var(--modal-text)]">
                  {proposed.length === 0
                    ? "No available slots found in this range."
                    : `${proposed.length} slot${proposed.length !== 1 ? "s" : ""} proposed`}
                </p>
                {proposed.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIOptimize}
                    disabled={isAiLoading}
                    className="gap-1.5 text-[#400070] border-[#400070]/30 text-xs h-7 px-2"
                  >
                    {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Optimize
                  </Button>
                )}
              </div>

              {proposed.length > 0 && (
                <>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {proposed.map((slot, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#F7F3FA] rounded-xl px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#400070]">{slot._studentInitials}</p>
                          <p className="text-xs text-[var(--modal-text-muted)]">
                            {format(parseISO(slot.startDateTime), "EEE MMM d")}
                            {" · "}
                            {format(parseISO(slot.startDateTime), "h:mm a")}–{format(parseISO(slot.endDateTime), "h:mm a")}
                            {slot._locationId !== "unassigned" && ` · ${slot._locationId}`}
                          </p>
                        </div>
                        <button onClick={() => removeSlot(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0 p-0.5">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleFinalize}
                    disabled={isFinalizing}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Finalize Schedule ({proposed.length} events)
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}