import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import LabelingActivitySetup from "../components/labeling/LabelingActivitySetup";
import DragDropActivity from "../components/labeling/DragDropActivity";
import CompletionScreen from "../components/labeling/CompletionScreen";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LabelingActivitiesPage() {
  const [stage, setStage] = useState("setup"); // setup | activity | completion
  const [activityData, setActivityData] = useState(null);
  const [result, setResult] = useState(null);

  const handleStart = (data) => {
    setActivityData(data);
    setStage("activity");
  };

  const handleActivityComplete = (activityResult) => {
    setResult(activityResult);
    setStage("completion");
  };

  const handleClose = () => {
    setStage("setup");
    setActivityData(null);
    setResult(null);
  };

  return (
    <div>
      <PageHeader
        title={stage === "setup" ? "Labeling Activities" : ""}
        subtitle={stage === "setup" ? "Practice device knowledge with drag-and-drop" : ""}
      />

      {stage === "setup" && (
        <div className="bg-white rounded-2xl p-6 modal-card">
          <LabelingActivitySetup onStart={handleStart} />
        </div>
      )}

      {stage === "activity" && activityData && (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-white border-none">
            <div className="absolute top-4 left-4 z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-[var(--modal-text)] hover:bg-[var(--modal-card-hover)]"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
            <DragDropActivity
              activityConfig={activityData.activityConfig}
              onComplete={handleActivityComplete}
            />
          </DialogContent>
        </Dialog>
      )}

      {stage === "completion" && result && activityData && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent className="max-w-lg bg-white border-none p-0">
            <div className="p-6">
              <CompletionScreen
                result={result}
                studentId={activityData.studentId}
                sessionDate={activityData.sessionDate}
                startTime={activityData.startTime}
                activityType={activityData.activityType}
                onClose={handleClose}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}