export default function Sparkline({ data, width = 120, height = 36, stroke = "#111", fill, strokeWidth = 1.5 }) {
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
