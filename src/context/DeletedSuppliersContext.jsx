import React, { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);
const KEY = 'plumbline_deleted_suppliers';

function load() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); }
  catch { return new Set(); }
}

export function DeletedSuppliersProvider({ children }) {
  const [deletedIds, setDeletedIds] = useState(load);

  const deleteSuppliers = (ids) => {
    const arr = Array.isArray(ids) ? ids : [ids];
    setDeletedIds(prev => {
      const next = new Set([...prev, ...arr]);
      localStorage.setItem(KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const restoreSupplier = (id) => {
    setDeletedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem(KEY, JSON.stringify([...next]));
      return next;
    });
  };

  return <Ctx.Provider value={{ deletedIds, deleteSuppliers, restoreSupplier }}>{children}</Ctx.Provider>;
}

export function useDeletedSuppliers() { return useContext(Ctx); }
