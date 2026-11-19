export default function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <h3 className="text-xl font-bold">{title}</h3>
      {body && <p className="mx-auto mt-2 max-w-md text-ink-soft">{body}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
