export const CATEGORIES = [
  { id: "textbooks", label: "Textbooks" },
  { id: "lab", label: "Lab gear" },
  { id: "drafting", label: "Drafting and stationery" },
  { id: "electronics", label: "Calculators and electronics" },
  { id: "notes", label: "Notes and papers" },
  { id: "other", label: "Other" },
];

export const CONDITIONS = ["New", "Like new", "Good", "Fair"];

export const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics and Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Biotechnology",
  "Commerce and Management",
  "Arts and Sciences",
  "Other",
];

export const YEARS = [1, 2, 3, 4, 5];

export const categoryLabel = (id) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? "Other";

export const yearLabel = (y) => {
  const n = Number(y);
  if (!n) return "";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]} year`;
};

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

export function timeAgo(iso) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return "just now";
}
