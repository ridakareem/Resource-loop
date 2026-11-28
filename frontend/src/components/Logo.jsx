export function LoopMark({ className = "h-8 w-8", color = "#F5B82E", bg = "#0F1B3D" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill={bg} />
      <path d="M44 24a14 14 0 1 0 2 11" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
      <path d="M36 20h12v12" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LoopMark bg={light ? "#F5B82E" : "#0F1B3D"} color={light ? "#0F1B3D" : "#F5B82E"} />
      <span className={`font-display text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        ResourceLoop
      </span>
    </span>
  );
}
