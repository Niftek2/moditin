import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { useScrollRestore } from "../components/shared/useScrollRestore";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import {
  Target, Clock, Car, CalendarDays, FileText, ClipboardList, Plus, Ear, Zap, Search, ChevronRight, Activity, GripVertical } from
"lucide-react";
import HearingAidIcon from "../components/shared/HearingAidIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DailyQuote from "../components/shared/DailyQuote";
import { format, parseISO, isToday, isTomorrow, addDays, isWithinInterval } from "date-fns";
import { EVENT_COLORS } from "../components/calendar/calendarUtils";
import { getColorForStudent } from "../components/utils/colorMapping";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function Dashboard() {
  useScrollRestore("Dashboard");
  const [user, setUser] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [focusSearchResult, setFocusSearchResult] = useState(false);
  const [studentOrder, setStudentOrder] = useState([]);
  const queryClient = useQueryClient();
  const handleRefresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["students"] }),
    queryClient.invalidateQueries({ queryKey: ["services-dash"] }),
    queryClient.invalidateQueries({ queryKey: ["calendarEvents-dash"] }),
  ]);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u && !u.firstName) {
        window.location.href = "/Onboarding";
      }
    }).catch(() => {});
  }, []);

  const firstName = user?.firstName || "";

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list()
  });

  // Initialize studentOrder from displayOrder or ID order
  useEffect(() => {
    const ordered = [...students].sort((a, b) => {
      const orderA = a.displayOrder ?? students.indexOf(a);
      const orderB = b.displayOrder ?? students.indexOf(b);
      return orderA - orderB;
    });
    setStudentOrder(ordered.map(s => s.id));
  }, [students]);

  const { data: services = [] } = useQuery({
    queryKey: ["services-dash"],
    queryFn: () => base44.entities.ServiceEntry.list("-created_date", 50)
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ["calendarEvents-dash"],
    queryFn: () => base44.entities.CalendarEvent.list("-startDateTime", 100)
  });

  const now = new Date();
  const iepsThisMonth = students.filter((s) => {
    const reviewDate = s.iepAnnualReviewDate;
    if (!reviewDate) return false;
    const d = parseISO(reviewDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const todayEvents = calendarEvents.
  filter((e) => isToday(parseISO(e.startDateTime))).
  sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  const nextEvent = calendarEvents.
  filter((e) => new Date(e.startDateTime) > now).
  sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))[0];

  // Handle drag end for student reordering
  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.index === destination.index) return;

    const reordered = Array.from(displayedStudents);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    // Update display order
    Promise.all(reordered.map((s, idx) => 
      base44.entities.Student.update(s.id, { displayOrder: idx })
    )).catch(err => console.error("Failed to update student order:", err));
  };

  // Filtered students for recent view
  const filteredStudents = students.filter((s) =>
  s.studentInitials?.toLowerCase().includes(studentSearch.toLowerCase()) ||
  s.gradeBand?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Get "recent" students sorted by displayOrder
  const displayedStudents = studentSearch 
    ? filteredStudents.slice(0, 5)
    : filteredStudents
        .sort((a, b) => {
          const orderA = a.displayOrder ?? students.indexOf(a);
          const orderB = b.displayOrder ?? students.indexOf(b);
          return orderA - orderB;
        })
        .slice(0, 5);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}>

        <h1 className="text-3xl font-bold text-[var(--modal-text)]">
          {firstName ? `Hi, ${firstName} 👋` : "Hi there 👋"}
        </h1>
        
        <DailyQuote />
      </motion.div>

      {/* BLOCK A: TODAY */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="modal-card p-6 space-y-4"
        role="region"
        aria-labelledby="today-heading">

        <h2 id="today-heading" className="text-lg font-bold text-[var(--modal-text)]">Today</h2>
        
        {/* Big metrics row */}
        <div className="grid grid-cols-3 gap-3 mb-4" role="group" aria-label="Today's quick metrics">
          <div className="text-center p-4 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
            <p className="text-2xl font-bold text-[#6B2FB9]" aria-label="Sessions today">{todayEvents.length}</p>
            <p className="text-xs text-[var(--modal-text-muted)] mt-1">Sessions</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
            <p className="text-2xl font-bold text-[#6B2FB9]" aria-label="IEPs due this month">{iepsThisMonth}</p>
            <p className="text-xs text-[var(--modal-text-muted)] mt-1">IEPs This Month</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[#F7F3FA] border border-[var(--modal-border)]">
            <p className="text-lg font-bold text-[#6B2FB9]" aria-label="Next appointment">{nextEvent ? format(parseISO(nextEvent.startDateTime), "h:mm a") : "—"}</p>
            <p className="text-xs text-[var(--modal-text-muted)] mt-1">Next Up</p>
          </div>
        </div>

        {/* Primary CTA buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link to={createPageUrl("ServiceHours")} className="w-full">
            <Button className="w-full bg-[#400070] hover:bg-[#5B00A0] text-white rounded-xl h-12" aria-label="Log a new session">
              <Clock className="w-4 h-4 mr-2" aria-hidden="true" /> Log Session
            </Button>
          </Link>
          <Link to={createPageUrl("Calendar")} className="w-full">
            <Button variant="outline" className="w-full border-[var(--modal-border)] text-[var(--modal-text)] hover:text-[#400070] rounded-xl h-12" aria-label="View your schedule">
              <CalendarDays className="w-4 h-4 mr-2" aria-hidden="true" /> View Schedule
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
        role="region"
        aria-labelledby="actions-heading">

        <h2 id="actions-heading" className="text-lg font-bold text-[var(--modal-text)]">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl("ServiceHours")} className="modal-card p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]">
            <Clock className="w-6 h-6 text-[#6B2FB9] mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-bold text-[var(--modal-text)]">Log a Session</p>
          </Link>
          <Link to={createPageUrl("Worksheets")} className="modal-card p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]">
            <FileText className="w-6 h-6 text-[#6B2FB9] mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-bold text-[var(--modal-text)]">Worksheet Generator</p>
          </Link>
          <Link to={createPageUrl("GoalBank")} className="modal-card p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]">
            <Target className="w-6 h-6 text-[#6B2FB9] mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-bold text-[var(--modal-text)]">Generate Goal</p>
          </Link>
          <Link to={createPageUrl("InteractiveActivities")} className="modal-card p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]">
            <Zap className="w-6 h-6 text-[#6B2FB9] mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-bold text-[var(--modal-text)]">Interactive Activities</p>
          </Link>
          <Link to={createPageUrl("LabelingActivities")} className="modal-card p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]">
            <Activity className="w-6 h-6 text-[#6B2FB9] mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-bold text-[var(--modal-text)]">Labeling Activities</p>
          </Link>
          </div>
          </motion.div>

      {/* BLOCK C: MY STUDENTS */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="space-y-3"
        role="region"
        aria-labelledby="students-heading">

        <h2 id="students-heading" className="text-lg font-bold text-[var(--modal-text)]">My Students</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--modal-text-muted)]" aria-hidden="true" />
          <Input
            id="student-search"
            placeholder="Search by name or initials..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            aria-label="Search students by name or initials"
            className="pl-10 bg-white border-[var(--modal-border)] rounded-xl h-12" />

        </div>

        {/* Student List */}
        {displayedStudents.length === 0 ?
        <div className="text-center py-8 text-[var(--modal-text-muted)]">
            <p className="text-sm">No students yet</p>
          </div> :

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="students">
            {(provided, snapshot) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2" 
                role="list"
              >
                {displayedStudents.map((s, idx) => {
                  const color = getColorForStudent(s.colorTag || 'pastel-gray');
                  return (
                    <Draggable key={s.id} draggableId={s.id} index={idx}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={snapshot.isDragging ? "opacity-50" : ""}
                        >
                          <Link
                            to={createPageUrl(`StudentDetail?id=${s.id}`)}
                            className="modal-card p-4 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl h-14 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]"
                            style={{ borderLeft: `4px solid ${color.border}` }}
                            role="listitem"
                            aria-label={`${s.studentInitials}, ${s.communicationModality || 'unknown modality'}`}>

                            <div className="flex items-center gap-3 min-w-0">
                              <div 
                                {...provided.dragHandleProps}
                                className="text-[var(--modal-text-muted)] hover:text-[var(--modal-text)] shrink-0 cursor-grab active:cursor-grabbing"
                                aria-hidden="true"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <div 
                                className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0" 
                                style={{ backgroundColor: color.text, color: color.bg }}
                                aria-hidden="true"
                              >
                                {s.studentInitials?.charAt(0) || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[var(--modal-text)] truncate">{s.studentInitials}</p>
                                <p className="text-xs text-[var(--modal-text-muted)]">{s.communicationModality || "—"} • {s.readingLevelBand || "—"}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--modal-border)] shrink-0" aria-hidden="true" />
                          </Link>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        }
      </motion.div>
    </div>
    </PullToRefresh>
  );
}