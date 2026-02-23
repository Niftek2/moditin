import React, { useState } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUOTE_BANK = [
  "Small steps, steady impact.",
  "You're building access, one moment at a time.",
  "Progress counts.",
  "Today: clarity over perfection.",
  "Your presence changes outcomes.",
  "Consistency beats intensity.",
  "One good session can change a week.",
  "You don't have to do it all, just the next right thing.",
  "Data is a flashlight, not a judgment.",
  "You're planting skills that will grow.",
  "Make it accessible, then make it excellent.",
  "You're not behind. You're in the work.",
  "The goal is growth, not flawless.",
  "You're modeling calm and competence.",
  "Help the student, not the spreadsheet.",
  "You can be firm and kind at the same time.",
  "A clear plan is a form of care.",
  "You're building confidence, not just compliance.",
  "Teach the skill. Honor the person.",
  "You're allowed to simplify.",
  "One aligned goal is better than five scattered ones.",
  "Your work creates belonging.",
  "Measure what matters. Release what doesn't.",
  "You're doing skilled work under real constraints.",
  "Start with connection. Everything else follows.",
  "Today is a good day for a clean note and a clear next step.",
  "You are the bridge, not the whole road.",
  "Accessible instruction is powerful instruction.",
  "You're not just teaching content. You're building agency.",
  "Keep it simple. Keep it consistent.",
  "You can restart the day at any moment.",
  "Your impact extends beyond today.",
  "Write it so future you can understand it.",
  "Your calm strengthens the room.",
  "Good enough, done well, repeated.",
  "Focus on clarity, kindness, and follow-through.",
  "You are allowed to protect your energy.",
  "Small accommodations create big access.",
  "Your documentation supports student success.",
  "You're turning effort into progress.",
  "Teach the strategy, not the struggle.",
  "When it's messy, return to the basics.",
  "You are building skills students will use independently.",
  "Your work makes learning accessible.",
  "One student understood today because you showed up.",
  "Keep the bar high and the path clear.",
  "Make the next step obvious.",
  "You're doing meaningful work, even on the hard days.",
  "Today's win can be small and still count.",
  "Keep going. You're creating access."
];

const getDailyQuote = () => {
  const now = new Date();
  const chicagoDate = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Chicago" })
  );

  const startOfYear = new Date(chicagoDate.getFullYear(), 0, 0);
  const diff = chicagoDate - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const index = dayOfYear % QUOTE_BANK.length;
  return QUOTE_BANK[index];
};

const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * QUOTE_BANK.length);
  return QUOTE_BANK[randomIndex];
};

export default function DailyQuote() {
  const [currentQuote, setCurrentQuote] = useState(getDailyQuote());

  const handleRefresh = () => {
    setCurrentQuote(getRandomQuote());
  };

  return (
    <div className="mt-3 p-4 border-l-4 border-[#6B2FB9] bg-[#F7F3FA] rounded-lg" role="region" aria-live="polite" aria-label="Daily motivational quote">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-medium italic text-[#400070] leading-relaxed flex-1">
          "{currentQuote}"
        </p>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="icon"
          className="shrink-0 text-[#6B2FB9] hover:text-[#400070] hover:bg-white/50 rounded-lg h-8 w-8 min-h-[36px] min-w-[36px]"
          aria-label="Show another quote for this session"
        >
          <RotateCw className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
      <p className="text-xs text-[#6B2FB9] mt-2">Daily Note</p>
    </div>
  );
}