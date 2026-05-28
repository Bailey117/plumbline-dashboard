import React, { createContext, useContext, useState, useEffect } from 'react';

export const ImportDataContext = createContext(null);

const STORAGE_KEY = 'plumbline_sap_import';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Restore Date objects in supplierStats
    if (parsed && parsed.supplierStats) {
      parsed.supplierStats = parsed.supplierStats.map(s => ({
        ...s,
        lastPickup: s.lastPickup ? new Date(s.lastPickup) : null,
      }));
    }
    if (parsed && parsed.appliedAt) {
      parsed.appliedAt = new Date(parsed.appliedAt);
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function ImportDataProvider({ children }) {
  const [importState, setImportState] = useState(() => loadFromStorage());

  const applyImport = (supplierStats, fileInfo) => {
    const state = {
      supplierStats,
      fileInfo,
      appliedAt: new Date(),
    };
    setImportState(state);
    saveToStorage(state);
  };

  const clearImport = () => {
    setImportState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <ImportDataContext.Provider value={{ importState, applyImport, clearImport }}>
      {children}
    </ImportDataContext.Provider>
  );
}

export function useImportData() {
  const ctx = useContext(ImportDataContext);
  if (!ctx) throw new Error('useImportData must be used inside <ImportDataProvider>');
  return ctx;
}
