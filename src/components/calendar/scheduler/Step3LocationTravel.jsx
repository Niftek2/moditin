import React from "react";
import { MapPin, ArrowLeftRight, Info } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Step3LocationTravel({ students, locationTravel, onChange }) {
  const locations = [...new Set(students.map(s => s.locationId).filter(Boolean))].sort();
  const noLocation = students.filter(s => !s.locationId);

  const pairs = [];
  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      pairs.push([locations[i], locations[j]]);
    }
  }

  const grouped = locations.reduce((acc, loc) => {
    acc[loc] = students.filter(s => s.locationId === loc);
    return acc;
  }, {});

  const getTravel = (a, b) => locationTravel[`${a}|${b}`] ?? locationTravel[`${b}|${a}`] ?? "";

  const setTravel = (a, b, val) => {
    const minutes = val === "" ? "" : Math.max(0, parseInt(val) || 0);
    onChange(prev => ({
      ...prev,
      [`${a}|${b}`]: minutes,
      [`${b}|${a}`]: minutes,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-[var(--modal-text)] mb-1">Location Groups & Travel</h3>
        <p className="text-sm text-[var(--modal-text-muted)]">
          Students are grouped by location. The scheduler clusters same-location students on the same days to minimize travel.
          Set travel times between locations to add buffer blocks automatically.
        </p>
      </div>

      {/* Location groups */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Student Groups</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(grouped).map(([loc, locStudents]) => (
            <div key={loc} className="border border-[var(--modal-border)] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-[#400070]" />
                <span className="font-semibold text-sm text-[#400070]">{loc}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {locStudents.length} student{locStudents.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {locStudents.map(s => (
                  <span
                    key={s.id}
                    className="bg-[#F7F3FA] text-[#400070] text-xs px-2 py-1 rounded-lg font-medium"
                  >
                    {s.studentInitials}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {noLocation.length > 0 && (
            <div className="border border-dashed border-gray-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-semibold text-gray-400">No location assigned</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {noLocation.map(s => (
                  <span key={s.id} className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-lg">
                    {s.studentInitials}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Travel time matrix */}
      {pairs.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Travel Time Between Locations</p>
          <div className="border border-[var(--modal-border)] rounded-xl overflow-hidden divide-y divide-[var(--modal-border)]">
            {pairs.map(([a, b]) => (
              <div key={`${a}|${b}`} className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm font-semibold text-[var(--modal-text)] flex-1 truncate">{a}</span>
                <ArrowLeftRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="text-sm font-semibold text-[var(--modal-text)] flex-1 truncate">{b}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Input
                    type="number"
                    min={0}
                    max={180}
                    step={5}
                    value={getTravel(a, b)}
                    onChange={e => setTravel(a, b, e.target.value)}
                    placeholder="0"
                    className="w-16 h-8 text-sm text-center"
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            {locations.length === 0
              ? "No locations are assigned to your students. You can assign locations in each student's profile."
              : "All selected students are at the same location — no travel time needed."}
          </p>
        </div>
      )}
    </div>
  );
}