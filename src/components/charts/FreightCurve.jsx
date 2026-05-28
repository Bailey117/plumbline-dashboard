import { freight_zones, freightAt } from '../../api/mockData';

export default function FreightCurve({ diesel }) {
  const W = 560, H = 260, padL = 50, padR = 20, padT = 16, padB = 32;
  const dieselRange = [1.5, 2.6];
  const x = v => padL + (v - dieselRange[0]) / (dieselRange[1] - dieselRange[0]) * (W - padL - padR);
  const allFreights = freight_zones.map(z => freightAt(z.code, dieselRange[1]));
  const maxF = Math.max(...allFreights) * 1.05;
  const y = v => padT + (H - padT - padB) - (v / maxF) * (H - padT - padB);
  const colors = ["#5B5BD6","#0E8F5E","#A77D24","#D14545","#7C3AED"];

  return (
    <svg width={W} height={H} style={{ maxWidth: "100%", display: "block" }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i}
          x1={padL} x2={W - padR}
          y1={padT + (H - padT - padB) * (1 - t)}
          y2={padT + (H - padT - padB) * (1 - t)}
          stroke="rgba(0,0,0,0.06)" strokeDasharray="2 3"
        />
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <text key={i}
          x={padL - 8}
          y={padT + (H - padT - padB) * (1 - t) + 3}
          textAnchor="end" fontSize="10" fill="var(--muted)" fontFamily="inherit">
          ${Math.round(maxF * t)}
        </text>
      ))}
      {[1.5, 1.8, 2.0, 2.2, 2.4, 2.6].map((d, i) => (
        <text key={i} x={x(d)} y={H - 10} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="inherit">
          ${d.toFixed(1)}
        </text>
      ))}
      <line x1={x(diesel)} x2={x(diesel)} y1={padT} y2={H - padB}
        stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x={x(diesel)} y={padT - 4} textAnchor="middle" fontSize="10"
        fill="var(--accent)" fontFamily="inherit" fontWeight="600">
        ${diesel.toFixed(2)}
      </text>
      {freight_zones.map((z, i) => {
        const pts = [];
        for (let d = dieselRange[0]; d <= dieselRange[1] + 0.001; d += 0.05) {
          pts.push(`${x(d).toFixed(1)},${y(freightAt(z.code, d)).toFixed(1)}`);
        }
        const eff = freightAt(z.code, diesel);
        return (
          <g key={z.code}>
            <polyline points={pts.join(" ")} fill="none" stroke={colors[i]} strokeWidth="2" />
            <circle cx={x(diesel)} cy={y(eff)} r="3.5" fill={colors[i]} stroke="#fff" strokeWidth="1.5" />
            <text
              x={W - padR - 4}
              y={y(freightAt(z.code, dieselRange[1])) + 3}
              textAnchor="end" fontSize="11"
              fontFamily="Geist Mono, monospace" fontWeight="600" fill={colors[i]}>
              {z.code}  ${Math.round(eff)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
