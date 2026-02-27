import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Target,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Car,
  CalendarDays,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  Ear,
  Zap,
  Bell,
  Sun,
  Activity
} from "lucide-react";
import HearingAidIcon from "../shared/HearingAidIcon";
import GlobalSearch from "../shared/GlobalSearch";
import { base44 } from "@/api/base44Client";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "My Day", icon: Sun, page: "MyDay" },
  { name: "Calendar", icon: CalendarDays, page: "Calendar" },
  { name: "Reminders", icon: Bell, page: "Reminders" },
  { name: "Students", icon: Users, page: "Students" },
  { name: "Goal Writing", icon: Target, page: "GoalBank" },
  { name: "Accommodations", icon: ClipboardCheck, page: "Accommodations" },
  { name: "Testing", icon: ClipboardList, page: "TestingDecisions" },
  { name: "Service Hours", icon: Clock, page: "ServiceHours" },
  { name: "Mileage", icon: Car, page: "Mileage" },
  { name: "Equipment", icon: null, page: "Equipment" },
  { name: "Listening Check", icon: Ear, page: "Ling6Check" },
  { name: "Activities", icon: Zap, page: "InteractiveActivities" },
  { name: "Labeling Activities", icon: Activity, page: "LabelingActivities" },
  { name: "Worksheets", icon: FileText, page: "Worksheets" },
];

export default function Sidebar({ currentPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleLogout = () => {
    // Purge all in-memory cached query data before logout
    queryClient.clear();
    // Clear all persistent caches
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    try {
      if (window.indexedDB && window.indexedDB.databases) {
        window.indexedDB.databases().then(dbs => {
          dbs.forEach(db => window.indexedDB.deleteDatabase(db.name));
        }).catch(() => {});
      }
    } catch {}
    base44.auth.logout();
  };

  const navContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-2">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/f8b2256fa_modalitinerantlogo2.png"
          alt="Modal Itinerant"
          className="h-12 object-contain"
        />
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <GlobalSearch onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin min-h-0">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={() => setMobileOpen(false)}
              className={`
                relative flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all duration-200 group
                ${isActive
                  ? "bg-[#EADDF5] text-[#400070]"
                  : "text-[#4A4A4A] hover:text-[#400070] hover:bg-[#F7F3FA]"
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#6B2FB9]" />
              )}
              {item.icon ? (
                <item.icon
                  className={`w-5 h-5 ${isActive ? "text-[#6B2FB9]" : "text-[#5A5A5A] group-hover:text-[#6B2FB9]"}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              ) : (
                <HearingAidIcon size={20} strokeColor={isActive ? "#6B2FB9" : "#5A5A5A"} />
              )}
              <span className={`flex-1 ${isActive ? "font-semibold" : "font-medium"}`}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--modal-border)]">
        <Link
          to={createPageUrl("Settings")}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all
            ${currentPage === "Settings"
              ? "bg-[#EADDF5] text-[#400070] font-semibold"
              : "text-[#4A4A4A] hover:text-[#400070] hover:bg-[#F7F3FA]"
            }`}
        >
          <Settings className={`w-5 h-5 ${currentPage === "Settings" ? "text-[#6B2FB9]" : "text-[#5A5A5A]"}`} />
          <span className="font-medium">Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#4A4A4A] hover:text-red-500 hover:bg-red-50 w-full transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white border border-[var(--modal-border)] text-[#400070] shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="w-72 h-full bg-white border-r border-[var(--modal-border)] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-[#6F6F6F] hover:text-[#400070] z-10">
              <X className="w-5 h-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[var(--modal-border)] pt-1">
        {navContent}
      </aside>
    </>
  );
}