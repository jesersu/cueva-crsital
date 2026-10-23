# Feature: hyer-redesign-contact

Locator: `odd/tasks/hyer-redesign-contact.md` · Engram topic: `odd/hyer-redesign-contact/tasks` · Branch: `feat/hyer-redesign-contact` (from `main` @ e1c5655)

## Objective
Replace the "Portrait" look with the user-provided "Hyer Aviation" style reference, add a Contact page, and add tasteful animations — vanilla HTML/CSS/JS only.

## Problem / Why
The user asked for a new visual direction (austere monochrome editorial, deep ink #000d10, single clay #bc7155 accent, huge tight-tracked bold display type, pill buttons, alternating white/dark bands) plus a dedicated contact screen and motion.

## Scope
- `styles.css` full reskin to Hyer tokens; all existing selectors on the 10 pages keep working.
- Home hero recomposed (giant flush-left wordmark, right-side headline ending with a period, pale sky→cream gradient).
- New `contacto.html` + "CONTACTO" nav link on every page + footer link.
- Animations: hero entrance, staggered scroll reveals, subtle parallax/hover motion; all disabled under `prefers-reduced-motion`.

## Constraints
- No frameworks, no build step, no new dependencies besides one web font (Inter, substitute for HelveticaNowDisplay).
- Clay #bc7155 used on at most one element per page; no shadows on cards/buttons; buttons are 1000px pills; featured clay card has 0 radius; body text 18px / 1.61.
- Header/footer markup is duplicated across pages: every shared change must reach all pages.
- Pages must work without JS (progressive enhancement); existing lightbox/menu JS must keep working.
- Mobile layout works at 390px with no horizontal scroll.

## Delivery strategy
`exception-ok` — local repo, no remote, no PR flow. CSS rewrite alone exceeds the ~400-line heuristic because a full reskin is one coherent change; splitting it would leave the site half-styled.

## Tasks
- [x] T1 — Reskin `styles.css` to Hyer tokens + recompose home hero in `index.html`; tour "Volver" buttons stay secondary. Route: delegated (2+ non-trivial files).
- [x] T2 — Add `contacto.html` (contact info, dark band, form that composes a WhatsApp message with `mailto:` fallback) + nav/footer links on all 11 pages. Route: delegated (11 files).
- [x] T3 — Animations in `script.js` + `styles.css` (hero entrance, staggered reveals, parallax, hover), reduced-motion safe; also give `.hero-marca` slack at 390px (review advisory R3-wordmark-fit). Route: delegated (2 files).
- [x] T4 — Update `CLAUDE.md` for the new design + contact page. Route: inline (one mechanical file).

## Acceptance criteria
- All pages render with Hyer look at 1366px and 390px; no horizontal scroll at 390px.
- Contact page reachable from every page's nav and footer; form opens WhatsApp with the entered data.
- `node --check script.js` passes; lightbox, mobile menu, and reveals still work.
- Clay accent appears at most once per page.

## Checks
- Test-first exception: no test runner exists in this static site; checks are structural (`node --check`, grep link counts) and visual (headless Chrome screenshots at 1366px and in a 390px iframe).

## Progress / Evidence
- T1 (delegated writer; trigger: 2+ non-trivial files). styles.css rewritten (~900 lines), index.html hero recomposed (~20 lines); tour pages untouched (CSS-only). Evidence: `node --check script.js` OK (writer + parent re-run); desktop screenshots of home/tour/ESNNA/form and 390px iframe screenshots of home/tour inspected; no box-shadow, no Portrait tokens left. Clay: home = first tour card text panel (`.tarjeta-tour.destacada`), ESNNA = `.alerta-esnna`, none elsewhere. Added reusable `.banda-oscura` for T2. Kept `--gris`/`--divisor`/`--verde-oscuro` aliases because libro-de-reclamaciones.html inline styles use them. `.atl/` (auto-generated skill registry with absolute local paths) added to .gitignore. Commit 6d3bee5. RDD: assessed medium (slice_budget_reached), consent granted, 1-lens reliability review approved and acknowledged (lineage review-42f1e89e47a2a13f); reviewed boundary advances to 6d3bee5. Advisory R3-sr-only-undefined = false positive (`.sr-only` defined at styles.css:721). Advisory R3-wordmark-fit accepted → folded into T3.
- T2 (delegated writer; trigger: 13 files). New contacto.html (feature blocks, single clay WhatsApp card, `.banda-oscura` form with mailto fallback); CONTACTO nav item + footer link on all 11 pages; home CTA band; script.js contact-form section (~45 lines); styles.css contact section (~95 lines). Evidence: `node --check script.js` OK (writer + parent); `href="contacto.html"` count = 2 on every page, 3 on index (parent re-ran); headless functional test: empty required fields → 0 `open` calls, filled → 1 call to `https://wa.me/51978571323?text=...` with name/tour/people/message, empty date skipped; desktop + 390px screenshots inspected (parent spot-checked contacto desktop). Clay: home featured tour card, contacto WhatsApp card, ESNNA alert — one per page. Note: contact mailto fallback goes to info@turismoloscristales.com while the complaints form uses a different inbox (pre-existing). Commit 55e534b. RDD: assessed medium, review_due=false (under_budget, 349 lines) → stays pending in the slice with T3; boundary remains 6d3bee5.
- T3 (delegated writer; trigger: 3 files incl. 2 non-trivial). CSS-only staggered hero entrance with masked lines (works without JS), staggered IntersectionObserver reveals on all page types (threshold 0 + rootMargin so long legal blocks reveal), itinerary line draw, hover/focus zooms and arrow nudge, nav underline, rAF parallax on hero image and tour cover (`::after` layer, `translate`/`scale` props), lightbox fade/scale with delayed `hidden`. Review advisory R3-wordmark-fit fixed: 14–15% slack at 360/390px, measured. Evidence: `node --check` OK (writer + parent); settled, reduced-motion, no-JS (sandboxed iframe), mid-animation, 360/390 mobile and lightbox screenshots inspected; lightbox open/Escape/hidden/focus restore verified in harness; parent spot-checked the mid-animation frame. Commit ead83af. RDD: slice 6d3bee5..ead83af assessed medium (slice_budget_reached, 656 lines), consent granted, 1-lens reliability review approved and acknowledged (lineage review-be8cb224de13eab4); boundary advances to ead83af. Non-blocking advisories (follow-ups, not fixed): FADE_MS computed once from reduced-motion at load; no-JS `mailto:` + text/plain fallback behaves inconsistently across mail clients; contact submit flow has no automated test (static site has no runner).
- T4 (inline; one mechanical file). CLAUDE.md rewritten for the Hyer design, contact page, animations, workflow and verification gotchas. Check: structural readback.

## Status
All tasks done. Pending/unverified: desktop TOURS dropdown verified by CSS only (no open-state screenshot); real-device mobile check not done; no-JS mail fallback untested in real mail clients.

## Next step
User decides delivery (merge `feat/hyer-redesign-contact` into `main`; no remote configured).
