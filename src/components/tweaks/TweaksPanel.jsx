import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ACCENTS } from '../../theme';

const PANEL_STYLE = `
.twk-panel {
  position: fixed; right: 16px; bottom: 16px; z-index: 400;
  width: 272px; max-height: calc(100vh - 32px);
  display: flex; flex-direction: column;
  background: rgba(250,249,247,0.88); color: #29261b;
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  backdrop-filter: blur(24px) saturate(160%);
  border: 0.5px solid rgba(255,255,255,0.6);
  border-radius: 14px;
  box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 40px rgba(0,0,0,0.18);
  font: 11.5px/1.4 ui-sans-serif, system-ui, -apple-system, sans-serif;
  overflow: hidden;
}
.twk-panel.dark-mode {
  background: rgba(22,24,30,0.92); color: #E6E7EA;
  border-color: rgba(255,255,255,0.08);
}
.twk-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 8px 10px 14px; cursor: move; user-select: none;
  border-bottom: 0.5px solid rgba(0,0,0,0.08);
}
.twk-panel.dark-mode .twk-hd { border-bottom-color: rgba(255,255,255,0.08); }
.twk-hd b { font-size: 12px; font-weight: 600; letter-spacing: 0.01em; }
.twk-x {
  appearance: none; border: 0; background: transparent;
  color: rgba(41,38,27,0.55); width: 22px; height: 22px;
  border-radius: 6px; cursor: pointer; font-size: 14px; line-height: 1;
  display: grid; place-items: center;
}
.twk-panel.dark-mode .twk-x { color: rgba(230,231,234,0.55); }
.twk-x:hover { background: rgba(0,0,0,0.07); color: #29261b; }
.twk-panel.dark-mode .twk-x:hover { color: #E6E7EA; }
.twk-body {
  padding: 4px 14px 14px;
  display: flex; flex-direction: column; gap: 12px;
  overflow-y: auto; overflow-x: hidden; min-height: 0;
}
.twk-sect {
  font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
  text-transform: uppercase; color: rgba(41,38,27,0.45);
  padding: 6px 0 0; margin-bottom: -4px;
}
.twk-panel.dark-mode .twk-sect { color: rgba(230,231,234,0.4); }
.twk-row { display: flex; flex-direction: column; gap: 5px; }
.twk-row-h { flex-direction: row; align-items: center; justify-content: space-between; gap: 10px; }
.twk-lbl { font-weight: 500; font-size: 11.5px; }
.twk-seg {
  position: relative; display: flex; padding: 2px; border-radius: 8px;
  background: rgba(0,0,0,0.07); user-select: none;
}
.twk-panel.dark-mode .twk-seg { background: rgba(255,255,255,0.08); }
.twk-seg-thumb {
  position: absolute; top: 2px; bottom: 2px; border-radius: 6px;
  background: rgba(255,255,255,0.92);
  box-shadow: 0 1px 2px rgba(0,0,0,0.14);
  transition: left 0.15s cubic-bezier(0.3,0.7,0.4,1), width 0.15s;
}
.twk-panel.dark-mode .twk-seg-thumb { background: rgba(60,64,80,0.9); }
.twk-seg button {
  appearance: none; position: relative; z-index: 1; flex: 1;
  border: 0; background: transparent; color: inherit; font: inherit;
  font-weight: 500; min-height: 22px; border-radius: 6px;
  cursor: pointer; padding: 3px 6px; line-height: 1.2;
}
.twk-toggle {
  position: relative; width: 32px; height: 18px; border: 0; border-radius: 999px;
  background: rgba(0,0,0,0.15); transition: background 0.15s; cursor: pointer; padding: 0;
  flex-shrink: 0;
}
.twk-toggle[data-on="1"] { background: #34c759; }
.twk-toggle i {
  position: absolute; top: 2px; left: 2px; width: 14px; height: 14px;
  border-radius: 50%; background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.25); transition: transform 0.15s;
  pointer-events: none;
}
.twk-toggle[data-on="1"] i { transform: translateX(14px); }
`;

function ColorSwatch({ color, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      title={color.name}
      style={{
        width: 24, height: 24, borderRadius: 6,
        background: color.solid,
        border: selected ? "2px solid var(--text, #0B0B0F)" : "2px solid transparent",
        outline: selected ? "2px solid white" : "none",
        outlineOffset: -3,
        cursor: "pointer",
        padding: 0,
        transition: "transform 0.1s",
        flexShrink: 0,
      }}
      aria-label={`${color.name} accent`}
      aria-pressed={selected}
    />
  );
}

export default function TweaksPanel({ open, onClose, tweaks, setTweak }) {
  const panelRef = useRef(null);
  const offsetRef = useRef({ x: 16, y: 16 });

  const clampToViewport = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const PAD = 16;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + "px";
    panel.style.bottom = offsetRef.current.y + "px";
  }, []);

  useEffect(() => {
    if (!open) return;
    clampToViewport();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(clampToViewport) : null;
    if (ro) ro.observe(document.documentElement);
    else window.addEventListener("resize", clampToViewport);
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", clampToViewport);
    };
  }, [open, clampToViewport]);

  const onDragStart = (e) => {
    if (e.target.closest(".twk-x")) return;
    const panel = panelRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  if (!open) return null;

  const accentEntries = Object.entries(ACCENTS);

  return (
    <>
      <style>{PANEL_STYLE}</style>
      <div
        ref={panelRef}
        className={`twk-panel${tweaks.dark ? " dark-mode" : ""}`}
        style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}
        role="dialog"
        aria-label="Settings"
      >
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>Settings</b>
          <button className="twk-x" aria-label="Close settings" onClick={onClose}>×</button>
        </div>

        <div className="twk-body">
          {/* Appearance */}
          <div className="twk-sect">Appearance</div>

          {/* Dark mode */}
          <div className="twk-row twk-row-h">
            <span className="twk-lbl">Dark mode</span>
            <button
              type="button"
              className="twk-toggle"
              data-on={tweaks.dark ? "1" : "0"}
              role="switch"
              aria-checked={!!tweaks.dark}
              onClick={() => setTweak("dark", !tweaks.dark)}
            >
              <i />
            </button>
          </div>

          {/* Accent colour */}
          <div className="twk-row">
            <span className="twk-lbl">Accent colour</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
              {accentEntries.map(([key, val]) => (
                <ColorSwatch
                  key={key}
                  color={val}
                  selected={tweaks.accent === key}
                  onClick={() => setTweak("accent", key)}
                />
              ))}
            </div>
          </div>

          {/* Density */}
          <div className="twk-row">
            <span className="twk-lbl">Density</span>
            <div className="twk-seg" style={{ marginTop: 2 }}>
              <div
                className="twk-seg-thumb"
                style={{
                  left: tweaks.density === "comfortable" ? "2px" : "calc(50% + 1px)",
                  width: "calc(50% - 3px)",
                }}
              />
              {["comfortable", "compact"].map(d => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={tweaks.density === d}
                  onClick={() => setTweak("density", d)}
                  style={{ textTransform: "capitalize", fontSize: 11 }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="twk-sect">Charts</div>

          <div className="twk-row">
            <span className="twk-lbl">Chart style</span>
            <div className="twk-seg" style={{ marginTop: 2 }}>
              <div
                className="twk-seg-thumb"
                style={{
                  left: tweaks.chartStyle === "area"
                    ? "2px"
                    : tweaks.chartStyle === "line"
                    ? "calc(33.33% + 1px)"
                    : "calc(66.66% + 1px)",
                  width: "calc(33.33% - 2px)",
                }}
              />
              {["area", "line", "candle"].map(s => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={tweaks.chartStyle === s}
                  onClick={() => setTweak("chartStyle", s)}
                  style={{ textTransform: "capitalize", fontSize: 11 }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
