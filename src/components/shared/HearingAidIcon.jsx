import React from "react";

// BTE (Behind-The-Ear) hearing aid icon
// Matches the reference image: a body unit that hooks over the ear with a tube looping down to an earmold
export default function HearingAidIcon({ size = 24, className = "", strokeColor = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* BTE body - rounded rectangular unit */}
      <path
        d="M7 16 L7 9.5 C7 7 8.2 5 10 5 C11.8 5 13 7 13 9.5 L13 11"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Body outline right side */}
      <path
        d="M10 5 C11.8 5 13 7 13 9.5"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Tube that arcs from top of body, loops around and down to earmold */}
      <path
        d="M13 9.5 C13 9.5 15.5 9 16.5 11 C17.5 13 16 15.5 14 16.5 C13 17 13 18 13 19"
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Earmold/dome tip */}
      <circle cx="13" cy="19.8" r="1.3" stroke={strokeColor} strokeWidth="1.5" />
      {/* Bottom of body */}
      <path
        d="M7 16 C7 17.5 7.8 18.5 9 18.5 C10.2 18.5 11 17.5 11 16 L11 9.5"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Program button / indicator on body */}
      <rect x="8.5" y="7.5" width="2" height="0.9" rx="0.4" fill={strokeColor} />
    </svg>
  );
}