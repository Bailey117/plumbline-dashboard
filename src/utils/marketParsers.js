let _XLSX = null;
async function getXLSX() {
  if (!_XLSX) _XLSX = await import('xlsx');
  return _XLSX;
}

function excelDateToJS(serial) {
  if (!serial || isNaN(Number(serial))) return null;
  return new Date((Number(serial) - 25569) * 86400 * 1000);
}

// Parse RBA exchange rate XLS
// Format: header block in first rows, row with "FXRUSD" as column header,
// then data rows with date in col A, AUD/USD rate in the FXRUSD column.
// Returns { value: number, date: Date, seriesFound: boolean }
export async function parseRBAFile(file) {
  const XLSX = await getXLSX();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });

  // Try common sheet names
  const sheetName = wb.SheetNames.find(n =>
    /exchange|fx|f\.?11|rate|data/i.test(n)
  ) || wb.SheetNames[0];

  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // Find the row containing "FXRUSD" header
  let headerRowIdx = -1;
  let fxrCol = -1;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    for (let j = 0; j < row.length; j++) {
      if (String(row[j] || '').trim().toUpperCase() === 'FXRUSD') {
        headerRowIdx = i;
        fxrCol = j;
        break;
      }
    }
    if (headerRowIdx !== -1) break;
  }

  if (fxrCol === -1) {
    throw new Error('Could not find FXRUSD column in RBA file. Make sure you are using the RBA Exchange Rates (F.11) historical file.');
  }

  // Find last row with a numeric value in fxrCol
  let latestValue = null;
  let latestDate = null;
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const val = row[fxrCol];
    if (val !== null && val !== undefined && !isNaN(Number(val)) && Number(val) > 0) {
      latestValue = Number(val);
      // Date is in col 0
      const rawDate = row[0];
      if (rawDate) {
        if (typeof rawDate === 'number') {
          latestDate = excelDateToJS(rawDate);
        } else {
          latestDate = new Date(rawDate);
        }
      }
    }
  }

  if (!latestValue) {
    throw new Error('No AUD/USD rate data found in the file.');
  }

  return { value: latestValue, date: latestDate };
}

// Parse AIP TGP Excel file
// Sheet: "Diesel TGP", col 0 = Excel date serial, col 2 = Melbourne diesel AUD/L
// Returns { value: number, date: Date }
export async function parseAIPFile(file) {
  const XLSX = await getXLSX();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });

  // Find the Diesel TGP sheet (or fallback)
  const sheetName = wb.SheetNames.find(n =>
    /diesel/i.test(n)
  ) || wb.SheetNames[0];

  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // Skip header row(s) — find first row where col 0 looks like a date serial (>40000) or a date string
  let latestValue = null;
  let latestDate = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const rawDate = row[0];
    const val = row[2]; // Melbourne diesel is col 2 (0-indexed)

    if (val !== null && val !== undefined && !isNaN(Number(val)) && Number(val) > 0) {
      latestValue = Number(val);
      if (typeof rawDate === 'number' && rawDate > 40000) {
        latestDate = excelDateToJS(rawDate);
      } else if (rawDate) {
        latestDate = new Date(rawDate);
      }
    }
  }

  if (!latestValue) {
    throw new Error('No diesel price data found. Make sure you are using the AIP TGP Data file with a "Diesel TGP" sheet.');
  }

  return { value: latestValue, date: latestDate };
}

// Parse LME Lead file (VBA: sheet "LME Lead", dates in col B, cash bid in col C, from row 9)
// Returns { value: number, date: Date }
export async function parseLMEFile(file) {
  const XLSX = await getXLSX();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });

  const sheetName = wb.SheetNames.find(n => /lme.*lead|lead/i.test(n)) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // From VBA: dates in col B (index 1), cash bid in col C (index 2), starting row 9 (index 8)
  let latestValue = null;
  let latestDate = null;

  const startRow = 8; // 0-indexed row 9
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const dateRaw = row[1]; // col B
    const price = row[2];   // col C
    if (price !== null && price !== undefined && !isNaN(Number(price)) && Number(price) > 0) {
      latestValue = Number(price);
      if (typeof dateRaw === 'number' && dateRaw > 40000) {
        latestDate = excelDateToJS(dateRaw);
      } else if (dateRaw) {
        latestDate = new Date(dateRaw);
      }
    }
  }

  if (!latestValue) {
    throw new Error('No LME Lead price found. Expected sheet "LME Lead" with dates in col B and cash bid in col C from row 9.');
  }

  return { value: latestValue, date: latestDate };
}
