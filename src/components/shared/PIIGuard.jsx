import React from "react";

const PII_PATTERNS = [
  { pattern: /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/, label: "full name" },
  { pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/, label: "date of birth" },
  { pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/, label: "SSN/ID number" },
  { pattern: /\b\d{1,5}\s\w+\s(St|Ave|Blvd|Dr|Rd|Ln|Way|Ct)\b/i, label: "address" },
  { pattern: /\b(student\s?id|sid)[:\s]?\d+/i, label: "student ID" },
];

export function checkPII(text) {
  if (!text) return [];
  const warnings = [];
  PII_PATTERNS.forEach(({ pattern, label }) => {
    if (pattern.test(text)) {
      warnings.push(label);
    }
  });
  return warnings;
}

export default function PIIWarning({ warnings }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm">
      <p className="text-red-400 font-medium">⚠️ Private Information Detected</p>
      <p className="text-red-300/70 text-xs mt-1">
        This text may contain identifying information ({warnings.join(", ")}). Please use initials only (e.g., Fi.La.) — never enter student names, school names, or identifying details.
      </p>
    </div>
  );
}