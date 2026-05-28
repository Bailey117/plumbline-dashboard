// App shell — header, top nav, alerts slide-over, route switcher.
// Routes: overview, suppliers, supplier:<id>, states, reports, freight, rates, settings

(function (global) {
  const { useState, useEffect, useMemo, useRef } = React;
  const D = global.DASH_DATA;
  const { suppliers, alerts, market, fmt } = D;

  function AppShell({ tweaks, setTweak, route, setRoute, children }) {
    const [alertsOpen, setAlertsOpen] = useState(false);
    const [searchQ, setSearchQ] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const searchResults = useMemo(() => {
      if (!searchQ.trim()) return [];
      const q = searchQ.toLowerCase();
      return suppliers.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.zone.toLowerCase().includes(q)
      ).slice(0, 8);
    }, [searchQ]);

    useEffect(() => {
      function onKey(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          setSearchOpen(true);
        }
        if (e.key === "Escape") {
          setSearchOpen(false);
          setAlertsOpen(false);
        }
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);

    const newAlerts = alerts.filter(a => a.date === "today").length;

    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)", color: "var(--text)",
        fontFamily: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 13, lineHeight: 1.45,
      }}>
        <Header
          route={route} setRoute={setRoute}
          onBell={() => setAlertsOpen(true)} newAlerts={newAlerts}
          onSearch={() => setSearchOpen(true)}
        />

        <main style={{ padding: "20px 24px 60px", maxWidth: 1640, margin: "0 auto" }}>
          {children}
        </main>

        {alertsOpen && <AlertsPanel onClose={() => setAlertsOpen(false)} setRoute={setRoute}/>}
        {searchOpen && (
          <SearchPalette
            q={searchQ} setQ={setSearchQ} results={searchResults}
            onClose={() => { setSearchOpen(false); setSearchQ(""); }}
            onSelect={s => { setRoute({ name: "supplier", id: s.id }); setSearchOpen(false); setSearchQ(""); }}
          />
        )}
      </div>
    );
  }

  function Header({ route, setRoute, onBell, newAlerts, onSearch }) {
    const tabs = [
      { id: "overview",  label: "Overview" },
      { id: "suppliers", label: "Suppliers" },
      { id: "states",    label: "States" },
      { id: "reports",   label: "Reports" },
      { id: "freight",   label: "Freight" },
      { id: "rates",     label: "Rates" },
    ];
    const active = route.name === "supplier" ? "suppliers" : route.name;
    return (
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--panel)",
        borderBottom: "1px solid var(--line)",
        backdropFilter: "saturate(180%) blur(6px)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", padding: "0 24px", height: 56, gap: 24,
          maxWidth: 1640, margin: "0 auto",
        }}>
          <Logo/>
          <nav style={{ display: "flex", gap: 2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setRoute({ name: t.id })} style={{
                padding: "8px 12px", fontSize: 13, fontWeight: active === t.id ? 600 : 500,
                color: active === t.id ? "var(--text)" : "var(--muted)",
                background: "transparent", border: "none", cursor: "pointer", position: "relative",
                borderRadius: 6,
              }}>
                {t.label}
                {active === t.id && (
                  <span style={{
                    position: "absolute", left: 12, right: 12, bottom: -17, height: 2,
                    background: "var(--text)", borderRadius: 2,
                  }}/>
                )}
              </button>
            ))}
          </nav>
          <div style={{ flex: 1 }}/>
          <button onClick={onSearch} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 10px", border: "1px solid var(--line-2)", borderRadius: 8,
            background: "var(--panel-2)", color: "var(--muted)", fontSize: 12, width: 280,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            <SearchIcon/> <span>Search suppliers, codes, states…</span>
            <span style={{ marginLeft: "auto", fontFamily: '"Geist Mono", monospace', fontSize: 11, color: "var(--dim)",
              background: "var(--bg)", border: "1px solid var(--line-2)", padding: "1px 5px", borderRadius: 4 }}>⌘K</span>
          </button>
          <LiveBadge/>
          <button onClick={onBell} style={{
            position: "relative", width: 34, height: 34, border: "1px solid var(--line-2)",
            background: "var(--panel)", borderRadius: 8, cursor: "pointer",
            display: "grid", placeItems: "center", color: "var(--muted)",
          }}>
            <BellIcon/>
            {newAlerts > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                background: "var(--down)", color: "#fff",
                fontSize: 10, fontWeight: 600, borderRadius: 8, padding: "1px 5px",
                fontFamily: '"Geist Mono", monospace', minWidth: 18, textAlign: "center",
              }}>{newAlerts}</span>
            )}
          </button>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #C7A7FF, var(--accent))",
            display: "grid", placeItems: "center", color: "#fff", fontSize: 11, fontWeight: 600,
            cursor: "pointer",
          }}>JM</div>
        </div>
      </header>
    );
  }

  function Logo() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, var(--accent), var(--accent-deep))",
          display: "grid", placeItems: "center", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
        }}>Pb</div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Plumbline</span>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Lead trading desk</span>
        </div>
      </div>
    );
  }

  function LiveBadge() {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "5px 10px", border: "1px solid var(--line-2)", borderRadius: 8,
        fontSize: 11, color: "var(--muted)",
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%", background: "var(--up)",
          boxShadow: "0 0 0 4px rgba(14,143,94,0.18)",
        }}/>
        <span style={{ fontFamily: '"Geist Mono", monospace' }}>{market.asof.split("·")[1].trim()}</span>
      </div>
    );
  }

  // ── Alerts slide-over ─────────────────────────────────────────────────────
  function AlertsPanel({ onClose, setRoute }) {
    const [cat, setCat] = useState("all");
    const cats = [
      { id: "all",       label: "All" },
      { id: "market",    label: "Market" },
      { id: "pickups",   label: "Pickups" },
      { id: "contracts", label: "Contracts" },
      { id: "rates",     label: "Rates" },
      { id: "sap",       label: "SAP" },
    ];
    const list = cat === "all" ? alerts : alerts.filter(a => a.cat === cat);
    const grouped = list.reduce((m, a) => ((m[a.date] = m[a.date] || []).push(a), m), {});
    const sev = {
      info:  { color: "var(--accent)", bg: "var(--accent-soft)", label: "info"  },
      ok:    { color: "var(--up)",     bg: "rgba(14,143,94,0.10)",  label: "ok"    },
      warn:  { color: "var(--warn)",   bg: "rgba(167,125,36,0.12)", label: "warn"  },
      alert: { color: "var(--down)",   bg: "rgba(209,69,69,0.10)",  label: "alert" },
    };
    return (
      <>
        <div onClick={onClose} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 80,
          animation: "fadein 200ms ease both",
        }}/>
        <aside style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 440, zIndex: 90,
          background: "var(--panel)", borderLeft: "1px solid var(--line)",
          display: "grid", gridTemplateRows: "auto auto auto 1fr auto", overflow: "hidden",
          animation: "slidein 220ms cubic-bezier(.2,.7,.2,1) both",
        }}>
          <header style={{
            padding: "16px 20px", borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
                Notifications
              </div>
              <h2 style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 600 }}>Alerts feed</h2>
            </div>
            <button onClick={onClose} style={{
              width: 30, height: 30, border: "1px solid var(--line-2)", background: "transparent",
              borderRadius: 7, cursor: "pointer", color: "var(--muted)", fontSize: 18, lineHeight: 1,
            }}>×</button>
          </header>
          <div style={{
            padding: "10px 20px", borderBottom: "1px solid var(--line)",
            display: "flex", gap: 6, flexWrap: "wrap",
          }}>
            {cats.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} style={{
                padding: "4px 10px", fontSize: 11, fontWeight: 500, borderRadius: 12,
                border: "1px solid " + (cat === c.id ? "var(--text)" : "var(--line-2)"),
                background: cat === c.id ? "var(--text)" : "transparent",
                color: cat === c.id ? "var(--panel)" : "var(--muted)", cursor: "pointer",
              }}>{c.label}</button>
            ))}
          </div>
          <div style={{
            padding: "10px 20px", borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--muted)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--up)" }}/>
            <span>Live · SAP batch synced 04:00 AEST</span>
            <span style={{ marginLeft: "auto", color: "var(--dim)" }}>{list.length} items</span>
          </div>
          <div style={{ overflow: "auto", padding: "8px 20px 20px" }}>
            {Object.entries(grouped).map(([day, items]) => (
              <div key={day}>
                <div style={{
                  fontSize: 10, letterSpacing: 0.5, color: "var(--dim)", textTransform: "uppercase",
                  fontWeight: 600, padding: "12px 0 6px",
                }}>{day}</div>
                {items.map(a => {
                  const s = sev[a.sev];
                  return (
                    <div key={a.id} style={{
                      padding: "12px 0", borderBottom: "1px solid var(--line)",
                      display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, alignItems: "start",
                    }}>
                      <span style={{
                        marginTop: 2, padding: "2px 6px", borderRadius: 4,
                        background: s.bg, color: s.color, fontSize: 10, fontWeight: 600, fontFamily: '"Geist Mono", monospace',
                      }}>{s.label}</span>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{a.body}</div>
                        <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 4, fontFamily: '"Geist Mono", monospace' }}>
                          {a.t} · {a.actor}
                        </div>
                      </div>
                      <button style={{
                        background: "transparent", border: "none", color: "var(--muted)",
                        fontSize: 11, cursor: "pointer", padding: 0,
                      }}>···</button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <footer style={{
            padding: "12px 20px", borderTop: "1px solid var(--line)",
            display: "flex", gap: 10, fontSize: 12, alignItems: "center",
            background: "var(--panel-2)",
          }}>
            <span style={{ color: "var(--muted)" }}>Channels:</span>
            <Pill label="In-app" on/>
            <Pill label="Email"  on/>
            <Pill label="Slack"  />
            <button style={{
              marginLeft: "auto", padding: "5px 10px", border: "1px solid var(--line-2)",
              background: "transparent", color: "var(--muted)", borderRadius: 6, fontSize: 11, cursor: "pointer",
            }}>Configure →</button>
          </footer>
        </aside>
      </>
    );
  }
  function Pill({ label, on }) {
    return (
      <span style={{
        padding: "3px 8px", fontSize: 11, borderRadius: 11,
        background: on ? "var(--accent-soft)" : "transparent",
        color: on ? "var(--accent)" : "var(--muted)",
        border: "1px solid " + (on ? "transparent" : "var(--line-2)"),
        display: "inline-flex", alignItems: "center", gap: 4,
      }}>
        {on && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }}/>}
        {label}
      </span>
    );
  }

  // ── ⌘K search palette ─────────────────────────────────────────────────────
  function SearchPalette({ q, setQ, results, onClose, onSelect }) {
    const inputRef = useRef();
    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 30); }, []);
    return (
      <>
        <div onClick={onClose} style={{
          position: "fixed", inset: 0, background: "rgba(11,11,15,0.30)", zIndex: 80,
          animation: "fadein 150ms ease both",
        }}/>
        <div style={{
          position: "fixed", left: "50%", top: "16%", transform: "translateX(-50%)",
          width: 560, zIndex: 90, background: "var(--panel)", borderRadius: 12,
          border: "1px solid var(--line)", boxShadow: "0 24px 60px rgba(0,0,0,0.20)",
          overflow: "hidden", animation: "popin 180ms cubic-bezier(.2,.7,.2,1) both",
        }}>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
            <SearchIcon/>
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search suppliers, codes, states…"
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                color: "var(--text)", fontSize: 15, marginLeft: 10, fontFamily: "inherit",
              }}/>
            <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 11, color: "var(--dim)",
              border: "1px solid var(--line-2)", padding: "2px 6px", borderRadius: 5 }}>ESC</span>
          </div>
          {results.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>
              {q ? "No matches." : "Try a supplier name, state code (NSW, VIC…), or zone (Z1–Z5)."}
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflow: "auto", padding: "6px 0" }}>
              {results.map(s => (
                <button key={s.id} onClick={() => onSelect(s)} style={{
                  width: "100%", display: "grid", gridTemplateColumns: "32px 1fr auto auto",
                  alignItems: "center", gap: 12, padding: "10px 16px",
                  background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
                  fontFamily: "inherit", color: "var(--text)",
                }} onMouseEnter={e => e.currentTarget.style.background = "var(--panel-2)"}
                   onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 5,
                    background: global.stateColor(s.state), color: "#fff",
                    fontSize: 10, fontWeight: 600, display: "grid", placeItems: "center",
                    fontFamily: '"Geist Mono", monospace',
                  }}>{s.state}</span>
                  <span style={{ fontSize: 13 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: '"Geist Mono", monospace' }}>
                    {s.pct_lme}% · {s.zone}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--dim)" }}>↵</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  // ── Icons ─────────────────────────────────────────────────────────────────
  function SearchIcon() {
    return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>;
  }
  function BellIcon() {
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 12.5h9c-.7-.5-1-1.5-1-2.5V7a3.5 3.5 0 1 0-7 0v3c0 1-.3 2-1 2.5z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>;
  }

  Object.assign(global, { AppShell });
})(window);
