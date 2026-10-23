# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static marketing site (Spanish, `lang="es"`) for "Los Cristales", a travel agency in Tingo María, Peru (legal entity: CORPORACIÓN TULUMAYO MYSTIC S.A.C.). Plain HTML + one shared stylesheet + one vanilla JS file. No build step, no package manager, no tests, no linter.

## Commands

- Preview: `python3 -m http.server` from the repo root (port 8000; if "Address already in use", a server is already running — reuse it or pick another port).
- Syntax check JS: `node --check script.js`.
- Visual checks: headless Chrome screenshots (`--headless=new --screenshot`). It enforces a ~500px minimum window width, so check mobile by screenshotting a temporary wrapper page with 390px iframes (delete it afterwards). `--dump-dom` renders no frames, so CSS transitions never progress there.
- Deploy: no config in the repo; files are served as-is.

## Workflow

- Git repo with work on feature branches; work is tracked through Gentle AI ODD feature documents in `odd/tasks/` (mirrored in Engram) and reviewed via `gentle-ai review` (receipt-driven development is on). `.atl/` is a generated local skill registry and is gitignored.

## Architecture

- `styles.css` is the single stylesheet, following the "Hyer" editorial design: white canvas, ink `--tinta` (#000d10) for all text, filled buttons and the footer; muted `--ceniza`; hairlines `--guijarro` only; dark full-bleed bands `.banda-oscura` (`--medianoche`/`--cubierta`). The clay accent `--arcilla` is used on **at most one element per page** (home: `.tarjeta-tour.destacada`; contacto: `.tarjeta-arcilla`; ESNNA: `.alerta-esnna`). No box-shadows; buttons are 1000px pills (`.boton` filled, `.boton.fantasma` ghost, `.boton.claro` white); cards/images/panels are 0 radius. Display type is Inter 700 with tight negative tracking; body 18px/1.61. The only gradient is the home hero sky (`--degradado-portada`). Class names and tokens are in Spanish.
- Legacy aliases `--gris`, `--divisor`, `--verde-oscuro` must stay in `:root`: `libro-de-reclamaciones.html` uses them in inline styles.
- `script.js` (loaded with `defer` on every page, one IIFE with commented sections) adds progressive enhancements only; pages must stay usable without it: header state on scroll (`.cabecera.con-sombra`), mobile menu closing, staggered scroll reveals (JS adds `.revelar` and a `--i` index; observer uses threshold 0 so very tall blocks still reveal), parallax (hero image and `.portada-tour::after`, using `translate`/`scale` properties so CSS animations don't override inline styles), the gallery lightbox (hijacks `.galeria a`), and the contact form (composes a WhatsApp message).
- The home hero entrance is CSS-only (masked `.mascara` lines, `animation-fill-mode: both`), so it also runs without JS. All motion is disabled under `prefers-reduced-motion` in both CSS and JS.
- There is no templating or include system. The top bar, header/nav, footer, floating WhatsApp button (`.wa-flotante`) and script tag are **copy-pasted into all 11 HTML pages**. Any change to them must be applied everywhere; verify with `grep -c` across `*.html`. Legal pages contain a second `</ul></nav>` (`.otras-politicas`), so scripted nav edits must anchor on `<ul class="menu">`.
- Nav: INICIO, TOURS (submenu), CONTACTO. `index.html` uses `#tours`; other pages use `index.html#tours`. The mobile menu is a CSS checkbox toggle (`#menu-toggle:checked ~ nav .menu`; the menu is inside `<nav>`, not a sibling).
- Page types:
  - Home `index.html`: hero (wordmark, headline ending with a period, hero image), `.grid-tours` of `.tarjeta-tour` cards, contact CTA band.
  - Tour pages (`parque-nacional-tingo-maria`, `laguna-de-los-milagros`, `catarata-honolulo`): `.portada-tour` (background image via inline `style`), `.migas`, `.itinerario`, `.galeria`, `.acciones` with a tour-specific prefilled WhatsApp link. Adding a tour means: new page, a card in `index.html`, and a submenu entry in every page's nav.
  - `contacto.html`: contact feature blocks, clay WhatsApp card, and `form.contacto#form-contacto` in a dark band. With JS it opens `wa.me` with a composed message (and always shows a fallback link, since `window.open(..., 'noopener')` can't detect popup blocking); without JS it falls back to a `mailto:` post.
  - Legal pages: `terminos-y-condiciones`, `politicas-de-pago`, `politicas-de-privacidad`, `proteccion-de-datos-personales`, `prevencion-esnna`, `libro-de-reclamaciones` (Peruvian regulatory requirement; its claims form posts via `mailto:` to a different inbox than the contact form).
- Images: tour photos in `img/` named `<prefix>-NN.jpg` (`pntm` = Parque Nacional, `lagu` = Laguna, `honol` = Honolulo). Logos/favicon and the two ESNNA images sit in the repo root.

## Conventions

- Contact data (phone `978571323` / `+51978571323`, `info@turismoloscristales.com`, WhatsApp `wa.me/51978571323`, RUC 20616494750) is hardcoded in many places; search before changing. Don't invent business data (hours, social accounts, map pins).
