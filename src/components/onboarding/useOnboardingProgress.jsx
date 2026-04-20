/**
 * Call this hook on pages to auto-mark onboarding steps as completed
 * when the user performs the relevant action.
 *
 * Usage: useOnboardingProgress("assign_goal")  — marks step on mount
 */
import { useEffect } from "react";
import { markStepComplete } from "./OnboardingChecklist";

export default function useOnboardingProgress(stepId) {
  useEffect(() => {
    if (stepId) markStepComplete(stepId);
  }, [stepId]);
}