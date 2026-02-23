import React, { useState } from "react";
import PageHeader from "../components/shared/PageHeader";
import ActivitySetupScreen from "../components/interactive/ActivitySetupScreen";
import ActivityPlayerScreen from "../components/interactive/ActivityPlayerScreen";
import ActivitySummaryScreen from "../components/interactive/ActivitySummaryScreen";

const STEPS = { SETUP: "setup", PLAYING: "playing", SUMMARY: "summary" };

export default function InteractiveActivitiesPage() {
  const [step, setStep] = useState(STEPS.SETUP);
  const [activityConfig, setActivityConfig] = useState(null);
  const [completedResponses, setCompletedResponses] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(0);

  const handleActivityGenerated = (config) => {
    setActivityConfig(config);
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
          <PageHeader title="Interactive Activities" subtitle="Generate and run live, auto-scored activities during session" />
          <ActivitySetupScreen onActivityGenerated={handleActivityGenerated} />
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
    </div>
  );
}