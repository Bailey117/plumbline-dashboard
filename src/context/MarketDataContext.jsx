import React, { createContext, useContext, useState } from 'react';
import { market as defaultMarket } from '../api/mockData';

const Ctx = createContext(null);
const KEY = 'plumbline_market_overrides';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

export function MarketDataProvider({ children }) {
  const [overrides, setOverrides] = useState(load);

  const setMarketValue = (field, value, source = 'manual') => {
    setOverrides(prev => {
      const next = {
        ...prev,
        [field]: { value, source, lastUpdated: new Date().toISOString() },
      };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetField = (field) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[field];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetAll = () => {
    setOverrides({});
    localStorage.removeItem(KEY);
  };

  // Merged market: apply overrides on top of defaults
  const market = {
    ...defaultMarket,
    lme_pb_usd: overrides.lme_pb_usd?.value ?? defaultMarket.lme_pb_usd,
    aud_usd: overrides.aud_usd?.value ?? defaultMarket.aud_usd,
    diesel_gate_aud: overrides.diesel_gate_aud?.value ?? defaultMarket.diesel_gate_aud,
    fuel_levy_aud: overrides.fuel_levy_aud?.value ?? defaultMarket.fuel_levy_aud,
  };
  // Recompute derived
  market.lme_pb_aud = market.lme_pb_usd / market.aud_usd;
  // Update asof if any override exists
  if (Object.keys(overrides).length > 0) {
    const latest = Object.values(overrides).reduce((a, b) =>
      (a.lastUpdated || '') > (b.lastUpdated || '') ? a : b, {});
    if (latest.lastUpdated) {
      const d = new Date(latest.lastUpdated);
      market.asof = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
        + ' · ' + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) + ' AEST';
    }
  }

  return (
    <Ctx.Provider value={{ market, overrides, setMarketValue, resetField, resetAll }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMarketDataCtx() { return useContext(Ctx); }
