# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static marketing site (Spanish, `lang="es"`) for "Los Cristales", a travel agency in Tingo María, Peru (legal entity: CORPORACIÓN TULUMAYO MYSTIC S.A.C.). Plain HTML + one shared stylesheet + one vanilla JS file. No build step, no package manager, no tests, no linter.

## Commands

- Preview: `python3 -m http.server` from the repo root (port 8000; if "Address already in use", a server is already running — reuse it or pick another port).
- Syntax check JS: `node --check script.js`.
- Visual checks: headless Chrome screenshots (`--headless=new --screenshot`). It enforces a ~500px minimum window width, so check mobile by screenshotting a temporary wrapper page with 390px iframes (delete it afterwards). `--dump-dom` renders no frames, so CSS transitions never progress there.
- Deploy: **every push to `main` deploys to production** (cPanel over FTPS, `.github/workflows/deploy.yml`; credentials live in GitHub secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`). The workflow excludes `.git*`, `.github/`, `.atl/`, `odd/`, `.DS_Store` and `CLAUDE.md`. Work on feature branches; merge to `main` or push only when a production release is intended.

## Workflow

- Git repo with work on feature branches; work is tracked through Gentle AI ODD feature documents in `odd/tasks/` (mirrored in Engram) and reviewed via `gentle-ai review` (receipt-driven development is on). `.atl/` is a generated local skill registry and is gitignored.

## Architecture

- `styles.css` is the single stylesheet, following the "Navan" design: cool canvas `--lienzo` (#f1f1f9) with white 14px-radius cards, deep iris `--iris-profundo` (#15002c) for headings, dark panels and the full-bleed footer, body text `--tinta` with muted `--grafito`/`--humo`, hairlines `--perla`, soft highlight cards `--niebla-iris` (#e1e2fe). The vivid violet `--violeta-vivo` (#6307f8) is a **CTA fill only**: the nav CONTACTO pill (styled via `.menu > li:last-child > a`, no markup) and one primary content button per page (`.boton` / `.boton.verde`); never text, borders or large fills. Secondary actions are `.boton.fantasma` (ghost) or `.boton.claro` (white). Radius 14px for cards, buttons, inputs and badges; 9999px only for nav-level pills. No shadows except the hero's floating card (`.tarjeta-flotante`) and the WhatsApp float. Gradients are atmospheric only (`--degradado-crepusculo` on the hero panel, `--haz` beam on dark panels), never on buttons, cards or text. Type: Inter 300–500 (never bold; the hero wordmark is Inter 300 with +0.04em tracking) and Source Serif 4 for editorial headlines; don't mix the two on one line. `.banda-oscura` is a contained deep-iris panel, distinct from the full-bleed footer. Class names and tokens are in Spanish.
- Legacy aliases `--gris`, `--divisor`, `--verde-oscuro` must stay in `:root`: `libro-de-reclamaciones.html` uses them in inline styles.
- `script.js` (loaded with `defer` on every page, one IIFE with commented sections) adds progressive enhancements only; pages must stay usable without it: header state on scroll (`.cabecera.con-sombra`), mobile menu closing, staggered scroll reveals (JS adds `.revelar` and a `--i` index; observer uses threshold 0 so very tall blocks still reveal), parallax (hero image and `.portada-tour::after`, using `translate`/`scale` properties so CSS animations don't override inline styles), the gallery lightbox (hijacks `.galeria a`), and the contact form (composes a WhatsApp message).
- The home hero entrance is CSS-only (masked `.mascara` lines, `animation-fill-mode: both`), so it also runs without JS. All motion is disabled under `prefers-reduced-motion` in both CSS and JS.
- There is no templating or include system. The top bar, header/nav, footer, floating WhatsApp button (`.wa-flotante`) and script tag are **copy-pasted into all 11 HTML pages**. Any change to them must be applied everywhere; verify with `grep -c` across `*.html`. Legal pages contain a second `</ul></nav>` (`.otras-politicas`), so scripted nav edits must anchor on `<ul class="menu">`.
- Nav: INICIO, TOURS (submenu), CONTACTO. `index.html` uses `#tours`; other pages use `index.html#tours`. The mobile menu is a CSS checkbox toggle (`#menu-toggle:checked ~ nav .menu`; the menu is inside `<nav>`, not a sibling).
- Page types:
  - Home `index.html`: hero panel (wordmark, serif headline ending with a period, photo with a floating white card of real tour facts), `.grid-tours` of `.tarjeta-tour` cards, contact CTA band.
  - Tour pages (`parque-nacional-tingo-maria`, `laguna-de-los-milagros`, `catarata-honolulo`): `.portada-tour` (background image via inline `style`), `.migas`, `.itinerario`, `.galeria`, `.acciones` with a tour-specific prefilled WhatsApp link. Adding a tour means: new page, a card in `index.html`, and a submenu entry in every page's nav.
  - `contacto.html`: contact feature blocks, iris-mist WhatsApp card (`.tarjeta-niebla`), and `form.contacto#form-contacto` in a dark band. With JS it opens `wa.me` with a composed message (and always shows a fallback link, since `window.open(..., 'noopener')` can't detect popup blocking); without JS it falls back to a `mailto:` post.
  - Legal pages: `terminos-y-condiciones`, `politicas-de-pago`, `politicas-de-privacidad`, `proteccion-de-datos-personales`, `prevencion-esnna`, `libro-de-reclamaciones` (Peruvian regulatory requirement; its claims form posts via `mailto:` to a different inbox than the contact form).
- Images: tour photos in `img/` named `<prefix>-NN.jpg` (`pntm` = Parque Nacional, `lagu` = Laguna, `honol` = Honolulo). Logos/favicon and the two ESNNA images sit in the repo root.

## Conventions

- Contact data (phone `978571323` / `+51978571323`, `info@turismoloscristales.com`, WhatsApp `wa.me/51978571323`, RUC 20616494750) is hardcoded in many places; search before changing. Don't invent business data (hours, social accounts, map pins).
