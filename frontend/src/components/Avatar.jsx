import { initials } from "../lib/constants";

const TINTS = ["bg-cobalt-tint text-cobalt-deep", "bg-marigold-tint text-[#8a5a00]", "bg-sage-tint text-sage", "bg-rose-tint text-rose"];

export default function Avatar({ name = "", size = "h-10 w-10 text-sm" }) {
  const tint = TINTS[(name.charCodeAt(0) || 0) % TINTS.length];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${tint} ${size}`}
    >
      {initials(name) || "?"}
    </span>
  );
}
