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
- [ ] T2 — English legal pages. Route: delegated.
- [ ] T3 — SEO pass. Route: delegated.

## Acceptance criteria
- Every Spanish page has an English twin with a working switch both ways; `<html lang>` correct; forms work in EN with EN messages.
- hreflang pairs are reciprocal; sitemap lists all 22 URLs; JSON-LD valid JSON; titles/descriptions unique.

## Checks
Test-first exception: no runner. node --check, php -l in Docker, python HTML link/hreflang checks, Playwright.

## Progress / Evidence
T1: `node --check script.js` OK; `php -l` OK on 7.4 and 8.3; PHP 8.3 harness: EN JSON returns English message, no-JS EN 303 -> `/en/contacto.html#enviado|#error` (reclamo -> `/en/libro-de-reclamaciones.html#error`), ES unchanged, unknown `idioma` falls back to es, business mail carries `Idioma: en|es`; python check (IDs/tag counts vs ES twins, h1=1, refs resolve, chrome md5 identical per language, switch current/hrefs) PASS, only dangling links are the five EN legal twins (T2); Playwright: no horizontal scroll at 1366/390/360 on ES/EN home and EN contact, switch ES<->EN lands on twins, EN validation hints and mocked success panel in English, toggle name "Light theme"/"Tema claro", no console errors. Commit: see git log (feat: add English mirror and language switch).

## Next step
Delegate T2 (English legal pages; they also resolve the dangling footer links).
