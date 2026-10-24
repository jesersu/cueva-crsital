# Feature: home-sections

Locator: `odd/tasks/home-sections.md` · Engram topic: `odd/home-sections/tasks` · Branch: `feat/home-sections` (from `feat/header-logo` @ ab8ca8b, unmerged chain: tour-request-form → header-logo)

## Objective
Improve the home page from "Lo principal." down to the footer: fix the large gap between the "Tingo María y el río Huallaga" photo band and "Planifica tu viaje.", add an image slider for Tingo María and the río Huallaga, and polish the whole stretch with the design skills.

## Problem / Why
User: too much distance between the Tingo María / río Huallaga band and "Planifica tu viaje."; add another image slider on Tingo María and the río Huallaga; use the design skills to improve everything from Lo principal to before the footer.

## Scope
- T1: rework sections after the hero in `index.html` and `en/index.html`: Lo principal (facts), Nuestros tours, the statement, a Tingo María / río Huallaga photo slider (replacing the single photo band; real Tingo María photos only: `tingo-01..03` third-party photos already credited in creditos.html, plus business photos that really show Tingo María scenery if any; accurate alts), spacing/rhythm fix so no oversized gaps, "Planifica tu viaje." CTA band, motion/polish per design skills; CLAUDE.md/DESIGN.md.

## Out of scope
Hero, header, footer, other pages, new photos, new business facts, name of the new destination.

## Constraints
- Third-party photos: credited in `creditos.html` (do not edit it unless a newly used third-party photo needs an entry), no credit text on or beside the photos, never crop/mask watermarks, never present a photo as a different place; never `honol-01`/`honol-09`.
- Both languages; no-JS usable; reduced motion; AA; light and dark; no horizontal scroll 360–390; copy changes only if clearly needed and without new facts; every fact from the tour pages.
- Push/merge to `main` deploys to production → only with explicit approval.

## Delivery strategy
`exception-ok`, one work-unit commit (two if the slider is separable).

## Tasks
- [x] T1 — Home sections redesign + Tingo María/Huallaga slider. Route: delegated (one writer; trigger: 2+ non-trivial files). Commit 8ba428a.

## Acceptance criteria
- No oversized empty gaps between consecutive sections at 1366/1920/390; clear rhythm.
- The slider works with arrows/swipe/keyboard, indicators, no-JS fallback, reduced motion; both languages.

## Checks
node --check, Playwright 1920/1366/820/390 light + dark spot, both languages, no console errors.

## Progress / Evidence
- T1 (8ba428a): root cause of the gap: `.banda-foto` margin-bottom 120px + the next `.seccion` padding-top 112px (the fold-away rule only applied between `.seccion` siblings, not after a figure). Content gaps before/after at 1920 and 1366 (390 in parentheses): principal->tours 224 -> 144 (144 -> 96), tours->statement 224 -> 144 (144 -> 96), statement->photos 112 -> 96 (72 -> 64), photos->CTA 251 -> 95 (171 -> 63), CTA->footer 93 -> 77 (53 -> 45). Same in es/en.
- Slider: all three tingo photos checked visually (they show Tingo María, the Huallaga, its hills); scroll-snap strip, arrows, indicators, Home/End/Arrow keys, swipe-equivalent scroll, no-JS strip, reduced motion (instant jump) verified in Playwright, es + en; no autoplay by design. creditos.html and en/creditos.html list Inicio for tingo-02/03.
- Checks: node --check script.js OK; no horizontal scroll at 360/390; no console errors; statement highlight still lights words; screenshots at 1920/1366/820/390 light and 1366/390 dark.

## Next step
Close the feature; review/merge decision is the user's.
