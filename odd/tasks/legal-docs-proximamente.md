# Feature: legal-docs-proximamente

Locator: `odd/tasks/legal-docs-proximamente.md` · Engram topic: `odd/legal-docs-proximamente/tasks` · Branch: `feat/legal-docs-proximamente` (from `main` @ 302aa38)

## Objective
Replace the legal pages with the three official Word documents supplied by the business, restructure the footer policies (4th column for Libro de reclamaciones + Créditos), and add a "Próximamente" announcement with a horizontal photo slider to the home page.

## Problem / Why
The business supplied final legal texts: "TÉRMINOS Y CONDICIONES DE USO Y CONTRATACIÓN", "POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS PERSONALES" (one combined policy) and "POLÍTICAS DE COBRO, CANCELACIÓN Y REEMBOLSO". Footer labels must be the document titles. The home page must announce a new tourist place (crystal cave formations, 4 WhatsApp photos) as coming soon.

## Scope
- T1: legal pages + footer on all 12 pages.
  - `terminos-y-condiciones.html` ← Términos docx; `politicas-de-pago.html` ← Cobro docx; `politicas-de-privacidad.html` ← Privacidad docx (combined policy).
  - `proteccion-de-datos-personales.html` is superseded by the combined policy: 301 redirect to `politicas-de-privacidad.html` in `.htaccess`, page removed, links updated.
  - Footer "Políticas": the three document titles + ESNNA; new 4th column with Libro de reclamaciones + Créditos de fotos.
- T2: home "Próximamente" section with a horizontal scroll-snap slider of the 4 photos (`img/prox-01..04.jpg`).

## Constraints
- Legal text verbatim from the Word files (only fix conversion artifacts such as a stray leading "."); keep heading/list structure.
- No invented business data; the new place's name is unknown → no name, describe only what the photos show.
- Shared chrome edited identically on all pages (`grep -c`); Apple dark rules; no-JS and reduced-motion usable; no horizontal page scroll at 360–390px.
- Push/merge to `main` deploys to production → only with explicit user approval.

## Delivery strategy
`exception-ok` — two work units; legal text is long but verbatim.

## Tasks
- [x] T1 — Legal pages + footer restructure. Route: delegated (14+ files).
- [x] T2 — Home "Próximamente" slider. Route: delegated (3 files + images).

## Acceptance criteria
- Footer on all 12 pages: Políticas = 3 document titles + ESNNA; 4th column = Libro de reclamaciones + Créditos de fotos.
- Legal pages show the docx content completely; `/proteccion-de-datos-personales.html` 301 → privacy page; no broken internal links.
- Home shows a "Próximamente" section with a swipeable/scrollable horizontal slider of 4 photos, with accessible controls.

## Checks
- Test-first exception: no test runner. Word-count comparison docx vs page text, link greps, `node --check`, screenshots at 1366/390.

## Progress / Evidence
- T1 (delegated writer; trigger: 15 files). Términos, Cobro and Privacidad pages rebuilt verbatim from the Word files (headings h2/h3, lists, `.datos-legal` company grid; only the stray leading ". " and doubled spaces fixed); `proteccion-de-datos-personales.html` deleted + `.htaccess` 301 to `politicas-de-privacidad.html`; consent links in contacto/libro updated; `.otras-politicas` pills renamed; footer identical on all 11 pages (one md5): Políticas = 3 document titles + ESNNA, new "Atención al cliente" column = Libro de reclamaciones + Créditos de fotos; `.pie-grid` 4/2/1 columns. +291/−395. Evidence (writer): word-by-word comparison doc vs page — only differences are the title (now h1) and two empty Términos table rows ("Libro de Reclamaciones Virtual", "Constancia DNPST") left out; all numbered headings present; no links to the deleted page; all internal hrefs resolve; `node --check` OK; no horizontal scroll at 390/360. Parent: `node --check` OK, link grep clean, redirect line present, footer screenshot at 1366 checked. Open for the business: the two empty table rows; Cobro section 12 keeps the blank fill-in template; the new deposit is 30% (old page said 50%).
- T2 (delegated writer; trigger: 3 non-trivial files + images). "Próximamente" section after "Lo principal.": eyebrow + "Un nuevo destino." + a line describing only the photos + `.enlace` "Quiero más información ›" to contacto (TODO comment for the place name); full-bleed CSS scroll-snap track with 4 cards (`img/prox-01..04.jpg`, business photos from WhatsApp, 170–238 KB, EXIF/IPTC stripped), "Próximamente" glass badge, keyboard-focusable region, frosted prev/next buttons (hidden without JS, disabled at ends, instant under reduced motion), lazy images with dimensions. +199/−6. Evidence (writer, Playwright): next/prev move exactly one card and disable at ends; ArrowRight scrolls the focused track; reduced motion instant; no-JS buttons hidden and track scrolls; scrollWidth == clientWidth at 1366/390/360. Note: the zip filenames didn't match the brief's descriptions; alts were written from visual checks. Parent: `node --check` OK; screenshot at 1366 checked; moved the controls to the left so the fixed WhatsApp float can't cover them.

- Review (302aa38..9fab662, 938 lines): consent GRANTED; 1-lens reliability review approved and acknowledged. Advisories: R3-carrusel-focus-loss (accepted, fixed: when a focused arrow becomes disabled at an end, focus moves to the other arrow first; Playwright: next→440 (focus next)→867 (focus prev), next disabled); R3-carrusel-no-regression-test (acknowledged; no runner).

## Status
Done on `feat/legal-docs-proximamente` (local). The user decides push/merge (push to `main` = production deploy). Open: place name (TODO), the two empty Términos rows, 30% vs 50% deposit confirmation.

## Next step
User decision on delivery.
