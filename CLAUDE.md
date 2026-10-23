# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static marketing site (Spanish, `lang="es"`) for "Los Cristales", a travel agency in Tingo María, Peru (legal entity: CORPORACIÓN TULUMAYO MYSTIC S.A.C.). Plain HTML + one shared stylesheet. No build step, no package manager, no JS, no tests, no linter, not a git repo.

## Commands

- Preview: open `index.html` directly, or `python3 -m http.server` from the repo root.
- Deploy: no config in the repo; files are served as-is (a Netlify MCP is available in the environment, but no `netlify.toml` exists).

## Architecture

- `script.js` (vanilla JS, loaded with `defer` on every page) adds progressive enhancements: header shadow, mobile menu closing, scroll reveal (`.revelar`), and a gallery lightbox that hijacks `.galeria a` clicks. Pages must still work without it.
- `styles.css` is the single stylesheet for every page, following the "Portrait" design: white canvas, navy ink (`--tinta`) for all text and lines, pastel washes (`--menta`, `--cielo`, `--durazno`) only on small surfaces, and the `--arcoiris` gradient reserved for the primary `.boton` border and one italic `.arcoiris` word per headline. Secondary actions use `.boton.fantasma`. Fonts: Switzer (UI) and Plus Jakarta Sans (display, substituting Basier Circle), loaded via `@import`. Reuse the `:root` tokens rather than hardcoding colors. Class names are in Spanish (`.contenedor`, `.cabecera`, `.tarjeta-tour`, `.bloque`, `.pie`).
- There is no templating or include system. The top bar, header/nav, footer, and floating WhatsApp button (`.wa-flotante`) are **copy-pasted into every HTML page**. Any change to them (phone, address, email, nav links, footer policy links, company data) must be applied to all 10 pages or they will drift. Use `grep -l` across `*.html` to verify.
- Nav quirk: `index.html` uses `#tours` anchors; other pages use `index.html#tours`. The mobile menu is a CSS-only checkbox hack (`#menu-toggle` + `.boton-menu` label); the submenu opens via `:focus-within`/hover.
- Page types:
  - Home: `index.html` (hero + `.grid-tours` of `.tarjeta-tour` cards).
  - Tour pages: `parque-nacional-tingo-maria.html`, `laguna-de-los-milagros.html`, `catarata-honolulo.html`. Each has `.portada-tour` (background image set via inline `style`), breadcrumb `.migas`, `.itinerario` list, `.galeria` photo grid, and `.acciones` buttons with a tour-specific WhatsApp prefilled link. Adding a tour means: new page, a card in `index.html`, and a submenu entry in every page's nav.
  - Legal pages: `terminos-y-condiciones`, `politicas-de-pago`, `politicas-de-privacidad`, `proteccion-de-datos-personales`, `prevencion-esnna`, `libro-de-reclamaciones` (Peruvian regulatory requirement). The claims form submits via `mailto:` (no backend).
- Images: tour photos in `img/` named `<prefix>-NN.jpg` (`pntm` = Parque Nacional, `lagu` = Laguna, `honol` = Honolulo). Logos/favicon and the two ESNNA images sit in the repo root.

## Conventions

- Contact data (phone `978571323` / `+51978571323`, `info@turismoloscristales.com`, WhatsApp `wa.me/51978571323`, RUC 20616494750) is hardcoded in many places; search before changing.
- Most HTML files and `styles.css` are read-only on disk (`-r--r--r--`): `chmod u+w` before editing.
