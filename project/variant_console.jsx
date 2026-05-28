// Variant 2 — "Console"
// Dense dark terminal-style dashboard. Bloomberg-lite, mono-heavy.

(function (global) {
  const { useState, useMemo } = React;
  const D = global.DASH_DATA;
  const { market, history, suppliers, states, fmt, freightAt } = D;
  const { AustraliaMap, Sparkline, LineChart } = global;

  const C = {
    bg:       "#0A0B0E",
    panel:    "#101216",
    panel2:   "#16181E",
    line:     "#1F2228",
    line2:    "#2A2E36",
    text:     "#E6E7EA",
    muted:    "#8A8F98",
    dim:      "#5A5F68",
    accent:   "#F59E0B",   // amber
    accentSoft: "rgba(245,158,11,0.14)",
    up:       "#4ADE80",
    down:     "#F87171",
    chart:    "#F59E0B",
    chartFill:"rgba(245,158,11,0.10)",
    blue:     "#60A5FA",
    purple:   "#A78BFA",
  };

  const monoFont = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, "SF Mono", monospace';
  const sansFont = '"Geist", -apple-system, BlinkMacSystemFont, sans-serif';

  function Console_() {
    const [hoverState, setHoverState] = useState(null);
    const stateVals = Object.fromEntries(states.map(s => [s.code, s.monthly_tonnes]));
    const lmeDelta = fmt.delta(market.lme_pb_aud, market.lme_pb_aud_prev, 0);
    const audDelta = fmt.delta(market.aud_usd, market.aud_usd_prev, 4);
    const dieselDelta = fmt.delta(market.diesel_gate_aud, market.diesel_gate_aud_prev, 3);

    return (
      <div style={{
        width: 1480, height: 960, background: C.bg, color: C.text,
        fontFamily: monoFont, fontSize: 12,
        display: "grid", gridTemplateRows: "32px 28px 1fr 26px", overflow: "hidden",
      }}>
        {/* Top window bar */}
        <header style={{
          background: C.panel, borderBottom: `1px solid ${C.line}`,
          display: "flex", alignItems: "center", padding: "0 12px", gap: 10,
        }}>
          <span style={{ display: "flex", gap: 6 }}>
            <Dot c="#FF5F57"/><Dot c="#FEBC2E"/><Dot c="#28C840"/>
          </span>
          <span style={{ color: C.dim, fontSize: 11, letterSpacing: 0.5 }}>// LEAD.TERMINAL</span>
          <span style={{ color: C.muted, marginLeft: 8 }}>v4.2.1</span>
          <div style={{ flex: 1 }}/>
          <span style={{ color: C.muted, fontSize: 11 }}>LME:OPEN</span>
          <span style={{ color: C.up, fontSize: 11 }}>● RBA:LIVE</span>
          <span style={{ color: C.muted, fontSize: 11 }}>SAP:LAG 4m</span>
          <span style={{ color: C.dim }}>|</span>
          <span style={{ color: C.text, fontWeight: 600 }}>{market.asof}</span>
        </header>

        {/* Tabs */}
        <nav style={{
          background: C.panel, borderBottom: `1px solid ${C.line}`,
          display: "flex", alignItems: "stretch", padding: "0 8px",
        }}>
          {[
            ["F1", "MKT", true],
            ["F2", "SUPP"],
            ["F3", "STATE"],
            ["F4", "VOL"],
            ["F5", "COST"],
            ["F6", "FRGT"],
            ["F7", "HIST"],
            ["F8", "CALC"],
            ["F9", "ALRT"],
          ].map(([k, label, active]) => (
            <button key={k} style={{
              padding: "0 12px", border: "none", background: active ? C.bg : "transparent",
              borderTop: `2px solid ${active ? C.accent : "transparent"}`,
              borderRight: `1px solid ${C.line}`,
              color: active ? C.text : C.muted,
              fontFamily: monoFont, fontSize: 11, cursor: "pointer", letterSpacing: 0.5,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ color: C.accent, fontSize: 10 }}>{k}</span>
              {label}
            </button>
          ))}
          <div style={{ flex: 1 }}/>
          <div style={{ display: "flex", alignItems: "center", padding: "0 10px", color: C.dim, fontSize: 11, gap: 12 }}>
            <span>USER · jmoxley</span>
            <span style={{ color: C.muted }}>DESK · LEAD-AU</span>
          </div>
        </nav>

        {/* Main grid */}
        <main style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 0.95fr",
          gridTemplateRows: "auto 1fr",
          gap: 1, background: C.line, minHeight: 0,
        }}>
          {/* Ticker bar across all 3 cols */}
          <div style={{
            gridColumn: "1 / -1", background: C.bg, padding: "6px 10px",
            display: "flex", alignItems: "center", gap: 18, fontSize: 11, overflow: "hidden",
            borderBottom: `1px solid ${C.line}`,
          }}>
            <Ticker code="LME.PB" val={fmt.usd(market.lme_pb_usd, 2)+"/t USD"} d={lmeDelta} pos/>
            <Ticker code="LME.PB.AUD" val={fmt.aud(market.lme_pb_aud, 0)+"/t"} d={lmeDelta} pos/>
            <Ticker code="RBA.AUDUSD" val={market.aud_usd.toFixed(4)} d={audDelta}/>
            <Ticker code="AIP.DSL" val={"$"+market.diesel_gate_aud.toFixed(3)+"/L"} d={dieselDelta}/>
            <Ticker code="FUEL.LEVY" val={"$"+market.fuel_levy_aud.toFixed(3)} d={{pct:0,pct_s:"0.00",sign:""}}/>
            <span style={{ color: C.dim, marginLeft: "auto" }}>tick → 16:30:42 AEST</span>
          </div>

          {/* LEFT: hero chart + supplier table */}
          <section style={{ background: C.bg, padding: 10, display: "grid", gridTemplateRows: "auto 1fr", gap: 8, minHeight: 0 }}>
            <Card title="LME PB · AUD/t · 90D" right={
              <span style={{ display: "flex", gap: 4 }}>
                {["1D","5D","1M","3M","6M","1Y","5Y"].map((r,i)=>(
                  <button key={r} style={{
                    padding: "2px 6px", fontSize: 10, border: `1px solid ${C.line2}`,
                    background: i===3?C.accent:C.panel, color: i===3?"#000":C.muted,
                    fontFamily: monoFont, cursor: "pointer",
                  }}>{r}</button>
                ))}
              </span>
            }>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 600, color: C.text }}>
                  {fmt.aud(market.lme_pb_aud, 0)}
                </span>
                <span style={{ fontSize: 12, color: lmeDelta.pct >= 0 ? C.up : C.down }}>
                  {lmeDelta.sign}{Math.abs(market.lme_pb_aud-market.lme_pb_aud_prev).toFixed(0)} ({lmeDelta.sign}{lmeDelta.pct_s}%)
                </span>
                <span style={{ marginLeft: "auto", color: C.dim, fontSize: 10 }}>
                  H {Math.max(...history.lme_pb_aud).toFixed(0)} · L {Math.min(...history.lme_pb_aud).toFixed(0)} · VOL — · OI —
                </span>
              </div>
              <LineChart
                data={history.lme_pb_aud}
                labels={history.days.map(d => d.slice(5))}
                width={840} height={220} mode="candle"
                grid gridColor="rgba(255,255,255,0.05)" axisColor={C.muted}
                valueFmt={v => Math.round(v).toLocaleString()}
              />
            </Card>

            <Card title="SUPPLIERS · TOP BY % LME">
              <div style={{ display: "grid", gridTemplateColumns: "32px 2.3fr 0.6fr 0.5fr 0.8fr 0.9fr 0.8fr 0.9fr 1fr 0.7fr", padding: "4px 0", fontSize: 10, color: C.muted, borderBottom: `1px solid ${C.line}` }}>
                <span style={{ paddingLeft: 4 }}>#</span>
                <span>NAME</span>
                <span>ST</span>
                <span>ZN</span>
                <span style={{ textAlign: "right" }}>%LME</span>
                <span style={{ textAlign: "right" }}>AUD/t</span>
                <span style={{ textAlign: "right" }}>FRGT</span>
                <span style={{ textAlign: "right" }}>LANDED</span>
                <span style={{ textAlign: "center" }}>30D</span>
                <span style={{ textAlign: "right", paddingRight: 4 }}>LAST</span>
              </div>
              <div style={{ overflow: "hidden" }}>
                {[...suppliers].sort((a,b)=>b.pct_lme-a.pct_lme).slice(0, 11).map((s, i) => (
                  <ConsoleRow key={s.id} s={s} i={i+1}/>
                ))}
              </div>
            </Card>
          </section>

          {/* MIDDLE: state map + state table */}
          <section style={{ background: C.bg, padding: 10, display: "grid", gridTemplateRows: "auto 1fr", gap: 8, minHeight: 0 }}>
            <Card title="AU · MONTHLY TONNES BY STATE" right={<span style={{color:C.dim,fontSize:10}}>SAP · 28-05 0400</span>}>
              <AustraliaMap
                values={stateVals}
                palette={["#1F2228","#3F2F0F","#7A5419","#B47A1F","#E29022","#F59E0B"]}
                stroke={C.bg} labelColor={C.text}
                onHover={setHoverState} highlight={hoverState}
                getLabel={c => stateVals[c] != null ? Math.round(stateVals[c]) + "t" : "—"}
                height={205}
              />
            </Card>

            <Card title="STATE BREAKDOWN">
              <div style={{ display: "grid", gridTemplateColumns: "0.5fr 1.8fr 0.6fr 0.9fr 1fr 0.9fr", padding: "4px 0", fontSize: 10, color: C.muted, borderBottom: `1px solid ${C.line}` }}>
                <span>ST</span>
                <span>NAME</span>
                <span style={{ textAlign: "right" }}>SUPP</span>
                <span style={{ textAlign: "right" }}>TONNES</span>
                <span style={{ textAlign: "right" }}>SPEND YTD</span>
                <span style={{ textAlign: "right" }}>%LME</span>
              </div>
              {[...states].sort((a,b)=>b.monthly_tonnes-a.monthly_tonnes).map(s => {
                const active = hoverState === s.code;
                return (
                  <div key={s.code}
                    onMouseEnter={() => setHoverState(s.code)}
                    onMouseLeave={() => setHoverState(null)}
                    style={{
                      display: "grid", gridTemplateColumns: "0.5fr 1.8fr 0.6fr 0.9fr 1fr 0.9fr",
                      padding: "4px 0", fontSize: 11,
                      background: active ? C.accentSoft : "transparent",
                      borderBottom: `1px solid ${C.line}`, cursor: "pointer",
                    }}>
                    <span style={{ color: C.accent, fontWeight: 600 }}>{s.code}</span>
                    <span style={{ color: C.muted, fontSize: 10 }}>{s.name}</span>
                    <span style={{ textAlign: "right" }}>{s.supplier_count}</span>
                    <span style={{ textAlign: "right", color: C.text, fontWeight: 600 }}>{s.monthly_tonnes.toFixed(0)}</span>
                    <span style={{ textAlign: "right" }}>${(s.ytd_spend_aud/1000).toFixed(0)}k</span>
                    <span style={{ textAlign: "right", color: C.blue }}>{s.avg_pct_lme}%</span>
                  </div>
                );
              })}
            </Card>
          </section>

          {/* RIGHT: what-if + alerts */}
          <section style={{ background: C.bg, padding: 10, display: "grid", gridTemplateRows: "auto auto 1fr", gap: 8, minHeight: 0 }}>
            <Card title="MARKET SUMMARY">
              <Row label="Pb cash USD" v={fmt.usd(market.lme_pb_usd,2)} delta={lmeDelta}/>
              <Row label="Pb cash AUD" v={fmt.aud(market.lme_pb_aud,0)} delta={lmeDelta}/>
              <Row label="AUD/USD" v={market.aud_usd.toFixed(4)} delta={audDelta} inv/>
              <Row label="Diesel TGP" v={"$"+market.diesel_gate_aud.toFixed(3)} delta={dieselDelta} inv/>
              <Row label="Fuel levy"  v={"$"+market.fuel_levy_aud.toFixed(3)} delta={{pct:0,pct_s:"0.00",sign:""}}/>
              <div style={{ height: 6 }}/>
              <Row label="LME spread (USD-AUD)" v={fmt.usd(market.lme_pb_usd - market.lme_pb_aud * market.aud_usd, 1)} small/>
              <Row label="Avg landed (50 supp)" v={fmt.aud(suppliers.reduce((a,s)=>a+s.landed_aud_t,0)/suppliers.length,0)} small/>
              <Row label="Implied margin band" v={"19-42%"} small/>
            </Card>

            <Card title="WHAT-IF" right={<span style={{color:C.accent,fontSize:10}}>F8 · CALC</span>}>
              <ConsoleWhatIf/>
            </Card>

            <Card title="ALERTS · LAST 24H">
              {[
                {t:"15:42", k:"LME", c:C.up,    m:"Pb +1.21% intraday · breakout 2050"},
                {t:"13:18", k:"SAP", c:C.muted, m:"Top End Auto Wreckers · 41d no pickup"},
                {t:"11:05", k:"AIP", c:C.down,  m:"Diesel TGP +0.029/L · WoW"},
                {t:"09:50", k:"RBA", c:C.muted, m:"AUD/USD -0.97% · risk-off"},
                {t:"08:30", k:"CTR", c:C.accent,m:"Murray Metals contract expires 30 Sep"},
                {t:"07:12", k:"VOL", c:C.up,    m:"NSW intake +8.4% MoM"},
                {t:"06:00", k:"LME", c:C.muted, m:"Open USD 2,031.00 → 2,055.50"},
              ].map((a, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "44px 36px 1fr", gap: 6,
                  padding: "3px 0", fontSize: 11, borderBottom: i === 6 ? "none" : `1px solid ${C.line}`,
                }}>
                  <span style={{ color: C.dim }}>{a.t}</span>
                  <span style={{ color: a.c, fontWeight: 600 }}>{a.k}</span>
                  <span style={{ color: C.text }}>{a.m}</span>
                </div>
              ))}
            </Card>
          </section>
        </main>

        {/* Status bar */}
        <footer style={{
          background: C.panel, borderTop: `1px solid ${C.line}`, color: C.muted, fontSize: 10,
          display: "flex", alignItems: "center", padding: "0 12px", gap: 14, letterSpacing: 0.4,
        }}>
          <span style={{ color: C.up }}>● CONNECTED</span>
          <span>LME @ 16:30 AEST</span>
          <span>RBA @ 16:00 AEST</span>
          <span>AIP @ 04:00 AEST</span>
          <span>SAP sync @ 04:00 AEST (last: 28 May)</span>
          <div style={{ flex: 1 }}/>
          <span style={{ color: C.accent }}>F8 · WHAT-IF</span>
          <span>F1 MKT</span>
          <span>F2 SUPP</span>
          <span>F12 HELP</span>
        </footer>
      </div>
    );
  }

  // ── Pieces ────────────────────────────────────────────────────────────────
  function Dot({ c }) {
    return <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }}/>;
  }
  function Card({ title, right, children }) {
    return (
      <div style={{
        background: C.panel, border: `1px solid ${C.line}`, padding: "8px 10px",
        display: "flex", flexDirection: "column", gap: 4, minHeight: 0,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${C.line}`, paddingBottom: 4, marginBottom: 4,
        }}>
          <span style={{ color: C.accent, fontSize: 10, letterSpacing: 0.6, fontWeight: 600 }}>{title}</span>
          {right}
        </div>
        {children}
      </div>
    );
  }
  function Row({ label, v, delta, small, inv }) {
    return (
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "baseline",
        padding: "3px 0", borderBottom: `1px dotted ${C.line}`, fontSize: small ? 10 : 11,
      }}>
        <span style={{ color: small ? C.dim : C.muted }}>{label}</span>
        <span style={{ color: C.text, fontWeight: 600 }}>{v}</span>
        {delta ? (
          <span style={{
            color: delta.pct === 0 ? C.dim : (inv ? (delta.pct >= 0 ? C.down : C.up) : (delta.pct >= 0 ? C.up : C.down)),
            fontSize: 10, minWidth: 50, textAlign: "right",
          }}>
            {delta.pct === 0 ? "·" : `${delta.sign}${delta.pct_s}%`}
          </span>
        ) : <span/>}
      </div>
    );
  }
  function Ticker({ code, val, d, pos }) {
    const up = d.pct >= 0;
    const color = d.pct === 0 ? C.muted : (up ? C.up : C.down);
    return (
      <span style={{ display: "flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap" }}>
        <span style={{ color: C.accent, fontWeight: 600, fontSize: 10 }}>{code}</span>
        <span style={{ color: C.text }}>{val}</span>
        <span style={{ color }}>{d.pct === 0 ? "·" : `${d.sign}${d.pct_s}%`}</span>
      </span>
    );
  }
  function ConsoleRow({ s, i }) {
    const since = s.days_since;
    const sinceColor = since > 45 ? C.down : since > 20 ? C.accent : C.up;
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "32px 2.3fr 0.6fr 0.5fr 0.8fr 0.9fr 0.8fr 0.9fr 1fr 0.7fr",
        padding: "4px 0", fontSize: 11, alignItems: "center",
        borderBottom: `1px solid ${C.line}`,
      }}>
        <span style={{ color: C.dim, paddingLeft: 4 }}>{String(i).padStart(2,"0")}</span>
        <span style={{ color: C.text }}>{s.name}</span>
        <span style={{ color: C.blue }}>{s.state}</span>
        <span style={{ color: C.purple }}>{s.zone}</span>
        <span style={{ textAlign: "right", color: C.accent, fontWeight: 600 }}>{s.pct_lme}</span>
        <span style={{ textAlign: "right", color: C.text }}>{Math.round(s.price_aud_t).toLocaleString()}</span>
        <span style={{ textAlign: "right", color: C.muted }}>{Math.round(s.freight_aud_t)}</span>
        <span style={{ textAlign: "right", color: C.text, fontWeight: 600 }}>{Math.round(s.landed_aud_t).toLocaleString()}</span>
        <span style={{ display: "grid", placeItems: "center" }}>
          <Sparkline data={s.price_series.slice(-30)} width={88} height={18} stroke={C.accent}/>
        </span>
        <span style={{ textAlign: "right", color: sinceColor, paddingRight: 4 }}>{since}d</span>
      </div>
    );
  }
  function ConsoleWhatIf() {
    const [lme, setLme] = useState(market.lme_pb_usd);
    const [aud, setAud] = useState(market.aud_usd);
    const [diesel, setDiesel] = useState(market.diesel_gate_aud);
    const lmeAud = lme / aud;
    return (
      <div style={{ display: "grid", gap: 4 }}>
        <CSlider label="LME USD" v={lme} min={1700} max={2400} step={5} set={setLme} fmt={v=>"$"+Math.round(v)}/>
        <CSlider label="AUDUSD" v={aud} min={0.55} max={0.75} step={0.001} set={setAud} fmt={v=>v.toFixed(4)}/>
        <CSlider label="DIESEL" v={diesel} min={1.6} max={2.4} step={0.01} set={setDiesel} fmt={v=>"$"+v.toFixed(2)}/>
        <div style={{ borderTop: `1px dashed ${C.line2}`, marginTop: 4, paddingTop: 4 }}>
          <Row label="→ LME AUD/t" v={fmt.aud(lmeAud, 0)} small/>
          {suppliers.slice(0, 4).map(s => {
            const p = lmeAud * s.pct_lme / 100;
            const f = freightAt(s.zone, diesel);
            return <Row key={s.id} label={`→ ${s.name.slice(0,16)} ${s.zone}`} v={fmt.aud(p+f,0)} small/>;
          })}
        </div>
      </div>
    );
  }
  function CSlider({ label, v, min, max, step, set, fmt: f }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 56px", gap: 6, alignItems: "center", fontSize: 10 }}>
        <span style={{ color: C.muted }}>{label}</span>
        <input type="range" min={min} max={max} step={step} value={v}
          onChange={e=>set(+e.target.value)} style={{ accentColor: C.accent, width: "100%" }}/>
        <span style={{ color: C.accent, textAlign: "right" }}>{f(v)}</span>
      </div>
    );
  }

  Object.assign(global, { Console_ });
})(window);
