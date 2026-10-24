# Feature: home-modern

Locator: `odd/tasks/home-modern.md` · Engram topic: `odd/home-modern/tasks` · Branch: `feat/home-modern` (from `feat/terra-redesign` @ ba1ede7, not merged)

## Objective
Make the site lighter and more modern: light theme by default, "Próximamente / Un nuevo destino" photos as the main visual of the home (not a strip under the hero), a coherent refined icon set, and Emil-Kowalski-style interaction polish.

## Problem / Why
User request: more modern home; the Próximamente photos should be principal images, not below the main image; improve all icons; theme generally lighter (user chose: light theme by default, dark stays as the toggle option).

## Scope
- T1: light theme by default on all 11 pages (inline `<head>` script, theme-color meta, `script.js` fallback, toggle semantics unchanged, saved choice still wins); refine light-theme tokens (airier, softer surfaces). Hero, tour covers, footer, top bar, lightbox stay dark.
- T2: home restructure: Próximamente becomes a primary photo-led section directly after/with the hero (large featured imagery, slider kept), polish home spacing/hierarchy, "Lo principal." and tour cards modernised.
- T3: icon set: one consistent inline-SVG line style (same stroke, size, caps) for theme toggle, WhatsApp, contact details, fact cards, carousel/hero buttons, footer; accessible names preserved; applied identically on all 11 pages where shared.
- T4: motion/polish pass using the animation skills (press/hover/reveal), then CLAUDE.md/DESIGN.md update.

## Out of scope
New business facts, destination name, EN/ES, deploy.

## Constraints
- Shared chrome identical on all 11 pages (`grep -c`); no-JS usable; reduced motion; AA contrast both themes; no horizontal scroll 360–390px; photo rules (credits, no watermark crops); `enviar.php` contract untouched.
- Push/merge to `main` deploys to production: only with explicit user approval.

## Delivery strategy
`exception-ok`, local branch.

## Tasks
- [x] T1 — Light by default + light tokens. Route: delegated (11 pages + css/js). Evidence: Playwright, cleared localStorage -> data-theme=light, meta #FFFFFF, body rgb(255,255,255); toggle -> dark, localStorage tema=dark, meta #2D3436, persists after reload; toggling back persists light; head script identical in 11 pages (sort -u = 1 line); node --check ok.
- [x] T2 — Home restructure with Próximamente as hero-level imagery. Route: delegated. Evidence: section moved directly after the hero, display title + large cards (up to 720px high); screenshots at 1366/390 light and dark viewed (.playwright-mcp/t2-*.png); slider behaviour checked at the end.
- [x] T3 — Icon set. Route: delegated. Evidence: all emoji/glyph icons replaced with shared `.ico` inline SVG (24 grid, 1.75 stroke, round, currentColor); no emoji/arrow glyphs left in *.html/script.js (grep 0); topbar, toggle, menu button, TOURS nav, WhatsApp float and footer md5-identical across 11 pages; screenshots viewed; node --check ok.
- [x] T4 — Motion polish + docs. Route: delegated. Evidence: fact-card lift and carousel photo zoom (fine pointer only, <=300ms UI, composite props), reduced-motion overrides added; CLAUDE.md, DESIGN.md, .impeccable/design.json updated. Playwright: slider next/prev/ArrowRight work (scrollLeft 0->560->1440->560), icon-only buttons all have aria-label, no horizontal overflow at 390/360 on 4 pages, contact form shows 4 aria-invalid + hints on empty submit, dark Próximamente screenshot viewed.

## Acceptance criteria
- First visit (no saved choice) renders light, no flash; toggle still switches/persists.
- Home shows the Próximamente photos prominently near the top as main imagery; slider still works (keys, arrows, no-JS).
- All icons share one style; every icon-only control keeps an accessible name.
- node --check passes; Playwright checks at 1366/390 in both themes.

## Checks
Test-first exception: no runner. node --check, greps, Playwright screenshots/behaviour.

## Progress / Evidence
T1-T4 done on feat/home-modern, one commit each; not pushed.

## Next step
Parent review, then user decides on push/merge (deploys to production).
