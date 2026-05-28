import React, { createContext, useContext, useState } from 'react';
import { freight_zones as defaultZones } from '../api/mockData';

const FreightZonesContext = createContext(null);
const STORAGE_KEY = 'plumbline_freight_zones';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function FreightZonesProvider({ children }) {
  const [zones, setZones] = useState(() => load() || defaultZones);

  const updateZone = (code, updates) => {
    setZones(prev => {
      const next = prev.map(z => z.code === code ? { ...z, ...updates } : z);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetZones = () => {
    setZones(defaultZones);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <FreightZonesContext.Provider value={{ zones, updateZone, resetZones }}>
      {children}
    </FreightZonesContext.Provider>
  );
}

export function useFreightZones() {
  return useContext(FreightZonesContext);
}
