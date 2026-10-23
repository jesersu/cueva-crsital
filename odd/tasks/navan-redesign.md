# Feature: navan-redesign

Locator: `odd/tasks/navan-redesign.md` · Engram topic: `odd/navan-redesign/tasks` · Branch: `feat/navan-redesign` (from `main` @ 5a1da87)

## Objective
Replace the "Hyer" look with the user-provided "Navan" style reference across all 11 pages, keeping existing behavior (nav, lightbox, contact form, animations) working. Vanilla HTML/CSS/JS only.

## Problem / Why
The user wants a new visual direction: premium travel-portal language — cool off-white canvas `#f1f1f9`, white cards, near-black violet `#15002c` for text/dark surfaces, one vivid violet `#6307f8` for the primary action, soft Iris Mist `#e1e2fe` highlight cards, a violet→rose atmospheric gradient hero, editorial serif headlines over a light grotesque body, 14px radii, deep-iris footer band.

## Scope
- `styles.css` full reskin to Navan tokens; every selector used by the 11 pages keeps a sensible style.
- Home hero recomposed (violet-twilight gradient, whisper-weight display, floating white "product" card over a photo).
- Minimal markup tweaks in `index.html` / `contacto.html` only where the design needs them.
- Animations from the previous feature keep working (restyled colors only).

## Constraints
- Fonts: Neue Haas Grotesk and Sanomat are commercial → Inter (300/400/500) for UI/body/display and Source Serif 4 for editorial headlines (substitutes named in the spec).
- Vivid Iris only as a CTA fill: the nav CONTACTO pill + one primary content CTA per page; never text, borders or large fills. No other hues.
- 14px radius for cards/buttons/inputs/badges; 9999px only for nav-level pills. No drop shadows on standard cards (only the floating card may have one soft shadow). One gradient per page region; no gradients on buttons/cards/text. Body 300–500 weights, never bold.
- Shared header/footer markup is duplicated: avoid HTML changes there (style via CSS) unless all pages are updated.
- Keep legacy aliases (`--gris`, `--divisor`, `--verde-oscuro`) used by inline styles in libro-de-reclamaciones.html.
- No JS-only content; reduced-motion and no-JS behavior preserved; no horizontal scroll at 360–390px.
- Delivery: `main` auto-deploys to production via `.github/workflows/deploy.yml` (FTPS) → merge/push only with explicit user approval.

## Delivery strategy
`exception-ok` — one coherent reskin; splitting would leave the site half-styled. Branch stays local until the user approves merge/push (push = production deploy).

## Tasks
- [x] T1 — Reskin `styles.css` to Navan + home hero/floating card in `index.html` (+ minimal `contacto.html` tweaks if needed); gitignore `.playwright-mcp/`. Route: delegated (2+ non-trivial files).
- [ ] T2 — Update `CLAUDE.md` design + delivery notes (auto-deploy on main). Route: inline (one mechanical file).

## Acceptance criteria
- All page types render in Navan style at 1366px and 360/390px; no horizontal scroll.
- Vivid Iris appears only on the nav pill and one primary CTA per page.
- `node --check script.js` passes; lightbox, mobile menu, reveals, contact form still work; reduced-motion and no-JS show all content.

## Checks
- Test-first exception: static site, no test runner. Structural (`node --check`, grep token usage) and visual (headless Chrome screenshots; 390px via iframe wrapper; no-JS via sandboxed iframe; reduced motion via `--force-prefers-reduced-motion`).

## Progress / Evidence
- T1 (delegated writer; trigger: 2+ non-trivial files). styles.css full rewrite with Navan tokens (`--iris-profundo`, `--violeta-vivo`, `--niebla-iris`, `--lienzo`, ...; legacy aliases kept); index.html hero reordered + floating white card (`figcaption.tarjeta-flotante`, facts from catarata-honolulo.html only); contacto.html `.tarjeta-arcilla` → `.tarjeta-niebla`, submit is now vivid `.boton`; script.js reveal selector renamed; `.playwright-mcp/` gitignored. Diff +554/−373. Evidence: `node --check` OK (writer + parent); desktop (home, tour, contacto, ESNNA, libro), 360/390px mobile and no-JS screenshots inspected by the writer; parent spot-checked the home hero. Vivid `--violeta-vivo` used only as a fill on the nav CONTACTO pill, `.boton` and `.boton.verde` (one content CTA per page type). No clay or Hyer gradient left. Known: libro-de-reclamaciones.html keeps a pre-existing inline red asterisk (out of scope). Visual note: hero subtext sits low in its column, leaving a gap under the headline (cosmetic, not fixed).

## Next step
T2.
