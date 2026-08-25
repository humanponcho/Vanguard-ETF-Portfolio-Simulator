# Native iOS port — specification

Working document for rebuilding this simulator as a native Swift/SwiftUI app.
The full staged tutorial lives at:

https://claude.ai/code/artifact/12f9def3-9e10-4a36-a7fa-74aff7e52b66

This file records the decisions; the tutorial records the method.

---

## 1. Name — decided: **Ballast**

"Vanguard" cannot ship. It is a live trademark, it implies an affiliation that
does not exist, and App Store Review guideline 5.2.1 covers exactly this.

**Chosen: Ballast.** The weight that steadies a hull — what a bond and gold
sleeve does to an equity portfolio. Bundle ID `com.humanponcho.Ballast`,
module name `Ballast`, engine package `SimulationKit` (name-agnostic on
purpose, so a later rename touches the app target only).

Considered and rejected:

| Name | Why not |
|---

## 2. Asset roster

Generic instruments, no provider named. Physical gold replaces DigiGold.
"Was" column is the figure currently hardcoded in `js/simulation.js`.

| Asset | Return | Was | Vol | Was | Ongoing p.a. | Entry | Exit | Income | CGT-exempt |
|---|---|---|---|---|---|---|---|---|---|
| US Large-Cap Equity ETF (Acc) | 7.5% | 9.0% | 18% | — | 0.07% | 0.10% | — | No | No |
| Corporate Bond ETF (Dist) | 6.0% | — | 8% | — | 0.10% | 0.10% | — | Yes | No |
| Government Bond ETF (Dist) | 5.0% | — | 7% | — | 0.09% | 0.10% | — | Yes | No |
| Physical Gold (allocated/coins) | 5.0% | 10.0% | 16% | 30% | 0.60% | 2.0% | 1.0% | No | Optional |
| Cash (GBP) | 2.0% | — | 1% | — | — | — | — | No | No |

Rationale for the changes:

- **Gold at 10% / 30% is not defensible.** 10% is an artefact of measuring from
  1971 — a one-off repricing that cannot recur. Realised annual vol is nearer
  15–16%, not 30%.
- **Equity at 9% is the optimistic end.** Long-run US nominal returns support
  it; forward-looking estimates from current valuations do not. 7.5% is a
  defensible middle. This one is a judgement call — make it deliberately.
- **Physical gold needs cost fields the current model lacks.** A 2% dealer
  spread on purchase and 1% on sale are one-off costs, not annual drag. The
  current `Asset` shape can only express annual cost, which is why DigiGold's
  documented 0.50% buy fee is never actually applied anywhere in the code.

### UK detail worth modelling

Britannia and Sovereign coins are legal tender and therefore **CGT-exempt**;
bars and foreign coins are not. Investment-grade gold is VAT-exempt either way.
A `cgtExempt: Bool` on the asset type makes the CGT screen model something real.

---

## 3. Modelling defects to fix during the port, not carry over

1. **Analytical band vs simulated table.** The three overlay lines use
   `µ ± 1.645σ/√T`; the results table uses percentiles of the simulated
   distribution. Two methods, one screen, same percentile labels. Fix: derive
   the band from the ensemble (per-month sort across runs).
2. **Normal returns can go below −100%.** With the whole portfolio in gold at
   30% vol and 9.5% mean, −100% is a 3.65σ event ≈ 1 in 7,600 draws; a 200-run
   × 40-year simulation makes 8,000 draws. Fix: lognormal, moment-matched.
3. **No correlation.** `naiveVolatility` sums squared weighted vols, i.e.
   assumes independence. Understates risk (equities/corp bonds co-move) *and*
   understates gold's diversification benefit. Commit a73cac7 says Cholesky was
   added; no correlation code survives in the tree. Fix: rebuild it, with tests.
4. **Annual contribution lumps.** Input is labelled monthly, then added as
   `monthly * 12` once a year — denying eleven months of growth to every
   contribution. Fix: monthly time steps.
5. **`Math.random()` can return exactly 0** → `log(0)` → NaN poisons the path.
   Fix: resample on zero.
6. **Percentile by `Math.floor(p * n)`** is biased at the tails. Fix: linear
   interpolation between ranks.
7. **Division by zero** in the closed-form growth curve when the net portfolio
   return is exactly 0. The `|| 0.001` guard is a truthiness hack that fires
   only on exact zero. Removed entirely by fix 1.
8. **Inflation is post-hoc only** — applied to displayed returns, contributions
   never indexed. Fix: make indexation an explicit input.
9. **`data/assumptions.json` is dead code.** Nothing loads it; the same numbers
   are hardcoded in `js/simulation.js:44-58`. Resolve before a second platform
   creates a third copy.

---

## 4. Architecture

    SimulationKit (Swift package)   ──▶  App target (SwiftUI)
      Asset, Portfolio, Engine, RNG  ──▶  Widget extension (WidgetKit)
      no UIKit, no SwiftUI                Tests (Swift Testing)
      100% unit-tested

The package/app split is the load-bearing decision: the engine compiles in
seconds, tests without a simulator, and is reused by the widget.

---

## 5. Stage index

| | Part I · Ground | | Part III · App |
|---|---|---|---|
| 00 | Decide the product | 07 | First screen |
| 01 | Toolchain and first Swift | 08 | State and money |
| | **Part II · Engine** | 09 | Swift Charts |
| 02 | Types, not variables | 10 | Porting the palette |
| 03 | Testable randomness | 11 | Navigation |
| 04 | The simulation loop | 12 | Concurrency |
| 05 | Golden vectors | 13 | Saved scenarios |
| 06 | Correlation | | **Part IV · Ship** |
| | | 14 | Accessibility |
| | | 15 | Earning Guideline 4.2 |
| | | 16 | Submission |

Each stage ends with something that builds, runs and gets committed.

---

## 6. Notes

- Xcode is macOS-only. Swift Playgrounds on iPad can build and submit to the
  App Store and supports SwiftUI and Swift Charts — a real fallback path.
- The `light-dark()` tokens in `css/styles.css` map 1:1 onto Asset Catalog
  colour sets with Any/Dark appearances. `js/theme.js` (119 lines of browser
  workaround) has no equivalent and gets deleted.
- The two rules from STYLE.md carry over and nothing in Xcode enforces them:
  green means a gain and red means a loss (so the accent stays amber), and the
  chart series order is a validated colourblind-separation property — pin it
  via `chartForegroundStyleScale`.
- `tools/contrast-audit.py` still works if pointed at a CSS file generated from
  the catalog values.
- The GitHub Pages workflow already in this repo can host the privacy policy
  and support URLs that App Store Connect requires.

Stages 00 and 16 touch trademark and regulatory ground. This is engineering
guidance, not legal advice.
