import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { yearLabel } from "../lib/constants";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import Field from "../components/Field";
import EmptyState from "../components/EmptyState";

export default function Mentors() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [mentors, setMentors] = useState(null);
  const [error, setError] = useState("");
  const [asked, setAsked] = useState(new Set());
  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [offer, setOffer] = useState({ subject: "", bio: "", availability: "" });
  const [showOffer, setShowOffer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const load = (term = q) =>
    api.mentors.list({ q: term }).then(setMentors).catch((e) => setError(e.message));

  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return setAsked(new Set());
    api.mentorship.sent().then((l) => setAsked(new Set(l.map((x) => x.mentor?.id)))).catch(() => {});
  }, [user]);

  // /mentors?offer=1 opens the offer form straight away
  useEffect(() => {
    if (params.get("offer") && user) setShowOffer(true);
  }, [params, user]);

  const closeOffer = () => {
    setShowOffer(false);
    if (params.get("offer")) setParams({}, { replace: true });
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      await api.mentorship.request(target.id, message.trim());
      setAsked((s) => new Set(s).add(target.id));
      toast(`Request sent to ${target.user?.name.split(" ")[0]}.`);
      setTarget(null);
      setMessage("");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitOffer = async (e) => {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      await api.mentors.offer({ subject: offer.subject.trim(), bio: offer.bio.trim(), availability: offer.availability.trim() });
      toast("You're listed as a mentor.");
      setOffer({ subject: "", bio: "", availability: "" });
      closeOffer();
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Find a mentor</h1>
          <p className="mt-2 max-w-xl text-ink-soft">Seniors and peers who've done the course and are happy to help.</p>
        </div>
        {user ? (
          <button className="btn btn-dark" onClick={() => { setFormError(""); setShowOffer(true); }}>Offer to mentor</button>
        ) : (
          <Link to="/login" state={{ from: "/mentors?offer=1" }} className="btn btn-dark">Log in to offer mentoring</Link>
        )}
      </div>

      <div className="mt-8">
        <label htmlFor="mentor-search" className="sr-only">Search mentors</label>
        <input id="mentor-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by subject or name" className="input max-w-xl py-3" />
      </div>

      <div className="mt-8">
        {error ? (
          <EmptyState title="Couldn't load mentors" body={error} />
        ) : !mentors ? (
          <div className="grid gap-5 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-52 rounded-3xl" />)}</div>
        ) : mentors.length === 0 ? (
          <EmptyState title="No mentors match" body="Try a different subject, or offer to mentor one yourself." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {mentors.map((m) => {
              const mine = user && m.user?.id === user.id;
              return (
                <article key={m.id} className="flex flex-col rounded-3xl border border-line bg-white p-6">
                  <h2 className="text-2xl font-bold leading-snug">{m.subject}</h2>
                  <div className="mt-4 flex items-center gap-3">
                    <Avatar name={m.user?.name} />
                    <div className="min-w-0">
                      <p className="font-bold">{m.user?.name}</p>
                      <p className="truncate text-sm text-ink-soft">{m.user?.department}, {yearLabel(m.user?.year)}</p>
                    </div>
                  </div>
                  <p className="mt-4 leading-relaxed text-ink/85">{m.bio}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-4">
                    <p className="text-sm text-ink-soft">Available: <span className="font-semibold text-ink">{m.availability || "Ask to arrange"}</span></p>
                    {mine ? (
                      <span className="text-sm font-semibold text-ink-soft">Your offer</span>
                    ) : !user ? (
                      <Link to="/login" state={{ from: "/mentors" }} className="btn btn-ghost">Log in to ask</Link>
                    ) : asked.has(m.id) ? (
                      <span className="rounded-full bg-sage-tint px-3 py-1.5 text-sm font-bold text-sage">Request sent</span>
                    ) : (
                      <button className="btn btn-primary" onClick={() => { setFormError(""); setTarget(m); }}>Ask for mentorship</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={Boolean(target)} onClose={() => setTarget(null)} title={`Ask ${target?.user?.name.split(" ")[0] ?? ""} for help`}>
        <form onSubmit={sendRequest} className="space-y-5">
          <p className="text-sm text-ink-soft">Subject: <span className="font-semibold text-ink">{target?.subject}</span></p>
          <Field label="Your message" hint="What do you want help with, and by when?">
            {(fid) => <textarea id={fid} required minLength={10} rows={4} className="input resize-none" value={message} onChange={(e) => setMessage(e.target.value)} />}
          </Field>
          {formError && <p role="alert" className="text-sm font-semibold text-rose">{formError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setTarget(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? "Sending..." : "Send request"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={showOffer} onClose={closeOffer} title="Offer to mentor">
        <form onSubmit={submitOffer} className="space-y-5">
          <Field label="Subject or skill">
            {(fid) => <input id={fid} required minLength={3} className="input" value={offer.subject} onChange={(e) => setOffer({ ...offer, subject: e.target.value })} placeholder="Data structures in C" />}
          </Field>
          <Field label="How can you help?">
            {(fid) => <textarea id={fid} required minLength={10} rows={3} className="input resize-none" value={offer.bio} onChange={(e) => setOffer({ ...offer, bio: e.target.value })} />}
          </Field>
          <Field label="When are you free?">
            {(fid) => <input id={fid} className="input" value={offer.availability} onChange={(e) => setOffer({ ...offer, availability: e.target.value })} placeholder="Weekday evenings" />}
          </Field>
          {formError && <p role="alert" className="text-sm font-semibold text-rose">{formError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={closeOffer}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Publish offer"}</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
