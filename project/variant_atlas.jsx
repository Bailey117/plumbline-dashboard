// Variant 3 — "Atlas"
// Editorial, warm-paper, map-led. Serif headers; Australia is the hero.

(function (global) {
  const { useState, useMemo } = React;
  const D = global.DASH_DATA;
  const { market, history, suppliers, states, fmt, freightAt } = D;
  const { AustraliaMap, Sparkline, LineChart } = global;

  const C = {
    bg:        "#F4EFE3",          // warm paper
    bg2:       "#EEE7D4",
    panel:     "#FBF7EC",
    line:      "#D9D0BA",
    line2:     "#C9BE9F",
    text:      "#1B1A15",
    muted:     "#5C5546",
    dim:       "#8A8270",
    accent:    "#9C3A1A",          // rust
    accent2:   "#2F5C3C",          // forest
    accentSoft:"#EEDFD3",
    up:        "#2F5C3C",
    down:      "#9C3A1A",
    chart:     "#9C3A1A",
    chartFill: "rgba(156,58,26,0.10)",
    ink:       "#1B1A15",
    rule:      "#1B1A15",
  };

  const serif = '"Newsreader", "Iowan Old Style", "Cormorant Garamond", Georgia, serif';
  const sans = '"Geist", -apple-system, "Helvetica Neue", sans-serif';
  const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

  function Atlas() {
    const [hoverState, setHoverState] = useState(null);
    const stateVals = Object.fromEntries(states.map(s => [s.code, s.monthly_tonnes]));
    const stateSpend = Object.fromEntries(states.map(s => [s.code, s.ytd_spend_aud]));
    const lmeDelta = fmt.delta(market.lme_pb_aud, market.lme_pb_aud_prev, 0);
    const audDelta = fmt.delta(market.aud_usd, market.aud_usd_prev, 4);
    const dieselDelta = fmt.delta(market.diesel_gate_aud, market.diesel_gate_aud_prev, 3);

    const activeState = hoverState ? states.find(s => s.code === hoverState) : null;

    return (
      <div style={{
        width: 1480, height: 960, background: C.bg, color: C.text,
        fontFamily: sans, fontSize: 13, overflow: "hidden",
        display: "grid", gridTemplateRows: "auto auto 1fr",
      }}>
        {/* Top masthead */}
        <header style={{
          padding: "16px 28px 12px", borderBottom: `1px solid ${C.line}`,
          display: "flex", alignItems: "baseline", gap: 18,
        }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: C.muted, fontWeight: 600 }}>
              The Battery Recyclers' Almanac
            </span>
            <span style={{ fontFamily: serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1, marginTop: 2 }}>
              Atlas <span style={{ fontStyle: "italic", color: C.muted, fontSize: 22 }}>· No. 148</span>
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", borderLeft: `1px solid ${C.line}`, paddingLeft: 18, fontSize: 11, color: C.muted }}>
            <span>Thursday, 28 May 2026</span>
            <span style={{ color: C.dim, fontFamily: mono, fontSize: 10 }}>edition.16:30.aest</span>
          </div>
          <div style={{ flex: 1 }}/>
          <Nav/>
        </header>

        {/* Quote strip */}
        <section style={{
          padding: "0 28px", borderBottom: `1px solid ${C.line}`,
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        }}>
          {[
            { label: "Lead · LME cash", val: fmt.aud(market.lme_pb_aud, 0), unit: "AUD/tonne", sub: fmt.usd(market.lme_pb_usd, 2) + " USD/t", d: lmeDelta },
            { label: "AUD / USD", val: market.aud_usd.toFixed(4), unit: "RBA 4pm", sub: "—", d: audDelta, inv: false },
            { label: "Diesel · TGP", val: "$" + market.diesel_gate_aud.toFixed(3), unit: "AUD per litre", sub: "AIP, ex-GST", d: dieselDelta, inv: true },
            { label: "Fuel levy", val: "$" + market.fuel_levy_aud.toFixed(3), unit: "AUD per litre", sub: "excise + RUC", d: { pct: 0, pct_s: "0.00", sign: "" } },
          ].map((q, i) => (
            <div key={i} style={{
              padding: "14px 18px", borderLeft: i === 0 ? "none" : `1px solid ${C.line}`,
              display: "grid", gridTemplateRows: "auto auto 1fr", gap: 2,
            }}>
              <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, fontWeight: 600 }}>
                {q.label}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontFamily: serif, fontSize: 28, fontWeight: 500, letterSpacing: -0.4 }}>{q.val}</span>
                <span style={{ fontSize: 11, color: q.d.pct === 0 ? C.dim : ((q.inv ? -q.d.pct : q.d.pct) >= 0 ? C.up : C.down) }}>
                  {q.d.pct === 0 ? "·" : `${q.d.sign}${q.d.pct_s}%`}
                </span>
              </div>
              <span style={{ fontSize: 11, color: C.dim, fontFamily: mono }}>
                {q.unit} <span style={{ color: C.muted }}>· {q.sub}</span>
              </span>
            </div>
          ))}
        </section>

        {/* Main */}
        <main style={{ display: "grid", gridTemplateColumns: "1.05fr 1.35fr 1fr", gap: 0, minHeight: 0 }}>
          {/* COLUMN 1 — feature article on LME */}
          <section style={{ padding: "20px 22px 18px 28px", borderRight: `1px solid ${C.line}`, display: "grid", gridTemplateRows: "auto auto 1fr", gap: 10, minHeight: 0 }}>
            <span style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: C.accent, fontWeight: 700 }}>
              Lead market · feature
            </span>
            <h2 style={{
              fontFamily: serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.5,
              lineHeight: 1.06, margin: 0, textWrap: "balance",
            }}>
              Pb settles at <em style={{ color: C.accent }}>{fmt.aud(market.lme_pb_aud, 0)}</em>, a {lmeDelta.pct_s}% lift on softer Aussie dollar.
            </h2>
            <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", gap: 8, minHeight: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${C.rule}`, paddingTop: 6 }}>
                <span style={{ fontSize: 10, fontFamily: mono, color: C.muted, letterSpacing: 0.5 }}>
                  Cash settlement · 90 days · AUD/tonne
                </span>
                <span style={{ fontSize: 10, fontFamily: mono, color: C.dim }}>
                  hi {Math.max(...history.lme_pb_aud).toFixed(0)} · lo {Math.min(...history.lme_pb_aud).toFixed(0)}
                </span>
              </div>
              <LineChart
                data={history.lme_pb_aud} labels={history.days.map(d => d.slice(5))}
                width={420} height={230} mode="area"
                stroke={C.chart} fill={C.chartFill}
                grid gridColor="rgba(27,26,21,0.07)" axisColor={C.muted}
                valueFmt={v => "$" + Math.round(v).toLocaleString()}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                <Tiny label="USD/tonne"   val={fmt.usd(market.lme_pb_usd, 2)} delta={lmeDelta}/>
                <Tiny label="vs 30d avg"  val={fmt.aud(history.lme_pb_aud.slice(-30).reduce((a,b)=>a+b,0)/30, 0)} delta={{pct:1.2, sign:"+", pct_s:"1.20"}}/>
                <Tiny label="Diesel TGP"  val={"$"+market.diesel_gate_aud.toFixed(3)} delta={dieselDelta} inv/>
                <Tiny label="AUDUSD"      val={market.aud_usd.toFixed(4)} delta={audDelta}/>
              </div>
            </div>
          </section>

          {/* COLUMN 2 — Australia map */}
          <section style={{ padding: "20px 22px", borderRight: `1px solid ${C.line}`, display: "grid", gridTemplateRows: "auto auto 1fr auto", gap: 8, minHeight: 0 }}>
            <span style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: C.accent, fontWeight: 700 }}>
              The continent · by state
            </span>
            <h2 style={{
              fontFamily: serif, fontSize: 24, fontWeight: 500, letterSpacing: -0.4,
              margin: 0, lineHeight: 1.1, textWrap: "balance",
            }}>
              {activeState ? activeState.name : "Where the lead lives."}
              {!activeState && <span style={{ fontStyle: "italic", color: C.muted }}> Hover a state for detail.</span>}
            </h2>
            <div style={{ position: "relative", minHeight: 0 }}>
              <AustraliaMap
                values={stateVals}
                palette={["#F4EFE3","#EBDEBF","#DAC18A","#C09A52","#9C3A1A","#7A2C13"]}
                stroke={C.bg} labelColor={C.text}
                onHover={setHoverState} highlight={hoverState}
                getLabel={c => stateVals[c] != null ? Math.round(stateVals[c]) + "t/mo" : "—"}
                height={350}
              />
              {/* Legend */}
              <div style={{ position: "absolute", left: 6, bottom: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontFamily: mono, color: C.muted }}>
                <span>less</span>
                {["#EBDEBF","#DAC18A","#C09A52","#9C3A1A","#7A2C13"].map(c => (
                  <span key={c} style={{ width: 14, height: 8, background: c, border: `1px solid ${C.line2}` }}/>
                ))}
                <span>more · t/mo</span>
              </div>
            </div>
            {/* Detail panel */}
            <div style={{ borderTop: `1px solid ${C.rule}`, paddingTop: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {activeState ? (
                <>
                  <Tiny label="Suppliers" val={activeState.supplier_count}/>
                  <Tiny label="Monthly t" val={activeState.monthly_tonnes.toFixed(0) + " t"}/>
                  <Tiny label="YTD spend" val={"$" + (activeState.ytd_spend_aud / 1000).toFixed(0) + "k"}/>
                  <Tiny label="Avg %LME" val={activeState.avg_pct_lme + "%"}/>
                </>
              ) : (
                <>
                  <Tiny label="Total suppliers" val={suppliers.length}/>
                  <Tiny label="Monthly t" val={suppliers.reduce((a,s)=>a+s.avg_monthly_t,0).toFixed(0) + " t"}/>
                  <Tiny label="YTD spend" val={"$" + (suppliers.reduce((a,s)=>a+s.ytd_spend_aud,0)/1e6).toFixed(2) + "M"}/>
                  <Tiny label="States covered" val="8"/>
                </>
              )}
            </div>
          </section>

          {/* COLUMN 3 — Roster + what-if + footer */}
          <section style={{ padding: "20px 28px 18px 22px", display: "grid", gridTemplateRows: "auto auto 1fr", gap: 10, minHeight: 0 }}>
            <span style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: C.accent, fontWeight: 700 }}>
              Roster · top suppliers
            </span>
            <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.3, margin: 0, lineHeight: 1.1 }}>
              The eight paying nearest to par.
            </h2>
            <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 12, minHeight: 0 }}>
              <div style={{ borderTop: `1px solid ${C.rule}` }}>
                {[...suppliers].sort((a,b)=>b.pct_lme-a.pct_lme).slice(0,8).map((s, i) => (
                  <AtlasRow key={s.id} s={s} i={i+1}/>
                ))}
              </div>
              <AtlasWhatIf/>
            </div>
          </section>
        </main>
      </div>
    );
  }

  function Nav() {
    return (
      <nav style={{ display: "flex", gap: 18, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
        {[["Market","active"],["Roster"],["States"],["Volumes"],["Costs"],["Freight"],["Calc"]].map(([n, a], i) => (
          <a key={n} style={{
            color: a ? C.accent : C.muted, cursor: "pointer", paddingBottom: 2,
            borderBottom: a ? `2px solid ${C.accent}` : "2px solid transparent",
          }}>{n}</a>
        ))}
      </nav>
    );
  }

  function Tiny({ label, val, delta, inv }) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase", color: C.muted, fontWeight: 600 }}>{label}</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 500 }}>{val}</span>
          {delta && delta.pct !== 0 && (
            <span style={{ fontSize: 10, color: (inv ? -delta.pct : delta.pct) >= 0 ? C.up : C.down }}>
              {delta.sign}{delta.pct_s}%
            </span>
          )}
        </div>
      </div>
    );
  }

  function AtlasRow({ s, i }) {
    const since = s.days_since;
    return (
      <div style={{
        display: "grid", gridTemplateColumns: "22px 1fr auto auto",
        padding: "9px 0", borderBottom: `1px solid ${C.line}`, alignItems: "center", gap: 10,
      }}>
        <span style={{ fontFamily: mono, fontSize: 10, color: C.dim }}>{String(i).padStart(2,"0")}</span>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, minWidth: 0 }}>
          <span style={{ fontFamily: serif, fontSize: 15, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: mono, letterSpacing: 0.4 }}>
            {s.state} · {s.zone} · {since}d since pickup · {s.avg_monthly_t}t/mo
          </span>
        </div>
        <Sparkline data={s.price_series.slice(-30)} width={56} height={20} stroke={C.chart}/>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontFamily: serif, fontSize: 16, fontWeight: 500, color: C.accent }}>{s.pct_lme}%</span>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: mono }}>{fmt.aud(s.landed_aud_t, 0)}</span>
        </div>
      </div>
    );
  }

  function AtlasWhatIf() {
    const [lme, setLme] = useState(market.lme_pb_usd);
    const [diesel, setDiesel] = useState(market.diesel_gate_aud);
    const aud = market.aud_usd;
    const lmeAud = lme / aud;
    return (
      <div style={{
        background: C.bg2, border: `1px solid ${C.line}`, padding: "10px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6, borderBottom: `1px solid ${C.line}`, paddingBottom: 4 }}>
          <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.accent, fontWeight: 700 }}>
            What if · scenario
          </span>
          <span style={{ fontSize: 10, color: C.dim, fontFamily: mono }}>RBA {aud.toFixed(4)} fixed</span>
        </div>
        <ASlider label="LME (USD/t)" v={lme} min={1700} max={2400} step={5} set={setLme} fmt={v=>"$"+Math.round(v)}/>
        <ASlider label="Diesel ($/L)" v={diesel} min={1.6} max={2.4} step={0.01} set={setDiesel} fmt={v=>"$"+v.toFixed(2)}/>
        <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr auto", gap: 4, fontSize: 11, fontFamily: mono }}>
          <span style={{ color: C.muted }}>→ LME AUD/tonne</span>
          <span style={{ color: C.text, fontWeight: 600 }}>{fmt.aud(lmeAud, 0)}</span>
          {suppliers.slice(0,3).map(s => (
            <React.Fragment key={s.id}>
              <span style={{ color: C.muted, fontFamily: sans, fontSize: 10 }}>
                {s.name.slice(0,16)}… ({s.zone})
              </span>
              <span style={{ color: C.accent, fontWeight: 600 }}>
                {fmt.aud(lmeAud * s.pct_lme/100 + freightAt(s.zone, diesel), 0)}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  function ASlider({ label, v, min, max, step, set, fmt: f }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 2, marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color: C.text, fontFamily: mono, fontWeight: 600 }}>{f(v)}</span>
        <input type="range" min={min} max={max} step={step} value={v}
          onChange={e=>set(+e.target.value)}
          style={{ gridColumn: "1 / -1", accentColor: C.accent, width: "100%" }}/>
      </div>
    );
  }

  Object.assign(global, { Atlas });
})(window);
