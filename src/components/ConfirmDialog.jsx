import React from 'react';
import { btnPrimary, btnGhost } from './ui';

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", confirmStyle = "danger", onConfirm, onCancel }) {
  if (!open) return null;
  const dangerBtn = { ...btnPrimary, background: "var(--down)", borderColor: "var(--down)" };
  return (
    <>
      <div onClick={onCancel} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(2px)", zIndex: 400,
      }} />
      <div style={{
        position: "fixed", top: "30%", left: "50%", transform: "translateX(-50%)",
        width: "min(440px, 90vw)",
        background: "var(--panel)", border: "1px solid var(--line)",
        borderRadius: 14, padding: "24px 24px 20px",
        zIndex: 401, boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginBottom: 20 }}>{message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button style={btnGhost} onClick={onCancel}>Cancel</button>
          <button style={confirmStyle === "danger" ? dangerBtn : btnPrimary} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
