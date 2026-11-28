// Builds the hand-authored artwork: the masthead and the two architecture
// schematics. These only change when the copy changes, so they are built
// locally (`npm run build:static`) and committed, not regenerated in CI.
import { mkdir, writeFile } from 'node:fs/promises';
import { themes, svgDoc, esc } from './theme.mjs';

const W = 880;

// ── Masthead ────────────────────────────────────────────────────────────────
function masthead(t) {
  const H = 282; // 20px of air below the index line; a <br> after an image is unreliable on GitHub
  // A ruler along the top rule: a quiet technical detail, one tick in accent.
  let ticks = '';
  for (let x = 0; x <= W; x += 20) {
    const major = x % 100 === 0;
    ticks += `<line x1="${x + 0.5}" y1="40" x2="${x + 0.5}" y2="${major ? 48 : 44}" stroke="${t.faint}"/>`;
  }
  ticks += `<line x1="140.5" y1="40" x2="140.5" y2="52" stroke="${t.accent}"/>`;

  const meta = [
    ['ROLE', 'SDE Intern, Firstsource'],
    ['STUDY', 'B.E. CSE, REC · 2027'],
    ['FOCUS', 'Backends · Agents · Azure'],
  ]
    .map(
      ([k, v], i) =>
        `<text x="620" y="${104 + i * 24}" class="mono" font-size="11" letter-spacing="1.6" fill="${t.muted}">${k}</text>` +
        `<text x="${W}" y="${104 + i * 24}" class="mono" font-size="13" text-anchor="end" fill="${t.ink}">${esc(v)}</text>`
    )
    .join('\n');

  const index = ['01 NOW', '02 SELECTED WORK', '03 RHYTHM', '04 CONTACT'];
  let ix = 0;
  const indexText = index
    .map((s) => {
      const el = `<text x="${ix}" y="252" class="mono" font-size="11" letter-spacing="1.6" fill="${t.muted}">${s}</text>`;
      ix += s.length * 8.4 + 34;
      return el;
    })
    .join('');

  // Everything except the name, tagline and rules is `.fine`: hidden when the
  // image renders narrower than 600px (phones), where it would be unreadable.
  const body = `<g class="fine">
<text x="0" y="22" class="mono" font-size="11" letter-spacing="1.8" fill="${t.muted}">CHENNAI · 13.08° N, 80.27° E</text>
<text x="${W}" y="22" class="mono" font-size="11" letter-spacing="1.8" text-anchor="end" fill="${t.muted}">GITHUB.COM/GANESAN33</text>
${ticks}
${meta}
${indexText}
</g>
<line x1="0" y1="40.5" x2="${W}" y2="40.5" stroke="${t.faint}"/>
<text x="-3" y="148" class="serif" font-size="76" fill="${t.ink}" letter-spacing="-1">Ganesan G<tspan fill="${t.accent}">.</tspan></text>
<text x="0" y="198" class="serif" font-size="22" font-style="italic" fill="${t.ink}" opacity="0.86">Software engineer. I build backend systems, and the AI that has to live inside them.</text>
<line x1="0" y1="230.5" x2="${W}" y2="230.5" stroke="${t.faint}"/>`;

  return svgDoc({
    width: W,
    height: H,
    title: 'Ganesan G',
    desc: 'Software engineer in Chennai, India. SDE intern at Firstsource; B.E. Computer Science at Rajalakshmi Engineering College, class of 2027. Builds backend systems and the AI that runs inside them.',
    body,
  });
}

// ── Architecture schematic ─────────────────────────────────────────────────
// A left-to-right pipeline. Each stage: step number, name, one-line note.
// Exactly one stage is marked `key` and drawn in the accent colour.
function schematic(t, { title, desc, stages }) {
  const H = 112;
  const n = stages.length;
  const col = W / n;
  let body = `<line x1="0" y1="0.5" x2="${W}" y2="0.5" stroke="${t.faint}"/>`;
  stages.forEach((s, i) => {
    const x = i * col;
    const c = s.key ? t.accent : t.ink;
    body += `
<text x="${x}" y="30" class="mono" font-size="11" letter-spacing="1.4" fill="${s.key ? t.accent : t.muted}">${String(i + 1).padStart(2, '0')}</text>
<line x1="${x}" y1="42.5" x2="${x + col - 26}" y2="42.5" stroke="${s.key ? t.accent : t.faint}" stroke-width="${s.key ? 2 : 1}"/>
<text x="${x}" y="70" class="mono" font-size="14.5" fill="${c}">${esc(s.name)}</text>
<text x="${x}" y="95" class="serif" font-size="15" font-style="italic" fill="${t.muted}">${esc(s.note)}</text>`;
    if (i < n - 1) {
      // chevron joining this stage to the next
      const ax = x + col - 16;
      body += `<path d="M${ax} 38.5 l5 4 l-5 4" fill="none" stroke="${t.muted}"/>`;
    }
  });
  return svgDoc({ width: W, height: H, title, desc, body });
}

const fraud = {
  title: 'Fraud investigation agent: pipeline',
  desc: 'Five stages: TigerGraph multi-hop traversal, evidence normalisation into case-scoped facts, LLM reasoning, deterministic R1 to R10 policy rules (highlighted), and a verdict with SAR workflow and audit trail.',
  stages: [
    { name: 'Graph traversal', note: 'TigerGraph, multi-hop' },
    { name: 'Evidence', note: 'case-scoped facts' },
    { name: 'LLM reasoning', note: 'proposes, explains' },
    { name: 'Policy R1–R10', note: 'deterministic, decides', key: true },
    { name: 'Verdict + SAR', note: 'with audit trail' },
  ],
};

const attendance = {
  title: 'Smart Attendance: face check-in pipeline',
  desc: 'Five stages: an in-browser BlazeFace gate at the kiosk, face detection on the GPU, an ArcFace 512-dimensional embedding match, liveness checks combining four OpenCV heuristics with two MiniFASNet models (highlighted), and an attendance record with an integrity score.',
  stages: [
    { name: 'BlazeFace gate', note: 'in the browser' },
    { name: 'Face detection', note: 'GPU, ONNX Runtime' },
    { name: 'ArcFace match', note: '512-d embeddings' },
    { name: 'Liveness', note: '4 checks + 2 models', key: true },
    { name: 'Attendance', note: 'with integrity score' },
  ],
};

const eduflow = {
  title: 'EduFlow: video pipeline',
  desc: 'Five stages: an Express upload API, a BullMQ queue on Redis, an ffmpeg transcoding worker (highlighted) with retries and exponential backoff, Azure Blob Storage, and a player streaming with HTTP range requests.',
  stages: [
    { name: 'Upload API', note: 'Express 5, Joi' },
    { name: 'BullMQ / Redis', note: '3 tries, backoff' },
    { name: 'ffmpeg worker', note: 'out-of-process', key: true },
    { name: 'Azure Blob', note: 'source + MP4' },
    { name: 'Player', note: 'HTTP 206 seeking' },
  ],
};

const out = async (path, svg) => {
  await writeFile(new URL(`../${path}`, import.meta.url), svg);
  console.log('wrote', path);
};

await mkdir(new URL('../assets/profile/', import.meta.url), { recursive: true });
await mkdir(new URL('../assets/projects/', import.meta.url), { recursive: true });
for (const [mode, t] of Object.entries(themes)) {
  await out(`assets/profile/masthead-${mode}.svg`, masthead(t));
  await out(`assets/projects/fraud-agent-${mode}.svg`, schematic(t, fraud));
  await out(`assets/projects/eduflow-${mode}.svg`, schematic(t, eduflow));
  await out(`assets/projects/attendance-${mode}.svg`, schematic(t, attendance));
}
