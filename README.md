# README: Ballast

## Overview
**Ballast** is an interactive web-based tool designed to help investors simulate and optimize their portfolio allocations across generic asset classes. It provides insights into potential portfolio growth, risk levels, and currency exposure over customizable time horizons.

---

## Features

### **1. Investment Allocation**
- Allocate funds across five asset classes:
  - **US Equity**: US large-cap shares.
  - **Corporate Bonds**: Fixed income issued by companies.
  - **US Treasuries**: Fixed income issued by the US government.
  - **Gold**: A non-yielding store of value.
  - **Cash**: Liquid deposits.
- Use sliders or numeric inputs to dynamically adjust allocations.

The five holdings are defined in one place, [js/assets.js](js/assets.js). It sets
each holding's label, expected return, volatility, expense ratio and default
amount, and it drives the sliders, the pie chart, the methodology table and the
blended maths. To change a holding, edit that file only.

The asset classes are generic by design. They model categories, not any named
fund, provider or product.

### **2. Portfolio Simulation**
- Customize simulation parameters:
  - **Time Horizon**: Choose between 1–40 years.
  - **Monthly Contributions**: Specify monthly investment amounts in USD.
  - **Number of Simulations**: Run between 50–1000 Monte Carlo simulations.
- View results for optimistic, median, and pessimistic scenarios:
  - Final portfolio value (USD).
  - Annualized returns.

### **3. Visualization Tools**
- **Pie Chart**: Visualize current asset allocation percentages.
- **Simulation Chart**: Analyze projected portfolio growth over time.

### **4. Risk and Return Analysis**
- With the default allocation and a 15% withholding rate, the model reports:
  - Expected annual return, net of fees and withholding: **6.2%**.
  - Expected volatility: **8.6%**.
- Categorizes portfolio risk from the US Equity share: 70% or more is
  "Aggressive", 50% or more is "Moderate", below that is "Conservative".

### **5. Tax and Inflation**
- Dividend withholding tax reduces the gross return of the distributing holdings.
- Capital gains tax is estimated on the median outcome at a rate you set.
- Displayed annualised returns are deflated to real terms.

---

## How to Use

### **Step 1: Allocate Investments**
1. Adjust the sliders or input numeric values for each asset class.
2. Ensure the total portfolio value matches your desired investment amount.

### **Step 2: Set Simulation Parameters**
1. Enter your preferred investment time horizon (years).
2. Specify monthly contributions in USD.
3. Choose the number of simulations to run.

### **Step 3: Run Simulation**
1. Click the "Run Simulation" button to generate portfolio projections.
2. Review percentile-based results for final portfolio value and annualized returns.

### **Step 4: Analyze Results**
1. Examine the pie chart for asset allocation breakdowns.
2. Study simulation results to understand potential growth scenarios.

---

## Recommendations

### Risk Profiles
Adjust allocations based on your risk tolerance:
- **Conservative**:
  - Lower equity exposure (US Equity at 30%).
  - Higher bond allocation (Corporate Bonds at 30%, US Treasuries at 20%).
- **Moderate**:
  - Balanced equity and bond exposure (US Equity at 50%, Corporate Bonds at
    25%, US Treasuries at 15%).
- **Aggressive**:
  - Higher equity exposure (US Equity at 70%).

These three mixes are defined as `PRESETS` in [js/assets.js](js/assets.js) and
are shown in the page's analysis panel.

---

## Technical Details

### Dependencies
- HTML5/CSS3 for layout and styling.
- JavaScript for interactivity and calculations.
- D3.js for data visualization (pie charts and simulation graphs).

### Local Storage
The simulator uses local storage to save user inputs for investment allocations, ensuring values persist across sessions.

---

## Styling

The colour tokens, the chart palette and the contrast floor are documented in
[STYLE.md](STYLE.md). Read it before you change [css/styles.css](css/styles.css)
or any chart colour.

This app uses the shared paper/phosphor token system: one `light-dark()` value
per colour, e-ink paper in the light scheme and CRT phosphor in the dark one. It
follows the reader's operating system appearance — there is no in-app switch.

Two rules matter more than the rest:

- **No hard-coded colour outside `:root`** — including in the D3 code. Charts
  read their colours through `THEME.*` in [js/theme.js](js/theme.js), so they
  follow the scheme like everything else.
- **The chart series order is a safety property, not a preference.** It was
  chosen by validating every ordering for colourblind separation in both
  schemes. Re-ordering the slots voids that.

[tools/contrast-audit.py](tools/contrast-audit.py) checks every colour against
the surface it lands on. It must exit 0 before you commit a stylesheet change:

```bash
python3 tools/contrast-audit.py css/styles.css
```

---

## Deploy to GitHub Pages

A workflow at `.github/workflows/deploy.yml` publishes on every push to `master`.
In the repo, go to **Settings → Pages → Build and deployment → Source** and choose
**GitHub Actions**. The site is then served at
`https://<user>.github.io/<repository-name>/`.

There is no build step. The repository root is uploaded as-is — nothing is
compiled, bundled or minified — so every asset path is relative and the site
works from any subpath.

---

## Known Limitations
1. Asset returns are modelled as independent — no correlation matrix is applied.
2. Returns are drawn from a normal distribution, so fat tails are underestimated.
3. Limited asset coverage — no property, emerging markets, or sector splits.
4. Simplistic risk assessment — advanced metrics like Sharpe ratio or VaR are not included.
5. Exchange rate movement is not modelled. All figures are in a single currency.

---

## Future Enhancements
1. Expand asset class options for greater diversification.
2. Apply a correlation matrix instead of assuming independent returns.
3. Model exchange rate movement for holdings priced in another currency.

---

## License
This simulator is provided as-is for educational purposes only and does not constitute financial advice. Use it responsibly to inform your investment decisions.

---



