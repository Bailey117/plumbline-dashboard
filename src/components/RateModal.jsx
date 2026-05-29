import React, { useState } from 'react';
import { btnPrimary, btnGhost, mono } from './ui';

export default function RateModal({ open, title, supplierName, currentPct, onSave, onClose }) {
  const [pct, setPct] = useState(currentPct || 75);

  React.useEffect(() => { if (open) setPct(currentPct || 75); }, [open, currentPct]);

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', top: '28%', left: '50%', transform: 'translateX(-50%)',
        width: 'min(420px, 90vw)',
        background: 'var(--panel)', border: '1px solid var(--line)',
        borderRadius: 14, padding: '24px', zIndex: 401,
        boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{title}</div>
        {supplierName && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>{supplierName}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>New % of LME</span>
          <span style={{ fontSize: 20, fontFamily: mono, fontWeight: 700, color: 'var(--accent)' }}>{pct.toFixed(1)}%</span>
        </div>
        <input type="range" min={55} max={90} step={0.5} value={pct}
          onChange={e => setPct(+e.target.value)} style={{ width: '100%', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={btnGhost} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={() => { onSave(pct); onClose(); }}>Apply rate</button>
        </div>
      </div>
    </>
  );
}
