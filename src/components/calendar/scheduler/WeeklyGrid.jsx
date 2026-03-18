/**
 * WeeklyGrid — drag-to-select weekly time grid.
 * Click or drag to toggle cells. Green = available, Red = blocked.
 *
 * Props:
 *   value: Set<"dayNum-HH:mm">  e.g. Set(["1-08:00", "1-08:30", ...])
 *   onChange: (newSet) => void
 *   activeColor: "green" | "red"
 *   startHour: number (default 7)
 *   endHour: number (default 17)
 */
import React, { useRef, useEffect } from "react";

const DAYS = [
  { label: "Mon", num: 1 },
  { label: "Tue", num: 2 },
  { label: "Wed", num: 3 },
  { label: "Thu", num: 4 },
  { label: "Fri", num: 5 },
];

function pad(n) { return String(n).padStart(2, "0"); }

function formatHour(h) {
  const period = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}${period}`;
}

function buildSlots(startHour, endHour) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${pad(h)}:00`);
    slots.push(`${pad(h)}:30`);
  }
  return slots;
}

export default function WeeklyGrid({ value = new Set(), onChange, activeColor = "green", startHour = 7, endHour = 17 }) {
  const slots = buildSlots(startHour, endHour);
  const dragging = useRef(false);
  const dragMode = useRef("add"); // "add" | "remove"

  const activeCell = activeColor === "red"
    ? "bg-red-400 border-red-400"
    : "bg-green-400 border-green-400";

  useEffect(() => {
    const up = () => { dragging.current = false; };
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, []);

  const applyCell = (key, currentValue) => {
    const next = new Set(currentValue);
    if (dragMode.current === "add") next.add(key);
    else next.delete(key);
    onChange(next);
  };

  const handleMouseDown = (key, e) => {
    e.preventDefault();
    dragging.current = true;
    dragMode.current = value.has(key) ? "remove" : "add";
    applyCell(key, value);
  };

  const handleMouseEnter = (key) => {
    if (dragging.current) applyCell(key, value);
  };

  // Select entire column (day)
  const toggleDay = (dayNum) => {
    const dayKeys = slots.map(t => `${dayNum}-${t}`);
    const allActive = dayKeys.every(k => value.has(k));
    const next = new Set(value);
    dayKeys.forEach(k => allActive ? next.delete(k) : next.add(k));
    onChange(next);
  };

  // Select entire row (time slot across all days)
  const toggleSlot = (time) => {
    const rowKeys = DAYS.map(d => `${d.num}-${time}`);
    const allActive = rowKeys.every(k => value.has(k));
    const next = new Set(value);
    rowKeys.forEach(k => allActive ? next.delete(k) : next.add(k));
    onChange(next);
  };

  return (
    <div className="overflow-x-auto select-none" onMouseLeave={() => { dragging.current = false; }}>
      <table className="border-collapse w-full" style={{ minWidth: 300 }}>
        <thead>
          <tr>
            <th className="w-12" />
            {DAYS.map(d => (
              <th key={d.num} className="pb-1 px-0.5" style={{ minWidth: 44 }}>
                <button
                  onClick={() => toggleDay(d.num)}
                  className="w-full text-center text-xs font-bold text-gray-600 hover:text-[#400070] transition-colors py-1"
                >
                  {d.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((time) => {
            const isHour = time.endsWith(":00");
            const hour = parseInt(time.split(":")[0]);
            return (
              <tr key={time}>
                <td className="pr-1.5 text-right" style={{ width: 44 }}>
                  {isHour ? (
                    <button
                      onClick={() => toggleSlot(time)}
                      className="text-gray-400 hover:text-[#400070] transition-colors whitespace-nowrap"
                      style={{ fontSize: 10 }}
                    >
                      {formatHour(hour)}
                    </button>
                  ) : (
                    <div style={{ fontSize: 9, color: "#ccc" }}>:30</div>
                  )}
                </td>
                {DAYS.map(d => {
                  const key = `${d.num}-${time}`;
                  const active = value.has(key);
                  return (
                    <td key={d.num} className="p-0.5">
                      <div
                        className={`rounded-sm border cursor-pointer transition-colors ${
                          active
                            ? `${activeCell}`
                            : "bg-gray-100 border-gray-200 hover:bg-gray-200"
                        } ${isHour ? "border-t-gray-300" : ""}`}
                        style={{ height: 14 }}
                        onMouseDown={(e) => handleMouseDown(key, e)}
                        onMouseEnter={() => handleMouseEnter(key)}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2 text-center">
        Click or drag to select · Click day/time labels to select entire column/row
      </p>
    </div>
  );
}