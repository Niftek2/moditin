import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TEMPLATE_LABELS } from "./activityTemplates";
import { Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function StudentInteractiveHistory({ studentId }) {
  const [filterTemplate, setFilterTemplate] = useState("all");

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["interactiveSessions", studentId],
    queryFn: () => base44.entities.InteractiveActivitySession.filter({ studentId }, "-created_date", 50),
    enabled: !!studentId,
  });

  const filtered = filterTemplate === "all" ? sessions : sessions.filter(s => s.templateType === filterTemplate);

  const chartData = [...filtered]
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .map(s => ({
      date: new Date(s.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      pct: s.percentCorrect || 0,
      template: TEMPLATE_LABELS[s.templateType] || s.templateType,
    }));

  const scoreColor = (pct) => pct >= 80 ? "bg-green-100 text-green-700" : pct >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600";

  if (isLoading) return <div className="text-sm text-[var(--modal-text-muted)] py-6 text-center">Loading...</div>;

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <div className="modal-card p-10 text-center">
          <Zap className="w-8 h-8 text-[#6B2FB9] mx-auto mb-3 opacity-50" />
          <p className="text-sm text-[var(--modal-text-muted)] mb-4">No interactive activities recorded yet.</p>
          <Link to={createPageUrl("InteractiveActivities")}>
            <button className="px-4 py-2 bg-[#400070] text-white rounded-xl text-sm hover:bg-[#5B00A0] transition-colors">
              Start Activity
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Filter */}
          <div className="flex items-center gap-3">
            <Select value={filterTemplate} onValueChange={setFilterTemplate}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Filter by template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {Object.entries(TEMPLATE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs text-[var(--modal-text-muted)]">{filtered.length} session{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Trend chart */}
          {chartData.length >= 2 && (
            <div className="modal-card p-4">
              <p className="text-xs font-bold text-[#400070] uppercase tracking-wider mb-3">% Correct Over Time</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6F6F6F" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#6F6F6F" }} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Score"]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E8DFF5" }}
                  />
                  <Line type="monotone" dataKey="pct" stroke="#6B2FB9" strokeWidth={2} dot={{ r: 4, fill: "#6B2FB9" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Session list */}
          <div className="space-y-2">
            {filtered.map(s => (
              <div key={s.id} className="modal-card p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--modal-text)]">{TEMPLATE_LABELS[s.templateType]}</span>
                    <Badge variant="outline" className="text-[10px]">{s.difficulty}</Badge>
                    <Badge variant="outline" className="text-[10px]">{s.setting}</Badge>
                  </div>
                  <p className="text-xs text-[var(--modal-text-muted)] mt-0.5">
                    {new Date(s.created_date).toLocaleDateString()} · {s.durationMinutes || 0} min
                    {s.goalText ? ` · ${s.goalText.slice(0, 40)}...` : ""}
                  </p>
                  {s.promptSummary && <p className="text-[10px] text-[var(--modal-text-muted)] mt-0.5">Prompts: {s.promptSummary}</p>}
                </div>
                <Badge className={`text-sm font-bold px-3 py-1 border-0 ${scoreColor(s.percentCorrect)}`}>
                  {s.percentCorrect || 0}%
                </Badge>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}