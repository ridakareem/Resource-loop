// Drawn placeholders so listings without a photo still look intentional.
const THEME = {
  textbooks: { bg: "#E6E9FB", fg: "#2B3FD6" },
  lab: { bg: "#DCF0E6", fg: "#2F7D5B" },
  drafting: { bg: "#FDF0CC", fg: "#B07A00" },
  electronics: { bg: "#F9E1E6", fg: "#C2415A" },
  notes: { bg: "#E8EDF5", fg: "#0F1B3D" },
  other: { bg: "#EFE9F7", fg: "#6B3FA0" },
};

const ART = {
  textbooks: (
    <>
      <rect x="14" y="14" width="12" height="38" rx="2" />
      <rect x="28" y="10" width="12" height="42" rx="2" />
      <path d="M42 18l10 3-8 31-10-3z" />
    </>
  ),
  lab: (
    <>
      <path d="M26 10h12M29 10v14L16 48a4 4 0 0 0 3.6 6h24.8A4 4 0 0 0 48 48L35 24V10" />
      <path d="M21 40h22" />
    </>
  ),
  drafting: (
    <>
      <path d="M12 52L12 14 50 52z" />
      <path d="M20 44v-14l14 14" />
    </>
  ),
  electronics: (
    <>
      <rect x="16" y="9" width="32" height="46" rx="4" />
      <rect x="21" y="15" width="22" height="9" rx="1" />
      <path d="M22 33h4M30 33h4M38 33h4M22 41h4M30 41h4M38 41h4M22 48h4M30 48h4M38 48h4" />
    </>
  ),
  notes: (
    <>
      <path d="M17 9h22l8 8v38H17z" />
      <path d="M39 9v8h8M23 28h18M23 35h18M23 42h12" />
    </>
  ),
  other: (
    <>
      <path d="M10 22l22-11 22 11v22L32 55 10 44z" />
      <path d="M10 22l22 11 22-11M32 33v22" />
    </>
  ),
};

export default function CategoryArt({ category = "other", className = "" }) {
  const t = THEME[category] || THEME.other;
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ background: t.bg }}>
      <svg
        viewBox="0 0 64 64"
        className="h-1/2 w-1/2 max-h-28 max-w-28"
        fill="none"
        stroke={t.fg}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ART[category] || ART.other}
      </svg>
    </div>
  );
}
