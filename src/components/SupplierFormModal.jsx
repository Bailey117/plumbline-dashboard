import React, { useState, useEffect } from 'react';
import { btnPrimary, btnGhost, mono } from './ui';

const AU_STATES = ["NSW","VIC","QLD","WA","SA","TAS","NT","ACT"];
const ZONES = ["Z1","Z2","Z3","Z4","Z5"];

export default function SupplierFormModal({ open, initialData, onSave, onClose }) {
  const [name, setName] = useState('');
  const [state, setState] = useState('NSW');
  const [zone, setZone] = useState('Z2');
  const [pct, setPct] = useState(75);

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || '');
      setState(initialData.state || 'NSW');
      setZone(initialData.zone || 'Z2');
      setPct(initialData.pct_lme || 75);
    } else if (open) {
      setName(''); setState('NSW'); setZone('Z2'); setPct(75);
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), state, zone, pct_lme: pct });
    onClose();
  };

  if (!open) return null;

  const fieldStyle = {
    width: '100%', padding: '8px 10px', fontSize: 13,
    border: '1px solid var(--line-2)', borderRadius: 7,
    background: 'var(--panel-2)', color: 'var(--text)',
    fontFamily: 'inherit', boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(2px)', zIndex: 400,
      }} />
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 'min(480px, 90vw)',
        background: 'var(--panel)', border: '1px solid var(--line)',
        borderRadius: 14, padding: '24px', zIndex: 401,
        boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          {initialData ? 'Edit supplier' : 'Add supplier'}
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                Business name *
              </label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Pacific Battery Co"
                style={fieldStyle}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  State
                </label>
                <select value={state} onChange={e => setState(e.target.value)} style={fieldStyle}>
                  {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Freight zone
                </label>
                <select value={zone} onChange={e => setZone(e.target.value)} style={fieldStyle}>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  % of LME
                </label>
                <span style={{ fontSize: 12, fontFamily: mono, fontWeight: 700 }}>{pct}%</span>
              </div>
              <input type="range" min={55} max={90} step={0.5} value={pct}
                onChange={e => setPct(+e.target.value)} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>
                <span>55%</span><span>90%</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" style={btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" style={btnPrimary}>
              {initialData ? 'Save changes' : 'Add supplier'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
