import { useState } from "react"
import { NavLink } from "react-router-dom"

const STYLES = `
  .nav-root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-inner {
    max-width: 100%;
    padding: 0 1.5rem;
    height: 56px;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  /* Logo */
  .nav-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    flex-shrink: 0;
    order: -1;
    margin-right: auto;
  }

  .nav-logo-text-wrap {
    text-align: left;
  }

  .nav-logo-icon {
    width: 28px; height: 28px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #2563eb;
    flex-shrink: 0;
  }

  .nav-logo-text {
    font-weight: 700;
    font-size: 0.95rem;
    color: #111827;
    letter-spacing: -0.01em;
  }

  .nav-logo-sub {
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #9ca3af;
    margin-top: 3px;
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
    color: #6b7280;
    transition: color 0.15s, background 0.15s;
    white-space: nowrap;
  }

  .nav-link:hover {
    color: #111827;
    background: #f3f4f6;
  }

  .nav-link.active {
    color: #2563eb;
    background: #eff6ff;
  }

  .nav-link svg { flex-shrink: 0; }

  /* Mobile menu toggle */
  .nav-toggle {
    display: none;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.4rem 0.6rem;
    color: #6b7280;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 500;
  }
  .nav-toggle:hover { color: #111827; border-color: #d1d5db; background: #f9fafb; }

  /* Mobile drawer */
  @media (max-width: 700px) {
    .nav-toggle { display: flex; }
    .nav-logo { order: 0; margin-right: 0; margin-left: auto; }
    .nav-logo-text-wrap { text-align: right; }
    .nav-links {
      display: none;
      position: absolute;
      top: 56px; left: 0;
      min-width: 180px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 10px 10px 0;
      flex-direction: column;
      align-items: stretch;
      padding: 0.5rem 0.75rem 0.75rem;
      gap: 0.25rem;
      box-shadow: 0 8px 16px rgba(0,0,0,0.08);
    }
    .nav-links.open { display: flex; }
    .nav-link { padding: 0.6rem 0.75rem; }
  }
`

// const NAV_ITEMS = [
//   {
//     to: "/",
//     label: "Entries",
//     end: true,
//     icon: (
//       <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
//         <rect x="1" y="1" width="12" height="3" rx="1" stroke="currentColor" strokeWidth="1.3"/>
//         <rect x="1" y="6" width="12" height="3" rx="1" stroke="currentColor" strokeWidth="1.3"/>
//         <rect x="1" y="11" width="7" height="2" rx="1" stroke="currentColor" strokeWidth="1.3"/>
//       </svg>
//     ),
//   },
// ]
const NAV_ITEMS = []

export default function Navbar({ onMenuToggle }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{STYLES}</style>
      <nav className="nav-root">
        <div className="nav-inner" style={{ position: "relative" }}>

          {/* Mobile toggle */}
          <button className="nav-toggle" onClick={() => { setOpen(v => !v); onMenuToggle?.(); }} aria-label="Menu">
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

          {/* Links */}
          <div className={`nav-links${open ? " open" : ""}`}>
            {NAV_ITEMS.map(({ to, label, end, icon }) => (
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

          {/* Logo */}
          <NavLink to="/" className="nav-logo" onClick={() => setOpen(false)}>
            <div className="nav-logo-text-wrap">
              <div className="nav-logo-text">Log My Standup</div>
              <div className="nav-logo-sub">Daily Productivity Tracker</div>
            </div>
            <div className="nav-logo-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
          </NavLink>

        </div>
      </nav>
    </>
  )
}
