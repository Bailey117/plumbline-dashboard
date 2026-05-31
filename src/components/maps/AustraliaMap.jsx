import React from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const AUSTRALIA_GEO = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { code: "WA", name: "Western Australia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [129.0, -14.9], [128.0, -14.7], [125.5, -13.7], [124.0, -14.0],
          [122.5, -14.5], [120.0, -15.5], [118.0, -16.0], [116.0, -16.5],
          [114.5, -19.5], [113.5, -22.0], [113.0, -25.0], [113.0, -28.0],
          [113.0, -31.5], [114.0, -34.5], [114.6, -34.4], [115.7, -33.9],
          [116.0, -34.5], [117.0, -35.0], [118.0, -35.1], [119.0, -34.2],
          [120.0, -33.5], [122.0, -33.8], [124.0, -33.6], [126.5, -33.9],
          [128.5, -33.4], [129.0, -33.9], [129.0, -14.9]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { code: "NT", name: "Northern Territory" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [129.0, -14.9], [130.0, -12.5], [131.5, -11.5], [133.0, -11.0],
          [134.0, -11.5], [135.5, -12.0], [136.5, -12.5], [138.0, -14.0],
          [138.0, -26.0], [129.0, -26.0], [129.0, -14.9]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { code: "SA", name: "South Australia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [129.0, -26.0], [138.0, -26.0], [141.0, -26.0], [141.0, -34.0],
          [141.0, -38.0], [140.4, -38.5], [139.5, -38.5], [138.5, -35.6],
          [137.5, -35.8], [137.5, -36.5], [136.5, -36.5], [136.0, -35.7],
          [135.4, -34.9], [135.4, -35.5], [136.6, -35.6], [137.0, -35.5],
          [134.5, -35.1], [133.5, -35.0], [132.0, -34.2], [130.5, -33.5],
          [128.9, -33.9], [129.0, -26.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { code: "QLD", name: "Queensland" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [138.0, -14.0], [138.5, -12.5], [140.0, -11.0], [141.0, -12.5],
          [142.0, -11.0], [143.0, -11.0], [144.5, -12.0], [145.5, -13.5],
          [146.5, -16.0], [147.5, -17.5], [148.5, -19.5], [149.5, -21.0],
          [150.5, -22.5], [151.0, -24.0], [152.0, -25.0], [153.0, -26.0],
          [153.5, -27.5], [152.5, -28.0], [151.0, -28.5], [149.5, -29.0],
          [148.0, -29.0], [146.0, -29.0], [144.0, -29.0], [141.0, -29.0],
          [141.0, -26.0], [138.0, -26.0], [138.0, -14.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { code: "NSW", name: "New South Wales" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [141.0, -29.0], [144.0, -29.0], [146.0, -29.0], [148.0, -29.0],
          [149.5, -29.0], [151.0, -28.5], [152.5, -28.0], [153.5, -27.5],
          [153.6, -29.0], [153.5, -30.5], [153.0, -31.5], [152.5, -33.0],
          [151.5, -34.0], [150.5, -35.5], [150.0, -36.5], [149.5, -37.5],
          [148.5, -37.8], [147.5, -37.5], [146.5, -37.5], [145.5, -37.2],
          [144.5, -37.0], [143.5, -36.0], [141.0, -34.0], [141.0, -29.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { code: "VIC", name: "Victoria" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [141.0, -34.0], [143.5, -36.0], [144.5, -37.0], [145.5, -37.2],
          [146.5, -37.5], [147.5, -37.5], [148.5, -37.8], [149.5, -37.5],
          [150.0, -38.5], [148.5, -38.8], [147.0, -39.0], [145.5, -38.5],
          [144.5, -38.5], [142.5, -38.5], [141.0, -38.0], [141.0, -34.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { code: "TAS", name: "Tasmania" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [144.5, -40.0], [146.0, -39.6], [147.5, -40.0], [148.3, -41.5],
          [148.0, -43.0], [147.0, -43.6], [145.5, -43.5], [144.5, -42.5],
          [144.0, -41.5], [144.5, -40.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { code: "ACT", name: "Australian Capital Territory" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [148.7, -35.1], [149.4, -35.1], [149.4, -35.9], [148.7, -35.9],
          [148.7, -35.1]
        ]]
      }
    }
  ]
};

const STATE_CENTROIDS = {
  WA:  [121.5, -26.5],
  NT:  [133.5, -20.0],
  SA:  [135.5, -31.0],
  QLD: [145.0, -22.0],
  NSW: [148.0, -33.0],
  VIC: [144.5, -37.2],
  TAS: [146.5, -42.0],
  ACT: [149.1, -35.5],
};

export default function AustraliaMap({ values, palette, stroke, labelColor, bg, getLabel, onHover, highlight, height, onClick }) {
  const entries = Object.values(values || {});
  const vmax = entries.length ? Math.max(...entries) : 1;
  const vmin = entries.length ? Math.min(...entries) : 0;

  function fill(code) {
    if (!values || !(code in values)) return bg || "var(--panel-2)";
    const t = (values[code] - vmin) / Math.max(0.0001, vmax - vmin);
    const idx = Math.min(palette.length - 1, Math.floor(t * (palette.length - 0.001)));
    return palette[idx];
  }

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{ center: [133, -27], scale: 900 }}
      width={800}
      height={550}
      style={{ width: "100%", height: height || "auto" }}
    >
      <Geographies geography={AUSTRALIA_GEO}>
        {({ geographies }) =>
          geographies.map(geo => {
            const code = geo.properties.code;
            const isHighlighted = highlight === code;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={isHighlighted ? (palette?.[palette.length - 1] ?? fill(code)) : fill(code)}
                stroke={stroke || "var(--panel)"}
                strokeWidth={isHighlighted ? 2 : 1}
                style={{
                  default: { outline: "none", cursor: (onHover || onClick) ? "pointer" : "default", transition: "fill 180ms" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
                onMouseEnter={() => onHover?.(code)}
                onMouseLeave={() => onHover?.(null)}
                onClick={() => onClick?.(code)}
              />
            );
          })
        }
      </Geographies>

      {Object.entries(STATE_CENTROIDS).map(([code, coords]) => (
        <Marker key={code} coordinates={coords}>
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: code === "ACT" ? 5 : code === "VIC" || code === "TAS" ? 9 : 11,
              fill: labelColor || "#111",
              fontWeight: 700,
              pointerEvents: "none",
              fontFamily: "inherit",
              letterSpacing: 0.3,
            }}
          >
            {code}
          </text>
          {getLabel && code !== "ACT" && (
            <text
              y={code === "VIC" || code === "TAS" ? 12 : 15}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: code === "VIC" || code === "TAS" ? 7 : 9,
                fill: labelColor || "#111",
                opacity: 0.75,
                pointerEvents: "none",
                fontFamily: "inherit",
              }}
            >
              {getLabel(code)}
            </text>
          )}
        </Marker>
      ))}
    </ComposableMap>
  );
}
