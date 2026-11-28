# Design notes

How this profile was designed and how it maintains itself. The profile itself is [README.md](README.md).

## Assessment

**The old profile** stacked about a dozen third-party widgets: a wave banner, a typing animation, badges, three stats cards, a streak card, skill icons, percentage bars, a mermaid flowchart and a contribution snake. Each was competent on its own; together they read as a template. Most of the content restated the same facts (role, stack, focus) in different formats, and the strongest evidence of skill (the code) got the least space.

**What the better developer profiles do** (from looking at GitHub's `profile-readme` topic, curated lists, and current personal sites): one typeface system, one accent, generous space, very few images, and writing that explains *why* something was hard. Editorial portfolios lean on a serif for voice, a mono for metadata, and a near-monochrome palette with one colour used sparingly.

**What GitHub actually renders** constrains the design:

- Markdown is sanitised. No `style`, no `class`, no scripts. Layout comes from headings, paragraphs, `<picture>`, `<img width>`, `<sub>`, `<br>`.
- `<picture>` with `prefers-color-scheme` sources is the supported way to ship light and dark artwork.
- SVGs load as images: no web fonts, no external resources, no scripts. Inline `<style>` and media queries do work, and `max-width` queries are evaluated against the *image's* rendered width.
- Live widget services go down, get rate-limited, and are outside your control. Pre-rendered SVGs committed by a scheduled Action are not.

## Three concepts

**A. Field notes: a dark technical journal.** Transparent artwork on GitHub's own background; warm off-white ink, grey metadata, one signal-amber accent. Serif for the name and voice, mono for labels. Numbered sections, hairline rules, a ruler along the masthead. Activity becomes a *rhythm*: weekly totals as a waveform above a baseline, each day as a dot below it, with a ledger of four honest numbers. It differs from typical profiles by being written rather than assembled.

**B. Swiss grid.** A strict grid with a neo-grotesk, black on paper, red as the accent. Projects become numbered index cards in a two-column table, and activity a 12 × 31 month-by-day dot matrix. It's very clean, but GitHub tables become scroll boxes on phones and there's no reliable grotesk on every OS, so the grid falls apart.

**C. Engineering workspace (blueprint).** Line-art schematics for every project, a Gantt-style timeline of repositories as activity, blueprint cyan on navy. It's strong on technical credibility but drifts toward the "fake engineering aesthetic" and puts a lot of weight on images that can't be read on a phone.

**Chosen: A, borrowing one idea from C.** The journal direction has the most restraint and holds up best without animation. From C it keeps a pipeline schematic per flagship project, because the *shape* of a system is the quickest way to show it was engineered.

**Why no skills section.** Profiles of widely respected engineers (simonw, t3dotgg, antfu, and the many, like sindresorhus or gaearon, with no profile README at all) show work, dated output and links. None lists tools, skill levels or stacks. A first version of this page had a tools-by-project matrix; it was cut for the same reason. Stack appears only as chips on the work it was used for.

**Version 2: designed panels.** Version 1 kept case studies as Markdown prose, which read as plain text. Version 2 moves every section into an art-directed SVG panel and keeps Markdown for structure (headings), links and alt text. Legibility on phones, the usual cost of text in images, is solved by giving every panel two compositions (below).

## Components

All drawn by `scripts/build-static.mjs` from `scripts/content.mjs`:

| Panel | Contents |
|---|---|
| Hero | name, tagline, spec card, dot-grid texture, principles band |
| Now | three status cards |
| Case file | kicker, title, hero metric, labelled pipeline with feedback loop, Problem / Key idea / My part, stack chips |
| Also | two compact cards |
| Path | dated milestones, newest first, with a rail and a *now* tick: role, open source, recognition, education |
| Rhythm | contribution chart (`build-activity.mjs`) |
| Contact | sign-off card; the image links to email |

**Two layouts per file.** Each SVG contains a `.wide` composition and a `.compact` one. A `max-width: 600px` media query inside the SVG, evaluated against the image's own rendered width, switches to `.compact` on phones: the same viewBox with fewer, larger elements (body ≥ 30px at the drawing scale, about 12px on a 360px screen).

**Diagrams show mechanism.** Every arrow is labelled with what crosses it (`frame`, `findings`, `enqueue`), and the one stage that carries the idea is accented, with its feedback loop drawn (Liveness: 3 frames in a row; Worker: up to 3 tries with backoff).

## System

| Token | Dark | Light |
|---|---|---|
| ink | `#E8E5DE` | `#1F2328` |
| muted | `#8B949E` | `#656D76` |
| faint (rules) | `#30363D` | `#D0D7DE` |
| panel / panelLine | `#151B23` / `#2A313B` | `#F6F8FA` / `#D8DEE4` |
| accent | `#F0A04B` | `#A84D17` |

- Type scale (`type` in `theme.mjs`): wide 11 / 12.5 / 15 / 20 / 40 / 56 / 84; compact 24 / 30 / 56 / 88 / 96. Spacing on an 8px unit, 32px panel padding, 24px gutters, 12px radius.
- Serif stack: Iowan Old Style → Palatino Linotype → Palatino → Georgia. Mono stack: ui-monospace → SF Mono → Cascadia Mono → Consolas. Text wrapping uses conservative glyph-width estimates so no OS font overruns a column.
- The accent marks *one* thing per panel: the period after the name, the hero metric, the key pipeline stage, the busiest week.
- Text on panels, including accent text on the tinted key node, meets 4.5:1 in both themes; the light accent was darkened from `#B4531A` to pass on that tint.
- Every SVG has a `<title>`/`<desc>`, and every `<img>` has descriptive alt text.
- Text contrast meets WCAG AA on GitHub's dark (`#0d1117`), dimmed (`#22272e`) and light (`#ffffff`) backgrounds. The activity ramp was checked with an ordinal palette validator: one hue, monotone lightness, visible steps, and every active step at least 3:1 against the background (WCAG 1.4.11).
- Activity is encoded twice (dot size *and* tone), never by colour alone. Images on GitHub can't have tooltips, so the workflow also writes a collapsed table of the same numbers under the chart.

## Files

```
assets/profile/    hero, now, path, contact (static)
assets/projects/   case files and the Also panel (static)
assets/activity/   contribution rhythm (regenerated daily)
scripts/content.mjs         every word on the page
scripts/theme.mjs           tokens and drawing primitives
scripts/build-static.mjs    static panels + README.md
scripts/build-activity.mjs  contribution rhythm
.github/workflows/activity.yml
```

README.md is generated; edit `content.mjs` instead.

No dependencies: plain Node 20+.

## Automation

`.github/workflows/activity.yml` runs daily at 02:30 UTC, on manual dispatch, and whenever `scripts/` changes. It runs `build-activity.mjs`, which:

1. Reads the contribution calendar from the GraphQL API using the workflow's built-in `GITHUB_TOKEN`. Locally, with no token, it reads the public `github.com/users/<user>/contributions` page instead.
2. Counts commits authored by the user in each non-fork public repository pushed in the same 12-month window (REST API), excluding this profile repository.
3. Draws `rhythm-dark.svg` and `rhythm-light.svg`, and rewrites the README image's alt text and the monthly table with the same numbers.
4. Commits only if something changed.

If any request fails, the script exits before writing, so the last good image stays in place. No personal access token is used or needed. The data is the public view, so private contributions appear only if *Include private contributions* is enabled in your profile settings.

To change copy, edit `scripts/content.mjs`; for colours or type, `scripts/theme.mjs`. Then run:

```sh
node scripts/build-static.mjs
node scripts/build-activity.mjs
```

Without a token, local runs share GitHub's anonymous limit of 60 requests an hour. If that runs out, `SKIP_REPOS=1 node scripts/build-activity.mjs` draws everything except the repository strip.
