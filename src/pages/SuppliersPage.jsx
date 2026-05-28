import React, { useState, useMemo } from 'react';
import { useSuppliers, useMarketData, fmt } from '../api/hooks';
import { useRoute } from '../context/RouteContext';
import { SortableHeader, SupplierRow, btnPrimary } from '../components/ui';

const COLS = "26px 2.1fr 0.6fr 0.6fr 0.9fr 0.9fr 0.8fr 0.9fr 1.2fr 0.8fr";

const COL_DEFS = [
  { l: "", w: "26px" },
  { l: "Supplier", w: "2.1fr", k: "name" },
  { l: "Sites", w: "0.6fr", k: "site_count", num: true },
  { l: "Zone", w: "0.6fr" },
  { l: "% LME", w: "0.9fr", k: "pct_lme", num: true },
  { l: "AUD/t", w: "0.9fr", k: "price_aud_t", num: true },
  { l: "Freight", w: "0.8fr", k: "freight_aud_t", num: true },
  { l: "Landed", w: "0.9fr", k: "landed_aud_t", num: true },
  { l: "90d trend", w: "1.2fr" },
  { l: "Last pickup", w: "0.8fr", k: "days_since", num: true },
];

const STATES = ["NSW","VIC","QLD","WA","SA","TAS","NT","ACT"];
const ZONES  = ["Z1","Z2","Z3","Z4","Z5"];

export default function SuppliersPage() {
  const { suppliers } = useSuppliers();
  const { market } = useMarketData();
  const { setRoute } = useRoute();

  const [sortKey, setSortKey] = useState("pct_lme");
  const [sortDir, setSortDir] = useState("desc");
  const [filterState, setFilterState] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [search, setSearch] = useState("");

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const sorted = useMemo(() => {
    let list = [...suppliers];
    if (filterState !== "all") list = list.filter(s => s.state === filterState);
    if (filterZone !== "all") list = list.filter(s => s.zone === filterZone);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [suppliers, sortKey, sortDir, filterState, filterZone, search]);

  const totalMonthly = sorted.reduce((a, s) => a + s.avg_monthly_t, 0);
  const avgLme = sorted.length ? (sorted.reduce((a, s) => a + s.pct_lme, 0) / sorted.length).toFixed(1) : "—";
  const avgLanded = sorted.length ? (sorted.reduce((a, s) => a + s.landed_aud_t, 0) / sorted.length).toFixed(0) : "—";

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{
            fontSize: 11, color: "var(--muted)",
            letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600,
          }}>
            Suppliers
          </div>
          <h1 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>
            Current pricing · {suppliers.length} active
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={btnPrimary}>+ Add supplier</button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10, marginBottom: 16,
      }}>
        {[
          ["Showing", sorted.length + " / " + suppliers.length],
          ["Monthly volume", fmt.t(totalMonthly)],
          ["Avg % LME", avgLme + "%"],
          ["Avg landed", fmt.aud(+avgLanded, 0) + "/t"],
        ].map(([label, val]) => (
          <div key={label} style={{
            padding: "10px 12px",
            border: "1px solid var(--line)",
            borderRadius: 8,
            background: "var(--panel)",
          }}>
            <div style={{
              fontSize: 10, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600,
            }}>
              {label}
            </div>
            <div style={{
              fontSize: 18, fontWeight: 600,
              fontFamily: '"Geist Mono", monospace',
              marginTop: 2,
            }}>
              {val}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: "6px 10px",
            border: "1px solid var(--line-2)",
            borderRadius: 7,
            background: "var(--panel)",
            color: "var(--text)",
            fontSize: 12,
            fontFamily: "inherit",
            outline: "none",
            width: 200,
          }}
        />

        {/* State filter */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {["all", ...STATES].map(s => (
            <button
              key={s}
              onClick={() => setFilterState(s)}
              style={{
                padding: "4px 8px",
                fontSize: 11,
                border: "1px solid " + (filterState === s ? "var(--text)" : "var(--line-2)"),
                background: filterState === s ? "var(--text)" : "transparent",
                color: filterState === s ? "var(--panel)" : "var(--muted)",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: '"Geist Mono", monospace',
                fontWeight: 500,
              }}
            >
              {s === "all" ? "All states" : s}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: "var(--line-2)" }} />

        {/* Zone filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {["all", ...ZONES].map(z => (
            <button
              key={z}
              onClick={() => setFilterZone(z)}
              style={{
                padding: "4px 8px",
                fontSize: 11,
                border: "1px solid " + (filterZone === z ? "var(--accent)" : "var(--line-2)"),
                background: filterZone === z ? "var(--accent-soft)" : "transparent",
                color: filterZone === z ? "var(--accent)" : "var(--muted)",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: '"Geist Mono", monospace',
                fontWeight: 500,
              }}
            >
              {z === "all" ? "All zones" : z}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        overflow: "hidden",
      }}>
        <SortableHeader
          cols={COL_DEFS}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
        <div style={{ maxHeight: "calc(100vh - 360px)", overflow: "auto" }}>
          {sorted.map(s => (
            <SupplierRow
              key={s.id}
              s={s}
              cols={COLS}
              onClick={() => setRoute({ name: "supplier", id: s.id })}
            />
          ))}
          {sorted.length === 0 && (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)" }}>
              No suppliers match the current filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
