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
  freightAt as staticFreightAt,
  STATES,
} from './mockData';
import { ImportDataContext } from '../context/ImportDataContext';
import { useFreightZones as useFreightZonesCtx } from '../context/FreightZonesContext';
import { useDeletedSuppliers as useDeletedSuppliersCtx } from '../context/DeletedSuppliersContext';
import { useSupplierData as useSupplierDataCtx } from '../context/SupplierDataContext';

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

// Apply per-supplier overrides and recompute derived fields if needed
function applyOverrides(s, overrides) {
  const ov = overrides[s.id];
  if (!ov) return s;
  const merged = { ...s, ...ov };
  // Recompute derived fields if pct_lme or zone changed
  if (ov.pct_lme !== undefined || ov.zone !== undefined) {
    const pct = merged.pct_lme;
    const lme = mockMarket.lme_pb_aud;
    merged.price_aud_t = +(lme * pct / 100).toFixed(2);
    merged.freight_aud_t = staticFreightAt(merged.zone, mockMarket.diesel_gate_aud);
    merged.landed_aud_t = +(merged.price_aud_t + merged.freight_aud_t).toFixed(2);
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
  const { deletedIds } = useDeletedSuppliersCtx() || { deletedIds: new Set() };
  const { customSuppliers, overrides } = useSupplierDataCtx() || { customSuppliers: [], overrides: {} };

  // Base: mock suppliers merged with SAP import data
  let base = mockSuppliers;
  if (importState?.supplierStats) {
    base = mockSuppliers.map(s => mergeSupplierData(s, importState.supplierStats));
  }

  // Apply overrides
  base = base.map(s => applyOverrides(s, overrides));

  // Filter deleted
  base = base.filter(s => !deletedIds.has(s.id));

  // Append SAP-created new suppliers (filtered by deleted)
  const newSAPSuppliers = (importState?.newSuppliers || [])
    .filter(stat => !deletedIds.has('sap_' + stat.code))
    .map(stat => ({
      id: 'sap_' + stat.code,
      name: stat.name,
      code: stat.code,
      state: 'NSW',
      zone: 'Z1',
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
      rate_history: [{ month: 'Now', pct: 75, set_by: 'SAP Import' }, { month: 'Now', pct: 75, set_by: 'SAP Import' }],
      rate_change_due: false,
      isNew: true,
    }));

  // Append custom suppliers (filtered by deleted)
  const filteredCustom = customSuppliers
    .filter(s => !deletedIds.has(s.id))
    .map(s => applyOverrides(s, overrides));

  return { suppliers: [...base, ...newSAPSuppliers, ...filteredCustom], loading: false };
}

export function useSupplier(id) {
  const importState = useImportState();
  const { deletedIds } = useDeletedSuppliersCtx() || { deletedIds: new Set() };
  const { customSuppliers, overrides } = useSupplierDataCtx() || { customSuppliers: [], overrides: {} };

  if (deletedIds.has(id)) {
    const name = mockSuppliers.find(s => s.id === id)?.name || customSuppliers.find(s => s.id === id)?.name;
    return { supplier: { id, name }, isDeleted: true, loading: false };
  }

  // Check custom suppliers
  const customMatch = customSuppliers.find(s => s.id === id);
  if (customMatch) {
    return { supplier: applyOverrides(customMatch, overrides), isDeleted: false, loading: false };
  }

  const baseSupplier = mockSuppliers.find(s => s.id === id) || mockSuppliers[0];
  let supplier = baseSupplier;
  if (importState?.supplierStats) {
    supplier = mergeSupplierData(baseSupplier, importState.supplierStats);
  }
  supplier = applyOverrides(supplier, overrides);
  return { supplier, isDeleted: false, loading: false };
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

// Re-export context hooks for convenience
export const useDeletedSuppliers = useDeletedSuppliersCtx;
export const useSupplierData = useSupplierDataCtx;
