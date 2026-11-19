import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { CATEGORIES } from "../lib/constants";
import { useAuth } from "../context/AuthContext";
import ResourceCard, { ResourceSkeleton } from "../components/ResourceCard";
import CategoryArt from "../components/CategoryArt";
import { LoopMark } from "../components/Logo";

function Ring() {
  return (
    <div className="relative h-36 w-36" aria-hidden="true">
      <svg viewBox="0 0 200 200" className="ring-turn absolute inset-0 h-full w-full">
        <defs>
          <path id="ringpath" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <circle cx="100" cy="100" r="96" fill="#F5B82E" />
        <text fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="19" letterSpacing="2.5" fill="#0F1B3D">
          <textPath href="#ringpath" textLength="486" lengthAdjust="spacing">pass it on, pass it on, pass it on,</textPath>
        </text>
      </svg>
      <LoopMark className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.resources.list().then(setItems).catch(() => setItems([]));
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/browse${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };

  const latest = items?.slice(0, 8);
  const stack = items?.slice(0, 3);
  const tilt = ["-5deg", "3deg", "-1deg"];

  return (
    <>
      {/* Hero */}
      <div className="overflow-x-clip">
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20">
        <div>
          <h1 className="text-5xl font-extrabold leading-[0.95] sm:text-6xl lg:text-[4.6rem]">
            Someone in your department needs what you've outgrown.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            List the books, kits and notes you're done with. Find what you need this semester. Send a request and pick it up on campus.
          </p>

          <form onSubmit={onSearch} className="mt-8 flex max-w-xl gap-2 rounded-2xl border border-line bg-white p-2 shadow-[0_10px_30px_-18px_rgba(15,27,61,0.5)]">
            <label htmlFor="home-search" className="sr-only">Search items</label>
            <input
              id="home-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try calculator, drafter or thermodynamics"
              className="min-w-0 flex-1 bg-transparent px-3 text-[15px] placeholder:text-ink-soft/60 focus:outline-none"
            />
            <button className="btn btn-primary">Search</button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.slice(0, 5).map((c) => (
              <Link key={c.id} to={`/browse?category=${c.id}`} className="chip">{c.label}</Link>
            ))}
          </div>
        </div>

        <div className="relative mx-auto h-[31rem] w-full max-w-sm">
          <div className="absolute -top-2 right-0 z-20">
            <Ring />
          </div>
          {stack
            ? stack.map((r, i) => (
                <Link
                  key={r.id}
                  to={`/resources/${r.id}`}
                  className="slip absolute w-56 overflow-hidden rounded-3xl border border-line bg-white shadow-[0_18px_40px_-20px_rgba(15,27,61,0.55)]"
                  style={{
                    "--r": tilt[i],
                    "--d": `${i * 0.12}s`,
                    top: `${i * 9.8 + (i === 0 ? 2 : 0)}rem`,
                    left: i === 1 ? "auto" : "0",
                    right: i === 1 ? "0" : "auto",
                    transform: `rotate(${tilt[i]})`,
                  }}
                >
                  {r.photo_url ? (
                    <img src={r.photo_url} alt="" className="h-24 w-full object-cover" />
                  ) : (
                    <CategoryArt category={r.category} className="h-24 w-full" />
                  )}
                  <div className="p-4">
                    <p className="line-clamp-1 font-display text-base font-bold">{r.title}</p>
                    <p className="mt-1 text-xs text-ink-soft">{r.owner?.name}, {r.condition}</p>
                  </div>
                </Link>
              ))
            : null}
        </div>
      </section>
      </div>

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-7 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Just listed</h2>
          <Link to="/browse" className="text-sm font-bold text-cobalt hover:underline">See all items</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest
            ? latest.map((r) => <ResourceCard key={r.id} resource={r} />)
            : Array.from({ length: 4 }).map((_, i) => <ResourceSkeleton key={i} />)}
        </div>
      </section>

      {/* How it works: a real sequence, so numbered */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl text-3xl font-extrabold sm:text-4xl">Three steps from your shelf to someone's desk</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ["List it", "Add a title, a short description, the condition and one photo. Takes about a minute."],
            ["Find it", "Search by keyword or filter by category to see what seniors in your department are giving away."],
            ["Request it", "Send a short message. The owner accepts or declines, and you see the status right away."],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-3xl border border-line bg-white p-7">
              <span className="font-display text-5xl font-extrabold text-cobalt/25">{i + 1}</span>
              <h3 className="mt-3 text-xl font-bold">{t}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Mentorship band: the one loud colour block */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-8 rounded-[2rem] bg-marigold p-8 sm:p-12 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-3xl font-extrabold sm:text-5xl">Stuck on a subject? A senior has been there.</h2>
            <p className="mt-4 max-w-lg text-lg text-ink/80">
              Browse students who offer to mentor a subject, or offer your own. Aptitude, embedded systems, lab reports, whatever you've cracked.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link to="/mentors" className="btn btn-dark">Find a mentor</Link>
            <Link to={user ? "/mentors?offer=1" : "/signup"} className="btn border border-ink/25 bg-white/60 text-ink hover:bg-white">
              Offer to mentor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
