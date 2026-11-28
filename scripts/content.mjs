// Every word on the profile lives here. Edit this file, then run
//   node scripts/build-static.mjs
// to redraw the panels and regenerate README.md (alt text included).
// Keep lines short: panels wrap text automatically, but they are designed
// for the lengths below.

export const person = {
  name: 'Ganesan G',
  handle: 'ganesan33',
  tagline: 'Software engineer. I build backend systems, and the AI that has to live inside them.',
  taglineCompact: ['I build backend systems,', 'and the AI inside them.'],
  location: 'Chennai, India',
  coords: '13.08° N, 80.27° E',
  timezone: 'IST · UTC+5:30',
  spec: [
    ['Role', 'SDE Intern, Firstsource'],
    ['Study', 'B.E. CSE, REC · 2027'],
    ['Focus', 'Backends · Agents · Azure'],
    ['Based', 'Chennai, India'],
  ],
  email: 'ganesanz3tg@gmail.com',
  linkedin: 'https://www.linkedin.com/in/ganesan-g-14b1852a2/',
  intro:
    'I like the unglamorous middle of software: queues, auth boundaries, retries, and the deterministic code that keeps a language model honest.',
};

export const principles = [
  { title: 'Failure is a state', body: 'Queues, retries, explicit statuses, workers that can safely run twice.' },
  { title: 'Models propose; code decides', body: 'LLMs belong inside systems that can be tested and audited.' },
  { title: 'Own the whole path', body: 'Schema, API, client, container, cloud.' },
];

export const now = [
  { label: 'At Firstsource', title: 'LLM agents & A2A', body: 'Agent-to-agent integrations and the full-stack apps around them, on Azure. Private work.' },
  { label: 'Upstream', title: 'django-modern-rest', body: 'A typed, async REST framework for Django. Merged: a CSRF fix for its OpenAPI schema.', href: 'https://github.com/wemake-services/django-modern-rest' },];

// Case files. `stages` draws the pipeline; `edges` label the arrows between
// stages; `loop` draws a feedback arc over the stage marked `key`.
export const projects = [
  {
    id: 'attendance',
    title: 'Smart Attendance',
    meta: ['2026', 'Team of two'],
    summary: 'Face or rotating-QR attendance that a photo on a phone cannot fool.',
    metric: { value: '25–34×', label: 'faster on GPU' },
    problem: 'Roll calls and sign-in sheets are easy to proxy, and a face held up on a phone is still a face.',
    idea: 'A match only counts after liveness passes on three frames in a row: four OpenCV checks run in parallel with two MiniFASNet models.',
    part: 'Backend, recognition and anti-spoofing pipeline, analytics and benchmarks. A teammate built the QR flow.',
    stack: ['Django', 'PostgreSQL', 'InsightFace', 'ONNX Runtime', 'OpenCV', 'React'],
    stages: [
      { name: 'BlazeFace', note: 'in the browser' },
      { name: 'Detect', note: 'SCRFD on GPU' },
      { name: 'ArcFace', note: '512-d match' },
      { name: 'Liveness', note: '4 checks + 2 models', key: true },
      { name: 'Record', note: 'integrity score' },
    ],
    edges: ['frame', 'face', 'student', 'present'],
    loop: '3 frames in a row · any fail resets',
    links: [],
  },
  {
    id: 'fraud-agent',
    title: 'Fraud investigation agent',
    meta: ['2026', 'Team of three'],
    summary: 'An LLM investigates disputed payments; a rule engine makes the call.',
    metric: { value: 'R1–R10', label: 'rules decide' },
    problem: 'Analysts piece fraud cases together by hand from cards, devices, regions and earlier cases.',
    idea: 'The model never gets the last word: deterministic policy rules set the verdict, so every outcome traces to a named rule.',
    part: 'The first FastAPI backend, and the R1–R10 rule engine with its registry and unit tests.',
    stack: ['Python', 'FastAPI', 'TigerGraph', 'Groq', 'React', 'TypeScript'],
    stages: [
      { name: 'Traverse', note: 'TigerGraph hops' },
      { name: 'Evidence', note: 'case-scoped' },
      { name: 'LLM', note: 'proposes' },
      { name: 'Rules', note: 'R1–R10 decide', key: true },
      { name: 'Verdict', note: 'SAR + audit' },
    ],
    edges: ['subgraph', 'facts', 'findings', 'verdict'],
    loop: null,
    links: [['Repository', 'https://github.com/ganesan33/AcentraHealth']],
  },
  {
    id: 'eduflow',
    title: 'EduFlow',
    meta: ['2025–26', 'Solo'],
    summary: 'A course platform that turned out to be mostly a video problem.',
    metric: { value: '3', label: 'repos, built solo' },
    problem: 'Course videos are large: processing them inside a web request is slow and fragile, yet playback must seek instantly.',
    idea: 'Uploads go onto a queue; a separate ffmpeg worker transcodes, retries with backoff and records each video’s status.',
    part: 'All of it: React web app, Node API, Kotlin Android client, Azure DevOps pipeline to App Service.',
    stack: ['Node.js', 'Express', 'MongoDB', 'Redis', 'React', 'Kotlin', 'Azure'],
    stages: [
      { name: 'Upload', note: 'Express 5 · Joi' },
      { name: 'Queue', note: 'BullMQ on Redis' },
      { name: 'Worker', note: 'ffmpeg, own process', key: true },
      { name: 'Blob', note: 'source + MP4' },
      { name: 'Player', note: 'HTTP range' },
    ],
    edges: ['enqueue', 'job', 'MP4', '206'],
    loop: 'up to 3 tries · exponential backoff',
    links: [
      ['Web', 'https://github.com/ganesan33/eduflow'],
      ['API v2', 'https://github.com/ganesan33/backend-'],
      ['Android', 'https://github.com/ganesan33/Eduflow-Mobile-app'],
    ],
  },
];

export const also = [
  {
    kicker: '2026 · Team of four',
    title: 'StockSense',
    body: 'Inventory where every stock change is a signed ledger entry, and only validation posts stock. I built receipts, an operation-summary endpoint, and most of the operations UI.',
    stack: ['FastAPI', 'PostgreSQL', 'Redis', 'React'],
  },
  {
    kicker: '2026 · Open source · Merged',
    title: 'A CSRF fix upstream',
    body: 'django-modern-rest’s OpenAPI schema declared the CSRF cookie but not the header Django checks. I added the header scheme across its cookie-auth classes.',
    stack: ['Python', 'Django', 'OpenAPI'],
    href: 'https://github.com/wemake-services/django-modern-rest/pull/1718',
  },
];

// Path: dated milestones, newest first, like a changelog.
// `future: true` draws a hollow marker; `now` is where the "now" tick sits
// (between the future items and the rest). Sources noted per line.
export const path = [
  { when: '2027', title: 'Graduating', detail: 'B.E. Computer Science, Rajalakshmi Engineering College', future: true },  { when: 'Oct 2026', title: 'First upstream PR merged', detail: 'django-modern-rest: CSRF header scheme for OpenAPI', href: 'https://github.com/wemake-services/django-modern-rest/pull/1718' }, // merged 2026-10-09
  { when: 'Aug 2026', title: 'Built Smart Attendance', detail: 'Face recognition with liveness checks, on GPU' }, // first commits 2026-08-25
  { when: 'Dec 2025', title: 'SDE Intern, Firstsource', detail: 'LLM agents, agent-to-agent integrations, Azure' }, // from the user
  { when: '2025', title: 'Smart India Hackathon, top 100', detail: 'National hackathon, Government of India' }, // from the user
  { when: 'Apr 2025', title: 'Started EduFlow', detail: 'First full-stack system shipped to Azure' }, // first commit 2025-04-18
  { when: '2023', title: 'Began B.E. CSE', detail: 'Rajalakshmi Engineering College, Chennai' }, // class of 2027
];
