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
  const [focusSearchResult, setFocusSearchResult] = useState(false);

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
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-[var(--modal-text)]">
          {firstName ? `Welcome, ${firstName}` : "Welcome"}
        </h1>
        <p className="text-sm text-[var(--modal-text-muted)] mt-1">Quick access to students and your tasks</p>
      </motion.div>

      {/* BLOCK A: TODAY */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="modal-card p-6 space-y-4"
      >
        <h2 className="text-lg font-bold text-[var(--modal-text)]">Today</h2>
        
        {/* Big metrics row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-4 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
            <p className="text-2xl font-bold text-[#6B2FB9]">{todayEvents.length}</p>
            <p className="text-xs text-[var(--modal-text-muted)] mt-1">Sessions</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
            <p className="text-2xl font-bold text-[#6B2FB9]">—</p>
            <p className="text-xs text-[var(--modal-text-muted)] mt-1">Notes Due</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
            <p className="text-lg font-bold text-[#6B2FB9]">{nextEvent ? format(parseISO(nextEvent.startDateTime), "h:mm a") : "—"}</p>
            <p className="text-xs text-[var(--modal-text-muted)] mt-1">Next Up</p>
          </div>
        </div>

        {/* Primary CTA buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link to={createPageUrl("ServiceHours")} className="w-full">
            <Button className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl">
              <Clock className="w-4 h-4 mr-2" /> Log Session
            </Button>
          </Link>
          <Link to={createPageUrl("Calendar")} className="w-full">
            <Button variant="outline" className="w-full border-[var(--modal-border)] text-[var(--modal-text)] hover:text-[#400070] rounded-xl">
              <CalendarDays className="w-4 h-4 mr-2" /> View Schedule
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* BLOCK B: QUICK ACTIONS */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-bold text-[var(--modal-text)]">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl("ServiceHours")} className="modal-card p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl">
            <Clock className="w-6 h-6 text-[#6B2FB9] mx-auto mb-2" />
            <p className="text-sm font-bold text-[var(--modal-text)]">Log a Session</p>
          </Link>
          <Link to={createPageUrl("Worksheets")} className="modal-card p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl">
            <FileText className="w-6 h-6 text-[#6B2FB9] mx-auto mb-2" />
            <p className="text-sm font-bold text-[var(--modal-text)]">Write Notes</p>
          </Link>
          <Link to={createPageUrl("GoalBank")} className="modal-card p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl">
            <Target className="w-6 h-6 text-[#6B2FB9] mx-auto mb-2" />
            <p className="text-sm font-bold text-[var(--modal-text)]">Generate Goal</p>
          </Link>
          <Link to={createPageUrl("ActivityPlanner")} className="modal-card p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl">
            <Zap className="w-6 h-6 text-[#6B2FB9] mx-auto mb-2" />
            <p className="text-sm font-bold text-[var(--modal-text)]">Plan Activity</p>
          </Link>
        </div>
      </motion.div>

      {/* BLOCK C: MY STUDENTS */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-bold text-[var(--modal-text)]">My Students</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--modal-text-muted)]" />
          <Input
            placeholder="Search by name or initials..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="pl-10 bg-white/5 border-[var(--modal-border)] rounded-xl h-10"
          />
        </div>

        {/* Student List */}
        {recentStudents.length === 0 ? (
          <div className="text-center py-8 text-[var(--modal-text-muted)]">
            <p className="text-sm">No students yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentStudents.map(s => (
              <Link
                key={s.id}
                to={createPageUrl(`StudentDetail?id=${s.id}`)}
                className="modal-card p-4 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#400070] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {s.studentInitials?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--modal-text)] truncate">{s.studentInitials}</p>
                    <p className="text-xs text-[var(--modal-text-muted)]">{s.communicationModality || "—"} • {s.readingLevelBand || "—"}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--modal-border)] shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}