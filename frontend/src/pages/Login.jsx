import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { USE_MOCK } from "../lib/api";
import Field from "../components/Field";
import AuthLayout from "./AuthLayout";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(form);
      toast(`Welcome back, ${u.name.split(" ")[0]}.`);
      navigate(location.state?.from || "/profile", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Pick up where you left off."
      footer={<>New here? <Link to="/signup" className="font-bold text-cobalt hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="College email">
          {(id) => <input id={id} type="email" required autoComplete="email" className="input" value={form.email} onChange={set("email")} />}
        </Field>
        <Field label="Password">
          {(id) => <input id={id} type="password" required autoComplete="current-password" className="input" value={form.password} onChange={set("password")} />}
        </Field>
        {error && <p role="alert" className="rounded-xl bg-rose-tint px-4 py-3 text-sm font-semibold text-rose">{error}</p>}
        <button className="btn btn-primary w-full py-3" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
        {USE_MOCK && (
          <button
            type="button"
            className="btn btn-ghost w-full"
            onClick={() => setForm({ email: "demo@student.edu", password: "demo1234" })}
          >
            Fill in the demo account
          </button>
        )}
      </form>
    </AuthLayout>
  );
}
