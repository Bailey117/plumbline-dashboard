// Variant 1 — "Daylight"
// Clean modern SaaS dashboard. Light theme, Stripe/Linear-inflected.
// Renders inside a 1480 × 960 artboard.

(function (global) {
  const { useState, useMemo } = React;
  const D = global.DASH_DATA;
  const { market, history, suppliers, states, fmt, freightAt, freight_zones } = D;
  const { AustraliaMap, Sparkline, LineChart } = global;

  const C = {
    bg:        "#F7F7F8",
    panel:     "#FFFFFF",
    panel2:    "#FAFAFB",
    line:      "#ECECEE",
    line2:     "#E4E4E7",
    text:      "#0B0B0F",
    muted:     "#6B7280",
    dim:       "#9CA3AF",
    accent:    "#5B5BD6",   // refined indigo
    accentSoft:"#EEF0FF",
    up:        "#0E8F5E",
    down:      "#D14545",
    chart:     "#5B5BD6",
    chartFill: "rgba(91,91,214,0.10)",
    gold:      "#A77D24",
  };

  const baseFont = '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const monoFont = '"Geist Mono", ui-monospace, "SF Mono", monospace';

  function Daylight() {
    const [tab, setTab] = useState("Overview");
    const [hoverState, setHoverState] = useState(null);
    const [range, setRange] = useState("90D");

    const lmeDelta = fmt.delta(market.lme_pb_aud, market.lme_pb_aud_prev, 0);
    const audDelta = fmt.delta(market.aud_usd, market.aud_usd_prev, 4);
    const dieselDelta = fmt.delta(market.diesel_gate_aud, market.diesel_gate_aud_prev, 3);

    const stateVals = Object.fromEntries(states.map(s => [s.code, s.monthly_tonnes]));

    return (
      <div style={{
        width: 1480, height: 960, background: C.bg, color: C.text,
        fontFamily: baseFont, fontSize: 13, lineHeight: 1.45,
        display: "grid", gridTemplateRows: "56px 1fr", overflow: "hidden",
      }}>
        {/* Top bar */}
        <header style={{
          display: "flex", alignItems: "center", padding: "0 24px",
          borderBottom: `1px solid ${C.line}`, background: C.panel, gap: 24,
        }}>
          <Logo />
          <nav style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {["Overview","Suppliers","States","Reports","Freight","Settings"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "8px 12px", fontSize: 13, border: "none", background: "transparent",
                color: tab === t ? C.text : C.muted, fontWeight: tab === t ? 600 : 500,
                cursor: "pointer", borderRadius: 6, position: "relative",
              }}>
                {t}
                {tab === t && <span style={{
                  position: "absolute", left: 12, right: 12, bottom: -17, height: 2,
                  background: C.text, borderRadius: 2,
                }}/>}
              </button>
            ))}
          </nav>
          <div style={{ flex: 1 }}/>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 10px", border: `1px solid ${C.line2}`, borderRadius: 8,
            background: C.panel2, color: C.muted, fontSize: 12, width: 240,
          }}>
            <SearchIcon/> Search suppliers, codes, states…
            <span style={{ marginLeft: "auto", fontFamily: monoFont, fontSize: 11, color: C.dim,
              background: C.bg, border: `1px solid ${C.line2}`, padding: "1px 5px", borderRadius: 4 }}>⌘K</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.muted, fontSize: 12 }}>
            <LiveDot/> Live · {market.asof.split("·")[1].trim()}
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #C7A7FF, #5B5BD6)",
            display: "grid", placeItems: "center", color: "#fff", fontSize: 11, fontWeight: 600,
          }}>JM</div>
        </header>

        {/* Body */}
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, minHeight: 0 }}>
          {/* LEFT — main column */}
          <div style={{ display: "grid", gridTemplateRows: "auto auto 1fr", gap: 16, minHeight: 0 }}>
            {/* Title strip */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
                  Market overview
                </div>
                <h1 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>
                  Today's pricing inputs
                </h1>
              </div>
              <RangePicker value={range} onChange={setRange}/>
            </div>

            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <KPI label="LME Lead" sub="Cash settle · AUD/t" value={fmt.aud(market.lme_pb_aud, 0)}
                   secondary={fmt.usd(market.lme_pb_usd, 2) + " USD/t"} delta={lmeDelta} unit=""
                   series={history.lme_pb_aud}/>
              <KPI label="RBA AUD/USD" sub="4pm fix"
                   value={market.aud_usd.toFixed(4)} secondary="vs USD"
                   delta={audDelta} unit="" series={history.aud_usd}/>
              <KPI label="AIP Diesel Gate" sub="National TGP · AUD/L"
                   value={"$" + market.diesel_gate_aud.toFixed(3)} secondary="ex-GST"
                   delta={dieselDelta} unit="" series={history.diesel}/>
              <KPI label="Fuel Levy" sub="Combined c/L"
                   value={"$" + market.fuel_levy_aud.toFixed(3)} secondary="excise + RUC"
                   delta={{ pct: 0, sign: "", pct_s: "0.00", abs_s: "0.000" }} unit="" series={history.diesel.map(_=>market.fuel_levy_aud)}/>
            </div>

            {/* LME hero chart */}
            <div style={{
              background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12,
              padding: "16px 20px", display: "grid", gridTemplateRows: "auto 1fr", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, color: C.muted }}>LME Lead · AUD/tonne · 90 days</div>
                  <div style={{ fontSize: 22, fontWeight: 600, fontFamily: monoFont, letterSpacing: -0.2 }}>
                    {fmt.aud(market.lme_pb_aud, 0)}
                    <span style={{
                      marginLeft: 10, fontSize: 13, color: lmeDelta.pct >= 0 ? C.up : C.down,
                      fontFamily: baseFont, fontWeight: 500,
                    }}>
                      {lmeDelta.sign}{fmt.aud(+lmeDelta.abs_s, 0)} ({lmeDelta.sign}{lmeDelta.pct_s}%)
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["USD","AUD"].map((u, i) => (
                    <button key={u} style={{
                      padding: "5px 10px", fontSize: 12, fontFamily: baseFont,
                      border: `1px solid ${C.line2}`, background: i === 1 ? C.text : C.panel,
                      color: i === 1 ? "#fff" : C.muted, borderRadius: 6, cursor: "pointer",
                    }}>{u}</button>
                  ))}
                </div>
              </div>
              <div style={{ minHeight: 0 }}>
                <LineChart
                  data={history.lme_pb_aud} labels={history.days.map(d => d.slice(5))}
                  width={920} height={260} mode="area"
                  stroke={C.chart} fill={C.chartFill}
                  grid gridColor="rgba(0,0,0,0.06)" axisColor={C.muted}
                  valueFmt={v => "$" + Math.round(v).toLocaleString()}
                />
              </div>
            </div>
          </div>

          {/* RIGHT — sidebar */}
          <div style={{ display: "grid", gridTemplateRows: "auto auto", gap: 16, minHeight: 0 }}>
            {/* Australia map card */}
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
                    By state
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Monthly volume · tonnes</div>
                </div>
                <div style={{ fontSize: 11, color: C.dim }}>Hover</div>
              </div>
              <AustraliaMap
                values={stateVals}
                palette={["#EEF0FF","#D6D8FA","#B8BCF3","#8A8FE6","#5B5BD6","#3F3FB3"]}
                stroke="#fff" labelColor={C.text}
                onHover={setHoverState} highlight={hoverState}
                getLabel={c => (stateVals[c] != null ? Math.round(stateVals[c]) + "t" : "—")}
                height={220}
              />
              {/* state list */}
              <div style={{ marginTop: 8, display: "grid", gap: 2 }}>
                {[...states].sort((a,b)=>b.monthly_tonnes-a.monthly_tonnes).map(s => {
                  const active = hoverState === s.code;
                  return (
                    <div key={s.code}
                      onMouseEnter={() => setHoverState(s.code)}
                      onMouseLeave={() => setHoverState(null)}
                      style={{
                        display: "grid", gridTemplateColumns: "44px 1fr auto auto", alignItems: "center",
                        gap: 8, padding: "6px 8px", borderRadius: 6,
                        background: active ? C.accentSoft : "transparent",
                        cursor: "pointer", fontSize: 12,
                      }}>
                      <span style={{ fontFamily: monoFont, color: C.muted, fontSize: 11 }}>{s.code}</span>
                      <span>{s.name}</span>
                      <span style={{ color: C.dim, fontFamily: monoFont, fontSize: 11 }}>{s.supplier_count}</span>
                      <span style={{ fontFamily: monoFont, fontWeight: 600 }}>{s.monthly_tonnes.toFixed(0)}t</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick what-if */}
            <WhatIfCard/>
          </div>
        </div>

        {/* Supplier list — overlay bottom strip would crowd; render below */}
      </div>
    );
  }

  // ── Supplier list artboard (separate) ─────────────────────────────────────
  function DaylightSuppliers() {
    const [sort, setSort] = useState("pct_lme");
    const sorted = useMemo(
      () => [...suppliers].sort((a, b) => (b[sort] || 0) - (a[sort] || 0)).slice(0, 14),
      [sort]
    );
    return (
      <div style={{
        width: 1480, height: 720, background: C.bg, color: C.text,
        fontFamily: baseFont, fontSize: 13, padding: 20,
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
              Suppliers
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>
              Current pricing · {suppliers.length} active
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ChipFilter label="All states" />
            <ChipFilter label="All zones" />
            <ChipFilter label="Sort: % of LME ↓" />
            <button style={{
              padding: "7px 12px", fontSize: 12, fontWeight: 500, border: `1px solid ${C.line2}`,
              background: C.text, color: "#fff", borderRadius: 7, cursor: "pointer",
            }}>+ Add supplier</button>
          </div>
        </div>

        <div style={{
          background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "28px 2.1fr 0.7fr 0.7fr 1fr 1fr 0.9fr 1fr 1.2fr 0.9fr",
            padding: "11px 16px", fontSize: 11, color: C.muted, fontWeight: 600,
            letterSpacing: 0.3, textTransform: "uppercase", borderBottom: `1px solid ${C.line}`,
            background: C.panel2,
          }}>
            <span></span>
            <span>Supplier</span>
            <span>State</span>
            <span>Zone</span>
            <span style={{ textAlign: "right" }}>% LME</span>
            <span style={{ textAlign: "right" }}>$ AUD/t</span>
            <span style={{ textAlign: "right" }}>Freight</span>
            <span style={{ textAlign: "right" }}>Landed</span>
            <span style={{ textAlign: "center" }}>90d trend</span>
            <span style={{ textAlign: "right" }}>Last pickup</span>
          </div>
          {sorted.map((s, i) => (
            <SupplierRow key={s.id} s={s} alt={i % 2 === 1}/>
          ))}
        </div>
      </div>
    );
  }

  function SupplierRow({ s, alt }) {
    const since = s.days_since;
    const sinceColor = since > 45 ? C.down : since > 20 ? C.gold : C.up;
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "28px 2.1fr 0.7fr 0.7fr 1fr 1fr 0.9fr 1fr 1.2fr 0.9fr",
        padding: "12px 16px", alignItems: "center", fontSize: 13,
        borderBottom: `1px solid ${C.line}`, background: alt ? C.panel2 : C.panel,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: 5,
          background: stateColor(s.state), color: "#fff", fontSize: 10, fontWeight: 600,
          display: "grid", placeItems: "center", fontFamily: monoFont,
        }}>{s.state.slice(0, 2)}</span>
        <span style={{ fontWeight: 500 }}>{s.name}</span>
        <span style={{ color: C.muted, fontFamily: monoFont, fontSize: 12 }}>{s.state}</span>
        <span>
          <span style={{
            padding: "2px 7px", borderRadius: 4, background: C.accentSoft, color: C.accent,
            fontSize: 11, fontWeight: 600, fontFamily: monoFont,
          }}>{s.zone}</span>
        </span>
        <span style={{ textAlign: "right", fontFamily: monoFont, fontWeight: 600 }}>{s.pct_lme}%</span>
        <span style={{ textAlign: "right", fontFamily: monoFont }}>{fmt.aud(s.price_aud_t, 0)}</span>
        <span style={{ textAlign: "right", fontFamily: monoFont, color: C.muted }}>{fmt.aud(s.freight_aud_t, 0)}</span>
        <span style={{ textAlign: "right", fontFamily: monoFont, fontWeight: 600 }}>{fmt.aud(s.landed_aud_t, 0)}</span>
        <span style={{ display: "grid", placeItems: "center" }}>
          <Sparkline data={s.price_series.slice(-30)} width={130} height={28} stroke={C.chart} fill={C.chartFill}/>
        </span>
        <span style={{ textAlign: "right", fontFamily: monoFont, fontSize: 12, color: sinceColor }}>
          {since}d ago
        </span>
      </div>
    );
  }

  function stateColor(s) {
    return { NSW: "#5B5BD6", VIC: "#7C3AED", QLD: "#0E8F5E", WA: "#D14545", SA: "#A77D24", TAS: "#0891B2", NT: "#B45309", ACT: "#64748B" }[s] || "#64748B";
  }

  // ── Pieces ────────────────────────────────────────────────────────────────
  function Logo() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: "linear-gradient(135deg, #5B5BD6, #3F3FB3)",
          display: "grid", placeItems: "center", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
        }}>Pb</div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Plumbline</span>
          <span style={{ fontSize: 10, color: C.muted }}>Lead trading desk</span>
        </div>
      </div>
    );
  }
  function SearchIcon() {
    return <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>;
  }
  function LiveDot() {
    return <span style={{
      width: 6, height: 6, borderRadius: "50%", background: C.up,
      boxShadow: `0 0 0 4px rgba(14,143,94,0.18)`, display: "inline-block",
    }}/>;
  }

  function KPI({ label, sub, value, secondary, delta, series }) {
    const up = delta.pct >= 0;
    return (
      <div style={{
        background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 16px",
        display: "grid", gridTemplateRows: "auto 1fr auto", gap: 4, minHeight: 110,
      }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</div>
          <div style={{ fontSize: 10, color: C.dim }}>{sub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 24, fontFamily: monoFont, fontWeight: 600, letterSpacing: -0.5 }}>{value}</span>
          {delta.pct !== 0 && (
            <span style={{ fontSize: 11, color: up ? C.up : C.down, fontWeight: 500 }}>
              {delta.sign}{delta.pct_s}%
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <span style={{ fontSize: 11, color: C.dim, fontFamily: monoFont }}>{secondary}</span>
          <Sparkline data={series.slice(-30)} width={70} height={20} stroke={up ? C.up : C.down}/>
        </div>
      </div>
    );
  }

  function RangePicker({ value, onChange }) {
    return (
      <div style={{ display: "flex", border: `1px solid ${C.line2}`, borderRadius: 7, overflow: "hidden", background: C.panel }}>
        {["7D","30D","90D","1Y","All"].map(r => (
          <button key={r} onClick={() => onChange(r)} style={{
            padding: "6px 12px", fontSize: 12, border: "none", borderRight: `1px solid ${C.line2}`,
            background: value === r ? C.text : "transparent",
            color: value === r ? "#fff" : C.muted,
            fontFamily: baseFont, fontWeight: 500, cursor: "pointer",
          }}>{r}</button>
        ))}
      </div>
    );
  }

  function ChipFilter({ label }) {
    return (
      <button style={{
        padding: "7px 12px", fontSize: 12, border: `1px solid ${C.line2}`,
        background: C.panel, borderRadius: 7, cursor: "pointer", color: C.text, fontWeight: 500,
        display: "inline-flex", alignItems: "center", gap: 6,
      }}>
        {label}
        <span style={{ color: C.dim, fontSize: 9 }}>▼</span>
      </button>
    );
  }

  function WhatIfCard() {
    const [lme, setLme] = useState(market.lme_pb_usd);
    const [aud, setAud] = useState(market.aud_usd);
    const [diesel, setDiesel] = useState(market.diesel_gate_aud);
    const lmeAud = lme / aud;
    // sample 3 reps
    const sample = [suppliers[0], suppliers[5], suppliers[10]];
    return (
      <div style={{
        background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14,
        display: "grid", gridTemplateRows: "auto 1fr", gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
            What-if calculator
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Move the inputs · see net impact</div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <Slider label="LME USD/t" v={lme} min={1700} max={2400} step={5} set={setLme} fmt={v=>"$"+Math.round(v)}/>
          <Slider label="AUD/USD"   v={aud} min={0.55} max={0.75} step={0.001} set={setAud} fmt={v=>v.toFixed(4)}/>
          <Slider label="Diesel $/L" v={diesel} min={1.6} max={2.4} step={0.01} set={setDiesel} fmt={v=>"$"+v.toFixed(2)}/>

          <div style={{
            background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px",
            display: "grid", gridTemplateColumns: "1fr auto", gap: 6, fontFamily: monoFont, fontSize: 12,
          }}>
            <span style={{ color: C.muted }}>LME AUD/t</span>
            <span style={{ fontWeight: 600 }}>{fmt.aud(lmeAud, 0)}</span>
            {sample.map(s => {
              const p = lmeAud * s.pct_lme / 100;
              const f = freightAt(s.zone, diesel);
              return (
                <React.Fragment key={s.id}>
                  <span style={{ color: C.muted, fontFamily: baseFont, fontSize: 11 }}>
                    {s.name.slice(0, 22)} <span style={{ color: C.dim }}>({s.zone})</span>
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

  function Slider({ label, v, min, max, step, set, fmt: f }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 4 }}>
        <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: monoFont, fontWeight: 600 }}>{f(v)}</span>
        <input type="range" min={min} max={max} step={step} value={v}
          onChange={e => set(+e.target.value)}
          style={{ gridColumn: "1 / -1", accentColor: C.accent, width: "100%" }}/>
      </div>
    );
  }

  Object.assign(global, { Daylight, DaylightSuppliers });
})(window);
