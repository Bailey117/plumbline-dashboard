import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const bgColor = (type) => {
    if (type === 'error') return '#C62828';
    if (type === 'warn') return '#A77D24';
    return '#0E8F5E';
  };

  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              padding: '10px 16px',
              background: bgColor(t.type),
              color: '#fff',
              borderRadius: 9,
              fontSize: 13, fontWeight: 500,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              pointerEvents: 'all',
              animation: 'fadeSlideIn 180ms ease',
              fontFamily: 'inherit',
              maxWidth: 340,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }`}</style>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  return ctx || (() => {});
}
