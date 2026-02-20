import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  LayoutDashboard,
  Users,
  Target,
  ClipboardCheck,
  TestTube2,
  Clock,
  Car,
  Headphones,
  CalendarDays,
  FileText,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Students", icon: Users, page: "Students" },
  { name: "Goal Bank", icon: Target, page: "GoalBank" },
  { name: "Accommodations", icon: ClipboardCheck, page: "Accommodations" },
  { name: "Testing", icon: TestTube2, page: "TestingDecisions" },
  { name: "Service Hours", icon: Clock, page: "ServiceHours" },
  { name: "Mileage", icon: Car, page: "Mileage" },
  { name: "Equipment", icon: Headphones, page: "Equipment" },
  { name: "Activity Planner", icon: CalendarDays, page: "ActivityPlanner" },
  { name: "Worksheets", icon: FileText, page: "Worksheets" },
];

export default function Sidebar({ currentPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 pb-6 border-b border-[var(--modal-border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl modal-gradient flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Modal Itinerant</h1>
            <p className="text-[10px] text-[var(--modal-text-muted)] tracking-widest uppercase">Education Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group
                ${isActive 
                  ? "bg-[#400070]/30 text-white border border-[#400070]/50" 
                  : "text-[var(--modal-text-muted)] hover:text-white hover:bg-white/5"
                }
              `}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-[var(--modal-purple-glow)]" : "text-[var(--modal-text-muted)] group-hover:text-white"}`} />
              <span className="flex-1">{item.name}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-[var(--modal-purple-glow)]" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--modal-border)]">
        <Link
          to={createPageUrl("Settings")}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
            ${currentPage === "Settings" 
              ? "bg-[#400070]/30 text-white border border-[#400070]/50" 
              : "text-[var(--modal-text-muted)] hover:text-white hover:bg-white/5"
            }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--modal-text-muted)] hover:text-red-400 hover:bg-red-500/5 w-full transition-all"
        >
          <LogOut className="w-4 h-4" />
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[var(--modal-card)] border border-[var(--modal-border)] text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-[var(--modal-bg)] border-r border-[var(--modal-border)]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[var(--modal-bg)] border-r border-[var(--modal-border)]">
        {navContent}
      </aside>
    </>
  );
}