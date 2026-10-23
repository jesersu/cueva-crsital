# Feature: hero-slider

Locator: `odd/tasks/hero-slider.md` · Engram topic: `odd/hero-slider/tasks` · Branch: `feat/hero-slider` (from `main` @ d011864)

## Objective
Turn the home hero photo (`figure.hero-foto`) into an auto-advancing crossfade slider that shows one real photo per tour plus Tingo María scenery.

## Problem / Why
The user asked for the home photo to change image every few seconds.

## Scope
- T1: `index.html` hero markup, `styles.css` slider styles, `script.js` slider section, `CLAUDE.md` note.

## Constraints
- Photos only of the real places, already in `img/` (own photos or the credited ones in `creditos.html`); no watermarked honol-01/honol-09.
- Progressive enhancement: without JS the first photo shows; reduced motion → no auto-rotation; pause while the tab is hidden; WCAG 2.2.2 → a visible pause/play control.
- Crossfade with opacity only; keep the hero vignette, glass bar and scroll zoom/dim (custom properties) working; Apple dark rules (no shadows, glass controls, one blue CTA).
- Push/merge to `main` deploys to production → only with explicit user approval.

## Delivery strategy
`exception-ok` — one small work unit.

## Tasks
- [x] T1 — Hero crossfade slider. Route: delegated (3 non-trivial files).

## Acceptance criteria
- Hero rotates every ~5–6s with a smooth crossfade; pause control works with mouse, keyboard and screen readers.
- No-JS and reduced motion show a single static photo; `node --check script.js` passes; no layout shift or horizontal scroll at 360–390px.

## Checks
- Test-first exception: no test runner. `node --check`, Playwright/headless checks of rotation, pause, reduced motion and no-JS.

## Progress / Evidence
- T1 (delegated writer; trigger: 3 non-trivial files). +187/−16. Slides: honol-08 (LCP, eager), pntm-10, lagu-11 (giant hand/heart viewpoint of the Laguna tour), tingo-01; inactive slides lazy + aria-hidden. New `.hero-diapositivas` wrapper carries the scroll zoom/dim and entrance so the slides only crossfade opacity (1s, outgoing slide stays under the incoming one); ~5.5s interval; holds while paused, tab hidden, hero off-screen, or the control is hovered/keyboard-focused; frosted 40px pause/play button outside the vignette mask (hidden without JS and under reduced motion; aria-label swaps "Pausar fotos"/"Reanudar fotos"); `onMotionStart` hook added next to `onMotionStop` for live reduced-motion changes. CLAUDE.md documents the slider. Evidence (writer, Playwright in new pages): rotation 0→1 at ~7s; pause holds 6.5s; play advances immediately then every ~6s; simulated hidden tab holds; reduced motion (load and live) holds on slide 0 with button hidden; no-JS shows slide 0 only; no overlap with the glass bar and no horizontal overflow at 1366/390/360px; no honol-01/09. Parent: `node --check` OK, spot-checked the cave slide at 1366px.

- Review: the stop hook offered d011864..eb3994d (243 lines); consent GRANTED; 1-lens reliability review approved and acknowledged. Advisories: R3-broken-slide-stall (accepted, fixed: an already-failed lazy slide (`complete` with no `naturalWidth`) is now dropped synchronously instead of waiting for an `error` event that never fires again); R3-pause-visible-single-slide (accepted, fixed: the button hides when fewer than 2 slides remain); R3-no-repeatable-checks (acknowledged; no runner). Fix evidence: `node --check` OK; Playwright (new tab, closed afterwards): slide 2's src broken to a 404 → slides 4→3 and rotation continued to tingo-01 within 13s.

## Status
Done on `feat/hero-slider` (local). The user decides push/merge (push to `main` = production deploy).

## Next step
User decision on delivery.
