import React, { useState, useRef, useCallback } from 'react';
import { useMarketDataCtx } from '../context/MarketDataContext';
import { parseRBAFile, parseAIPFile, parseLMEFile } from '../utils/marketParsers';
import { fmt, useSuppliers } from '../api/hooks';

const mono = '"Geist Mono", ui-monospace, "SF Mono", monospace';

const btnPrimary = {
  padding: '7px 14px', fontSize: 12, fontWeight: 500,
  border: '1px solid var(--accent)',
  background: 'var(--accent)', color: '#fff',
  borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
};
const btnGhost = {
  padding: '7px 14px', fontSize: 12, fontWeight: 500,
  border: '1px solid var(--line-2)',
  background: 'transparent', color: 'var(--muted)',
  borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
};
const dangerBtn = {
  padding: '5px 10px', fontSize: 11, fontWeight: 500,
  border: '1px solid rgba(209,69,69,0.3)',
  background: 'rgba(209,69,69,0.08)', color: 'var(--down)',
  borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
};

function SourceBadge({ source }) {
  const colors = {
    manual: { bg: 'var(--panel-2)', color: 'var(--muted)', label: 'Manual' },
    'rba-file': { bg: 'rgba(14,143,94,0.1)', color: 'var(--up)', label: 'RBA file' },
    'aip-file': { bg: 'rgba(14,143,94,0.1)', color: 'var(--up)', label: 'AIP file' },
    'lme-file': { bg: 'rgba(14,143,94,0.1)', color: 'var(--up)', label: 'LME file' },
    default: { bg: 'var(--accent-soft)', color: 'var(--accent)', label: source || 'Default' },
  };
  const s = colors[source] || colors.default;
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 5, fontSize: 11, fontWeight: 500,
      background: s.bg, color: s.color, fontFamily: mono,
    }}>{s.label}</span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Inline editable value cell
function EditableValue({ value, onSave, format, step, min, max }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = () => { setDraft(String(value)); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = () => {
    const n = parseFloat(draft);
    if (!isNaN(n) && n > 0) { onSave(n); }
    setEditing(false);
  };
  const handleKey = (e) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          autoFocus
          type="number"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKey}
          step={step || 'any'}
          min={min}
          max={max}
          style={{
            width: 110, padding: '4px 8px', fontSize: 13,
            border: '1px solid var(--accent)', borderRadius: 6,
            background: 'var(--panel-2)', color: 'var(--text)',
            fontFamily: mono, outline: 'none',
          }}
        />
        <button onClick={save} style={{ ...btnPrimary, padding: '4px 8px' }}>&#10003;</button>
        <button onClick={cancel} style={{ ...btnGhost, padding: '4px 8px' }}>&#10005;</button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      title="Click to edit"
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: 16, fontWeight: 700, fontFamily: mono, color: 'var(--text)',
        padding: '2px 6px', borderRadius: 5,
        textDecoration: 'underline dotted var(--line-2)',
      }}
    >
      {format ? format(value) : value}
    </button>
  );
}

// File upload helper with spinner
function FileUploadButton({ label, accept, onFile, loading, disabled }) {
  const ref = useRef(null);
  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        disabled={loading || disabled}
        style={{
          padding: '5px 10px', fontSize: 11, fontWeight: 500,
          border: '1px solid var(--line-2)',
          background: 'transparent', color: loading ? 'var(--dim)' : 'var(--muted)',
          borderRadius: 6, cursor: loading ? 'default' : 'pointer',
          fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5,
        }}
      >
        {loading ? '⏳' : '📁'} {loading ? 'Parsing…' : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
    </>
  );
}

export default function MarketPage() {
  const { market, overrides, setMarketValue, resetField, resetAll } = useMarketDataCtx();
  const { suppliers } = useSuppliers();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});

  const supplierAvgPct = suppliers.length
    ? suppliers.reduce((a, s) => a + s.pct_lme, 0) / suppliers.length / 100
    : 0.75;
  const supplierMaxPct = suppliers.length
    ? Math.max(...suppliers.map(s => s.pct_lme)) / 100
    : 0.80;
  const supplierMinPct = suppliers.length
    ? Math.min(...suppliers.map(s => s.pct_lme)) / 100
    : 0.70;

  const setLoad = (key, val) => setLoading(p => ({ ...p, [key]: val }));
  const setErr = (key, msg) => setErrors(p => ({ ...p, [key]: msg }));
  const clearErr = (key) => setErrors(p => { const n = {...p}; delete n[key]; return n; });

  const handleRBAFile = async (file) => {
    setLoad('aud_usd', true); clearErr('aud_usd');
    try {
      const { value, date } = await parseRBAFile(file);
      setMarketValue('aud_usd', value, 'rba-file');
      clearErr('aud_usd');
    } catch (e) {
      setErr('aud_usd', e.message);
    } finally { setLoad('aud_usd', false); }
  };

  const handleAIPFile = async (file) => {
    setLoad('diesel_gate_aud', true); clearErr('diesel_gate_aud');
    try {
      const { value, date } = await parseAIPFile(file);
      setMarketValue('diesel_gate_aud', value, 'aip-file');
      clearErr('diesel_gate_aud');
    } catch (e) {
      setErr('diesel_gate_aud', e.message);
    } finally { setLoad('diesel_gate_aud', false); }
  };

  const handleLMEFile = async (file) => {
    setLoad('lme_pb_usd', true); clearErr('lme_pb_usd');
    try {
      const { value, date } = await parseLMEFile(file);
      setMarketValue('lme_pb_usd', value, 'lme-file');
      clearErr('lme_pb_usd');
    } catch (e) {
      setErr('lme_pb_usd', e.message);
    } finally { setLoad('lme_pb_usd', false); }
  };

  const rows = [
    {
      key: 'lme_pb_usd',
      label: 'LME Lead',
      sub: 'Cash settle · USD/t',
      value: market.lme_pb_usd,
      format: v => 'US$' + Math.round(v).toLocaleString(),
      step: 1, min: 500, max: 5000,
      actions: (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <FileUploadButton
            label="Upload LME file"
            accept=".xls,.xlsx,.csv"
            onFile={handleLMEFile}
            loading={loading.lme_pb_usd}
          />
          <span style={{ fontSize: 10, color: 'var(--dim)' }}>LME monthly download · sheet &ldquo;LME Lead&rdquo;, col B=date, col C=cash bid, from row 9</span>
        </div>
      ),
    },
    {
      key: 'aud_usd',
      label: 'AUD/USD',
      sub: 'RBA daily fix',
      value: market.aud_usd,
      format: v => v.toFixed(4),
      step: 0.0001, min: 0.4, max: 1.2,
      actions: (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <FileUploadButton
            label="Upload RBA file"
            accept=".xls,.xlsx"
            onFile={handleRBAFile}
            loading={loading.aud_usd}
          />
          <a
            href="https://www.rba.gov.au/statistics/tables/xls-hist/2023-current.xls"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}
          >
            Download from RBA &#8599;
          </a>
          <span style={{ fontSize: 10, color: 'var(--dim)' }}>F.11 Historical Exchange Rates · looks for FXRUSD column</span>
        </div>
      ),
    },
    {
      key: 'diesel_gate_aud',
      label: 'Diesel TGP',
      sub: 'AIP Melbourne gate price · AUD/L',
      value: market.diesel_gate_aud,
      format: v => '$' + v.toFixed(3),
      step: 0.001, min: 0.5, max: 5,
      actions: (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <FileUploadButton
            label="Upload AIP file"
            accept=".xls,.xlsx"
            onFile={handleAIPFile}
            loading={loading.diesel_gate_aud}
          />
          <a
            href="https://www.aip.com.au/pricing/terminal-gate-prices"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}
          >
            Download from AIP &#8599;
          </a>
          <span style={{ fontSize: 10, color: 'var(--dim)' }}>AIP TGP Data xlsx · sheet &ldquo;Diesel TGP&rdquo;, col A=date, col C=Melbourne</span>
        </div>
      ),
    },
    {
      key: 'fuel_levy_aud',
      label: 'Fuel Levy',
      sub: 'Excise + RUC combined · AUD/L',
      value: market.fuel_levy_aud,
      format: v => '$' + v.toFixed(3),
      step: 0.001, min: 0, max: 1,
      actions: (
        <span style={{ fontSize: 11, color: 'var(--dim)' }}>
          Updated by federal budget &mdash; manual entry only
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 600 }}>
            Market inputs
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>
            Market Data
          </h1>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            {market.asof}
          </div>
        </div>
        <button
          onClick={resetAll}
          style={dangerBtn}
        >
          Reset all to defaults
        </button>
      </div>

      {/* KPI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'LME Lead AUD/t', v: fmt.aud(market.lme_pb_aud, 0) },
          { label: 'LME Lead USD/t', v: fmt.usd(market.lme_pb_usd, 2) },
          { label: 'AUD/USD', v: market.aud_usd.toFixed(4) },
          { label: 'Diesel TGP', v: '$' + market.diesel_gate_aud.toFixed(3) + '/L' },
        ].map(({ label, v }) => (
          <div key={label} style={{
            padding: '10px 12px', border: '1px solid var(--line)',
            borderRadius: 8, background: 'var(--panel)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: mono, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Main data table */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '180px 150px 110px 180px 1fr 80px',
          padding: '10px 20px', fontSize: 10, color: 'var(--muted)', fontWeight: 600,
          letterSpacing: 0.3, textTransform: 'uppercase',
          borderBottom: '1px solid var(--line)', background: 'var(--panel-2)',
        }}>
          <span>Input</span>
          <span>Current value</span>
          <span>Source</span>
          <span>Last updated</span>
          <span>Actions</span>
          <span></span>
        </div>

        {rows.map((row, i) => {
          const ov = overrides[row.key];
          const isOverridden = !!ov;
          return (
            <div key={row.key}>
              <div style={{
                display: 'grid', gridTemplateColumns: '180px 150px 110px 180px 1fr 80px',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none',
                background: isOverridden ? 'rgba(91,91,214,0.02)' : 'transparent',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{row.sub}</div>
                </div>
                <EditableValue
                  value={row.value}
                  onSave={v => setMarketValue(row.key, v, 'manual')}
                  format={row.format}
                  step={row.step}
                  min={row.min}
                  max={row.max}
                />
                <SourceBadge source={ov ? ov.source : 'default'} />
                <span style={{ fontSize: 11, color: 'var(--dim)', fontFamily: mono }}>
                  {ov ? fmtDate(ov.lastUpdated) : '—'}
                </span>
                <div>{row.actions}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {isOverridden && (
                    <button
                      onClick={() => resetField(row.key)}
                      style={dangerBtn}
                      title="Reset to default value"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              {/* Error message */}
              {errors[row.key] && (
                <div style={{
                  padding: '8px 20px 10px',
                  background: 'rgba(209,69,69,0.05)',
                  borderBottom: '1px solid var(--line)',
                  fontSize: 12, color: 'var(--down)',
                }}>
                  &#9888; {errors[row.key]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Computed values */}
      <div style={{
        background: 'var(--panel)', border: '1px solid var(--line)',
        borderRadius: 12, padding: '16px 20px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Computed values (read-only)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            ['LME Lead AUD/t', fmt.aud(market.lme_pb_aud, 2), `${fmt.usd(market.lme_pb_usd, 2)} ÷ ${market.aud_usd.toFixed(4)}`],
            [
              `Portfolio avg (${(supplierAvgPct * 100).toFixed(1)}%)`,
              fmt.aud(market.lme_pb_aud * supplierAvgPct, 0) + '/t',
              `Avg of ${suppliers.length} active supplier rates`,
            ],
            [
              `Highest rate (${(supplierMaxPct * 100).toFixed(1)}%)`,
              fmt.aud(market.lme_pb_aud * supplierMaxPct, 0) + '/t',
              `Lowest rate: ${(supplierMinPct * 100).toFixed(1)}% · ${fmt.aud(market.lme_pb_aud * supplierMinPct, 0)}/t`,
            ],
          ].map(([label, val, sub]) => (
            <div key={label} style={{
              padding: '10px 12px', border: '1px solid var(--line)',
              borderRadius: 8, background: 'var(--panel-2)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: mono, marginTop: 2 }}>{val}</div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: 16, padding: '14px 18px',
        background: 'var(--panel)', border: '1px solid var(--line)',
        borderRadius: 10,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>How to update market data</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            {
              icon: 'RBA',
              title: 'AUD/USD (RBA)',
              steps: [
                'Go to rba.gov.au → Statistics → Exchange Rates',
                'Download the "F.11 Historical Exchange Rates" XLS',
                'Upload it here using "Upload RBA file"',
                'App extracts the latest FXRUSD rate automatically',
              ],
            },
            {
              icon: 'AIP',
              title: 'Diesel TGP (AIP)',
              steps: [
                'Go to aip.com.au → Pricing → Terminal Gate Prices',
                'Download the TGP Data Excel file',
                'Upload it here using "Upload AIP file"',
                'App reads latest Melbourne diesel from "Diesel TGP" sheet',
              ],
            },
            {
              icon: 'LME',
              title: 'LME Lead (manual)',
              steps: [
                'Download your LME monthly data file',
                'Upload using "Upload LME file"',
                'Expected: sheet "LME Lead", col B = date, col C = cash bid, from row 9',
                'Or type the current price directly (click underlined value)',
              ],
            },
          ].map(({ icon, title, steps }) => (
            <div key={title}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                <span style={{
                  display: 'inline-block', marginRight: 6,
                  padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                  background: 'var(--panel-2)', border: '1px solid var(--line-2)',
                  fontFamily: mono, color: 'var(--muted)',
                }}>{icon}</span>
                {title}
              </div>
              <ol style={{ margin: 0, paddingLeft: 16 }}>
                {steps.map((s, i) => (
                  <li key={i} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3, lineHeight: 1.4 }}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
