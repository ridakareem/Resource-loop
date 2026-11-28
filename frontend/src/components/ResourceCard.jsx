import { Link } from "react-router-dom";
import CategoryArt from "./CategoryArt";
import { categoryLabel, timeAgo, yearLabel } from "../lib/constants";

export default function ResourceCard({ resource: r }) {
  return (
    <Link
      to={`/resources/${r.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white transition-shadow hover:shadow-[0_14px_40px_-18px_rgba(15,27,61,0.45)]"
    >
      <div className="aspect-[4/3] overflow-hidden">
        {r.photo_url ? (
          <img src={r.photo_url} alt={r.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <CategoryArt category={r.category} className="h-full w-full" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-ink-soft">
          <span className="truncate">{categoryLabel(r.category)}</span>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-paper px-2.5 py-1 text-ink">{r.condition}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug group-hover:text-cobalt">{r.title}</h3>
        <div className="mt-auto border-t border-dashed border-line pt-4 text-sm text-ink-soft">
          <p className="truncate font-medium text-ink">{r.owner?.name}</p>
          <p className="truncate">{r.owner?.department}</p>
          <p className="truncate">{yearLabel(r.owner?.year)}, listed {timeAgo(r.created_at)}</p>
        </div>
      </div>
    </Link>
  );
}

export function ResourceSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-5 w-4/5 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}
