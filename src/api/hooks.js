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

// ── Market data ─────────────────────────────────────────────────────────────
// Production: replace with useSWR('/api/market', fetcher)
export function useMarketData() {
  return { market: mockMarket, history: mockHistory, loading: false };
}

// ── Suppliers ────────────────────────────────────────────────────────────────
// Production: replace with useSWR('/api/suppliers', fetcher)
export function useSuppliers() {
  return { suppliers: mockSuppliers, loading: false };
}

// Production: replace with useSWR(`/api/suppliers/${id}`, fetcher)
export function useSupplier(id) {
  const supplier = mockSuppliers.find(s => s.id === id) || mockSuppliers[0];
  return { supplier, loading: false };
}

// ── States ───────────────────────────────────────────────────────────────────
// Production: replace with useSWR('/api/states', fetcher)
export function useStates() {
  return { states: mockStates, loading: false };
}

// ── Alerts ───────────────────────────────────────────────────────────────────
// Production: replace with useSWR('/api/alerts', fetcher, { refreshInterval: 30000 })
export function useAlerts() {
  return { alerts: mockAlerts, loading: false };
}

// ── Freight zones ─────────────────────────────────────────────────────────────
// Production: replace with useSWR('/api/freight-zones', fetcher)
export function useFreightZones() {
  return { freight_zones: mockFreightZones, loading: false };
}

// ── Volume & spend daily series ───────────────────────────────────────────────
// Production: replace with useSWR('/api/volume-daily', fetcher)
export function useVolumeData() {
  return { volume_daily: mockVolume, spend_daily: mockSpend, loading: false };
}

// Re-export static helpers so components can import everything from one place
export { fmt, freightAt, STATES, mockMonths as months };
