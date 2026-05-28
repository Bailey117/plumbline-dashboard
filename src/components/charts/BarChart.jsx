export default function BarChart({ data, width = 600, height = 200, fill, showAvg, avg }) {
  const padL = 40, padR = 12, padT = 12, padB = 24;
  const max = Math.max(...data) * 1.1;
  const bw = (width - padL - padR) / data.length;
  const y = v => padT + (height - padT - padB) - (v / max) * (height - padT - padB);
  const monthLabels = ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"];

  return (
    <svg width={width} height={height} style={{ display: "block", maxWidth: "100%" }}>
      {[0, 0.5, 1].map((t, i) => (
        <line key={i}
          x1={padL} x2={width - padR}
          y1={padT + (height - padT - padB) * (1 - t)}
          y2={padT + (height - padT - padB) * (1 - t)}
          stroke="rgba(0,0,0,0.06)" strokeDasharray="2 3"
        />
      ))}
      {[0, 0.5, 1].map((t, i) => (
        <text key={i}
          x={padL - 6}
          y={padT + (height - padT - padB) * (1 - t) + 3}
          textAnchor="end" fontSize="10" fill="var(--muted)">
          {Math.round(max * t)}
        </text>
      ))}
      {data.map((v, i) => (
        <rect key={i}
          x={padL + i * bw + 2} y={y(v)}
          width={bw - 4}
          height={(height - padT - padB) - (y(v) - padT)}
          fill={fill || "var(--chart-line)"} opacity={0.85}
        />
      ))}
      {monthLabels.slice(0, data.length).map((m, i) => (
        <text key={i}
          x={padL + i * bw + bw / 2} y={height - 8}
          textAnchor="middle" fontSize="10" fill="var(--muted)">
          {m}
        </text>
      ))}
      {showAvg && avg != null && (
        <>
          <line x1={padL} x2={width - padR} y1={y(avg)} y2={y(avg)}
            stroke="var(--accent)" strokeDasharray="4 4" strokeWidth="1.5" />
          <text x={width - padR - 4} y={y(avg) - 4}
            textAnchor="end" fontSize="10" fill="var(--accent)" fontWeight="600">
            avg {avg}t
          </text>
        </>
      )}
    </svg>
  );
}
