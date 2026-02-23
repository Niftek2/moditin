import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Search, X, LayoutDashboard, Users, Target, ClipboardCheck, ClipboardList, Clock, Car, Ear, Zap, CalendarDays, FileText, Settings, Bell, Sun } from "lucide-react";

const searchItems = [
  { label: "Dashboard", description: "Overview & quick stats", page: "Dashboard", icon: LayoutDashboard, keywords: ["home", "overview", "stats"] },
  { label: "Calendar", description: "Schedule & appointments", page: "Calendar", icon: CalendarDays, keywords: ["schedule", "appointments", "events", "iep dates", "reminders"] },
  { label: "Students", description: "Manage your student caseload", page: "Students", icon: Users, keywords: ["caseload", "kids", "roster"] },
  { label: "Goal Bank", description: "Browse & create IEP goals", page: "GoalBank", icon: Target, keywords: ["iep", "goals", "objectives"] },
  { label: "Accommodations", description: "Student accommodations library", page: "Accommodations", icon: ClipboardCheck, keywords: ["504", "modifications", "supports"] },
  { label: "Testing Decisions", description: "Assessment tool guidance", page: "TestingDecisions", icon: ClipboardList, keywords: ["assessment", "evaluation", "tests"] },
  { label: "Service Hours", description: "Log & track service time", page: "ServiceHours", icon: Clock, keywords: ["time", "log", "minutes", "hours", "timer"] },
  { label: "Mileage", description: "Track travel mileage", page: "Mileage", icon: Car, keywords: ["travel", "drive", "miles"] },
  { label: "Equipment", description: "Hearing equipment & logs", page: "Equipment", icon: null, keywords: ["hearing aids", "cochlear", "fm", "baha"] },
  { label: "Listening Check", description: "Ling 6 sound check", page: "Ling6Check", icon: Ear, keywords: ["ling", "sound", "hearing", "check", "ling6"] },
  { label: "Interactive Activities", description: "Live therapy activities", page: "InteractiveActivities", icon: Zap, keywords: ["activities", "games", "therapy", "interactive"] },
  { label: "Activity Planner", description: "Plan therapy sessions", page: "ActivityPlanner", icon: CalendarDays, keywords: ["plan", "session", "schedule"] },
  { label: "Worksheets", description: "Generate printable worksheets", page: "Worksheets", icon: FileText, keywords: ["print", "handout", "worksheet"] },
  { label: "Settings", description: "Account & subscription", page: "Settings", icon: Settings, keywords: ["account", "profile", "billing", "subscription"] },
];

export default function GlobalSearch({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const results = query.trim()
    ? searchItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : searchItems;

  const handleSelect = (page) => {
    navigate(createPageUrl(page));
    setOpen(false);
    setQuery("");
    if (onNavigate) onNavigate();
  };

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)] text-sm text-[var(--modal-text-muted)] hover:border-[#C4A8E8] hover:bg-[#EADDF5] transition-all"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-[var(--modal-text-muted)] bg-white border border-[var(--modal-border)] rounded px-1.5 py-0.5">⌘K</kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[var(--modal-border)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--modal-border)]">
              <Search className="w-5 h-5 text-[#6B2FB9] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages and features..."
                className="flex-1 bg-transparent text-[var(--modal-text)] placeholder:text-[var(--modal-text-muted)] text-sm outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-[var(--modal-text-muted)] hover:text-[var(--modal-text)]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {results.length === 0 ? (
                <p className="text-center text-sm text-[var(--modal-text-muted)] py-8">No results found</p>
              ) : (
                results.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleSelect(item.page)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F3FA] transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#EADDF5] flex items-center justify-center shrink-0">
                      {item.icon ? (
                        <item.icon className="w-4 h-4 text-[#6B2FB9]" />
                      ) : (
                        <span className="text-[#6B2FB9] text-xs font-bold">HA</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--modal-text)]">{item.label}</p>
                      <p className="text-xs text-[var(--modal-text-muted)]">{item.description}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}