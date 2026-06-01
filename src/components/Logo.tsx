export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#5130c4" />
      <path
        d="M14 16h20M24 16v18"
        stroke="#ffdb5b"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="24" cy="34" r="3.5" fill="#f1acfc" />
    </svg>
  );
}
