// Plausible AU market figures, May 2026 baseline.

const market = {
  lme_pb_usd: 2055.50,
  lme_pb_usd_prev: 2031.00,
  aud_usd: 0.6548,
  aud_usd_prev: 0.6612,
  diesel_gate_aud: 2.047,
  diesel_gate_aud_prev: 2.018,
  fuel_levy_aud: 0.501,
  fuel_levy_aud_prev: 0.501,
  asof: "28 May 2026 · 16:30 AEST",
};
market.lme_pb_aud = market.lme_pb_usd / market.aud_usd;
market.lme_pb_aud_prev = market.lme_pb_usd_prev / market.aud_usd_prev;

function seededWalk(n, start, vol, trend, seed) {
  const out = [];
  let v = start, s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    v = v + (s / 233280 - 0.5) * vol + trend;
    out.push(+v.toFixed(4));
  }
  return out;
}

const DAYS = 90;
const history = {
  days: Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(2026, 4, 28);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    return d.toISOString().slice(0, 10);
  }),
  lme_pb_usd: seededWalk(DAYS, 1980, 18, 0.85, 7).map(v => Math.max(1850, v)),
  aud_usd:    seededWalk(DAYS, 0.668, 0.004, -0.00015, 11).map(v => +v.toFixed(4)),
  diesel:     seededWalk(DAYS, 1.972, 0.018, 0.0008, 23).map(v => +v.toFixed(3)),
};
history.lme_pb_aud = history.lme_pb_usd.map((u, i) => +(u / history.aud_usd[i]).toFixed(2));
history.lme_pb_usd[DAYS - 1] = market.lme_pb_usd;
history.aud_usd[DAYS - 1]    = market.aud_usd;
history.diesel[DAYS - 1]     = market.diesel_gate_aud;
history.lme_pb_aud[DAYS - 1] = +(market.lme_pb_usd / market.aud_usd).toFixed(2);

export const freight_zones = [
  { code: "Z1", name: "Metro <50km",        base: 28,  states: ["NSW","VIC","QLD","SA","WA"] },
  { code: "Z2", name: "Inner 50-200km",     base: 52,  states: ["NSW","VIC","QLD","SA","WA","TAS"] },
  { code: "Z3", name: "Regional 200-500km", base: 88,  states: ["NSW","VIC","QLD","SA","WA"] },
  { code: "Z4", name: "Remote 500-1000km",  base: 142, states: ["WA","NT","QLD","SA"] },
  { code: "Z5", name: "Outback 1000km+",    base: 215, states: ["NT","WA","QLD"] },
];

export function freightAt(zoneCode, dieselPrice) {
  const z = freight_zones.find(x => x.code === zoneCode);
  if (!z) return 0;
  const factor = 1 + ((dieselPrice - 1.80) / 1.80) * 0.42;
  return +(z.base * factor).toFixed(2);
}

const supplierSeed = [
  ["Pacific Battery Co",        "NSW","Z1",81,92, 342],
  ["Murray Metals",              "VIC","Z2",79,14, 286],
  ["Western Lead Recovery",      "WA", "Z2",78,6,  412],
  ["Sunshine State Salvage",     "QLD","Z2",80,21, 198],
  ["Adelaide Lead Exchange",     "SA", "Z2",80,9,  164],
  ["Top End Auto Wreckers",      "NT", "Z5",62,41,  88],
  ["Tasman Battery Co",          "TAS","Z3",73,18,  74],
  ["Pilbara Power Recovery",     "WA", "Z4",67,34, 256],
  ["Sydney Metro Recyclers",     "NSW","Z1",83,3,  520],
  ["Geelong Battery Works",      "VIC","Z1",82,7,  188],
  ["Cairns Tropical Salvage",    "QLD","Z3",71,28, 102],
  ["Outback Lead Traders",       "NT", "Z5",60,56,  62],
  ["Newcastle Battery Hub",      "NSW","Z2",80,11, 244],
  ["Perth Industrial Metals",    "WA", "Z1",82,4,  376],
  ["Hobart Lead Collective",     "TAS","Z3",72,22,  46],
  ["Mildura Auto Parts",         "VIC","Z3",74,31,  78],
  ["Townsville Battery Brokers", "QLD","Z3",72,19, 112],
  ["Riverina Recyclers",         "NSW","Z3",76,26,  94],
  ["Whyalla Metal Co",           "SA", "Z3",74,38,  68],
  ["Kalgoorlie Salvage",         "WA", "Z4",66,47, 124],
  ["Darwin Battery Depot",       "NT", "Z4",64,33, 108],
  ["Toowoomba Lead Yard",        "QLD","Z2",78,13, 146],
  ["Bendigo Battery Recycling",  "VIC","Z3",75,24,  82],
  ["Albury Metals",              "NSW","Z3",76,16, 118],
  ["Port Augusta Recovery",      "SA", "Z3",73,29,  72],
  ["Geraldton Auto Wreckers",    "WA", "Z3",72,35,  96],
  ["Mount Isa Battery Co",       "QLD","Z5",61,52,  54],
  ["Bunbury Lead Works",         "WA", "Z2",78,12, 168],
  ["Wollongong Recyclers",       "NSW","Z2",80,8,  232],
  ["Ballarat Battery Brokers",   "VIC","Z2",78,17, 142],
  ["Rockhampton Salvage",        "QLD","Z3",73,25, 118],
  ["Mount Gambier Metals",       "SA", "Z3",73,27,  62],
  ["Broken Hill Lead Trust",     "NSW","Z4",68,44,  86],
  ["Launceston Battery Co",      "TAS","Z3",71,23,  38],
  ["Alice Springs Salvage",      "NT", "Z5",58,61,  44],
  ["Karratha Industrial",        "WA", "Z5",61,49, 102],
  ["Mackay Battery Hub",         "QLD","Z3",72,32,  98],
  ["Wagga Lead Recovery",        "NSW","Z3",75,20, 108],
  ["Shepparton Recyclers",       "VIC","Z2",78,15, 124],
  ["Port Lincoln Metals",        "SA", "Z3",72,39,  56],
  ["Coffs Harbour Battery",      "NSW","Z3",75,30,  88],
  ["Albany Salvage",             "WA", "Z3",71,36,  74],
  ["Roma Outback Wreckers",      "QLD","Z4",67,45,  68],
  ["Devonport Lead Co",          "TAS","Z3",71,26,  42],
  ["Tennant Creek Recovery",     "NT", "Z5",58,67,  38],
  ["Orange Battery Brokers",     "NSW","Z3",75,22, 102],
  ["Warrnambool Metals",         "VIC","Z3",74,28,  84],
  ["Port Hedland Lead",          "WA", "Z5",62,53, 118],
  ["Gladstone Battery Works",    "QLD","Z2",79,10, 176],
  ["Murray Bridge Salvage",      "SA", "Z2",78,19,  92],
];

const MULTI_SITE = {
  0:  [["Sydney HQ","NSW","Z1",0.55],["Parramatta Yard","NSW","Z2",0.30],["Penrith Depot","NSW","Z2",0.15]],
  1:  [["Melbourne Main","VIC","Z2",0.62],["Geelong Annexe","VIC","Z2",0.38]],
  2:  [["Perth West","WA","Z2",0.50],["Fremantle Dock","WA","Z1",0.50]],
  3:  [["Brisbane HQ","QLD","Z2",0.70],["Gold Coast","QLD","Z2",0.30]],
  7:  [["Karratha Yard","WA","Z4",0.60],["Newman Outpost","WA","Z5",0.40]],
  8:  [["Sydney Metro","NSW","Z1",0.80],["Wollongong Sub","NSW","Z2",0.20]],
  13: [["Perth East","WA","Z1",0.55],["Mandurah","WA","Z2",0.45]],
  20: [["Darwin Main","NT","Z4",0.60],["Katherine","NT","Z5",0.40]],
  28: [["Wollongong North","NSW","Z2",0.65],["Shellharbour","NSW","Z2",0.35]],
  35: [["Geraldton","WA","Z3",0.55],["Carnarvon","WA","Z4",0.45]],
};

export const suppliers = supplierSeed.map(([name, state, zone, pct, daysSince, monthly], i) => {
  const series = history.lme_pb_aud.map(p => +(p * pct / 100).toFixed(2));
  const freightSeries = history.diesel.map(d => freightAt(zone, d));
  const volSeries = Array.from({ length: 12 }, (_, m) => {
    const s = ((i + 1) * 131 + m * 17) % 233;
    return +(monthly * (0.78 + (s / 233) * 0.4)).toFixed(1);
  });
  return {
    id: "s" + String(i + 1).padStart(2, "0"),
    name, state, zone,
    pct_lme: pct,
    days_since: daysSince,
    avg_monthly_t: monthly,
    price_aud_t: series[series.length - 1],
    freight_aud_t: freightSeries[freightSeries.length - 1],
    price_series: series,
    freight_series: freightSeries,
    volume_12m: volSeries,
    ytd_tonnes: +(monthly * 5 * (0.85 + ((i * 7) % 100) / 333)).toFixed(1),
    ytd_spend_aud: 0,
    contract_expires: ["2026-09-30","2027-03-31","2026-12-31","2028-06-30"][i % 4],
  };
});

suppliers.forEach(s => {
  s.ytd_spend_aud = Math.round(s.ytd_tonnes * (s.price_aud_t + s.freight_aud_t));
  s.landed_aud_t = +(s.price_aud_t + s.freight_aud_t).toFixed(2);
});

suppliers.forEach((s, i) => {
  const cfg = MULTI_SITE[i];
  if (cfg) {
    s.sites = cfg.map(([name, state, zone, share], k) => ({
      id: `${s.id}-${k+1}`,
      name: `${s.name} · ${name}`,
      short_name: name,
      state, zone,
      monthly_t: +(s.avg_monthly_t * share).toFixed(1),
      days_since: Math.max(1, s.days_since + (k - 1) * 6 + (i % 7)),
      contact: ["Site Manager","Operations","Logistics"][k % 3],
      freight_aud_t: freightAt(zone, market.diesel_gate_aud),
    }));
  } else {
    s.sites = [{
      id: `${s.id}-1`, name: s.name, short_name: "Main",
      state: s.state, zone: s.zone, monthly_t: s.avg_monthly_t,
      days_since: s.days_since, contact: "Site Manager",
      freight_aud_t: s.freight_aud_t,
    }];
  }
  s.states = [...new Set(s.sites.map(x => x.state))];
  s.site_count = s.sites.length;
});

const months = ["Dec 2025","Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026"];
suppliers.forEach((s, i) => {
  let rate = s.pct_lme;
  const path = [];
  for (let m = months.length - 1; m >= 0; m--) {
    path.unshift({ month: months[m], pct: rate, set_by: i % 3 === 0 ? "J. Moxley" : "L. Tran" });
    if ((i + m) % 7 === 0) rate = Math.max(55, rate - 1);
    else if ((i + m) % 11 === 0) rate = Math.min(85, rate + 1);
  }
  s.rate_history = path;
  s.rate_change_due = (i % 4 === 0);
});

export const alerts = [
  { id:"a1",  cat:"market",    sev:"info",  t:"15:42", date:"today",     title:"LME Lead +1.21%",                      body:"Cash settle 2,055.50 USD breaking 30-day resistance.",                  actor:"LME feed" },
  { id:"a2",  cat:"pickups",   sev:"warn",  t:"13:18", date:"today",     title:"Top End Auto Wreckers — 41d no pickup", body:"NT · Z5 · 88 t/mo avg. Last collection was 17 April.",             actor:"SAP daily batch" },
  { id:"a3",  cat:"market",    sev:"warn",  t:"11:05", date:"today",     title:"AIP diesel TGP +1.44% WoW",             body:"Z4-Z5 freight effective +AU$1.83/t. Recalculate landed costs.",        actor:"AIP feed" },
  { id:"a4",  cat:"rates",     sev:"info",  t:"09:50", date:"today",     title:"12 suppliers due for June rate review", body:"Monthly cycle starts in 4 days. Open the Rates page.",             actor:"Plumbline" },
  { id:"a5",  cat:"contracts", sev:"warn",  t:"08:30", date:"today",     title:"Murray Metals contract expires 30 Sep", body:"120 days notice window opens 1 June.",                             actor:"Contracts" },
  { id:"a6",  cat:"sap",       sev:"ok",    t:"04:00", date:"today",     title:"SAP daily batch synced",                body:"1,284 movement records imported across 50 suppliers, 64 sites.",      actor:"SAP" },
  { id:"a7",  cat:"pickups",   sev:"alert", t:"17:22", date:"yesterday", title:"Tennant Creek Recovery — 67d no pickup",body:"NT · Z5 · 38 t/mo. Threshold breached.",                            actor:"SAP daily batch" },
  { id:"a8",  cat:"market",    sev:"info",  t:"16:00", date:"yesterday", title:"RBA AUD/USD fix 0.6612 → 0.6548",       body:"−0.97%. Boosts AUD-denominated LME by AU$30/t.",                    actor:"RBA" },
  { id:"a9",  cat:"rates",     sev:"info",  t:"10:15", date:"yesterday", title:"May rates posted to 50 suppliers",      body:"Average 74.0% of LME. Range 58% (Alice Springs) – 83% (Sydney Metro).", actor:"L. Tran" },
  { id:"a10", cat:"sap",       sev:"warn",  t:"04:00", date:"yesterday", title:"SAP batch had 3 unmatched records",     body:"Review in Settings → SAP imports.",                                  actor:"SAP" },
];

export const STATES = ["NSW","VIC","QLD","WA","SA","TAS","NT","ACT"];

const stateNames = {
  NSW:"New South Wales", VIC:"Victoria", QLD:"Queensland", WA:"Western Australia",
  SA:"South Australia", TAS:"Tasmania", NT:"Northern Territory", ACT:"Aust. Capital Terr.",
};

export const states = STATES.map(code => {
  const ss = suppliers.filter(s => s.state === code);
  const tonnes = ss.reduce((a, s) => a + s.avg_monthly_t, 0);
  const spend  = ss.reduce((a, s) => a + s.ytd_spend_aud, 0);
  const avgPct = ss.length ? +(ss.reduce((a, s) => a + s.pct_lme, 0) / ss.length).toFixed(1) : 0;
  return {
    code, name: stateNames[code],
    supplier_count: ss.length,
    monthly_tonnes: +tonnes.toFixed(1),
    ytd_spend_aud: spend,
    avg_pct_lme: avgPct,
  };
});

export const volume_daily = history.days.map((_, i) => {
  const s = (i * 73) % 233;
  const base = suppliers.reduce((a, x) => a + x.avg_monthly_t, 0) / 30;
  return +(base * (0.7 + (s / 233) * 0.6)).toFixed(1);
});
export const spend_daily = volume_daily.map((v, i) =>
  Math.round(v * (history.lme_pb_aud[i] * 0.74 + 60))
);

export const fmt = {
  aud: (v, d = 0) => "$" + Number(v).toLocaleString("en-AU", { minimumFractionDigits: d, maximumFractionDigits: d }),
  usd: (v, d = 0) => "US$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }),
  pct: (v, d = 1) => Number(v).toFixed(d) + "%",
  t: (v) => Number(v).toLocaleString("en-AU", { maximumFractionDigits: 1 }) + " t",
  delta: (a, b, d = 2) => {
    const x = a - b, p = (x / b) * 100;
    return { abs: x, pct: p, sign: x > 0 ? "+" : x < 0 ? "−" : "", abs_s: Math.abs(x).toFixed(d), pct_s: Math.abs(p).toFixed(2) };
  },
};

export { market, history, months };
