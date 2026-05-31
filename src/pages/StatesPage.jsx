import React, { useState } from 'react';
import { useStates, useSuppliers, fmt } from '../api/hooks';
import { useRoute } from '../context/RouteContext';
import AustraliaMap from '../components/maps/AustraliaMap';
import { stateColor } from '../theme';

const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

export default function StatesPage() {
  const { states } = useStates();
  const { suppliers } = useSuppliers();
  const { setRoute } = useRoute();
  const [hover, setHover] = useState(null);

  const stateVals = Object.fromEntries(states.map(s => [s.code, s.monthly_tonnes]));
  const activeState = hover ? states.find(s => s.code === hover) : null;
  const activeSuppliers = hover ? suppliers.filter(s => s.state === hover) : [];

  const totalMonthly = states.reduce((a, s) => a + s.monthly_tonnes, 0);
  const totalSpend = states.reduce((a, s) => a + s.ytd_spend_aud, 0);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 11, color: "var(--muted)",
          letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600,
        }}>
          Geographic overview
        </div>
        <h1 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>
          States & territories
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Map + summary */}
        <div style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {activeState ? activeState.name : "Monthly volume by state"}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {activeState
                  ? `${activeState.supplier_count} suppliers · ${activeState.monthly_tonnes.toFixed(0)} t/mo`
                  : "Hover to inspect"
                }
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--muted)" }}>
              <span>less</span>
              {["#EEF0FF","#B8BCF3","#5B5BD6","#3F3FB3"].map(c => (
                <span key={c} style={{
                  width: 14, height: 8, background: c,
                  border: "1px solid var(--line-2)",
                  display: "inline-block",
                }} />
              ))}
              <span>more</span>
            </div>
          </div>

          <AustraliaMap
            values={stateVals}
            palette={["#EEF0FF","#D6D8FA","#B8BCF3","#8A8FE6","#5B5BD6","#3F3FB3"]}
            stroke="var(--panel)"
            labelColor="var(--text)"
            onHover={setHover}
            highlight={hover}
            getLabel={c => stateVals[c] != null ? Math.round(stateVals[c]) + "t" : "—"}
            onClick={code => setRoute({ name: "suppliers", filterState: code })}
            height={300}
          />

          {/* Quick stats */}
          <div style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
          }}>
            {[
              ["Total suppliers", suppliers.length],
              ["Total monthly", fmt.t(totalMonthly)],
              ["YTD spend", "$" + (totalSpend / 1e6).toFixed(2) + "M"],
              ["States covered", states.filter(s => s.supplier_count > 0).length + " / 8"],
            ].map(([label, val]) => (
              <div key={label} style={{
                padding: "8px 10px",
                border: "1px solid var(--line)",
                borderRadius: 8,
                background: "var(--panel-2)",
              }}>
                <div style={{
                  fontSize: 10, color: "var(--muted)",
                  textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600,
                }}>
                  {label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: mono, marginTop: 2 }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State table / detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* State list */}
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "0.5fr 1.6fr 0.6fr 0.8fr 1fr 0.8fr",
              padding: "10px 16px",
              fontSize: 10, color: "var(--muted)", fontWeight: 600,
              letterSpacing: 0.3, textTransform: "uppercase",
              borderBottom: "1px solid var(--line)",
              background: "var(--panel-2)",
            }}>
              <span></span>
              <span>State</span>
              <span style={{ textAlign: "right" }}>Suppliers</span>
              <span style={{ textAlign: "right" }}>Monthly t</span>
              <span style={{ textAlign: "right" }}>YTD spend</span>
              <span style={{ textAlign: "right" }}>Avg %LME</span>
            </div>

            {[...states].sort((a, b) => b.monthly_tonnes - a.monthly_tonnes).map(s => (
              <div
                key={s.code}
                onMouseEnter={() => setHover(s.code)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setRoute({ name: "suppliers", filterState: s.code })}
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.5fr 1.6fr 0.6fr 0.8fr 1fr 0.8fr",
                  padding: "10px 16px",
                  alignItems: "center",
                  fontSize: 13,
                  borderBottom: "1px solid var(--line)",
                  background: hover === s.code ? "var(--accent-soft)" : "transparent",
                  cursor: "pointer",
                  transition: "background 120ms",
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: 5,
                  background: stateColor(s.code),
                  color: "#fff", fontSize: 9, fontWeight: 700,
                  display: "grid", placeItems: "center",
                  fontFamily: mono,
                }}>
                  {s.code.slice(0, 2)}
                </span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 12 }}>{s.code}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.name}</div>
                </div>
                <span style={{ textAlign: "right", fontFamily: mono }}>{s.supplier_count}</span>
                <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>
                  {s.monthly_tonnes.toFixed(0)}t
                </span>
                <span style={{ textAlign: "right", fontFamily: mono }}>
                  ${(s.ytd_spend_aud / 1000).toFixed(0)}k
                </span>
                <span style={{ textAlign: "right", fontFamily: mono, color: "var(--accent)" }}>
                  {s.avg_pct_lme}%
                </span>
              </div>
            ))}
          </div>

          {/* Active state suppliers */}
          {activeState && activeSuppliers.length > 0 && (
            <div style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {activeState.name} suppliers
                </div>
                <button
                  onClick={() => setRoute({ name: "suppliers", filterState: hover })}
                  style={{
                    fontSize: 12, color: "var(--accent)",
                    background: "transparent", border: "none",
                    cursor: "pointer", fontFamily: "inherit", padding: 0,
                  }}
                >
                  View all {activeSuppliers.length} →
                </button>
              </div>
              <div style={{ maxHeight: 280, overflow: "auto" }}>
                {activeSuppliers.map(s => (
                  <div
                    key={s.id}
                    onClick={() => setRoute({ name: "supplier", id: s.id })}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto auto",
                      padding: "9px 16px",
                      gap: 12,
                      alignItems: "center",
                      fontSize: 12,
                      borderBottom: "1px solid var(--line)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--panel-2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                    <span style={{
                      padding: "2px 6px", borderRadius: 4,
                      background: "var(--accent-soft)", color: "var(--accent)",
                      fontSize: 10, fontWeight: 600, fontFamily: mono,
                    }}>
                      {s.zone}
                    </span>
                    <span style={{ fontFamily: mono }}>{s.pct_lme}%</span>
                    <span style={{ fontFamily: mono, fontWeight: 600 }}>
                      {fmt.aud(s.landed_aud_t, 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
