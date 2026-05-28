import React, { useState, useEffect, useRef } from 'react';
import { useSuppliers, useStates } from '../../api/hooks';
import { useRoute } from '../../context/RouteContext';
import { stateColor } from '../../theme';

const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function SearchPalette({ open, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const { suppliers } = useSuppliers();
  const { states } = useStates();
  const { setRoute } = useRoute();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!open) return;
        onClose();
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  const q = query.toLowerCase().trim();
  const supplierResults = q.length < 1 ? [] : suppliers.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.state.toLowerCase().includes(q) ||
    s.zone.toLowerCase().includes(q)
  ).slice(0, 6);

  const stateResults = q.length < 1 ? [] : states.filter(s =>
    s.code.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q)
  ).slice(0, 3);

  const quickLinks = q.length === 0 ? [
    { label: "Overview", icon: "◉", action: () => { setRoute({ name: "overview" }); onClose(); } },
    { label: "Suppliers", icon: "⊞", action: () => { setRoute({ name: "suppliers" }); onClose(); } },
    { label: "States", icon: "⊡", action: () => { setRoute({ name: "states" }); onClose(); } },
    { label: "Freight calculator", icon: "⊟", action: () => { setRoute({ name: "freight" }); onClose(); } },
    { label: "Rate review", icon: "⊠", action: () => { setRoute({ name: "rates" }); onClose(); } },
  ] : [];

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          zIndex: 300,
          animation: "fadein 100ms ease",
        }}
      />
      <div style={{
        position: "fixed",
        top: "15vh",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(640px, 92vw)",
        background: "var(--panel)",
        border: "1px solid var(--line-2)",
        borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        zIndex: 301,
        overflow: "hidden",
        animation: "popin 140ms ease",
      }}>
        {/* Input row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--line)",
        }}>
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search suppliers, states, zones…"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontSize: 15,
              color: "var(--text)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <kbd style={{
            fontSize: 11,
            color: "var(--dim)",
            background: "var(--panel-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 5,
            padding: "2px 6px",
            fontFamily: mono,
          }}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflow: "auto" }}>
          {quickLinks.length > 0 && (
            <div>
              <div style={{
                padding: "8px 16px 4px",
                fontSize: 10,
                color: "var(--muted)",
                fontWeight: 600,
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}>
                Quick links
              </div>
              {quickLinks.map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 16px",
                    border: "none", background: "transparent",
                    width: "100%", textAlign: "left",
                    cursor: "pointer", color: "var(--text)",
                    fontSize: 13, fontFamily: "inherit",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--panel-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ color: "var(--accent)", fontSize: 14 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {supplierResults.length > 0 && (
            <div>
              <div style={{
                padding: "8px 16px 4px",
                fontSize: 10,
                color: "var(--muted)",
                fontWeight: 600,
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}>
                Suppliers
              </div>
              {supplierResults.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setRoute({ name: "supplier", id: s.id }); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 16px",
                    border: "none", background: "transparent",
                    width: "100%", textAlign: "left",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--panel-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: stateColor(s.state),
                    color: "#fff", fontSize: 9, fontWeight: 600,
                    display: "grid", placeItems: "center",
                    fontFamily: mono, flexShrink: 0,
                  }}>
                    {s.state.slice(0, 2)}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: mono, marginLeft: "auto" }}>
                    {s.zone} · {s.pct_lme}% LME
                  </span>
                </button>
              ))}
            </div>
          )}

          {stateResults.length > 0 && (
            <div>
              <div style={{
                padding: "8px 16px 4px",
                fontSize: 10,
                color: "var(--muted)",
                fontWeight: 600,
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}>
                States
              </div>
              {stateResults.map(s => (
                <button
                  key={s.code}
                  onClick={() => { setRoute({ name: "states" }); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 16px",
                    border: "none", background: "transparent",
                    width: "100%", textAlign: "left",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--panel-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: stateColor(s.code),
                    color: "#fff", fontSize: 9, fontWeight: 600,
                    display: "grid", placeItems: "center",
                    fontFamily: mono, flexShrink: 0,
                  }}>
                    {s.code.slice(0, 2)}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: mono, marginLeft: "auto" }}>
                    {s.supplier_count} suppliers
                  </span>
                </button>
              ))}
            </div>
          )}

          {q.length > 0 && supplierResults.length === 0 && stateResults.length === 0 && (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              No results for "{query}"
            </div>
          )}
        </div>
      </div>
    </>
  );
}
