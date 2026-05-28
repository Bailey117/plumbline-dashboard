import React from 'react';
import Sparkline from '../charts/Sparkline';
import { stateColor } from '../../theme';
import { fmt } from '../../api/mockData';

export { Sparkline };

export const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

export function Card({ children, pad }) {
  return (
    <div style={{
      background: "var(--panel)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      overflow: "hidden",
      padding: pad ? 16 : 0,
    }}>
      {children}
    </div>
  );
}

export function CardHead({ title, sub, action }) {
  return (
    <div style={{
      padding: "14px 16px",
      borderBottom: "1px solid var(--line)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export function KPI({ label, sub, value, secondary, delta, series, inv }) {
  const up = delta.pct >= 0;
  const dColor = delta.pct === 0
    ? "var(--muted)"
    : ((inv ? -delta.pct : delta.pct) >= 0 ? "var(--up)" : "var(--down)");
  return (
    <div style={{
      background: "var(--panel)",
      border: "1px solid var(--line)",
      borderRadius: 10,
      padding: "14px 16px",
      display: "grid",
      gridTemplateRows: "auto 1fr auto",
      gap: 4,
      minHeight: 110,
    }}>
      <div>
        <div style={{
          fontSize: 11, color: "var(--muted)", fontWeight: 600,
          letterSpacing: 0.3, textTransform: "uppercase",
        }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: "var(--dim)" }}>{sub}</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 24, fontFamily: mono, fontWeight: 600, letterSpacing: -0.5 }}>
          {value}
        </span>
        {delta.pct !== 0 && (
          <span style={{ fontSize: 11, color: dColor, fontWeight: 500 }}>
            {delta.sign}{delta.pct_s}%
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: mono }}>{secondary}</span>
        <Sparkline
          data={series.slice(-30)}
          width={70}
          height={20}
          stroke={up ? "var(--up)" : "var(--down)"}
        />
      </div>
    </div>
  );
}

export function Stat({ label, v, span }) {
  return (
    <div style={{
      padding: "10px 12px",
      border: "1px solid var(--line)",
      borderRadius: 8,
      background: "var(--panel-2)",
      gridColumn: span ? "span " + span : undefined,
    }}>
      <div style={{
        fontSize: 10, color: "var(--muted)",
        letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, fontFamily: mono, marginTop: 2 }}>{v}</div>
    </div>
  );
}

export function Stat2({ label, v, sub, delta }) {
  return (
    <div style={{
      padding: "12px 14px",
      border: "1px solid var(--line)",
      borderRadius: 10,
      background: "var(--panel)",
    }}>
      <div style={{
        fontSize: 10, color: "var(--muted)",
        letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 600, fontFamily: mono, marginTop: 2,
        display: "flex", alignItems: "baseline", gap: 6,
      }}>
        {v}
        {delta && delta.pct !== 0 && (
          <span style={{ fontSize: 11, color: delta.pct >= 0 ? "var(--up)" : "var(--down)" }}>
            {delta.sign}{delta.pct_s}%
          </span>
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2, fontFamily: mono }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function Chip({ on, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 10px",
      fontSize: 11,
      border: "1px solid " + (on ? "var(--text)" : "var(--line-2)"),
      background: on ? "var(--text)" : "transparent",
      color: on ? "var(--panel)" : "var(--muted)",
      borderRadius: 12,
      cursor: "pointer",
      fontFamily: mono,
      fontWeight: 500,
    }}>
      {children}
    </button>
  );
}

export function Pill({ label, on }) {
  return (
    <span style={{
      padding: "3px 8px",
      fontSize: 11,
      borderRadius: 11,
      background: on ? "var(--accent-soft)" : "transparent",
      color: on ? "var(--accent)" : "var(--muted)",
      border: "1px solid " + (on ? "transparent" : "var(--line-2)"),
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    }}>
      {on && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} />}
      {label}
    </span>
  );
}

export function Tile({ kind, count, label, detail, cta, onClick, compact }) {
  const colors = {
    warn: { bg: "rgba(167,125,36,0.08)", border: "rgba(167,125,36,0.18)", text: "var(--warn)" },
    info: { bg: "var(--accent-soft)", border: "transparent", text: "var(--accent)" },
    ok:   { bg: "var(--panel-2)", border: "var(--line)", text: "var(--text)" },
    alert:{ bg: "rgba(209,69,69,0.08)", border: "rgba(209,69,69,0.18)", text: "var(--down)" },
  }[kind] || { bg: "var(--panel-2)", border: "var(--line)", text: "var(--text)" };

  return (
    <div style={{
      padding: compact ? "10px 16px" : "14px 16px",
      borderTop: "1px solid var(--line)",
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap: 14,
      alignItems: "center",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 8,
        background: colors.bg,
        border: "1px solid " + colors.border,
        color: colors.text,
        display: "grid", placeItems: "center",
        fontFamily: mono, fontSize: 16, fontWeight: 700,
      }}>
        {count}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>{detail}</div>
      </div>
      <button onClick={onClick} style={{
        background: "transparent",
        border: "1px solid var(--line-2)",
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: 11,
        color: "var(--muted)",
        cursor: "pointer",
        fontFamily: "inherit",
      }}>
        {cta} →
      </button>
    </div>
  );
}

export function RangePicker({ value, onChange }) {
  return (
    <div style={{
      display: "flex",
      border: "1px solid var(--line-2)",
      borderRadius: 7,
      overflow: "hidden",
      background: "var(--panel)",
    }}>
      {["7D","30D","90D","1Y","All"].map(r => (
        <button key={r} onClick={() => onChange(r)} style={{
          padding: "6px 12px",
          fontSize: 12,
          border: "none",
          borderRight: "1px solid var(--line-2)",
          background: value === r ? "var(--text)" : "transparent",
          color: value === r ? "var(--panel)" : "var(--muted)",
          fontFamily: "inherit",
          fontWeight: 500,
          cursor: "pointer",
        }}>
          {r}
        </button>
      ))}
    </div>
  );
}

export function CurrencyToggle({ value, onChange }) {
  const [c, setC] = React.useState(value || "AUD");
  const handle = (u) => {
    setC(u);
    if (onChange) onChange(u);
  };
  return (
    <div style={{
      display: "flex",
      border: "1px solid var(--line-2)",
      borderRadius: 6,
      overflow: "hidden",
      background: "var(--panel)",
    }}>
      {["USD","AUD"].map(u => (
        <button key={u} onClick={() => handle(u)} style={{
          padding: "5px 10px",
          fontSize: 12,
          border: "none",
          background: c === u ? "var(--text)" : "transparent",
          color: c === u ? "var(--panel)" : "var(--muted)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: 500,
        }}>
          {u}
        </button>
      ))}
    </div>
  );
}

export function SortableHeader({ cols, sortKey, sortDir, onSort }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: cols.map(c => c.w).join(" "),
      padding: "10px 16px",
      fontSize: 10,
      color: "var(--muted)",
      fontWeight: 600,
      letterSpacing: 0.3,
      textTransform: "uppercase",
      borderBottom: "1px solid var(--line)",
      background: "var(--panel-2)",
    }}>
      {cols.map((c, i) => {
        const can = !!c.k;
        const active = c.k === sortKey;
        return (
          <span key={i} style={{
            textAlign: c.num ? "right" : "left",
            cursor: can ? "pointer" : "default",
            color: active ? "var(--text)" : "var(--muted)",
            paddingRight: 6,
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
            justifyContent: c.num ? "flex-end" : "flex-start",
          }} onClick={() => can && onSort(c.k)}>
            {c.l}
            {active && <span style={{ fontSize: 9 }}>{sortDir === "asc" ? "↑" : "↓"}</span>}
          </span>
        );
      })}
    </div>
  );
}

export function SupplierRow({ s, onClick, cols }) {
  const sinceColor = s.days_since > 45 ? "var(--down)" : s.days_since > 20 ? "var(--warn)" : "var(--up)";
  const sc = stateColor(s.state);
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick && onClick()}
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        padding: "11px 16px",
        alignItems: "center",
        fontSize: 13,
        borderBottom: "1px solid var(--line)",
        cursor: "pointer",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--panel-2)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{
        width: 22, height: 22, borderRadius: 5,
        background: sc, color: "#fff",
        fontSize: 10, fontWeight: 600,
        display: "grid", placeItems: "center",
        fontFamily: mono,
      }}>
        {s.state.slice(0, 2)}
      </span>
      <span style={{ fontWeight: 500 }}>{s.name}</span>
      <span style={{ color: "var(--muted)", fontFamily: mono, fontSize: 12 }}>{s.site_count}</span>
      <span>
        <span style={{
          padding: "2px 7px", borderRadius: 4,
          background: "var(--accent-soft)", color: "var(--accent)",
          fontSize: 11, fontWeight: 600, fontFamily: mono,
        }}>
          {s.zone}
        </span>
      </span>
      <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{s.pct_lme}%</span>
      <span style={{ textAlign: "right", fontFamily: mono }}>{fmt.aud(s.price_aud_t, 0)}</span>
      <span style={{ textAlign: "right", fontFamily: mono, color: "var(--muted)" }}>{fmt.aud(s.freight_aud_t, 0)}</span>
      <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{fmt.aud(s.landed_aud_t, 0)}</span>
      <span style={{ display: "flex", justifyContent: "flex-end" }}>
        <Sparkline
          data={s.price_series.slice(-30)}
          width={120} height={26}
          stroke="var(--chart-line)"
          fill="var(--chart-fill)"
        />
      </span>
      <span style={{ textAlign: "right", fontFamily: mono, fontSize: 12, color: sinceColor }}>
        {s.days_since}d
      </span>
    </div>
  );
}

export function Field({ label, v }) {
  return (
    <div>
      <div style={{
        fontSize: 10, color: "var(--muted)",
        letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 14, marginTop: 2 }}>{v}</div>
    </div>
  );
}

export function SiteRow({ site }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "2fr 0.7fr 0.7fr 0.8fr 0.9fr 0.9fr",
      padding: "10px 16px",
      alignItems: "center",
      fontSize: 13,
      borderBottom: "1px solid var(--line)",
    }}>
      <span style={{ fontWeight: 500 }}>{site.short_name}</span>
      <span style={{
        padding: "2px 7px", borderRadius: 4,
        background: "var(--accent-soft)", color: "var(--accent)",
        fontSize: 10, fontWeight: 600, fontFamily: mono,
        display: "inline-block", width: "fit-content",
      }}>
        {site.state}
      </span>
      <span>
        <span style={{
          padding: "2px 7px", borderRadius: 4,
          background: "var(--accent-soft)", color: "var(--accent)",
          fontSize: 11, fontWeight: 600, fontFamily: mono,
        }}>
          {site.zone}
        </span>
      </span>
      <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{site.monthly_t}t</span>
      <span style={{ textAlign: "right", fontFamily: mono, color: "var(--muted)" }}>
        ${Math.round(site.freight_aud_t)}
      </span>
      <span style={{
        textAlign: "right", fontFamily: mono, fontSize: 12,
        color: site.days_since > 40 ? "var(--down)" : site.days_since > 20 ? "var(--warn)" : "var(--up)",
      }}>
        {site.days_since}d ago
      </span>
    </div>
  );
}

export const btnLink = {
  background: "transparent",
  border: "1px solid var(--line-2)",
  borderRadius: 6,
  padding: "5px 10px",
  fontSize: 11,
  color: "var(--muted)",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const btnGhost = {
  padding: "7px 12px",
  fontSize: 12,
  fontWeight: 500,
  border: "1px solid var(--line-2)",
  background: "var(--panel)",
  color: "var(--text)",
  borderRadius: 7,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const btnPrimary = {
  padding: "7px 14px",
  fontSize: 12,
  fontWeight: 500,
  border: "1px solid var(--text)",
  background: "var(--text)",
  color: "var(--panel)",
  borderRadius: 7,
  cursor: "pointer",
  fontFamily: "inherit",
};
