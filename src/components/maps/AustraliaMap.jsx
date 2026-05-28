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

export default function AustraliaMap({ values, palette, stroke, labelColor, bg, getLabel, onHover, highlight, height }) {
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
          <text x={x} y={y} textAnchor="middle" fontSize="14" fontWeight="600"
            fill={labelColor || "#111"} fontFamily="inherit">
            {code}
          </text>
          {getLabel && (
            <text x={x} y={y + 14} textAnchor="middle" fontSize="10"
              fill={labelColor || "#111"} opacity="0.7" fontFamily="inherit">
              {getLabel(code)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
