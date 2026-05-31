import React, { useState, useMemo } from 'react';
import { useMarketData, useStates, useAlerts, useSuppliers, useFreightZones, fmt, freightAt } from '../api/hooks';
import { useRoute } from '../context/RouteContext';
import LineChart from '../components/charts/LineChart';
import AustraliaMap from '../components/maps/AustraliaMap';
import { Sparkline } from '../components/ui';
import { stateColor } from '../theme';

const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

// ─── Mini range toggle ────────────────────────────────────────────────────────
function RangeToggle({ value, onChange }) {
  return (
    <div style={{
      display: "flex",
      border: "1px solid var(--line-2)",
      borderRadius: 7,
      overflow: "hidden",
      background: "var(--panel-2)",
    }}>
      {["7D", "30D", "90D"].map(r => (
        <button key={r} onClick={() => onChange(r)} style={{
          padding: "5px 10px", fontSize: 11,
          border: "none",
          borderRight: r !== "90D" ? "1px solid var(--line-2)" : "none",
          background: value === r ? "var(--text)" : "transparent",
          color: value === r ? "var(--panel)" : "var(--muted)",
          fontFamily: "inherit", fontWeight: 500, cursor: "pointer",
        }}>
          {r}
        </button>
      ))}
    </div>
  );
}

// ─── KPI card (compact version) ────────────────────────────────────────────────
function KpiCard({ label, sub, value, delta, secondary, series, inv, accent }) {
  const good = inv ? delta.pct <= 0 : delta.pct >= 0;
  const dColor = delta.pct === 0 ? "var(--muted)" : (good ? "var(--up)" : "var(--down)");
  return (
    <div style={{
      background: "var(--panel)",
      border: "1px solid var(--line)",
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <div>
        <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 1 }}>{sub}</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 22, fontFamily: mono, fontWeight: 700, letterSpacing: -0.5 }}>{value}</span>
        {delta.pct !== 0 && (
          <span style={{ fontSize: 11, color: dColor, fontWeight: 600 }}>
            {delta.sign}{delta.pct_s}%
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: mono }}>{secondary}</span>
        {series?.length > 0 && (
          <Sparkline
            data={series.slice(-30)}
            width={64} height={18}
            stroke={dColor === "var(--muted)" ? "var(--chart-line)" : dColor}
          />
        )}
      </div>
    </div>
  );
}

// ─── Thin market status bar ───────────────────────────────────────────────────
function MarketBar({ market }) {
  const lmeDelta = fmt.delta(market.lme_pb_aud, market.lme_pb_aud_prev, 0);
  const audDelta = fmt.delta(market.aud_usd, market.aud_usd_prev, 4);
  const dieDelta = fmt.delta(market.diesel_gate_aud, market.diesel_gate_aud_prev, 3);

  const pills = [
    { label: "LME AUD/t", val: fmt.aud(market.lme_pb_aud, 0), delta: lmeDelta, inv: false },
    { label: "LME USD/t", val: fmt.usd(market.lme_pb_usd, 0), delta: lmeDelta, inv: false },
    { label: "AUD/USD",   val: market.aud_usd.toFixed(4),     delta: audDelta, inv: false },
    { label: "Diesel",    val: "$" + market.diesel_gate_aud.toFixed(3) + "/L", delta: dieDelta, inv: true },
    { label: "Fuel levy", val: "$" + market.fuel_levy_aud.toFixed(3) + "/L", delta: { pct: 0, sign: "", pct_s: "0" }, inv: false },
  ];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      padding: "7px 20px",
      background: "var(--panel-2)",
      borderBottom: "1px solid var(--line)",
      fontSize: 11,
      flexShrink: 0,
      overflow: "hidden",
    }}>
      {pills.map((p, i) => {
        const good = p.inv ? p.delta.pct <= 0 : p.delta.pct >= 0;
        const dColor = p.delta.pct === 0 ? "var(--dim)" : (good ? "var(--up)" : "var(--down)");
        return (
          <React.Fragment key={p.label}>
            {i > 0 && <span style={{ color: "var(--line-2)", margin: "0 12px" }}>│</span>}
            <span style={{ color: "var(--dim)", marginRight: 5 }}>{p.label}</span>
            <span style={{ fontFamily: mono, fontWeight: 700, color: "var(--text)" }}>{p.val}</span>
            {p.delta.pct !== 0 && (
              <span style={{ fontFamily: mono, color: dColor, marginLeft: 4, fontWeight: 500 }}>
                {p.delta.sign}{p.delta.pct_s}%
              </span>
            )}
          </React.Fragment>
        );
      })}
      <span style={{ marginLeft: "auto", color: "var(--dim)", fontFamily: mono, fontSize: 10 }}>
        {market.asof}
      </span>
    </div>
  );
}

// ─── What-if calculator (uses real zones + real supplier averages) ─────────────
function WhatIfCard({ market, zones, suppliers }) {
  const [lme, setLme] = useState(market.lme_pb_usd);
  const [aud, setAud] = useState(market.aud_usd);
  const [diesel, setDiesel] = useState(market.diesel_gate_aud);
  const lmeAud = lme / aud;

  const zoneRows = useMemo(() => {
    const byZone = {};
    suppliers.forEach(s => {
      if (!byZone[s.zone]) byZone[s.zone] = { sumPct: 0, n: 0 };
      byZone[s.zone].sumPct += s.pct_lme;
      byZone[s.zone].n++;
    });
    const zoneMap = Object.fromEntries(zones.map(z => [z.code, z]));
    return Object.entries(byZone)
      .map(([code, d]) => ({
        zone: code,
        name: zoneMap[code]?.name || code,
        avgPct: +(d.sumPct / d.n).toFixed(1),
        count: d.n,
      }))
      .sort((a, b) => b.avgPct - a.avgPct)
      .slice(0, 5);
  }, [suppliers, zones]);

  const sliders = [
    { label: "LME", unit: "USD/t", v: lme, min: 1600, max: 2600, step: 5, set: setLme, fmtFn: v => "US$" + Math.round(v).toLocaleString() },
    { label: "FX",  unit: "AUD/USD", v: aud, min: 0.52, max: 0.80, step: 0.001, set: setAud, fmtFn: v => v.toFixed(4) },
    { label: "Fuel", unit: "$/L",  v: diesel, min: 1.5, max: 2.6, step: 0.01, set: setDiesel, fmtFn: v => "$" + v.toFixed(2) },
  ];

  return (
    <div style={{
      background: "var(--panel)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      padding: 14,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
        Landed cost · what-if
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        {sliders.map(({ label, unit, v, min, max, step, set, fmtFn }) => (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {label} <span style={{ color: "var(--dim)" }}>· {unit}</span>
              </span>
              <span style={{ fontSize: 12, fontFamily: mono, fontWeight: 700 }}>{fmtFn(v)}</span>
            </div>
            <input
              type="range" min={min} max={max} step={step} value={v}
              onChange={e => set(+e.target.value)}
              style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
            />
          </div>
        ))}
      </div>

      <div style={{
        background: "var(--bg)",
        borderRadius: 8,
        border: "1px solid var(--line)",
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 10px",
          borderBottom: "1px solid var(--line)",
          background: "var(--panel-2)",
        }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>LME AUD/t</span>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: mono }}>{fmt.aud(lmeAud, 0)}</span>
        </div>
        {zoneRows.map(z => {
          const price = lmeAud * z.avgPct / 100;
          const freight = freightAt(z.zone, diesel);
          const landed = price + freight;
          return (
            <div key={z.zone} style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto auto",
              gap: 8,
              padding: "7px 10px",
              borderBottom: "1px solid var(--line)",
              alignItems: "center",
            }}>
              <span style={{
                fontSize: 9, fontWeight: 700, fontFamily: mono,
                background: "var(--accent-soft)", color: "var(--accent)",
                padding: "2px 5px", borderRadius: 4,
              }}>
                {z.zone}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {z.avgPct}% LME · {z.count} suppliers
              </span>
              <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: mono }}>
                +{fmt.aud(freight, 0)} freight
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: mono }}>
                {fmt.aud(landed, 0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Top suppliers mini-table ─────────────────────────────────────────────────
function TopSuppliers({ suppliers, onNavigate }) {
  const top = useMemo(() =>
    [...suppliers].sort((a, b) => b.avg_monthly_t - a.avg_monthly_t).slice(0, 6),
    [suppliers]
  );
  const maxT = top[0]?.avg_monthly_t || 1;

  return (
    <div style={{
      background: "var(--panel)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 14px",
        borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Top suppliers · monthly volume</div>
        <button
          onClick={() => onNavigate("suppliers")}
          style={{
            fontSize: 11, padding: "3px 8px",
            border: "1px solid var(--line-2)", borderRadius: 5,
            background: "transparent", color: "var(--muted)",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          All →
        </button>
      </div>
      {top.map((s, i) => {
        const barW = (s.avg_monthly_t / maxT) * 100;
        const sc = stateColor(s.state);
        return (
          <div
            key={s.id}
            onClick={() => onNavigate("supplier", s.id)}
            style={{
              padding: "9px 14px",
              borderBottom: "1px solid var(--line)",
              cursor: "pointer",
              position: "relative",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--panel-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: barW + "%", background: "var(--accent-soft)", opacity: 0.6, borderRight: "2px solid var(--accent)", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "14px auto 1fr auto auto", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: mono }}>{i + 1}</span>
              <span style={{
                width: 18, height: 18, borderRadius: 4,
                background: sc, color: "#fff",
                fontSize: 8, fontWeight: 700,
                display: "grid", placeItems: "center",
                fontFamily: mono, flexShrink: 0,
              }}>
                {s.state.slice(0, 2)}
              </span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{s.zone} · {s.pct_lme}% LME</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: mono }}>{s.avg_monthly_t.toFixed(0)}t</span>
              <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: mono, width: 42, textAlign: "right" }}>
                {s.days_since}d
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Alert row (compact) ─────────────────────────────────────────────────────
const SEV = {
  alert: { dot: "var(--down)", label: "ALERT" },
  warn:  { dot: "var(--warn)", label: "WARN" },
  info:  { dot: "var(--accent)", label: "INFO" },
  ok:    { dot: "var(--up)", label: "OK" },
};

function AlertStrip({ alerts, onNav }) {
  if (alerts.length === 0) return null;
  return (
    <div style={{
      background: "var(--panel)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{ padding: "11px 14px 9px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Active alerts</div>
        <span style={{
          fontSize: 10, fontWeight: 700,
          background: "rgba(209,69,69,0.12)", color: "var(--down)",
          padding: "1px 6px", borderRadius: 10,
        }}>
          {alerts.length}
        </span>
      </div>
      {alerts.map(a => {
        const sev = SEV[a.sev] || SEV.info;
        return (
          <div
            key={a.id}
            onClick={() => onNav(a)}
            style={{
              display: "grid",
              gridTemplateColumns: "8px 1fr auto",
              gap: 10, padding: "10px 14px",
              borderBottom: "1px solid var(--line)",
              cursor: "pointer", alignItems: "flex-start",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--panel-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: sev.dot, marginTop: 3, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{a.body}</div>
            </div>
            <div style={{ fontSize: 10, color: "var(--dim)", whiteSpace: "nowrap", textAlign: "right", fontFamily: mono }}>
              {a.t}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mini secondary metric (below hero chart) ─────────────────────────────────
function SecondaryTile({ label, value, delta, series, inv }) {
  const good = inv ? delta.pct <= 0 : delta.pct >= 0;
  const dColor = delta.pct === 0 ? "var(--muted)" : (good ? "var(--up)" : "var(--down)");
  return (
    <div style={{
      background: "var(--panel)",
      border: "1px solid var(--line)",
      borderRadius: 10,
      padding: "10px 12px",
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 17, fontFamily: mono, fontWeight: 700 }}>{value}</span>
        {delta.pct !== 0 && (
          <span style={{ fontSize: 11, color: dColor, fontWeight: 600 }}>{delta.sign}{delta.pct_s}%</span>
        )}
      </div>
      {series?.length > 0 && (
        <Sparkline data={series.slice(-30)} width={80} height={16} stroke={dColor === "var(--muted)" ? "var(--chart-line)" : dColor} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const { market, history } = useMarketData();
  const { states } = useStates();
  const { alerts } = useAlerts();
  const { suppliers } = useSuppliers();
  const { freight_zones: zones } = useFreightZones();
  const { setRoute } = useRoute();
  const [range, setRange] = useState("90D");
  const [hoverState, setHoverState] = useState(null);
  const [chartCurrency, setChartCurrency] = useState("AUD");

  const navigate = (name, id) => setRoute(id ? { name, id } : { name });

  const lmeDelta  = fmt.delta(market.lme_pb_aud, market.lme_pb_aud_prev, 0);
  const audDelta  = fmt.delta(market.aud_usd, market.aud_usd_prev, 4);
  const dieeDelta = fmt.delta(market.diesel_gate_aud, market.diesel_gate_aud_prev, 3);

  const stateVals   = Object.fromEntries(states.map(s => [s.code, s.monthly_tonnes]));
  const activeState = hoverState ? states.find(s => s.code === hoverState) : null;

  const RANGE_DAYS = { "7D": 7, "30D": 30, "90D": 90 };
  const rangeN = RANGE_DAYS[range] || 90;
  const slicedDays   = history.days.slice(-rangeN);
  const slicedLmeAud = history.lme_pb_aud.slice(-rangeN);
  const slicedLmeUsd = history.lme_pb_usd.slice(-rangeN);

  const chartData   = chartCurrency === "AUD" ? slicedLmeAud : slicedLmeUsd;
  const chartLabels = slicedDays.map(d => d.slice(5));
  const chartHigh   = Math.max(...chartData);
  const chartLow    = Math.min(...chartData);
  const rangeReturn = chartData.length > 1
    ? fmt.delta(chartData[chartData.length - 1], chartData[0], 0)
    : null;

  const warnAlerts = alerts.filter(a => a.sev === "warn" || a.sev === "alert").slice(0, 3);

  const handleAlertNav = (a) => {
    if (a.cat === "pickups") navigate("suppliers");
    else if (a.cat === "rates") navigate("rates");
    else if (a.cat === "sap") navigate("import");
    else if (a.cat === "contracts") navigate("reports");
    else navigate("suppliers");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Thin live market ticker */}
      <MarketBar market={market} />

      {/* Two-column grid */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 370px",
        minHeight: 0,
        overflow: "hidden",
      }}>
        {/* ─── LEFT: hero chart area ─────────────────────────────────────── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          borderRight: "1px solid var(--line)",
        }}>
          {/* Page title row */}
          <div style={{
            padding: "18px 24px 14px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
                Market overview
              </div>
              <h1 style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.1 }}>
                Today's pricing inputs
              </h1>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ display: "flex", border: "1px solid var(--line-2)", borderRadius: 7, overflow: "hidden" }}>
                {["AUD", "USD"].map(u => (
                  <button key={u} onClick={() => setChartCurrency(u)} style={{
                    padding: "5px 10px", fontSize: 11,
                    border: "none",
                    background: chartCurrency === u ? "var(--text)" : "transparent",
                    color: chartCurrency === u ? "var(--panel)" : "var(--muted)",
                    cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                  }}>{u}</button>
                ))}
              </div>
              <RangeToggle value={range} onChange={setRange} />
            </div>
          </div>

          {/* 4 KPI cards */}
          <div style={{ padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, flexShrink: 0 }}>
            <KpiCard
              label="LME Lead" sub="Cash settle · AUD/t"
              value={fmt.aud(market.lme_pb_aud, 0)}
              secondary={fmt.usd(market.lme_pb_usd, 0) + " USD/t"}
              delta={lmeDelta} series={history.lme_pb_aud}
            />
            <KpiCard
              label="AUD / USD" sub="RBA 4pm fix"
              value={market.aud_usd.toFixed(4)}
              secondary={"prev " + market.aud_usd_prev.toFixed(4)}
              delta={audDelta} series={history.aud_usd}
            />
            <KpiCard
              label="Diesel TGP" sub="National · AIP ex-GST"
              value={"$" + market.diesel_gate_aud.toFixed(3)}
              secondary={"prev $" + market.diesel_gate_aud_prev.toFixed(3)}
              delta={dieeDelta} series={history.diesel} inv
            />
            <KpiCard
              label="Fuel Levy" sub="Excise + RUC per litre"
              value={"$" + market.fuel_levy_aud.toFixed(3)}
              secondary="Flat rate"
              delta={{ pct: 0, sign: "", pct_s: "0.00", abs_s: "0" }}
              series={history.diesel.map(() => market.fuel_levy_aud)}
            />
          </div>

          {/* Hero chart */}
          <div style={{
            margin: "14px 24px",
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: "16px 20px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flex: 1,
            minHeight: 280,
          }}>
            {/* Chart header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>
                  LME Lead · {chartCurrency} · {range} history
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 3 }}>
                  <span style={{ fontSize: 30, fontFamily: mono, fontWeight: 700, letterSpacing: -1 }}>
                    {chartCurrency === "AUD" ? fmt.aud(market.lme_pb_aud, 0) : fmt.usd(market.lme_pb_usd, 0)}
                  </span>
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: lmeDelta.pct >= 0 ? "var(--up)" : "var(--down)",
                  }}>
                    {lmeDelta.sign}{chartCurrency === "AUD" ? fmt.aud(+lmeDelta.abs_s, 0) : fmt.usd(+lmeDelta.abs_s, 0)}
                    {" "}({lmeDelta.sign}{lmeDelta.pct_s}% today)
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {rangeReturn && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{range} return</div>
                )}
                {rangeReturn && (
                  <div style={{
                    fontSize: 15, fontFamily: mono, fontWeight: 700,
                    color: rangeReturn.pct >= 0 ? "var(--up)" : "var(--down)",
                  }}>
                    {rangeReturn.sign}{rangeReturn.pct_s}%
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 4, justifyContent: "flex-end" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 0.3 }}>Range H</div>
                    <div style={{ fontSize: 12, fontFamily: mono, fontWeight: 600 }}>
                      {chartCurrency === "AUD" ? fmt.aud(chartHigh, 0) : fmt.usd(chartHigh, 0)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 0.3 }}>Range L</div>
                    <div style={{ fontSize: 12, fontFamily: mono, fontWeight: 600 }}>
                      {chartCurrency === "AUD" ? fmt.aud(chartLow, 0) : fmt.usd(chartLow, 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div style={{ flex: 1, minHeight: 160 }}>
              <LineChart
                data={chartData}
                labels={chartLabels}
                width={820} height={220}
                mode="area"
                stroke="var(--chart-line)"
                fill="var(--chart-fill)"
                grid
                gridColor="rgba(0,0,0,0.04)"
                axisColor="var(--muted)"
                valueFmt={chartCurrency === "AUD"
                  ? v => "$" + Math.round(v).toLocaleString()
                  : v => "US$" + Math.round(v).toLocaleString()
                }
              />
            </div>
          </div>

          {/* Secondary tiles */}
          <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, flexShrink: 0 }}>
            <SecondaryTile
              label="AUD/USD" value={market.aud_usd.toFixed(4)}
              delta={audDelta} series={history.aud_usd}
            />
            <SecondaryTile
              label="Diesel TGP" value={"$" + market.diesel_gate_aud.toFixed(3) + "/L"}
              delta={dieeDelta} series={history.diesel} inv
            />
            <SecondaryTile
              label="LME USD/t" value={fmt.usd(market.lme_pb_usd, 0)}
              delta={lmeDelta} series={history.lme_pb_usd}
            />
            <SecondaryTile
              label="Fuel levy" value={"$" + market.fuel_levy_aud.toFixed(3) + "/L"}
              delta={{ pct: 0, sign: "", pct_s: "0" }} series={[]}
            />
          </div>
        </div>

        {/* ─── RIGHT: sidebar ───────────────────────────────────────────── */}
        <div style={{
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: "16px 16px 20px",
        }}>
          {/* Australia map */}
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 14px 0",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Volume by state
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>
                  {activeState ? activeState.name : "Monthly intake · tonnes"}
                </div>
              </div>
              <button
                onClick={() => navigate("states")}
                style={{
                  fontSize: 11, padding: "3px 8px",
                  border: "1px solid var(--line-2)", borderRadius: 5,
                  background: "transparent", color: "var(--muted)",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                States →
              </button>
            </div>

            <div style={{ padding: "4px 6px 0" }}>
              <AustraliaMap
                values={stateVals}
                palette={["#EEF0FF", "#D6D8FA", "#B8BCF3", "#8A8FE6", "#5B5BD6", "#3F3FB3"]}
                stroke="var(--panel)"
                labelColor="var(--text)"
                onHover={setHoverState}
                highlight={hoverState}
                getLabel={c => stateVals[c] != null ? Math.round(stateVals[c]) + "t" : "—"}
                onClick={() => navigate("states")}
                height={185}
              />
            </div>

            <div style={{ padding: "6px 14px 12px" }}>
              {activeState ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    ["Suppliers", activeState.supplier_count],
                    ["Monthly", activeState.monthly_tonnes.toFixed(0) + " t"],
                    ["YTD spend", "$" + (activeState.ytd_spend_aud / 1000).toFixed(0) + "k"],
                    ["Avg %LME", activeState.avg_pct_lme + "%"],
                  ].map(([label, val]) => (
                    <div key={label} style={{ padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--bg)" }}>
                      <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: mono, marginTop: 1 }}>{val}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {[...states].sort((a, b) => b.monthly_tonnes - a.monthly_tonnes).map(s => (
                    <div
                      key={s.code}
                      onMouseEnter={() => setHoverState(s.code)}
                      onMouseLeave={() => setHoverState(null)}
                      onClick={() => navigate("states")}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "38px 1fr auto auto",
                        alignItems: "center",
                        gap: 6, padding: "5px 6px",
                        borderRadius: 6,
                        background: hoverState === s.code ? "var(--accent-soft)" : "transparent",
                        cursor: "pointer", fontSize: 12,
                        transition: "background 100ms",
                      }}
                    >
                      <span style={{ fontFamily: mono, color: "var(--muted)", fontSize: 10, fontWeight: 600 }}>{s.code}</span>
                      <span style={{ color: "var(--text)" }}>{s.name}</span>
                      <span style={{ color: "var(--dim)", fontFamily: mono, fontSize: 10 }}>{s.supplier_count}</span>
                      <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 11 }}>{s.monthly_tonnes.toFixed(0)}t</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top suppliers */}
          <TopSuppliers suppliers={suppliers} onNavigate={navigate} />

          {/* Alerts */}
          <AlertStrip alerts={warnAlerts} onNav={handleAlertNav} />

          {/* What-if */}
          <WhatIfCard market={market} zones={zones} suppliers={suppliers} />
        </div>
      </div>
    </div>
  );
}
