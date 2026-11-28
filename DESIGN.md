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

**Chosen: A, borrowing one idea from C.** The journal direction has the most restraint and holds up best without animation. From C it keeps a single, minimal pipeline schematic per flagship project, because the *shape* of a system is the quickest way to show it was engineered. Everything that must be read (case studies, contact) is real Markdown text: selectable, accessible and legible on mobile.

## System

| Token | Dark | Light |
|---|---|---|
| ink | `#E8E5DE` | `#1F2328` |
| muted | `#8B949E` | `#656D76` |
| faint (rules) | `#30363D` | `#D0D7DE` |
| accent | `#F0A04B` | `#B4531A` |

- Serif stack: Iowan Old Style → Palatino Linotype → Palatino → Georgia. Mono stack: ui-monospace → SF Mono → Cascadia Mono → Consolas.
- The accent marks *one* thing per image: the period after the name, the stage of a pipeline I'd point to first, the busiest week.
- Every SVG has a `<title>`/`<desc>`, and every `<img>` has descriptive alt text.
- Text contrast meets WCAG AA on GitHub's dark (`#0d1117`), dimmed (`#22272e`) and light (`#ffffff`) backgrounds. The activity ramp was checked with an ordinal palette validator: one hue, monotone lightness, visible steps, and every active step at least 3:1 against the background (WCAG 1.4.11).
- Activity is encoded twice (dot size *and* tone), never by colour alone. Images on GitHub can't have tooltips, so the workflow also writes a collapsed table of the same numbers under the chart.

## Files

```
assets/profile/    masthead (static)
assets/projects/   pipeline schematics (static)
assets/activity/   contribution rhythm (regenerated)
scripts/theme.mjs           shared palette, fonts, SVG wrapper
scripts/build-static.mjs    masthead and schematics
scripts/build-activity.mjs  contribution rhythm
.github/workflows/activity.yml
```

No dependencies: plain Node 20+.

## Automation

`.github/workflows/activity.yml` runs daily at 02:30 UTC, on manual dispatch, and whenever `scripts/` changes. It runs `build-activity.mjs`, which:

1. Reads the contribution calendar from the GraphQL API using the workflow's built-in `GITHUB_TOKEN`. Locally, with no token, it reads the public `github.com/users/<user>/contributions` page instead.
2. Counts commits authored by the user in each non-fork public repository pushed in the same 12-month window (REST API), excluding this profile repository.
3. Draws `rhythm-dark.svg` and `rhythm-light.svg`, and rewrites the README image's alt text and the monthly table with the same numbers.
4. Commits only if something changed.

If any request fails, the script exits before writing, so the last good image stays in place. No personal access token is used or needed. The data is the public view, so private contributions appear only if *Include private contributions* is enabled in your profile settings.

To change copy or colours in the static artwork, edit `scripts/build-static.mjs` or `scripts/theme.mjs` and run:

```sh
node scripts/build-static.mjs
node scripts/build-activity.mjs
```

Without a token, local runs share GitHub's anonymous limit of 60 requests an hour. If that runs out, `SKIP_REPOS=1 node scripts/build-activity.mjs` draws everything except the repository strip.
