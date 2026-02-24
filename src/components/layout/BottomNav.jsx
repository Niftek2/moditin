import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Users, CalendarDays, Bell } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { label: "Students", icon: Users, page: "Students" },
  { label: "Calendar", icon: CalendarDays, page: "Calendar" },
  { label: "Reminders", icon: Bell, page: "Reminders" },
];

export default function BottomNav({ currentPage }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-[var(--modal-border)] flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ label, icon: Icon, page }) => {
        const active = currentPage === page;
        return (
          <Link
            key={page}
            to={createPageUrl(page)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors select-none
              ${active ? "text-[var(--modal-purple)]" : "text-[var(--modal-text-muted)]"}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={`w-5 h-5 ${active ? "text-[var(--modal-purple)]" : "text-[var(--modal-text-muted)]"}`}
              aria-hidden="true"
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}