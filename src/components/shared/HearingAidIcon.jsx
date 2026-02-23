export default function HearingAidIcon({ className = "", size = 20, strokeColor = "currentColor" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      <path
        d="M26 20
           C26 15.6 29.6 12 34 12
           C40 12 44 16.6 44 23
           V34
           C44 38.8 41.8 42.6 38.6 45.2
           L36.4 47
           C35.2 48 34.5 49.4 34.5 51
           C34.5 54 32 56.5 29 56.5
           C26 56.5 23.5 54 23.5 51
           C23.5 48.4 25.4 46.1 28 45.6"
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38.5 24.5
           C38.5 21.5 36.5 19.5 34 19.5
           C31.5 19.5 29.5 21.5 29.5 24.5
           V34"
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 34
           C34 39 32 41.5 28.5 43"
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}