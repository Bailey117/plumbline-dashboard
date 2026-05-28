// XLSX is loaded on-demand to avoid bloating the initial bundle
let _XLSX = null;
async function getXLSX() {
  if (!_XLSX) _XLSX = await import('xlsx');
  return _XLSX;
}

// Convert Excel serial date to JS Date
function excelDateToJS(serial) {
  if (!serial || isNaN(Number(serial))) return null;
  return new Date((Number(serial) - 25569) * 86400 * 1000);
}

// Normalize status string: strip leading zeros, compare
function normalizeStatus(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  const n = parseInt(s, 10);
  if (isNaN(n)) return s;
  return String(n).padStart(3, '0');
}

// Parse a single row (0-indexed columns as described)
function parseRow(row) {
  const get = (i) => {
    const v = row[i];
    return (v === undefined || v === null) ? '' : String(v).trim();
  };
  const getNum = (i) => {
    const v = row[i];
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const supplierCode = get(6);
  const material = get(19);

  // Skip rows with empty supplier or "Imported:" prefix
  if (!supplierCode || supplierCode.startsWith('Imported:')) return null;

  // Filter to battery materials only
  if (!material.startsWith('IRM-BATT')) return null;

  const rawStatus = get(1);
  const status = normalizeStatus(rawStatus);

  const pickupSerial = getNum(15);
  const pickupDate = pickupSerial ? excelDateToJS(pickupSerial) : null;

  const docDateSerial = getNum(11);
  const docDate = docDateSerial ? excelDateToJS(docDateSerial) : null;

  const createdSerial = getNum(4);
  const createdDate = createdSerial ? excelDateToJS(createdSerial) : null;

  return {
    purDoc: get(0),
    status,
    cocd: get(2),
    type: get(3),
    createdDate,
    createdBy: get(5),
    supplierCode,
    name: get(7),
    jCode: get(8),
    pOrg: get(9),
    pGr: get(10),
    docDate,
    yourRef: get(12),
    goodsSupp: get(13),
    ourRef: get(14),
    pickupDate,
    requestedPickupDate: excelDateToJS(getNum(16)),
    item: get(17),
    d: get(18),
    material,
    plant: get(20),
    storageLocation: get(21),
    infoRec: get(22),
    poQty: getNum(23),
    netPrice: getNum(27),
    currency: get(28),
    netWeight: getNum(30),
  };
}

// Read file as ArrayBuffer
function readFileBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Parse XLSX/XLS/CSV file into rows
async function fileToRows(file) {
  const buffer = await readFileBuffer(file);
  const XLSX = await getXLSX();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // Return as array of arrays (raw values)
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  return data;
}

export async function parseSAPFile(file) {
  const rows = await fileToRows(file);

  if (rows.length === 0) {
    return { records: [], supplierStats: [], totalRows: 0, validRows: 0, dateRange: null, fileInfo: { name: file.name } };
  }

  // Detect header row - skip it if first row looks like headers (non-numeric first col)
  let dataRows = rows;
  const firstCell = String(rows[0][0] || '').trim();
  if (isNaN(Number(firstCell)) && firstCell !== '') {
    dataRows = [...rows.slice(1)];
  } else {
    dataRows = [...rows];
  }

  // Filter out summary/total rows at the bottom of the SAP export
  // Find first row where col 0 (purDoc) contains "Total" (case-insensitive)
  // or where supplier code is empty but purDoc has text (aggregate row)
  const summaryIdx = dataRows.findIndex(row => {
    const purDoc = String(row[0] || '').trim();
    const supplierCode = String(row[6] || '').trim();
    if (!purDoc) return false;
    if (/total/i.test(purDoc)) return true;
    // Aggregate row: supplier code empty but purDoc has non-numeric text
    if (!supplierCode && purDoc && isNaN(Number(purDoc))) return true;
    return false;
  });
  if (summaryIdx !== -1) {
    dataRows = dataRows.slice(0, summaryIdx);
  }

  const totalRows = dataRows.length;

  // Parse all valid records
  const rawRecords = [];
  for (const row of dataRows) {
    const rec = parseRow(row);
    if (rec) rawRecords.push(rec);
  }

  // Dedup: key = purDoc + item, keep higher status record
  const dedupMap = new Map();
  const statusOrder = { '004': 3, '009': 2, '001': 1 };

  for (const rec of rawRecords) {
    const key = `${rec.purDoc}__${rec.item}`;
    if (dedupMap.has(key)) {
      const existing = dedupMap.get(key);
      const existingRank = statusOrder[existing.status] || 0;
      const newRank = statusOrder[rec.status] || 0;
      if (newRank > existingRank) {
        dedupMap.set(key, rec);
      }
    } else {
      dedupMap.set(key, rec);
    }
  }

  const records = Array.from(dedupMap.values());
  const validRows = records.length;

  // Compute date range
  let minDate = null;
  let maxDate = null;
  for (const rec of records) {
    const d = rec.pickupDate || rec.docDate;
    if (d) {
      if (!minDate || d < minDate) minDate = d;
      if (!maxDate || d > maxDate) maxDate = d;
    }
  }

  const dateRange = (minDate && maxDate)
    ? { from: minDate, to: maxDate }
    : null;

  const supplierStats = computeSupplierStats(records);

  return {
    records,
    supplierStats,
    totalRows,
    validRows,
    dateRange,
    fileInfo: { name: file.name, size: file.size },
  };
}

export function computeSupplierStats(records, today = new Date()) {
  // Group by supplier code
  const groups = new Map();

  for (const rec of records) {
    const code = rec.supplierCode;
    if (!groups.has(code)) {
      groups.set(code, {
        code,
        name: rec.name,
        jCode: rec.jCode,
        plant: rec.plant,
        records: [],
      });
    }
    groups.get(code).records.push(rec);
  }

  const ytdStart = new Date(today.getFullYear(), 0, 1);

  // Build last 12 calendar months labels
  const monthLabels = [];
  const monthKeys = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-AU', { month: 'short', year: '2-digit' });
    monthKeys.push(key);
    monthLabels.push(label);
  }

  const stats = [];

  for (const [, group] of groups) {
    const { code, name, jCode, plant, records: recs } = group;

    // Only count status 009 or 004 for tonnage/spend (not 001/pending)
    const countableRecs = recs.filter(r => r.status === '009' || r.status === '004');

    // Last pickup date (from all records, including pending, to find most recent)
    let lastPickup = null;
    for (const r of recs) {
      if (r.pickupDate) {
        if (!lastPickup || r.pickupDate > lastPickup) lastPickup = r.pickupDate;
      }
    }

    let daysSince = null;
    let lastPickupStr = null;
    if (lastPickup) {
      const msPerDay = 86400 * 1000;
      daysSince = Math.floor((today - lastPickup) / msPerDay);
      lastPickupStr = lastPickup.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // Monthly volumes: last 12 calendar months
    const volume12m = new Array(12).fill(0);
    for (const r of countableRecs) {
      const d = r.pickupDate || r.docDate;
      if (!d || r.netWeight === null) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const idx = monthKeys.indexOf(key);
      if (idx !== -1) {
        volume12m[idx] += r.netWeight;
      }
    }
    // Round
    const volume12mRounded = volume12m.map(v => +v.toFixed(2));

    // avgMonthly = total 12m volume / number of months that had any volume (min 1)
    const total12m = volume12mRounded.reduce((a, v) => a + v, 0);
    const activeMonths = volume12mRounded.filter(v => v > 0).length;
    const avgMonthly = +(total12m / Math.max(1, activeMonths)).toFixed(2);

    // YTD tonnes and spend
    let ytdTonnes = 0;
    let ytdSpend = 0;
    for (const r of countableRecs) {
      const d = r.pickupDate || r.docDate;
      if (!d) continue;
      if (d >= ytdStart && d <= today) {
        if (r.netWeight !== null) ytdTonnes += r.netWeight;
        if (r.netWeight !== null && r.netPrice !== null) {
          ytdSpend += r.netWeight * r.netPrice;
        }
      }
    }
    ytdTonnes = +ytdTonnes.toFixed(2);
    ytdSpend = Math.round(ytdSpend);

    // Latest net price (from most recent countable record with a price)
    let latestNetPrice = null;
    let latestPriceDate = null;
    for (const r of countableRecs) {
      if (r.netPrice !== null) {
        const d = r.pickupDate || r.docDate;
        if (d && (!latestPriceDate || d > latestPriceDate)) {
          latestNetPrice = r.netPrice;
          latestPriceDate = d;
        }
      }
    }

    // Status counts
    const statusCounts = { '001': 0, '009': 0, '004': 0, other: 0 };
    for (const r of recs) {
      if (statusCounts[r.status] !== undefined) {
        statusCounts[r.status]++;
      } else {
        statusCounts.other++;
      }
    }

    stats.push({
      code,
      name,
      jCode,
      plant,
      lastPickup,
      lastPickupStr,
      daysSince,
      volume12m: volume12mRounded,
      monthLabels,
      ytdTonnes,
      ytdSpend,
      avgMonthly,
      latestNetPrice,
      recordCount: recs.length,
      statusCounts,
    });
  }

  // Sort by ytdTonnes desc
  stats.sort((a, b) => b.ytdTonnes - a.ytdTonnes);

  return stats;
}
