import React from "react";

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
      {/* Main BTE body - the tall rounded rectangle part */}
      <path
        d="M8 15 C8 18.5 10 21 12 21 C12 21 12.5 21 13 20.5 C13.8 19.6 14 18 14 16.5 L14 9 C14 6.5 12.5 4 10.5 4 C8.5 4 7 5.8 7 8 C7 9.5 7.8 10.8 9 11.5"
        stroke={strokeColor}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tube going up and over */}
      <path
        d="M14 9.5 C14 9.5 16 9 17 10 C18 11 18 13 17 14.5 C16.2 15.7 15 16.5 14 16.5"
        stroke={strokeColor}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Earmold / dome at bottom */}
      <circle
        cx="13"
        cy="20.5"
        r="1.2"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      {/* Program button on body */}
      <rect
        x="9"
        y="6.5"
        width="2.5"
        height="1"
        rx="0.5"
        stroke={strokeColor}
        strokeWidth="1.2"
      />
    </svg>
  );
}