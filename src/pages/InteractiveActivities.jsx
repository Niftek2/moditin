import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Library } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import ActivitySetupScreen from "../components/interactive/ActivitySetupScreen";
import ActivityDirectionsScreen from "../components/interactive/ActivityDirectionsScreen";
import ActivityPlayerScreen from "../components/interactive/ActivityPlayerScreen";
import ActivitySummaryScreen from "../components/interactive/ActivitySummaryScreen";
import DeafCultureActivityGenerator from "../components/goalbank/DeafCultureActivityGenerator";
import ActivityHistory from "../components/interactive/ActivityHistory";

const STEPS = { SETUP: "setup", DIRECTIONS: "directions", PLAYING: "playing", SUMMARY: "summary", BROWSE: "browse" };

export default function InteractiveActivitiesPage() {
  const [step, setStep] = useState(STEPS.SETUP);
  const [showDeafCultureGen, setShowDeafCultureGen] = useState(false);
  const [activityConfig, setActivityConfig] = useState(null);
  const [completedResponses, setCompletedResponses] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [showBrowse, setShowBrowse] = useState(false);

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

  const handleSelectSavedActivity = (savedActivity) => {
    setActivityConfig({
      items: savedActivity.activityContent.items,
      teacherDirections: savedActivity.activityContent.teacherDirections,
      studentDirections: savedActivity.activityContent.studentDirections,
      passage: savedActivity.activityContent.passage,
      templateType: savedActivity.templateType,
      difficulty: savedActivity.difficulty,
      languageLevel: savedActivity.languageLevel,
      gradeBand: savedActivity.gradeBand,
    });
    setShowBrowse(false);
    setStep(STEPS.DIRECTIONS);
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
              <Button onClick={() => setShowBrowse(!showBrowse)} variant="outline" className="border-[var(--modal-border)] text-[var(--modal-text)] gap-2">
                <Library className="w-4 h-4" /> Browse Saved
              </Button>
            }
          />
          {showBrowse ? (
            <ActivityHistory onSelectActivity={handleSelectSavedActivity} />
          ) : (
            <ActivitySetupScreen onActivityGenerated={handleActivityGenerated} onShowDeafCultureGen={() => setShowDeafCultureGen(true)} />
          )}
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