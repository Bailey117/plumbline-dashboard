// Pages: SupplierDetail, Rates, Freight, Reports

(function (global) {
  const { useState, useMemo } = React;
  const D = global.DASH_DATA;
  const { market, history, suppliers, states, fmt, freightAt, freight_zones, volume_daily, spend_daily, months } = D;
  const { AustraliaMap, Sparkline, LineChart, stateColor, Card, CardHead, btnGhost, btnPrimary, btnLink, Chip, Stat } = global;

  const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

  // ════════════════════════════════════════════════════════════════════════
  // SUPPLIER DETAIL
  // ════════════════════════════════════════════════════════════════════════
  function SupplierDetailPage({ id, tweaks }) {
    const s = suppliers.find(x => x.id === id) || suppliers[0];
    const [tab, setTab] = useState("overview");

    const lmeDelta = fmt.delta(market.lme_pb_aud, market.lme_pb_aud_prev, 0);
    const priceDelta = fmt.delta(s.price_aud_t, s.price_series[s.price_series.length - 2], 0);
    const ytdT = s.ytd_tonnes;
    const ytdSpend = s.ytd_spend_aud;

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ fontSize: 11 }}>
          <a onClick={() => global.__appSetRoute({ name: "suppliers" })}
            style={{ color: "var(--muted)", cursor: "pointer" }}>← All suppliers</a>
        </div>

        {/* Header */}
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: stateColor(s.state), color: "#fff",
            display: "grid", placeItems: "center", fontSize: 16, fontWeight: 700,
            fontFamily: mono, letterSpacing: 0.5,
          }}>{s.name.split(" ").map(w=>w[0]).slice(0,2).join("")}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
              Supplier · {s.id.toUpperCase()}
            </div>
            <h1 style={{ margin: "2px 0 6px", fontSize: 26, fontWeight: 600, letterSpacing: -0.3 }}>{s.name}</h1>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {s.states.map(st => (
                <span key={st} style={{
                  padding: "3px 8px", borderRadius: 5, background: stateColor(st), color: "#fff",
                  fontSize: 11, fontWeight: 600, fontFamily: mono,
                }}>{st}</span>
              ))}
              <span style={{ fontSize: 12, color: "var(--muted)" }}>·</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{s.site_count} site{s.site_count > 1 ? "s" : ""}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>·</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Contract expires {s.contract_expires}</span>
              {s.rate_change_due && (
                <span style={{ padding: "2px 8px", borderRadius: 11, background: "rgba(167,125,36,0.12)", color: "var(--warn)", fontSize: 11, fontWeight: 500 }}>
                  ● Rate review due
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnGhost}>↓ Export</button>
            <button style={btnGhost}>📞 Contact</button>
            <button onClick={() => global.__appSetRoute({ name: "rates", focus: s.id })} style={btnPrimary}>Set rate →</button>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          <Stat2 label="Current rate" v={s.pct_lme + "%"} sub="of LME AUD"/>
          <Stat2 label="Lead price" v={fmt.aud(s.price_aud_t, 0)} sub="AUD/tonne" delta={priceDelta}/>
          <Stat2 label="Avg freight" v={fmt.aud(s.freight_aud_t, 0)} sub="AUD/tonne · weighted"/>
          <Stat2 label="Landed cost" v={fmt.aud(s.landed_aud_t, 0)} sub="AUD/tonne all-in"/>
          <Stat2 label="Avg tonnage" v={s.avg_monthly_t + " t"} sub="per month"/>
          <Stat2 label="YTD spend" v={"$" + (ytdSpend/1000).toFixed(0) + "k"} sub={ytdT.toFixed(0) + "t YTD"}/>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
          {[
            { id: "overview", l: "Overview" },
            { id: "sites",    l: `Sites · ${s.site_count}` },
            { id: "price",    l: "Price history" },
            { id: "volume",   l: "Volume" },
            { id: "contract", l: "Contract" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 16px", fontSize: 13, border: "none", background: "transparent",
              color: tab === t.id ? "var(--text)" : "var(--muted)",
              fontWeight: tab === t.id ? 600 : 500, cursor: "pointer", fontFamily: "inherit",
              borderBottom: "2px solid " + (tab === t.id ? "var(--text)" : "transparent"),
              marginBottom: -1,
            }}>{t.l}</button>
          ))}
        </div>

        {tab === "overview" && <DetailOverview s={s} tweaks={tweaks}/>}
        {tab === "sites" && <DetailSites s={s}/>}
        {tab === "price" && <DetailPrice s={s} tweaks={tweaks}/>}
        {tab === "volume" && <DetailVolume s={s}/>}
        {tab === "contract" && <DetailContract s={s}/>}
      </div>
    );
  }

  function DetailOverview({ s, tweaks }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <Card pad>
          <CardHead title="Lead price · 90 days" sub="AUD/tonne · derived from LME × supplier %"/>
          <div style={{ marginTop: 12 }}>
            <LineChart
              data={s.price_series} labels={history.days.map(d => d.slice(5))}
              width={780} height={240} mode={tweaks.chartStyle}
              stroke="var(--chart-line)" fill="var(--chart-fill)"
              grid axisColor="var(--muted)"
              valueFmt={v => "$" + Math.round(v).toLocaleString()}
            />
          </div>
        </Card>
        <Card pad>
          <CardHead title="Monthly tonnage · 12 months" sub="Imported from SAP daily batch"/>
          <BarChart data={s.volume_12m} width={420} height={240} stroke="var(--chart-line)" fill="var(--chart-line)"/>
        </Card>

        <Card>
          <CardHead title="Sites" action={s.site_count > 1 ?
            <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: mono }}>multi-state</span> : null}/>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 0.7fr 0.7fr 0.8fr 0.9fr 0.9fr", padding: "8px 16px", fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
            <span>Site</span><span>State</span><span>Zone</span><span style={{textAlign:"right"}}>t/mo</span><span style={{textAlign:"right"}}>Freight</span><span style={{textAlign:"right"}}>Last pickup</span>
          </div>
          {s.sites.map(site => (
            <SiteRow key={site.id} site={site}/>
          ))}
        </Card>

        <Card>
          <CardHead title="Recent activity"/>
          {[
            { d: "28 May", k: "PICKUP", c: "var(--up)", t: `${(s.avg_monthly_t/4.3).toFixed(1)}t collected · ${s.sites[0].short_name}` },
            { d: "21 May", k: "RATE",   c: "var(--accent)", t: `May rate set to ${s.pct_lme}% · L. Tran` },
            { d: "15 May", k: "PICKUP", c: "var(--up)", t: `${(s.avg_monthly_t/4.3*0.85).toFixed(1)}t collected · ${s.sites[0].short_name}` },
            { d: "08 May", k: "INV",    c: "var(--muted)", t: `Invoice INV-${s.id.slice(1)}-04 settled · ${fmt.aud(ytdSpendFor(s)/5, 0)}` },
            { d: "01 May", k: "RATE",   c: "var(--accent)", t: `Apr rate of ${Math.max(s.pct_lme-1, 58)}% closed` },
          ].map((e, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "60px 60px 1fr", gap: 10,
              padding: "10px 16px", borderBottom: "1px solid var(--line)", fontSize: 12,
            }}>
              <span style={{ fontFamily: mono, color: "var(--dim)" }}>{e.d}</span>
              <span style={{ fontFamily: mono, color: e.c, fontWeight: 600, fontSize: 11 }}>{e.k}</span>
              <span>{e.t}</span>
            </div>
          ))}
        </Card>
      </div>
    );
  }
  function ytdSpendFor(s) { return s.ytd_spend_aud; }

  function DetailSites({ s }) {
    return (
      <Card>
        <CardHead title={`${s.site_count} pickup site${s.site_count>1?"s":""}`}
                  sub={s.site_count > 1 ? `Across ${s.states.join(", ")}` : "Single-site supplier"}
                  action={<button style={btnGhost}>+ Add site</button>}/>
        <div style={{
          display: "grid",
          gridTemplateColumns: "2.4fr 0.7fr 0.7fr 0.9fr 1fr 1fr 1fr 0.9fr",
          padding: "10px 16px", fontSize: 10, color: "var(--muted)", fontWeight: 600,
          letterSpacing: 0.3, textTransform: "uppercase", borderBottom: "1px solid var(--line)",
          background: "var(--panel-2)",
        }}>
          <span>Site name</span><span>State</span><span>Zone</span>
          <span style={{textAlign:"right"}}>t/mo</span>
          <span style={{textAlign:"right"}}>Freight $/t</span>
          <span style={{textAlign:"right"}}>Landed $/t</span>
          <span style={{textAlign:"right"}}>Last pickup</span>
          <span style={{textAlign:"right"}}>Contact</span>
        </div>
        {s.sites.map(site => (
          <div key={site.id} style={{
            display: "grid",
            gridTemplateColumns: "2.4fr 0.7fr 0.7fr 0.9fr 1fr 1fr 1fr 0.9fr",
            padding: "12px 16px", alignItems: "center", fontSize: 13, borderBottom: "1px solid var(--line)",
          }}>
            <span style={{ fontWeight: 500 }}>{site.short_name}</span>
            <span style={{
              padding: "2px 7px", borderRadius: 4, background: stateColor(site.state), color: "#fff",
              fontSize: 10, fontWeight: 600, fontFamily: mono, display: "inline-block", width: "fit-content",
            }}>{site.state}</span>
            <span><span style={{
              padding: "2px 7px", borderRadius: 4, background: "var(--accent-soft)", color: "var(--accent)",
              fontSize: 11, fontWeight: 600, fontFamily: mono,
            }}>{site.zone}</span></span>
            <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{site.monthly_t}</span>
            <span style={{ textAlign: "right", fontFamily: mono, color: "var(--muted)" }}>{fmt.aud(site.freight_aud_t, 0)}</span>
            <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{fmt.aud(s.price_aud_t + site.freight_aud_t, 0)}</span>
            <span style={{ textAlign: "right", fontFamily: mono, fontSize: 12, color: site.days_since > 40 ? "var(--down)" : site.days_since > 20 ? "var(--warn)" : "var(--up)" }}>
              {site.days_since}d ago
            </span>
            <span style={{ textAlign: "right", fontSize: 12, color: "var(--muted)" }}>{site.contact}</span>
          </div>
        ))}
      </Card>
    );
  }

  function DetailPrice({ s, tweaks }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <Card pad>
          <CardHead title="Effective AUD/t · 90 days" sub={`${s.pct_lme}% of LME AUD spot`}/>
          <LineChart data={s.price_series} labels={history.days.map(d => d.slice(5))}
            width={780} height={300} mode={tweaks.chartStyle}
            stroke="var(--chart-line)" fill="var(--chart-fill)" grid axisColor="var(--muted)"
            valueFmt={v => "$" + Math.round(v).toLocaleString()}/>
        </Card>
        <Card>
          <CardHead title="Rate history · 6 months" sub="Monthly negotiated %"/>
          <div style={{
            display: "grid", gridTemplateColumns: "1.2fr 0.6fr 0.7fr 1fr", padding: "8px 16px",
            fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: 0.3,
            textTransform: "uppercase", borderBottom: "1px solid var(--line)",
          }}>
            <span>Month</span><span style={{textAlign:"right"}}>% LME</span><span style={{textAlign:"right"}}>Δ</span><span>Set by</span>
          </div>
          {[...s.rate_history].reverse().map((r, i, arr) => {
            const prev = arr[i + 1];
            const d = prev ? r.pct - prev.pct : 0;
            return (
              <div key={r.month} style={{
                display: "grid", gridTemplateColumns: "1.2fr 0.6fr 0.7fr 1fr",
                padding: "10px 16px", fontSize: 13, borderBottom: "1px solid var(--line)",
                alignItems: "center",
              }}>
                <span>{r.month}</span>
                <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{r.pct}%</span>
                <span style={{ textAlign: "right", fontFamily: mono, fontSize: 11,
                  color: d > 0 ? "var(--up)" : d < 0 ? "var(--down)" : "var(--muted)" }}>
                  {d === 0 ? "·" : (d > 0 ? "+" : "") + d}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{r.set_by}</span>
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  function DetailVolume({ s }) {
    return (
      <Card pad>
        <CardHead title="Monthly tonnage · trailing 12 months" sub={`Avg ${s.avg_monthly_t} t/mo · ${s.site_count} site${s.site_count>1?"s":""}`}/>
        <BarChart data={s.volume_12m} width={1140} height={300} stroke="var(--chart-line)" fill="var(--chart-line)" labels showAvg avg={s.avg_monthly_t}/>
      </Card>
    );
  }

  function DetailContract({ s }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card pad>
          <CardHead title="Contract terms"/>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
            <Field label="Contract ID" v={"CTR-" + s.id.toUpperCase() + "-2024"}/>
            <Field label="Effective from" v="01 Jan 2024"/>
            <Field label="Expires" v={s.contract_expires}/>
            <Field label="Auto-renew" v="No · 120 days notice"/>
            <Field label="Pricing basis" v={`${s.pct_lme}% of LME AUD spot, monthly cycle`}/>
            <Field label="Freight" v={`Per-site, ${s.site_count > 1 ? "tiered zones" : "Zone " + s.zone}, diesel-indexed`}/>
            <Field label="Volume floor" v={(s.avg_monthly_t * 0.75).toFixed(0) + " t/mo"}/>
            <Field label="Volume ceiling" v={(s.avg_monthly_t * 1.5).toFixed(0) + " t/mo"}/>
            <Field label="Payment terms" v="Net 30 days · EFT"/>
            <Field label="Account manager" v="J. Moxley"/>
          </div>
        </Card>
        <Card>
          <CardHead title="Documents"/>
          {[
            ["Master Supply Agreement",   "Jan 2024", "PDF · 1.2MB"],
            ["Schedule A · Site list",    "Mar 2026", "PDF · 240KB"],
            ["Schedule B · Freight zones","Mar 2026", "PDF · 180KB"],
            ["Rate amendment · May 2026", "01 May",   "PDF · 84KB"],
            ["Compliance certificate",    "Feb 2026", "PDF · 320KB"],
          ].map(([n, dt, sz]) => (
            <div key={n} style={{
              display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 10,
              padding: "12px 16px", borderBottom: "1px solid var(--line)", alignItems: "center",
              fontSize: 13,
            }}>
              <span style={{ width: 28, height: 28, borderRadius: 5, background: "var(--accent-soft)", display: "grid", placeItems: "center", color: "var(--accent)", fontSize: 11, fontWeight: 600, fontFamily: mono }}>PDF</span>
              <span>{n}</span>
              <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: mono }}>{dt}</span>
              <a style={{ fontSize: 11, color: "var(--accent)", cursor: "pointer" }}>{sz}</a>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // RATES — Monthly rate review
  // ════════════════════════════════════════════════════════════════════════
  function RatesPage() {
    const [draft, setDraft] = useState(() => Object.fromEntries(suppliers.map(s => [s.id, s.pct_lme])));
    const [stateFilter, setStateFilter] = useState("All");
    const [showOnlyDue, setShowOnlyDue] = useState(false);

    const filtered = useMemo(() => {
      return suppliers.filter(s =>
        (stateFilter === "All" || s.states.includes(stateFilter)) &&
        (!showOnlyDue || s.rate_change_due)
      );
    }, [stateFilter, showOnlyDue]);

    const changes = suppliers.filter(s => draft[s.id] !== s.pct_lme).length;
    const avgDraft = (Object.values(draft).reduce((a, b) => a + b, 0) / suppliers.length).toFixed(1);
    const avgCurrent = (suppliers.reduce((a, s) => a + s.pct_lme, 0) / suppliers.length).toFixed(1);

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
              Monthly rate cycle
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>
              June 2026 rate review
            </h1>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              Cycle opens 1 June · current cycle (May) closes 31 May · effective 1st of month.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnGhost}>Save draft</button>
            <button style={{ ...btnPrimary, opacity: changes ? 1 : 0.5 }}>
              Publish {changes > 0 ? `${changes} change${changes > 1 ? "s" : ""}` : "rates"}
            </button>
          </div>
        </div>

        {/* Summary tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <Stat2 label="Suppliers" v={suppliers.length} sub="50 active"/>
          <Stat2 label="Current avg rate" v={avgCurrent + "%"} sub="May 2026"/>
          <Stat2 label="Draft avg rate"  v={avgDraft + "%"} sub={`${changes} change${changes !== 1 ? "s" : ""} pending`}/>
          <Stat2 label="Due this cycle" v={suppliers.filter(s => s.rate_change_due).length} sub="flagged for review"/>
        </div>

        {/* Filter bar */}
        <Card>
          <div style={{ display: "flex", gap: 10, padding: "10px 14px", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>State:</span>
            {["All", ...D.STATES].map(st => (
              <Chip key={st} on={stateFilter === st} onClick={() => setStateFilter(st)}>{st}</Chip>
            ))}
            <span style={{ marginLeft: 12 }}/>
            <Chip on={showOnlyDue} onClick={() => setShowOnlyDue(!showOnlyDue)}>Due only</Chip>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: mono }}>{filtered.length} shown</span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "28px 2.2fr 0.7fr 0.7fr 0.9fr 0.9fr 1.4fr 0.9fr",
            padding: "10px 16px", fontSize: 10, color: "var(--muted)", fontWeight: 600,
            letterSpacing: 0.3, textTransform: "uppercase", borderBottom: "1px solid var(--line)",
            background: "var(--panel-2)",
          }}>
            <span></span><span>Supplier</span><span>State</span><span>Sites</span>
            <span style={{textAlign:"right"}}>Current %</span>
            <span style={{textAlign:"right"}}>Last Δ</span>
            <span>Draft new rate</span>
            <span style={{textAlign:"right"}}>Δ from current</span>
          </div>
          {filtered.slice(0, 18).map(s => {
            const dv = draft[s.id];
            const delta = dv - s.pct_lme;
            const hist = s.rate_history;
            const lastChange = hist.length >= 2 ? hist[hist.length-1].pct - hist[hist.length-2].pct : 0;
            return (
              <div key={s.id} style={{
                display: "grid",
                gridTemplateColumns: "28px 2.2fr 0.7fr 0.7fr 0.9fr 0.9fr 1.4fr 0.9fr",
                padding: "10px 16px", alignItems: "center", fontSize: 13, borderBottom: "1px solid var(--line)",
                background: s.rate_change_due ? "rgba(167,125,36,0.04)" : "transparent",
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 5, background: stateColor(s.state), color: "#fff",
                  fontSize: 10, fontWeight: 600, display: "grid", placeItems: "center", fontFamily: mono,
                }}>{s.state}</span>
                <span style={{ fontWeight: 500 }}>
                  {s.name}
                  {s.rate_change_due && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--warn)" }}>● due</span>}
                </span>
                <span style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)" }}>{s.states.join(",")}</span>
                <span style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)" }}>{s.site_count}</span>
                <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{s.pct_lme}%</span>
                <span style={{ textAlign: "right", fontFamily: mono, fontSize: 11,
                  color: lastChange > 0 ? "var(--up)" : lastChange < 0 ? "var(--down)" : "var(--muted)" }}>
                  {lastChange === 0 ? "·" : (lastChange > 0 ? "+" : "") + lastChange}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="range" min={55} max={85} step={1} value={dv}
                    onChange={e => setDraft({ ...draft, [s.id]: +e.target.value })}
                    style={{ flex: 1, accentColor: "var(--accent)" }}/>
                  <input type="number" min={55} max={85} value={dv}
                    onChange={e => setDraft({ ...draft, [s.id]: +e.target.value })}
                    style={{
                      width: 56, padding: "4px 6px", border: "1px solid var(--line-2)",
                      borderRadius: 5, fontFamily: mono, fontSize: 12, fontWeight: 600,
                      background: "var(--panel)", color: "var(--text)", textAlign: "right",
                    }}/>
                </span>
                <span style={{ textAlign: "right", fontFamily: mono, fontSize: 12, fontWeight: 600,
                  color: delta > 0 ? "var(--up)" : delta < 0 ? "var(--down)" : "var(--muted)" }}>
                  {delta === 0 ? "no change" : (delta > 0 ? "+" : "") + delta + "%"}
                </span>
              </div>
            );
          })}
          {filtered.length > 18 && (
            <div style={{ padding: "12px", textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
              + {filtered.length - 18} more · <a style={{ color: "var(--accent)", cursor: "pointer" }}>show all</a>
            </div>
          )}
        </Card>

        {/* History grid */}
        <Card pad>
          <CardHead title="Average rate · last 6 months" sub="Across all suppliers, weighted by tonnage"/>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginTop: 8 }}>
            {months.map((m, i) => {
              const avg = (suppliers.reduce((a, s) => a + s.rate_history[i].pct * s.avg_monthly_t, 0) /
                          suppliers.reduce((a, s) => a + s.avg_monthly_t, 0)).toFixed(1);
              return (
                <div key={m} style={{
                  padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 8,
                  background: i === 5 ? "var(--accent-soft)" : "var(--panel-2)",
                }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>{m}</div>
                  <div style={{ fontSize: 22, fontFamily: mono, fontWeight: 600, marginTop: 2,
                    color: i === 5 ? "var(--accent)" : "var(--text)" }}>{avg}%</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // FREIGHT — Zone reference + calculator
  // ════════════════════════════════════════════════════════════════════════
  function FreightPage() {
    const [diesel, setDiesel] = useState(market.diesel_gate_aud);

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
              Freight pricing
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>
              Zone reference & calculator
            </h1>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              Per-site zones, indexed to AIP diesel TGP. Base rates set at diesel = $1.80/L.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Diesel TGP</span>
            <span style={{ fontSize: 18, fontWeight: 600, fontFamily: mono }}>${diesel.toFixed(3)}/L</span>
          </div>
        </div>

        <Card pad>
          <CardHead title="Diesel sensitivity" sub="Slide to see effective freight at different diesel prices"/>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", marginTop: 8 }}>
            <input type="range" min={1.5} max={2.6} step={0.01} value={diesel}
              onChange={e => setDiesel(+e.target.value)}
              style={{ accentColor: "var(--accent)" }}/>
            <button onClick={() => setDiesel(market.diesel_gate_aud)} style={{ ...btnGhost, padding: "4px 10px", fontSize: 11 }}>
              Reset to today (${market.diesel_gate_aud.toFixed(3)})
            </button>
          </div>
        </Card>

        {/* Zone cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {freight_zones.map(z => {
            const eff = freightAt(z.code, diesel);
            const today = freightAt(z.code, market.diesel_gate_aud);
            const sites = suppliers.flatMap(s => s.sites.filter(x => x.zone === z.code));
            return (
              <div key={z.code} style={{
                background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12,
                padding: "16px 16px", display: "grid", gridTemplateRows: "auto auto auto 1fr", gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: 5, background: "var(--accent-soft)",
                    color: "var(--accent)", fontSize: 12, fontWeight: 700, fontFamily: mono,
                  }}>{z.code}</span>
                  <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: mono }}>{sites.length} sites</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{z.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {z.states.join(", ")}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 600, fontFamily: mono, letterSpacing: -0.5 }}>
                    ${Math.round(eff)}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>/ tonne</span>
                </div>
                <div style={{ fontSize: 10, color: "var(--dim)", borderTop: "1px dashed var(--line)", paddingTop: 6, lineHeight: 1.5 }}>
                  Base ${z.base} @ $1.80/L<br/>
                  At today's diesel: <span style={{ color: "var(--text)", fontFamily: mono }}>${today.toFixed(0)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Diesel curve */}
        <Card pad>
          <CardHead title="Freight curve · all zones" sub="Y: $/tonne · X: diesel TGP $/L"/>
          <FreightCurve diesel={diesel}/>
        </Card>
      </div>
    );
  }

  function FreightCurve({ diesel }) {
    const W = 1140, H = 280, padL = 50, padR = 20, padT = 16, padB = 32;
    const dieselRange = [1.5, 2.6];
    const x = v => padL + (v - dieselRange[0]) / (dieselRange[1] - dieselRange[0]) * (W - padL - padR);
    const allFreights = freight_zones.map(z => freightAt(z.code, dieselRange[1]));
    const maxF = Math.max(...allFreights) * 1.05;
    const y = v => padT + (H - padT - padB) - (v / maxF) * (H - padT - padB);
    const colors = ["#5B5BD6","#0E8F5E","#A77D24","#D14545","#7C3AED"];
    return (
      <svg width={W} height={H} style={{ maxWidth: "100%", display: "block" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1={padL} x2={W-padR} y1={padT + (H-padT-padB)*(1-t)} y2={padT + (H-padT-padB)*(1-t)}
            stroke="rgba(0,0,0,0.06)" strokeDasharray="2 3"/>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <text key={i} x={padL - 8} y={padT + (H-padT-padB)*(1-t) + 3} textAnchor="end" fontSize="10" fill="var(--muted)" fontFamily="inherit">
            ${Math.round(maxF * t)}
          </text>
        ))}
        {[1.5, 1.8, 2.0, 2.2, 2.4, 2.6].map((d, i) => (
          <text key={i} x={x(d)} y={H - 10} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="inherit">
            ${d.toFixed(1)}
          </text>
        ))}
        {/* current diesel line */}
        <line x1={x(diesel)} x2={x(diesel)} y1={padT} y2={H - padB} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4"/>
        <text x={x(diesel)} y={padT - 4} textAnchor="middle" fontSize="10" fill="var(--accent)" fontFamily="inherit" fontWeight="600">
          ${diesel.toFixed(2)}
        </text>
        {/* Curves per zone */}
        {freight_zones.map((z, i) => {
          const pts = [];
          for (let d = dieselRange[0]; d <= dieselRange[1] + 0.001; d += 0.05) {
            pts.push(`${x(d).toFixed(1)},${y(freightAt(z.code, d)).toFixed(1)}`);
          }
          const eff = freightAt(z.code, diesel);
          return (
            <g key={z.code}>
              <polyline points={pts.join(" ")} fill="none" stroke={colors[i]} strokeWidth="2"/>
              <circle cx={x(diesel)} cy={y(eff)} r="3.5" fill={colors[i]} stroke="#fff" strokeWidth="1.5"/>
              <text x={W - padR - 4} y={y(freightAt(z.code, dieselRange[1])) + 3} textAnchor="end"
                fontSize="11" fontFamily="Geist Mono, monospace" fontWeight="600" fill={colors[i]}>
                {z.code}  ${Math.round(eff)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // REPORTS — Volume + Cost
  // ════════════════════════════════════════════════════════════════════════
  function ReportsPage({ tweaks }) {
    const [range, setRange] = useState("90D");
    const [mode, setMode] = useState("volume"); // volume | cost
    const [groupBy, setGroupBy] = useState("state");

    const sliceFor = (r) => ({ "7D": 7, "30D": 30, "90D": 90, "1Y": 90 }[r] || 90);
    const n = sliceFor(range);
    const seriesAll = (mode === "volume" ? volume_daily : spend_daily).slice(-n);
    const labels = history.days.slice(-n).map(d => d.slice(5));
    const total = seriesAll.reduce((a, b) => a + b, 0);
    const avg = total / n;

    // Group-by stacks
    const groups = useMemo(() => {
      let buckets = {};
      if (groupBy === "state") {
        D.STATES.forEach(st => buckets[st] = states.find(x => x.code === st)?.monthly_tonnes || 0);
      } else if (groupBy === "zone") {
        freight_zones.forEach(z => buckets[z.code] = suppliers.flatMap(s => s.sites).filter(x => x.zone === z.code).reduce((a, x) => a + x.monthly_t, 0));
      } else if (groupBy === "top10") {
        const top = [...suppliers].sort((a, b) => b.avg_monthly_t - a.avg_monthly_t).slice(0, 10);
        top.forEach(s => buckets[s.name.split(" ").slice(0, 2).join(" ")] = s.avg_monthly_t);
      }
      return Object.entries(buckets).sort((a, b) => b[1] - a[1]);
    }, [groupBy]);

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
              Reports
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>
              {mode === "volume" ? "Volume" : "Cost"} report
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", border: "1px solid var(--line-2)", borderRadius: 7, overflow: "hidden" }}>
              {[["volume","Volume"],["cost","Cost"]].map(([k, l]) => (
                <button key={k} onClick={() => setMode(k)} style={{
                  padding: "7px 14px", fontSize: 12, border: "none",
                  background: mode === k ? "var(--text)" : "var(--panel)",
                  color: mode === k ? "var(--panel)" : "var(--muted)",
                  fontFamily: "inherit", fontWeight: 500, cursor: "pointer",
                }}>{l}</button>
              ))}
            </div>
            <RangePicker value={range} onChange={setRange}/>
            <button style={btnGhost}>↓ Export CSV</button>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <Stat2 label={`Total ${mode === "volume" ? "volume" : "spend"}`}
                 v={mode === "volume" ? total.toFixed(0) + " t" : "$" + (total/1000).toFixed(0) + "k"}
                 sub={`Last ${n} days`}/>
          <Stat2 label={`Avg / day`}
                 v={mode === "volume" ? avg.toFixed(1) + " t" : "$" + (avg/1000).toFixed(1) + "k"}
                 sub={`${n} day window`}/>
          <Stat2 label="Active sites"
                 v={suppliers.reduce((a, s) => a + s.site_count, 0)}
                 sub={`Across ${suppliers.length} suppliers`}/>
          <Stat2 label="Avg landed cost"
                 v={fmt.aud(suppliers.reduce((a, s) => a + s.landed_aud_t, 0) / suppliers.length, 0) + "/t"}
                 sub="Lead + freight"/>
        </div>

        {/* Hero chart */}
        <Card pad>
          <CardHead title={`${mode === "volume" ? "Daily tonnes" : "Daily spend"} · ${range}`}/>
          <LineChart data={seriesAll} labels={labels} width={1140} height={260}
            mode={tweaks.chartStyle}
            stroke="var(--chart-line)" fill="var(--chart-fill)"
            grid axisColor="var(--muted)"
            valueFmt={v => mode === "volume" ? v.toFixed(0) + "t" : "$" + (v/1000).toFixed(0) + "k"}/>
        </Card>

        {/* Group by stacks */}
        <Card>
          <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Breakdown</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Grouped by {groupBy === "state" ? "state" : groupBy === "zone" ? "freight zone" : "top 10 suppliers"}</div>
            </div>
            <div style={{ display: "flex", border: "1px solid var(--line-2)", borderRadius: 7, overflow: "hidden" }}>
              {[["state","State"],["zone","Zone"],["top10","Top 10 suppliers"]].map(([k, l]) => (
                <button key={k} onClick={() => setGroupBy(k)} style={{
                  padding: "5px 12px", fontSize: 11, border: "none",
                  background: groupBy === k ? "var(--text)" : "var(--panel)",
                  color: groupBy === k ? "var(--panel)" : "var(--muted)",
                  fontFamily: "inherit", fontWeight: 500, cursor: "pointer",
                  borderRight: k === "top10" ? "none" : "1px solid var(--line-2)",
                }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            {groups.map(([k, v], i) => {
              const max = Math.max(...groups.map(g => g[1]));
              const w = (v / max) * 100;
              return (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px", gap: 12, alignItems: "center", fontSize: 12 }}>
                  <span>{k}</span>
                  <div style={{ height: 22, background: "var(--panel-2)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                    <div style={{ width: w + "%", height: "100%", background: "var(--accent)", borderRadius: 4 }}/>
                  </div>
                  <span style={{ fontFamily: mono, fontWeight: 600, textAlign: "right" }}>
                    {mode === "volume" ? v.toFixed(0) + "t" : "$" + (v/1000).toFixed(0) + "k"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // Small bits
  // ════════════════════════════════════════════════════════════════════════
  function Stat2({ label, v, sub, delta }) {
    return (
      <div style={{
        padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10,
        background: "var(--panel)",
      }}>
        <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 600, fontFamily: mono, marginTop: 2, display: "flex", alignItems: "baseline", gap: 6 }}>
          {v}
          {delta && delta.pct !== 0 && (
            <span style={{ fontSize: 11, color: delta.pct >= 0 ? "var(--up)" : "var(--down)" }}>
              {delta.sign}{delta.pct_s}%
            </span>
          )}
        </div>
        {sub && <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2, fontFamily: mono }}>{sub}</div>}
      </div>
    );
  }

  function SiteRow({ site }) {
    return (
      <div style={{
        display: "grid", gridTemplateColumns: "2fr 0.7fr 0.7fr 0.8fr 0.9fr 0.9fr",
        padding: "10px 16px", alignItems: "center", fontSize: 13, borderBottom: "1px solid var(--line)",
      }}>
        <span style={{ fontWeight: 500 }}>{site.short_name}</span>
        <span style={{
          padding: "2px 7px", borderRadius: 4, background: stateColor(site.state), color: "#fff",
          fontSize: 10, fontWeight: 600, fontFamily: mono, display: "inline-block", width: "fit-content",
        }}>{site.state}</span>
        <span><span style={{
          padding: "2px 7px", borderRadius: 4, background: "var(--accent-soft)", color: "var(--accent)",
          fontSize: 11, fontWeight: 600, fontFamily: mono,
        }}>{site.zone}</span></span>
        <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{site.monthly_t}t</span>
        <span style={{ textAlign: "right", fontFamily: mono, color: "var(--muted)" }}>{fmt.aud(site.freight_aud_t, 0)}</span>
        <span style={{ textAlign: "right", fontFamily: mono, fontSize: 12,
          color: site.days_since > 40 ? "var(--down)" : site.days_since > 20 ? "var(--warn)" : "var(--up)" }}>
          {site.days_since}d ago
        </span>
      </div>
    );
  }

  function Field({ label, v }) {
    return (
      <div>
        <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 14, marginTop: 2 }}>{v}</div>
      </div>
    );
  }

  function BarChart({ data, width = 600, height = 200, stroke, fill, labels, showAvg, avg }) {
    const padL = 40, padR = 12, padT = 12, padB = 24;
    const max = Math.max(...data) * 1.1;
    const x0 = padL;
    const bw = (width - padL - padR) / data.length;
    const y = v => padT + (height - padT - padB) - (v / max) * (height - padT - padB);
    const monthLabels = ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"];
    return (
      <svg width={width} height={height} style={{ display: "block", maxWidth: "100%" }}>
        {[0, 0.5, 1].map((t, i) => (
          <line key={i} x1={padL} x2={width-padR} y1={padT + (height-padT-padB)*(1-t)} y2={padT + (height-padT-padB)*(1-t)}
            stroke="rgba(0,0,0,0.06)" strokeDasharray="2 3"/>
        ))}
        {[0, 0.5, 1].map((t, i) => (
          <text key={i} x={padL - 6} y={padT + (height-padT-padB)*(1-t) + 3} textAnchor="end" fontSize="10" fill="var(--muted)">
            {Math.round(max * t)}
          </text>
        ))}
        {data.map((v, i) => (
          <rect key={i} x={x0 + i * bw + 2} y={y(v)} width={bw - 4} height={(height - padT - padB) - (y(v) - padT)}
            fill={fill || "var(--chart-line)"} opacity={0.85}/>
        ))}
        {labels && monthLabels.map((m, i) => (
          <text key={i} x={x0 + i * bw + bw / 2} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">{m}</text>
        ))}
        {showAvg && (
          <>
            <line x1={padL} x2={width-padR} y1={y(avg)} y2={y(avg)} stroke="var(--accent)" strokeDasharray="4 4" strokeWidth="1.5"/>
            <text x={width - padR - 4} y={y(avg) - 4} textAnchor="end" fontSize="10" fill="var(--accent)" fontWeight="600">avg {avg}t</text>
          </>
        )}
      </svg>
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

  Object.assign(global, { SupplierDetailPage, RatesPage, FreightPage, ReportsPage });
})(window);
