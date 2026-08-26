# Visual System — Ballast

How to write CSS and chart code for this project. It covers the design tokens,
the colour rules, the chart palette, and the contrast floor every colour must
clear.

For *what* the project is, read [README.md](README.md).

## Where this came from

This app uses the **shared paper/phosphor token system** used across a family of
sibling apps (the questionnaire labs). The reference implementation is
`docker-questionnaire-lab`.

Before the port this app had its own single-scheme "Phosphor Green CRT" sheet:
`--bg-void`, `--green-primary`, `--magenta`, scanlines, a flicker animation, and
glow on every piece of text. **None of that survives.** If you are reading an
older commit, do not carry a value forward from it.

Three changes are worth understanding before you touch anything:

1. **The accent left green.** See [Why the accent is amber](#why-the-accent-is-amber).
2. **Scanlines and flicker are gone.** A 2px repeating pattern over a table of
   currency figures costs more legibility than the atmosphere is worth, and
   neither effect means anything in the light scheme. The vignette stayed.
3. **Glow no longer sits on body text.** Every glow now composes from
   `--bloom-*`, which is transparent on paper, so glows self-erase in the light
   scheme with no scheme-specific rule anywhere.

## Design tokens

Every colour lives in one `:root` block at the top of
[css/styles.css](css/styles.css). A **token** is a CSS custom property — a named
value you write once and reference everywhere with `var()`.

Every colour token uses `light-dark()`. That CSS function takes two values. The
browser picks the first on a light background and the second on a dark one. The
page declares `color-scheme: light dark`, so it follows the reader's operating
system setting. There is no in-app theme switch.

```css
--g3: light-dark(#3a3a34, #b8b7b0);   /* one declaration, both schemes */
```

### Token families

| Family | Meaning | Members |
| --- | --- | --- |
| Background scale | Surfaces, base → most raised | `--black`, `--deep`, `--panel`, `--glass`, `--g0` |
| Ink scale | Foreground, strongest → faintest | `--g1` … `--g5` |
| Signal | Gain, loss, caution, accent | `--signal-ok`, `--signal-err`, `--signal-warn`, `--signal-err-deep`, `--signal-note` |
| Series | Categorical chart palette | `--series-1` … `--series-5` |
| On-series ink | Text drawn on a series fill | `--on-series-dark`, `--on-series-light` |
| Wash | Translucent settled-state fills | `--wash-ok`, `--wash-err` |
| Overlay | Dark-scheme atmosphere | `--overlay-vignette` |
| Bloom | Glow colours, transparent on paper | `--bloom-30`, `--bloom-50` |
| Glow helpers | Ready-made shadow values | `--glow-sm`, `--glow-md`, `--glow-lg` |
| Type | Font stacks | `--mono`, `--display`, `--body` |

### The ink scale is ordinal

`--g1` always means "strongest ink". On paper it is near-black. On a dark screen
it is near-white. Pick a token by its **rank**, never by the colour it happens to
be in the scheme you are looking at.

```css
/* ✅ Do */
h1 { color: var(--g1); }

/* ❌ Don't — this breaks the moment the scheme flips */
h1 { color: #0d0d0a; }
```

Any hard-coded colour outside `:root` is a bug. That includes chart code — see
[Charts read tokens](#charts-read-tokens).

## Signal colours

| Token | Meaning | Used by |
| --- | --- | --- |
| `--signal-ok` | A gain | Optimistic projection line, positive real return |
| `--signal-err` | A loss | Pessimistic projection line, negative real return |
| `--signal-warn` | Caution | The disclaimer rule |
| `--signal-err-deep` | A firmer red, **shapes only** | Declared for consistency with the sibling apps; no adjacent-warn marks here yet |
| `--signal-note` | The accent | Headings' eyebrow, focus rings, slider thumbs, primary buttons, the total figure, inline code, histogram bars |

### Why the accent is amber

In a projection tool **green means a gain and red means a loss**. That convention
is load-bearing: it is doing real work in the results table and on the projection
chart. An accent that is also green would make the most-repeated colour in the
interface ambiguous — is this chrome, or is it a gain?

So the accent moved off green, to amber — the *other* classic phosphor, which
keeps the CRT character the app was built around without spending green on
decoration.

Both accent values are the **same colour**: hue 37°, saturation 42%, separated
only by lightness (29% on paper, 60% on phosphor).

```css
--signal-note: light-dark(#6a522b, #c4a36e);
```

**If you retune this token, move the lightness only.** Keep the hue and the
saturation locked. Change either on a single side and the accent stops looking
like one colour across the two schemes.

## The chart series palette

`--series-1` … `--series-5` are a **categorical** palette: they encode *which
holding*, not how much and not how good. They are deliberately clear of the
signal hues — a holding must never borrow the colour that means "gain".

| Slot | Holding | Hue | Light | Dark |
| --- | --- | --- | --- | --- |
| 1 | US Equity | blue | `#2a78d6` | `#3987e5` |
| 2 | Corporate Bonds | aqua | `#1baf7a` | `#199e70` |
| 3 | US Treasuries | violet | `#4a3aa7` | `#9085e9` |
| 4 | Gold | gold | `#eda100` | `#c98500` |
| 5 | Cash | magenta | `#e87ba4` | `#d55181` |

Three rules govern this table.

**The order is the colourblind-safety mechanism, not a preference.** Every
ordering of these five hues was run through a palette validator; this is one of
the orderings that clears the adjacent-pair floors in *both* schemes — worst pair
ΔE 16.3 light and 13.2 dark (OKLab ×100, target 8). Re-ordering the slots voids
that result.

**Colour follows the holding, never its size.** A slider that drops a holding to
zero must not repaint the survivors. The slots are indexed by position in a fixed
list, never assigned by sort order.

**A sixth holding means revalidating from scratch.** Do not invent a sixth hue.
Five was already at the limit: the full set cannot clear the stricter
*all-pairs* floors, which is acceptable only because every slice carries a direct
percentage label and the legend names each holding in ink.

That last point is a standing obligation. Three of the light steps sit below 3:1
against `--panel`. That is permitted **only** because identity is never carried
by colour alone here. If you ever remove the slice labels or the legend text, the
palette becomes non-compliant.

### Text on a series fill

No single ink clears 4.5:1 on all ten series values — near-black reaches only
2.19:1 on light-scheme violet. So the label ink is chosen **per slice** from the
slice's own luminance, not once per scheme. `inkOn()` in
[js/theme.js](js/theme.js) does that. Use it for any text you draw on a coloured
mark.

Legend and axis text wear ink tokens (`--g2`, `--g3`, `--g4`). **Text never wears
the series colour** — the swatch beside it carries the identity.

## Charts read tokens

D3 writes SVG attributes, and an SVG attribute cannot read a CSS custom property.
[js/theme.js](js/theme.js) bridges that: it resolves the tokens and exposes them
as `THEME.*`.

```js
.attr("fill", THEME.accent)     // ✅
.attr("fill", "#00ff41")        // ❌ this colour will not follow the scheme
```

One subtlety worth knowing before you change that file. Reading a custom property
with `getPropertyValue()` returns **the literal text it was declared with** —
here, the string `"light-dark(#a, #b)"`, not a colour. Custom properties are
substitution-only; `light-dark()` is not resolved until the value is used in a
real property. SVG happens to accept the literal string and paint it correctly,
which hides the problem completely — until something tries to do arithmetic on
the value, as `inkOn()` does, and silently gets a fallback.

So `readTokens()` assigns each token to a hidden probe element's `color` and
reads it back, which forces the browser to resolve it to `rgb()` for the live
scheme.

Every render calls `refreshTheme()` first. A `matchMedia` listener also redraws
on an OS appearance change; calling it per render means a chart redrawn by a
button press can never repaint itself with stale values.

## The contrast floor

Text must reach **4.5:1** against the background behind it — the WCAG AA
threshold for body text. Shapes that carry meaning without text need **3:1**.

Measure against the surface the text actually lands on, not the page background.

**The `--series-*` tokens are exempt from this script.** A categorical chart
palette is judged on perceptual separation between series, not on WCAG contrast
against a surface. Validate that palette with a data-viz palette validator
instead.

### The auditor

[tools/contrast-audit.py](tools/contrast-audit.py) reads the token values
straight from the stylesheet and checks every pairing. It needs no build step and
no npm.

```bash
python3 tools/contrast-audit.py css/styles.css
```

It exits 0 on a clean sheet and 1 with lightness-only fixes otherwise. The `PLAN`
block near the top maps each token to the surfaces its text lands on. **That map
is declared by hand on purpose** — which surface a colour sits on is a fact about
the markup, not something you can infer from CSS. If you add a component that
puts a signal colour on a new surface, add it to `PLAN` in the same commit.

## Type

| Token | Family | Job |
| --- | --- | --- |
| `--mono` | Share Tech Mono | Figures, table cells, instrument labels, chart text |
| `--display` | Orbitron | Headings |
| `--body` | Rajdhani | Prose and interface copy |

Every stack declares a generic fallback, so a blocked font CDN degrades instead
of dropping to Times. The fonts load from a `<link>` in
[index.html](index.html), not an `@import` — an `@import` blocks the CSS parse
until it resolves, and `preconnect` cannot help it.

Currency figures use `font-variant-numeric: tabular-nums` and right-align, so
columns line up digit for digit.

## Comments

Write the comment that explains **why**, not what. The declaration already says
what. A reader who wants to change a value needs to know what constraint the
current value satisfies, so they know whether their change breaks it.

## Checklist before you commit

- [ ] No hard-coded colour outside `:root` — in CSS **or** in chart code.
- [ ] Ink tokens picked by rank, not by appearance.
- [ ] `PLAN` in `tools/contrast-audit.py` updated if a colour landed on a new surface.
- [ ] `python3 tools/contrast-audit.py css/styles.css` exits 0.
- [ ] Chart series still indexed by position, not by sort order.
- [ ] Every coloured mark still has a label or legend entry beside it.
- [ ] Glow effects composed from `--bloom-*`, not from a scheme override.
- [ ] Checked in both schemes by toggling the operating system appearance.
