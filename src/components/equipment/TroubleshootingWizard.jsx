import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronRight, X } from "lucide-react";
import { getTroubleshootingSteps, EQUIPMENT_LABELS, ISSUE_LABELS, RESPONSE_LABELS } from "./troubleshootingSteps";

const EQUIPMENT_OPTIONS = [
  "HearingAid",
  "CochlearImplant",
  "BAHA",
  "FM_DM_System",
  "SoundfieldSystem",
  "Charger",
  "Battery",
  "Other"
];

const ISSUE_OPTIONS = [
  "NoSound",
  "IntermittentSound",
  "DistortedSound",
  "TooLoud",
  "TooSoft",
  "FeedbackWhistling",
  "WillNotTurnOn",
  "BatteryIssue",
  "ConnectivityIssue",
  "TeacherUnsure"
];

const RESPONSE_OPTIONS = ["Yes", "No", "Unsure", "Completed", "NotCompleted", "NotApplicable"];

export default function TroubleshootingWizard({ studentInitials, onComplete, onCancel }) {
  const [step, setStep] = useState("equipment"); // equipment, issue, steps, summary
  const [equipmentType, setEquipmentType] = useState(null);
  const [issueType, setIssueType] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [notes, setNotes] = useState("");

  const troubleshootSteps = equipmentType && issueType ? getTroubleshootingSteps(equipmentType, issueType) : [];
  const currentStep = troubleshootSteps[stepIndex];
  const isLastStep = stepIndex === troubleshootSteps.length - 1;

  const handleSelectEquipment = (type) => {
    setEquipmentType(type);
    setStep("issue");
  };

  const handleSelectIssue = (type) => {
    setIssueType(type);
    setStep("steps");
    setStepIndex(0);
    setResponses([]);
  };

  const handleStepResponse = (response) => {
    const newResponses = [...responses];
    newResponses[stepIndex] = response;
    setResponses(newResponses);

    if (isLastStep) {
      setStep("summary");
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleGoBack = () => {
    if (step === "issue") {
      setEquipmentType(null);
      setStep("equipment");
    } else if (step === "steps") {
      if (stepIndex > 0) {
        setStepIndex(stepIndex - 1);
      } else {
        setIssueType(null);
        setEquipmentType(null);
        setStep("equipment");
      }
    } else if (step === "summary") {
      setStep("steps");
      setStepIndex(troubleshootSteps.length - 1);
    }
  };

  const handleSaveSession = () => {
    const sessionData = {
      equipmentType,
      issueType,
      stepsTaken: troubleshootSteps.map((prompt, idx) => ({
        stepNumber: idx + 1,
        stepPrompt: prompt,
        response: responses[idx]
      })),
      outcome,
      referralSuggested: outcome === "Referred",
      notes
    };
    onComplete(sessionData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--modal-border)] shrink-0">
          <div>
            <h2 className="font-semibold text-[var(--modal-text)]">Troubleshoot Equipment</h2>
            <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">Educational support tool. Not diagnostic.</p>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-[var(--modal-text-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {/* Equipment Selection */}
            {step === "equipment" && (
              <motion.div key="equipment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="font-semibold text-lg text-[var(--modal-text)] mb-4">What type of equipment?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {EQUIPMENT_OPTIONS.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSelectEquipment(type)}
                      className="p-4 text-center border border-[var(--modal-border)] rounded-xl hover:bg-[var(--modal-card-hover)] transition-colors text-sm font-medium text-[var(--modal-text)]"
                    >
                      {EQUIPMENT_LABELS[type]}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Issue Selection */}
            {step === "issue" && (
              <motion.div key="issue" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="font-semibold text-lg text-[var(--modal-text)] mb-4">What is happening?</h3>
                <div className="space-y-2">
                  {ISSUE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSelectIssue(type)}
                      className="w-full p-3 text-left border border-[var(--modal-border)] rounded-xl hover:bg-[var(--modal-card-hover)] transition-colors text-sm font-medium text-[var(--modal-text)] flex items-center justify-between"
                    >
                      {ISSUE_LABELS[type]}
                      <ChevronRight className="w-4 h-4 text-[var(--modal-text-muted)]" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step Flow */}
            {step === "steps" && currentStep && (
              <motion.div key="steps" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-[var(--modal-text-muted)]">Step {stepIndex + 1} of {troubleshootSteps.length}</p>
                  </div>
                  <div className="h-1.5 bg-[var(--modal-border)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#400070]"
                      initial={{ width: 0 }}
                      animate={{ width: `${((stepIndex + 1) / troubleshootSteps.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Step Content */}
                <h3 className="font-semibold text-lg text-[var(--modal-text)] mb-6">{currentStep}</h3>

                {/* Response Options */}
                <div className="space-y-2 mb-6">
                  {RESPONSE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleStepResponse(opt)}
                      className="w-full p-3 text-left border border-[var(--modal-border)] rounded-xl hover:bg-[#400070]/10 hover:border-[#400070] transition-all text-sm font-medium text-[var(--modal-text)]"
                    >
                      {RESPONSE_LABELS[opt]}
                    </button>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>This tool provides educational guidance only. Not diagnostic or medical advice.</p>
                </div>
              </motion.div>
            )}

            {/* Summary */}
            {step === "summary" && (
              <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="font-semibold text-lg text-[var(--modal-text)] mb-4">Troubleshooting Summary</h3>

                <div className="space-y-4 mb-6">
                  <div className="bg-[var(--modal-card-hover)] p-4 rounded-lg">
                    <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase mb-1">Equipment</p>
                    <p className="text-sm font-medium text-[var(--modal-text)]">{EQUIPMENT_LABELS[equipmentType]}</p>
                  </div>

                  <div className="bg-[var(--modal-card-hover)] p-4 rounded-lg">
                    <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase mb-1">Issue</p>
                    <p className="text-sm font-medium text-[var(--modal-text)]">{ISSUE_LABELS[issueType]}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase mb-2">Steps Completed</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {troubleshootSteps.map((prompt, idx) => (
                        <div key={idx} className="text-xs text-[var(--modal-text)] bg-gray-50 p-2 rounded">
                          <span className="font-medium">Step {idx + 1}:</span> {responses[idx] ? `${responses[idx]} - ` : ""}{prompt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Outcome Selection */}
                <p className="text-sm font-semibold text-[var(--modal-text)] mb-3">What is the outcome?</p>
                <div className="space-y-2 mb-6">
                  {["Resolved", "PartiallyResolved", "Referred"].map((outc) => (
                    <button
                      key={outc}
                      onClick={() => setOutcome(outc)}
                      className={`w-full p-3 text-left border rounded-xl transition-all text-sm font-medium ${
                        outcome === outc
                          ? "bg-[#400070] text-white border-[#400070]"
                          : "border-[var(--modal-border)] text-[var(--modal-text)] hover:border-[#400070]"
                      }`}
                    >
                      {outc === "Resolved" && "✓ Resolved"}
                      {outc === "PartiallyResolved" && "~ Partially Resolved"}
                      {outc === "Referred" && "→ Referral Recommended"}
                    </button>
                  ))}
                </div>

                {outcome === "Referred" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-6">
                    Consider contacting audiology and follow district procedures.
                  </div>
                )}

                {/* Notes */}
                <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase mb-2">Notes (Optional)</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional observations (no identifiable information)"
                  className="w-full p-3 border border-[var(--modal-border)] rounded-lg text-sm text-[var(--modal-text)] placeholder-[var(--modal-text-muted)] focus:outline-none focus:border-[#400070] mb-6"
                  rows="3"
                />

                <div className="bg-gray-100 text-xs text-[var(--modal-text)] p-3 rounded-lg">
                  This tool provides educational documentation only. It is not diagnostic or medical in nature. Follow state, district, and school procedures.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--modal-border)] shrink-0 flex gap-3 justify-between">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="border-[var(--modal-border)] text-[var(--modal-text-muted)]"
          >
            Back
          </Button>
          {step === "summary" ? (
            <>
              <Button variant="outline" onClick={onCancel} className="border-[var(--modal-border)] text-[var(--modal-text-muted)]">
                Cancel
              </Button>
              <Button
                onClick={handleSaveSession}
                disabled={!outcome}
                className="bg-[#400070] hover:bg-[#5B00A0] text-white"
              >
                Save & Log Issue
              </Button>
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}