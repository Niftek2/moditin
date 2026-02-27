import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Ling6SetupScreen from "../components/ling6/Ling6SetupScreen";
import Ling6CheckFlow from "../components/ling6/Ling6CheckFlow";
import Ling6SummaryScreen from "../components/ling6/Ling6SummaryScreen";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const STEPS = ["select", "setup", "check", "summary"];

export default function Ling6CheckPage() {
  const params = new URLSearchParams(window.location.search);
  const preselectedStudentId = params.get("studentId");

  const [step, setStep] = useState(preselectedStudentId ? "setup" : "select");
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || "");
  const [sessionSetup, setSessionSetup] = useState(null);
  const [completedTrials, setCompletedTrials] = useState([]);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);

  const { data: students = [] } = useQuery({
    queryKey: ["students", currentUser?.email],
    queryFn: () => base44.entities.Student.filter({ created_by: currentUser?.email }),
    enabled: !!currentUser?.email,
  });

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleSetupStart = (setup) => {
    setSessionSetup(setup);
    setStep("check");
  };

  const handleCheckComplete = (trials) => {
    setCompletedTrials(trials);
    setStep("summary");
  };

  const saveSession = async (notes, linkToServiceLog = false) => {
    setSaving(true);
    const sessionPayload = {
      studentId: selectedStudentId,
      dateTime: new Date().toISOString(),
      setting: sessionSetup.setting,
      deliveryMethod: sessionSetup.deliveryMethod,
      environment: sessionSetup.environment,
      distance: sessionSetup.distance,
      hearingTechWorn: sessionSetup.hearingTechWorn,
      techStatus: sessionSetup.techStatus,
      earTested: sessionSetup.earTested,
      caregiverPresent: sessionSetup.caregiverPresent,
      notes,
      disclaimerAccepted: true,
    };

    const session = await base44.entities.Ling6Session.create(sessionPayload);

    await Promise.all(
      completedTrials.map(trial =>
        base44.entities.Ling6Trial.create({
          ling6SessionId: session.id,
          sound: trial.sound,
          trialNumber: trial.trialNumber,
          responseType: trial.responseType,
          responseDetail: trial.responseDetail || "",
          promptLevel: trial.promptLevel,
          latencySeconds: trial.latencySeconds,
          confidence: trial.confidence,
        })
      )
    );

    queryClient.invalidateQueries({ queryKey: ["ling6sessions", selectedStudentId] });
    queryClient.invalidateQueries({ queryKey: ["ling6trials", selectedStudentId] });
    setSaving(false);

    if (linkToServiceLog) {
      // Navigate to service hours with studentId pre-filled
      window.location.href = createPageUrl(`ServiceHours?studentId=${selectedStudentId}`);
    } else {
      window.location.href = createPageUrl(`StudentDetail?id=${selectedStudentId}`);
    }
  };

  return (
    <div>
      {/* Back nav */}
      <div className="mb-6">
        {step === "select" && (
          <Link to={createPageUrl("Dashboard")} className="inline-flex items-center gap-2 text-sm text-[var(--modal-text-muted)] hover:text-[#400070] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        )}
        {step === "setup" && (
          <button onClick={() => setStep("select")} className="inline-flex items-center gap-2 text-sm text-[var(--modal-text-muted)] hover:text-[#400070] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step === "check" && (
          <button onClick={() => setStep("setup")} className="inline-flex items-center gap-2 text-sm text-[var(--modal-text-muted)] hover:text-[#400070] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Setup
          </button>
        )}
        {step === "summary" && (
          <button onClick={() => setStep("check")} className="inline-flex items-center gap-2 text-sm text-[var(--modal-text-muted)] hover:text-[#400070] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Check
          </button>
        )}
      </div>

      {/* Step: select student */}
      {step === "select" && (
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-[var(--modal-text)] mb-2">Listening Check</h1>
          <p className="text-sm text-[var(--modal-text-muted)] mb-6">Quick listening check. <strong>Not diagnostic.</strong></p>

          <div className="modal-card p-6">
            <p className="text-sm font-semibold text-[var(--modal-text)] mb-3">Select Student</p>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-full rounded-xl border-[var(--modal-border)]">
                <SelectValue placeholder="Choose a student…" />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.studentInitials} — {s.gradeBand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full mt-4 bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-11 font-semibold"
              disabled={!selectedStudentId}
              onClick={() => setStep("setup")}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "setup" && (
        <Ling6SetupScreen
          student={selectedStudent}
          onStart={handleSetupStart}
        />
      )}

      {step === "check" && sessionSetup && (
        <Ling6CheckFlow
          session={sessionSetup}
          student={selectedStudent}
          onComplete={handleCheckComplete}
        />
      )}

      {step === "summary" && sessionSetup && (
        <Ling6SummaryScreen
          session={sessionSetup}
          trials={completedTrials}
          saving={saving}
          onSave={(notes) => saveSession(notes, false)}
          onSaveAndLink={(notes) => saveSession(notes, true)}
        />
      )}
    </div>
  );
}