import { useId } from "react";

export default function Field({ label, hint, error, children }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children(id)}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
