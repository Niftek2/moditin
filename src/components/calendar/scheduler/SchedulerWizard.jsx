/**
 * SchedulerWizard — full-screen multi-step wizard for master schedule generation.
 * Steps:
 *   1. Select Students
 *   2. Student Availability (per-student weekly grids)
 *   3. Locations & Travel Times
 *   4. Your Schedule (teacher settings + blocked times)
 *   5. Generated Results
 */
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, addMonths } from "date-fns";
import { X, ChevronLeft, ChevronRight, AlertTriangle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

import Step1SelectStudents from "./Step1SelectStudents";
import Step2StudentAvailability from "./Step2StudentAvailability";
import Step3LocationTravel from "./Step3LocationTravel";
import Step4TeacherSettings from "./Step4TeacherSettings";
import Step5Results from "./Step5Results";
import { runGreedySchedule, runAIOptimize } from "./SchedulerEngine";

const STEPS = [
  { label: "Students", short: "1" },
  { label: "Availability", short: "2" },
  { label: "Travel", short: "3" },
  { label: "My Schedule", short: "4" },
  { label: "Results", short: "5" },
];

export default function SchedulerWizard({ students, committedEvents, currentUser, onClose }) {
  const qc = useQueryClient();

  // Step
  const [step, setStep] = useState(0);

  // Step 1: student selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Step 2: per-student availability (Set<"dayNum-HH:mm">)
  const [studentAvailability, setStudentAvailability] = useState({});

  // Step 3: location travel ({"locA|locB": minutes})
  const [locationTravel, setLocationTravel] = useState({});

  // Step 4: teacher settings
  const [workingHours, setWorkingHours] = useState({ start: "08:00", end: "16:00" });
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5]);
  const [teacherBlocked, setTeacherBlocked] = useState(new Set());
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addMonths(new Date(), 2), "yyyy-MM-dd"),
  });
  const [durationMinutes, setDurationMinutes] = useState(30);

  // Step 5: results
  const [drafts, setDrafts] = useState([]);
  const [savedDraftIds, setSavedDraftIds] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [aiOptimizing, setAIOptimizing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const selectedStudents = students.filter(s => selectedIds.includes(s.id));

  // ── Validation ───────────────────────────────────────────────────────────
  const canProceed = () => {
    if (step === 0) return selectedIds.length > 0;
    return true;
  };

  // ── Navigation ───────────────────────────────────────────────────────────
  const next = () => {
    if (step === 3) {
      // Trigger generation before going to results
      generate();
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setStep(s => Math.max(s - 1, 0));

  // ── Generate ─────────────────────────────────────────────────────────────
  const generate = () => {
    setGenerating(true);
    setDrafts([]);
    setSavedDraftIds([]);

    setTimeout(() => {
      const result = runGreedySchedule({
        students: selectedStudents,
        dateRange,
        committedEvents,
        workingHours,
        workingDays,
        travelMatrix: locationTravel,
        durationMinutes,
        studentAvailability,
        teacherBlockedSet: teacherBlocked,
      });
      setDrafts(result);
      setGenerating(false);
    }, 50);
  };

  const handleAIOptimize = async () => {
    setAIOptimizing(true);
    const optimized = await runAIOptimize({ drafts, travelMatrix: locationTravel });
    setDrafts(optimized);
    setAIOptimizing(false);
  };

  const handleSaveDrafts = async () => {
    if (!drafts.length) return;
    const saved = await base44.entities.CalendarEvent.bulkCreate(drafts);
    qc.invalidateQueries({ queryKey: ["calendarEvents"] });
    setSavedDraftIds((saved || []).map(e => e.id));
    setDrafts([]);
  };

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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative flex flex-col bg-white w-full max-w-2xl shadow-2xl border-l border-[var(--modal-border)] h-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Beta banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            BETA: Always verify generated sessions against current IEP requirements before committing.
          </p>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--modal-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#400070]" />
            <div>
              <h2 className="font-bold text-[#400070] text-base leading-tight">Master Schedule Wizard</h2>
              <p className="text-xs text-gray-400">{STEPS[step].label}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center px-5 py-3 gap-1 border-b border-[var(--modal-border)] flex-shrink-0">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i >= step && i !== 0}
                className={`flex items-center gap-1.5 transition-all ${i < step ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                    ? "bg-[#400070] text-white"
                    : "bg-gray-100 text-gray-400"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:inline transition-colors ${
                  i === step ? "text-[#400070]" : i < step ? "text-green-600" : "text-gray-300"
                }`}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded mx-1 transition-colors ${i < step ? "bg-green-300" : "bg-gray-100"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {step === 0 && (
            <Step1SelectStudents
              students={students}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )}
          {step === 1 && (
            <Step2StudentAvailability
              students={selectedStudents}
              studentAvailability={studentAvailability}
              onChange={setStudentAvailability}
            />
          )}
          {step === 2 && (
            <Step3LocationTravel
              students={selectedStudents}
              locationTravel={locationTravel}
              onChange={setLocationTravel}
            />
          )}
          {step === 3 && (
            <Step4TeacherSettings
              workingHours={workingHours}
              onWorkingHoursChange={setWorkingHours}
              workingDays={workingDays}
              onWorkingDaysChange={setWorkingDays}
              teacherBlocked={teacherBlocked}
              onTeacherBlockedChange={setTeacherBlocked}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              durationMinutes={durationMinutes}
              onDurationChange={setDurationMinutes}
            />
          )}
          {step === 4 && (
            <Step5Results
              drafts={drafts}
              students={selectedStudents}
              savedDraftIds={savedDraftIds}
              generating={generating}
              aiOptimizing={aiOptimizing}
              finalizing={finalizing}
              durationMinutes={durationMinutes}
              onAIOptimize={handleAIOptimize}
              onSaveDrafts={handleSaveDrafts}
              onFinalize={handleFinalize}
              onRegenerate={() => { setStep(3); }}
            />
          )}
        </div>

        {/* Footer nav */}
        {step < 4 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--modal-border)] flex-shrink-0">
            <Button
              onClick={prev}
              variant="outline"
              disabled={step === 0}
              className="gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            <div className="text-xs text-gray-400">
              Step {step + 1} of {STEPS.length}
            </div>

            <Button
              onClick={next}
              disabled={!canProceed()}
              className="gap-1.5 bg-[#400070] hover:bg-[#5B00A0] text-white"
            >
              {step === 3 ? "Generate Schedule" : "Next"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}