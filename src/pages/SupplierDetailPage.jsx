import React, { useState } from 'react';
import { useSupplier, useMarketData, fmt } from '../api/hooks';
import { useRoute } from '../context/RouteContext';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import { CardHead, Field, SiteRow, btnGhost, btnPrimary } from '../components/ui';
import { stateColor } from '../theme';

const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

export default function SupplierDetailPage({ id }) {
  const { supplier: s } = useSupplier(id);
  const { market, history } = useMarketData();
  const { setRoute } = useRoute();
  const [tab, setTab] = useState("overview");

  if (!s) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
      Supplier not found
    </div>
  );

  const avgVol = s.avg_monthly_t;
  const sc = stateColor(s.state);

  return (
    <div style={{ padding: 20 }}>
      {/* Back + header */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setRoute({ name: "suppliers" })}
          style={{
            ...btnGhost,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 12,
          }}
        >
          ← Back to suppliers
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: sc, color: "#fff",
              display: "grid", placeItems: "center",
              fontFamily: mono, fontWeight: 700, fontSize: 13,
              flexShrink: 0,
            }}>
              {s.state.slice(0, 2)}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>
                {s.name}
              </h1>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, display: "flex", gap: 10 }}>
                <span>{s.state}</span>
                <span>·</span>
                <span style={{
                  padding: "1px 6px", borderRadius: 4,
                  background: "var(--accent-soft)", color: "var(--accent)",
                  fontSize: 11, fontWeight: 600, fontFamily: mono,
                }}>
                  {s.zone}
                </span>
                <span>·</span>
                <span>{s.site_count} {s.site_count === 1 ? "site" : "sites"}</span>
                {s.rate_change_due && (
                  <>
                    <span>·</span>
                    <span style={{
                      color: "var(--warn)", fontSize: 11, fontWeight: 600,
                    }}>
                      Rate review due
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnGhost}>Edit</button>
            <button style={btnPrimary}>Log pickup</button>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
        gap: 10, marginBottom: 16,
      }}>
        {[
          { label: "% of LME", v: s.pct_lme + "%" },
          { label: "Lead price", v: fmt.aud(s.price_aud_t, 0) + "/t" },
          { label: "Freight", v: fmt.aud(s.freight_aud_t, 0) + "/t" },
          { label: "Landed", v: fmt.aud(s.landed_aud_t, 0) + "/t" },
          { label: "Days since pickup", v: s.days_since + "d", warn: s.days_since > 45 },
        ].map(({ label, v, warn }) => (
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
            <div style={{
              fontSize: 18, fontWeight: 600, fontFamily: mono, marginTop: 2,
              color: warn ? "var(--down)" : "var(--text)",
            }}>
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 14,
        borderBottom: "1px solid var(--line)", paddingBottom: 0,
      }}>
        {["overview", "sites", "rates", "volume"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 14px",
              border: "none",
              background: "transparent",
              color: tab === t ? "var(--text)" : "var(--muted)",
              fontWeight: tab === t ? 600 : 500,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              borderBottom: tab === t ? "2px solid var(--text)" : "2px solid transparent",
              marginBottom: -1,
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Price chart */}
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <CardHead
              title="Price history · 90 days"
              sub={`AUD/t at ${s.pct_lme}% of LME`}
            />
            <div style={{ padding: "12px 16px" }}>
              <LineChart
                data={s.price_series}
                labels={history.days.map(d => d.slice(5))}
                width={400} height={180}
                mode="area"
                stroke="var(--chart-line)"
                fill="var(--chart-fill)"
                grid
                gridColor="rgba(0,0,0,0.05)"
                axisColor="var(--muted)"
                valueFmt={v => "$" + Math.round(v)}
              />
            </div>
          </div>

          {/* Details */}
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <CardHead title="Contract details" />
            <div style={{
              padding: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}>
              <Field label="Supplier ID" v={s.id.toUpperCase()} />
              <Field label="State" v={s.state} />
              <Field label="Primary zone" v={s.zone} />
              <Field label="Sites" v={s.site_count} />
              <Field label="Avg monthly vol." v={s.avg_monthly_t + " t"} />
              <Field label="YTD volume" v={s.ytd_tonnes + " t"} />
              <Field label="YTD spend" v={fmt.aud(s.ytd_spend_aud, 0)} />
              <Field label="Contract expires" v={s.contract_expires} />
            </div>

            {/* Rate history */}
            <div style={{
              borderTop: "1px solid var(--line)",
              padding: "12px 16px",
            }}>
              <div style={{
                fontSize: 11, color: "var(--muted)",
                fontWeight: 600, marginBottom: 8,
                textTransform: "uppercase", letterSpacing: 0.4,
              }}>
                Rate history (6 months)
              </div>
              <div style={{ display: "flex", gap: 8, overflow: "auto", paddingBottom: 4 }}>
                {s.rate_history.map((r, i) => (
                  <div key={i} style={{
                    flexShrink: 0,
                    padding: "6px 10px",
                    border: "1px solid var(--line-2)",
                    borderRadius: 8,
                    background: i === s.rate_history.length - 1 ? "var(--accent-soft)" : "var(--panel-2)",
                    minWidth: 80,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 9, color: "var(--muted)", marginBottom: 2 }}>{r.month}</div>
                    <div style={{
                      fontSize: 14, fontWeight: 700, fontFamily: mono,
                      color: i === s.rate_history.length - 1 ? "var(--accent)" : "var(--text)",
                    }}>
                      {r.pct}%
                    </div>
                    <div style={{ fontSize: 9, color: "var(--dim)" }}>{r.set_by}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "sites" && (
        <div style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          <CardHead
            title="Collection sites"
            sub={`${s.site_count} active locations`}
          />
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 0.7fr 0.7fr 0.8fr 0.9fr 0.9fr",
            padding: "8px 16px",
            fontSize: 10, color: "var(--muted)", fontWeight: 600,
            letterSpacing: 0.3, textTransform: "uppercase",
            borderBottom: "1px solid var(--line)",
            background: "var(--panel-2)",
          }}>
            <span>Site</span>
            <span>State</span>
            <span>Zone</span>
            <span style={{ textAlign: "right" }}>Monthly t</span>
            <span style={{ textAlign: "right" }}>Freight</span>
            <span style={{ textAlign: "right" }}>Last pickup</span>
          </div>
          {s.sites.map(site => (
            <SiteRow key={site.id} site={site} />
          ))}
        </div>
      )}

      {tab === "rates" && (
        <div style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          <CardHead
            title="Rate negotiation history"
            sub="Monthly % of LME"
            action={
              <button style={btnPrimary}>Set new rate</button>
            }
          />
          <div style={{ padding: 16 }}>
            <div style={{
              display: "flex",
              gap: 10,
              marginBottom: 20,
              overflowX: "auto",
              paddingBottom: 4,
            }}>
              {s.rate_history.map((r, i) => {
                const isCurrent = i === s.rate_history.length - 1;
                return (
                  <div key={i} style={{
                    flexShrink: 0,
                    padding: "12px 16px",
                    border: "1px solid " + (isCurrent ? "var(--accent)" : "var(--line)"),
                    borderRadius: 10,
                    background: isCurrent ? "var(--accent-soft)" : "var(--panel-2)",
                    minWidth: 100,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>{r.month}</div>
                    <div style={{
                      fontSize: 22, fontWeight: 700, fontFamily: mono,
                      color: isCurrent ? "var(--accent)" : "var(--text)",
                    }}>
                      {r.pct}%
                    </div>
                    <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 4 }}>
                      {r.set_by}
                    </div>
                    {isCurrent && (
                      <div style={{
                        marginTop: 6,
                        fontSize: 9,
                        color: "var(--accent)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                      }}>
                        Current
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: "12px 14px",
              border: "1px solid var(--line)",
              borderRadius: 8,
              background: "var(--panel-2)",
              fontSize: 12,
              color: "var(--muted)",
            }}>
              At {s.pct_lme}% of LME = {fmt.aud(s.price_aud_t, 0)}/t · Landed {fmt.aud(s.landed_aud_t, 0)}/t
              <br />
              Contract expires {s.contract_expires}
              {s.rate_change_due && (
                <span style={{ color: "var(--warn)", marginLeft: 8, fontWeight: 600 }}>
                  · Rate review due
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "volume" && (
        <div style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          <CardHead
            title="Volume history · 12 months"
            sub="Tonnes collected per month"
          />
          <div style={{ padding: "16px 16px 8px" }}>
            <BarChart
              data={s.volume_12m}
              width={760} height={180}
              showAvg
              avg={avgVol}
              labels
            />
          </div>
          <div style={{
            padding: "8px 16px 16px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
          }}>
            {[
              ["Avg monthly", s.avg_monthly_t + " t"],
              ["YTD volume", s.ytd_tonnes + " t"],
              ["YTD spend", fmt.aud(s.ytd_spend_aud, 0)],
              ["Last pickup", s.days_since + " days ago"],
            ].map(([label, v]) => (
              <div key={label} style={{
                padding: "8px 10px",
                border: "1px solid var(--line)",
                borderRadius: 7,
                background: "var(--panel-2)",
              }}>
                <div style={{
                  fontSize: 10, color: "var(--muted)",
                  textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600,
                }}>
                  {label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: mono, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
