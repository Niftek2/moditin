import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import {
  Target, Clock, Car, CalendarDays, FileText, ClipboardList, Plus, Ear, Zap, Search, ChevronRight
} from "lucide-react";
import HearingAidIcon from "../components/shared/HearingAidIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO, isToday, isTomorrow, addDays, isWithinInterval } from "date-fns";
import { EVENT_COLORS } from "../components/calendar/calendarUtils";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const firstName = user?.full_name?.split(" ")[0] || "";

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services-dash"],
    queryFn: () => base44.entities.ServiceEntry.list("-created_date", 50),
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ["calendarEvents-dash"],
    queryFn: () => base44.entities.CalendarEvent.list("-startDateTime", 100),
  });

  const now = new Date();
  const todayEvents = calendarEvents
    .filter(e => isToday(parseISO(e.startDateTime)))
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  const nextEvent = calendarEvents
    .filter(e => new Date(e.startDateTime) > now)
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))[0];

  // Filtered students for recent view
  const filteredStudents = students.filter(s =>
    s.studentInitials?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.gradeBand?.toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 5);

  // Get "recent" students (last 5 by creation)
  const recentStudents = studentSearch ? filteredStudents : students.slice(0, 5);

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--modal-text)]">
              {firstName ? `👋 Welcome back, ${firstName}` : "👋 Welcome back"}
            </h1>
            <p className="text-sm text-[var(--modal-text-muted)] mt-1">
              Here's your overview for the month.
            </p>
          </div>
          <Link to={createPageUrl("MyDay")}>
            <Button className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2 shrink-0">
              <Sun className="w-4 h-4" /> My Day
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Today + Week at a Glance */}
      <TodayAtAGlance calendarEvents={calendarEvents} />
      <WeekAtAGlance calendarEvents={calendarEvents} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard icon={Users} label="Active Students" value={students.length} page="Students" delay={0} />
        <StatCard icon={Target} label="Active Goals" value={goals.filter(g => g.status === "Active").length} page="GoalBank" delay={0.05} />
        <StatCard icon={HearingAidIcon} label="Equipment Items" value={equipment.length} page="Equipment" delay={0.1} />
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <QuickAction icon={Clock} label="Log Service" page="ServiceHours" delay={0.2} />
          <QuickAction icon={CalendarDays} label="Plan Activity" page="ActivityPlanner" delay={0.22} />
          <QuickAction icon={Car} label="Log Mileage" page="Mileage" delay={0.24} />
          <QuickAction icon={FileText} label="Worksheets" page="Worksheets" delay={0.26} />
          <QuickAction icon={ClipboardList} label="Testing" page="TestingDecisions" delay={0.28} />
          <QuickAction icon={Ear} label="Listening Check" page="Ling6Check" delay={0.30} />
          <QuickAction icon={Zap} label="Interactive Activity" page="InteractiveActivities" delay={0.32} />
        </div>
      </div>

      {/* Calendar Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Today's Schedule */}
        <div className="modal-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider">Today's Schedule</h2>
            <Link to={createPageUrl("Calendar")} className="text-xs text-[#6B2FB9] hover:underline font-medium">View calendar</Link>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-[var(--modal-text-muted)] text-center py-6">No events scheduled today</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.map(e => {
                const colors = EVENT_COLORS[e.eventType] || EVENT_COLORS.Other;
                return (
                  <div key={e.id} className={`flex items-center gap-3 p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
                    <div className={`w-1.5 h-10 rounded-full`} style={{ backgroundColor: colors.dot }} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${colors.text}`}>{e.title}</p>
                      <p className={`text-xs ${colors.text} opacity-75`}>
                        {format(parseISO(e.startDateTime), "h:mm a")} – {format(parseISO(e.endDateTime), "h:mm a")}
                        {e.studentInitials ? ` · ${e.studentInitials}` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/70 ${colors.text}`}>
                      {EVENT_TYPE_LABELS[e.eventType]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Next Appointment + IEP alerts */}
        <div className="space-y-4">
          <div className="modal-card p-5">
            <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider mb-3">Next Appointment</h2>
            {nextEvent ? (
              <div>
                <p className="text-sm font-bold text-[var(--modal-text)]">{nextEvent.title}</p>
                <p className="text-xs text-[var(--modal-text-muted)] mt-1">
                  {isToday(parseISO(nextEvent.startDateTime)) ? "Today" : isTomorrow(parseISO(nextEvent.startDateTime)) ? "Tomorrow" : format(parseISO(nextEvent.startDateTime), "MMM d")}
                  {" · "}{format(parseISO(nextEvent.startDateTime), "h:mm a")}
                </p>
                {nextEvent.studentInitials && (
                  <p className="text-xs text-[#6B2FB9] font-semibold mt-1">{nextEvent.studentInitials}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--modal-text-muted)]">No upcoming appointments</p>
            )}
          </div>

          <div className="modal-card p-5">
            <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider mb-3">IEP Reviews (30 days)</h2>
            {upcomingIEPs.length === 0 ? (
              <p className="text-sm text-[var(--modal-text-muted)]">None in next 30 days</p>
            ) : (
              <div className="space-y-2">
                {upcomingIEPs.slice(0, 4).map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--modal-text)]">{s.studentInitials}</p>
                      <p className="text-xs text-[var(--modal-text-muted)]">{format(parseISO(s.iepAnnualReviewDate), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Service Entries */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.35 }}
        className="modal-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-[#400070] uppercase tracking-wider">Recent Service Entries</h2>
          <Link to={createPageUrl("ServiceHours")} className="text-xs text-[#6B2FB9] hover:underline font-medium">
            View all
          </Link>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-[#EADDF5] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-[#6B2FB9]" />
            </div>
            <p className="text-sm font-medium text-[var(--modal-text)] mb-1">📋 No service entries yet</p>
            <p className="text-xs text-[var(--modal-text-muted)] mb-4">
              Start logging your first service to see monthly totals here.
            </p>
            <Link to={createPageUrl("ServiceHours")}>
              <Button className="bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl gap-2" size="sm">
                <Plus className="w-3.5 h-3.5" /> Log Service
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--modal-border)]">
            {services.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-[var(--modal-text)]">
                    {entry.category?.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p className="text-xs text-[var(--modal-text-muted)]">{entry.date}</p>
                </div>
                <span className="text-sm font-semibold text-[#6B2FB9]">{entry.minutes} min</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}