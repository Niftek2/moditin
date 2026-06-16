import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, Circle } from "lucide-react";

const STORAGE_KEY = "modal_appstore_guide_progress_v1";

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

export function useGuideProgress(totalSteps) {
  const [progress, setProgress] = useState(loadProgress);
  const toggle = (id) => {
    setProgress((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveProgress(next);
      return next;
    });
  };
  const completed = Object.values(progress).filter(Boolean).length;
  return { progress, toggle, completed };
}

export default function PhaseSection({ phase, progress, onToggle, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const doneCount = phase.steps.filter((s) => progress[s.id]).length;
  const allDone = doneCount === phase.steps.length;

  return (
    <div className="modal-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-[var(--modal-card-hover)] transition-colors"
      >
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-base ${
            allDone ? "bg-[#400070] text-white" : "bg-[#EADDF5] text-[#400070]"
          }`}
        >
          {allDone ? <CheckCircle2 className="w-6 h-6" /> : phase.number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#1A1028] font-bold leading-tight">{phase.title}</h3>
          <p className="text-sm text-[var(--modal-text-muted)] mt-0.5">{phase.summary}</p>
        </div>
        <span className="text-xs font-semibold text-[#6B2FB9] whitespace-nowrap mr-1">
          {doneCount}/{phase.steps.length}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[#6B2FB9] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-[var(--modal-border)] pt-4">
              {phase.steps.map((step) => (
                <StepRow key={step.id} step={step} checked={!!progress[step.id]} onToggle={() => onToggle(step.id)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepRow({ step, checked, onToggle }) {
  return (
    <div className="flex gap-3">
      <button onClick={onToggle} className="mt-0.5 shrink-0" aria-label="Toggle step">
        {checked ? (
          <CheckCircle2 className="w-5 h-5 text-[#400070]" />
        ) : (
          <Circle className="w-5 h-5 text-[#C4A8E0]" />
        )}
      </button>
      <div className={`flex-1 ${checked ? "opacity-50" : ""}`}>
        <p className="text-[#1A1028] text-sm font-medium leading-snug">{step.text}</p>
        {step.detail && (
          <p className="text-sm text-[var(--modal-text-muted)] mt-1 leading-relaxed">{step.detail}</p>
        )}
        {step.code && (
          <code className="block mt-1.5 text-xs bg-[#F3EBF9] text-[#400070] rounded-lg px-3 py-2 font-mono break-all">
            {step.code}
          </code>
        )}
        {step.warn && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1.5 leading-relaxed">
            ⚠️ {step.warn}
          </p>
        )}
      </div>
    </div>
  );
}