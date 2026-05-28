import React, { useState, useRef, useCallback } from 'react';
import { parseSAPFile } from '../utils/sapParser';
import { useImportData } from '../context/ImportDataContext';
import { useSuppliers } from '../api/hooks';
import { useRoute } from '../context/RouteContext';
import { btnPrimary, btnGhost, mono } from '../components/ui';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtNum(n, decimals = 1) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-AU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtAud(n) {
  if (n === null || n === undefined) return '—';
  return '$' + Math.round(n).toLocaleString('en-AU');
}

function daysSinceColor(days) {
  if (days === null) return 'var(--muted)';
  if (days > 45) return 'var(--down)';
  if (days > 20) return 'var(--warn)';
  return 'var(--up)';
}

function matchToDashboard(sapStat, suppliers) {
  const sName = sapStat.name.toLowerCase();
  for (const s of suppliers) {
    const dName = s.name.toLowerCase();
    if (dName.includes(sName) || sName.includes(dName)) {
      return s;
    }
  }
  return null;
}

// ── icons ─────────────────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--up)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M7.5 12.5l3 3 6-6" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
      style={{ animation: 'spin 0.9s linear infinite' }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// ── Step 1 — Upload ───────────────────────────────────────────────────────────

function StepUpload({ onFileParsed }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Please upload a .csv, .xlsx, or .xls file.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await parseSAPFile(file);
      onFileParsed(result);
    } catch (e) {
      setError('Failed to parse file: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [onFileParsed]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !loading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && !loading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--line-2)'}`,
          borderRadius: 12,
          padding: '48px 32px',
          textAlign: 'center',
          cursor: loading ? 'default' : 'pointer',
          background: dragging ? 'var(--accent-soft)' : 'var(--panel)',
          transition: 'border-color 0.15s, background 0.15s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {loading ? (
          <>
            <SpinnerIcon />
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>Parsing file…</div>
          </>
        ) : (
          <>
            <UploadIcon />
            <div style={{ fontSize: 15, fontWeight: 600 }}>Drop your SAP export here</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>or click to browse</div>
            <div style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid var(--line-2)',
              fontSize: 11,
              color: 'var(--muted)',
              fontFamily: mono,
            }}>
              .xlsx · .xls · .csv
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {error && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'rgba(209,69,69,0.08)',
          border: '1px solid rgba(209,69,69,0.2)',
          color: 'var(--down)',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Format hint */}
      <div style={{
        marginTop: 24,
        padding: '16px 20px',
        borderRadius: 10,
        background: 'var(--panel)',
        border: '1px solid var(--line)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          Export from SAP transaction ZME2N as XLSX or CSV
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, fontFamily: mono }}>
          Col 0: Pur. Doc. &nbsp;·&nbsp; Col 1: Collection Status &nbsp;·&nbsp; Col 6: Supplier Code
          <br />
          Col 7: Name 1 &nbsp;·&nbsp; Col 15: Pickup Date &nbsp;·&nbsp; Col 19: Material (IRM-BATT*)
          <br />
          Col 27: Net Price (AUD/t) &nbsp;·&nbsp; Col 30: Net Weight (t)
        </div>
      </div>
    </div>
  );
}

// ── Step 2 — Review ───────────────────────────────────────────────────────────

function StepReview({ parseResult, onBack, onApply }) {
  const { suppliers } = useSuppliers();
  const { supplierStats, totalRows, validRows, dateRange, fileInfo } = parseResult;

  const rows = supplierStats.map(stat => ({
    stat,
    match: matchToDashboard(stat, suppliers),
  }));

  const matchedCount = rows.filter(r => r.match).length;
  const unmatchedCount = rows.filter(r => !r.match).length;

  const totalTonnes = supplierStats.reduce((a, s) => a + s.ytdTonnes, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary card */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 20,
        alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>File</div>
          <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2, fontFamily: mono }}>{fileInfo.name}</div>
        </div>
        <StatChip label="Total rows" value={totalRows.toLocaleString()} />
        <StatChip label="Valid rows" value={validRows.toLocaleString()} />
        <StatChip label="Suppliers" value={supplierStats.length} />
        <StatChip label="YTD tonnes" value={fmtNum(totalTonnes, 1) + ' t'} />
        {dateRange && (
          <StatChip label="Date range" value={`${fmtDate(dateRange.from)} → ${fmtDate(dateRange.to)}`} />
        )}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 0.7fr 0.6fr 1fr 0.7fr 0.8fr 0.8fr 1fr 1.2fr',
          padding: '10px 16px',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
          color: 'var(--muted)',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel-2)',
        }}>
          <span>SAP Code</span>
          <span>Name</span>
          <span>Plant</span>
          <span style={{ textAlign: 'right' }}>Records</span>
          <span>Last Pickup</span>
          <span style={{ textAlign: 'right' }}>Days Since</span>
          <span style={{ textAlign: 'right' }}>Avg t/mo</span>
          <span style={{ textAlign: 'right' }}>YTD t</span>
          <span style={{ textAlign: 'right' }}>YTD Spend</span>
          <span>Matched To</span>
        </div>

        {/* Table rows */}
        <div style={{ maxHeight: 460, overflowY: 'auto' }}>
          {rows.map(({ stat, match }) => (
            <ReviewRow key={stat.code} stat={stat} match={match} />
          ))}
          {rows.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No supplier records found matching IRM-BATT* materials.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--line)',
          background: 'var(--panel-2)',
          fontSize: 12,
          color: 'var(--muted)',
          display: 'flex',
          gap: 16,
        }}>
          <span style={{ color: 'var(--up)', fontWeight: 600 }}>{matchedCount} matched</span>
          <span>·</span>
          <span>{unmatchedCount} unmatched</span>
          <span>·</span>
          <span>{supplierStats.length} total</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button style={btnGhost} onClick={onBack}>← Back</button>
        <button
          style={{
            ...btnPrimary,
            opacity: matchedCount === 0 ? 0.4 : 1,
            cursor: matchedCount === 0 ? 'not-allowed' : 'pointer',
          }}
          onClick={matchedCount > 0 ? onApply : undefined}
          disabled={matchedCount === 0}
        >
          Apply Import →
        </button>
      </div>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div style={{
      padding: '8px 12px',
      borderRadius: 8,
      background: 'var(--panel-2)',
      border: '1px solid var(--line)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: mono, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function ReviewRow({ stat, match }) {
  const dColor = daysSinceColor(stat.daysSince);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 2fr 0.7fr 0.6fr 1fr 0.7fr 0.8fr 0.8fr 1fr 1.2fr',
      padding: '9px 16px',
      fontSize: 12,
      borderBottom: '1px solid var(--line)',
      alignItems: 'center',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--panel-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--muted)' }}>{stat.code}</span>
      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat.name}</span>
      <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--muted)' }}>{stat.plant || '—'}</span>
      <span style={{ textAlign: 'right', fontFamily: mono }}>{stat.recordCount}</span>
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{stat.lastPickupStr || '—'}</span>
      <span style={{ textAlign: 'right', fontFamily: mono, color: dColor, fontWeight: 600 }}>
        {stat.daysSince !== null ? stat.daysSince + 'd' : '—'}
      </span>
      <span style={{ textAlign: 'right', fontFamily: mono }}>{fmtNum(stat.avgMonthly, 1)}</span>
      <span style={{ textAlign: 'right', fontFamily: mono }}>{fmtNum(stat.ytdTonnes, 1)}</span>
      <span style={{ textAlign: 'right', fontFamily: mono }}>{fmtAud(stat.ytdSpend)}</span>
      <span>
        {match ? (
          <span style={{
            padding: '2px 7px',
            borderRadius: 5,
            background: 'rgba(14,143,94,0.1)',
            color: 'var(--up)',
            fontSize: 11,
            fontWeight: 500,
            display: 'inline-block',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {match.name}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--dim)' }}>— unmatched</span>
        )}
      </span>
    </div>
  );
}

// ── Step 3 — Applied ──────────────────────────────────────────────────────────

function StepApplied({ importState, onImportAnother }) {
  const { setRoute } = useRoute();
  const matchedCount = importState?.supplierStats?.length || 0;
  const appliedAt = importState?.appliedAt
    ? new Date(importState.appliedAt).toLocaleString('en-AU', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      paddingTop: 24,
    }}>
      <CheckIcon />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Import applied successfully</div>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>
          {matchedCount} supplier{matchedCount !== 1 ? 's' : ''} updated
          {appliedAt && <> · last import: {appliedAt}</>}
        </div>
      </div>

      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: '14px 20px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>File imported</div>
        <div style={{ fontSize: 13, fontWeight: 500, fontFamily: mono }}>
          {importState?.fileInfo?.name || '—'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center' }}>
        <button
          style={btnPrimary}
          onClick={() => setRoute({ name: 'suppliers' })}
        >
          View Suppliers →
        </button>
        <button style={btnGhost} onClick={onImportAnother}>
          Import another file
        </button>
      </div>
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }) {
  const steps = ['Upload', 'Review', 'Done'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <React.Fragment key={n}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28,
                borderRadius: '50%',
                display: 'grid', placeItems: 'center',
                fontSize: 12, fontWeight: 700, fontFamily: mono,
                background: done ? 'var(--up)' : active ? 'var(--text)' : 'transparent',
                color: (done || active) ? 'var(--panel)' : 'var(--muted)',
                border: (done || active) ? 'none' : '1.5px solid var(--line-2)',
                transition: 'all 0.2s',
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--text)' : 'var(--muted)',
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 1,
                background: step > n ? 'var(--up)' : 'var(--line-2)',
                margin: '0 12px',
                minWidth: 32,
                transition: 'background 0.2s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SAPImportPage() {
  const [step, setStep] = useState(1);
  const [parseResult, setParseResult] = useState(null);
  const { applyImport, importState } = useImportData();

  const handleFileParsed = (result) => {
    setParseResult(result);
    setStep(2);
  };

  const handleApply = () => {
    if (!parseResult) return;
    applyImport(parseResult.supplierStats, parseResult.fileInfo);
    setStep(3);
  };

  const handleBack = () => {
    setStep(1);
    setParseResult(null);
  };

  const handleImportAnother = () => {
    setStep(1);
    setParseResult(null);
  };

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 6,
        }}>
          Data Management
        </div>
        <h1 style={{
          margin: 0,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: -0.5,
          lineHeight: 1.1,
        }}>
          SAP Import
        </h1>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
          Import supplier data from SAP transaction ZME2N to update pickup history, volumes and pricing.
        </div>
      </div>

      {/* Wizard card */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: '32px 32px',
      }}>
        <StepIndicator step={step} />

        {step === 1 && <StepUpload onFileParsed={handleFileParsed} />}
        {step === 2 && parseResult && (
          <StepReview
            parseResult={parseResult}
            onBack={handleBack}
            onApply={handleApply}
          />
        )}
        {step === 3 && (
          <StepApplied
            importState={importState}
            onImportAnother={handleImportAnother}
          />
        )}
      </div>
    </div>
  );
}
