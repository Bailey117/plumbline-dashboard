import { useContext } from 'react';
import {
  market as mockMarket,
  history as mockHistory,
  suppliers as mockSuppliers,
  states as mockStates,
  alerts as mockAlerts,
  volume_daily as mockVolume,
  spend_daily as mockSpend,
  freight_zones as mockFreightZones,
  months as mockMonths,
  fmt,
  freightAt,
  STATES,
} from './mockData';
import { ImportDataContext } from '../context/ImportDataContext';
import { useFreightZones as useFreightZonesCtx } from '../context/FreightZonesContext';

// Match SAP supplier name to dashboard supplier name (case-insensitive substring)
function matchSupplier(dashboardSupplier, sapName) {
  const dName = dashboardSupplier.name.toLowerCase();
  const sName = sapName.toLowerCase();
  return dName.includes(sName) || sName.includes(dName);
}

// Merge SAP stats into a supplier object
function mergeSupplierData(supplier, sapStats) {
  const merged = { ...supplier };

  let match = null;
  for (const stat of sapStats) {
    if (matchSupplier(supplier, stat.name)) {
      match = stat;
      break;
    }
  }

  if (!match) return merged;

  if (match.daysSince !== null) {
    merged.days_since = match.daysSince;
  }
  if (match.avgMonthly !== null && match.avgMonthly > 0) {
    merged.avg_monthly_t = match.avgMonthly;
  }
  if (match.volume12m) {
    merged.volume_12m = match.volume12m;
  }
  if (match.ytdTonnes !== undefined) {
    merged.ytd_tonnes = match.ytdTonnes;
  }
  if (match.ytdSpend !== undefined) {
    merged.ytd_spend_aud = match.ytdSpend;
  }
  if (match.latestNetPrice !== null) {
    merged.price_aud_t = match.latestNetPrice;
    merged.landed_aud_t = +(match.latestNetPrice + (supplier.freight_aud_t || 0)).toFixed(2);
  }

  return merged;
}

function useImportState() {
  // Gracefully handle case where context isn't available
  try {
    const ctx = useContext(ImportDataContext);
    return ctx ? ctx.importState : null;
  } catch {
    return null;
  }
}

// ── Market data ─────────────────────────────────────────────────────────────
export function useMarketData() {
  return { market: mockMarket, history: mockHistory, loading: false };
}

// ── Suppliers ────────────────────────────────────────────────────────────────
export function useSuppliers() {
  const importState = useImportState();

  if (!importState || !importState.supplierStats) {
    return { suppliers: mockSuppliers, loading: false };
  }

  const merged = mockSuppliers.map(s => mergeSupplierData(s, importState.supplierStats));

  // Append synthetic suppliers created from unmatched SAP records
  const newSuppliers = (importState.newSuppliers || []).map(stat => ({
    id: "sap_" + stat.code,
    name: stat.name,
    code: stat.code,
    state: "NSW",
    zone: "Z1",
    pct_lme: 75,
    avg_monthly_t: stat.avgMonthly || 0,
    ytd_tonnes: stat.ytdTonnes || 0,
    ytd_spend_aud: stat.ytdSpend || 0,
    days_since: stat.daysSince,
    price_aud_t: stat.latestNetPrice || 0,
    freight_aud_t: 52,
    landed_aud_t: (stat.latestNetPrice || 0) + 52,
    volume_12m: stat.volume12m || new Array(12).fill(0),
    price_series: stat.volume12m || new Array(12).fill(0),
    site_count: 1,
    isNew: true,
  }));

  return { suppliers: [...merged, ...newSuppliers], loading: false };
}

export function useSupplier(id) {
  const importState = useImportState();
  const baseSupplier = mockSuppliers.find(s => s.id === id) || mockSuppliers[0];

  if (!importState || !importState.supplierStats) {
    return { supplier: baseSupplier, loading: false };
  }

  const supplier = mergeSupplierData(baseSupplier, importState.supplierStats);
  return { supplier, loading: false };
}

// ── States ───────────────────────────────────────────────────────────────────
export function useStates() {
  return { states: mockStates, loading: false };
}

// ── Alerts ───────────────────────────────────────────────────────────────────
export function useAlerts() {
  return { alerts: mockAlerts, loading: false };
}

// ── Freight zones ─────────────────────────────────────────────────────────────
export function useFreightZones() {
  const ctx = useFreightZonesCtx();
  return { freight_zones: ctx ? ctx.zones : mockFreightZones, loading: false };
}

// ── Volume & spend daily series ───────────────────────────────────────────────
export function useVolumeData() {
  return { volume_daily: mockVolume, spend_daily: mockSpend, loading: false };
}

// Re-export static helpers so components can import everything from one place
export { fmt, freightAt, STATES, mockMonths as months };
