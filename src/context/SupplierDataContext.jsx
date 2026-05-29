import React, { createContext, useContext, useState } from 'react';
import { market as mockMarket, freightAt as staticFreightAt } from '../api/mockData';

const Ctx = createContext(null);
const CUSTOM_KEY = 'plumbline_custom_suppliers';
const OVERRIDES_KEY = 'plumbline_supplier_overrides';

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function makeDefaultSupplier(data) {
  const id = 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const freight = staticFreightAt(data.zone, mockMarket.diesel_gate_aud);
  const price = +(mockMarket.lme_pb_aud * data.pct_lme / 100).toFixed(2);
  const now = new Date();
  const monthLabel = now.toLocaleString('en-AU', { month: 'short', year: '2-digit' });
  return {
    id,
    name: data.name,
    state: data.state,
    zone: data.zone,
    pct_lme: data.pct_lme,
    days_since: null,
    avg_monthly_t: 0,
    price_aud_t: price,
    freight_aud_t: freight,
    landed_aud_t: +(price + freight).toFixed(2),
    price_series: new Array(90).fill(price),
    freight_series: new Array(90).fill(freight),
    volume_12m: new Array(12).fill(0),
    ytd_tonnes: 0,
    ytd_spend_aud: 0,
    contract_expires: null,
    // rate_history needs at least 2 entries so RatesPage delta calc works
    rate_history: [
      { month: monthLabel, pct: data.pct_lme, set_by: 'Manual' },
      { month: monthLabel, pct: data.pct_lme, set_by: 'Manual' },
    ],
    rate_change_due: false,
    sites: [{
      id: id + '-1', name: data.name, short_name: 'Main',
      state: data.state, zone: data.zone,
      monthly_t: 0, days_since: null, contact: 'Site Manager', freight_aud_t: freight,
    }],
    states: [data.state],
    site_count: 1,
    isCustom: true,
  };
}

export function SupplierDataProvider({ children }) {
  const [customSuppliers, setCustomSuppliers] = useState(() => loadJSON(CUSTOM_KEY, []));
  const [overrides, setOverrides] = useState(() => loadJSON(OVERRIDES_KEY, {}));

  const addSupplier = (data) => {
    const s = makeDefaultSupplier(data);
    setCustomSuppliers(prev => {
      const next = [...prev, s];
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
      return next;
    });
    return s.id;
  };

  const updateSupplier = (id, partialData) => {
    setOverrides(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...partialData } };
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
      return next;
    });
    // Also update in customSuppliers if it's a custom supplier
    setCustomSuppliers(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...partialData };
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
      return next;
    });
  };

  const logPickup = (id) => {
    updateSupplier(id, { days_since: 0 });
  };

  return (
    <Ctx.Provider value={{ customSuppliers, overrides, addSupplier, updateSupplier, logPickup }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSupplierData() { return useContext(Ctx); }
