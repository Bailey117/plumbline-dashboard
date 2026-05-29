import React, { useEffect } from 'react';
import { useAlerts } from '../../api/hooks';

const SEV_COLORS = {
  info:  { bg: "var(--accent-soft)", text: "var(--accent)", dot: "var(--accent)" },
  warn:  { bg: "rgba(167,125,36,0.10)", text: "var(--warn)", dot: "var(--warn)" },
  ok:    { bg: "rgba(14,143,94,0.10)", text: "var(--up)", dot: "var(--up)" },
  alert: { bg: "rgba(209,69,69,0.10)", text: "var(--down)", dot: "var(--down)" },
};

const CATS = ["all", "market", "pickups", "rates", "contracts", "sap"];

function AlertItem({ a, onDismiss }) {
  const sev = SEV_COLORS[a.sev] || SEV_COLORS.info;
  return (
    <div style={{
      padding: "12px 16px",
      borderBottom: "1px solid var(--line)",
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      gap: 10,
      alignItems: "flex-start",
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: sev.dot,
        marginTop: 5, flexShrink: 0,
      }} />
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: "var(--dim)", whiteSpace: "nowrap" }}>
              {a.t}
            </span>
            <button onClick={onDismiss} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--dim)', fontSize: 14, padding: '0 2px',
              lineHeight: 1, flexShrink: 0,
            }}>×</button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
          {a.body}
        </div>
        <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 4 }}>
          {a.actor} · {a.date}
        </div>
      </div>
    </div>
  );
}

export default function AlertsPanel({ open, onClose }) {
  const { alerts } = useAlerts();
  const [cat, setCat] = React.useState("all");
  const [dismissed, setDismissed] = React.useState(new Set());

  const filtered = (cat === "all" ? alerts : alerts.filter(a => a.cat === cat)).filter(a => !dismissed.has(a.id));
  const todayCount = alerts.filter(a => a.date === "today" && !dismissed.has(a.id)).length;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.15)",
          zIndex: 200,
          animation: "fadein 120ms ease",
        }}
      />
      {/* Panel */}
      <div style={{
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        width: 420,
        background: "var(--panel)",
        borderLeft: "1px solid var(--line)",
        zIndex: 201,
        display: "flex",
        flexDirection: "column",
        animation: "slidein 180ms ease",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 16px 0",
          borderBottom: "1px solid var(--line)",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Alerts</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {todayCount} today
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close alerts panel"
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: "1px solid var(--line-2)",
                background: "transparent",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: 16,
                display: "grid", placeItems: "center",
                fontFamily: "inherit",
              }}
            >
              ×
            </button>
          </div>

          {/* Category filter */}
          <div style={{
            display: "flex", gap: 4, overflow: "auto",
            paddingBottom: 12,
          }}>
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  border: "1px solid " + (cat === c ? "var(--text)" : "var(--line-2)"),
                  background: cat === c ? "var(--text)" : "transparent",
                  color: cat === c ? "var(--panel)" : "var(--muted)",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  fontWeight: 500,
                  textTransform: "capitalize",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Alert list */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: 13,
            }}>
              No alerts in this category
            </div>
          ) : (
            filtered.map(a => (
              <AlertItem
                key={a.id}
                a={a}
                onDismiss={() => setDismissed(prev => new Set([...prev, a.id]))}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
