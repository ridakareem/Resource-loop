import Logo from "../components/Logo";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:py-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-4xl font-extrabold">{title}</h1>
        <p className="mt-2 text-ink-soft">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-6 text-sm text-ink-soft">{footer}</p>
      </div>
      <aside className="relative hidden overflow-hidden rounded-[2rem] bg-ink p-10 text-white lg:block">
        <Logo light />
        <p className="mt-16 font-display text-4xl font-extrabold leading-tight">
          Your old drafter is a junior's first week sorted.
        </p>
        <ul className="mt-8 space-y-3 text-white/75">
          <li>Share what you've outgrown, in a minute.</li>
          <li>Request what you need from your own campus.</li>
          <li>Learn from a senior who has done the course.</li>
        </ul>
        <svg viewBox="0 0 200 200" className="absolute -bottom-20 -right-20 h-72 w-72 opacity-20" fill="none" stroke="#F5B82E" strokeWidth="14" strokeLinecap="round" aria-hidden="true">
          <path d="M150 60a60 60 0 1 0 8 48" />
          <path d="M120 40h40v40" />
        </svg>
      </aside>
    </section>
  );
}
