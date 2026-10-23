# Feature: apple-dark-redesign

Locator: `odd/tasks/apple-dark-redesign.md` · Engram topic: `odd/apple-dark-redesign/tasks` · Branch: `feat/apple-dark-redesign` (from local `main` @ c4b32fd = origin/main at last sync; no fetch done)

## Objective
Replace the live "Navan" look with the user-provided "Apple (España)" dark style reference across all 11 pages and add a full Apple-like animation layer, vanilla HTML/CSS/JS only.

## Problem / Why
The user wants a cinematic dark product-page language: pure black canvas, silk white text, oversized Inter/SF 600 headlines with negative tracking, 17px/1.47 body, 28px card radius, zero shadows, frosted-glass floating UI, alternating black/light bands, and color rationed to one blue CTA (#0071e3) plus link blue (#2997ff) — with "all animations".

## Scope
- T1: `styles.css` full reskin + home hero/sections markup (glass floating bar, section openers, feature/stat sections built only from real tour facts) + minimal `contacto.html` tweaks.
- T2: animation layer in `script.js` + `styles.css` (+ hooks in markup): hero entrance and scroll-linked hero zoom/fade, word-by-word scroll text highlight, staggered reveals with scale, scroll-linked image zoom, counters for real numbers, glass nav hide-on-scroll-down/show-on-up, button/link micro-interactions, page fade-in; all reduced-motion safe and no-JS safe.
- T3: `CLAUDE.md` update.

## Constraints
- Font: SF Pro is Apple-only → stack `-apple-system, BlinkMacSystemFont, "SF Pro Display"/"SF Pro Text", Inter` with Inter (400/600) from Google Fonts. Never weight 700.
- Color rationing: `#0071e3` fill on ONE primary CTA per page (pill 9999px); `#2997ff` for text links only; chip gradient only on small decorative badges; everything else achromatic. No shadows; elevation by tone, 28px radius, and glass (`rgba(66,66,69,.72)` + `backdrop-filter: blur(20px)`).
- No invented business data (prices, ratings, hours). Numbers/facts only from existing pages.
- Shared header/footer markup is duplicated in 11 pages → style via CSS; no shared-chrome HTML edits.
- Keep legacy aliases (`--gris`, `--divisor`, `--verde-oscuro`) for libro-de-reclamaciones.html inline styles; keep lightbox, mobile menu, contact form behavior.
- No horizontal scroll at 360–390px; content visible with JS off and under reduced motion.
- Delivery: push/merge to `main` deploys to production → only with explicit user approval. Verify `git branch --show-current` before every commit.

## Delivery strategy
`exception-ok` — coherent reskin + animation layer; branch stays local until the user approves merge/push.

## Tasks
- [x] T1 — Apple dark reskin + home structure. Route: delegated (2+ non-trivial files).
- [x] T2 — Full animation layer. Route: delegated (same writer resumed, 2+ non-trivial files).
- [ ] T3 — CLAUDE.md update. Route: inline (one mechanical file).

## Acceptance criteria
- All page types render in the Apple dark style at 1366px and 360/390px; no horizontal scroll.
- Blue CTA fill appears on exactly one content CTA per page; no box-shadows; no weight 700.
- Animations run in a normal browser, are absent under reduced motion, and no content is hidden without JS.
- `node --check script.js` passes; lightbox, mobile menu, contact form still work.

## Checks
- Test-first exception: no test runner. Structural (`node --check`, greps) + visual (headless Chrome screenshots; iframe wrapper for 360/390px; sandboxed iframe for no-JS; `--force-prefers-reduced-motion`; short `--virtual-time-budget` frames for mid-animation proof).

## Progress / Evidence
- T1 (delegated writer; trigger: 2+ non-trivial files; writer resumed once for a correction). styles.css full rewrite in the Apple dark style (tokens `--lienzo`, `--carbon`, `--seda`, `--ceniza`, `--azul-accion`, `--azul-enlace`...; legacy aliases kept); index.html main content rebuilt (hero + glass bar with the single blue "Reservar", "Lo principal." cards, `.declaracion`, "En cifras." stats with `data-contar`, tours on a light band, contact band); contacto.html `.tarjeta-niebla` → `.tarjeta-whatsapp`; script.js reveal targets updated. ~1,250 authored lines. Facts all sourced from tour pages (file:line list in the writer report). Correction: the first hero image (honol-09) had a third-party watermark that the writer had zoomed out of frame; the parent rejected that, and the writer replaced it with clean honol-08 and swapped home card 03 from watermarked honol-01 to honol-04. Watermark audit of img/: honol-01 ("Marca Tingo María" badge + "Marx Fuentes" credit) and honol-09 ("Marca Tingo María") are watermarked; both are still used on catarata-honolulo.html (out of scope, flagged to the user). Evidence: `node --check` OK (writer + parent); desktop, reduced-motion full, 360/390px, and no-JS screenshots by the writer; parent spot-checked the hero. Blue only on `.boton`/`.boton.verde` fills + focus rings; no box-shadow; no weight 700; no violet leftovers. Commit 969a87d. RDD: assessed medium (slice_budget_reached, 1512 lines); consent DECLINED by the user for this candidate (exact provider decline invocation run, `declined_this_candidate`, target matched); continued under ordinary policy; next assessment base = 969a87d.
- T2 (delegated, same writer resumed; trigger: 2 non-trivial files). script.js: one shared passive scroll/resize listener plus one rAF per frame; sections for live reduced-motion preference, header hide on scroll down / show on scroll up (never while the menu is open or focus is inside), scroll-linked hero zoom/dim/drift, word-by-word `.declaracion` highlight (screen readers get one hidden full copy), scroll-linked image zoom, tour cover parallax, counters (`data-contar`; reset to 0 only near the viewport, so the real values stay in the HTML when frames don't run; animated node aria-hidden + sr-only final value), extended staggered reveals incl. masked section headings and the footer wordmark, lightbox delay honoring live reduced motion. styles.css: `--curva` easing, micro-interactions, rebuilt Animaciones section with a full reduced-motion override; scroll effects write only custom properties mapped to `transform`/`translate`, so they never fight `scale`/`opacity` entrances. ~334+/88−. Evidence: `node --check` OK (writer + parent); paused-at-750ms mid-entrance frame; scroll harness (hero dimmed and scaled, words lit up to "desde"); counters 3/5/25/15 verified in Playwright in a real browser (mid values seen at 450ms); reduced-motion, no-JS (re-shot after a first-frame glitch), 360/390px and lightbox checks pass; parent spot-checked the scroll frame. Incident: the writer's first Playwright navigation replaced a pre-existing logged-in cPanel tab with localhost (no cPanel action taken; reported to the user).

## Next step
T3.
