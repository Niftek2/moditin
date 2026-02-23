import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { computeSummary, LING6_SOUNDS, SOUND_LABELS, soundStatusColor } from "./ling6Utils";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Ling6SessionHistory({ studentId }) {
  const [filterEar, setFilterEar] = useState("All");
  const [filterDelivery, setFilterDelivery] = useState("All");
  const [filterTech, setFilterTech] = useState("All");
  const [showDetected, setShowDetected] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["ling6sessions", studentId],
    queryFn: () => base44.entities.Ling6Session.filter({ studentId }),
    enabled: !!studentId,
  });

  const { data: allTrials = [] } = useQuery({
    queryKey: ["ling6trials", studentId],
    queryFn: async () => {
      const ss = await base44.entities.Ling6Session.filter({ studentId });
      if (!ss.length) return [];
      const trialsArrays = await Promise.all(
        ss.map(s => base44.entities.Ling6Trial.filter({ ling6SessionId: s.id }))
      );
      return trialsArrays.flat();
    },
    enabled: !!studentId,
  });

  const trialsForSession = (sessionId) => allTrials.filter(t => t.ling6SessionId === sessionId);

  const filtered = sessions
    .filter(s => filterEar === "All" || s.earTested === filterEar)
    .filter(s => filterDelivery === "All" || s.deliveryMethod === filterDelivery)
    .filter(s => filterTech === "All" || s.hearingTechWorn === filterTech)
    .sort((a, b) => new Date(b.dateTime || b.created_date) - new Date(a.dateTime || a.created_date));

  // Build trend data
  const trendData = [...filtered].reverse().map(s => {
    const sum = computeSummary(trialsForSession(s.id));
    return {
      date: s.dateTime ? format(new Date(s.dateTime), "MM/dd") : format(new Date(s.created_date), "MM/dd"),
      identified: sum.identifiedPct,
      detected: sum.detectedPct,
    };
  });

  if (isLoading) return <p className="text-sm text-[var(--modal-text-muted)] py-6 text-center">Loading…</p>;
  if (!sessions.length) return <p className="text-sm text-[var(--modal-text-muted)] py-6 text-center">No Ling 6 sessions recorded yet.</p>;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["All", "Both", "Left", "Right"].map(v => (
          <button key={v} onClick={() => setFilterEar(v)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${filterEar === v ? "bg-[#400070] text-white border-[#400070]" : "bg-white text-[var(--modal-text)] border-[var(--modal-border)]"}`}>
            {v === "All" ? "All Ears" : v}
          </button>
        ))}
        <span className="border-l border-[var(--modal-border)] mx-1" />
        {["All", "LiveVoice", "SoundClip"].map(v => (
          <button key={v} onClick={() => setFilterDelivery(v)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${filterDelivery === v ? "bg-[#400070] text-white border-[#400070]" : "bg-white text-[var(--modal-text)] border-[var(--modal-border)]"}`}>
            {v === "All" ? "All Methods" : v === "LiveVoice" ? "Live Voice" : "Sound Clip"}
          </button>
        ))}
      </div>

      {/* Trend chart */}
      {trendData.length > 1 && (
        <div className="modal-card p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#400070] uppercase tracking-wider">Trend</h3>
            <button onClick={() => setShowDetected(v => !v)} className="text-xs text-[#6B2FB9] hover:underline">
              {showDetected ? "Hide Detected%" : "Show Detected%"}
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8F4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="identified" stroke="#400070" strokeWidth={2} dot={{ r: 4 }} name="Identified%" />
              {showDetected && <Line type="monotone" dataKey="detected" stroke="#EAB308" strokeWidth={2} dot={{ r: 3 }} name="Detected%" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session list */}
      <div className="space-y-2">
        {filtered.map(s => {
          const trials = trialsForSession(s.id);
          const sum = computeSummary(trials);
          const isExpanded = expandedSession === s.id;
          const dateStr = s.dateTime ? format(new Date(s.dateTime), "MMM d, yyyy h:mm a") : format(new Date(s.created_date), "MMM d, yyyy");

          return (
            <div key={s.id} className="modal-card overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#F7F3FA] transition-all"
                onClick={() => setExpandedSession(isExpanded ? null : s.id)}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[var(--modal-text)]">{dateStr}</span>
                    <Badge className={`text-xs border-0 ${s.deliveryMethod === "LiveVoice" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                      {s.deliveryMethod === "LiveVoice" ? "Live Voice" : "Sound Clip"}
                    </Badge>
                    <Badge className="bg-[#EADDF5] text-[#400070] border-0 text-xs">{s.earTested}</Badge>
                    <Badge className="bg-[#EADDF5] text-[#400070] border-0 text-xs">{s.hearingTechWorn}</Badge>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-700 font-semibold">{sum.identifiedPct}% Identified</span>
                    <span className="text-yellow-700 font-semibold">{sum.detectedPct}% Detected</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--modal-text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--modal-text-muted)]" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[var(--modal-border)]">
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {LING6_SOUNDS.map(sound => {
                      const st = sum.bySound[sound]?.status || "NotTested";
                      return (
                        <div key={sound} className={`p-2 rounded-xl border text-center text-xs ${soundStatusColor(st)}`}>
                          <p className="font-bold">{SOUND_LABELS[sound]}</p>
                          <p className="opacity-80">{st === "NotTested" ? "—" : st}</p>
                        </div>
                      );
                    })}
                  </div>
                  {s.notes && (
                    <p className="text-xs text-[var(--modal-text-muted)] mt-3 italic">Notes: {s.notes}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}