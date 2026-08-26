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
//
// expectedReturn is a NOMINAL ARITHMETIC mean: the average of the yearly
// returns, not the rate the holding compounds at. The simulation draws each
// year from N(expectedReturn, volatility), so the arithmetic mean is the
// correct input here. The compound rate is lower by about volatility^2 / 2 —
// 1.4 points a year for US Equity, 1.3 for Gold.
//
// The figures are forward-looking estimates, not long-run historical averages.
// Bond returns start from current yields, less expected credit loss. Gold pays
// no income, so it is modelled to hold its purchasing power and no more.
const ASSETS = [
  {
    key: 'equity',
    label: 'US Equity',
    defaultValue: 15000,
    expectedReturn: 0.07,
    volatility: 0.17,
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
    expectedReturn: 0.05,
    volatility: 0.08,
    expenseRatio: 0.0010,
    distributing: true,
    type: 'Distributing'
  },
  {
    key: 'govBond',
    label: 'US Treasuries',
    defaultValue: 5000,
    expectedReturn: 0.042,
    volatility: 0.07,
    expenseRatio: 0.0009,
    distributing: true,
    type: 'Distributing'
  },
  {
    key: 'gold',
    label: 'Gold',
    defaultValue: 2000,
    expectedReturn: 0.04,
    volatility: 0.16,
    expenseRatio: 0.0050,
    distributing: false,
    type: 'Accumulating',
    note: 'Holding cost: 0.50% p.a.'
  },
  {
    key: 'cash',
    label: 'Cash',
    defaultValue: 5000,
    expectedReturn: 0.03,
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

// Pairwise correlation between holdings. 1 means the pair moves together, 0
// means the pair moves independently, -1 means the pair moves in opposite
// directions. Correlation is what decides whether spreading money across
// holdings actually lowers risk.
//
// Only the pairs that matter are listed. Any pair left out is treated as 0.
// The matrix is symmetric, so each pair appears once and correlation() looks
// up both orderings.
//
// These are long-run averages. In a crash most of them move toward 1, which is
// the moment spreading your money helps least. Read the volatility this
// produces as a floor, not a ceiling.
const CORRELATIONS = {
  'equity:corpBond': 0.35,   // company credit weakens when shares fall
  'equity:govBond': 0.00,    // the average of a relationship that flips sign
  'equity:gold': 0.05,
  'corpBond:govBond': 0.85,  // same interest-rate risk, different issuer
  'corpBond:gold': 0.10,
  'govBond:gold': 0.15
  // Cash is left uncorrelated with everything, by construction.
};

function correlation(keyA, keyB) {
  if (keyA === keyB) return 1;
  const forward = CORRELATIONS[`${keyA}:${keyB}`];
  if (forward !== undefined) return forward;
  const reverse = CORRELATIONS[`${keyB}:${keyA}`];
  return reverse !== undefined ? reverse : 0;
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

// Portfolio volatility from the full covariance sum: every weighted variance
// plus every cross term. Set every correlation to 0 and this reduces to the
// square root of the summed squares, which is what the model used before.
function portfolioVolatility(weights) {
  let variance = 0;

  ASSETS.forEach(a => {
    ASSETS.forEach(b => {
      variance += weights[a.key] * weights[b.key] *
        a.volatility * b.volatility * correlation(a.key, b.key);
    });
  });

  return Math.sqrt(variance);
}

// The rate money actually grows at, given that it also swings on the way.
// Volatility drags the compound rate below the arithmetic mean by roughly half
// the variance. The simulation must be fed the arithmetic mean, but anything
// that claims to show a typical outcome must use this.
function compoundReturn(arithmeticReturn, volatility) {
  return arithmeticReturn - (volatility * volatility) / 2;
}

// Money-weighted annual return, also called the internal rate of return: the
// single rate that makes every cash flow balance. Contributions land at the end
// of each year, so a dollar paid in the final year has had no time to grow.
// Dividing the final value by the sum of contributions treats every one of them
// as paid on day one, and understates the return by more than a point.
function moneyWeightedReturn(finalValue, years, startValue, annualContribution) {
  const netPresentValue = rate => {
    let value = -startValue;
    for (let year = 1; year <= years; year++) {
      value -= annualContribution / Math.pow(1 + rate, year);
    }
    return value + finalValue / Math.pow(1 + rate, years);
  };

  // Net present value falls as the rate rises, so the root can be bracketed.
  let low = -0.9999;
  let high = 1;
  if (netPresentValue(low) <= 0) return low;
  if (netPresentValue(high) >= 0) return high;

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    if (netPresentValue(mid) > 0) low = mid; else high = mid;
  }

  return (low + high) / 2;
}
