import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { categoryLabel, timeAgo, yearLabel } from "../lib/constants";
import Avatar from "../components/Avatar";
import CategoryArt from "../components/CategoryArt";
import Modal from "../components/Modal";
import Field from "../components/Field";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";

export default function ResourceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [r, setR] = useState(null);
  const [error, setError] = useState("");
  const [myRequest, setMyRequest] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    api.resources.get(id).then(setR).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!user) return setMyRequest(null);
    api.requests
      .sent()
      .then((list) => setMyRequest(list.find((q) => q.resource?.id === id) || null))
      .catch(() => {});
  }, [user, id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="We couldn't find this listing" body={error} action={<Link to="/browse" className="btn btn-primary">Back to browse</Link>} />
      </div>
    );
  }
  if (!r) return <div className="mx-auto max-w-5xl px-4 py-16"><div className="skeleton h-96 rounded-3xl" /></div>;

  const isOwner = user && r.owner?.id === user.id;

  const sendRequest = async (e) => {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      const q = await api.requests.create(r.id, message.trim());
      setMyRequest(q);
      setShowRequest(false);
      setMessage("");
      toast("Request sent. You'll see the owner's reply here and on your profile.");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.resources.remove(r.id);
      toast("Listing deleted.");
      navigate("/profile");
    } catch (err) {
      toast(err.message, "error");
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/browse" className="text-sm font-bold text-ink-soft hover:text-ink">Back to all items</Link>

      <div className="mt-5 grid gap-10 md:grid-cols-[1.1fr_1fr]">
        <div className="self-start overflow-hidden rounded-3xl border border-line bg-white">
          {r.photo_url ? (
            <img src={r.photo_url} alt={r.title} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <CategoryArt category={r.category} className="aspect-[4/3] w-full" />
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-cobalt-tint px-3 py-1 text-cobalt-deep">{categoryLabel(r.category)}</span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-line">Condition: {r.condition}</span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight">{r.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">Listed {timeAgo(r.created_at)}</p>
          <p className="mt-5 whitespace-pre-line leading-relaxed text-ink/85">{r.description}</p>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
            <Avatar name={r.owner?.name} size="h-12 w-12 text-base" />
            <div className="min-w-0">
              <p className="font-bold">{r.owner?.name}</p>
              <p className="truncate text-sm text-ink-soft">{r.owner?.department}, {yearLabel(r.owner?.year)}</p>
            </div>
          </div>

          <div className="mt-6">
            {isOwner ? (
              <div className="flex flex-wrap gap-3">
                <Link to={`/resources/${r.id}/edit`} className="btn btn-dark">Edit listing</Link>
                <button className="btn btn-danger" onClick={() => setShowDelete(true)}>Delete</button>
              </div>
            ) : !user ? (
              <Link to="/login" state={{ from: `/resources/${r.id}` }} className="btn btn-primary">Log in to request this</Link>
            ) : myRequest ? (
              <div className="rounded-2xl border border-line bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">Your request</p>
                  <StatusBadge status={myRequest.status} />
                </div>
                <p className="mt-2 text-sm text-ink-soft">"{myRequest.message}"</p>
                {myRequest.status === "accepted" && (
                  <p className="mt-3 rounded-xl bg-sage-tint px-4 py-3 text-sm font-semibold text-sage">
                    Accepted. Contact {r.owner?.name}{myRequest.owner?.email ? ` at ${myRequest.owner.email}` : ""} to arrange pickup.
                  </p>
                )}
                {myRequest.status === "declined" && (
                  <p className="mt-3 text-sm text-ink-soft">The owner can't pass this on right now. Browse for similar items.</p>
                )}
              </div>
            ) : (
              <button className="btn btn-primary px-7 py-3" onClick={() => setShowRequest(true)}>Request this item</button>
            )}
          </div>
        </div>
      </div>

      <Modal open={showRequest} onClose={() => setShowRequest(false)} title="Request this item">
        <form onSubmit={sendRequest} className="space-y-5">
          <p className="text-sm text-ink-soft">Tell {r.owner?.name?.split(" ")[0]} why you need it and when you can pick it up.</p>
          <Field label="Your message">
            {(fid) => (
              <textarea id={fid} required minLength={10} rows={4} className="input resize-none" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi, I'm in 2nd year and could collect it after 4 pm." />
            )}
          </Field>
          {formError && <p role="alert" className="text-sm font-semibold text-rose">{formError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setShowRequest(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? "Sending..." : "Send request"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete this listing?">
        <p className="text-ink-soft">This also removes any requests people sent for it. You can't undo this.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Keep listing</button>
          <button className="btn bg-rose text-white hover:bg-[#a63048]" onClick={remove} disabled={busy}>Delete listing</button>
        </div>
      </Modal>
    </section>
  );
}
