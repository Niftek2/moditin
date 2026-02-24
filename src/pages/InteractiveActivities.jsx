import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import ActivitySetupScreen from "../components/interactive/ActivitySetupScreen";
import ActivityDirectionsScreen from "../components/interactive/ActivityDirectionsScreen";
import ActivityPlayerScreen from "../components/interactive/ActivityPlayerScreen";
import ActivitySummaryScreen from "../components/interactive/ActivitySummaryScreen";
import DeafCultureActivityGenerator from "../components/goalbank/DeafCultureActivityGenerator";

const STEPS = { SETUP: "setup", DIRECTIONS: "directions", PLAYING: "playing", SUMMARY: "summary" };

export default function InteractiveActivitiesPage() {
  const [step, setStep] = useState(STEPS.SETUP);
  const [showDeafCultureGen, setShowDeafCultureGen] = useState(false);
  const [activityConfig, setActivityConfig] = useState(null);
  const [completedResponses, setCompletedResponses] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(0);

  const handleActivityGenerated = (config) => {
    setActivityConfig(config);
    setStep(STEPS.DIRECTIONS);
  };

  const handleDirectionsComplete = () => {
    setStep(STEPS.PLAYING);
  };

  const handlePlayerComplete = (responses, duration) => {
    setCompletedResponses(responses);
    setDurationMinutes(duration);
    setStep(STEPS.SUMMARY);
  };

  const handleStartNew = () => {
    setActivityConfig(null);
    setCompletedResponses([]);
    setDurationMinutes(0);
    setStep(STEPS.SETUP);
  };

  return (
    <div>
      {step === STEPS.SETUP && (
        <>
          <PageHeader
            title="Interactive Activities"
            subtitle="Generate and run live, auto-scored activities during session"
            action={
              <Button onClick={() => setShowDeafCultureGen(true)} variant="outline" className="border-[var(--modal-border)] text-[var(--modal-text)] hover:text-[#400070] rounded-xl gap-2 text-sm">
                <Sparkles className="w-4 h-4" /> Deaf Culture Activity
              </Button>
            }
          />
          <ActivitySetupScreen onActivityGenerated={handleActivityGenerated} />
        </>
      )}

      {step === STEPS.DIRECTIONS && activityConfig && (
        <>
          <PageHeader title="Activity Setup" subtitle="Review directions before starting" />
          <ActivityDirectionsScreen
            config={activityConfig}
            onStart={handleDirectionsComplete}
          />
        </>
      )}

      {step === STEPS.PLAYING && activityConfig && (
        <>
          <PageHeader title="Activity in Progress" subtitle="Click the answer the student gave, then record prompt level" />
          <ActivityPlayerScreen
            config={activityConfig}
            onComplete={handlePlayerComplete}
          />
        </>
      )}

      {step === STEPS.SUMMARY && activityConfig && (
        <>
          <PageHeader title="Session Summary" subtitle="Review results and save to student profile" />
          <ActivitySummaryScreen
            config={activityConfig}
            responses={completedResponses}
            durationMinutes={durationMinutes}
            onSave={() => {}}
            onStartNew={handleStartNew}
          />
        </>
      )}
      <DeafCultureActivityGenerator
        open={showDeafCultureGen}
        onClose={() => setShowDeafCultureGen(false)}
      />
    </div>
  );
}