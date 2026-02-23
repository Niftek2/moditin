import React from "react";

// BTE (Behind-The-Ear) hearing aid — matches reference image:
// tall rounded body on left, tube arcing up-right then looping down to earmold at bottom-right
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
      {/* BTE body — tall rounded pill on the left */}
      <rect x="4.5" y="5" width="4.5" height="11" rx="2.2" stroke={strokeColor} strokeWidth="1.7" />

      {/* Small button/indicator on body */}
      <rect x="5.8" y="7" width="1.8" height="0.85" rx="0.4" fill={strokeColor} />

      {/* Tube: exits top-right of body, arcs up and over, loops down on the right side, ends at earmold */}
      <path
        d="M9 6.5 C11 5.5 14 5 15.5 7 C17 9 16.5 12 15 13.5 C14 14.5 13.5 15.5 13.5 17 C13.5 18.2 14 19 14.5 19.5"
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Earmold / dome */}
      <circle cx="14.8" cy="20.2" r="1.2" stroke={strokeColor} strokeWidth="1.5" />
    </svg>
  );
}