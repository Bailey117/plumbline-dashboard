import React, { useState, useMemo } from 'react';
import { useSuppliers, useMarketData, fmt, useSupplierData } from '../api/hooks';
import { useRoute } from '../context/RouteContext';
import { Sparkline } from '../components/ui';
import { stateColor } from '../theme';
import RateModal from '../components/RateModal';
import { useToast } from '../components/Toast';

const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

export default function RatesPage() {
  const { suppliers } = useSuppliers();
  const { market } = useMarketData();
  const { setRoute } = useRoute();
  const { updateSupplier } = useSupplierData();
  const showToast = useToast();
  const [filter, setFilter] = useState("all");
  const [sortDir, setSortDir] = useState("desc");
  const [bulkRateOpen, setBulkRateOpen] = useState(false);

  const dueSoon = suppliers.filter(s => s.rate_change_due);

  const filtered = useMemo(() => {
    let list = [...suppliers];
    if (filter === "due") list = list.filter(s => s.rate_change_due);
    else if (filter === "high") list = list.filter(s => s.pct_lme >= 80);
    else if (filter === "low") list = list.filter(s => s.pct_lme < 68);
    list.sort((a, b) => sortDir === "desc" ? b.pct_lme - a.pct_lme : a.pct_lme - b.pct_lme);
    return list;
  }, [suppliers, filter, sortDir]);

  const avgPct = suppliers.length ? (suppliers.reduce((a, s) => a + s.pct_lme, 0) / suppliers.length).toFixed(1) : "0";
  const maxPct = suppliers.length ? Math.max(...suppliers.map(s => s.pct_lme)) : 0;
  const minPct = suppliers.length ? Math.min(...suppliers.map(s => s.pct_lme)) : 0;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{
            fontSize: 11, color: "var(--muted)",
            letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600,
          }}>
            Rate management
          </div>
          <h1 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>
            Supplier % of LME rates
          </h1>
        </div>
        <div style={{
          display: "flex", gap: 8,
          fontSize: 12, color: "var(--muted)",
          alignItems: "center",
        }}>
          <span style={{ fontFamily: mono }}>LME today: {fmt.aud(market.lme_pb_aud, 0)}</span>
          <button style={{
            padding: "7px 14px",
            fontSize: 12, fontWeight: 500,
            border: "1px solid var(--text)",
            background: "var(--text)", color: "var(--panel)",
            borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
          }} onClick={() => setBulkRateOpen(true)}>
            Bulk update rates
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10, marginBottom: 16,
      }}>
        {[
          { label: "Average % LME", v: avgPct + "%" },
          { label: "Highest rate", v: maxPct + "%" },
          { label: "Lowest rate", v: minPct + "%" },
          { label: "Reviews due", v: dueSoon.length, warn: dueSoon.length > 0 },
        ].map(({ label, v, warn }) => (
          <div key={label} style={{
            padding: "10px 12px",
            border: "1px solid " + (warn ? "var(--warn)" : "var(--line)"),
            borderRadius: 8,
            background: warn ? "rgba(167,125,36,0.06)" : "var(--panel)",
          }}>
            <div style={{
              fontSize: 10,
              color: warn ? "var(--warn)" : "var(--muted)",
              textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600,
            }}>
              {label}
            </div>
            <div style={{
              fontSize: 18, fontWeight: 600, fontFamily: mono, marginTop: 2,
              color: warn ? "var(--warn)" : "var(--text)",
            }}>
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* Distribution bar */}
      <div style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 600, marginBottom: 12,
          display: "flex", justifyContent: "space-between",
        }}>
          <span>Rate distribution</span>
          <span style={{ color: "var(--muted)", fontWeight: 400, fontFamily: mono }}>
            Range: {minPct}% – {maxPct}%
          </span>
        </div>
        <div style={{ display: "flex", gap: 2, height: 36 }}>
          {(() => {
            const lo = Math.floor((minPct - 1) / 5) * 5;
            const hi = Math.ceil((maxPct + 1) / 5) * 5;
            const step = Math.max(1, Math.round((hi - lo) / 10));
            const buckets = Array.from({ length: 10 }, (_, i) => ({
              min: lo + i * step,
              max: lo + (i + 1) * step,
              count: 0,
            }));
            suppliers.forEach(s => {
              const idx = Math.min(9, Math.floor((s.pct_lme - lo) / step));
              if (idx >= 0 && idx < 10) buckets[idx].count++;
            });
            const maxCount = Math.max(...buckets.map(b => b.count), 1);
            return buckets.map((b, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{
                  flex: 1, width: "100%",
                  background: "var(--accent-soft)",
                  borderRadius: 3,
                  display: "flex", alignItems: "flex-end",
                }}>
                  <div style={{
                    width: "100%",
                    height: b.count > 0 ? Math.max(4, (b.count / maxCount) * 32) + "px" : "0",
                    background: "var(--accent)",
                    borderRadius: 3,
                    transition: "height 300ms",
                  }} />
                </div>
                <div style={{ fontSize: 8, color: "var(--muted)", fontFamily: mono }}>
                  {b.min}%
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        {[
          ["all", "All suppliers"],
          ["due", `Review due (${dueSoon.length})`],
          ["high", "High rates (≥80%)"],
          ["low", "Low rates (<68%)"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              padding: "5px 12px",
              fontSize: 12,
              border: "1px solid " + (filter === k ? "var(--text)" : "var(--line-2)"),
              background: filter === k ? "var(--text)" : "transparent",
              color: filter === k ? "var(--panel)" : "var(--muted)",
              borderRadius: 7,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 500,
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
          style={{
            marginLeft: "auto",
            padding: "5px 12px",
            fontSize: 12,
            border: "1px solid var(--line-2)",
            background: "transparent",
            color: "var(--muted)",
            borderRadius: 7,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {sortDir === "desc" ? "Highest first ↓" : "Lowest first ↑"}
        </button>
      </div>

      <RateModal
        open={bulkRateOpen}
        title="Bulk update rates"
        supplierName={dueSoon.length + ' suppliers due for review'}
        currentPct={+avgPct}
        onSave={(pct) => {
          dueSoon.forEach(s => updateSupplier(s.id, { pct_lme: pct }));
          showToast(`Updated ${dueSoon.length} supplier rate${dueSoon.length !== 1 ? 's' : ''} to ${pct}%`);
        }}
        onClose={() => setBulkRateOpen(false)}
      />

      {/* Rate table */}
      <div style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        overflow: "hidden",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "26px 2fr 0.6fr 0.8fr 1fr 1fr 1fr 1.4fr",
          padding: "10px 16px",
          fontSize: 10, color: "var(--muted)", fontWeight: 600,
          letterSpacing: 0.3, textTransform: "uppercase",
          borderBottom: "1px solid var(--line)",
          background: "var(--panel-2)",
        }}>
          <span></span>
          <span>Supplier</span>
          <span>Zone</span>
          <span style={{ textAlign: "right" }}>% LME</span>
          <span style={{ textAlign: "right" }}>AUD/t</span>
          <span style={{ textAlign: "right" }}>Landed</span>
          <span style={{ textAlign: "center" }}>Trend</span>
          <span>Last set</span>
        </div>

        <div style={{ maxHeight: "calc(100vh - 420px)", overflow: "auto" }}>
          {filtered.map(s => {
            const sc = stateColor(s.state);
            const lastRate = s.rate_history[s.rate_history.length - 1] || { pct: s.pct_lme, month: '—', set_by: '—' };
            const prevRate = s.rate_history.length >= 2 ? s.rate_history[s.rate_history.length - 2] : lastRate;
            const delta = lastRate.pct - prevRate.pct;

            return (
              <div
                key={s.id}
                onClick={() => setRoute({ name: "supplier", id: s.id })}
                style={{
                  display: "grid",
                  gridTemplateColumns: "26px 2fr 0.6fr 0.8fr 1fr 1fr 1fr 1.4fr",
                  padding: "11px 16px",
                  alignItems: "center",
                  fontSize: 13,
                  borderBottom: "1px solid var(--line)",
                  cursor: "pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--panel-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: sc, color: "#fff",
                  fontSize: 8, fontWeight: 600,
                  display: "grid", placeItems: "center",
                  fontFamily: mono,
                }}>
                  {s.state.slice(0, 2)}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                  {s.rate_change_due && (
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      color: "var(--warn)",
                      background: "rgba(167,125,36,0.12)",
                      padding: "1px 5px", borderRadius: 4,
                      textTransform: "uppercase", letterSpacing: 0.3,
                    }}>
                      Due
                    </span>
                  )}
                </div>
                <span>
                  <span style={{
                    padding: "2px 6px", borderRadius: 4,
                    background: "var(--accent-soft)", color: "var(--accent)",
                    fontSize: 10, fontWeight: 600, fontFamily: mono,
                  }}>
                    {s.zone}
                  </span>
                </span>
                <div style={{
                  textAlign: "right", fontFamily: mono, fontWeight: 700,
                  fontSize: 14, display: "flex", alignItems: "baseline",
                  gap: 4, justifyContent: "flex-end",
                }}>
                  <span>{s.pct_lme}%</span>
                  {delta !== 0 && (
                    <span style={{
                      fontSize: 10,
                      color: delta > 0 ? "var(--up)" : "var(--down)",
                    }}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  )}
                </div>
                <span style={{ textAlign: "right", fontFamily: mono }}>
                  {fmt.aud(s.price_aud_t, 0)}
                </span>
                <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>
                  {fmt.aud(s.landed_aud_t, 0)}
                </span>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Sparkline
                    data={s.rate_history.map(r => r.pct)}
                    width={80} height={22}
                    stroke="var(--chart-line)"
                    fill="var(--chart-fill)"
                  />
                </div>
                <span style={{ fontSize: 11, color: "var(--dim)" }}>
                  {lastRate.month} by {lastRate.set_by}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
