import React from "react";
import { Apple, RotateCcw } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import PhaseSection, { useGuideProgress } from "../components/appstoreguide/PhaseSection";
import { PHASES, TOTAL_STEPS } from "../components/appstoreguide/guideData";
import { Button } from "@/components/ui/button";

export default function AppStoreGuidePage() {
  const { progress, toggle, completed } = useGuideProgress(TOTAL_STEPS);
  const pct = Math.round((completed / TOTAL_STEPS) * 100);

  const reset = () => {
    if (!window.confirm("Reset all checked steps?")) return;
    try { localStorage.removeItem("modal_appstore_guide_progress_v1"); } catch {}
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="App Store Submission Guide"
        subtitle="A phase-by-phase checklist to get Modal Itinerant approved on the first try."
        action={
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        }
      />

      {/* Progress banner */}
      <div className="modal-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#400070] flex items-center justify-center shrink-0">
            <Apple className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-[#1A1028]">
                {completed} of {TOTAL_STEPS} steps complete
              </span>
              <span className="text-sm font-bold text-[#6B2FB9]">{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#EADDF5] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#400070] to-[#6B2FB9] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {PHASES.map((phase, i) => (
          <PhaseSection
            key={phase.number}
            phase={phase}
            progress={progress}
            onToggle={toggle}
            defaultOpen={i === 0}
          />
        ))}
      </div>

      <p className="text-xs text-center text-[var(--modal-text-muted)] pb-4">
        Reference: Apple App Review Guidelines (3.1.1 external payments, 4.0 functionality, 5.1.1 privacy, 2.1 crashes, 1.2 Kids category).
      </p>
    </div>
  );
}