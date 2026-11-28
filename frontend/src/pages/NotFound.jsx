import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-5xl font-extrabold">This page isn't in the loop</h1>
      <p className="mt-4 text-ink-soft">The link may be old or mistyped. Try browsing what's available instead.</p>
      <Link to="/browse" className="btn btn-primary mt-8">Browse items</Link>
    </section>
  );
}
