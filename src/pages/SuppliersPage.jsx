import React, { useState, useMemo } from 'react';
import { useSuppliers, useMarketData, fmt, useDeletedSuppliers, useSupplierData } from '../api/hooks';
import { useRoute } from '../context/RouteContext';
import { SortableHeader, btnPrimary, Sparkline, mono } from '../components/ui';
import { stateColor } from '../theme';
import ConfirmDialog from '../components/ConfirmDialog';
import SupplierFormModal from '../components/SupplierFormModal';

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

const AU_STATES = ["NSW","VIC","QLD","WA","SA","TAS","NT","ACT"];
const ZONES  = ["Z1","Z2","Z3","Z4","Z5"];

function InlineSupplierRow({ s, onClick, cols, checked, onCheck, effectiveZone, effectiveState }) {
  const zone = effectiveZone || s.zone;
  const state = effectiveState || s.state;
  const sinceColor = s.days_since > 45 ? "var(--down)" : s.days_since > 20 ? "var(--warn)" : "var(--up)";
  const sc = stateColor(state);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        padding: "11px 16px",
        alignItems: "center",
        fontSize: 13,
        borderBottom: "1px solid var(--line)",
        cursor: "pointer",
        background: checked ? "var(--accent-soft)" : "transparent",
      }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "var(--panel-2)"; }}
      onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Checkbox cell */}
      <span onClick={e => { e.stopPropagation(); onCheck(); }} style={{ display: "grid", placeItems: "center" }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onCheck}
          onClick={e => e.stopPropagation()}
          style={{ cursor: "pointer", width: 14, height: 14, accentColor: "var(--accent)" }}
        />
      </span>
      {/* Rest of row — navigate on click */}
      <span style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }} onClick={onClick}>
        <span style={{
          width: 22, height: 22, borderRadius: 5,
          background: sc, color: "#fff",
          fontSize: 10, fontWeight: 600,
          display: "grid", placeItems: "center",
          fontFamily: mono,
          flexShrink: 0,
        }}>
          {state.slice(0, 2)}
        </span>
        {s.name}
        {s.isNew && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
            padding: "1px 5px", borderRadius: 4,
            background: "rgba(14,143,94,0.12)", color: "#0E8F5E",
            border: "1px solid rgba(14,143,94,0.2)",
          }}>NEW</span>
        )}
      </span>
      <span style={{ color: "var(--muted)", fontFamily: mono, fontSize: 12 }} onClick={onClick}>{s.site_count}</span>
      <span onClick={onClick}>
        <span style={{
          padding: "2px 7px", borderRadius: 4,
          background: "var(--accent-soft)", color: "var(--accent)",
          fontSize: 11, fontWeight: 600, fontFamily: mono,
        }}>
          {zone}
        </span>
      </span>
      <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }} onClick={onClick}>{s.pct_lme}%</span>
      <span style={{ textAlign: "right", fontFamily: mono }} onClick={onClick}>{fmt.aud(s.price_aud_t, 0)}</span>
      <span style={{ textAlign: "right", fontFamily: mono, color: "var(--muted)" }} onClick={onClick}>{fmt.aud(s.freight_aud_t, 0)}</span>
      <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }} onClick={onClick}>{fmt.aud(s.landed_aud_t, 0)}</span>
      <span style={{ display: "flex", justifyContent: "flex-end" }} onClick={onClick}>
        <Sparkline
          data={(s.price_series || s.volume_12m || []).slice(-30)}
          width={120} height={26}
          stroke="var(--chart-line)"
          fill="var(--chart-fill)"
        />
      </span>
      <span style={{ textAlign: "right", fontFamily: mono, fontSize: 12, color: sinceColor }} onClick={onClick}>
        {s.days_since != null ? s.days_since + "d" : "—"}
      </span>
    </div>
  );
}

export default function SuppliersPage() {
  const { suppliers } = useSuppliers();
  const { market } = useMarketData();
  const { setRoute } = useRoute();
  const { deleteSuppliers } = useDeletedSuppliers();
  const { addSupplier } = useSupplierData();

  const [sortKey, setSortKey] = useState("pct_lme");
  const [sortDir, setSortDir] = useState("desc");
  const [filterState, setFilterState] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [search, setSearch] = useState("");

  // Bulk select state
  const [selected, setSelected] = useState(new Set());
  const [overrides, setOverrides] = useState({});

  // Bulk action dropdowns
  const [bulkZone, setBulkZone] = useState("");
  const [bulkState, setBulkState] = useState("");

  // Delete confirmation dialog
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Add supplier modal
  const [addOpen, setAddOpen] = useState(false);

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const sorted = useMemo(() => {
    let list = [...suppliers];
    if (filterState !== "all") list = list.filter(s => (overrides[s.id]?.state || s.state) === filterState);
    if (filterZone !== "all") list = list.filter(s => (overrides[s.id]?.zone || s.zone) === filterZone);
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
  }, [suppliers, sortKey, sortDir, filterState, filterZone, search, overrides]);

  const allChecked = sorted.length > 0 && sorted.every(s => selected.has(s.id));
  const someChecked = sorted.some(s => selected.has(s.id));

  const toggleAll = () => {
    if (allChecked) {
      setSelected(prev => {
        const next = new Set(prev);
        sorted.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        sorted.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulkZone = (zone) => {
    setOverrides(prev => {
      const next = { ...prev };
      selected.forEach(id => { next[id] = { ...(next[id] || {}), zone }; });
      return next;
    });
    setBulkZone("");
  };

  const applyBulkState = (state) => {
    setOverrides(prev => {
      const next = { ...prev };
      selected.forEach(id => { next[id] = { ...(next[id] || {}), state }; });
      return next;
    });
    setBulkState("");
  };

  const totalMonthly = sorted.reduce((a, s) => a + s.avg_monthly_t, 0);
  const avgLme = sorted.length ? (sorted.reduce((a, s) => a + s.pct_lme, 0) / sorted.length).toFixed(1) : "—";
  const avgLanded = sorted.length ? (sorted.reduce((a, s) => a + s.landed_aud_t, 0) / sorted.length).toFixed(0) : "—";

  // Modify COL_DEFS to add checkbox in header
  const colDefsWithCheckbox = [
    { l: "", w: "26px" },
    ...COL_DEFS.slice(1),
  ];

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
          <button style={btnPrimary} onClick={() => setAddOpen(true)}>+ Add supplier</button>
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
          {["all", ...AU_STATES].map(s => (
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
        position: "relative",
      }}>
        {/* Custom header with checkbox */}
        <div style={{
          display: "grid",
          gridTemplateColumns: COLS,
          padding: "10px 16px",
          fontSize: 10,
          color: "var(--muted)",
          fontWeight: 600,
          letterSpacing: 0.3,
          textTransform: "uppercase",
          borderBottom: "1px solid var(--line)",
          background: "var(--panel-2)",
          alignItems: "center",
        }}>
          <span style={{ display: "grid", placeItems: "center" }}>
            <input
              type="checkbox"
              checked={allChecked}
              ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
              onChange={toggleAll}
              style={{ cursor: "pointer", width: 14, height: 14, accentColor: "var(--accent)" }}
            />
          </span>
          {COL_DEFS.slice(1).map((c, i) => {
            const can = !!c.k;
            const active = c.k === sortKey;
            return (
              <span key={i} style={{
                textAlign: c.num ? "right" : "left",
                cursor: can ? "pointer" : "default",
                color: active ? "var(--text)" : "var(--muted)",
                paddingRight: 6,
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
                justifyContent: c.num ? "flex-end" : "flex-start",
              }} onClick={() => can && handleSort(c.k)}>
                {c.l}
                {active && <span style={{ fontSize: 9 }}>{sortDir === "asc" ? "↑" : "↓"}</span>}
              </span>
            );
          })}
        </div>

        <div style={{ maxHeight: "calc(100vh - 360px)", overflow: "auto" }}>
          {sorted.map(s => (
            <InlineSupplierRow
              key={s.id}
              s={s}
              cols={COLS}
              onClick={() => setRoute({ name: "supplier", id: s.id })}
              checked={selected.has(s.id)}
              onCheck={() => toggleOne(s.id)}
              effectiveZone={overrides[s.id]?.zone}
              effectiveState={overrides[s.id]?.state}
            />
          ))}
          {sorted.length === 0 && (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)" }}>
              No suppliers match the current filters
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          zIndex: 100,
          fontSize: 13,
          whiteSpace: "nowrap",
        }}>
          <span style={{ fontWeight: 600, color: "var(--accent)" }}>
            {selected.size} supplier{selected.size !== 1 ? "s" : ""} selected
          </span>
          <span style={{ width: 1, height: 20, background: "var(--line-2)" }} />

          {/* Change Zone */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Zone:</span>
            <select
              value={bulkZone}
              onChange={e => { if (e.target.value) applyBulkZone(e.target.value); }}
              style={{
                padding: "4px 8px",
                fontSize: 12,
                border: "1px solid var(--line-2)",
                borderRadius: 6,
                background: "var(--panel-2)",
                color: "var(--text)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <option value="">Change Zone ▾</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {/* Change State */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>State:</span>
            <select
              value={bulkState}
              onChange={e => { if (e.target.value) applyBulkState(e.target.value); }}
              style={{
                padding: "4px 8px",
                fontSize: 12,
                border: "1px solid var(--line-2)",
                borderRadius: 6,
                background: "var(--panel-2)",
                color: "var(--text)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <option value="">Change State ▾</option>
              {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <span style={{ width: 1, height: 20, background: "var(--line-2)" }} />
          <button
            onClick={() => setConfirmDelete({ ids: [...selected] })}
            style={{
              padding: "5px 12px",
              fontSize: 12,
              border: "1px solid var(--down)",
              background: "rgba(209,69,69,0.08)",
              color: "var(--down)",
              borderRadius: 7,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 500,
            }}
          >
            Delete ({selected.size})
          </button>
          <span style={{ width: 1, height: 20, background: "var(--line-2)" }} />
          <button
            onClick={() => setSelected(new Set())}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 12,
              color: "var(--muted)",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: "4px 8px",
            }}
          >
            Clear selection
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete suppliers"
        message={`Remove ${confirmDelete?.ids?.length || 0} supplier${(confirmDelete?.ids?.length || 0) !== 1 ? 's' : ''} from the dashboard? This can be undone by restoring them from the supplier detail page.`}
        confirmLabel="Delete"
        confirmStyle="danger"
        onConfirm={() => {
          deleteSuppliers(confirmDelete.ids);
          setSelected(new Set());
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      <SupplierFormModal
        open={addOpen}
        initialData={null}
        onSave={(data) => addSupplier(data)}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
}
