import React, { useState } from 'react';
import { useMarketData, fmt } from '../api/hooks';
import { useFreightZones } from '../context/FreightZonesContext';
import FreightCurve from '../components/charts/FreightCurve';
import { useToast } from '../components/Toast';

const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';
const ZONE_COLORS = ["#5B5BD6","#0E8F5E","#A77D24","#D14545","#7C3AED"];

export default function FreightPage() {
  const { market } = useMarketData();
  const { zones: freight_zones, updateZone, resetZones } = useFreightZones();
  const showToast = useToast();
  const [diesel, setDiesel] = useState(market.diesel_gate_aud);
  const [lme, setLme] = useState(market.lme_pb_aud);
  const [pct, setPct] = useState(76);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState({});

  const leadPrice = lme * pct / 100;

  // Local freight calculation using current zones
  const freightAtLocal = (zoneCode, dieselPrice) => {
    const z = freight_zones.find(x => x.code === zoneCode);
    if (!z) return 0;
    const factor = 1 + ((dieselPrice - 1.80) / 1.80) * 0.42;
    return +(z.base * factor).toFixed(2);
  };

  const startEdit = () => {
    const initial = {};
    freight_zones.forEach(z => {
      initial[z.code] = { base: z.base, name: z.name };
    });
    setEditValues(initial);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditValues({});
    setEditMode(false);
  };

  const saveEdits = () => {
    Object.entries(editValues).forEach(([code, vals]) => {
      updateZone(code, {
        base: Number(vals.base),
        name: vals.name,
      });
    });
    setEditMode(false);
    setEditValues({});
    showToast('Freight zones saved');
  };

  const handleReset = () => {
    resetZones();
    setEditMode(false);
    setEditValues({});
    showToast('Zones reset to defaults', 'warn');
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 11, color: "var(--muted)",
          letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600,
        }}>
          Freight & logistics
        </div>
        <h1 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>
          Freight cost calculator
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Left: freight curve chart */}
        <div>
          {/* Chart card */}
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 16,
          }}>
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Freight by zone vs diesel price</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  AU$/tonne · 42% diesel sensitivity
                </div>
              </div>
              <div style={{ fontSize: 12, fontFamily: mono, color: "var(--muted)" }}>
                Current: ${diesel.toFixed(3)}/L
              </div>
            </div>
            <div style={{ padding: "16px 16px 8px", overflowX: "auto" }}>
              <FreightCurve diesel={diesel} />
            </div>
            {/* Zone legend */}
            <div style={{
              padding: "8px 16px 14px",
              display: "flex", gap: 16, flexWrap: "wrap",
            }}>
              {freight_zones.map((z, i) => (
                <div key={z.code} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 10, height: 3, borderRadius: 2,
                    background: ZONE_COLORS[i],
                    display: "inline-block",
                  }} />
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    {z.code} · {z.name}
                  </span>
                  <span style={{
                    fontSize: 11, fontFamily: mono, fontWeight: 600,
                    color: ZONE_COLORS[i],
                  }}>
                    ${Math.round(freightAtLocal(z.code, diesel))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Zone table */}
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--line)",
              fontSize: 13, fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span>Zone freight at current diesel</span>
              <div style={{ display: "flex", gap: 8 }}>
                {editMode ? (
                  <>
                    <button
                      onClick={saveEdits}
                      style={{
                        padding: "5px 12px", fontSize: 12, fontWeight: 600,
                        border: "1px solid var(--text)", background: "var(--text)",
                        color: "var(--panel)", borderRadius: 6, cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Save changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        padding: "5px 12px", fontSize: 12,
                        border: "1px solid var(--line-2)", background: "transparent",
                        color: "var(--muted)", borderRadius: 6, cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      style={{
                        padding: "5px 12px", fontSize: 12,
                        border: "1px solid rgba(209,69,69,0.3)", background: "transparent",
                        color: "var(--down)", borderRadius: 6, cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Reset to defaults
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEdit}
                    style={{
                      padding: "5px 12px", fontSize: 12,
                      border: "1px solid var(--line-2)", background: "transparent",
                      color: "var(--muted)", borderRadius: 6, cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Edit zones
                  </button>
                )}
              </div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: editMode ? "0.5fr 2fr 1fr 1fr 1fr" : "0.5fr 2fr 1fr 1fr 1fr",
              padding: "8px 16px",
              fontSize: 10, color: "var(--muted)", fontWeight: 600,
              letterSpacing: 0.3, textTransform: "uppercase",
              borderBottom: "1px solid var(--line)",
              background: "var(--panel-2)",
            }}>
              <span>Zone</span>
              <span>Name</span>
              <span style={{ textAlign: "right" }}>Base rate</span>
              <span style={{ textAlign: "right" }}>At ${diesel.toFixed(2)}/L</span>
              <span style={{ textAlign: "right" }}>States</span>
            </div>
            {freight_zones.map((z, i) => {
              const eff = freightAtLocal(z.code, diesel);
              const base = freightAtLocal(z.code, 1.80);
              const delta = eff - base;
              const ev = editValues[z.code] || { base: z.base, name: z.name };
              return (
                <div
                  key={z.code}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.5fr 2fr 1fr 1fr 1fr",
                    padding: "11px 16px",
                    alignItems: "center",
                    fontSize: 13,
                    borderBottom: "1px solid var(--line)",
                    background: editMode ? "var(--panel-2)" : "transparent",
                  }}
                >
                  <span style={{
                    padding: "2px 7px", borderRadius: 4,
                    background: ZONE_COLORS[i] + "20",
                    color: ZONE_COLORS[i],
                    fontSize: 11, fontWeight: 700, fontFamily: mono,
                    display: "inline-block", width: "fit-content",
                  }}>
                    {z.code}
                  </span>

                  {/* Name cell */}
                  {editMode ? (
                    <input
                      value={ev.name}
                      onChange={e => setEditValues(prev => ({
                        ...prev,
                        [z.code]: { ...ev, name: e.target.value },
                      }))}
                      style={{
                        fontSize: 12, padding: "4px 8px",
                        border: "1px solid var(--line-2)",
                        borderRadius: 5, background: "var(--panel)",
                        color: "var(--text)", fontFamily: "inherit",
                        width: "90%",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 12 }}>{z.name}</span>
                  )}

                  {/* Base rate cell */}
                  {editMode ? (
                    <div style={{ textAlign: "right" }}>
                      <input
                        type="number"
                        value={ev.base}
                        min={1}
                        max={999}
                        onChange={e => setEditValues(prev => ({
                          ...prev,
                          [z.code]: { ...ev, base: e.target.value },
                        }))}
                        style={{
                          fontSize: 12, padding: "4px 8px",
                          border: "1px solid var(--line-2)",
                          borderRadius: 5, background: "var(--panel)",
                          color: "var(--text)", fontFamily: mono,
                          width: 70, textAlign: "right",
                        }}
                      />
                    </div>
                  ) : (
                    <span style={{ textAlign: "right", fontFamily: mono, color: "var(--muted)" }}>
                      ${z.base}
                    </span>
                  )}

                  <div style={{ textAlign: "right", fontFamily: mono }}>
                    <span style={{ fontWeight: 600 }}>${Math.round(eff)}</span>
                    {delta !== 0 && (
                      <span style={{
                        fontSize: 10, marginLeft: 4,
                        color: delta > 0 ? "var(--down)" : "var(--up)",
                      }}>
                        {delta > 0 ? "+" : ""}{Math.round(delta)}
                      </span>
                    )}
                  </div>
                  <div style={{
                    textAlign: "right", fontSize: 10,
                    color: "var(--muted)",
                    display: "flex", justifyContent: "flex-end", gap: 3, flexWrap: "wrap",
                  }}>
                    {z.states.map(s => (
                      <span key={s} style={{
                        background: "var(--panel-2)",
                        border: "1px solid var(--line-2)",
                        borderRadius: 3, padding: "1px 4px",
                        fontSize: 9, fontFamily: mono,
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: calculator */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              Landed cost calculator
            </div>

            {[
              {
                label: "Diesel TGP (AUD/L)",
                v: diesel, min: 1.50, max: 2.60, step: 0.001,
                set: setDiesel, fmtFn: v => "$" + v.toFixed(3),
              },
              {
                label: "LME Lead (AUD/t)",
                v: lme, min: 2500, max: 4000, step: 10,
                set: setLme, fmtFn: v => "$" + Math.round(v).toLocaleString(),
              },
              {
                label: "% of LME",
                v: pct, min: 55, max: 90, step: 0.5,
                set: setPct, fmtFn: v => v.toFixed(1) + "%",
              },
            ].map(({ label, v, min, max, step, set, fmtFn }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 11, marginBottom: 4,
                }}>
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span style={{ fontFamily: mono, fontWeight: 600 }}>{fmtFn(v)}</span>
                </div>
                <input
                  type="range" min={min} max={max} step={step}
                  value={v}
                  onChange={e => set(+e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            ))}

            {/* Result grid */}
            <div style={{
              background: "var(--panel-2)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "12px 14px",
              marginTop: 4,
            }}>
              <div style={{
                fontSize: 10, color: "var(--muted)",
                textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600,
                marginBottom: 10,
              }}>
                Landed cost by zone
              </div>
              {freight_zones.map((z, i) => {
                const freight = freightAtLocal(z.code, diesel);
                const landed = leadPrice + freight;
                return (
                  <div key={z.code} style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 8, alignItems: "center",
                    padding: "5px 0",
                    borderBottom: i < freight_zones.length - 1 ? "1px solid var(--line)" : "none",
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, fontFamily: mono,
                      color: ZONE_COLORS[i],
                      minWidth: 24,
                    }}>
                      {z.code}
                    </span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: mono }}>
                        {fmt.aud(landed, 0)}/t
                      </div>
                      <div style={{ fontSize: 10, color: "var(--dim)", fontFamily: mono }}>
                        {fmt.aud(leadPrice, 0)} + ${Math.round(freight)} freight
                      </div>
                    </div>
                    <div style={{
                      fontSize: 12, fontFamily: mono,
                      color: "var(--muted)",
                      textAlign: "right",
                    }}>
                      ${Math.round(freight)}/t
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current market inputs */}
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 14,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, marginBottom: 10,
              color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: 0.4,
            }}>
              Live market inputs
            </div>
            {[
              ["LME Lead AUD/t", fmt.aud(market.lme_pb_aud, 0)],
              ["AUD/USD", market.aud_usd.toFixed(4)],
              ["Diesel TGP", "$" + market.diesel_gate_aud.toFixed(3) + "/L"],
              ["Fuel levy", "$" + market.fuel_levy_aud.toFixed(3) + "/L"],
            ].map(([label, val]) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "baseline",
                padding: "5px 0",
                borderBottom: "1px dotted var(--line)",
                fontSize: 12,
              }}>
                <span style={{ color: "var(--muted)" }}>{label}</span>
                <span style={{ fontFamily: mono, fontWeight: 600 }}>{val}</span>
              </div>
            ))}
            <button
              onClick={() => {
                setDiesel(market.diesel_gate_aud);
                setLme(market.lme_pb_aud);
              }}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "7px",
                fontSize: 12,
                border: "1px solid var(--line-2)",
                background: "transparent",
                color: "var(--muted)",
                borderRadius: 7,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Reset to live values
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
