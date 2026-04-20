import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "modal_onboarding_v1";
const DISMISSED_KEY = "modal_onboarding_dismissed_v1";

export const ONBOARDING_STEPS = [
  {
    id: "add_student",
    title: "Add your first student",
    description: "This is where everything starts. Create a profile for one of your students using their initials only — no full names needed. Once they're added, you can attach goals, track service time, and manage their equipment all in one place.",
    tip: "Use initials like \"A.B.\" — the app is designed to keep student data private.",
    action: { label: "Go to Students →", to: createPageUrl("Students") },
    icon: "👤",
  },
  {
    id: "set_iep_dates",
    title: "Enter IEP dates for a student",
    description: "Open a student's profile and scroll to the IEP section. Enter their IEP start date and annual review date. The app will automatically remind you before key deadlines.",
    tip: "You can find this in the student profile under the 'IEP' tab.",
    action: { label: "Go to Students →", to: createPageUrl("Students") },
    icon: "📅",
  },
  {
    id: "assign_goal",
    title: "Assign an IEP goal",
    description: "Head to the Goal Bank to browse ready-made SMART goals for Deaf/Hard of Hearing students, or use the AI Goal Creator to generate one. Then assign it directly to a student.",
    tip: "Goals are organized by domain (e.g., Auditory Skills, Self-Advocacy) and grade band.",
    action: { label: "Open Goal Bank →", to: createPageUrl("GoalBank") },
    icon: "🎯",
  },
  {
    id: "log_session",
    title: "Log your first service session",
    description: "Go to Service Hours and record the time you spent with a student. You can use the built-in timer during a session, or enter the minutes manually afterward. This builds your monthly service log automatically.",
    tip: "Select a student and category (e.g., Direct Service) before starting the timer.",
    action: { label: "Go to Service Hours →", to: createPageUrl("ServiceHours") },
    icon: "⏱️",
  },
  {
    id: "explore_calendar",
    title: "Schedule a session on the calendar",
    description: "Open the Calendar and tap any time slot to add a session. You can assign it to a student, set the session type, and choose in-person or telepractice. This helps you plan your week and track what's been scheduled vs. completed.",
    tip: "Use the Day view to see your full schedule at a glance.",
    action: { label: "Open Calendar →", to: createPageUrl("Calendar") },
    icon: "📆",
  },
];

export function getCompletedSteps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function markStepComplete(stepId) {
  try {
    const current = getCompletedSteps();
    if (!current.includes(stepId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, stepId]));
    }
  } catch {}
}

export function resetOnboarding() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DISMISSED_KEY);
  } catch {}
}

export function isOnboardingDismissed() {
  try { return localStorage.getItem(DISMISSED_KEY) === "1"; } catch { return false; }
}

export function shouldShowOnboarding(studentCount) {
  if (isOnboardingDismissed()) return false;
  const completed = getCompletedSteps();
  return completed.length < ONBOARDING_STEPS.length;
}

export default function OnboardingChecklist() {
  const [completed, setCompleted] = useState(getCompletedSteps);
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(isOnboardingDismissed);
  const [visible, setVisible] = useState(false);

  // Auto-mark "add_student" by checking if user has any students
  useEffect(() => {
    if (completed.includes("add_student")) return;
    base44.auth.me().then(user => {
      if (!user) return;
      base44.entities.Student.filter({ created_by: user.email }, null, 1).then(students => {
        if (students.length > 0) {
          const updated = [...getCompletedSteps(), "add_student"];
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(updated)]));
          setCompleted([...new Set(updated)]);
        }
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  // Show after a short delay
  useEffect(() => {
    if (!dismissed && completed.length < ONBOARDING_STEPS.length) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [dismissed]);

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch {}
    setDismissed(true);
    setVisible(false);
  };

  const allDone = completed.length >= ONBOARDING_STEPS.length;

  // Auto-hide when all done (after a brief celebration)
  useEffect(() => {
    if (allDone && visible) {
      const t = setTimeout(() => {
        try { localStorage.setItem(DISMISSED_KEY, "1"); } catch {}
        setVisible(false);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [allDone, visible]);

  if (!visible) return null;

  const progress = Math.round((completed.length / ONBOARDING_STEPS.length) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-88 shadow-2xl rounded-2xl overflow-hidden border border-[var(--modal-border)]"
        style={{ width: "360px" }}
        style={{ boxShadow: "0 8px 40px rgba(64,0,112,0.18)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
          style={{ background: "linear-gradient(135deg, #400070 0%, #6B2FB9 100%)" }}
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">Setup Guide</p>
              <p className="text-purple-200 text-xs">
                {allDone ? "All done! 🎉" : `${completed.length} of ${ONBOARDING_STEPS.length} steps done — tap to expand`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-4 h-4 text-white/70" /> : <ChevronUp className="w-4 h-4 text-white/70" />}
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className="text-white/50 hover:text-white transition-colors p-0.5"
              aria-label="Dismiss checklist"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-purple-900/30" style={{ background: "#2d0060" }}>
          <motion.div
            className="h-full bg-yellow-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Steps */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="bg-white overflow-hidden"
            >
              {allDone ? (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="font-bold text-[#400070] text-base">You're all set!</p>
                  <p className="text-sm text-[var(--modal-text-muted)] mt-1 leading-snug">You've completed every setup step. You're ready to use Modal Itinerant!</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--modal-border)] max-h-[70vh] overflow-y-auto">
                  {ONBOARDING_STEPS.map((step, idx) => {
                    const isDone = completed.includes(step.id);
                    const isNext = !isDone && ONBOARDING_STEPS.slice(0, idx).every(s => completed.includes(s.id));
                    return (
                      <div
                        key={step.id}
                        className={`flex items-start gap-3 px-4 py-4 transition-colors ${isNext ? "bg-[#F7F3FA]" : isDone ? "bg-white opacity-60" : "bg-white"}`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isDone
                            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                            : <Circle className={`w-5 h-5 ${isNext ? "text-[#6B2FB9]" : "text-gray-300"}`} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-base">{step.icon}</span>
                            <p className={`text-sm font-bold leading-tight ${isDone ? "line-through text-[var(--modal-text-muted)]" : "text-[var(--modal-text)]"}`}>
                              Step {idx + 1}: {step.title}
                            </p>
                          </div>
                          {!isDone && (
                            <>
                              <p className="text-xs text-[var(--modal-text-muted)] mt-1 leading-relaxed">{step.description}</p>
                              {step.tip && (
                                <div className="flex items-start gap-1.5 mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                                  <span className="text-xs">💡</span>
                                  <p className="text-xs text-yellow-800 leading-snug">{step.tip}</p>
                                </div>
                              )}
                              <Link
                                to={step.action.to}
                                className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                  isNext
                                    ? "bg-[#400070] text-white hover:bg-[#5B00A0]"
                                    : "text-[#400070] hover:text-[#5B00A0]"
                                }`}
                              >
                                {step.action.label}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}