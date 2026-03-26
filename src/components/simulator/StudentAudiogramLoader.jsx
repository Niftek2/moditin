import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, CheckCircle2, AlertTriangle, Loader2, User } from "lucide-react";
import { useDemo } from "../demo/DemoContext";

const FREQUENCIES = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];

// Map audiogram data (right/left point arrays) → 8-band gain array
function audiogramPointsToGains(points) {
  const gains = new Array(8).fill(0);
  FREQUENCIES.forEach((freq, i) => {
    const match = points.find(p => p.freq === freq);
    if (match) {
      // dB HL → gain reduction: 0 dB HL = 0 dB gain, 120 dB HL = -60 dB gain (capped)
      gains[i] = Math.max(-60, -(match.db / 2));
    }
  });
  return gains;
}


export default function StudentAudiogramLoader({ onGainsLoaded }) {
  const { isDemoMode, demoData } = useDemo();
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loadState, setLoadState] = useState(null); // null | 'loading' | 'structured' | 'ai' | 'error'
  const [sourceLabel, setSourceLabel] = useState("");

  useEffect(() => {
    if (!isDemoMode) {
      base44.auth.me().then(u => setCurrentUserEmail(u?.email)).catch(() => {});
    }
  }, [isDemoMode]);

  const { data: students = [] } = useQuery({
    queryKey: ["students", currentUserEmail, isDemoMode],
    queryFn: () => {
      if (isDemoMode) return demoData.students || [];
      return base44.entities.Student.filter({ created_by: currentUserEmail });
    },
    enabled: isDemoMode || !!currentUserEmail,
  });

  const { data: snapshot } = useQuery({
    queryKey: ["audiologySnapshot", selectedStudentId],
    queryFn: async () => {
      if (isDemoMode) {
        return (demoData.audiologySnapshots || []).find(s => s.studentId === selectedStudentId) || null;
      }
      const results = await base44.entities.StudentAudiologySnapshot.filter({ studentId: selectedStudentId });
      return results[0] || null;
    },
    enabled: !!selectedStudentId,
    staleTime: 0,
  });

  // When snapshot loads, derive gains
  useEffect(() => {
    if (!selectedStudentId || snapshot === undefined) return;

    const run = async () => {
      setLoadState("loading");

      // ── Priority 1: Structured audiogram plotter data ─────────────────────
      if (snapshot?.audiogramData) {
        try {
          const parsed = JSON.parse(snapshot.audiogramData);
          const right = parsed.right || [];
          const left = parsed.left || [];
          if (right.length > 0 || left.length > 0) {
            const rightGainsOut = audiogramPointsToGains(right);
            const leftGainsOut = audiogramPointsToGains(left);
            const label = parsed.label ? `Audiogram: "${parsed.label}"` : "Audiogram Plotter data";
            setSourceLabel(label);
            setLoadState("structured");
            onGainsLoaded(rightGainsOut, leftGainsOut, label, "structured");
            return;
          }
        } catch {}
      }

      // ── Priority 2: Structured profile fields → AI interpretation ─────────
      if (snapshot && (snapshot.configuration || snapshot.severityRange || snapshot.hearingLossType)) {
        const profileText = [
          snapshot.hearingLossType && `Hearing loss type: ${snapshot.hearingLossType}`,
          snapshot.hearingLossLaterality && `Laterality: ${snapshot.hearingLossLaterality}`,
          snapshot.configuration && `Audiogram configuration: ${snapshot.configuration}`,
          snapshot.severityRange && `Severity range: ${snapshot.severityRange}`,
          snapshot.hearingLossDetail?.length && `Details: ${snapshot.hearingLossDetail.join(", ")}`,
          snapshot.listeningAccessNotes && `Listening notes: ${snapshot.listeningAccessNotes}`,
          snapshot.equipmentUsed?.length && `Equipment: ${snapshot.equipmentUsed.join(", ")}`,
          snapshot.hlHistoryNotes && `History: ${snapshot.hlHistoryNotes}`,
        ].filter(Boolean).join("\n");

        try {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an audiologist assistant helping an itinerant teacher of the deaf understand a student's hearing profile for simulation purposes.

Based on the following non-identifiable hearing loss profile information, estimate the most likely hearing thresholds (in dB HL) at each standard audiometric frequency.

Profile:
${profileText}

Rules:
- Provide ESTIMATES based on the described configuration and severity. This is for educational simulation only, NOT clinical use.
- For a "Flat" configuration, thresholds should be similar across all frequencies.
- For "Sloping", low frequencies have better (lower) thresholds than high frequencies.
- For "CookieBite", mid frequencies (1k-2k) have the most loss.
- For "Rising", high frequencies have better thresholds.
- Match the severity range: Mild = 26-40 dB HL, Moderate = 41-55, ModeratelySevere = 56-70, Severe = 71-90, Profound = 91+.
- If bilateral, return the same thresholds for both ears. If unilateral or asymmetric, make the worse ear reflect the severity, and the better ear near normal (0-15 dB).
- Return dB HL values as whole numbers, rounded to nearest 5.`,
            response_json_schema: {
              type: "object",
              properties: {
                right: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      freq: { type: "number" },
                      db: { type: "number" }
                    }
                  }
                },
                left: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      freq: { type: "number" },
                      db: { type: "number" }
                    }
                  }
                },
                interpretation: { type: "string" }
              }
            }
          });

          const right = result.right || [];
          const left = result.left || [];
          if (right.length > 0 || left.length > 0) {
            const rightGainsOut = audiogramPointsToGains(right);
            const leftGainsOut = audiogramPointsToGains(left);
            const label = `AI estimate · ${snapshot.configuration || ""} ${snapshot.severityRange || ""}`.trim();
            setSourceLabel(label);
            setLoadState("ai");
            onGainsLoaded(rightGainsOut, leftGainsOut, label, "ai", result.interpretation);
            return;
          }
        } catch (err) {
          console.error("AI interpretation failed:", err);
        }
      }

      // ── No usable data ────────────────────────────────────────────────────
      setLoadState("error");
      setSourceLabel("No audiology data found for this student.");
      onGainsLoaded(null, null, null, "none");
    };

    run();
  }, [snapshot?.id, snapshot?.audiogramData, snapshot?.configuration, snapshot?.severityRange, snapshot?.hearingLossType, selectedStudentId]);

  const handleStudentChange = (val) => {
    setSelectedStudentId(val);
    setLoadState(null);
    setSourceLabel("");
    onGainsLoaded(null, null, null, "none");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-[#6B2FB9]" aria-hidden="true" />
        <span className="text-sm font-semibold text-[#1A1028]">Simulate a Student's Hearing Profile</span>
      </div>

      <Select value={selectedStudentId} onValueChange={handleStudentChange}>
        <SelectTrigger aria-label="Select a student to simulate their hearing">
          <SelectValue placeholder="Choose a student…" />
        </SelectTrigger>
        <SelectContent>
          {students.map(s => (
            <SelectItem key={s.id} value={s.id}>
              {s.studentInitials || s.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {loadState === "loading" && (
        <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
          <Loader2 className="w-4 h-4 animate-spin text-[#6B2FB9]" />
          Analyzing hearing profile…
        </div>
      )}

      {loadState === "structured" && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <div className="text-xs text-green-800">
            <p className="font-semibold">Loaded from Audiogram Plotter</p>
            <p>{sourceLabel}</p>
          </div>
        </div>
      )}

      {loadState === "ai" && (
        <div className="flex items-start gap-2 bg-[#F3EBF9] border border-[#C4A8E0] rounded-xl p-3">
          <Sparkles className="w-4 h-4 text-[#6B2FB9] mt-0.5 shrink-0" />
          <div className="text-xs text-[#1A1028]">
            <p className="font-semibold text-[#400070]">AI-estimated from hearing profile</p>
            <p className="text-[#4A4A4A]">{sourceLabel} · Per-ear thresholds applied independently</p>
            <p className="mt-1 text-[#6B2FB9] font-medium">Educational estimate only — not a clinical audiogram</p>
          </div>
        </div>
      )}

      {loadState === "error" && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">No audiology data found. Add an audiogram or hearing profile in the student's Audiology tab first.</p>
        </div>
      )}
    </div>
  );
}