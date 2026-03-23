import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const DemoContext = createContext(null);

// Seed data — realistic but fictional
const SEED_DATA = {
  students: [
    { id: "demo-s1", studentInitials: "A.T.", gradeBand: "3-5", communicationModality: "LSL", readingLevelBand: "Developing (3-5)", colorTag: "blue", serviceDeliveryModel: "InPerson", iepAnnualReviewDate: "2026-04-15", directMinutes: 30, directMinutesFrequency: "Weekly", indirectMinutes: 15, indirectMinutesFrequency: "Weekly", notes: "Responds well to structured auditory tasks. Prefers quiet environments.", warmNotes: "Loves science and dinosaurs — great topic for auditory activities!", displayOrder: 0, primaryEligibility: "Hard of Hearing", schoolCode: "RDGE" },
    { id: "demo-s2", studentInitials: "M.R.", gradeBand: "6-8", communicationModality: "ASL", readingLevelBand: "Expanding (6-8)", colorTag: "purple", serviceDeliveryModel: "Hybrid", iepAnnualReviewDate: "2026-03-28", directMinutes: 45, directMinutesFrequency: "Weekly", indirectMinutes: 20, indirectMinutesFrequency: "Monthly", notes: "Strong ASL skills. Working on English literacy access and self-advocacy.", warmNotes: "Very artistic — uses drawing to express ideas in sessions.", displayOrder: 1, primaryEligibility: "Hard of Hearing", schoolCode: "LKWD" },
    { id: "demo-s3", studentInitials: "L.K.", gradeBand: "K", communicationModality: "Total Communication", readingLevelBand: "Emergent (PreK-K)", colorTag: "green", serviceDeliveryModel: "InPerson", iepAnnualReviewDate: "2026-05-10", directMinutes: 60, directMinutesFrequency: "Weekly", indirectMinutes: 30, indirectMinutesFrequency: "Weekly", notes: "New hearing aid user. Consistent wear still being established.", warmNotes: "Very energetic — movement-based activities work best.", displayOrder: 2, primaryEligibility: "Hard of Hearing", schoolCode: "PKWY" },
    { id: "demo-s4", studentInitials: "D.N.", gradeBand: "9-12", communicationModality: "Spoken English + ASL", readingLevelBand: "Academic (9-12)", colorTag: "orange", serviceDeliveryModel: "Telepractice", iepAnnualReviewDate: "2026-06-01", directMinutes: 30, directMinutesFrequency: "Weekly", indirectMinutes: 15, indirectMinutesFrequency: "Monthly", notes: "Highly independent. Focus on transition and self-advocacy skills.", warmNotes: "Interested in college prep — connect goals to real-world scenarios.", displayOrder: 3, primaryEligibility: "Hard of Hearing", schoolCode: "NRTH" },
    { id: "demo-s5", studentInitials: "C.W.", gradeBand: "1-2", communicationModality: "LSL", readingLevelBand: "Early (1-2)", colorTag: "pink", serviceDeliveryModel: "InPerson", iepAnnualReviewDate: "2026-03-20", directMinutes: 45, directMinutesFrequency: "Weekly", indirectMinutes: 0, indirectMinutesFrequency: "Weekly", notes: "Making strong progress in phonological awareness. Parent involvement is excellent.", warmNotes: "Loves stories with animals — use picture books as session materials.", displayOrder: 4, primaryEligibility: "Hard of Hearing", schoolCode: "RDGE" },
  ],
  calendarEvents: [
    { id: "demo-e1", title: "A.T. — Direct Service", eventType: "DirectService", startDateTime: "2026-03-13T09:00:00", endDateTime: "2026-03-13T09:30:00", setting: "InPerson", studentId: "demo-s1", studentInitials: "A.T." },
    { id: "demo-e2", title: "M.R. — Direct Service", eventType: "DirectService", startDateTime: "2026-03-13T10:00:00", endDateTime: "2026-03-13T10:45:00", setting: "Hybrid", studentId: "demo-s2", studentInitials: "M.R." },
    { id: "demo-e3", title: "IEP Meeting — C.W.", eventType: "IEPMeeting", startDateTime: "2026-03-20T13:00:00", endDateTime: "2026-03-20T14:00:00", setting: "InPerson", studentId: "demo-s5", studentInitials: "C.W." },
    { id: "demo-e4", title: "L.K. — Direct Service", eventType: "DirectService", startDateTime: "2026-03-17T09:00:00", endDateTime: "2026-03-17T10:00:00", setting: "InPerson", studentId: "demo-s3", studentInitials: "L.K." },
    { id: "demo-e5", title: "D.N. — Telepractice", eventType: "DirectService", startDateTime: "2026-03-18T14:00:00", endDateTime: "2026-03-18T14:30:00", setting: "Telepractice", studentId: "demo-s4", studentInitials: "D.N." },
    { id: "demo-e6", title: "IEP Meeting — M.R.", eventType: "IEPMeeting", startDateTime: "2026-03-28T11:00:00", endDateTime: "2026-03-28T12:00:00", setting: "InPerson", studentId: "demo-s2", studentInitials: "M.R." },
    { id: "demo-e7", title: "A.T. — Direct Service", eventType: "DirectService", startDateTime: "2026-03-20T09:00:00", endDateTime: "2026-03-20T09:30:00", setting: "InPerson", studentId: "demo-s1", studentInitials: "A.T." },
    { id: "demo-e8", title: "L.K. — Direct Service", eventType: "DirectService", startDateTime: "2026-03-24T09:00:00", endDateTime: "2026-03-24T10:00:00", setting: "InPerson", studentId: "demo-s3", studentInitials: "L.K." },
    { id: "demo-e9", title: "C.W. — Direct Service", eventType: "DirectService", startDateTime: "2026-03-06T09:30:00", endDateTime: "2026-03-06T10:15:00", setting: "InPerson", studentId: "demo-s5", studentInitials: "C.W." },
    { id: "demo-e10", title: "A.T. — Direct Service", eventType: "DirectService", startDateTime: "2026-03-06T09:00:00", endDateTime: "2026-03-06T09:30:00", setting: "InPerson", studentId: "demo-s1", studentInitials: "A.T." },
  ],
  services: [
    { id: "demo-sv1", studentId: "demo-s1", studentInitials: "A.T.", sessionDate: "2026-03-10", durationMinutes: 30, sessionType: "Direct", notes: "Auditory discrimination practice. Good focus today.", created_date: "2026-03-10T10:00:00" },
    { id: "demo-sv2", studentId: "demo-s2", studentInitials: "M.R.", sessionDate: "2026-03-11", durationMinutes: 45, sessionType: "Direct", notes: "ASL vocabulary expansion. Introduced 12 new signs.", created_date: "2026-03-11T10:30:00" },
    { id: "demo-sv3", studentId: "demo-s3", studentInitials: "L.K.", sessionDate: "2026-03-12", durationMinutes: 60, sessionType: "Direct", notes: "Listening comprehension with picture supports.", created_date: "2026-03-12T09:00:00" },
    { id: "demo-sv4", studentId: "demo-s4", studentInitials: "D.N.", sessionDate: "2026-03-07", durationMinutes: 30, sessionType: "Direct", notes: "Self-advocacy skills. Role-played talking to teachers.", created_date: "2026-03-07T14:00:00" },
    { id: "demo-sv5", studentId: "demo-s5", studentInitials: "C.W.", sessionDate: "2026-03-06", durationMinutes: 45, sessionType: "Direct", notes: "Phonological awareness activities. Rhyming word pairs.", created_date: "2026-03-06T09:30:00" },
    { id: "demo-sv6", studentId: "demo-s1", studentInitials: "A.T.", sessionDate: "2026-03-03", durationMinutes: 30, sessionType: "Direct", notes: "Open set listening practice with background noise.", created_date: "2026-03-03T09:00:00" },
    { id: "demo-sv7", studentId: "demo-s2", studentInitials: "M.R.", sessionDate: "2026-03-04", durationMinutes: 45, sessionType: "Indirect", notes: "Consultation with classroom teacher re: FM system use.", created_date: "2026-03-04T14:00:00" },
    { id: "demo-sv8", studentId: "demo-s3", studentInitials: "L.K.", sessionDate: "2026-02-26", durationMinutes: 60, sessionType: "Direct", notes: "Sound detection games with hearing aid on.", created_date: "2026-02-26T09:00:00" },
    { id: "demo-sv9", studentId: "demo-s4", studentInitials: "D.N.", sessionDate: "2026-02-28", durationMinutes: 30, sessionType: "Direct", notes: "Practiced using FM system setup protocol independently.", created_date: "2026-02-28T14:00:00" },
    { id: "demo-sv10", studentId: "demo-s5", studentInitials: "C.W.", sessionDate: "2026-02-27", durationMinutes: 45, sessionType: "Direct", notes: "Segmenting CVC words, 8/10 correct.", created_date: "2026-02-27T09:30:00" },
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
  // Ling 6 sessions
  ling6Sessions: [
    { id: "demo-l1", studentId: "demo-s1", dateTime: "2026-03-10T09:00:00", earTested: "Both", deliveryMethod: "LiveVoice", hearingTechWorn: "Hearing Aids", notes: "Good performance with aids on." },
    { id: "demo-l2", studentId: "demo-s1", dateTime: "2026-02-24T09:00:00", earTested: "Both", deliveryMethod: "LiveVoice", hearingTechWorn: "Hearing Aids", notes: "" },
    { id: "demo-l3", studentId: "demo-s2", dateTime: "2026-03-11T10:00:00", earTested: "Left", deliveryMethod: "LiveVoice", hearingTechWorn: "Cochlear Implant", notes: "" },
    { id: "demo-l4", studentId: "demo-s3", dateTime: "2026-03-12T09:30:00", earTested: "Both", deliveryMethod: "LiveVoice", hearingTechWorn: "Hearing Aids", notes: "L.K. detected all 6 sounds today." },
    { id: "demo-l5", studentId: "demo-s4", dateTime: "2026-03-07T14:00:00", earTested: "Right", deliveryMethod: "SoundClip", hearingTechWorn: "FM/DM", notes: "" },
    { id: "demo-l6", studentId: "demo-s5", dateTime: "2026-03-06T09:00:00", earTested: "Both", deliveryMethod: "LiveVoice", hearingTechWorn: "Hearing Aids", notes: "" },
    { id: "demo-l7", studentId: "demo-s2", dateTime: "2026-02-18T10:00:00", earTested: "Left", deliveryMethod: "LiveVoice", hearingTechWorn: "Cochlear Implant", notes: "Improved from last session." },
  ],
  ling6Trials: [
    // demo-l1 (A.T.)
    { id: "demo-lt1", ling6SessionId: "demo-l1", sound: "m", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt2", ling6SessionId: "demo-l1", sound: "oo", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt3", ling6SessionId: "demo-l1", sound: "ah", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt4", ling6SessionId: "demo-l1", sound: "ee", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt5", ling6SessionId: "demo-l1", sound: "sh", trialNumber: 1, responseType: "Detected", promptLevel: "Repetition" },
    { id: "demo-lt6", ling6SessionId: "demo-l1", sound: "s", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    // demo-l2 (A.T. older)
    { id: "demo-lt7", ling6SessionId: "demo-l2", sound: "m", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt8", ling6SessionId: "demo-l2", sound: "oo", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt9", ling6SessionId: "demo-l2", sound: "ah", trialNumber: 1, responseType: "Detected", promptLevel: "Repetition" },
    { id: "demo-lt10", ling6SessionId: "demo-l2", sound: "ee", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt11", ling6SessionId: "demo-l2", sound: "sh", trialNumber: 1, responseType: "NoResponse", promptLevel: "VisualCue" },
    { id: "demo-lt12", ling6SessionId: "demo-l2", sound: "s", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    // demo-l3 (M.R.)
    { id: "demo-lt13", ling6SessionId: "demo-l3", sound: "m", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt14", ling6SessionId: "demo-l3", sound: "oo", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt15", ling6SessionId: "demo-l3", sound: "ah", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt16", ling6SessionId: "demo-l3", sound: "ee", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt17", ling6SessionId: "demo-l3", sound: "sh", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt18", ling6SessionId: "demo-l3", sound: "s", trialNumber: 1, responseType: "Detected", promptLevel: "Repetition" },
    // demo-l4 (L.K.)
    { id: "demo-lt19", ling6SessionId: "demo-l4", sound: "m", trialNumber: 1, responseType: "Detected", promptLevel: "Independent" },
    { id: "demo-lt20", ling6SessionId: "demo-l4", sound: "oo", trialNumber: 1, responseType: "Detected", promptLevel: "Independent" },
    { id: "demo-lt21", ling6SessionId: "demo-l4", sound: "ah", trialNumber: 1, responseType: "Detected", promptLevel: "Independent" },
    { id: "demo-lt22", ling6SessionId: "demo-l4", sound: "ee", trialNumber: 1, responseType: "Identified", promptLevel: "Repetition" },
    { id: "demo-lt23", ling6SessionId: "demo-l4", sound: "sh", trialNumber: 1, responseType: "NoResponse", promptLevel: "VisualCue" },
    { id: "demo-lt24", ling6SessionId: "demo-l4", sound: "s", trialNumber: 1, responseType: "Detected", promptLevel: "Repetition" },
    // demo-l5 (D.N.)
    { id: "demo-lt25", ling6SessionId: "demo-l5", sound: "m", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt26", ling6SessionId: "demo-l5", sound: "oo", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt27", ling6SessionId: "demo-l5", sound: "ah", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt28", ling6SessionId: "demo-l5", sound: "ee", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt29", ling6SessionId: "demo-l5", sound: "sh", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt30", ling6SessionId: "demo-l5", sound: "s", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    // demo-l6 (C.W.)
    { id: "demo-lt31", ling6SessionId: "demo-l6", sound: "m", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt32", ling6SessionId: "demo-l6", sound: "oo", trialNumber: 1, responseType: "Detected", promptLevel: "Repetition" },
    { id: "demo-lt33", ling6SessionId: "demo-l6", sound: "ah", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt34", ling6SessionId: "demo-l6", sound: "ee", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt35", ling6SessionId: "demo-l6", sound: "sh", trialNumber: 1, responseType: "NoResponse", promptLevel: "VisualCue" },
    { id: "demo-lt36", ling6SessionId: "demo-l6", sound: "s", trialNumber: 1, responseType: "Detected", promptLevel: "Repetition" },
    // demo-l7 (M.R. older)
    { id: "demo-lt37", ling6SessionId: "demo-l7", sound: "m", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt38", ling6SessionId: "demo-l7", sound: "oo", trialNumber: 1, responseType: "Detected", promptLevel: "Repetition" },
    { id: "demo-lt39", ling6SessionId: "demo-l7", sound: "ah", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt40", ling6SessionId: "demo-l7", sound: "ee", trialNumber: 1, responseType: "Identified", promptLevel: "Independent" },
    { id: "demo-lt41", ling6SessionId: "demo-l7", sound: "sh", trialNumber: 1, responseType: "Detected", promptLevel: "Repetition" },
    { id: "demo-lt42", ling6SessionId: "demo-l7", sound: "s", trialNumber: 1, responseType: "NoResponse", promptLevel: "VisualCue" },
  ],
  audiologySnapshots: [
    { id: "demo-as1", studentId: "demo-s1", lastAudiogramDate: "2025-11-15", hearingLossType: "Sensorineural", hearingLossLaterality: "Bilateral", configuration: "Sloping", severityRange: "Moderate", onset: "Congenital", progression: "Stable", etiologyKnown: "Unknown", equipmentUsed: ["HearingAids"], hearingLossDetail: ["Bilateral"], listeningAccessNotes: "Performs best in quiet settings with hearing aids. Benefits from FM system in noisy environments.", confirmNoIdentifying: true },
    { id: "demo-as2", studentId: "demo-s2", lastAudiogramDate: "2025-09-20", hearingLossType: "Sensorineural", hearingLossLaterality: "Bilateral", configuration: "Flat", severityRange: "Profound", onset: "Congenital", progression: "Stable", etiologyKnown: "Known", equipmentUsed: ["CochlearImplant", "FM_DM"], hearingLossDetail: ["Bilateral", "Genetic"], listeningAccessNotes: "CI user. FM microphone required in all instructional settings.", confirmNoIdentifying: true },
    { id: "demo-as3", studentId: "demo-s3", lastAudiogramDate: "2026-01-10", hearingLossType: "Conductive", hearingLossLaterality: "Bilateral", configuration: "Flat", severityRange: "Mild", onset: "Acquired", progression: "Fluctuating", etiologyKnown: "Known", equipmentUsed: ["HearingAids"], hearingLossDetail: ["Bilateral", "HistoryOfOtitisMedia", "HistoryOfTubes"], listeningAccessNotes: "Mild conductive loss. Consistent hearing aid wear is being established.", confirmNoIdentifying: true },
    { id: "demo-as4", studentId: "demo-s4", lastAudiogramDate: "2025-08-05", hearingLossType: "Sensorineural", hearingLossLaterality: "Bilateral", configuration: "Sloping", severityRange: "ModeratelySevere", onset: "Congenital", progression: "Stable", etiologyKnown: "Unknown", equipmentUsed: ["HearingAids", "FM_DM"], hearingLossDetail: ["Bilateral", "EnlargedVestibularAqueduct"], listeningAccessNotes: "Wears hearing aids and uses FM system independently. Very self-sufficient.", confirmNoIdentifying: true },
    { id: "demo-as5", studentId: "demo-s5", lastAudiogramDate: "2026-02-20", hearingLossType: "Sensorineural", hearingLossLaterality: "Bilateral", configuration: "Sloping", severityRange: "Moderate", onset: "Congenital", progression: "Stable", etiologyKnown: "Unknown", equipmentUsed: ["HearingAids"], hearingLossDetail: ["Bilateral"], listeningAccessNotes: "New hearing aid user. Building tolerance and consistent wear habits.", confirmNoIdentifying: true },
  ],
  interactiveSessions: [
    { id: "demo-is1", studentId: "demo-s1", templateType: "AuditoryDiscrimination", difficulty: "Developing", setting: "InPerson", totalItems: 10, totalCorrect: 8, percentCorrect: 80, durationMinutes: 15, created_date: "2026-03-10T09:30:00", gradeBand: "3-5" },
    { id: "demo-is2", studentId: "demo-s1", templateType: "ListeningComprehension", difficulty: "Developing", setting: "InPerson", totalItems: 8, totalCorrect: 7, percentCorrect: 88, durationMinutes: 20, created_date: "2026-02-24T09:30:00", gradeBand: "3-5" },
    { id: "demo-is3", studentId: "demo-s2", templateType: "SelfAdvocacy", difficulty: "Emerging", setting: "Hybrid", totalItems: 6, totalCorrect: 4, percentCorrect: 67, durationMinutes: 25, created_date: "2026-03-11T10:30:00", gradeBand: "6-8" },
    { id: "demo-is4", studentId: "demo-s3", templateType: "FollowingDirections", difficulty: "Emerging", setting: "InPerson", totalItems: 10, totalCorrect: 6, percentCorrect: 60, durationMinutes: 15, created_date: "2026-03-12T10:00:00", gradeBand: "K" },
    { id: "demo-is5", studentId: "demo-s4", templateType: "EquipmentKnowledge", difficulty: "Mastering", setting: "Telepractice", totalItems: 12, totalCorrect: 11, percentCorrect: 92, durationMinutes: 20, created_date: "2026-03-07T14:30:00", gradeBand: "9-12" },
    { id: "demo-is6", studentId: "demo-s5", templateType: "AuditoryDiscrimination", difficulty: "Emerging", setting: "InPerson", totalItems: 8, totalCorrect: 5, percentCorrect: 63, durationMinutes: 15, created_date: "2026-03-06T10:00:00", gradeBand: "1-2" },
    { id: "demo-is7", studentId: "demo-s4", templateType: "SelfAdvocacy", difficulty: "Mastering", setting: "Telepractice", totalItems: 8, totalCorrect: 8, percentCorrect: 100, durationMinutes: 18, created_date: "2026-02-28T14:30:00", gradeBand: "9-12" },
  ],
  labelingActivities: [
    { id: "demo-la1", studentId: "demo-s1", activityType: "hearingAid", sessionDate: "2026-03-10", startTime: "09:45", correctLabels: 8, totalLabels: 10, incorrectAttempts: 3, durationSeconds: 245, linkedToSession: false, created_date: "2026-03-10T09:45:00" },
    { id: "demo-la2", studentId: "demo-s3", activityType: "hearingAid", sessionDate: "2026-03-12", startTime: "10:30", correctLabels: 6, totalLabels: 10, incorrectAttempts: 7, durationSeconds: 312, linkedToSession: false, created_date: "2026-03-12T10:30:00" },
    { id: "demo-la3", studentId: "demo-s4", activityType: "cochlearImplant", sessionDate: "2026-03-07", startTime: "14:45", correctLabels: 12, totalLabels: 12, incorrectAttempts: 1, durationSeconds: 180, linkedToSession: true, created_date: "2026-03-07T14:45:00" },
    { id: "demo-la4", studentId: "demo-s5", activityType: "hearingAid", sessionDate: "2026-03-06", startTime: "10:00", correctLabels: 7, totalLabels: 10, incorrectAttempts: 5, durationSeconds: 290, linkedToSession: false, created_date: "2026-03-06T10:00:00" },
    { id: "demo-la5", studentId: "demo-s2", activityType: "cochlearImplant", sessionDate: "2026-03-11", startTime: "11:00", correctLabels: 11, totalLabels: 12, incorrectAttempts: 2, durationSeconds: 195, linkedToSession: false, created_date: "2026-03-11T11:00:00" },
  ],
  contacts: [
    { id: "demo-c1", studentId: "demo-s1", additionalTeamMembers: [
      { name: "Ms. J.", role: "General Education Teacher", email: "" },
      { name: "Mr. K.", role: "Audiologist", email: "" },
    ]},
    { id: "demo-c2", studentId: "demo-s2", additionalTeamMembers: [
      { name: "Ms. P.", role: "Interpreter", email: "" },
      { name: "Mr. T.", role: "Case Manager", email: "" },
    ]},
    { id: "demo-c3", studentId: "demo-s3", additionalTeamMembers: [
      { name: "Ms. B.", role: "Special Education Teacher", email: "" },
    ]},
    { id: "demo-c4", studentId: "demo-s4", additionalTeamMembers: [
      { name: "Dr. W.", role: "Audiologist", email: "" },
      { name: "Ms. H.", role: "General Education Teacher", email: "" },
    ]},
    { id: "demo-c5", studentId: "demo-s5", additionalTeamMembers: [
      { name: "Ms. R.", role: "Special Education Teacher", email: "" },
    ]},
  ],
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function DemoProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "1"
  );
  const [demoData, setDemoData] = useState(deepClone(SEED_DATA));
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.clear();
  }, [isDemoMode]);

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