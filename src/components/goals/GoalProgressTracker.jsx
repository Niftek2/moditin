import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, TrendingUp } from "lucide-react";
import LogProgressModal from "./LogProgressModal";

const QUALITATIVE_MAP = { Emerging: 25, Developing: 60, Mastering: 95 };
const QUALITATIVE_COLORS = { Emerging: "bg-amber-400", Developing: "bg-blue-400", Mastering: "bg-green-500" };

function toPercent(entry) {
  if (entry.progressType === "percentage") return entry.percentageValue ?? 0;
  if (entry.progressType === "numerical_score" && entry.numericalMaxScore) {
    return Math.round((entry.numericalScore / entry.numericalMaxScore) * 100);
  }
  if (entry.progressType === "qualitative_status") return QUALITATIVE_MAP[entry.qualitativeStatus] ?? 0;
  return 0;
}

function formatLabel(entry) {
  if (entry.progressType === "percentage") return `${entry.percentageValue}%`;
  if (entry.progressType === "numerical_score") return `${entry.numericalScore}/${entry.numericalMaxScore}`;
  if (entry.progressType === "qualitative_status") return entry.qualitativeStatus;
  return "—";
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--modal-border)] rounded-xl p-2 shadow-md text-xs">
      <p className="font-semibold text-[var(--modal-text)]">{label}</p>
      <p className="text-[#6B2FB9]">{payload[0]?.payload?.label}</p>
    </div>
  );
};

export default function GoalProgressTracker({ studentGoalId, studentId, goalText }) {
  const [showModal, setShowModal] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const { data: entries = [] } = useQuery({
    queryKey: ["goalProgress", studentGoalId],
    queryFn: () => base44.entities.GoalProgressEntry.filter({ studentGoalId }),
    enabled: !!studentGoalId,
  });

  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const currentPct = latest ? toPercent(latest) : null;

  const chartData = sorted.map(e => ({
    date: new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: toPercent(e),
    label: formatLabel(e),
  }));

  const barColor = currentPct === null ? "bg-gray-200"
    : currentPct >= 80 ? "bg-green-500"
    : currentPct >= 50 ? "bg-blue-400"
    : "bg-amber-400";

  return (
    <div className="mt-3 space-y-2">
      {/* Progress Bar Row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
          {currentPct !== null && (
            <div
              className={`h-2.5 rounded-full transition-all ${barColor}`}
              style={{ width: `${currentPct}%` }}
              role="progressbar"
              aria-valuenow={currentPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Goal progress: ${latest ? formatLabel(latest) : "No data"}`}
            />
          )}
        </div>
        <span className="text-xs font-semibold text-[#6B2FB9] w-10 text-right shrink-0">
          {latest ? formatLabel(latest) : "—"}
        </span>
        {entries.length > 1 && (
          <button
            onClick={() => setShowChart(s => !s)}
            className="text-[var(--modal-text-muted)] hover:text-[#6B2FB9] transition-colors"
            aria-label="Toggle trend chart"
            title="Show trend"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => setShowModal(true)}
          className="text-[var(--modal-text-muted)] hover:text-[#400070] transition-colors"
          aria-label="Log progress check-in"
          title="Log check-in"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Last check-in date */}
      {latest && (
        <p className="text-[10px] text-[var(--modal-text-muted)]">
          Last check-in: {new Date(latest.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {latest.notes && <span className="ml-1 italic">· {latest.notes}</span>}
        </p>
      )}

      {/* Trend Chart */}
      {showChart && chartData.length > 1 && (
        <div className="mt-2 bg-white border border-[var(--modal-border)] rounded-xl p-3">
          <p className="text-[10px] font-semibold text-[var(--modal-text-muted)] uppercase tracking-wider mb-2">Progress Over Time</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE9F6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#6B7280" }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6B2FB9"
                strokeWidth={2}
                dot={{ fill: "#400070", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {showModal && (
        <LogProgressModal
          studentGoalId={studentGoalId}
          studentId={studentId}
          goalText={goalText}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}