import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { CATEGORIES, CONDITIONS } from "../lib/constants";
import Field from "../components/Field";
import CategoryArt from "../components/CategoryArt";

const MAX_MB = 5;

export default function ResourceForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ title: "", description: "", category: "textbooks", condition: "Good" });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.resources
      .get(id)
      .then((r) => {
        if (user && r.owner?.id !== user.id) {
          toast("Only the owner can edit this listing.", "error");
          return navigate(`/resources/${id}`, { replace: true });
        }
        setForm({ title: r.title, description: r.description, category: r.category, condition: r.condition });
        setPreview(r.photo_url);
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErrors((x) => ({ ...x, photo: "Choose an image file (JPG or PNG)." }));
    if (file.size > MAX_MB * 1024 * 1024) return setErrors((x) => ({ ...x, photo: `Photo must be under ${MAX_MB} MB.` }));
    setErrors((x) => ({ ...x, photo: undefined }));
    setPhoto(file);
    setRemovePhoto(false);
    setPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPreview(null);
    setRemovePhoto(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 3) e.title = "Give your item a title of at least 3 characters.";
    if (form.description.trim().length < 10) e.description = "Add a short description (at least 10 characters).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const payload = { ...form, title: form.title.trim(), description: form.description.trim(), photo, remove_photo: removePhoto };
      const saved = editing ? await api.resources.update(id, payload) : await api.resources.create(payload);
      toast(editing ? "Changes saved." : "Your item is listed.");
      navigate(`/resources/${saved.id}`);
    } catch (err) {
      toast(err.message, "error");
      setBusy(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-16"><div className="skeleton h-96 rounded-3xl" /></div>;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to={editing ? `/resources/${id}` : "/browse"} className="text-sm font-bold text-ink-soft hover:text-ink">Back</Link>
      <h1 className="mt-4 text-4xl font-extrabold">{editing ? "Edit your listing" : "Share an item"}</h1>
      <p className="mt-2 text-ink-soft">One clear photo and an honest condition get requests faster.</p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-6 rounded-3xl border border-line bg-white p-6 sm:p-8">
        <Field label="Title" error={errors.title}>
          {(fid) => <input id={fid} className="input" value={form.title} onChange={set("title")} maxLength={90} placeholder="Casio fx-991EX scientific calculator" />}
        </Field>
        <Field label="Description" error={errors.description} hint="What it is, what's included, any wear.">
          {(fid) => <textarea id={fid} rows={4} className="input resize-none" value={form.description} onChange={set("description")} />}
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Category">
            {(fid) => (
              <select id={fid} className="input" value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            )}
          </Field>
          <Field label="Condition">
            {(fid) => (
              <select id={fid} className="input" value={form.condition} onChange={set("condition")}>
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            )}
          </Field>
        </div>

        <Field label="Photo" hint={`JPG or PNG, up to ${MAX_MB} MB. Optional.`} error={errors.photo}>
          {(fid) => (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-32 w-44 shrink-0 overflow-hidden rounded-2xl border border-line">
                {preview ? <img src={preview} alt="Selected photo" className="h-full w-full object-cover" /> : <CategoryArt category={form.category} className="h-full w-full" />}
              </div>
              <div className="flex flex-wrap gap-3">
                <input ref={fileRef} id={fid} type="file" accept="image/*" onChange={pickPhoto} className="sr-only" />
                <label htmlFor={fid} className="btn btn-ghost cursor-pointer">{preview ? "Change photo" : "Choose a photo"}</label>
                {preview && <button type="button" className="btn btn-ghost" onClick={clearPhoto}>Remove</button>}
              </div>
            </div>
          )}
        </Field>

        <div className="flex justify-end gap-3 border-t border-line pt-6">
          <Link to={editing ? `/resources/${id}` : "/browse"} className="btn btn-ghost">Cancel</Link>
          <button className="btn btn-primary px-7" disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Publish listing"}</button>
        </div>
      </form>
    </section>
  );
}
