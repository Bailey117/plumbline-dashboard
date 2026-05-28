// Shared helpers: AU map paths, sparkline/line chart, candlestick renderer.
// All exports attached to window for cross-script access.

(function (global) {
  // ── Simplified Australia state polygons (for choropleth) ──────────────────
  // ViewBox 0 0 600 500. Hand-traced approximate shapes.
  const AU_PATHS = {
    WA:  "M 20,180 L 195,180 L 195,260 L 240,260 L 240,420 L 60,420 L 40,360 L 20,290 Z",
    NT:  "M 195,80 L 320,80 L 320,260 L 195,260 Z",
    SA:  "M 195,260 L 380,260 L 380,330 L 360,420 L 240,420 L 240,260 Z",
    QLD: "M 320,80 L 470,75 L 510,140 L 520,235 L 480,290 L 380,290 L 380,260 L 320,260 Z",
    NSW: "M 380,290 L 480,290 L 510,330 L 500,370 L 415,378 L 380,360 Z",
    VIC: "M 360,378 L 460,378 L 460,418 L 365,420 Z",
    TAS: "M 410,450 L 460,450 L 458,485 L 412,485 Z",
    ACT: "M 432,355 L 446,355 L 446,368 L 432,368 Z",
  };
  const AU_CENTROIDS = {
    WA: [130, 310], NT: [255, 175], SA: [305, 340],
    QLD: [415, 195], NSW: [438, 330], VIC: [410, 400],
    TAS: [435, 467], ACT: [439, 361],
  };

  function AustraliaMap({ values, palette, stroke, labelColor, bg, getLabel, onHover, highlight, height }) {
    const { useMemo } = React;
    const vmax = Math.max(...Object.values(values || {})) || 1;
    const vmin = Math.min(...Object.values(values || {})) || 0;
    function fill(code) {
      if (!values || !(code in values)) return bg || "#EAEAEA";
      const t = (values[code] - vmin) / Math.max(0.0001, vmax - vmin);
      const idx = Math.min(palette.length - 1, Math.floor(t * (palette.length - 0.001)));
      return palette[idx];
    }
    return (
      <svg viewBox="0 0 600 500" style={{ width: "100%", height: height || "auto", display: "block" }}>
        {Object.entries(AU_PATHS).map(([code, d]) => (
          <path
            key={code}
            d={d}
            fill={fill(code)}
            stroke={stroke || "#fff"}
            strokeWidth={highlight === code ? 2 : 1}
            style={{ cursor: onHover ? "pointer" : "default", transition: "fill 180ms" }}
            onMouseEnter={onHover ? () => onHover(code) : undefined}
            onMouseLeave={onHover ? () => onHover(null) : undefined}
          />
        ))}
        {Object.entries(AU_CENTROIDS).map(([code, [x, y]]) => (
          <g key={code} style={{ pointerEvents: "none" }}>
            <text x={x} y={y} textAnchor="middle" fontSize="14" fontWeight="600" fill={labelColor || "#111"} fontFamily="inherit">
              {code}
            </text>
            {getLabel && (
              <text x={x} y={y + 14} textAnchor="middle" fontSize="10" fill={labelColor || "#111"} opacity="0.7" fontFamily="inherit">
                {getLabel(code)}
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  }

  // ── Line / area / candle chart ────────────────────────────────────────────
  function Sparkline({ data, width = 120, height = 36, stroke = "#111", fill, strokeWidth = 1.5 }) {
    if (!data?.length) return null;
    const min = Math.min(...data), max = Math.max(...data);
    const pad = 2;
    const dx = (width - pad * 2) / (data.length - 1 || 1);
    const norm = v => height - pad - ((v - min) / Math.max(0.0001, max - min)) * (height - pad * 2);
    const pts = data.map((v, i) => `${pad + i * dx},${norm(v).toFixed(2)}`).join(" ");
    const areaD = fill
      ? `M${pad},${height - pad} L${pts.split(" ").join(" L")} L${width - pad},${height - pad} Z`
      : null;
    return (
      <svg width={width} height={height} style={{ display: "block" }}>
        {fill && <path d={areaD} fill={fill} />}
        <polyline points={pts} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  function LineChart({ data, labels, width, height, stroke, fill, grid, gridColor, axisColor, yLabel, valueFmt, mode }) {
    // mode = 'line' | 'area' | 'candle'
    width = width || 600; height = height || 220;
    const padL = 48, padR = 12, padT = 16, padB = 26;
    const W = width, H = height;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const min = Math.min(...data), max = Math.max(...data);
    const range = Math.max(0.0001, max - min);
    const yMin = min - range * 0.08, yMax = max + range * 0.08;
    const x = i => padL + (i / (data.length - 1 || 1)) * innerW;
    const y = v => padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
    const ticks = 4;
    const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yMin + (i / ticks) * (yMax - yMin));
    const xTickIdx = [0, Math.floor(data.length / 3), Math.floor((data.length * 2) / 3), data.length - 1];
    const pts = data.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
    const areaD = `M${x(0)},${y(yMin)} L${pts.split(" ").join(" L")} L${x(data.length - 1)},${y(yMin)} Z`;
    // candle synth: group by 5d
    let candles = [];
    if (mode === "candle") {
      const step = 5;
      for (let i = 0; i < data.length; i += step) {
        const chunk = data.slice(i, i + step);
        if (!chunk.length) break;
        candles.push({
          i: i + chunk.length / 2,
          o: chunk[0],
          c: chunk[chunk.length - 1],
          h: Math.max(...chunk),
          l: Math.min(...chunk),
        });
      }
    }
    return (
      <svg width={W} height={H} style={{ display: "block", maxWidth: "100%" }}>
        {grid && yTicks.map((t, i) => (
          <line key={i} x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={gridColor || "rgba(0,0,0,0.06)"} strokeDasharray="2 3" />
        ))}
        {yTicks.map((t, i) => (
          <text key={i} x={padL - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill={axisColor || "#777"} fontFamily="inherit">
            {valueFmt ? valueFmt(t) : t.toFixed(0)}
          </text>
        ))}
        {labels && xTickIdx.map((i, k) => (
          <text key={k} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill={axisColor || "#777"} fontFamily="inherit">
            {labels[i]}
          </text>
        ))}
        {mode === "candle" ? (
          candles.map((c, k) => {
            const up = c.c >= c.o;
            const cx = x(c.i);
            const colUp = "#10B981", colDn = "#EF4444";
            return (
              <g key={k}>
                <line x1={cx} x2={cx} y1={y(c.h)} y2={y(c.l)} stroke={up ? colUp : colDn} strokeWidth="1" />
                <rect
                  x={cx - 3} y={Math.min(y(c.o), y(c.c))}
                  width="6" height={Math.max(1, Math.abs(y(c.o) - y(c.c)))}
                  fill={up ? colUp : colDn}
                />
              </g>
            );
          })
        ) : (
          <>
            {(mode === "area" || fill) && <path d={areaD} fill={fill || "rgba(99,91,255,0.12)"} />}
            <polyline points={pts} fill="none" stroke={stroke || "#111"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
    );
  }

  Object.assign(global, { AustraliaMap, Sparkline, LineChart, AU_PATHS, AU_CENTROIDS });
})(window);
