// Design tokens and primitives shared by every SVG in this repository.
// Change a value here, re-run the scripts in scripts/, and every asset follows.
//
// Rendering constraints (GitHub shows these SVGs through <img>):
//   • no web fonts, scripts or external resources: system font stacks only
//   • light/dark is chosen by <picture> in the README, so each theme is a file
//   • `max-width` media queries inside the SVG see the *image's* rendered
//     width, which is how every panel switches to a phone layout (see .compact)

export const fonts = {
  serif: "'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif",
  mono: "ui-monospace,'SF Mono','Cascadia Mono',Consolas,'Liberation Mono',Menlo,monospace",
};

// ── Colour ──────────────────────────────────────────────────────────────────
// One accent. Everything else is ink, muted ink, hairlines and a panel tint.
export const themes = {
  dark: {
    ink: '#E8E5DE', // warm off-white, not pure #fff
    muted: '#8B949E',
    faint: '#30363D', // hairlines, empty marks
    panel: '#151B23', // card surface, one step off GitHub's #0d1117
    panelLine: '#2A313B',
    accent: '#F0A04B', // signal amber
    accentTint: 'rgba(240,160,75,0.10)',
    // activity ramp: [0] is the empty day, [1..4] checked with the dataviz
    // validator (--ordinal); every active step clears 3:1 on #0d1117 and #22272e
    ramp: ['#262C34', '#9A6B38', '#B97A36', '#D68E3E', '#F5AE5E'],
  },
  light: {
    ink: '#1F2328',
    muted: '#656D76',
    faint: '#D0D7DE',
    panel: '#F6F8FA',
    panelLine: '#D8DEE4',
    accent: '#A84D17', // darkened from #B4531A so it clears 4.5:1 even on the tinted key node
    accentTint: 'rgba(168,77,23,0.06)',
    ramp: ['#D8DEE4', '#C8763A', '#A85E27', '#87461A', '#62300C'],
  },
};

// ── Type scale (px at the 880-wide drawing size) ────────────────────────────
// Wide layouts use `wide`; phone layouts use `compact`, sized so that at a
// ~360px render (scale ≈ 0.41) the smallest text is still ≈ 10px.
export const type = {
  wide: { label: 11, small: 12.5, body: 15, lead: 20, title: 40, display: 84, metric: 56 },
  compact: { label: 24, body: 30, title: 56, display: 96, metric: 88 },
  track: { label: 1.6 }, // letter-spacing for uppercase mono labels
};

// ── Space ───────────────────────────────────────────────────────────────────
export const W = 880; // drawing width of every panel
export const space = { unit: 8, pad: 32, gap: 24, radius: 12 };

// ── Helpers ─────────────────────────────────────────────────────────────────
export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Conservative average glyph widths (em) so wrapped text never overruns,
// whichever serif or mono the reader's OS supplies.
const EM = { serif: 0.53, mono: 0.61 };
export const textWidth = (s, size, face = 'serif') => String(s).length * size * EM[face];

export function wrap(text, width, size, face = 'serif') {
  const max = Math.max(4, Math.floor(width / (size * EM[face])));
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if (line && (line + ' ' + word).length > max) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

// Multi-line <text>. Returns { svg, height }.
export function para(lines, { x, y, size, lead = 1.45, cls = 'serif', fill, extra = '' }) {
  const dy = size * lead;
  const svg = `<text x="${x}" y="${y}" class="${cls}" font-size="${size}" fill="${fill}" ${extra}>${lines
    .map((l, i) => `<tspan x="${x}" dy="${i ? dy : 0}">${esc(l)}</tspan>`)
    .join('')}</text>`;
  return { svg, height: lines.length * dy };
}

export const label = (t, x, y, text, { fill = t.muted, anchor = 'start', size = type.wide.label } = {}) =>
  `<text x="${x}" y="${y}" class="mono" font-size="${size}" letter-spacing="${type.track.label}" text-anchor="${anchor}" fill="${fill}">${esc(String(text).toUpperCase())}</text>`;

export const panelRect = (t, x, y, w, h) =>
  `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${space.radius}" fill="${t.panel}" stroke="${t.panelLine}"/>`;

export function chip(t, x, y, text, { accent = false } = {}) {
  const size = 11.5;
  const w = Math.round(textWidth(text, size, 'mono') + 18);
  return {
    svg: `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w}" height="22" rx="11" fill="${accent ? t.accentTint : 'none'}" stroke="${accent ? t.accent : t.faint}"/><text x="${x + w / 2 + 0.5}" y="${y + 15.5}" class="mono" font-size="${size}" text-anchor="middle" fill="${accent ? t.accent : t.ink}">${esc(text)}</text>`,
    w,
  };
}

// Wraps body markup in a self-contained, accessible SVG document.
// `.wide` / `.compact` groups are the two layouts; `.fine` is detail that
// disappears on phones.
export function svgDoc({ width = W, height, title, desc, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>
.serif{font-family:${fonts.serif}}
.mono{font-family:${fonts.mono}}
.compact{display:none}
@media (max-width:600px){.fine,.wide{display:none}.compact{display:inline}}
</style>
${body}
</svg>
`;
}
