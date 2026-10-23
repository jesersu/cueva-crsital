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
- [ ] T2 — Add `contacto.html` (contact info, dark band, form that composes a WhatsApp message with `mailto:` fallback) + nav/footer links on all 11 pages. Route: delegated (11 files).
- [ ] T3 — Animations in `script.js` + `styles.css` (hero entrance, staggered reveals, parallax, hover), reduced-motion safe. Route: delegated (2 files).
- [ ] T4 — Update `CLAUDE.md` for the new design + contact page. Route: inline (one mechanical file).

## Acceptance criteria
- All pages render with Hyer look at 1366px and 390px; no horizontal scroll at 390px.
- Contact page reachable from every page's nav and footer; form opens WhatsApp with the entered data.
- `node --check script.js` passes; lightbox, mobile menu, and reveals still work.
- Clay accent appears at most once per page.

## Checks
- Test-first exception: no test runner exists in this static site; checks are structural (`node --check`, grep link counts) and visual (headless Chrome screenshots at 1366px and in a 390px iframe).

## Progress / Evidence
- T1 (delegated writer; trigger: 2+ non-trivial files). styles.css rewritten (~900 lines), index.html hero recomposed (~20 lines); tour pages untouched (CSS-only). Evidence: `node --check script.js` OK (writer + parent re-run); desktop screenshots of home/tour/ESNNA/form and 390px iframe screenshots of home/tour inspected; no box-shadow, no Portrait tokens left. Clay: home = first tour card text panel (`.tarjeta-tour.destacada`), ESNNA = `.alerta-esnna`, none elsewhere. Added reusable `.banda-oscura` for T2. Kept `--gris`/`--divisor`/`--verde-oscuro` aliases because libro-de-reclamaciones.html inline styles use them. `.atl/` (auto-generated skill registry with absolute local paths) added to .gitignore.

## Next step
T2.
