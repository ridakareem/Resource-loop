import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            A campus exchange for books, kits, notes and know-how. What you've outgrown is exactly what a junior needs.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-bold">Explore</p>
          <ul className="mt-3 space-y-2 text-white/70">
            <li><Link className="hover:text-white" to="/browse">Browse items</Link></li>
            <li><Link className="hover:text-white" to="/resources/new">Share an item</Link></li>
            <li><Link className="hover:text-white" to="/mentors">Find a mentor</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-bold">Your account</p>
          <ul className="mt-3 space-y-2 text-white/70">
            <li><Link className="hover:text-white" to="/profile">Profile and requests</Link></li>
            <li><Link className="hover:text-white" to="/login">Log in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        ResourceLoop, a student project. Always meet in public campus spaces when you exchange items.
      </div>
    </footer>
  );
}
