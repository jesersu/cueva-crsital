# Feature: tour-request-form

Locator: `odd/tasks/tour-request-form.md` · Engram topic: `odd/tour-request-form/tasks` · Branch: `feat/tour-request-form` (from `main` @ 73e4c5c)

## Objective
Fill the empty itinerary area of the tour pages on large screens with (a) a form to request that specific tour and (b) a few photos from the page's gallery, in Spanish and English.

## Problem / Why
User: on large screens the itinerary section of the tour pages looks empty; add a form the customer can fill to request that tour and, if possible, some images or part of the gallery.

## Scope
- T1: on the three tour pages (es + en, 6 pages): a sticky-aside layout beside the itinerary on wide screens (stacks under it on small screens): request form (name, email required; phone, tentative date, people, message optional-looking but prefilled; tour fixed to that page), plus a small photo block from the existing gallery images of that tour (real photos only, correct alts, credits rules). Form posts to `enviar.php` as `formulario=contacto` with the tour value of that page, `idioma` hidden, honeypot and `tiempo`; JS validation/success panel reuse; no-JS returns to the tour page. `enviar.php` extension limited to an optional whitelisted return page. CLAUDE.md/DESIGN.md notes.

## Out of scope
New business facts (prices, schedules), payment, new photos, other pages.

## Constraints
- `enviar.php` contract unchanged except the whitelisted return page; recipient, spam controls, field names unchanged; `mensaje` stays required (prefill a default text per tour).
- Third-party photos (pntm-10..12, tingo-01..03) allowed only as before with credits on creditos.html; never watermarked honol-01/09.
- Shared chrome untouched; no-JS usable; AA; no horizontal scroll 360–390; both languages and themes.
- Push/merge to `main` deploys to production → only with explicit approval.

## Delivery strategy
`exception-ok`, one or two work-unit commits.

## Tasks
- [x] T1 — Tour page aside: request form + photos (6 pages, css/js/php). Route: delegated (writer; trigger: 2+ non-trivial files). Commit: see Progress.

## Acceptance criteria
- At ≥1024px the itinerary section shows itinerary left and form + photos right (no empty area); stacked below 1024px.
- A request from a tour page reaches the business email with the correct tour value; JSON and no-JS paths work in es/en.

## Checks
No runner: node --check, php -l 7.4/8.3 in Docker, PHP harness, Playwright at 1920/1366/820/390, both languages/themes.

## Progress / Evidence
T1 done (verified, commit 824e96e):
- Layout deviation: photo mosaic sits under the itinerary in the left column (form alone in the sticky right column) because form (~890px) + photos could never fit a viewport; stacked order on mobile is itinerary, form, photos as specified.
- `node --check script.js`: ok. `php -l enviar.php` php:7.4-cli and php:8.3-cli: no syntax errors.
- PHP harness (php:8.3 built-in server, capturing sendmail): es/en JSON ok, business email has `Tour de interés: <tour>`, no `pagina` in email; no-JS 303 -> `/laguna-de-los-milagros.html#enviado`, `/en/parque-nacional-tingo-maria.html#enviado`; `//evil.com`, `https://evil.com`, `../x`, `x.html`, `/en/..`, empty, array `pagina[]` -> contact page; reclamo ignores `pagina`; error path returns to the tour page `#error`.
- Playwright (1920/1366/1024/820/390/360, es+en, 6 pages): no horizontal scroll (scrollWidth == clientWidth), sticky verified at 1366x800/1920x1080, validation hint + aria-invalid, mocked success panel es/en, mosaic opens lightbox (deduped slides 13/12), reset restores the prefill, #enviado shows, no console errors. Focus after an invalid submit stays on the button in headless Chrome, same as contacto.html (pre-existing).

## Next step
Delegate T1.
