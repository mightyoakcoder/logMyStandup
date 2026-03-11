import { useState } from "react"
import { NavLink } from "react-router-dom"
// import { useAuth } from "../context/AuthContext.jsx"

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Barlow:wght@300;400;500;600&display=swap');

  .nav-root {
    font-family: 'Barlow', sans-serif;
    background: #1f2128;
    border-bottom: 1px solid #2e3140;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.25rem;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
  }

  /* Logo */
  .nav-logo {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    text-decoration: none;
    flex-shrink: 0;
  }

  .nav-logo-icon {
    width: 28px; height: 28px;
    background: rgba(123,140,255,0.15);
    border: 1px solid rgba(123,140,255,0.25);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #a5b0ff;
    flex-shrink: 0;
  }

  .nav-logo-text {
    font-weight: 600;
    font-size: 1.5rem;
    color: #d4d8e8;
    letter-spacing: -0.01em;
  }

  .nav-logo-sub {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #565c78;
    margin-top: -2px;
  }

  /* Nav links */
  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex: 1;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    color: #8d93ad;
    transition: color 0.15s, background 0.15s;
    white-space: nowrap;
  }

  .nav-link:hover {
    color: #d4d8e8;
    background: rgba(255,255,255,0.04);
  }

  .nav-link.active {
    color: #a5b0ff;
    background: rgba(123,140,255,0.1);
  }

  .nav-link svg { flex-shrink: 0; }

  /* Mobile menu toggle */
  .nav-toggle {
    display: none;
    background: none;
    border: 1px solid #2e3140;
    border-radius: 8px;
    padding: 0.4rem;
    margin: -0.4rem 0 -0.75rem;
    color: #8d93ad;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }
  .nav-toggle:hover { color: #d4d8e8; border-color: #353849; }

  /* Mobile drawer */
  @media (max-width: 540px) {
    .nav-toggle { display: flex; align-items: center; }
    .nav-links {
      display: none;
      position: absolute;
      top: 56px; left: 0; right: 0;
      background: #1f2128;
      border-bottom: 1px solid #2e3140;
      flex-direction: column;
      align-items: stretch;
      padding: 0.5rem 1rem 0.75rem;
      gap: 0.25rem;
    }
    .nav-links.open { display: flex; }
    .nav-link { padding: 0.6rem 0.75rem; }
  }

  /* User / sign-out */
  .nav-user {
    display: flex; align-items: center; gap: 0.625rem; flex-shrink: 0;
  }
  .nav-user-email {
    font-family: 'DM Mono', monospace; font-size: 10px;
    letter-spacing: 0.06em; color: var(--dim);
    max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .nav-signout {
    background: none; border: 1px solid var(--border2); border-radius: 7px;
    padding: 0.3rem 0.65rem; color: var(--text2); cursor: pointer;
    font-family: 'Barlow', sans-serif; font-size: 1rem; font-weight: 500;
    transition: border-color 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .nav-signout:hover { border-color: var(--error); color: var(--error); }

  @media (max-width: 540px) {
    .nav-user-email { display: none; }
  }
`

const NAV_ITEMS = [
  {
    to: "/",
    label: "Upload",
    end: true,   // only mark active on exact /
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 9.5V3M7 3L4.5 5.5M7 3l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: "/gallery",
    label: "Gallery",
    end: false,
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="8" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="1" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="8" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    to: "/admin/audit",
    label: "Audit Log",
    end: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gamepad-directional-icon lucide-gamepad-directional">
        <path d="M11.146 15.854a1.207 1.207 0 0 1 1.708 0l1.56 1.56A2 2 0 0 1 15 18.828V21a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2.172a2 2 0 0 1 .586-1.414z"/>
        <path d="M18.828 15a2 2 0 0 1-1.414-.586l-1.56-1.56a1.207 1.207 0 0 1 0-1.708l1.56-1.56A2 2 0 0 1 18.828 9H21a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1z"/>
        <path d="M6.586 14.414A2 2 0 0 1 5.172 15H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2.172a2 2 0 0 1 1.414.586l1.56 1.56a1.207 1.207 0 0 1 0 1.708z"/>
        <path d="M9 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.172a2 2 0 0 1-.586 1.414l-1.56 1.56a1.207 1.207 0 0 1-1.708 0l-1.56-1.56A2 2 0 0 1 9 5.172z"/>
      </svg>
    ),
  },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  // const { user, logout } = useAuth()
  const user = null;
  // const visibleNavItems = NAV_ITEMS.filter(item =>
  //   item.to !== "/admin/audit" || user?.email === "mightyoakcoder@gmail.com"
  // );
  const visibleNavItems = NAV_ITEMS;

  return (
    <>
      <style>{STYLES}</style>
      <nav className="nav-root">
        <div className="nav-inner" style={{ position: "relative" }}>

{/* Mobile toggle */}
          <button className="nav-toggle" onClick={() => setOpen(v => !v)} aria-label="Menu">
            {open ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )} Menu
          </button>

          {/* Logo */}
          <NavLink to="/" className="nav-logo" onClick={() => setOpen(false)}>
            <div>
              <div className="nav-logo-text">Snow Archive</div>
              <div className="nav-logo-sub">Photo Library</div>
            </div>
          </NavLink>

          {/* Links */}
          <div className={`nav-links${open ? " open" : ""}`}>
            {visibleNavItems.map(({ to, label, end, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </div>

          {/* User info + sign out
          {user ? (
            <div className="nav-user">
              <span className="nav-user-email">{user.email}</span>
              <button className="nav-signout" onClick={logout}>Sign out</button>
            </div>
          ) : (
            <NavLink to="/login" className="nav-signout" style={{ textDecoration: "none" }}>Sign in</NavLink>
          )} */}

        </div>
      </nav>
    </>
  )
}
