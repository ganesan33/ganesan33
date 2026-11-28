// Contribution Rhythm — replaces the contribution snake.
//
// Reads genuine public data and draws assets/activity/rhythm-{dark,light}.svg:
//   • ledger      total contributions, active days, longest streak, busiest month
//   • waveform    weekly totals as bars above a baseline
//   • roots       every day as a dot below it (size + tone = that day's level)
//   • repos       where the commits went, last 12 months, own public repos
//
// Data sources (no third-party services):
//   • calendar  GitHub GraphQL `contributionCalendar` when GITHUB_TOKEN is set
//               (CI), otherwise the public github.com/users/<u>/contributions
//               page (local runs, no token needed)
//   • repos     GitHub REST: commits authored by the user on the default branch
//
// If any request fails the script exits non-zero before writing anything,
// so a broken run can never replace good artwork with an empty one.
//
// Usage:  node scripts/build-activity.mjs   (GITHUB_USER defaults to ganesan33)
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { themes, svgDoc, esc } from './theme.mjs';

const USER = process.env.GITHUB_USER || 'ganesan33';
const TOKEN = process.env.GITHUB_TOKEN || '';
const EXCLUDE = new Set([USER]); // the profile repo itself is not engineering work
const headers = {
  'User-Agent': 'profile-activity-builder',
  Accept: 'application/vnd.github+json',
  ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
};

async function getJSON(url, init = {}) {
  const res = await fetch(url, { headers, ...init });
  if (res.status === 409) return []; // empty repository
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

// ── Calendar ────────────────────────────────────────────────────────────────
const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

async function calendarFromGraphQL() {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
    weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const json = await getJSON('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login: USER } }),
  });
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 }));
}

async function calendarFromPage() {
  const res = await fetch(`https://github.com/users/${USER}/contributions`, { headers: { 'User-Agent': headers['User-Agent'] } });
  if (!res.ok) throw new Error(`${res.status} fetching contributions page`);
  const html = await res.text();
  const cells = new Map();
  for (const m of html.matchAll(/<td[^>]*?data-date="([\d-]+)"[^>]*?id="([^"]+)"[^>]*?data-level="(\d)"/g))
    cells.set(m[2], { date: m[1], level: +m[3], count: 0 });
  for (const m of html.matchAll(/<tool-tip[^>]*?for="([^"]+)"[^>]*>([^<]*)</g)) {
    const c = cells.get(m[1]);
    const n = m[2].match(/^(\d[\d,]*) contribution/);
    if (c && n) c.count = +n[1].replace(/,/g, '');
  }
  if (cells.size < 300) throw new Error(`contributions page parse failed (${cells.size} days)`);
  return [...cells.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ── Repositories ────────────────────────────────────────────────────────────
async function commitsByRepo(sinceISO) {
  const repos = await getJSON(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`);
  const active = repos.filter((r) => !r.fork && !EXCLUDE.has(r.name) && r.pushed_at >= sinceISO);
  const rows = [];
  for (const r of active) {
    let count = 0;
    for (let page = 1; page <= 10; page++) {
      const batch = await getJSON(
        `https://api.github.com/repos/${USER}/${r.name}/commits?author=${USER}&since=${sinceISO}&per_page=100&page=${page}`
      );
      count += batch.length;
      if (batch.length < 100) break;
    }
    if (count) rows.push({ name: r.name, count });
  }
  return rows.sort((a, b) => b.count - a.count);
}

// ── Stats ───────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthOf = (date) => MONTHS[+date.slice(5, 7) - 1];

function stats(days) {
  const total = days.reduce((s, d) => s + d.count, 0);
  const active = days.filter((d) => d.count > 0).length;
  let longest = 0, run = 0;
  for (const d of days) { run = d.count > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  const byMonth = new Map();
  for (const d of days) {
    const k = d.date.slice(0, 7);
    byMonth.set(k, (byMonth.get(k) || 0) + d.count);
  }
  const [bestKey, bestCount] = [...byMonth].sort((a, b) => b[1] - a[1])[0];
  return { total, active, longest, busiest: { label: `${monthOf(bestKey + '-01')} ${bestKey.slice(0, 4)}`, count: bestCount } };
}

// ── Drawing ─────────────────────────────────────────────────────────────────
const W = 880;

function render(t, days, s, repos) {
  // Pad to whole Sunday-first weeks, matching GitHub's own calendar.
  const first = new Date(days[0].date + 'T00:00:00Z');
  const lead = first.getUTCDay();
  const grid = [...Array(lead).fill(null), ...days];
  const weeks = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  const step = W / weeks.length;
  const weekTotals = weeks.map((w) => w.reduce((a, d) => a + (d?.count || 0), 0));
  const maxWeek = Math.max(1, ...weekTotals);
  const peak = weekTotals.indexOf(maxWeek);

  const range = `${monthOf(days[0].date)} ${days[0].date.slice(0, 4)} — ${monthOf(days.at(-1).date)} ${days.at(-1).date.slice(0, 4)}`;
  let b = `
<text x="0" y="14" class="mono" font-size="11" letter-spacing="1.8" fill="${t.muted}">CONTRIBUTION RHYTHM</text>
<text x="${W}" y="14" class="mono" font-size="11" letter-spacing="1.8" text-anchor="end" fill="${t.muted}">${esc(range.toUpperCase())} · PUBLIC</text>
<line x1="0" y1="28.5" x2="${W}" y2="28.5" stroke="${t.faint}"/>`;

  // Ledger: four figures, serif numerals.
  const ledger = [
    [s.total.toLocaleString('en-US'), 'CONTRIBUTIONS'],
    [String(s.active), 'ACTIVE DAYS'],
    [`${s.longest}`, `LONGEST STREAK · DAYS`],
    [s.busiest.label.split(' ')[0], `BUSIEST MONTH · ${s.busiest.count}`],
  ];
  ledger.forEach(([v, k], i) => {
    const x = i * (W / 4);
    b += `<text x="${x}" y="84" class="serif" font-size="44" fill="${i === 0 ? t.accent : t.ink}">${esc(v)}</text>
<text x="${x}" y="106" class="mono" font-size="11" letter-spacing="1.4" fill="${t.muted}">${esc(k)}</text>`;
  });

  // Waveform above the baseline, daily dots below it.
  const base = 214, barMax = 74, bw = Math.max(3, step * 0.42);
  b += `<line x1="0" y1="${base + 0.5}" x2="${W}" y2="${base + 0.5}" stroke="${t.faint}"/>`;
  weeks.forEach((w, i) => {
    const cx = i * step + step / 2;
    const v = weekTotals[i];
    if (v > 0) {
      const h = Math.max(2, Math.sqrt(v / maxWeek) * barMax);
      const fill = i === peak ? t.accent : t.ink;
      // anchored on the baseline, rounded only at the data end
      const x0 = cx - bw / 2, r = Math.min(3, bw / 2, h);
      b += `<path d="M${x0.toFixed(1)} ${base}V${(base - h + r).toFixed(1)}q0 -${r} ${r} -${r}h${(bw - 2 * r).toFixed(1)}q${r} 0 ${r} ${r}V${base}z" fill="${fill}" opacity="${i === peak ? 1 : 0.78}"/>`;
    }
    w.forEach((d, r) => {
      if (!d) return;
      const cy = base + 14 + r * 11;
      const rad = [1.1, 2.2, 2.9, 3.5, 4.1][d.level];
      b += `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${rad}" fill="${t.ramp[d.level]}"/>`;
    });
  });

  // Month labels under the first full week of each month.
  let last = '', lastX = -Infinity;
  weeks.forEach((w, i) => {
    const d = w.find(Boolean);
    if (!d) return;
    const m = monthOf(d.date);
    const x = i * step + step / 2 - 4;
    if (m !== last) {
      // skip a label that would crowd its neighbour (e.g. a partial first month)
      if (x - lastX >= 40 && x < W - 30)
        b += `<text x="${x.toFixed(1)}" y="${base + 102}" class="mono" font-size="11" fill="${t.muted}">${m}</text>`, (lastX = x);
      last = m;
    }
  });

  // Where the work went.
  let H = base + 116;
  const top = repos.slice(0, 4);
  if (top.length) {
    const y0 = H + 22;
    b += `<line x1="0" y1="${y0 - 0.5}" x2="${W}" y2="${y0 - 0.5}" stroke="${t.faint}"/>
<text x="0" y="${y0 + 24}" class="mono" font-size="11" letter-spacing="1.8" fill="${t.muted}">COMMITS BY REPOSITORY · LAST 12 MONTHS</text>`;
    const maxC = top[0].count;
    top.forEach((r, i) => {
      const x = i * (W / 4);
      const len = Math.max(4, (r.count / maxC) * (W / 4 - 40));
      b += `<text x="${x}" y="${y0 + 58}" class="mono" font-size="13" fill="${t.ink}">${esc(r.name)}</text>
<rect x="${x}" y="${y0 + 70}" width="${len.toFixed(1)}" height="3" fill="${i === 0 ? t.accent : t.muted}"/>
<text x="${x}" y="${y0 + 94}" class="mono" font-size="11" fill="${t.muted}">${r.count} commit${r.count === 1 ? '' : 's'}</text>`;
    });
    H = y0 + 104;
  }

  return svgDoc({
    width: W,
    height: H,
    title: 'Contribution rhythm',
    desc: altText(s, repos, range),
    // phone layout: the four figures, large; the chart itself is too dense to read at that size
    body: `<g class="wide">${b}</g><g class="compact">${[
      [s.total.toLocaleString('en-US'), 'contributions'],
      [String(s.active), 'active days'],
      [String(s.longest), 'day streak'],
      [s.busiest.label.split(' ')[0], 'busiest month'],
    ]
      .map(([v, k], i) => {
        const x = (i % 2) * (W / 2), y = 120 + Math.floor(i / 2) * Math.min(170, (H - 120) / 2);
        return `<text x="${x}" y="${y}" class="serif" font-size="96" fill="${i ? t.ink : t.accent}">${esc(v)}</text><text x="${x}" y="${y + 40}" class="mono" font-size="24" letter-spacing="1.6" fill="${t.muted}">${esc(k.toUpperCase())}</text>`;
      })
      .join('')}</g>`,
  });
}

function altText(s, repos, range) {
  const top = repos.slice(0, 4).map((r) => `${r.name} (${r.count})`).join(', ');
  return `Contribution rhythm, ${range}: ${s.total} public contributions over ${s.active} active days; longest streak ${s.longest} days; busiest month ${s.busiest.label} with ${s.busiest.count}.` +
    (top ? ` Commits by repository: ${top}.` : '');
}

// ── Main ────────────────────────────────────────────────────────────────────
const days = TOKEN ? await calendarFromGraphQL() : await calendarFromPage();
const today = new Date().toISOString().slice(0, 10);
const span = days.filter((d) => d.date <= today);
const since = new Date(span[0].date + 'T00:00:00Z').toISOString();
// SKIP_REPOS=1 draws without the repository strip (offline / rate-limited local runs).
const repos = process.env.SKIP_REPOS ? [] : await commitsByRepo(since);
const s = stats(span);

await mkdir(new URL('../assets/activity/', import.meta.url), { recursive: true });
for (const [mode, t] of Object.entries(themes)) {
  await writeFile(new URL(`../assets/activity/rhythm-${mode}.svg`, import.meta.url), render(t, span, s, repos));
}

// Keep the README's alt text in step with the numbers in the image.
const readmeURL = new URL('../README.md', import.meta.url);
const readme = await readFile(readmeURL, 'utf8');
const range = `${monthOf(span[0].date)} ${span[0].date.slice(0, 4)} — ${monthOf(span.at(-1).date)} ${span.at(-1).date.slice(0, 4)}`;
// The image cannot have tooltips on GitHub, so the README carries a collapsed
// table with the same numbers (the accessible, copyable twin of the chart).
function monthTable() {
  const rows = new Map();
  for (const d of span) {
    const k = d.date.slice(0, 7);
    const r = rows.get(k) || { c: 0, a: 0 };
    r.c += d.count; r.a += d.count > 0 ? 1 : 0;
    rows.set(k, r);
  }
  const lines = [...rows].map(([k, r]) => `| ${monthOf(k + '-01')} ${k.slice(0, 4)} | ${r.c} | ${r.a} |`);
  const repoLines = repos.slice(0, 4).map((r) => `| ${r.name} | ${r.count} |`);
  return `<!-- rhythm:table -->
<details>
<summary><sub>The same data as a table</sub></summary>

| Month | Contributions | Active days |
|:--|--:|--:|
${lines.join('\n')}
${repoLines.length ? `\n| Repository | Commits, last 12 months |\n|:--|--:|\n${repoLines.join('\n')}\n` : ''}
</details>
<!-- /rhythm:table -->`;
}
const next = readme
  .replace(/(<img alt=")[^"]*(" src="assets\/activity\/rhythm-)/, `$1${esc(altText(s, repos, range))}$2`)
  .replace(/<!-- rhythm:table -->[\s\S]*?<!-- \/rhythm:table -->/, monthTable);
if (next !== readme) await writeFile(readmeURL, next);

console.log(JSON.stringify({ source: TOKEN ? 'graphql' : 'page', days: span.length, ...s, repos }, null, 1));
