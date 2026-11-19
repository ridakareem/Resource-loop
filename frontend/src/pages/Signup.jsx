import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { DEPARTMENTS, YEARS, yearLabel } from "../lib/constants";
import Field from "../components/Field";
import AuthLayout from "./AuthLayout";

export default function Signup() {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", department: DEPARTMENTS[0], year: 1 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Use a password with at least 8 characters.");
    setBusy(true);
    try {
      await signup({ ...form, year: Number(form.year) });
      toast("Account created. You're in the loop.");
      navigate("/profile", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes a minute, and it's free."
      footer={<>Already have an account? <Link to="/login" className="font-bold text-cobalt hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Full name">
          {(id) => <input id={id} required autoComplete="name" className="input" value={form.name} onChange={set("name")} />}
        </Field>
        <Field label="College email">
          {(id) => <input id={id} type="email" required autoComplete="email" className="input" value={form.email} onChange={set("email")} />}
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          {(id) => <input id={id} type="password" required autoComplete="new-password" className="input" value={form.password} onChange={set("password")} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-[1.5fr_1fr]">
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
        {error && <p role="alert" className="rounded-xl bg-rose-tint px-4 py-3 text-sm font-semibold text-rose">{error}</p>}
        <button className="btn btn-primary w-full py-3" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
      </form>
    </AuthLayout>
  );
}
