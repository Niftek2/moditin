import React, { useState } from "react";
import { ShieldCheck, X } from "lucide-react";

export default function PrivacyReminderBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center gap-2 bg-[#EADDF5] border border-[#D5C4EF] rounded-lg px-3 py-1.5 mb-4 text-xs text-[#5a3a7a]">
      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#6B2FB9]" />
      <span>Never enter student names, school names, addresses, IDs, or any identifying information. Use initials only (e.g., Fi.La.).</span>
      <button onClick={() => setDismissed(true)} className="ml-auto shrink-0 text-[#6B2FB9] hover:text-[#400070]">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}