import React from "react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RecurrenceFields({ form, set }) {
  const { recurrenceType, recurrenceDaysOfWeek = [], recurrenceDayOfMonth, recurrenceInterval = 1, recurrenceEndDate } = form;

  const toggleDay = (d) => {
    const days = recurrenceDaysOfWeek.includes(d)
      ? recurrenceDaysOfWeek.filter(x => x !== d)
      : [...recurrenceDaysOfWeek, d];
    set("recurrenceDaysOfWeek", days);
  };

  return (
    <div className="space-y-3">
      {/* Recurrence type */}
      <div>
        <label className="text-sm font-semibold mb-1 block">Repeat</label>
        <div className="flex flex-wrap gap-2">
          {["None", "Daily", "Weekly", "Monthly"].map(type => (
            <button
              type="button"
              key={type}
              onClick={() => set("recurrenceType", type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                recurrenceType === type
                  ? "bg-[#400070] text-white border-[#400070]"
                  : "bg-white text-[var(--modal-text-muted)] border-[var(--modal-border)] hover:border-[#400070]"
              }`}
            >
              {type === "None" ? "Does not repeat" : type}
            </button>
          ))}
        </div>
      </div>

      {recurrenceType !== "None" && (
        <>
          {/* Interval */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold shrink-0">Every</label>
            <input
              type="number"
              min="1"
              max="52"
              value={recurrenceInterval}
              onChange={e => set("recurrenceInterval", Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 border border-[var(--modal-border)] rounded-xl px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[#6B2FB9]"
            />
            <span className="text-sm text-[var(--modal-text-muted)]">
              {recurrenceType === "Daily" ? "day(s)" : recurrenceType === "Weekly" ? "week(s)" : "month(s)"}
            </span>
          </div>

          {/* Weekly: days of week */}
          {recurrenceType === "Weekly" && (
            <div>
              <label className="text-sm font-semibold mb-1 block">On</label>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_LABELS.map((label, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => toggleDay(idx)}
                    className={`w-10 h-10 rounded-full text-xs font-bold border transition-all ${
                      recurrenceDaysOfWeek.includes(idx)
                        ? "bg-[#400070] text-white border-[#400070]"
                        : "bg-white text-[var(--modal-text-muted)] border-[var(--modal-border)] hover:border-[#400070]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: day of month */}
          {recurrenceType === "Monthly" && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold shrink-0">On day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={recurrenceDayOfMonth || ""}
                onChange={e => set("recurrenceDayOfMonth", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 border border-[var(--modal-border)] rounded-xl px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[#6B2FB9]"
              />
              <span className="text-sm text-[var(--modal-text-muted)]">of the month</span>
            </div>
          )}

          {/* End date */}
          <div>
            <label className="text-sm font-semibold mb-1 block">End date <span className="font-normal text-[var(--modal-text-muted)]">(optional)</span></label>
            <input
              type="date"
              value={recurrenceEndDate || ""}
              onChange={e => set("recurrenceEndDate", e.target.value)}
              className="w-full border border-[var(--modal-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#6B2FB9]"
            />
          </div>
        </>
      )}
    </div>
  );
}