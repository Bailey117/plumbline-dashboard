import React, { useState } from 'react';
import { useMarketData, useStates, useAlerts, fmt, freightAt } from '../api/hooks';
import { useRoute } from '../context/RouteContext';
import LineChart from '../components/charts/LineChart';
import AustraliaMap from '../components/maps/AustraliaMap';
import { KPI, RangePicker, CardHead, Tile } from '../components/ui';

const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

function WhatIfCard({ market, freightAt }) {
  const [lme, setLme] = useState(market.lme_pb_usd);
  const [aud, setAud] = useState(market.aud_usd);
  const [diesel, setDiesel] = useState(market.diesel_gate_aud);
  const lmeAud = lme / aud;

  const SAMPLE_ZONES = [
    { name: "Metro (Z1)", zone: "Z1", pct: 82 },
    { name: "Regional (Z3)", zone: "Z3", pct: 75 },
    { name: "Remote (Z4)", zone: "Z4", pct: 66 },
  ];

  return (
    <div style={{
      background: "var(--panel)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 11, color: "var(--muted)",
          letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600,
        }}>
          What-if calculator
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
          Move the inputs · see net impact
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {[
          { label: "LME USD/t", v: lme, min: 1700, max: 2400, step: 5, set: setLme, fmtFn: v => "$" + Math.round(v) },
          { label: "AUD/USD",   v: aud, min: 0.55, max: 0.75, step: 0.001, set: setAud, fmtFn: v => v.toFixed(4) },
          { label: "Diesel $/L", v: diesel, min: 1.6, max: 2.4, step: 0.01, set: setDiesel, fmtFn: v => "$" + v.toFixed(2) },
        ].map(({ label, v, min, max, step, set, fmtFn }) => (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 4 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{label}</span>
            <span style={{ fontSize: 11, fontFamily: mono, fontWeight: 600 }}>{fmtFn(v)}</span>
            <input
              type="range" min={min} max={max} step={step} value={v}
              onChange={e => set(+e.target.value)}
              style={{ gridColumn: "1 / -1", width: "100%" }}
            />
          </div>
        ))}

        <div style={{
          background: "var(--bg)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          padding: "10px 12px",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 6,
          fontFamily: mono,
          fontSize: 12,
        }}>
          <span style={{ color: "var(--muted)" }}>LME AUD/t</span>
          <span style={{ fontWeight: 600 }}>{fmt.aud(lmeAud, 0)}</span>
          {SAMPLE_ZONES.map(s => {
            const p = lmeAud * s.pct / 100;
            const f = freightAt(s.zone, diesel);
            return (
              <React.Fragment key={s.zone}>
                <span style={{ color: "var(--muted)", fontSize: 11 }}>
                  {s.name} <span style={{ color: "var(--dim)" }}>({s.pct}%)</span>
                </span>
                <span style={{ fontWeight: 600 }}>{fmt.aud(p + f, 0)}</span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage({ tweaks }) {
  const { market, history } = useMarketData();
  const { states } = useStates();
  const { alerts } = useAlerts();
  const { setRoute } = useRoute();
  const [range, setRange] = useState("90D");
  const [hoverState, setHoverState] = useState(null);

  const lmeDelta = fmt.delta(market.lme_pb_aud, market.lme_pb_aud_prev, 0);
  const audDelta = fmt.delta(market.aud_usd, market.aud_usd_prev, 4);
  const dieselDelta = fmt.delta(market.diesel_gate_aud, market.diesel_gate_aud_prev, 3);

  const stateVals = Object.fromEntries(states.map(s => [s.code, s.monthly_tonnes]));
  const activeState = hoverState ? states.find(s => s.code === hoverState) : null;

  const chartMode = tweaks?.chartStyle || "area";

  const warnAlerts = alerts.filter(a => a.sev === "warn" || a.sev === "alert").slice(0, 3);

  return (
    <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, minHeight: 0 }}>
      {/* Left column */}
      <div style={{ display: "grid", gridTemplateRows: "auto auto 1fr", gap: 16, minHeight: 0 }}>
        {/* Title + range picker */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{
              fontSize: 11, color: "var(--muted)",
              letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600,
            }}>
              Market overview
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>
              Today's pricing inputs
            </h1>
          </div>
          <RangePicker value={range} onChange={setRange} />
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <KPI
            label="LME Lead" sub="Cash settle · AUD/t"
            value={fmt.aud(market.lme_pb_aud, 0)}
            secondary={fmt.usd(market.lme_pb_usd, 2) + " USD/t"}
            delta={lmeDelta} series={history.lme_pb_aud}
          />
          <KPI
            label="RBA AUD/USD" sub="4pm fix"
            value={market.aud_usd.toFixed(4)}
            secondary="vs USD"
            delta={audDelta} series={history.aud_usd}
          />
          <KPI
            label="AIP Diesel Gate" sub="National TGP · AUD/L"
            value={"$" + market.diesel_gate_aud.toFixed(3)}
            secondary="ex-GST"
            delta={dieselDelta} series={history.diesel} inv
          />
          <KPI
            label="Fuel Levy" sub="Combined c/L"
            value={"$" + market.fuel_levy_aud.toFixed(3)}
            secondary="excise + RUC"
            delta={{ pct: 0, sign: "", pct_s: "0.00", abs_s: "0.000" }}
            series={history.diesel.map(() => market.fuel_levy_aud)}
          />
        </div>

        {/* Hero chart */}
        <div style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minHeight: 300,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>LME Lead · AUD/tonne · 90 days</div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: mono, letterSpacing: -0.2 }}>
                {fmt.aud(market.lme_pb_aud, 0)}
                <span style={{
                  marginLeft: 10, fontSize: 13,
                  color: lmeDelta.pct >= 0 ? "var(--up)" : "var(--down)",
                  fontFamily: "inherit",
                  fontWeight: 500,
                }}>
                  {lmeDelta.sign}{fmt.aud(+lmeDelta.abs_s, 0)} ({lmeDelta.sign}{lmeDelta.pct_s}%)
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {["USD","AUD"].map((u, i) => (
                <button key={u} style={{
                  padding: "5px 10px", fontSize: 12,
                  border: "1px solid var(--line-2)",
                  background: i === 1 ? "var(--text)" : "var(--panel)",
                  color: i === 1 ? "var(--panel)" : "var(--muted)",
                  borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 200 }}>
            <LineChart
              data={history.lme_pb_aud}
              labels={history.days.map(d => d.slice(5))}
              width={820} height={240}
              mode={chartMode}
              stroke="var(--chart-line)"
              fill="var(--chart-fill)"
              grid
              gridColor="rgba(0,0,0,0.05)"
              axisColor="var(--muted)"
              valueFmt={v => "$" + Math.round(v).toLocaleString()}
            />
          </div>
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
        {/* Australia map */}
        <div style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: 14,
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <div>
              <div style={{
                fontSize: 11, color: "var(--muted)",
                letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600,
              }}>
                By state
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>
                {activeState ? activeState.name : "Monthly volume · tonnes"}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--dim)" }}>Hover</div>
          </div>

          <AustraliaMap
            values={stateVals}
            palette={["#EEF0FF","#D6D8FA","#B8BCF3","#8A8FE6","#5B5BD6","#3F3FB3"]}
            stroke="var(--panel)"
            labelColor="var(--text)"
            onHover={setHoverState}
            highlight={hoverState}
            getLabel={c => stateVals[c] != null ? Math.round(stateVals[c]) + "t" : "—"}
            height={200}
          />

          {/* State hover detail or list */}
          {activeState ? (
            <div style={{
              marginTop: 8,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
            }}>
              {[
                ["Suppliers", activeState.supplier_count],
                ["Monthly t", activeState.monthly_tonnes.toFixed(0) + " t"],
                ["YTD spend", "$" + (activeState.ytd_spend_aud / 1000).toFixed(0) + "k"],
                ["Avg %LME", activeState.avg_pct_lme + "%"],
              ].map(([label, val]) => (
                <div key={label} style={{
                  padding: "6px 8px",
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  background: "var(--panel-2)",
                }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: mono, marginTop: 1 }}>{val}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              {[...states].sort((a, b) => b.monthly_tonnes - a.monthly_tonnes).map(s => (
                <div
                  key={s.code}
                  onMouseEnter={() => setHoverState(s.code)}
                  onMouseLeave={() => setHoverState(null)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto auto",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 8px",
                    borderRadius: 6,
                    background: hoverState === s.code ? "var(--accent-soft)" : "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontFamily: mono, color: "var(--muted)", fontSize: 11 }}>{s.code}</span>
                  <span>{s.name}</span>
                  <span style={{ color: "var(--dim)", fontFamily: mono, fontSize: 11 }}>{s.supplier_count}</span>
                  <span style={{ fontFamily: mono, fontWeight: 600 }}>{s.monthly_tonnes.toFixed(0)}t</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts preview */}
        {warnAlerts.length > 0 && (
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <CardHead
              title="Active alerts"
              sub={`${warnAlerts.length} needing attention`}
              action={
                <button
                  style={{
                    fontSize: 11, padding: "4px 8px",
                    border: "1px solid var(--line-2)", borderRadius: 6,
                    background: "transparent", color: "var(--muted)",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                  onClick={() => setRoute({ name: "suppliers" })}
                >
                  View all →
                </button>
              }
            />
            {warnAlerts.map(a => (
              <Tile
                key={a.id}
                kind={a.sev === "alert" ? "warn" : a.sev === "warn" ? "warn" : "info"}
                count={a.sev === "alert" ? "!" : a.sev === "warn" ? "⚠" : "i"}
                label={a.title}
                detail={a.actor + " · " + a.t}
                cta="View"
                onClick={() => {}}
                compact
              />
            ))}
          </div>
        )}

        {/* What-if */}
        <WhatIfCard market={market} freightAt={freightAt} />
      </div>
    </div>
  );
}
