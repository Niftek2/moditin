import React, { createContext, useContext, useState, useCallback } from "react";

const DemoContext = createContext(null);

// Seed data — realistic but fictional
const SEED_DATA = {
  students: [
    { id: "demo-s1", studentInitials: "A.T.", gradeBand: "3-5", communicationModality: "LSL", readingLevelBand: "Developing (3-5)", colorTag: "blue", serviceDeliveryModel: "InPerson", iepAnnualReviewDate: "2026-04-15", directMinutes: 30, directMinutesFrequency: "Weekly", indirectMinutes: 15, indirectMinutesFrequency: "Weekly", notes: "", displayOrder: 0, primaryEligibility: "Hearing Impairment", schoolCode: "RDGE" },
    { id: "demo-s2", studentInitials: "M.R.", gradeBand: "6-8", communicationModality: "ASL", readingLevelBand: "Expanding (6-8)", colorTag: "purple", serviceDeliveryModel: "Hybrid", iepAnnualReviewDate: "2026-03-28", directMinutes: 45, directMinutesFrequency: "Weekly", indirectMinutes: 20, indirectMinutesFrequency: "Monthly", notes: "", displayOrder: 1, primaryEligibility: "Hearing Impairment", schoolCode: "LKWD" },
    { id: "demo-s3", studentInitials: "L.K.", gradeBand: "K", communicationModality: "Total Communication", readingLevelBand: "Emergent (PreK-K)", colorTag: "green", serviceDeliveryModel: "InPerson", iepAnnualReviewDate: "2026-05-10", directMinutes: 60, directMinutesFrequency: "Weekly", indirectMinutes: 30, indirectMinutesFrequency: "Weekly", notes: "", displayOrder: 2, primaryEligibility: "Hearing Impairment", schoolCode: "PKWY" },
    { id: "demo-s4", studentInitials: "D.N.", gradeBand: "9-12", communicationModality: "Spoken English + ASL", readingLevelBand: "Academic (9-12)", colorTag: "orange", serviceDeliveryModel: "Telepractice", iepAnnualReviewDate: "2026-06-01", directMinutes: 30, directMinutesFrequency: "Weekly", indirectMinutes: 15, indirectMinutesFrequency: "Monthly", notes: "", displayOrder: 3, primaryEligibility: "Hearing Impairment", schoolCode: "NRTH" },
    { id: "demo-s5", studentInitials: "C.W.", gradeBand: "1-2", communicationModality: "LSL", readingLevelBand: "Early (1-2)", colorTag: "pink", serviceDeliveryModel: "InPerson", iepAnnualReviewDate: "2026-03-20", directMinutes: 45, directMinutesFrequency: "Weekly", indirectMinutes: 0, indirectMinutesFrequency: "Weekly", notes: "", displayOrder: 4, primaryEligibility: "Hearing Impairment", schoolCode: "RDGE" },
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
    { id: "demo-sv6", studentId: "demo-s1", studentInitials: "A.T.", sessionDate: "2026-03-03", durationMinutes: 30, sessionType: "Direct", notes: "Open set listening practice with background noise.", created_date: "2026-03-03T09:00:00" },
    { id: "demo-sv7", studentId: "demo-s2", studentInitials: "M.R.", sessionDate: "2026-03-04", durationMinutes: 45, sessionType: "Indirect", notes: "Consultation with classroom teacher re: FM system use.", created_date: "2026-03-04T14:00:00" },
  ],
  // Goals shaped like the Goal entity (used by GoalBank)
  goalBank: [
    {
      id: "demo-gb1", annualGoal: "A.T. will identify environmental sounds in a closed set of 4 with 80% accuracy across 3 consecutive sessions.", domain: "Auditory Skills", gradeBand: "3-5", baselineLevel: "Developing", measurementType: "Trials",
      objectives: ["Identify 2 contrasting environmental sounds with 90% accuracy.", "Identify target sound in a closed set of 4 with 70% accuracy.", "Generalize to novel sound sets with 80% accuracy."],
      progressMonitoring: "Data collected during weekly direct sessions using structured listening tasks.", baselinePrompt: "Present recorded environmental sounds and ask student to identify the sound from a field of 4 picture choices."
    },
    {
      id: "demo-gb2", annualGoal: "M.R. will independently use 3 self-advocacy strategies when unable to hear the teacher, across 4 out of 5 opportunities.", domain: "Self-Advocacy", gradeBand: "6-8", baselineLevel: "Emerging", measurementType: "Frequency",
      objectives: ["Identify 3 self-advocacy strategies by name.", "Role-play use of strategies in a 1:1 setting with 80% success.", "Use strategies independently in classroom settings."],
      progressMonitoring: "Teacher observation rubric completed weekly.", baselinePrompt: "Observe student in classroom; record unprompted use of self-advocacy strategies."
    },
    {
      id: "demo-gb3", annualGoal: "L.K. will follow 2-step spoken directions without visual cues in 8 out of 10 trials across 3 sessions.", domain: "Auditory Skills", gradeBand: "K", baselineLevel: "Emerging", measurementType: "Trials",
      objectives: ["Follow 1-step directions with 90% accuracy.", "Follow 2-step directions with visual support 80% accuracy.", "Follow 2-step directions without visual support 80% accuracy."],
      progressMonitoring: "Trial-by-trial data during weekly direct service sessions.", baselinePrompt: "Give 2-step directions without gestures; record correct vs. incorrect responses."
    },
    {
      id: "demo-gb4", annualGoal: "D.N. will demonstrate independent setup and troubleshooting of their FM system in all academic settings 4 out of 5 school days.", domain: "Hearing Equipment Use", gradeBand: "9-12", baselineLevel: "Mastering", measurementType: "Frequency",
      objectives: ["Identify all FM system components by name.", "Independently power on/off and connect FM system.", "Troubleshoot common FM issues (low battery, connectivity) independently."],
      progressMonitoring: "Weekly checklist completed by student and verified by teacher.", baselinePrompt: "Observe student setting up FM system; note steps requiring prompting."
    },
    {
      id: "demo-gb5", annualGoal: "C.W. will segment spoken words into onset and rime with 85% accuracy across 3 consecutive sessions.", domain: "Literacy Access", gradeBand: "1-2", baselineLevel: "Developing", measurementType: "Trials",
      objectives: ["Identify rhyming word pairs with 90% accuracy.", "Blend onset and rime to form words with 80% accuracy.", "Segment spoken words into onset and rime with 85% accuracy."],
      progressMonitoring: "Weekly structured phonological awareness probe.", baselinePrompt: "Present spoken words; ask student to segment into onset and rime."
    },
  ],
  // Student-goal links (used by StudentDetail goals tab)
  studentGoals: [
    { id: "demo-sg1", studentId: "demo-s1", goalId: "demo-gb1", status: "Active", assignedDate: "2026-01-10" },
    { id: "demo-sg2", studentId: "demo-s2", goalId: "demo-gb2", status: "Active", assignedDate: "2026-01-10" },
    { id: "demo-sg3", studentId: "demo-s3", goalId: "demo-gb3", status: "Active", assignedDate: "2026-01-10" },
    { id: "demo-sg4", studentId: "demo-s4", goalId: "demo-gb4", status: "Mastered", assignedDate: "2025-09-01" },
    { id: "demo-sg5", studentId: "demo-s5", goalId: "demo-gb5", status: "Active", assignedDate: "2026-01-10" },
  ],
  // Equipment entries
  equipment: [
    { id: "demo-eq1", studentId: "demo-s1", type: "Hearing Aids", description: "Phonak Sky M70 — bilateral", serialNumber: "HX-10293", status: "Active", reminderSchedule: "Weekly" },
    { id: "demo-eq2", studentId: "demo-s2", type: "FM/DM", description: "Roger Focus II receivers", serialNumber: "RF-88201", status: "Active", reminderSchedule: "Monthly" },
    { id: "demo-eq3", studentId: "demo-s3", type: "Hearing Aids", description: "Oticon More 1 miniRITE", serialNumber: "OT-55610", status: "NeedsRepair", reminderSchedule: "Weekly" },
    { id: "demo-eq4", studentId: "demo-s4", type: "FM/DM", description: "Phonak Roger Pen", serialNumber: "RP-44002", status: "Active", reminderSchedule: "None" },
    { id: "demo-eq5", studentId: "demo-s5", type: "Hearing Aids", description: "Phonak Sky V90 — bilateral", serialNumber: "HX-78811", status: "Active", reminderSchedule: "Weekly" },
  ],
  // Equipment logs
  equipmentLogs: [
    { id: "demo-el1", equipmentId: "demo-eq1", date: "2026-03-12", checkType: "DailyCheck", issueDescription: "", actionTaken: "Battery replaced, functioning well.", resolved: true },
    { id: "demo-el2", equipmentId: "demo-eq3", date: "2026-03-11", checkType: "IssueReport", issueDescription: "Intermittent sound in right ear.", actionTaken: "Sent to audiologist for review.", resolved: false },
    { id: "demo-el3", equipmentId: "demo-eq5", date: "2026-03-10", checkType: "WeeklyCheck", issueDescription: "", actionTaken: "Cleaned domes, all clear.", resolved: true },
  ],
  // Mileage entries
  mileage: [
    { id: "demo-mi1", date: "2026-03-10", miles: 14.2, purpose: "Travel to Ridge Elementary", monthKey: "2026-03" },
    { id: "demo-mi2", date: "2026-03-11", miles: 18.7, purpose: "Travel to Lakewood Middle School", monthKey: "2026-03" },
    { id: "demo-mi3", date: "2026-03-12", miles: 9.4, purpose: "Travel to Parkway Elementary", monthKey: "2026-03" },
    { id: "demo-mi4", date: "2026-02-28", miles: 22.1, purpose: "IEP meeting at district office", monthKey: "2026-02" },
    { id: "demo-mi5", date: "2026-02-25", miles: 14.2, purpose: "Travel to Ridge Elementary", monthKey: "2026-02" },
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