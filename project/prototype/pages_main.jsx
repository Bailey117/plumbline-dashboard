// Pages: Overview, Suppliers, States

(function (global) {
  const { useState, useMemo } = React;
  const D = global.DASH_DATA;
  const { market, history, suppliers, states, fmt, freightAt, freight_zones, alerts, volume_daily, spend_daily, STATES } = D;
  const { AustraliaMap, Sparkline, LineChart, stateColor } = global;

  const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

  // ════════════════════════════════════════════════════════════════════════
  // OVERVIEW
  // ════════════════════════════════════════════════════════════════════════
  function OverviewPage({ tweaks, setRoute, range, setRange }) {
    const [hoverState, setHoverState] = useState(null);
    const lmeDelta = fmt.delta(market.lme_pb_aud, market.lme_pb_aud_prev, 0);
    const audDelta = fmt.delta(market.aud_usd, market.aud_usd_prev, 4);
    const dieselDelta = fmt.delta(market.diesel_gate_aud, market.diesel_gate_aud_prev, 3);

    const stateVals = Object.fromEntries(states.map(s => [s.code, s.monthly_tonnes]));
    const sliceFor = (r) => ({ "7D": 7, "30D": 30, "90D": 90, "1Y": 90 }[r] || 90);
    const chartData = history.lme_pb_aud.slice(-sliceFor(range));
    const chartLabels = history.days.slice(-sliceFor(range)).map(d => d.slice(5));

    const dueRate = suppliers.filter(s => s.rate_change_due);
    const overdueSites = suppliers.flatMap(s => s.sites.filter(x => x.days_since > 40).map(x => ({ s, x })));
    const expiringSoon = suppliers.filter(s => s.contract_expires.startsWith("2026-09") || s.contract_expires.startsWith("2026-12"));

    return (
      <div style={{ display: "grid", gap: 20 }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
              Market overview
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>
              Today's pricing inputs
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: mono }}>{market.asof}</span>
            <RangePicker value={range} onChange={setRange}/>
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <KPI label="LME Lead · AUD/t" sub="Cash settle"
               value={fmt.aud(market.lme_pb_aud, 0)}
               secondary={fmt.usd(market.lme_pb_usd, 2) + " USD/t"}
               delta={lmeDelta} series={history.lme_pb_aud}/>
          <KPI label="RBA AUD/USD" sub="4pm fix"
               value={market.aud_usd.toFixed(4)} secondary="vs USD"
               delta={audDelta} series={history.aud_usd}/>
          <KPI label="AIP Diesel Gate" sub="AUD/L · ex-GST"
               value={"$" + market.diesel_gate_aud.toFixed(3)} secondary="National TGP"
               delta={dieselDelta} series={history.diesel} inv/>
          <KPI label="Fuel Levy" sub="excise + RUC"
               value={"$" + market.fuel_levy_aud.toFixed(3)} secondary="combined c/L"
               delta={{ pct: 0, sign: "", pct_s: "0.00", abs_s: "0.000" }}
               series={history.diesel.map(_ => market.fuel_levy_aud)}/>
        </div>

        {/* Hero chart + AU map */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, minHeight: 0 }}>
          <Card pad>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>LME Lead · AUD/tonne · {range}</div>
                <div style={{ fontSize: 24, fontWeight: 600, fontFamily: mono, letterSpacing: -0.3, marginTop: 2 }}>
                  {fmt.aud(market.lme_pb_aud, 0)}
                  <span style={{
                    marginLeft: 10, fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                    color: lmeDelta.pct >= 0 ? "var(--up)" : "var(--down)",
                  }}>
                    {lmeDelta.sign}{Math.abs(market.lme_pb_aud - market.lme_pb_aud_prev).toFixed(0)} ({lmeDelta.sign}{lmeDelta.pct_s}%)
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: mono }}>
                  hi {Math.max(...chartData).toFixed(0)} · lo {Math.min(...chartData).toFixed(0)}
                </span>
                <CurrencyToggle/>
              </div>
            </div>
            <LineChart
              data={chartData} labels={chartLabels}
              width={950} height={280}
              mode={tweaks.chartStyle}
              stroke="var(--chart-line)" fill="var(--chart-fill)"
              grid gridColor="rgba(11,11,15,0.05)" axisColor="var(--muted)"
              valueFmt={v => "$" + Math.round(v).toLocaleString()}
            />
          </Card>

          <Card pad>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
                  By state
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Monthly volume · t</div>
              </div>
              <button onClick={() => global.__appSetRoute({ name: "states" })} style={{
                background: "transparent", border: "1px solid var(--line-2)", borderRadius: 6,
                padding: "5px 9px", fontSize: 11, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit",
              }}>View all →</button>
            </div>
            <AustraliaMap
              values={stateVals}
              palette={["#EEF0FF","#D6D8FA","#B8BCF3","#8A8FE6","#5B5BD6","#3F3FB3"]}
              stroke="var(--panel)" labelColor="var(--text)"
              onHover={setHoverState} highlight={hoverState}
              getLabel={c => stateVals[c] != null ? Math.round(stateVals[c]) + "t" : "—"}
              height={240}
            />
            <div style={{ marginTop: 4, display: "grid", gap: 2 }}>
              {[...states].sort((a,b)=>b.monthly_tonnes-a.monthly_tonnes).slice(0, 5).map(s => {
                const active = hoverState === s.code;
                return (
                  <div key={s.code}
                    onMouseEnter={() => setHoverState(s.code)}
                    onMouseLeave={() => setHoverState(null)}
                    style={{
                      display: "grid", gridTemplateColumns: "44px 1fr auto auto",
                      gap: 8, padding: "6px 8px", borderRadius: 6,
                      background: active ? "var(--accent-soft)" : "transparent",
                      cursor: "pointer", fontSize: 12,
                    }}>
                    <span style={{ fontFamily: mono, color: "var(--muted)", fontSize: 11 }}>{s.code}</span>
                    <span>{s.name}</span>
                    <span style={{ color: "var(--dim)", fontFamily: mono, fontSize: 11 }}>{s.supplier_count}</span>
                    <span style={{ fontFamily: mono, fontWeight: 600 }}>{s.monthly_tonnes.toFixed(0)}t</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Top suppliers + ops attention */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
          <Card>
            <CardHead title="Top suppliers · by % LME" 
                      action={<button onClick={() => global.__appSetRoute({ name: "suppliers" })} style={btnLink}>All {suppliers.length} →</button>}/>
            <TableHeader cols={["", "Supplier", "Sites", "Zone", "% LME", "AUD/t", "Freight", "Landed", "30d", "Pickup"]}
                         widths="28px 2.2fr 0.55fr 0.6fr 0.7fr 0.85fr 0.85fr 0.9fr 1fr 0.7fr"/>
            {[...suppliers].sort((a,b)=>b.pct_lme-a.pct_lme).slice(0, 7).map((s, i) => (
              <SupplierRow key={s.id} s={s} onClick={() => global.__appSetRoute({ name: "supplier", id: s.id })}
                cols="28px 2.2fr 0.55fr 0.6fr 0.7fr 0.85fr 0.85fr 0.9fr 1fr 0.7fr"/>
            ))}
          </Card>

          <Card>
            <CardHead title="Needs attention" sub="Across rates, contracts, pickups"/>
            <Tile
              kind="warn"
              count={overdueSites.length}
              label="Sites overdue for pickup"
              detail="40+ days since last collection · review SAP intake"
              cta="Open Suppliers"
              onClick={() => global.__appSetRoute({ name: "suppliers" })}
            />
            <Tile
              kind="info"
              count={dueRate.length}
              label="Suppliers due for rate review"
              detail="June cycle starts in 4 days"
              cta="Open Rates"
              onClick={() => global.__appSetRoute({ name: "rates" })}
            />
            <Tile
              kind="ok"
              count={expiringSoon.length}
              label="Contracts within 6 months"
              detail="Earliest: Murray Metals · 30 Sep 2026"
              cta="View list"
              onClick={() => global.__appSetRoute({ name: "suppliers" })}
            />
            <Tile
              kind="ok"
              count="OK"
              label="SAP daily batch"
              detail="1,284 records · synced 04:00 AEST"
              cta="Settings"
              compact
            />
          </Card>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // SUPPLIERS LIST
  // ════════════════════════════════════════════════════════════════════════
  function SuppliersPage({ tweaks }) {
    const [search, setSearch] = useState("");
    const [stateFilter, setStateFilter] = useState(new Set());
    const [zoneFilter, setZoneFilter] = useState(new Set());
    const [sortKey, setSortKey] = useState("pct_lme");
    const [sortDir, setSortDir] = useState("desc");

    const filtered = useMemo(() => {
      let arr = suppliers.filter(s => {
        if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (stateFilter.size && !s.states.some(st => stateFilter.has(st))) return false;
        if (zoneFilter.size && !s.sites.some(x => zoneFilter.has(x.zone))) return false;
        return true;
      });
      arr.sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        const cmp = typeof av === "string" ? av.localeCompare(bv) : (av - bv);
        return sortDir === "asc" ? cmp : -cmp;
      });
      return arr;
    }, [search, stateFilter, zoneFilter, sortKey, sortDir]);

    function toggle(set, val, setter) {
      const next = new Set(set);
      next.has(val) ? next.delete(val) : next.add(val);
      setter(next);
    }
    function sort(k) {
      if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
      else { setSortKey(k); setSortDir("desc"); }
    }

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
              Suppliers
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>
              {filtered.length} of {suppliers.length} · {filtered.reduce((a,s)=>a+s.site_count,0)} sites
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnGhost}>↓ Export CSV</button>
            <button style={btnPrimary}>+ Add supplier</button>
          </div>
        </div>

        {/* Filter bar */}
        <Card>
          <div style={{ display: "flex", gap: 14, padding: "12px 14px", alignItems: "center", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 240px", position: "relative" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by name…"
                style={{
                  width: "100%", padding: "7px 10px 7px 30px", border: "1px solid var(--line-2)",
                  borderRadius: 7, background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit",
                }}/>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </span>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 4 }}>State:</span>
              {STATES.map(st => (
                <Chip key={st} on={stateFilter.has(st)} onClick={() => toggle(stateFilter, st, setStateFilter)}>{st}</Chip>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 4 }}>Zone:</span>
              {freight_zones.map(z => (
                <Chip key={z.code} on={zoneFilter.has(z.code)} onClick={() => toggle(zoneFilter, z.code, setZoneFilter)}>{z.code}</Chip>
              ))}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: "var(--muted)" }}>
              {(stateFilter.size || zoneFilter.size || search) ? (
                <button onClick={() => { setSearch(""); setStateFilter(new Set()); setZoneFilter(new Set()); }}
                  style={{ ...btnGhost, padding: "4px 10px", fontSize: 11 }}>Clear all</button>
              ) : null}
            </div>
          </div>

          <SortableHeader cols={[
            { k: "", l: "", w: "28px" },
            { k: "name", l: "Supplier", w: "2.1fr" },
            { k: "site_count", l: "Sites", w: "0.55fr", num: true },
            { k: "state", l: "State", w: "0.6fr" },
            { k: "zone", l: "Primary zone", w: "0.85fr" },
            { k: "pct_lme", l: "% LME", w: "0.75fr", num: true },
            { k: "price_aud_t", l: "AUD/t", w: "0.85fr", num: true },
            { k: "freight_aud_t", l: "Freight", w: "0.85fr", num: true },
            { k: "landed_aud_t", l: "Landed", w: "0.9fr", num: true },
            { k: "", l: "30d trend", w: "1fr", num: true },
            { k: "days_since", l: "Last pickup", w: "0.85fr", num: true },
            { k: "avg_monthly_t", l: "Avg t/mo", w: "0.8fr", num: true },
          ]} sortKey={sortKey} sortDir={sortDir} onSort={sort}/>
          {filtered.slice(0, 25).map((s, i) => (
            <SupplierRowFull key={s.id} s={s} alt={i % 2 === 1}
              onClick={() => global.__appSetRoute({ name: "supplier", id: s.id })}/>
          ))}
          {filtered.length > 25 && (
            <div style={{ padding: "14px 16px", textAlign: "center", color: "var(--muted)", fontSize: 12, borderTop: "1px solid var(--line)" }}>
              + {filtered.length - 25} more · <a style={{ color: "var(--accent)", cursor: "pointer" }}>load more</a>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // STATES
  // ════════════════════════════════════════════════════════════════════════
  function StatesPage() {
    const [active, setActive] = useState("NSW");
    const [metric, setMetric] = useState("volume"); // volume | spend | rate
    const valsByMetric = {
      volume: Object.fromEntries(states.map(s => [s.code, s.monthly_tonnes])),
      spend:  Object.fromEntries(states.map(s => [s.code, s.ytd_spend_aud])),
      rate:   Object.fromEntries(states.map(s => [s.code, s.avg_pct_lme])),
    };
    const palettes = {
      volume: ["#EEF0FF","#D6D8FA","#B8BCF3","#8A8FE6","#5B5BD6","#3F3FB3"],
      spend:  ["#EEF0FF","#D6D8FA","#B8BCF3","#8A8FE6","#5B5BD6","#3F3FB3"],
      rate:   ["#EEF0FF","#D6D8FA","#B8BCF3","#8A8FE6","#5B5BD6","#3F3FB3"],
    };
    const labels = {
      volume: (c) => valsByMetric.volume[c] != null ? Math.round(valsByMetric.volume[c]) + "t" : "—",
      spend:  (c) => valsByMetric.spend[c] != null ? "$" + (valsByMetric.spend[c]/1000).toFixed(0) + "k" : "—",
      rate:   (c) => valsByMetric.rate[c] != null ? valsByMetric.rate[c] + "%" : "—",
    };

    const activeState = states.find(s => s.code === active);
    const activeSuppliers = suppliers.filter(s => s.states.includes(active));

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
              By state
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>
              State-by-state breakdown
            </h1>
          </div>
          <div style={{ display: "flex", border: "1px solid var(--line-2)", borderRadius: 7, overflow: "hidden", background: "var(--panel)" }}>
            {[["volume","Volume"],["spend","Spend"],["rate","Avg %LME"]].map(([k, l]) => (
              <button key={k} onClick={() => setMetric(k)} style={{
                padding: "7px 14px", fontSize: 12, border: "none",
                borderRight: k === "rate" ? "none" : "1px solid var(--line-2)",
                background: metric === k ? "var(--text)" : "transparent",
                color: metric === k ? "var(--panel)" : "var(--muted)",
                fontFamily: "inherit", fontWeight: 500, cursor: "pointer",
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, minHeight: 0 }}>
          <Card pad>
            <CardHead title="Australia · click a state to drill in" sub={metric === "volume" ? "Monthly tonnes" : metric === "spend" ? "YTD spend ($)" : "Avg % of LME"}/>
            <div style={{ marginTop: -4 }}>
              <AustraliaMap
                values={valsByMetric[metric]}
                palette={palettes[metric]}
                stroke="var(--panel)" labelColor="var(--text)"
                onHover={(c) => c && setActive(c)} highlight={active}
                getLabel={labels[metric]}
                height={420}
              />
            </div>
          </Card>

          <Card pad>
            {activeState && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: stateColor(active), color: "#fff", fontSize: 13, fontWeight: 700,
                    display: "grid", placeItems: "center", fontFamily: mono,
                  }}>{active}</span>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>State</div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{activeState.name}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                  <Stat label="Suppliers" v={activeState.supplier_count}/>
                  <Stat label="Sites" v={activeSuppliers.reduce((a, s) => a + s.sites.filter(x => x.state === active).length, 0)}/>
                  <Stat label="Monthly tonnes" v={activeState.monthly_tonnes.toFixed(1) + " t"}/>
                  <Stat label="Avg % of LME" v={activeState.avg_pct_lme + "%"}/>
                  <Stat label="YTD spend"     v={"$" + (activeState.ytd_spend_aud/1000).toFixed(0) + "k"} span={2}/>
                </div>

                <div style={{ marginTop: 14, fontSize: 11, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
                  Top suppliers in {active}
                </div>
                <div style={{ marginTop: 4 }}>
                  {activeSuppliers.slice(0, 6).map(s => (
                    <button key={s.id} onClick={() => global.__appSetRoute({ name: "supplier", id: s.id })} style={{
                      width: "100%", display: "grid", gridTemplateColumns: "1fr auto auto",
                      alignItems: "center", gap: 10, padding: "9px 0", border: "none",
                      borderBottom: "1px solid var(--line)", background: "transparent", cursor: "pointer",
                      textAlign: "left", color: "var(--text)", fontFamily: "inherit", fontSize: 13,
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: mono }}>
                          {s.sites.filter(x=>x.state===active).map(x=>x.zone).join(", ")} · {s.avg_monthly_t}t/mo
                        </div>
                      </div>
                      <Sparkline data={s.price_series.slice(-30)} width={70} height={22} stroke="var(--chart-line)" fill="var(--chart-fill)"/>
                      <span style={{ fontFamily: mono, fontWeight: 600 }}>{s.pct_lme}%</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Small multiples below */}
        <Card>
          <CardHead title="All states · monthly volume" sub="Past 90 days, t/day equivalent"/>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            {states.map((s, i) => {
              const ss = suppliers.filter(x => x.states.includes(s.code));
              const series = s.monthly_tonnes
                ? history.lme_pb_aud.map((_, k) => s.monthly_tonnes / 30 * (0.7 + ((k * 19 + i * 7) % 47) / 47 * 0.6))
                : [0, 0];
              return (
                <button key={s.code}
                  onClick={() => setActive(s.code)}
                  style={{
                    padding: "14px 16px", textAlign: "left", background: "transparent",
                    border: "none", borderTop: i >= 4 ? "1px solid var(--line)" : "none",
                    borderRight: i % 4 !== 3 ? "1px solid var(--line)" : "none",
                    cursor: "pointer", fontFamily: "inherit", color: "var(--text)",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                      <span style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)" }}>{s.code}</span>
                      <span style={{ marginLeft: 6, fontSize: 12 }}>{s.name}</span>
                    </div>
                    <span style={{ fontFamily: mono, fontSize: 11, color: "var(--dim)" }}>{ss.length} supp</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, fontFamily: mono }}>
                      {s.monthly_tonnes.toFixed(0)}<span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400, marginLeft: 2 }}>t/mo</span>
                    </span>
                  </div>
                  <Sparkline data={series} width={200} height={32} stroke="var(--chart-line)" fill="var(--chart-fill)"/>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // Shared bits
  // ════════════════════════════════════════════════════════════════════════
  function Card({ children, pad }) {
    return (
      <div style={{
        background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12,
        overflow: "hidden", padding: pad ? 16 : 0,
      }}>{children}</div>
    );
  }
  function CardHead({ title, sub, action }) {
    return (
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
        </div>
        {action}
      </div>
    );
  }
  function KPI({ label, sub, value, secondary, delta, series, inv }) {
    const up = delta.pct >= 0;
    const dColor = delta.pct === 0 ? "var(--muted)" : ((inv ? -delta.pct : delta.pct) >= 0 ? "var(--up)" : "var(--down)");
    return (
      <div style={{
        background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px",
        display: "grid", gridTemplateRows: "auto 1fr auto", gap: 4, minHeight: 110,
      }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</div>
          <div style={{ fontSize: 10, color: "var(--dim)" }}>{sub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 24, fontFamily: mono, fontWeight: 600, letterSpacing: -0.5 }}>{value}</span>
          {delta.pct !== 0 && (
            <span style={{ fontSize: 11, color: dColor, fontWeight: 500 }}>
              {delta.sign}{delta.pct_s}%
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: mono }}>{secondary}</span>
          <Sparkline data={series.slice(-30)} width={70} height={20} stroke={up ? "var(--up)" : "var(--down)"}/>
        </div>
      </div>
    );
  }
  function RangePicker({ value, onChange }) {
    return (
      <div style={{ display: "flex", border: "1px solid var(--line-2)", borderRadius: 7, overflow: "hidden", background: "var(--panel)" }}>
        {["7D","30D","90D","1Y","All"].map(r => (
          <button key={r} onClick={() => onChange(r)} style={{
            padding: "6px 12px", fontSize: 12, border: "none", borderRight: "1px solid var(--line-2)",
            background: value === r ? "var(--text)" : "transparent",
            color: value === r ? "var(--panel)" : "var(--muted)",
            fontFamily: "inherit", fontWeight: 500, cursor: "pointer",
          }}>{r}</button>
        ))}
      </div>
    );
  }
  function CurrencyToggle() {
    const [c, setC] = useState("AUD");
    return (
      <div style={{ display: "flex", border: "1px solid var(--line-2)", borderRadius: 6, overflow: "hidden", background: "var(--panel)" }}>
        {["USD","AUD"].map(u => (
          <button key={u} onClick={() => setC(u)} style={{
            padding: "5px 10px", fontSize: 12, border: "none",
            background: c === u ? "var(--text)" : "transparent",
            color: c === u ? "var(--panel)" : "var(--muted)", cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
          }}>{u}</button>
        ))}
      </div>
    );
  }
  function Chip({ on, onClick, children }) {
    return (
      <button onClick={onClick} style={{
        padding: "4px 10px", fontSize: 11, border: "1px solid " + (on ? "var(--text)" : "var(--line-2)"),
        background: on ? "var(--text)" : "transparent",
        color: on ? "var(--panel)" : "var(--muted)", borderRadius: 12, cursor: "pointer", fontFamily: '"Geist Mono", monospace', fontWeight: 500,
      }}>{children}</button>
    );
  }
  function TableHeader({ cols, widths }) {
    return (
      <div style={{
        display: "grid", gridTemplateColumns: widths, padding: "10px 16px",
        fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: 0.3,
        textTransform: "uppercase", borderBottom: "1px solid var(--line)", background: "var(--panel-2)",
      }}>
        {cols.map((c, i) => (
          <span key={i} style={{ textAlign: i >= 4 ? "right" : "left", paddingRight: 6 }}>{c}</span>
        ))}
      </div>
    );
  }
  function SortableHeader({ cols, sortKey, sortDir, onSort }) {
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: cols.map(c => c.w).join(" "),
        padding: "10px 16px", fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: 0.3,
        textTransform: "uppercase", borderBottom: "1px solid var(--line)", background: "var(--panel-2)",
      }}>
        {cols.map((c, i) => {
          const can = !!c.k;
          const active = c.k === sortKey;
          return (
            <span key={i} style={{
              textAlign: c.num ? "right" : "left", cursor: can ? "pointer" : "default",
              color: active ? "var(--text)" : "var(--muted)", paddingRight: 6,
              userSelect: "none", display: "flex", alignItems: "center", gap: 4,
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
  function SupplierRow({ s, onClick, cols }) {
    const sinceColor = s.days_since > 45 ? "var(--down)" : s.days_since > 20 ? "var(--warn)" : "var(--up)";
    return (
      <div onClick={onClick} style={{
        display: "grid", gridTemplateColumns: cols, padding: "11px 16px", alignItems: "center",
        fontSize: 13, borderBottom: "1px solid var(--line)", cursor: "pointer",
      }} onMouseEnter={e => e.currentTarget.style.background = "var(--panel-2)"}
         onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <span style={{
          width: 22, height: 22, borderRadius: 5, background: stateColor(s.state), color: "#fff",
          fontSize: 10, fontWeight: 600, display: "grid", placeItems: "center", fontFamily: mono,
        }}>{s.state}</span>
        <span style={{ fontWeight: 500 }}>{s.name}</span>
        <span style={{ color: "var(--muted)", fontFamily: mono, fontSize: 12 }}>{s.site_count}</span>
        <span>
          <span style={{
            padding: "2px 7px", borderRadius: 4, background: "var(--accent-soft)", color: "var(--accent)",
            fontSize: 11, fontWeight: 600, fontFamily: mono,
          }}>{s.zone}</span>
        </span>
        <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{s.pct_lme}%</span>
        <span style={{ textAlign: "right", fontFamily: mono }}>{fmt.aud(s.price_aud_t, 0)}</span>
        <span style={{ textAlign: "right", fontFamily: mono, color: "var(--muted)" }}>{fmt.aud(s.freight_aud_t, 0)}</span>
        <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{fmt.aud(s.landed_aud_t, 0)}</span>
        <span style={{ display: "flex", justifyContent: "flex-end" }}>
          <Sparkline data={s.price_series.slice(-30)} width={120} height={26} stroke="var(--chart-line)" fill="var(--chart-fill)"/>
        </span>
        <span style={{ textAlign: "right", fontFamily: mono, fontSize: 12, color: sinceColor }}>{s.days_since}d</span>
      </div>
    );
  }
  function SupplierRowFull({ s, alt, onClick }) {
    const sinceColor = s.days_since > 45 ? "var(--down)" : s.days_since > 20 ? "var(--warn)" : "var(--up)";
    return (
      <div onClick={onClick} style={{
        display: "grid",
        gridTemplateColumns: "28px 2.1fr 0.55fr 0.6fr 0.85fr 0.75fr 0.85fr 0.85fr 0.9fr 1fr 0.85fr 0.8fr",
        padding: "11px 16px", alignItems: "center", fontSize: 13,
        borderBottom: "1px solid var(--line)", cursor: "pointer",
        background: alt ? "var(--panel-2)" : "transparent",
      }} onMouseEnter={e => e.currentTarget.style.background = "var(--accent-soft)"}
         onMouseLeave={e => e.currentTarget.style.background = alt ? "var(--panel-2)" : "transparent"}>
        <span style={{
          width: 22, height: 22, borderRadius: 5, background: stateColor(s.state), color: "#fff",
          fontSize: 10, fontWeight: 600, display: "grid", placeItems: "center", fontFamily: mono,
        }}>{s.state}</span>
        <span>
          <span style={{ fontWeight: 500 }}>{s.name}</span>
          {s.site_count > 1 && (
            <span style={{ marginLeft: 6, fontSize: 10, color: "var(--accent)", fontFamily: mono, padding: "1px 5px", background: "var(--accent-soft)", borderRadius: 3 }}>
              {s.site_count} sites
            </span>
          )}
        </span>
        <span style={{ textAlign: "right", fontFamily: mono, color: "var(--muted)" }}>{s.site_count}</span>
        <span style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)" }}>{s.states.join(", ")}</span>
        <span>
          <span style={{
            padding: "2px 7px", borderRadius: 4, background: "var(--accent-soft)", color: "var(--accent)",
            fontSize: 11, fontWeight: 600, fontFamily: mono,
          }}>{s.zone}</span>
        </span>
        <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{s.pct_lme}%</span>
        <span style={{ textAlign: "right", fontFamily: mono }}>{fmt.aud(s.price_aud_t, 0)}</span>
        <span style={{ textAlign: "right", fontFamily: mono, color: "var(--muted)" }}>{fmt.aud(s.freight_aud_t, 0)}</span>
        <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{fmt.aud(s.landed_aud_t, 0)}</span>
        <span style={{ display: "flex", justifyContent: "flex-end" }}>
          <Sparkline data={s.price_series.slice(-30)} width={120} height={26} stroke="var(--chart-line)" fill="var(--chart-fill)"/>
        </span>
        <span style={{ textAlign: "right", fontFamily: mono, fontSize: 12, color: sinceColor }}>{s.days_since}d ago</span>
        <span style={{ textAlign: "right", fontFamily: mono, color: "var(--muted)" }}>{s.avg_monthly_t}t</span>
      </div>
    );
  }
  function Tile({ kind, count, label, detail, cta, onClick, compact }) {
    const colors = {
      warn:  { bg: "rgba(167,125,36,0.08)", border: "rgba(167,125,36,0.18)", text: "var(--warn)" },
      info:  { bg: "var(--accent-soft)",    border: "transparent",            text: "var(--accent)" },
      ok:    { bg: "var(--panel-2)",        border: "var(--line)",            text: "var(--text)" },
    }[kind];
    return (
      <div style={{
        padding: compact ? "10px 16px" : "14px 16px",
        borderTop: "1px solid var(--line)",
        display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center",
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 8,
          background: colors.bg, border: "1px solid " + colors.border,
          color: colors.text, display: "grid", placeItems: "center",
          fontFamily: mono, fontSize: 16, fontWeight: 700,
        }}>{count}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{detail}</div>
        </div>
        <button onClick={onClick} style={{
          background: "transparent", border: "1px solid var(--line-2)", borderRadius: 6,
          padding: "5px 10px", fontSize: 11, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit",
        }}>{cta} →</button>
      </div>
    );
  }
  function Stat({ label, v, span }) {
    return (
      <div style={{
        padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8,
        background: "var(--panel-2)", gridColumn: span ? "span " + span : undefined,
      }}>
        <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 600, fontFamily: mono, marginTop: 2 }}>{v}</div>
      </div>
    );
  }
  const btnLink = {
    background: "transparent", border: "1px solid var(--line-2)", borderRadius: 6,
    padding: "5px 10px", fontSize: 11, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit",
  };
  const btnGhost = {
    padding: "7px 12px", fontSize: 12, fontWeight: 500, border: "1px solid var(--line-2)",
    background: "var(--panel)", color: "var(--text)", borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
  };
  const btnPrimary = {
    padding: "7px 14px", fontSize: 12, fontWeight: 500, border: "1px solid var(--text)",
    background: "var(--text)", color: "var(--panel)", borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
  };

  Object.assign(global, { OverviewPage, SuppliersPage, StatesPage, Card, CardHead, KPI, Sparkline, btnGhost, btnPrimary, btnLink, Tile, Stat, Chip });
})(window);
