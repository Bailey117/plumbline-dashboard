export default function LineChart({ data, labels, width, height, stroke, fill, grid, gridColor, axisColor, valueFmt, mode }) {
  width = width || 600; height = height || 220;
  const padL = 48, padR = 12, padT = 16, padB = 26;
  const innerW = width - padL - padR, innerH = height - padT - padB;
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
    <svg width={width} height={height} style={{ display: "block", maxWidth: "100%" }}>
      {grid && yTicks.map((t, i) => (
        <line key={i} x1={padL} x2={width - padR} y1={y(t)} y2={y(t)}
          stroke={gridColor || "rgba(0,0,0,0.06)"} strokeDasharray="2 3" />
      ))}
      {yTicks.map((t, i) => (
        <text key={i} x={padL - 8} y={y(t) + 3} textAnchor="end" fontSize="10"
          fill={axisColor || "#777"} fontFamily="inherit">
          {valueFmt ? valueFmt(t) : t.toFixed(0)}
        </text>
      ))}
      {labels && xTickIdx.map((i, k) => (
        <text key={k} x={x(i)} y={height - 8} textAnchor="middle" fontSize="10"
          fill={axisColor || "#777"} fontFamily="inherit">
          {labels[i]}
        </text>
      ))}
      {mode === "candle" ? (
        candles.map((c, k) => {
          const up = c.c >= c.o;
          const cx = x(c.i);
          return (
            <g key={k}>
              <line x1={cx} x2={cx} y1={y(c.h)} y2={y(c.l)} stroke={up ? "#10B981" : "#EF4444"} strokeWidth="1" />
              <rect
                x={cx - 3} y={Math.min(y(c.o), y(c.c))}
                width="6" height={Math.max(1, Math.abs(y(c.o) - y(c.c)))}
                fill={up ? "#10B981" : "#EF4444"}
              />
            </g>
          );
        })
      ) : (
        <>
          {(mode === "area" || fill) && <path d={areaD} fill={fill || "rgba(99,91,255,0.12)"} />}
          <polyline points={pts} fill="none" stroke={stroke || "#111"} strokeWidth="1.75"
            strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
