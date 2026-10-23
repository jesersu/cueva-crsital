# Feature: forms-php-mailer

Locator: `odd/tasks/forms-php-mailer.md` · Engram topic: `odd/forms-php-mailer/tasks` · Branch: `fix/forms-php-mailer` (from `main` @ a8a4daf)

## Objective
Make the contact form and the Libro de Reclamaciones actually deliver email through a server-side PHP handler on the cPanel host, sending to `jesersu@gmail.com` for testing, and stop Chrome's "Form is not secure" interstitial.

## Problem / Why
Both forms post to `action="mailto:…"`. Chrome treats a mailto: form submission from an HTTPS page as insecure and shows the "La información que estás a punto de enviar no está protegida" interstitial (reproduced on production with Playwright: `chrome-error://chromewebdata/`, title "Form is not secure"). mailto: also only opens the visitor's mail app, so nothing is delivered reliably. Also, `http://` is served without redirecting to HTTPS.

## Scope
- T1: `enviar.php` handler (both forms), forms posting to it over HTTPS, success/error feedback that works without JS, contact form no longer composes WhatsApp (the WhatsApp card stays), Libro copy updated; CLAUDE.md.
- T2: `.htaccess` HTTP→HTTPS redirect.

## Constraints
- Recipient lives only server-side (PHP constant), `jesersu@gmail.com` for testing; easy to switch back.
- Security: validate/trim/length-limit every field, strip CR/LF from anything placed in headers, `From:` a fixed domain address, customer email only as validated `Reply-To`, honeypot field, simple per-IP rate limit or time check, POST only, no reflected user input in redirects/HTML.
- Libro de Reclamaciones (Peru, Indecopi): send the consumer a copy of the claim when a valid email is provided.
- No PHP runtime locally (`php` not installed) → syntax/behavior can only be fully verified after deploy; a real test submission is needed.
- Push/merge to `main` deploys to production → only with explicit user approval.

## Delivery strategy
`exception-ok` — small, focused work units.

## Tasks
- [x] T1 — PHP mailer + forms wiring. Route: delegated (4+ non-trivial files).
- [x] T2 — HTTPS redirect in `.htaccess`. Route: inline (one mechanical file). Commit 77c7a57.

## Acceptance criteria
- Both forms POST to `enviar.php` over HTTPS; no mailto: form actions remain; no Chrome insecure-form interstitial.
- Successful submission emails `jesersu@gmail.com` (subject identifies form type) and shows a success message; errors show a message; works without JS.
- `http://` redirects to `https://` (301).

## Checks
- Test-first exception: no PHP runtime or test runner locally. Structural review, `node --check script.js`, HTML greps, visual checks of the success/error states; post-deploy real submission.

## Progress / Evidence
- T2 (inline). `.htaccess` 301 HTTP→HTTPS via mod_rewrite (honors `X-Forwarded-Proto`, skips `/.well-known/` for AutoSSL). Check: readback; live verification after deploy. Commit 77c7a57.
- T1 (delegated writer; trigger: 5 non-trivial files + new PHP). New `enviar.php` (~440 lines): POST only; per-form field whitelist with types/lengths/choices; CR/LF stripped, only a validated Reply-To from input; fixed From + `-f` envelope; honeypot `campo_control`; `tiempo` min 3s (skipped without JS); per-IP (REMOTE_ADDR) 5/10 min limit in the temp dir with flock, fail-open; reclamo number `LR-YYYYMMDD-HHMMSS-XXXX` + consumer copy; JSON for fetch, otherwise 303 to `#enviado`/`#error` from an allowed page list. Forms post to `enviar.php`, inputs renamed to match; `:target` success/error blocks; `script.js` fetch enhancement for both forms (WhatsApp composition removed; card/float kept); contact and libro copy updated; CLAUDE.md. Evidence: `node --check` OK (writer + parent); field-name cross-check (writer). Parent, PHP in Docker: `php -l` clean on 7.4 and 8.3; php:8.3 built-in server with a capturing sendmail: GET → 303 contacto.html; no-JS contact → 303 `#enviado`; JSON contact ok; `tiempo=500` rejected; honeypot → fake success, no mail; CR/LF+Bcc in nombre/contacto → flattened into the body only, no extra headers, no Reply-To; missing fields → error; bad `formulario` → 303 `#error`; reclamo → business mail (Reply-To consumer) + consumer copy with the same number; rate limit → 429 after 5 accepted (X-Forwarded-For ignored). Post-deploy pending: real delivery to jesersu@gmail.com (check spam), SPF/DKIM, server PHP version.

- Review: slice a8a4daf..414186c (787 lines), consent GRANTED, 1-lens reliability review approved and acknowledged. Advisories: R3-network-fallback-duplicate (accepted, fixed: a fetch rejection now shows an error and never resubmits natively); R3-target-notice-lingers (accepted, fixed: JS hides `.aviso-envio` on submit + `.aviso-envio[hidden] { display: none; }`); R3-opaque-validation-errors (acknowledged: rare edge cases such as dotless-domain emails and `1e3`; generic message kept); R3-rate-limit-shared-ip (checked: plain cPanel Apache, REMOTE_ADDR is the client; counting attempts before mail() is intentional anti-abuse); R3-test-inbox-destination (intentional, user-requested testing inbox; restore before go-live, tracked as next step); R3-no-automated-php-checks (acknowledged; the Docker harness is documented above).

- Re-review (a8a4daf..aae57c8, 794 lines): consent GRANTED; approved and acknowledged. Advisories: R3-nojs-claim-number-lost (accepted, fixed: the no-JS reclamo success now renders a minimal noindex page with the escaped message incl. the claim number and whether the copy was sent, instead of a static #enviado redirect; Docker php -l 7.4/8.3 clean; php:8.3 harness: no-JS reclamo → 200 page with the number, JSON unchanged, contact no-JS still 303 #enviado); R3-test-inbox-in-consumer-copy (intentional for testing; restore DESTINO before go-live); R3-no-repeatable-php-checks (acknowledged).

## Status
Done on `fix/forms-php-mailer` (local). The user decides push/merge (push to `main` = production deploy).

## Next step
User decision on delivery; then a real test submission and later restore `DESTINO`.
