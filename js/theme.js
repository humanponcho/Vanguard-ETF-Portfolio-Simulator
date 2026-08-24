/* ============================================================
   Theme bridge — CSS tokens for D3

   Every colour in this app is declared once, as a light-dark()
   token in css/styles.css. D3 writes SVG attributes, which cannot
   read a CSS custom property, so this file resolves the tokens to
   concrete values and hands them to the chart code.

   Read them through THEME.*, never as a hex literal in a chart. A
   hard-coded colour in a chart is a colour that does not follow
   the reader's light/dark setting.
   ============================================================ */

const TOKENS = {
  panel:      '--panel',
  glass:      '--glass',
  g0:         '--g0',
  g1:         '--g1',
  g2:         '--g2',
  g3:         '--g3',
  g4:         '--g4',
  g5:         '--g5',
  accent:     '--signal-note',
  ok:         '--signal-ok',
  err:        '--signal-err',
  warn:       '--signal-warn',
  onSeriesDark:  '--on-series-dark',
  onSeriesLight: '--on-series-light',
  series1: '--series-1',
  series2: '--series-2',
  series3: '--series-3',
  series4: '--series-4',
  series5: '--series-5',
};

const THEME = {};

/**
 * Resolve a token to a concrete colour.
 *
 * getPropertyValue() on a custom property returns the literal text it was
 * declared with — for these tokens that is the string "light-dark(#a, #b)",
 * not a colour. Custom properties are substitution-only; light-dark() is not
 * resolved until the value is used in a real property.
 *
 * SVG happens to accept the literal and paint it correctly, which hides the
 * problem — but inkOn() has to do arithmetic on the value, and cannot parse
 * that string. So each token is assigned to a probe element's color and read
 * back, which forces the browser to resolve it to rgb() for the live scheme.
 */
let probe = null;

function readTokens() {
  if (!probe) {
    probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
    document.body.appendChild(probe);
  }
  for (const [key, prop] of Object.entries(TOKENS)) {
    probe.style.color = '';
    probe.style.color = `var(${prop})`;
    THEME[key] = getComputedStyle(probe).color;
  }
  // Fixed order. The palette was validated in this order — see the
  // --series-* comment in styles.css before changing it.
  THEME.series = [THEME.series1, THEME.series2, THEME.series3, THEME.series4, THEME.series5];
}

/**
 * Pick the label ink for text drawn ON a series fill.
 *
 * No single ink clears 4.5:1 on all ten series values: near-black
 * reaches only 2.19:1 on light-scheme violet. So the choice is made
 * per slice, from the slice's own relative luminance, rather than
 * once per scheme.
 */
function inkOn(fill) {
  const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(fill);
  const hex = /^#?([0-9a-f]{6})$/i.exec(String(fill).trim());
  let channels;
  if (rgb) {
    channels = [+rgb[1], +rgb[2], +rgb[3]];
  } else if (hex) {
    const n = parseInt(hex[1], 16);
    channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  } else {
    return THEME.onSeriesLight;
  }
  const srgb = channels.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  const onDark  = (lum + 0.05) / 0.05;          // vs near-black
  const onLight = 1.05 / (lum + 0.05);          // vs near-white
  return onDark >= onLight ? THEME.onSeriesDark : THEME.onSeriesLight;
}

readTokens();

/* Every chart render calls this first, so a redraw for ANY reason picks up
   the live scheme. That matters because the listener below is the only
   thing watching for an OS appearance change, and a chart redrawn by a
   button press must not repaint itself with stale values. */
function refreshTheme() {
  readTokens();
}

/* Re-resolve and redraw when the reader changes their OS appearance.
   The CSS swaps on its own; the SVG attributes do not, so without
   this the charts would keep the previous scheme's colours. */
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    readTokens();
    if (typeof createPieChart === 'function') createPieChart();
    if (typeof generateSimulation === 'function') generateSimulation();
  });
}
