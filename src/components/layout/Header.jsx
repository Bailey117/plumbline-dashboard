import React from 'react';
import { useRoute } from '../../context/RouteContext';
import { market } from '../../api/mockData';

const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

const NAV_TABS = [
  { label: "Overview",  name: "overview" },
  { label: "Suppliers", name: "suppliers" },
  { label: "States",    name: "states" },
  { label: "Rates",     name: "rates" },
  { label: "Freight",   name: "freight" },
  { label: "Reports",   name: "reports" },
  { label: "Import",    name: "import",  badge: "SAP" },
];

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LiveDot() {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: "50%",
      background: "var(--up)",
      boxShadow: "0 0 0 4px rgba(14,143,94,0.18)",
      display: "inline-block",
      flexShrink: 0,
    }} />
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M8 2a4 4 0 0 1 4 4v2l1 2H3l1-2V6a4 4 0 0 1 4-4z" />
      <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  );
}

export default function Header({ onSearchOpen, onAlertsOpen, onTweaksOpen, alertCount }) {
  const { route, setRoute } = useRoute();

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      borderBottom: "1px solid var(--line)",
      background: "var(--panel)",
      gap: 20,
      height: 56,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <button
        onClick={() => setRoute({ name: "overview" })}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "transparent", border: "none", cursor: "pointer",
          padding: 0, color: "inherit",
        }}
        aria-label="Go to overview"
      >
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: "linear-gradient(135deg, var(--accent), var(--accent-deep))",
          display: "grid", placeItems: "center",
          color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
          flexShrink: 0,
        }}>
          Pb
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, textAlign: "left" }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Plumbline</span>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Lead trading desk</span>
        </div>
      </button>

      {/* Nav */}
      <nav style={{ display: "flex", gap: 2, marginLeft: 8 }} role="navigation" aria-label="Main navigation">
        {NAV_TABS.map(tab => {
          const active = route.name === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => setRoute({ name: tab.name })}
              aria-current={active ? "page" : undefined}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                border: "none",
                background: "transparent",
                color: active ? "var(--text)" : "var(--muted)",
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                borderRadius: 6,
                position: "relative",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {tab.label}
              {tab.badge && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  color: "var(--muted)",
                  background: "var(--panel-2)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 4,
                  padding: "1px 4px",
                  lineHeight: 1.4,
                }}>
                  {tab.badge}
                </span>
              )}
              {active && (
                <span style={{
                  position: "absolute",
                  left: 12, right: 12, bottom: -17,
                  height: 2,
                  background: "var(--text)",
                  borderRadius: 2,
                }} />
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Search box */}
      <button
        onClick={onSearchOpen}
        aria-label="Search (⌘K)"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          border: "1px solid var(--line-2)",
          borderRadius: 8,
          background: "var(--panel-2)",
          color: "var(--muted)",
          fontSize: 12,
          width: 240,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <SearchIcon />
        <span>Search suppliers, codes, states…</span>
        <span style={{
          marginLeft: "auto",
          fontFamily: mono,
          fontSize: 11,
          color: "var(--dim)",
          background: "var(--bg)",
          border: "1px solid var(--line-2)",
          padding: "1px 5px",
          borderRadius: 4,
        }}>
          ⌘K
        </span>
      </button>

      {/* Live status */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        color: "var(--muted)", fontSize: 12, whiteSpace: "nowrap",
      }}>
        <LiveDot />
        Live · {market.asof.split("·")[1]?.trim() || "16:30 AEST"}
      </div>

      {/* Bell */}
      <button
        onClick={onAlertsOpen}
        aria-label={`Alerts${alertCount ? ` (${alertCount} unread)` : ''}`}
        style={{
          position: "relative",
          width: 32, height: 32,
          borderRadius: 8,
          border: "1px solid var(--line-2)",
          background: "transparent",
          color: "var(--muted)",
          display: "grid", placeItems: "center",
          cursor: "pointer",
        }}
      >
        <BellIcon />
        {alertCount > 0 && (
          <span style={{
            position: "absolute",
            top: 5, right: 5,
            width: 7, height: 7,
            borderRadius: "50%",
            background: "var(--down)",
            border: "1.5px solid var(--panel)",
          }} />
        )}
      </button>

      {/* Tweaks / settings */}
      <button
        onClick={onTweaksOpen}
        aria-label="Open settings"
        style={{
          width: 32, height: 32,
          borderRadius: 8,
          border: "1px solid var(--line-2)",
          background: "transparent",
          color: "var(--muted)",
          display: "grid", placeItems: "center",
          cursor: "pointer",
        }}
      >
        <GearIcon />
      </button>

      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "linear-gradient(135deg, #C7A7FF, var(--accent))",
        display: "grid", placeItems: "center",
        color: "#fff", fontSize: 11, fontWeight: 600,
        flexShrink: 0,
      }}>
        JM
      </div>
    </header>
  );
}
