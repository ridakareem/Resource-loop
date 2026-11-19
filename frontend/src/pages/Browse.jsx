import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { CATEGORIES } from "../lib/constants";
import ResourceCard, { ResourceSkeleton } from "../components/ResourceCard";
import EmptyState from "../components/EmptyState";

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const [text, setText] = useState(q);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  // keep the box in sync when the URL changes (e.g. from the home page)
  useEffect(() => {
    setText(q);
  }, [q]);

  // debounce typing into the URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (text === q) return;
      const next = new URLSearchParams(params);
      text ? next.set("q", text) : next.delete("q");
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let live = true;
    setItems(null);
    setError("");
    api.resources
      .list({ q, category })
      .then((d) => live && setItems(d))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [q, category]);

  const setCategory = (id) => {
    const next = new URLSearchParams(params);
    id ? next.set("category", id) : next.delete("category");
    setParams(next);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Browse items</h1>
      <p className="mt-2 text-ink-soft">Everything students on campus are ready to pass on.</p>

      <div className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="browse-search" className="sr-only">Search items</label>
          <input
            id="browse-search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by title or description"
            className="input max-w-xl py-3"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button className="chip" aria-pressed={!category} onClick={() => setCategory("")}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {error ? (
          <EmptyState title="Couldn't load items" body={error} />
        ) : !items ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ResourceSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nothing matches yet"
            body={q || category ? "Try a different keyword or clear the category filter." : "No one has listed an item yet. Be the first."}
            action={<Link to="/resources/new" className="btn btn-primary">Share an item</Link>}
          />
        ) : (
          <>
            <p className="mb-4 text-sm font-semibold text-ink-soft">{items.length} {items.length === 1 ? "item" : "items"}</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((r) => <ResourceCard key={r.id} resource={r} />)}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
