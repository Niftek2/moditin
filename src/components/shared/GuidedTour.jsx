import React, { useState, useEffect } from "react";
import Joyride, { STATUS } from "react-joyride";
import { base44 } from "@/api/base44Client";

const TOUR_KEY = "modal_itinerant_tour_done";

const STEPS = [
  {
    target: "[data-tour='today-block']",
    title: "Your Daily Roadmap",
    content: "Here's your at-a-glance view of today's sessions, upcoming IEP reviews, and your next appointment.",
    disableBeacon: true,
    placement: "bottom",
  },
  {
    target: "[data-tour='quick-actions']",
    title: "Quick Actions",
    content: "Log a session, generate a worksheet, write an IEP goal, or launch an interactive activity — all in one tap.",
    placement: "top",
  },
  {
    target: "[data-tour='students-block']",
    title: "Your Caseload",
    content: "Manage your students here. Tap any student for their full profile, goals, equipment, and session history.",
    placement: "top",
  },
  {
    target: "[data-tour='notification-bell']",
    title: "Reminders & Alerts",
    content: "IEP review reminders and personal reminders appear here. Privacy is built-in — no student names, ever.",
    placement: "bottom-end",
  },
];

const joyrideStyles = {
  options: {
    primaryColor: "#400070",
    zIndex: 10000,
    arrowColor: "#fff",
    backgroundColor: "#fff",
    overlayColor: "rgba(0,0,0,0.45)",
    textColor: "#1A1028",
  },
  tooltip: {
    borderRadius: "16px",
    padding: "20px 24px",
    boxShadow: "0 8px 32px rgba(64,0,112,0.18)",
  },
  tooltipTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#400070",
    marginBottom: "8px",
  },
  tooltipContent: {
    fontSize: "0.9rem",
    lineHeight: 1.6,
    color: "#1A1028",
  },
  buttonNext: {
    backgroundColor: "#400070",
    borderRadius: "10px",
    padding: "8px 20px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  buttonBack: {
    color: "#400070",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  buttonSkip: {
    color: "#9B8AAB",
    fontSize: "0.8rem",
  },
};

export function hasTourBeenDone() {
  try {
    return localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return false;
  }
}

export function resetTour() {
  try {
    localStorage.removeItem(TOUR_KEY);
  } catch {}
}

export default function GuidedTour({ run, onFinish }) {
  const [mounted, setMounted] = useState(false);

  // Delay mount slightly so data-tour targets are rendered
  useEffect(() => {
    if (run) {
      const t = setTimeout(() => setMounted(true), 400);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [run]);

  const handleCallback = ({ status }) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      try { localStorage.setItem(TOUR_KEY, "1"); } catch {}
      onFinish?.();
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
      steps={STEPS}
      run={true}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      disableScrolling={false}
      styles={joyrideStyles}
      locale={{
        back: "Back",
        close: "Close",
        last: "Done",
        next: "Next →",
        skip: "Skip tour",
      }}
      callback={handleCallback}
    />
  );
}