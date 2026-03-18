import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronRight, X, Loader2, AlertTriangle, Phone, CheckCircle2 } from "lucide-react";
import { getTroubleshootingSteps, EQUIPMENT_LABELS, ISSUE_LABELS, RESPONSE_LABELS } from "./troubleshootingSteps";
import { base44 } from "@/api/base44Client";

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

const RESPONSE_OPTIONS = ["Yes", "No", "Unsure", "NotApplicable"];

const EQUIPMENT_ICONS = {
  HearingAid: "👂",
  CochlearImplant: "🧠",
  BAHA: "🦴",
  FM_DM_System: "📡",
  SoundfieldSystem: "🔊",
  Charger: "🔌",
  Battery: "🔋",
  Other: "❓"
};

export default function TroubleshootingWizard({ studentInitials, onComplete, onCancel }) {
  const [step, setStep] = useState("equipment"); // equipment | issue | loading | steps | summary
  const [equipmentType, setEquipmentType] = useState(null);
  const [issueType, setIssueType] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [notes, setNotes] = useState("");

  // AI-generated content
  const [aiSteps, setAiSteps] = useState(null); // null = not yet generated
  const [aiEscalationFlag, setAiEscalationFlag] = useState(false);
  const [aiEscalationMessage, setAiEscalationMessage] = useState("");
  const [aiReferralRecommended, setAiReferralRecommended] = useState(false);
  const [aiReferralNote, setAiReferralNote] = useState("");
  const [aiLingCheck, setAiLingCheck] = useState(true);
  const [aiError, setAiError] = useState(false);

  const activeSteps = aiSteps || (equipmentType && issueType ? getTroubleshootingSteps(equipmentType, issueType) : []);
  const currentStep = activeSteps[stepIndex];
  const isLastStep = stepIndex === activeSteps.length - 1;

  const handleSelectEquipment = (type) => {
    setEquipmentType(type);
    setStep("issue");
  };

  const handleSelectIssue = async (type) => {
    setIssueType(type);
    setStep("loading");
    setStepIndex(0);
    setResponses([]);
    setAiSteps(null);
    setAiError(false);

    try {
      const res = await base44.functions.invoke("equipmentTroubleshoot", {
        action: "generateAIChecklist",
        equipmentType,
        issueType: type
      });

      if (res.data?.steps?.length > 0) {
        setAiSteps(res.data.steps);
        setAiEscalationFlag(res.data.escalationFlag || false);
        setAiEscalationMessage(res.data.escalationMessage || "");
        setAiReferralRecommended(res.data.referralRecommended || false);
        setAiReferralNote(res.data.referralNote || "");
        setAiLingCheck(res.data.lingCheckStep !== false);
      } else {
        // Fallback to static steps
        setAiSteps(getTroubleshootingSteps(equipmentType, type));
        setAiError(true);
      }
    } catch (e) {
      // Fallback to static steps
      setAiSteps(getTroubleshootingSteps(equipmentType, type));
      setAiError(true);
    }

    setStep("steps");
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
        setAiSteps(null);
        setStep("issue");
      }
    } else if (step === "summary") {
      setStep("steps");
      setStepIndex(activeSteps.length - 1);
    }
  };

  const handleSaveSession = () => {
    const sessionData = {
      equipmentType,
      issueType,
      stepsTaken: activeSteps.map((prompt, idx) => ({
        stepNumber: idx + 1,
        stepPrompt: prompt,
        response: responses[idx] || "NotCompleted"
      })),
      outcome,
      referralSuggested: outcome === "Referred" || aiReferralRecommended,
      notes
    };
    onComplete(sessionData);
  };

  const stepTitle = (s) => {
    const titles = {
      equipment: "What type of equipment?",
      issue: `What is happening with the ${EQUIPMENT_LABELS[equipmentType] || "device"}?`,
      loading: "Generating checklist…",
      steps: "Troubleshooting Steps",
      summary: "Troubleshooting Summary"
    };
    return titles[s] || "";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--modal-border)] shrink-0">
          <div>
            <h2 className="font-bold text-[var(--modal-text)]">
              Equipment Troubleshooter
              {studentInitials && <span className="text-[#400070] ml-2 text-sm font-medium">— {studentInitials}</span>}
            </h2>
            <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">Educational support tool · Not diagnostic · IDEA § 300.113 compliant</p>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-[var(--modal-text-muted)]" />
          </button>
        </div>

        {/* Progress indicator for steps */}
        {step === "steps" && (
          <div className="px-6 pt-4 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-[var(--modal-text-muted)]">
                Step {stepIndex + 1} of {activeSteps.length}
                {!aiError && aiSteps && <span className="ml-2 text-[#400070]">✦ AI-generated</span>}
              </p>
              <p className="text-xs text-[var(--modal-text-muted)]">
                {EQUIPMENT_LABELS[equipmentType]} · {ISSUE_LABELS[issueType]}
              </p>
            </div>
            <div className="h-1.5 bg-[var(--modal-border)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#400070]"
                initial={{ width: 0 }}
                animate={{ width: `${((stepIndex + 1) / activeSteps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">

            {/* Equipment Selection */}
            {step === "equipment" && (
              <motion.div key="equipment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="font-semibold text-base text-[var(--modal-text)] mb-4">{stepTitle("equipment")}</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {EQUIPMENT_OPTIONS.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSelectEquipment(type)}
                      className="p-4 text-left border border-[var(--modal-border)] rounded-xl hover:bg-[#F7F3FA] hover:border-[#6B2FB9] transition-all text-sm font-medium text-[var(--modal-text)] flex items-center gap-3"
                    >
                      <span className="text-xl">{EQUIPMENT_ICONS[type]}</span>
                      <span>{EQUIPMENT_LABELS[type]}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Issue Selection */}
            {step === "issue" && (
              <motion.div key="issue" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="font-semibold text-base text-[var(--modal-text)] mb-4">{stepTitle("issue")}</h3>
                <div className="space-y-2">
                  {ISSUE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSelectIssue(type)}
                      className="w-full p-3.5 text-left border border-[var(--modal-border)] rounded-xl hover:bg-[#F7F3FA] hover:border-[#6B2FB9] transition-all text-sm font-medium text-[var(--modal-text)] flex items-center justify-between"
                    >
                      {ISSUE_LABELS[type]}
                      <ChevronRight className="w-4 h-4 text-[var(--modal-text-muted)]" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Loading */}
            {step === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 text-[#400070] animate-spin" />
                <div className="text-center">
                  <p className="font-semibold text-[var(--modal-text)]">Generating your checklist…</p>
                  <p className="text-sm text-[var(--modal-text-muted)] mt-1">AI is building a school-appropriate guide for this issue</p>
                </div>
              </motion.div>
            )}

            {/* Step Flow */}
            {step === "steps" && currentStep && (
              <motion.div key={`step-${stepIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

                {/* Escalation Banner — shown when AI flagged immediate escalation */}
                {aiEscalationFlag && stepIndex === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-700 mb-1">Likely beyond school scope</p>
                      <p className="text-sm text-red-700">{aiEscalationMessage || "This issue may require the student's medical audiologist. Complete the steps below first, then contact the family."}</p>
                    </div>
                  </div>
                )}

                {/* Step Content */}
                <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase tracking-wider mb-2">Step {stepIndex + 1}</p>
                <h3 className="font-semibold text-base text-[var(--modal-text)] mb-6 leading-relaxed">{currentStep}</h3>

                {/* Response Options */}
                <p className="text-xs text-[var(--modal-text-muted)] mb-2 font-medium">What happened?</p>
                <div className="space-y-2 mb-6">
                  {RESPONSE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleStepResponse(opt)}
                      className="w-full p-3.5 text-left border border-[var(--modal-border)] rounded-xl hover:bg-[#400070]/10 hover:border-[#400070] transition-all text-sm font-medium text-[var(--modal-text)] flex items-center gap-3"
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        opt === "Yes" || opt === "Completed" ? "bg-green-400" :
                        opt === "No" || opt === "NotCompleted" ? "bg-red-400" :
                        "bg-gray-300"
                      }`} />
                      {RESPONSE_LABELS[opt]}
                    </button>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Educational guidance only — not diagnostic or medical advice. Follow school and district procedures.</p>
                </div>
              </motion.div>
            )}

            {/* Summary */}
            {step === "summary" && (
              <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="font-semibold text-base text-[var(--modal-text)] mb-5">Troubleshooting Summary</h3>

                {/* Equipment & Issue */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-[#F7F3FA] p-3.5 rounded-xl">
                    <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase mb-1">Equipment</p>
                    <p className="text-sm font-semibold text-[var(--modal-text)]">{EQUIPMENT_LABELS[equipmentType]}</p>
                  </div>
                  <div className="bg-[#F7F3FA] p-3.5 rounded-xl">
                    <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase mb-1">Issue</p>
                    <p className="text-sm font-semibold text-[var(--modal-text)]">{ISSUE_LABELS[issueType]}</p>
                  </div>
                </div>

                {/* Ling Check Reminder */}
                {aiLingCheck && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-5 flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#400070] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-[#400070]">Ling Six-Sound Check recommended</p>
                      <p className="text-xs text-[#6B2FB9] mt-0.5">Perform /m/, /oo/, /ah/, /ee/, /sh/, /s/ to verify functional audibility. Document results in the service log.</p>
                    </div>
                  </div>
                )}

                {/* Referral Recommendation */}
                {aiReferralRecommended && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex gap-3">
                    <Phone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Referral recommended</p>
                      <p className="text-xs text-amber-700 mt-0.5">{aiReferralNote || "Contact the student's family and audiologist to follow up on this issue."}</p>
                    </div>
                  </div>
                )}

                {/* Steps Summary */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase mb-2">Steps completed</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {activeSteps.map((prompt, idx) => (
                      <div key={idx} className="text-xs text-[var(--modal-text)] bg-gray-50 p-2.5 rounded-lg flex gap-2">
                        <span className={`font-bold shrink-0 ${
                          responses[idx] === "Yes" || responses[idx] === "Completed" ? "text-green-600" :
                          responses[idx] === "No" || responses[idx] === "NotCompleted" ? "text-red-500" :
                          responses[idx] === "NotApplicable" ? "text-gray-400" : "text-gray-400"
                        }`}>
                          {responses[idx] === "Yes" || responses[idx] === "Completed" ? "✓" :
                           responses[idx] === "No" || responses[idx] === "NotCompleted" ? "✗" :
                           responses[idx] === "NotApplicable" ? "—" : "·"}
                        </span>
                        <span>{prompt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outcome */}
                <p className="text-sm font-semibold text-[var(--modal-text)] mb-2">Session outcome</p>
                <div className="space-y-2 mb-5">
                  {["Resolved", "PartiallyResolved", "Referred"].map((outc) => (
                    <button
                      key={outc}
                      onClick={() => setOutcome(outc)}
                      className={`w-full p-3.5 text-left border rounded-xl transition-all text-sm font-medium ${
                        outcome === outc
                          ? "bg-[#400070] text-white border-[#400070]"
                          : "border-[var(--modal-border)] text-[var(--modal-text)] hover:border-[#400070]"
                      }`}
                    >
                      {outc === "Resolved" && "✓ Resolved — device is functioning"}
                      {outc === "PartiallyResolved" && "~ Partially resolved — needs monitoring"}
                      {outc === "Referred" && "→ Referral needed — contacting family/audiologist"}
                    </button>
                  ))}
                </div>

                {outcome === "Referred" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-5 flex gap-2">
                    <Phone className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">Who to contact:</p>
                      <ul className="space-y-0.5">
                        <li>• Student's medical audiologist (for CI, BAHA, or programming concerns)</li>
                        <li>• Family (to report device issue and coordinate repair/replacement)</li>
                        <li>• District FM coordinator (for FM/DM system issues)</li>
                        <li>• School IT (for soundfield system issues)</li>
                      </ul>
                      <p className="mt-2">Document this session in the student's service log for IDEA § 300.113 compliance.</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <p className="text-xs font-semibold text-[var(--modal-text-muted)] uppercase mb-1.5">Notes (optional — no identifying information)</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Device behavior observed, steps attempted, anything unusual..."
                  className="w-full p-3 border border-[var(--modal-border)] rounded-xl text-sm text-[var(--modal-text)] placeholder-[var(--modal-text-muted)] focus:outline-none focus:border-[#400070] mb-5"
                  rows="3"
                />

                <div className="bg-gray-50 border border-[var(--modal-border)] text-xs text-[var(--modal-text-muted)] p-3 rounded-xl">
                  This tool provides educational documentation only. It is not diagnostic or medical in nature. Always follow state, district, and school procedures. Under IDEA § 300.113, schools must ensure hearing aids and external components of surgically implanted devices are functioning — but are not responsible for programming or internal device maintenance.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--modal-border)] shrink-0 flex gap-3 justify-between">
          {step !== "equipment" && step !== "loading" ? (
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="border-[var(--modal-border)] text-[var(--modal-text-muted)]"
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {step === "summary" ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="border-[var(--modal-border)] text-[var(--modal-text-muted)]">
                Cancel
              </Button>
              <Button
                onClick={handleSaveSession}
                disabled={!outcome}
                className="bg-[#400070] hover:bg-[#5B00A0] text-white"
              >
                Save & Log Session
              </Button>
            </div>
          ) : step === "loading" ? (
            <div />
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}