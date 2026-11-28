// Shared visual language for every SVG in this repository.
// Change a colour here, re-run the scripts in scripts/, and every asset follows.
//
// Backgrounds are left transparent on purpose: the artwork sits directly on
// GitHub's page (dark #0d1117, dimmed #22272e, light #ffffff), so it reads as
// part of the page rather than a pasted-in card.

export const fonts = {
  // System faces only. SVGs inside <img> cannot fetch web fonts on GitHub,
  // so these stacks pick a good local serif / mono on every major OS.
  serif: "'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif",
  mono: "ui-monospace,'SF Mono','Cascadia Mono',Consolas,'Liberation Mono',Menlo,monospace",
};

export const themes = {
  dark: {
    ink: '#E8E5DE', // warm off-white, not pure #fff
    muted: '#8B949E',
    faint: '#30363D',
    accent: '#F0A04B', // the single accent: signal amber
    // sequential ramp for activity: [0] is the empty day, [1..4] are checked
    // with the dataviz validator (--ordinal) against GitHub's own backgrounds;
    // every active step clears 3:1 (WCAG 1.4.11) on dark #0d1117 and dimmed #22272e
    ramp: ['#262C34', '#9A6B38', '#B97A36', '#D68E3E', '#F5AE5E'],
  },
  light: {
    ink: '#1F2328',
    muted: '#656D76',
    faint: '#D0D7DE',
    accent: '#B4531A',
    ramp: ['#D8DEE4', '#C8763A', '#A85E27', '#87461A', '#62300C'],
  },
};

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Wraps body markup in a self-contained, accessible SVG document.
export function svgDoc({ width, height, title, desc, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>
.serif{font-family:${fonts.serif}}
.mono{font-family:${fonts.mono}}
@media (max-width:600px){.fine{display:none}}
</style>
${body}
</svg>
`;
}
