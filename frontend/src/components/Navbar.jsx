import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import Avatar from "./Avatar";

const linkCls = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const onLogout = () => {
    logout();
    close();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" onClick={close} aria-label="ResourceLoop home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <NavLink to="/browse" className={linkCls}>Browse</NavLink>
          <NavLink to="/mentors" className={linkCls}>Mentors</NavLink>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/resources/new" className="btn btn-primary">Share an item</Link>
              <Link to="/profile" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-white" aria-label="Your profile">
                <Avatar name={user.name} size="h-9 w-9 text-xs" />
                <span className="text-sm font-semibold">{user.name.split(" ")[0]}</span>
              </Link>
              <button onClick={onLogout} className="text-sm font-semibold text-ink-soft hover:text-ink">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-2 text-sm font-semibold text-ink-soft hover:text-ink">Log in</Link>
              <Link to="/signup" className="btn btn-dark">Create account</Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-paper px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            <NavLink to="/browse" className={linkCls} onClick={close}>Browse</NavLink>
            <NavLink to="/mentors" className={linkCls} onClick={close}>Mentors</NavLink>
            {user ? (
              <>
                <NavLink to="/resources/new" className={linkCls} onClick={close}>Share an item</NavLink>
                <NavLink to="/profile" className={linkCls} onClick={close}>Profile</NavLink>
                <button onClick={onLogout} className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-ink-soft">Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkCls} onClick={close}>Log in</NavLink>
                <NavLink to="/signup" className={linkCls} onClick={close}>Create account</NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
