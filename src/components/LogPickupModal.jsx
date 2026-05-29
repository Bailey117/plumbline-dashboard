import React from 'react';
import { btnPrimary, btnGhost } from './ui';

export default function LogPickupModal({ open, supplierName, onConfirm, onClose }) {
  if (!open) return null;
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 'min(420px, 90vw)',
        background: 'var(--panel)', border: '1px solid var(--line)',
        borderRadius: 14, padding: '24px', zIndex: 401,
        boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Log pickup</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 20 }}>
          Record a pickup for <strong style={{ color: 'var(--text)' }}>{supplierName}</strong> on {today}?
          This will reset days since last pickup to 0.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={btnGhost} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={() => { onConfirm(); onClose(); }}>Confirm pickup</button>
        </div>
      </div>
    </>
  );
}
