import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { DEPARTMENTS, YEARS, timeAgo, yearLabel } from "../lib/constants";
import Avatar from "../components/Avatar";
import Field from "../components/Field";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import ResourceCard from "../components/ResourceCard";

const TABS = [
  ["listings", "My listings"],
  ["requests", "Item requests"],
  ["mentorship", "Mentorship"],
];

function ProfileHeader() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(user);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await api.profile.update({ name: form.name.trim(), department: form.department, year: Number(form.year), bio: form.bio || "" });
      setUser(u);
      setEditing(false);
      toast("Profile updated.");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <form onSubmit={save} className="space-y-5 rounded-3xl border border-line bg-white p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-[1.4fr_1.4fr_1fr]">
          <Field label="Name">{(id) => <input id={id} required className="input" value={form.name} onChange={set("name")} />}</Field>
          <Field label="Department">
            {(id) => (
              <select id={id} className="input" value={form.department} onChange={set("department")}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            )}
          </Field>
          <Field label="Year">
            {(id) => (
              <select id={id} className="input" value={form.year} onChange={set("year")}>
                {YEARS.map((y) => <option key={y} value={y}>{yearLabel(y)}</option>)}
              </select>
            )}
          </Field>
        </div>
        <Field label="Short bio" hint="Up to 200 characters.">
          {(id) => <textarea id={id} rows={3} maxLength={200} className="input resize-none" value={form.bio || ""} onChange={set("bio")} />}
        </Field>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => { setForm(user); setEditing(false); }}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save profile"}</button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:p-8">
      <Avatar name={user.name} size="h-20 w-20 text-2xl" />
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-extrabold">{user.name}</h1>
        <p className="mt-1 text-ink-soft">{user.department}, {yearLabel(user.year)}</p>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink/85">{user.bio || "Add a short bio so people know who they're exchanging with."}</p>
      </div>
      <button className="btn btn-ghost self-start" onClick={() => { setForm(user); setEditing(true); }}>Edit profile</button>
    </div>
  );
}

function Listings() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    api.resources.mine().then(setItems).catch(() => setItems([]));
  }, []);
  if (!items) return <div className="skeleton h-48 rounded-3xl" />;
  if (items.length === 0)
    return (
      <EmptyState
        title="You haven't listed anything yet"
        body="Got a textbook, kit or set of notes you're done with? Someone nearby needs it."
        action={<Link to="/resources/new" className="btn btn-primary">Share an item</Link>}
      />
    );
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((r) => <ResourceCard key={r.id} resource={r} />)}
    </div>
  );
}

function RequestRow({ title, to, person, message, status, createdAt, contact, actions }) {
  return (
    <li className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {to ? <Link to={to} className="font-bold hover:text-cobalt">{title}</Link> : <p className="font-bold">{title}</p>}
          <p className="mt-0.5 text-sm text-ink-soft">{person}, {timeAgo(createdAt)}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 rounded-xl bg-paper px-4 py-3 text-sm leading-relaxed">"{message}"</p>
      {status === "accepted" && contact && (
        <p className="mt-3 text-sm font-semibold text-sage">Contact: {contact}</p>
      )}
      {actions}
    </li>
  );
}

function Responder({ onRespond }) {
  const [busy, setBusy] = useState(false);
  const go = async (s) => {
    setBusy(true);
    await onRespond(s);
    setBusy(false);
  };
  return (
    <div className="mt-4 flex gap-3">
      <button className="btn btn-primary" disabled={busy} onClick={() => go("accepted")}>Accept</button>
      <button className="btn btn-ghost" disabled={busy} onClick={() => go("declined")}>Decline</button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}

function ItemRequests() {
  const toast = useToast();
  const [incoming, setIncoming] = useState(null);
  const [sent, setSent] = useState(null);

  const load = useCallback(() => {
    api.requests.received().then(setIncoming).catch(() => setIncoming([]));
    api.requests.sent().then(setSent).catch(() => setSent([]));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const respond = async (id, status) => {
    try {
      await api.requests.respond(id, status);
      toast(status === "accepted" ? "Request accepted." : "Request declined.");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div className="space-y-10">
      <Section title="Requests for your items">
        {!incoming ? <div className="skeleton h-28 rounded-2xl" /> : incoming.length === 0 ? (
          <EmptyState title="No requests yet" body="When someone asks for one of your items, you'll accept or decline it here." />
        ) : (
          <ul className="space-y-4">
            {incoming.map((q) => (
              <RequestRow
                key={q.id}
                title={q.resource?.title}
                to={`/resources/${q.resource?.id}`}
                person={`From ${q.requester?.name}`}
                message={q.message}
                status={q.status}
                createdAt={q.created_at}
                contact={q.requester?.email}
                actions={q.status === "pending" && <Responder onRespond={(s) => respond(q.id, s)} />}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Requests you sent">
        {!sent ? <div className="skeleton h-28 rounded-2xl" /> : sent.length === 0 ? (
          <EmptyState title="You haven't requested anything" body="Find something you need and send the owner a message." action={<Link to="/browse" className="btn btn-primary">Browse items</Link>} />
        ) : (
          <ul className="space-y-4">
            {sent.map((q) => (
              <RequestRow
                key={q.id}
                title={q.resource?.title}
                to={`/resources/${q.resource?.id}`}
                person={`To ${q.owner?.name}`}
                message={q.message}
                status={q.status}
                createdAt={q.created_at}
                contact={q.owner?.email}
              />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function MentorshipTab() {
  const toast = useToast();
  const [offers, setOffers] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [sent, setSent] = useState(null);

  const load = useCallback(() => {
    api.mentors.mine().then(setOffers).catch(() => setOffers([]));
    api.mentorship.received().then(setIncoming).catch(() => setIncoming([]));
    api.mentorship.sent().then(setSent).catch(() => setSent([]));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const respond = async (id, status) => {
    try {
      await api.mentorship.respond(id, status);
      toast(status === "accepted" ? "Request accepted." : "Request declined.");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const removeOffer = async (id) => {
    try {
      await api.mentors.remove(id);
      toast("Mentoring offer removed.");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div className="space-y-10">
      <Section title="Subjects you mentor">
        {!offers ? <div className="skeleton h-20 rounded-2xl" /> : offers.length === 0 ? (
          <EmptyState title="You're not mentoring yet" body="Share a subject you've cracked and let juniors ask for help." action={<Link to="/mentors?offer=1" className="btn btn-primary">Offer to mentor</Link>} />
        ) : (
          <ul className="space-y-3">
            {offers.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5">
                <div>
                  <p className="font-bold">{m.subject}</p>
                  <p className="text-sm text-ink-soft">{m.availability || "Availability not set"}</p>
                </div>
                <button className="btn btn-danger" onClick={() => removeOffer(m.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Requests to you">
        {!incoming ? <div className="skeleton h-28 rounded-2xl" /> : incoming.length === 0 ? (
          <EmptyState title="No mentorship requests yet" body="They'll show up here for you to accept or decline." />
        ) : (
          <ul className="space-y-4">
            {incoming.map((q) => (
              <RequestRow
                key={q.id}
                title={q.mentor?.subject}
                person={`From ${q.requester?.name}`}
                message={q.message}
                status={q.status}
                createdAt={q.created_at}
                contact={q.requester?.email}
                actions={q.status === "pending" && <Responder onRespond={(s) => respond(q.id, s)} />}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Requests you sent">
        {!sent ? <div className="skeleton h-28 rounded-2xl" /> : sent.length === 0 ? (
          <EmptyState title="You haven't asked a mentor yet" action={<Link to="/mentors" className="btn btn-primary">Find a mentor</Link>} />
        ) : (
          <ul className="space-y-4">
            {sent.map((q) => (
              <RequestRow
                key={q.id}
                title={q.mentor?.subject}
                person={`To ${q.mentor?.user?.name}`}
                message={q.message}
                status={q.status}
                createdAt={q.created_at}
                contact={q.mentor?.user?.email}
              />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

export default function Profile() {
  const [tab, setTab] = useState("listings");

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ProfileHeader />

      <div className="mt-10 flex items-center justify-between gap-4 border-b border-line">
        <div role="tablist" aria-label="Profile sections" className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                tab === id ? "border-cobalt text-ink" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "listings" && <Link to="/resources/new" className="btn btn-primary mb-2 hidden sm:inline-flex">Share an item</Link>}
      </div>

      <div role="tabpanel" className="mt-8">
        {tab === "listings" && <Listings />}
        {tab === "requests" && <ItemRequests />}
        {tab === "mentorship" && <MentorshipTab />}
      </div>
    </section>
  );
}
