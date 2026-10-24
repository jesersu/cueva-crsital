# Feature: i18n-seo

Locator: `odd/tasks/i18n-seo.md` · Engram topic: `odd/i18n-seo/tasks` · Branch: `feat/i18n-seo` (from `main` @ 9d3b3b5)

## Objective
Add English support (Spanish stays the default at the site root; English under `/en/`) and improve SEO for a Tingo María tourism agency whose upcoming destination is a crystal cave.

## Problem / Why
Both domestic and international visitors were confirmed (PRODUCT.md). The site has no English and minimal SEO. The user also asked to translate the legal pages into English (accepting that they are courtesy translations) and to improve SEO for Tingo María tourism and the crystal caves.

## Decisions
- URL structure: Spanish pages unchanged at the root (keeps existing URLs/SEO); English mirror in `/en/<same file name>`. Header language switch ES | EN links to the equivalent page. No automatic redirect by browser language (hurts SEO and crawlers).
- Legal pages in English are courtesy translations of the Word documents, marked as such, with the Spanish version binding. Business should review them.
- SEO claims: only facts already on the site or supplied by the user. "Most famous crystal caves in Peru" is NOT written as an absolute claim (unverifiable superlative); keyword targeting uses Tingo María / Huánuco / Peru / crystal cave instead. No invented coordinates, ratings, prices, dates or hours.

## Scope
- T1: i18n infrastructure + core pages EN (`en/index.html`, three tour pages, `en/contacto.html`, `en/creditos.html`), shared chrome translated (header, footer, floating WhatsApp, aria-labels, hero, forms, validation messages in `script.js` per `<html lang>`), language switch on every page (ES and EN), `enviar.php` aware of `lang` (messages and redirect back to the `/en/` page, allowed page list), CLAUDE.md.
- T2: English courtesy translations of the legal pages: terminos, politicas-de-pago, politicas-de-privacidad, prevencion-esnna, libro-de-reclamaciones (form labels in EN, same field names).
- T3: SEO on all 22 pages: unique title/description, canonical, hreflang es/en/x-default, Open Graph/Twitter (absolute image URL from an existing business photo), JSON-LD `TravelAgency` (existing name, phone, email, address only), `sitemap.xml` with hreflang alternates, `robots.txt`, descriptive alts, heading hierarchy check, LCP hints for the hero, `noindex` stays on enviar.php responses; docs.

## Out of scope
New business facts, destination name, other languages, deploy without approval.

## Constraints
- Shared chrome edited identically across pages per language (`grep -c`/md5); no-JS usable; AA; no horizontal scroll; `enviar.php` field contract unchanged; push/merge to `main` deploys to production → only with explicit user approval.

## Delivery strategy
`exception-ok`, three work-unit commits on the branch.

## Tasks
- [x] T1 — i18n infrastructure + core EN pages + forms/JS/PHP. Route: delegated.
- [x] T2 — English legal pages. Route: delegated.
- [x] T3 — SEO pass. Route: delegated.
- [x] T4 — Hero Próximamente photos cover the whole screen (user request; accepted change, both languages). Route: delegated.

## Acceptance criteria
- Every Spanish page has an English twin with a working switch both ways; `<html lang>` correct; forms work in EN with EN messages.
- hreflang pairs are reciprocal; sitemap lists all 22 URLs; JSON-LD valid JSON; titles/descriptions unique.

## Checks
Test-first exception: no runner. node --check, php -l in Docker, python HTML link/hreflang checks, Playwright.

## Progress / Evidence
T1: `node --check script.js` OK; `php -l` OK on 7.4 and 8.3; PHP 8.3 harness: EN JSON returns English message, no-JS EN 303 -> `/en/contacto.html#enviado|#error` (reclamo -> `/en/libro-de-reclamaciones.html#error`), ES unchanged, unknown `idioma` falls back to es, business mail carries `Idioma: en|es`; python check (IDs/tag counts vs ES twins, h1=1, refs resolve, chrome md5 identical per language, switch current/hrefs) PASS, only dangling links are the five EN legal twins (T2); Playwright: no horizontal scroll at 1366/390/360 on ES/EN home and EN contact, switch ES<->EN lands on twins, EN validation hints and mocked success panel in English, toggle name "Light theme"/"Tema claro", no console errors. Commit: see git log (feat: add English mirror and language switch).

T4: `.hero-foto` is `inset: 0; width: 100%` at every width (no right-side fade; one left-to-right + top + bottom scrim on `.hero-medio::after`); hero max height raised 940 -> 1400px so it fills 1920x1080 and tablets; HTML unchanged (first slide already eager + fetchpriority high, per-photo `--encuadre` kept after visual review of all 4 slides at 1366/1920). Playwright: contrast of H1/description/meta/links over the 98th-percentile brightest pixels of each of the 4 slides, 1920x1080 and 1366x800, all >= 5.3:1 (description >= 7.3, H1 >= 7.4); 820 and 390 >= 7.5 (hero-meta >= 6.2); hero bottom == viewport bottom at 1920/1366/820; scroll 0/300/800 (dark and light) no gap, header solid then hidden; EN home same geometry; no horizontal scroll at 390/360; reduced motion: slide static, pause hidden, no animation; no-JS shows slide 1 + H1; no console errors. Commit: see git log.

T2: five `en/` legal twins built (courtesy translations, not legally reviewed; notice + link to the Spanish original under the h1). python check: h1=1, h2/h3/li/tr/ul/img/select/option/textarea counts identical to ES twins (only +1 p, +1 a for the notice, +1 hidden `idioma` input on libro), all internal refs resolve (the dangling footer links are now resolved), chrome md5 identical to `en/index.html` after normalisation, switch hrefs/`aria-current` correct, every number/date/percentage of each Spanish page appears in its twin. Playwright (new tab, port 8015): no horizontal scroll at 1366/390 on all five, notice visible, ES<->EN switch lands on the twin for all five pairs, EN libro validation hints in English, mocked success shows the English claim-number message and the POST carries `idioma=en` + `formulario=reclamo`, no console errors. Only styles.css change: `.legal .nota` gets `margin-bottom: 24px`. Commit: see git log.

T3: unique titles (29-56 chars) and descriptions (139-158) on all 22 pages; self canonical + reciprocal hreflang es/en/x-default; OG/Twitter with existing business photos (pntm-01, lagu-11, honol-08, prox-01, logo.png); JSON-LD TravelAgency (homes), TouristTrip + BreadcrumbList (tours), BreadcrumbList (other inner pages); sitemap.xml (22 URLs with alternates) and robots.txt (deploy excludes do not touch them); width/height on all images, hero preload, footer h4 -> h3 (CSS `.pie h3`), libro tutor h3 -> h2. Python check: 22 pages, 0 errors (titles/descriptions unique and in range, canonical, hreflang reciprocity, OG files exist, JSON-LD parses with no forbidden keys, one h1, no heading skips, no img without alt/dims, sitemap matches files, robots OK); `xmllint --noout sitemap.xml` OK; Playwright (port 8016 vs HEAD on 8017): layout of all 22 pages at 1366/390 identical to HEAD (image rects, scrollHeight, footer computed styles), no console errors, slider still advances, canonical/hreflang resolve. Commit: see git log.

## Next step
The business should review the English legal translations, submit the sitemap in Search Console and set up a Google Business Profile.
