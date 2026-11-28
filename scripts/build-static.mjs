// Draws every static panel from scripts/content.mjs and regenerates README.md.
//   node scripts/build-static.mjs
// The activity chart is drawn separately by build-activity.mjs (daily, in CI);
// its block in the README is carried over untouched.
//
// Every panel holds two compositions in one file: `.wide` for desktop and
// `.compact`, a large-type layout that takes over when the image renders
// narrower than 600px (phones). Both share the same viewBox.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { themes, type, space, W, esc, wrap, para, label, panelRect, chip, textWidth, svgDoc } from './theme.mjs';
import { person, principles, now, projects, also, path } from './content.mjs';

const { pad, gap } = space;
const tw = type.wide, tc = type.compact;

// ── Hero ────────────────────────────────────────────────────────────────────
function hero(t) {
  const H = 392;
  // ruler along the top rule, one tick in accent
  let ticks = '';
  for (let x = 0; x <= W; x += 20)
    ticks += `<line x1="${x + 0.5}" y1="40" x2="${x + 0.5}" y2="${x % 100 ? 44 : 48}" stroke="${t.faint}"/>`;
  ticks += `<line x1="140.5" y1="40" x2="140.5" y2="52" stroke="${t.accent}"/>`;

  // spec card
  const sx = 600, sy = 76, sw = W - sx, rowH = 34;
  let spec = panelRect(t, sx, sy, sw, rowH * person.spec.length + 12);
  person.spec.forEach(([k, v], i) => {
    const y = sy + 6 + i * rowH;
    if (i) spec += `<line x1="${sx + 16}" y1="${y + 0.5}" x2="${W - 16}" y2="${y + 0.5}" stroke="${t.panelLine}"/>`;
    spec += label(t, sx + 18, y + 22, k) + `<text x="${W - 18}" y="${y + 22}" class="mono" font-size="12.5" text-anchor="end" fill="${t.ink}">${esc(v)}</text>`;
  });

  const tag = para(wrap(person.tagline, 560, tw.lead), { x: 0, y: 206, size: tw.lead, lead: 1.4, fill: t.ink, extra: 'font-style="italic" opacity="0.9"' });

  // principles band
  const colW = (W - 2 * gap) / 3;
  let band = `<line x1="0" y1="282.5" x2="${W}" y2="282.5" stroke="${t.faint}"/>`;
  principles.forEach((p, i) => {
    const x = i * (colW + gap);
    band += `<text x="${x}" y="314" class="mono" font-size="${tw.label}" fill="${t.accent}">${String(i + 1).padStart(2, '0')}</text>`;
    band += `<text x="${x + 28}" y="314" class="serif" font-size="18" fill="${t.ink}">${esc(p.title)}</text>`;
    band += para(wrap(p.body, colW - 28, 13.5), { x: x + 28, y: 338, size: 13.5, fill: t.muted }).svg;
  });

  const wide = `<g class="wide">
<defs>
  <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${t.muted}"/></pattern>
  <radialGradient id="fade" cx="0.75" cy="0.35" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <mask id="m"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
</defs>
<rect x="380" y="52" width="${W - 380}" height="222" fill="url(#dots)" mask="url(#m)"/>
${label(t, 0, 22, `${person.location} · ${person.coords}`)}
${label(t, W, 22, `github.com/${person.handle}`, { anchor: 'end' })}
<line x1="0" y1="40.5" x2="${W}" y2="40.5" stroke="${t.faint}"/>
${ticks}
<text x="-4" y="160" class="serif" font-size="${tw.display}" letter-spacing="-1" fill="${t.ink}">${esc(person.name)}<tspan fill="${t.accent}">.</tspan></text>
${tag.svg}
${spec}
${band}
</g>`;

  const compact = `<g class="compact">
<line x1="0" y1="40.5" x2="${W}" y2="40.5" stroke="${t.faint}"/>
<text x="-4" y="160" class="serif" font-size="${tc.display}" letter-spacing="-1" fill="${t.ink}">${esc(person.name)}<tspan fill="${t.accent}">.</tspan></text>
${para(person.taglineCompact, { x: 0, y: 232, size: tc.body, lead: 1.35, fill: t.ink, extra: 'font-style="italic"' }).svg}
<line x1="0" y1="310.5" x2="${W}" y2="310.5" stroke="${t.faint}"/>
${label(t, 0, 356, person.spec.find(([k]) => k === 'Focus')[1], { size: tc.label, fill: t.accent })}
</g>`;

  return svgDoc({
    height: H,
    title: person.name,
    desc: `${person.tagline} ${person.spec.map(([k, v]) => `${k}: ${v}.`).join(' ')} Principles: ${principles.map((p) => `${p.title}: ${p.body}`).join(' ')}`,
    body: wide + compact,
  });
}

// ── Now: three status cards ─────────────────────────────────────────────────
function nowPanel(t) {
  const cw = (W - (now.length - 1) * gap) / now.length; // as many columns as cards
  const H = Math.max(150, 116 + (Math.max(...now.map((n) => wrap(n.body, cw - 44, 13.5).length)) - 1) * 13.5 * 1.45 + 40, 60 + now.length * 66);
  let wide = '<g class="wide">';
  now.forEach((n, i) => {
    const x = i * (cw + gap);
    wide += panelRect(t, x, 0, cw, H);
    wide += `<circle cx="${x + 26}" cy="${36}" r="3.5" fill="${t.accent}"/>` + label(t, x + 38, 40, n.label);
    wide += `<text x="${x + 22}" y="84" class="serif" font-size="23" fill="${t.ink}">${esc(n.title)}</text>`;
    wide += para(wrap(n.body, cw - 44, 13.5), { x: x + 22, y: 116, size: 13.5, fill: t.muted }).svg;
  });
  wide += '</g>';
  let compact = '<g class="compact">';
  now.forEach((n, i) => {
    const y = 52 + i * 66;
    compact += `<circle cx="10" cy="${y - 11}" r="7" fill="${t.accent}"/><text x="34" y="${y}" class="serif" font-size="34" fill="${t.ink}">${esc(n.title)}</text>`;
  });
  compact += '</g>';
  return svgDoc({
    height: H,
    title: 'Now',
    desc: now.map((n) => `${n.label}: ${n.title}. ${n.body}`).join(' '),
    body: wide + compact,
  });
}

// ── Case file ───────────────────────────────────────────────────────────────
function arrow(t, x1, x2, y, text) {
  return `<line x1="${x1}" y1="${y + 0.5}" x2="${x2 - 6}" y2="${y + 0.5}" stroke="${t.muted}"/>` +
    `<path d="M${x2 - 7} ${y - 3.5} L${x2} ${y + 0.5} L${x2 - 7} ${y + 4.5}z" fill="${t.muted}"/>` +
    (text ? `<text x="${(x1 + x2) / 2}" y="${y - 7}" class="mono" font-size="10.5" text-anchor="middle" fill="${t.muted}">${esc(text)}</text>` : '');
}

function caseFile(t, p, n) {
  const inner = W - 2 * pad;
  const cw = (inner - 2 * gap) / 3;
  const cols = [['Problem', p.problem], ['Key idea', p.idea], ['My part', p.part]].map(([k, v]) => [k, wrap(v, cw, 14.5)]);
  // the card grows with its longest column, so text can never run into the chips
  const chipsY = 362 + (Math.max(...cols.map(([, l]) => l.length)) - 1) * 14.5 * 1.42 + 30;
  const H = Math.max(500, chipsY + 52);
  let w = panelRect(t, 0, 0, W, H);

  // header: kicker, title, summary — metric on the right
  w += label(t, pad, 46, [`Case ${String(n).padStart(2, '0')}`, ...p.meta].join(' · '));
  w += `<text x="${pad}" y="96" class="serif" font-size="${tw.title}" fill="${t.ink}">${esc(p.title)}</text>`;
  w += para(wrap(p.summary, 640, 17), { x: pad, y: 128, size: 17, fill: t.muted, extra: 'font-style="italic"' }).svg;
  w += `<text x="${W - pad}" y="100" class="serif" font-size="${tw.metric}" text-anchor="end" fill="${t.accent}">${esc(p.metric.value)}</text>`;
  w += label(t, W - pad, 126, p.metric.label, { anchor: 'end' });
  w += `<line x1="${pad}" y1="160.5" x2="${W - pad}" y2="160.5" stroke="${t.faint}"/>`;

  // pipeline: nodes, labelled arrows, optional feedback loop on the key node
  const nw = 108, ng = (inner - 5 * nw) / 4, ny = 218, nh = 40, mid = ny + nh / 2;
  p.stages.forEach((s, i) => {
    const x = pad + i * (nw + ng);
    w += `<rect x="${x + 0.5}" y="${ny + 0.5}" width="${nw - 1}" height="${nh - 1}" rx="8" fill="${s.key ? t.accentTint : 'none'}" stroke="${s.key ? t.accent : t.faint}"/>`;
    w += `<text x="${x + nw / 2}" y="${mid + 5}" class="mono" font-size="13.5" text-anchor="middle" fill="${s.key ? t.accent : t.ink}">${esc(s.name)}</text>`;
    w += `<text x="${x + nw / 2}" y="${ny + nh + 24}" class="serif" font-size="13" font-style="italic" text-anchor="middle" fill="${t.muted}">${esc(s.note)}</text>`;
    if (i < p.stages.length - 1) w += arrow(t, x + nw + 6, x + nw + ng - 6, mid, p.edges[i]);
    if (s.key && p.loop) {
      const l = x + 22, r = x + nw - 22;
      w += `<path d="M${r} ${ny} C${r} ${ny - 30} ${l} ${ny - 30} ${l} ${ny - 6}" fill="none" stroke="${t.accent}"/>`;
      w += `<path d="M${l - 4} ${ny - 9} L${l} ${ny} L${l + 4} ${ny - 9}z" fill="${t.accent}"/>`;
      w += `<text x="${x + nw / 2}" y="${ny - 34}" class="mono" font-size="10.5" text-anchor="middle" fill="${t.accent}">${esc(p.loop)}</text>`;
    }
  });
  w += `<line x1="${pad}" y1="306.5" x2="${W - pad}" y2="306.5" stroke="${t.faint}"/>`;

  // three columns
  cols.forEach(([k, lines], i) => {
    const x = pad + i * (cw + gap);
    w += label(t, x, 336, k, { fill: i === 1 ? t.accent : t.muted });
    w += para(lines, { x, y: 362, size: 14.5, lead: 1.42, fill: t.ink }).svg;
  });

  // stack chips + where the code lives
  let cx = pad;
  for (const s of p.stack) { const c = chip(t, cx, chipsY, s); w += c.svg; cx += c.w + 8; }
  const where = p.links.length ? `github.com/${p.links[0][1].split('github.com/')[1]}` : 'private repository';
  w += label(t, W - pad, chipsY + 15, where, { anchor: 'end' });

  const compact = `<g class="compact">
${panelRect(t, 0, 0, W, H)}
${label(t, pad, 74, [`Case ${String(n).padStart(2, '0')}`, p.meta[0]].join(' · '), { size: tc.label })}
${para(wrap(p.title, inner, tc.title), { x: pad, y: 150, size: tc.title, lead: 1.1, fill: t.ink }).svg}
<text x="${pad}" y="${p.title.length > 22 ? 300 : 276}" class="serif" font-size="${tc.metric}" fill="${t.accent}">${esc(p.metric.value)}</text>
${label(t, pad, p.title.length > 22 ? 342 : 318, p.metric.label, { size: tc.label })}
${para(wrap(p.summary, inner, tc.body), { x: pad, y: p.title.length > 22 ? 404 : 388, size: tc.body, lead: 1.3, fill: t.ink, extra: 'font-style="italic"' }).svg}
</g>`;

  return svgDoc({
    height: H,
    title: p.title,
    desc: caseAlt(p),
    body: `<g class="wide">${w}</g>${compact}`,
  });
}

const caseAlt = (p) =>
  `${p.title} (${p.meta.join(', ')}). ${p.summary} ${p.metric.value} ${p.metric.label}. Pipeline: ${p.stages
    .map((s) => `${s.name} (${s.note})`)
    .join(' → ')}${p.loop ? `; ${p.stages.find((s) => s.key).name} loop: ${p.loop}` : ''}. Problem: ${p.problem} Key idea: ${p.idea} My part: ${p.part} Stack: ${p.stack.join(', ')}.`;

// ── Also: two compact cards ─────────────────────────────────────────────────
function alsoPanel(t) {
  const H = 232, cw = (W - gap) / 2;
  let wide = '<g class="wide">';
  also.forEach((a, i) => {
    const x = i * (cw + gap);
    wide += panelRect(t, x, 0, cw, H);
    wide += label(t, x + 24, 40, a.kicker);
    wide += `<text x="${x + 24}" y="80" class="serif" font-size="25" fill="${t.ink}">${esc(a.title)}</text>`;
    wide += para(wrap(a.body, cw - 48, 13.5), { x: x + 24, y: 110, size: 13.5, fill: t.muted }).svg;
    let cx = x + 24;
    for (const s of a.stack) { const c = chip(t, cx, H - 46, s); wide += c.svg; cx += c.w + 8; }
  });
  wide += '</g>';
  let compact = '<g class="compact">';
  also.forEach((a, i) => {
    const y = 64 + i * 104;
    compact += label(t, 0, y, a.kicker.split(' · ')[0], { size: tc.label }) + `<text x="0" y="${y + 52}" class="serif" font-size="42" fill="${t.ink}">${esc(a.title)}</text>`;
  });
  compact += '</g>';
  return svgDoc({ height: H, title: 'Also', desc: also.map((a) => `${a.title} (${a.kicker}). ${a.body}`).join(' '), body: wide + compact });
}

// ── Path: dated milestones, newest first ────────────────────────────────────
const pathAlt = () => 'Path, newest first. ' + path.map((m) => `${m.when}: ${m.title}${m.future ? ' (upcoming)' : ''}. ${m.detail}.`).join(' ');

function pathPanel(t) {
  const top = 74, step = 36, nowGap = 26, railX = 138, textX = 166;
  // details share one column, placed after the longest title
  const detailX = textX + Math.max(...path.map((m) => textWidth(m.title, 17))) + 24;
  const firstPast = path.findIndex((m) => !m.future);
  const yOf = (i) => top + i * step + (i >= firstPast && firstPast > 0 ? nowGap : 0);
  const H = yOf(path.length - 1) + 32;

  let wide = '<g class="wide">';
  wide += label(t, 0, 20, 'Path') + label(t, W, 20, 'Newest first', { anchor: 'end' });
  wide += `<line x1="0" y1="34.5" x2="${W}" y2="34.5" stroke="${t.faint}"/>`;
  wide += `<line x1="${railX + 0.5}" y1="${yOf(0) + 1}" x2="${railX + 0.5}" y2="${yOf(path.length - 1) - 5}" stroke="${t.faint}"/>`;
  path.forEach((m, i) => {
    const y = yOf(i);
    wide += `<text x="${railX - 24}" y="${y}" class="mono" font-size="12.5" text-anchor="end" fill="${t.muted}">${esc(m.when)}</text>`;
    wide += m.future
      ? `<circle cx="${railX + 0.5}" cy="${y - 5}" r="5" fill="none" stroke="${t.muted}"/>`
      : `<circle cx="${railX + 0.5}" cy="${y - 5}" r="4.5" fill="${i === firstPast ? t.accent : t.ink}"/>`;
    wide += `<text x="${textX}" y="${y}" class="serif" font-size="17" fill="${m.future ? t.muted : t.ink}">${esc(m.title)}</text>`;
    wide += `<text x="${detailX}" y="${y}" class="serif" font-size="14" font-style="italic" fill="${t.muted}">${esc(m.detail)}</text>`;
  });
  if (firstPast > 0) {
    const y = yOf(firstPast) - step / 2 - nowGap / 2 + 4;
    wide += `<line x1="${railX - 14}" y1="${y + 0.5}" x2="${railX + 14}" y2="${y + 0.5}" stroke="${t.accent}" stroke-width="2"/>`;
    wide += label(t, railX - 24, y + 4, 'Now', { fill: t.accent, anchor: 'end' });
  }
  wide += '</g>';

  // phone: when + title only, skipping project milestones already shown as case files
  const rows = path.filter((m) => !/^(Built|Started) /.test(m.title)).slice(0, Math.floor((H - 40) / 50));
  let compact = '<g class="compact">';
  rows.forEach((m, i) => {
    const y = 50 + i * 50;
    compact += `<text x="0" y="${y}" class="mono" font-size="22" fill="${m.future ? t.muted : t.accent}">${esc(m.when.replace(/^[A-Z][a-z]{2} /, ''))}</text>`;
    compact += `<text x="120" y="${y}" class="serif" font-size="29" fill="${m.future ? t.muted : t.ink}">${esc(m.title)}</text>`;
  });
  compact += '</g>';

  return svgDoc({ height: H, title: 'Path', desc: pathAlt(), body: wide + compact });
}

// ── Contact ─────────────────────────────────────────────────────────────────
function contact(t) {
  const H = 212;
  const rows = [['Email', person.email], ['LinkedIn', 'in/' + person.linkedin.split('/in/')[1].replace(/\/$/, '')], ['Based', person.location], ['Time', person.timezone]];
  let wide = `<g class="wide">${panelRect(t, 0, 0, W, H)}`;
  wide += label(t, pad, 46, 'Contact');
  wide += `<text x="${pad}" y="112" class="serif" font-size="48" fill="${t.ink}">Say hello<tspan fill="${t.accent}">.</tspan></text>`;
  wide += `<text x="${pad}" y="150" class="serif" font-size="17" font-style="italic" fill="${t.muted}">Email is the fastest way to reach me.</text>`;
  const rx = 470;
  rows.forEach(([k, v], i) => {
    const y = 58 + i * 38;
    if (i) wide += `<line x1="${rx}" y1="${y - 24.5}" x2="${W - pad}" y2="${y - 24.5}" stroke="${t.panelLine}"/>`;
    wide += label(t, rx, y, k) + `<text x="${W - pad}" y="${y}" class="mono" font-size="13.5" text-anchor="end" fill="${i ? t.ink : t.accent}">${esc(v)}</text>`;
  });
  wide += '</g>';
  const compact = `<g class="compact">${panelRect(t, 0, 0, W, H)}
<text x="${pad}" y="96" class="serif" font-size="${tc.title}" fill="${t.ink}">Say hello<tspan fill="${t.accent}">.</tspan></text>
<text x="${pad}" y="160" class="mono" font-size="31" fill="${t.accent}">${esc(person.email)}</text></g>`;
  return svgDoc({ height: H, title: 'Contact', desc: rows.map(([k, v]) => `${k}: ${v}.`).join(' '), body: wide + compact });
}

// ── README ──────────────────────────────────────────────────────────────────
const pic = (name, alt, href) => {
  const p = `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/${name}-light.svg">
  <img alt="${esc(alt)}" src="assets/${name}-light.svg" width="100%">
</picture>`;
  return href ? `<a href="${href}">\n${p}\n</a>` : p;
};

async function readme() {
  const url = new URL('../README.md', import.meta.url);
  const old = await readFile(url, 'utf8').catch(() => '');
  // carry the daily-generated activity block over untouched
  const rhythm =
    old.match(/<picture>\s*<source[^>]*rhythm-dark[\s\S]*?<!-- \/rhythm:table -->/)?.[0] ??
    `${pic('activity/rhythm', 'Contribution rhythm')}\n\n<!-- rhythm:table -->\n<!-- /rhythm:table -->`;

  // links sit under each card as a right-aligned caption; private work has none
  const caption = (links) =>
    links.length ? `<p align="right"><sub>${links.map(([k, v]) => `<a href="${v}">${k} ↗</a>`).join(' &nbsp;·&nbsp; ')}</sub></p>` : '';
  const work = projects
    .map((p) => [pic(`projects/${p.id}`, caseAlt(p), p.links[0]?.[1]), caption(p.links)].filter(Boolean).join('\n\n'))
    .join('\n\n');

  const md = `<!-- Generated by scripts/build-static.mjs from scripts/content.mjs. Edit those, not this file. -->

${pic('profile/hero', `${person.name}. ${person.tagline} ${person.intro} ${person.spec.map(([k, v]) => `${k}: ${v}.`).join(' ')} Principles: ${principles.map((p) => `${p.title}: ${p.body}`).join(' ')}`)}

## 01 — Now

${pic('profile/now', now.map((n) => `${n.label}: ${n.title}. ${n.body}`).join(' '))}

## 02 — Selected work

${work}

${pic('projects/also', also.map((a) => `${a.title} (${a.kicker}). ${a.body}`).join(' '))}

${caption([['The merged pull request', also[1].href]])}

## 03 — Path

${pic('profile/path', pathAlt())}

## 04 — Rhythm

${rhythm}

## 05 — Contact

${pic('profile/contact', `Contact. Email: ${person.email}. LinkedIn. Based in ${person.location}, ${person.timezone}.`, `mailto:${person.email}`)}

${caption([[person.email, `mailto:${person.email}`], ['LinkedIn', person.linkedin]])}

<br>

<sub>Every image on this page is an SVG drawn by the scripts in this repository, from <a href="scripts/content.mjs">one content file</a>. No third-party widgets. <a href="DESIGN.md">How it’s made</a>.</sub>
`;
  await writeFile(url, md);
  console.log('wrote README.md');
}

// ── Main ────────────────────────────────────────────────────────────────────
const out = async (path, svg) => {
  await writeFile(new URL(`../assets/${path}`, import.meta.url), svg);
  console.log('wrote assets/' + path);
};
await mkdir(new URL('../assets/profile/', import.meta.url), { recursive: true });
await mkdir(new URL('../assets/projects/', import.meta.url), { recursive: true });
for (const [mode, t] of Object.entries(themes)) {
  await out(`profile/hero-${mode}.svg`, hero(t));
  await out(`profile/now-${mode}.svg`, nowPanel(t));
  await out(`profile/path-${mode}.svg`, pathPanel(t));
  await out(`profile/contact-${mode}.svg`, contact(t));
  await out(`projects/also-${mode}.svg`, alsoPanel(t));
  for (const [i, p] of projects.entries()) await out(`projects/${p.id}-${mode}.svg`, caseFile(t, p, i + 1));
}
await readme();
