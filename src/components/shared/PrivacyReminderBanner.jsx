import React from "react";
import { ShieldCheck } from "lucide-react";

export default function PrivacyReminderBanner() {
  return (
    <div className="flex items-center gap-2 bg-[#EADDF5] border border-[#D5C4EF] rounded-xl px-4 py-2.5 mb-6 text-sm text-[#400070]">
      <ShieldCheck className="w-4 h-4 shrink-0 text-[#6B2FB9]" />
      <span className="font-medium">Privacy Reminder:</span>
      <span className="text-[#5a3a7a]">Never enter student names, school names, addresses, IDs, or any identifying information. Use initials only (e.g., Fi.La.).</span>
    </div>
  );
}