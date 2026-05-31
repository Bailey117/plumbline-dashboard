import React, { useState } from 'react';
import { useSuppliers, useMarketData, useVolumeData, fmt } from '../api/hooks';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';

const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

export default function ReportsPage() {
  const { suppliers } = useSuppliers();
  const { market, history } = useMarketData();
  const { volume_daily, spend_daily } = useVolumeData();
  const [reportTab, setReportTab] = useState("market");

  const handleExportCSV = () => {
    const headers = ['Supplier', 'State', 'Zone', '% LME', 'AUD/t', 'Freight', 'Landed', 'YTD Tonnes', 'YTD Spend', 'Contract Expires'];
    const rows = [...suppliers].sort((a, b) => b.ytd_spend_aud - a.ytd_spend_aud).map(s => [
      s.name, s.state, s.zone, s.pct_lme, s.price_aud_t.toFixed(2),
      s.freight_aud_t.toFixed(2), s.landed_aud_t.toFixed(2),
      s.ytd_tonnes.toFixed(1), s.ytd_spend_aud, s.contract_expires || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plumbline-suppliers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const totalYtdSpend = suppliers.reduce((a, s) => a + s.ytd_spend_aud, 0);
  const totalYtdTonnes = suppliers.reduce((a, s) => a + s.ytd_tonnes, 0);
  const avgLanded = suppliers.reduce((a, s) => a + s.landed_aud_t, 0) / suppliers.length;

  // Top 5 by spend
  const top5 = [...suppliers].sort((a, b) => b.ytd_spend_aud - a.ytd_spend_aud).slice(0, 5);

  // Volume by month (aggregate 12m)
  const monthlyVolume = Array.from({ length: 12 }, (_, m) => {
    return suppliers.reduce((a, s) => a + s.volume_12m[m], 0);
  });

  const tabs = [
    { key: "market", label: "Market trends" },
    { key: "volume", label: "Volume" },
    { key: "spend", label: "Spend" },
    { key: "suppliers", label: "Supplier summary" },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{
            fontSize: 11, color: "var(--muted)",
            letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600,
          }}>
            Analytics
          </div>
          <h1 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>
            Reports
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleExportCSV}
            style={{
              padding: "7px 14px", fontSize: 12, fontWeight: 500,
              border: "1px solid var(--line-2)",
              background: "var(--panel)", color: "var(--text)",
              borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: "7px 14px", fontSize: 12, fontWeight: 500,
              border: "1px solid var(--text)",
              background: "var(--text)", color: "var(--panel)",
              borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI summary */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10, marginBottom: 16,
      }}>
        {[
          { label: "YTD Spend", v: "$" + (totalYtdSpend / 1e6).toFixed(2) + "M" },
          { label: "YTD Volume", v: Math.round(totalYtdTonnes).toLocaleString() + " t" },
          { label: "Avg Landed Cost", v: fmt.aud(avgLanded, 0) + "/t" },
          { label: "Active Suppliers", v: suppliers.length },
        ].map(({ label, v }) => (
          <div key={label} style={{
            padding: "10px 12px",
            border: "1px solid var(--line)",
            borderRadius: 8,
            background: "var(--panel)",
          }}>
            <div style={{
              fontSize: 10, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600,
            }}>
              {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: mono, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 14,
        borderBottom: "1px solid var(--line)",
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setReportTab(t.key)}
            style={{
              padding: "8px 14px",
              border: "none",
              background: "transparent",
              color: reportTab === t.key ? "var(--text)" : "var(--muted)",
              fontWeight: reportTab === t.key ? 600 : 500,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              borderBottom: reportTab === t.key ? "2px solid var(--text)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {reportTab === "market" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            {
              title: "LME Lead · AUD/t",
              data: history.lme_pb_aud,
              valueFmt: v => "$" + Math.round(v).toLocaleString(),
            },
            {
              title: "AUD/USD rate",
              data: history.aud_usd,
              valueFmt: v => v.toFixed(4),
            },
            {
              title: "Diesel TGP · AUD/L",
              data: history.diesel,
              valueFmt: v => "$" + v.toFixed(3),
            },
            {
              title: "LME Lead · USD/t",
              data: history.lme_pb_usd,
              valueFmt: v => "US$" + Math.round(v).toLocaleString(),
            },
          ].map(({ title, data, valueFmt }) => (
            <div key={title} style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              overflow: "hidden",
            }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>90-day history</div>
              </div>
              <div style={{ padding: "12px 16px 8px" }}>
                <LineChart
                  data={data}
                  labels={history.days.map(d => d.slice(5))}
                  width={500} height={150}
                  mode="area"
                  stroke="var(--chart-line)"
                  fill="var(--chart-fill)"
                  grid
                  gridColor="rgba(0,0,0,0.04)"
                  axisColor="var(--muted)"
                  valueFmt={valueFmt}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {reportTab === "volume" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Monthly intake · all suppliers</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Tonnes · 12 months</div>
            </div>
            <div style={{ padding: "12px 16px 8px" }}>
              <BarChart
                data={monthlyVolume}
                width={500} height={180}
                showAvg
                avg={+(monthlyVolume.reduce((a, b) => a + b, 0) / 12).toFixed(0)}
                labels
              />
            </div>
          </div>

          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Daily intake · 90 days</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Tonnes per day</div>
            </div>
            <div style={{ padding: "12px 16px 8px" }}>
              <LineChart
                data={volume_daily}
                labels={history.days.map(d => d.slice(5))}
                width={500} height={180}
                mode="area"
                stroke="var(--chart-line)"
                fill="var(--chart-fill)"
                grid
                gridColor="rgba(0,0,0,0.04)"
                axisColor="var(--muted)"
                valueFmt={v => Math.round(v) + "t"}
              />
            </div>
          </div>
        </div>
      )}

      {reportTab === "spend" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Daily spend · 90 days</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>AUD · all suppliers</div>
            </div>
            <div style={{ padding: "12px 16px 8px" }}>
              <LineChart
                data={spend_daily}
                labels={history.days.map(d => d.slice(5))}
                width={500} height={180}
                mode="area"
                stroke="var(--chart-line)"
                fill="var(--chart-fill)"
                grid
                gridColor="rgba(0,0,0,0.04)"
                axisColor="var(--muted)"
                valueFmt={v => "$" + (v / 1000).toFixed(0) + "k"}
              />
            </div>
          </div>

          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Top 5 suppliers by YTD spend</div>
            </div>
            {top5.map((s, i) => (
              <div key={s.id} style={{
                display: "grid",
                gridTemplateColumns: "24px 1fr auto",
                padding: "10px 16px",
                gap: 10,
                alignItems: "center",
                borderBottom: "1px solid var(--line)",
                fontSize: 12,
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: "var(--accent-soft)", color: "var(--accent)",
                  fontSize: 10, fontWeight: 700, fontFamily: mono,
                  display: "grid", placeItems: "center",
                }}>
                  {i + 1}
                </span>
                <div>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {s.state} · {s.zone} · {s.ytd_tonnes.toFixed(0)}t YTD
                  </div>
                </div>
                <span style={{ fontFamily: mono, fontWeight: 600 }}>
                  {fmt.aud(s.ytd_spend_aud, 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportTab === "suppliers" && (
        <div style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 0.6fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr",
            padding: "10px 16px",
            fontSize: 10, color: "var(--muted)", fontWeight: 600,
            letterSpacing: 0.3, textTransform: "uppercase",
            borderBottom: "1px solid var(--line)",
            background: "var(--panel-2)",
          }}>
            <span>Supplier</span>
            <span>State</span>
            <span style={{ textAlign: "right" }}>% LME</span>
            <span style={{ textAlign: "right" }}>Landed</span>
            <span style={{ textAlign: "right" }}>YTD t</span>
            <span style={{ textAlign: "right" }}>YTD spend</span>
            <span style={{ textAlign: "right" }}>Contract</span>
          </div>
          <div style={{ maxHeight: "calc(100vh - 380px)", overflow: "auto" }}>
            {[...suppliers].sort((a, b) => b.ytd_spend_aud - a.ytd_spend_aud).map(s => (
              <div
                key={s.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 0.6fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr",
                  padding: "9px 16px",
                  alignItems: "center",
                  fontSize: 12,
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{s.zone}</div>
                </div>
                <span style={{
                  fontSize: 10, fontFamily: mono, fontWeight: 600,
                  color: "var(--muted)",
                }}>
                  {s.state}
                </span>
                <span style={{ textAlign: "right", fontFamily: mono }}>{s.pct_lme}%</span>
                <span style={{ textAlign: "right", fontFamily: mono }}>{fmt.aud(s.landed_aud_t, 0)}</span>
                <span style={{ textAlign: "right", fontFamily: mono }}>{s.ytd_tonnes.toFixed(0)}</span>
                <span style={{ textAlign: "right", fontFamily: mono, fontWeight: 600 }}>
                  {fmt.aud(s.ytd_spend_aud, 0)}
                </span>
                <span style={{ textAlign: "right", fontSize: 11, color: "var(--muted)" }}>
                  {s.contract_expires}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
