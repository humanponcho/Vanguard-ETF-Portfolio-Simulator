# README: Vanguard ETF Portfolio Simulator

## Overview
The **Vanguard ETF Portfolio Simulator** is an interactive web-based tool designed to help investors simulate and optimize their portfolio allocations across various asset classes. It provides insights into potential portfolio growth, risk levels, and currency exposure over customizable time horizons.

---

## Features

### **1. Investment Allocation**
- Allocate funds across five asset categories:
  - **S&P 500 UCITS ETF (VUAG)**: US large-cap equities.
  - **USD Corporate Bond UCITS ETF (VUCP)**: Fixed income corporate bonds.
  - **USD Treasury Bond UCITS ETF (VUTY)**: Fixed income government bonds.
  - **DigiGold**: GBP-denominated digital gold.
  - **Cash**: Liquid GBP assets.
- Use sliders or numeric inputs to dynamically adjust allocations.

### **2. Portfolio Simulation**
- Customize simulation parameters:
  - **Time Horizon**: Choose between 1–40 years.
  - **Monthly Contributions**: Specify monthly investment amounts in GBP.
  - **Number of Simulations**: Run between 50–1000 Monte Carlo simulations.
- View results for optimistic, median, and pessimistic scenarios:
  - Final portfolio value (GBP).
  - Annualized returns.

### **3. Visualization Tools**
- **Pie Chart**: Visualize current asset allocation percentages.
- **Simulation Chart**: Analyze projected portfolio growth over time.

### **4. Risk and Return Analysis**
- Historical data estimates:
  - Expected annual return: **6.3%**.
  - Expected volatility: **11.2%**.
- Categorizes portfolio risk as "Moderate."

### **5. Currency Risk Insights**
- Highlights the impact of GBP/USD exchange rate fluctuations on USD-denominated assets.
- Provides hedging recommendations for reducing FX volatility.

---

## How to Use

### **Step 1: Allocate Investments**
1. Adjust the sliders or input numeric values for each asset class.
2. Ensure the total portfolio value matches your desired investment amount.

### **Step 2: Set Simulation Parameters**
1. Enter your preferred investment time horizon (years).
2. Specify monthly contributions in GBP.
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
  - Lower equity exposure (e.g., VUAG at 30%).
  - Higher bond allocation (e.g., VUCP at 30%, VUTY at 20%).
- **Moderate**:
  - Balanced equity and bond exposure (e.g., VUAG at 50%, VUCP at 20%, VUTY at 15%).
- **Aggressive**:
  - Higher equity exposure (e.g., VUAG at 70%).

### Currency Hedging
To reduce GBP/USD exchange rate risks:
- Consider currency-hedged ETFs or UK/GBP-denominated bond funds.

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
`https://<user>.github.io/Vanguard-ETF-Portfolio-Simulator/`.

There is no build step. The repository root is uploaded as-is — nothing is
compiled, bundled or minified — so every asset path is relative and the site
works from any subpath.

---

## Known Limitations
1. Does not adjust for inflation or tax implications.
2. Limited asset coverage—missing options like REITs, emerging markets, or sector-specific ETFs.
3. Simplistic risk assessment—advanced metrics like Sharpe ratio or VaR are not included.

---

## Future Enhancements
1. Expand asset class options for greater diversification.
2. Integrate real-time market data for live updates on ETF prices and FX rates.
3. Add inflation-adjusted results and tax considerations for more accurate projections.

---

## License
This simulator is provided as-is for educational purposes only and does not constitute financial advice. Use it responsibly to inform your investment decisions.

---



