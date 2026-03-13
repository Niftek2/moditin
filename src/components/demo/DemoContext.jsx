import React, { createContext, useContext, useState, useCallback } from "react";

const DemoContext = createContext(null);

// Seed data — realistic but fictional
const SEED_DATA = {
  students: [
    { id: "demo-s1", studentInitials: "A.T.", gradeBand: "3-5", communicationModality: "LSL", readingLevelBand: "Developing (3-5)", colorTag: "blue", serviceDeliveryModel: "InPerson", iepAnnualReviewDate: "2026-04-15", directMinutes: 30, directMinutesFrequency: "Weekly", indirectMinutes: 15, indirectMinutesFrequency: "Weekly", notes: "", displayOrder: 0 },
    { id: "demo-s2", studentInitials: "M.R.", gradeBand: "6-8", communicationModality: "ASL", readingLevelBand: "Expanding (6-8)", colorTag: "purple", serviceDeliveryModel: "Hybrid", iepAnnualReviewDate: "2026-03-28", directMinutes: 45, directMinutesFrequency: "Weekly", indirectMinutes: 20, indirectMinutesFrequency: "Monthly", notes: "", displayOrder: 1 },
    { id: "demo-s3", studentInitials: "L.K.", gradeBand: "K", communicationModality: "Total Communication", readingLevelBand: "Emergent (PreK-K)", colorTag: "green", serviceDeliveryModel: "InPerson", iepAnnualReviewDate: "2026-05-10", directMinutes: 60, directMinutesFrequency: "Weekly", indirectMinutes: 30, indirectMinutesFrequency: "Weekly", notes: "", displayOrder: 2 },
    { id: "demo-s4", studentInitials: "D.N.", gradeBand: "9-12", communicationModality: "Spoken English + ASL", readingLevelBand: "Academic (9-12)", colorTag: "orange", serviceDeliveryModel: "Telepractice", iepAnnualReviewDate: "2026-06-01", directMinutes: 30, directMinutesFrequency: "Weekly", indirectMinutes: 15, indirectMinutesFrequency: "Monthly", notes: "", displayOrder: 3 },
    { id: "demo-s5", studentInitials: "C.W.", gradeBand: "1-2", communicationModality: "LSL", readingLevelBand: "Early (1-2)", colorTag: "pink", serviceDeliveryModel: "InPerson", iepAnnualReviewDate: "2026-03-20", directMinutes: 45, directMinutesFrequency: "Weekly", indirectMinutes: 0, indirectMinutesFrequency: "Weekly", notes: "", displayOrder: 4 },
  ],
  calendarEvents: [
    { id: "demo-e1", title: "A.T. — Direct Service", eventType: "DirectService", startDateTime: "2026-03-13T09:00:00", endDateTime: "2026-03-13T09:30:00", setting: "InPerson", studentId: "demo-s1", studentInitials: "A.T." },
    { id: "demo-e2", title: "M.R. — Direct Service", eventType: "DirectService", startDateTime: "2026-03-13T10:00:00", endDateTime: "2026-03-13T10:45:00", setting: "Hybrid", studentId: "demo-s2", studentInitials: "M.R." },
    { id: "demo-e3", title: "IEP Meeting — C.W.", eventType: "IEPMeeting", startDateTime: "2026-03-14T13:00:00", endDateTime: "2026-03-14T14:00:00", setting: "InPerson", studentId: "demo-s5", studentInitials: "C.W." },
    { id: "demo-e4", title: "L.K. — Direct Service", eventType: "DirectService", startDateTime: "2026-03-17T09:00:00", endDateTime: "2026-03-17T10:00:00", setting: "InPerson", studentId: "demo-s3", studentInitials: "L.K." },
    { id: "demo-e5", title: "D.N. — Telepractice", eventType: "DirectService", startDateTime: "2026-03-18T14:00:00", endDateTime: "2026-03-18T14:30:00", setting: "Telepractice", studentId: "demo-s4", studentInitials: "D.N." },
    { id: "demo-e6", title: "IEP Meeting — M.R.", eventType: "IEPMeeting", startDateTime: "2026-03-28T11:00:00", endDateTime: "2026-03-28T12:00:00", setting: "InPerson", studentId: "demo-s2", studentInitials: "M.R." },
  ],
  services: [
    { id: "demo-sv1", studentId: "demo-s1", studentInitials: "A.T.", sessionDate: "2026-03-10", durationMinutes: 30, sessionType: "Direct", notes: "Auditory discrimination practice. Good focus today.", created_date: "2026-03-10T10:00:00" },
    { id: "demo-sv2", studentId: "demo-s2", studentInitials: "M.R.", sessionDate: "2026-03-11", durationMinutes: 45, sessionType: "Direct", notes: "ASL vocabulary expansion. Introduced 12 new signs.", created_date: "2026-03-11T10:30:00" },
    { id: "demo-sv3", studentId: "demo-s3", studentInitials: "L.K.", sessionDate: "2026-03-12", durationMinutes: 60, sessionType: "Direct", notes: "Listening comprehension with picture supports.", created_date: "2026-03-12T09:00:00" },
    { id: "demo-sv4", studentId: "demo-s4", studentInitials: "D.N.", sessionDate: "2026-03-07", durationMinutes: 30, sessionType: "Direct", notes: "Self-advocacy skills. Role-played talking to teachers.", created_date: "2026-03-07T14:00:00" },
    { id: "demo-sv5", studentId: "demo-s5", studentInitials: "C.W.", sessionDate: "2026-03-06", durationMinutes: 45, sessionType: "Direct", notes: "Phonological awareness activities. Rhyming word pairs.", created_date: "2026-03-06T09:30:00" },
  ],
  goals: [
    { id: "demo-g1", studentId: "demo-s1", goalText: "A.T. will identify environmental sounds in a closed set of 4 with 80% accuracy across 3 sessions.", domain: "Auditory Skills", status: "Active", targetDate: "2026-06-01" },
    { id: "demo-g2", studentId: "demo-s2", goalText: "M.R. will use 3 self-advocacy strategies when they cannot hear the teacher with 90% accuracy.", domain: "Self-Advocacy", status: "Active", targetDate: "2026-06-01" },
    { id: "demo-g3", studentId: "demo-s3", goalText: "L.K. will follow 2-step directions given verbally without visual cues in 8/10 trials.", domain: "Listening Skills", status: "Active", targetDate: "2026-05-15" },
    { id: "demo-g4", studentId: "demo-s4", goalText: "D.N. will demonstrate use of FM system independently in all academic settings 4/5 days per week.", domain: "Technology Use", status: "Mastered", targetDate: "2026-03-01" },
  ],
  reminders: [
    { id: "demo-r1", title: "IEP Annual Review — C.W.", dueDateTime: "2026-03-20T09:00:00", priority: "High", status: "Pending", description: "Prepare progress data and draft goals." },
    { id: "demo-r2", title: "IEP Annual Review — M.R.", dueDateTime: "2026-03-28T09:00:00", priority: "High", status: "Pending", description: "Coordinate with interpreter." },
    { id: "demo-r3", title: "Order replacement earmolds — A.T.", dueDateTime: "2026-03-25T12:00:00", priority: "Medium", status: "Pending", description: "" },
    { id: "demo-r4", title: "Submit mileage log for February", dueDateTime: "2026-03-15T17:00:00", priority: "Medium", status: "Completed", description: "", completedAt: "2026-03-10T10:00:00" },
  ],
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function DemoProvider({ children }) {
  // Initialize immediately from URL so queries never fire against real data
  const [isDemoMode, setIsDemoMode] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "1"
  );
  const [demoData, setDemoData] = useState(deepClone(SEED_DATA));

  const enterDemo = useCallback(() => {
    setDemoData(deepClone(SEED_DATA));
    setIsDemoMode(true);
  }, []);

  const exitDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoData(deepClone(SEED_DATA));
  }, []);

  const resetDemo = useCallback(() => {
    setDemoData(deepClone(SEED_DATA));
  }, []);

  return (
    <DemoContext.Provider value={{ isDemoMode, demoData, enterDemo, exitDemo, resetDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}