import React from "react";

export const PII_REGEX_COMBINED = new RegExp(
  [
    /\b[A-Z][a-z']+(?:\s+[A-Z][a-z']+){1,3}\b/,
    /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
    /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/,
    /\b\d{1,5}\s\w+\s(St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Court|Place|Terrace|Circle)\b/i,
    /\b(student\s?id|sid|dob|date\s?of\s?birth)[:\s]?\d+/i,
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(Elementary|Middle|High|Academy|School|District|Charter|Preschool|Pre-K|Center|Institute|University|College)\b/i,
    /\b(iep\s?#|case\s?#|record\s?#)[:\s]?\w+/i,
  ].map(r => r.source).join('|'),
  'gi'
);

const PII_PATTERNS = [
  { pattern: /\b[A-Z][a-z']+(?:\s+[A-Z][a-z']+){1,3}\b/, label: "full name" },
  { pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/, label: "date of birth" },
  { pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/, label: "SSN/ID number" },
  { pattern: /\b\d{1,5}\s\w+\s(St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Court|Place|Terrace|Circle)\b/i, label: "address" },
  { pattern: /\b(student\s?id|sid|dob|date\s?of\s?birth)[:\s]?\d+/i, label: "student ID / DOB" },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, label: "phone number" },
  { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, label: "email address" },
  { pattern: /\b(Elementary|Middle|High|Academy|School|District|Charter|Preschool|Pre-K|Center|Institute|University|College)\b/i, label: "school name" },
  { pattern: /\b(iep\s?#|case\s?#|record\s?#)[:\s]?\w+/i, label: "case/record number" },
];

export function redactPII(text) {
  if (!text) return text;
  let result = text;
  PII_PATTERNS.forEach(({ pattern }) => {
    result = result.replace(new RegExp(pattern.source, "gi"), "[REDACTED]");
  });
  return result;
}

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