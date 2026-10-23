# Feature: terra-redesign

Locator: `odd/tasks/terra-redesign.md` · Engram topic: `odd/terra-redesign/tasks` · Branch: `feat/terra-redesign` (from `feat/legal-docs-proximamente` @ 2ce9d0b, which is not merged yet)

## Objective
Apply the user-provided "Terra Voyages v1.0" design specification's visual system to the Los Cristales site: Deep Slate dark-first theme with a persistent light/dark toggle, Teal primary actions, Aged Gold accents, Playfair Display + Lato, transparent header over the hero with a gold-bordered "Reservar" CTA, and the spec's animations — in vanilla HTML/CSS/JS.

## Problem / Why
The user asked to switch the current Apple-style design to this specification. The spec targets another brand and a React/Tailwind stack, so only the design system and interaction patterns transfer.

## Scope
- T1: design system + global chrome on all 11 pages: tokens (Deep Slate #2D3436, Pure White #FFFFFF, Teal #008080, Mist Gray #F5F6FA, Aged Gold #C4A77D), Playfair Display (headings) + Lato (body/UI), dark-first with `[data-theme]` light mode and a header toggle persisted in localStorage (default dark, no flash), header transparent over the home hero and solid on internal pages, header CTA "Reservar" (gold glowing border) → contacto.html, Teal primary buttons, global animations (300ms page fade, button hover darken + scale 1.02, card image zoom 1.05, reveal fade + translateY(20px)).
- T2: home + contact page patterns: hero scrim and H1 typewriter-style entrance (existing Los Cristales copy), tours as a 3-card grid with gold underline on hover, contact page two-column layout with Aged Gold icons, real-time validation (red/green borders) and a fade-in success state replacing the form.

## Out of scope (spec items that would require invented content or a different stack)
- Brand name/copy ("Terra Voyages", "redefine luxury"), Patagonia/Kyoto/Amalfi destinations, testimonials, About Us/team page, business hours, social icons, newsletter, trust badges, Google Map embed, hero video, search/booking bar, React/Tailwind/Framer Motion, JSON i18n. EN/ES bilingual support is a separate decision for the user.

## Constraints
- Keep all existing pages, content, legal texts, forms (`enviar.php` contract and field names), hero slider, Próximamente carousel, lightbox, mobile menu, no-JS usability, reduced motion, accessibility (contrast in both themes), no horizontal scroll at 360–390px.
- Shared chrome changes applied identically to all 11 pages (`grep -c`).
- No invented business data. Push/merge to `main` deploys to production → only with explicit user approval.

## Delivery strategy
`exception-ok` — a full reskin is one coherent change per task; branch stays local until the user approves.

## Tasks
- [x] T1 — Design system, theme toggle, header/footer, global animations. Route: delegated (13+ files).
- [x] T2 — Home and contact page patterns. Route: delegated (4 files).
- [x] T3 — CLAUDE.md update. Route: inline.

## Acceptance criteria
- Dark theme by default, light theme via the toggle on every page, persisted, no flash of the wrong theme; WCAG AA text contrast in both.
- Teal only for primary actions/active links; gold for accents/icons/CTA border; Playfair headings, Lato body.
- All existing behaviors keep working; `node --check script.js` passes; no horizontal scroll at 360–390px.

## Checks
- Test-first exception: no runner. `node --check`, greps, Playwright checks of toggle persistence, forms, sliders; screenshots dark/light at 1366/390.

## Progress / Evidence
- T1 (delegated writer; trigger: 13 files). styles.css rewritten on new tokens (dark `:root`, light `:root[data-theme="light"]`; teal #008080 fills, `--enlace` #5FC9C9 dark / #006B6B light for small text, gold `--oro`/`--oro-texto`; hero, covers, footer, top bar and lightbox stay dark in both themes; legacy aliases kept); Playfair Display + Lato via `<link>` with swap; header identical on 11 pages: logo, centred nav, gold sun/moon `.tema-toggle` (aria-pressed, localStorage `tema`, inline head script sets `data-theme` + theme-color before paint, hidden without JS) and gold-glow "Reservar" CTA; home header transparent over the hero (`body.inicio` + `.dinamica`/`.solida` from the scroll loop); 300ms page fade, button darken + 1.02, image zoom 1.05, reveal fade + 20px; reduced motion off. Pre-existing bug fixed: the mobile menu closed immediately because the outside-click handler saw the checkbox's synthetic click. +864/−534. Evidence (writer, Playwright with cache disabled): toggle/persistence/no flash; header transparent→solid; mobile menu at 390; hero slider, Próximamente arrows, lightbox, contact validation OK; contrast table (all ≥4.5 incl. white on teal 4.77); reduced motion 0 animations; no horizontal scroll at 1366/390/360. Parent: `node --check` OK, toggle on all 11 pages, light-theme home screenshot checked. For T2: WhatsApp float overlaps the hero "Reservar" at 390px; consider a fixed toggle label with aria-pressed.
- T2 (delegated writer; trigger: 13 files). Hero bottom scrim; JS typewriter H1 (opacity-only letters, sr-only full copy, gold caret, no-JS keeps the line-rise, reduced motion static); `.grid-tours` as 1:1 photo cards with a reserved gold underline on hover (fine pointers) and focus-visible (3/2/1 columns); contacto two columns (gold-icon details, form card, full-width teal submit; WhatsApp card folded into the list); JS live validation on contacto and libro (`noValidate`, red/green borders, `aria-invalid` + `aria-describedby` hints, focus first invalid); contact fetch success replaces the form with a focused `role="status"` panel + "Enviar otro mensaje"; ≤560px glass bar stacks so the WhatsApp float can't cover "Reservar"; toggle name fixed to "Tema claro" with `aria-pressed`. +437/−105. Evidence (writer, Playwright new contexts incl. no-JS and reduced motion, mocked enviar.php success/500): H1 read once, same height in all modes; squares 387/343/313; validation colors + aria in both themes; success/failure flows; `#enviado` no-JS notice; no WhatsApp overlap at 390/360; toggle label on all 11; no horizontal scroll. Not re-tested: Próximamente carousel and lightbox (code untouched). Parent: `node --check` OK; contacto dark 1366 screenshot checked; form contract (action, correo, honeypot) intact.
- T3 (inline). CLAUDE.md: styles bullet rewritten for the Terra system (tokens, themes, fonts, toggle, header), home and contacto page descriptions updated; no Apple/blue references left.

## Status
All tasks done on `feat/terra-redesign` (local; it also carries the unmerged `feat/legal-docs-proximamente` commits). Open: EN/ES bilingual decision; out-of-scope spec items need real content.

## Next step
Review, then the user's delivery decision.
