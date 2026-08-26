// Ballast — the asset table is the single source of truth.
//
// Every other script reads this file: the sliders and the methodology table are
// rendered from it, the pie chart takes its labels and its series order from it,
// the cache keys off it, and the simulation blends its returns and volatilities.
// Changing a holding is one edit here.
//
// Array order IS the chart series order. Slot i takes THEME.series[i], so a
// holding keeps its colour no matter how the allocation moves. Reordering this
// array repaints the chart; adding a sixth holding needs a new colour and a
// fresh colourblind validation — see STYLE.md.
const ASSETS = [
  {
    key: 'equity',
    label: 'US Equity',
    defaultValue: 15000,
    expectedReturn: 0.09,
    volatility: 0.18,
    expenseRatio: 0.0007,
    distributing: false,
    type: 'Accumulating',
    // Drives the Conservative / Moderate / Aggressive classification.
    riskDriver: true
  },
  {
    key: 'corpBond',
    label: 'Corporate Bonds',
    defaultValue: 6000,
    expectedReturn: 0.06,
    volatility: 0.08,
    expenseRatio: 0.0010,
    distributing: true,
    type: 'Distributing'
  },
  {
    key: 'govBond',
    label: 'US Treasuries',
    defaultValue: 5000,
    expectedReturn: 0.05,
    volatility: 0.07,
    expenseRatio: 0.0009,
    distributing: true,
    type: 'Distributing'
  },
  {
    key: 'gold',
    label: 'Gold',
    defaultValue: 2000,
    expectedReturn: 0.10,
    volatility: 0.30,
    expenseRatio: 0.0050,
    distributing: false,
    type: 'Accumulating',
    note: 'Holding cost: 0.50% p.a.'
  },
  {
    key: 'cash',
    label: 'Cash',
    defaultValue: 5000,
    expectedReturn: 0.02,
    volatility: 0.01,
    expenseRatio: 0,
    distributing: false,
    type: '—'
  }
];

// The one place the currency is set. Every figure on the page — the total, the
// slider legend, the results table, both chart axes — formats through the
// helpers below, so changing these three fields changes the whole page.
// The locale is pinned so grouping does not shift with the reader's browser.
const CURRENCY = { symbol: '$', locale: 'en-US' };

// A whole-unit amount: $33,000
function formatMoney(value) {
  return `${CURRENCY.symbol}${Math.round(value).toLocaleString(CURRENCY.locale)}`;
}

// A compact axis tick: $33.0k. `decimals` matches the old per-axis formatting.
function formatThousands(value, decimals = 0) {
  return `${CURRENCY.symbol}${(value / 1000).toFixed(decimals)}k`;
}

// Portfolio-level costs, charged regardless of the mix.
const FEES = {
  platformFeeAnnual: 0.0025,
  transactionCostPerContribution: 0.0010
};

// Illustrative target mixes, in percent. Keys must match ASSETS keys.
const PRESETS = [
  { name: 'Conservative', weights: { equity: 30, corpBond: 30, govBond: 20, gold: 10, cash: 10 } },
  { name: 'Moderate', weights: { equity: 50, corpBond: 25, govBond: 15, gold: 5, cash: 5 } },
  { name: 'Aggressive', weights: { equity: 70, corpBond: 15, govBond: 5, gold: 5, cash: 5 } }
];

const ALLOCATION_STORAGE_KEY = 'ballast.allocation.v1';

// The DOM contract: each holding owns a range input and a number input.
const sliderId = key => `${key}Slider`;
const valueId = key => `${key}Value`;

// One read of every slider, as { equity: 15000, corpBond: 6000, ... }.
// Used by the cache, the total, the pie chart and the simulation.
function readAllocations() {
  const allocations = {};
  ASSETS.forEach(asset => {
    const el = document.getElementById(valueId(asset.key));
    allocations[asset.key] = el ? parseInt(el.value) || 0 : 0;
  });
  return allocations;
}

function totalAllocation(allocations) {
  return ASSETS.reduce((sum, asset) => sum + (allocations[asset.key] || 0), 0);
}

// Gross return less the holding's own running cost. Distributing holdings lose
// part of their gross return to dividend withholding tax before the deduction.
function netAssetReturn(asset, dividendWithholdingRate) {
  const gross = asset.distributing
    ? asset.expectedReturn * (1 - dividendWithholdingRate)
    : asset.expectedReturn;
  return gross - asset.expenseRatio;
}
