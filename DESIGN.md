---
name: Los Cristales
description: Light-by-default airy travel site (deep slate dark theme behind a toggle) with teal actions and aged-gold accents, led by real photos of Tingo María.
colors:
  deep-slate: "#2D3436"
  slate-band: "#262C2E"
  slate-card: "#363E41"
  slate-footer: "#23292B"
  pure-white: "#FFFFFF"
  mist-gray: "#F5F6FA"
  teal: "#008080"
  teal-hover: "#007373"
  teal-link-dark: "#5FC9C9"
  teal-link-light: "#006B6B"
  aged-gold: "#C4A77D"
  gold-text-light: "#7D5F34"
  text-muted-dark: "#AFB8BC"
  error-dark: "#FF9A8F"
  error-light: "#B3261E"
  success-dark: "#6FCF97"
  success-light: "#1E7B4A"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(44px, 7vw, 84px)"
    fontWeight: 600
    lineHeight: 1.15
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(30px, 3.6vw, 44px)"
    fontWeight: 600
    lineHeight: 1.15
  body:
    fontFamily: "Lato, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Lato, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.14em"
rounded:
  link: "10px"
  medium: "16px"
  card: "24px"
  field: "210px"
  pill: "9999px"
spacing:
  gutter: "16px"
  container: "1200px"
  header: "64px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.teal-hover}"
  button-reserve:
    textColor: "{colors.mist-gray}"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
    height: "40px"
  tour-card:
    backgroundColor: "{colors.deep-slate}"
    textColor: "{colors.mist-gray}"
    rounded: "{rounded.card}"
  field:
    backgroundColor: "{colors.deep-slate}"
    textColor: "{colors.mist-gray}"
    rounded: "{rounded.field}"
    padding: "12px 20px"
    height: "52px"
---

# Design System: Los Cristales

## Overview

**Creative North Star: "El diario de la selva"**

A bright travel journal: a white, airy page, real photographs of Tingo María as the main event, and a single warm thread of aged gold marking the details that matter (labels, icons, the Reservar call). A deep slate night version sits behind the header toggle. The interface is serious and calm; teal is reserved for the one thing a visitor is meant to do next. It follows the user-supplied "Terra" spec, brand-agnostic parts only.

The system is light by default (white canvas, slate text, also without JS and on a first visit) with a full dark theme (deep slate canvas) behind a header toggle; a saved choice wins. The home hero, tour covers, footer, top bar and lightbox stay dark in both themes so photos always sit on slate. Motion is slow and cinematic for entrances (page fade 300ms, reveal fade with a 20px rise) and short for responses (hover darken, 1.02 scale, 1.05 image zoom).

**Key Characteristics:**
- Light airy canvas by default, dark slate theme as a true inversion, not a separate design.
- One icon set: inline SVG line icons on a 24 grid, 1.75 stroke, round caps and joins, `currentColor`; no emoji.
- Playfair Display headlines over Lato body; gold uppercase eyebrows.
- Pill buttons and pill fields, 24px cards; photos fill square tour cards.
- The first view of the home is the "Próximamente" announcement: a full-height dark hero whose photos (the upcoming cave) crossfade behind the "Agencia de viajes Los Cristales" heading.
- Gold glow only on the header "Reservar" border.
- Everything usable without JavaScript and under reduced motion.

## Colors

A 60-30-10 palette: slate surfaces, white/mist text and fills, teal for actions, gold for accents.

### Primary
- **Rainforest Teal** (#008080): fill of every primary action (`.boton`, form submits); white text on it is 4.77:1. Hover is ~10% darker (#007373).
- **Mint Link** (#5FC9C9 dark / #006B6B light): small teal text, links, focus ring; chosen only for AA contrast.

### Secondary
- **Aged Gold** (#C4A77D): eyebrows, icons, decorative lines, the "Reservar" border and the tour-card underline. As text on white it darkens to #7D5F34.

### Neutral
- **Deep Slate** (#2D3436): text in the light theme; the page in dark theme.
- **Slate Band** (#262C2E), **Slate Card** (#363E41), **Slate Footer** (#23292B): alternating bands, cards, footer/top bar.
- **Mist Gray** (#F5F6FA): primary text on dark; subtle fills and bands in light theme.
- **Pure White** (#FFFFFF): the default (light) canvas and text on teal. Light surfaces: band #F6F8FA, card #F3F5F8, secondary fill #E8ECF1.
- Muted text #AFB8BC on dark. Status colors: error #FF9A8F / #B3261E, success #6FCF97 / #1E7B4A (dark / light).

### Named Rules
**The One Action Rule.** Teal fills mark actions only; accents, labels and icons are gold. Never fill a decorative element with teal.
**The Contrast Pair Rule.** Small text uses `--enlace` and `--oro-texto`, never the raw brand teal or gold, which fail AA on one of the themes.

## Typography

**Display Font:** Playfair Display 600 (Georgia fallback)
**Body Font:** Lato 400/700 (system-ui fallback)

**Character:** An editorial serif for the voice, a plain humanist sans for the work.

### Hierarchy
- **Display** (600, clamp(44px, 7vw, 84px), 1.15): home hero and tour cover titles; the home H1 lines rise through a mask on load.
- **Headline** (600, clamp(30px, 3.6vw, 44px), 1.15): section titles.
- **Body** (400, 17px, 1.6): all copy; long-form legal text uses the softer `--texto-2`.
- **Label** (700, 13px, 0.14em, uppercase): gold eyebrows; the Reservar button uses 13px/0.12em.

### Named Rules
**The Serif-For-Voice Rule.** Playfair is for headings only; UI, forms and buttons are always Lato.

## Layout

A single 1200px container with a 16px minimum gutter, sections in generous vertical bands that alternate page and band tones. The header is 64px: logo left, centred nav, theme toggle and Reservar right; transparent over the home hero, solid elsewhere, hiding on scroll down. Tour cards are a 3/2/1 column grid of squares; the footer is 4/2/1 columns; contact is two columns collapsing to one at 860px. The home hero is full height (100svh minus the top bar, 620-940px): text on the left container grid, a photo stage filling the right 66% on desktop (full-bleed with a bottom scrim on phones), indicators and pause bottom-left; "Lo principal." follows directly. Nothing may scroll horizontally at 360–390px.

## Elevation & Depth

Flat and tonal. Depth comes from stepping tones (page, band, card, secondary fill) and hairlines. In the light theme cards add one very soft cool shadow (`--sombra`); dark has none. The only glow is the gold halo on the Reservar border (`0 0 14px rgba(196,167,125,.35)`, stronger on hover). Over photos, translucent glass (`blur(20px) saturate(1.2)`) holds controls such as the WhatsApp float and the hero pause button, with a solid fallback under reduced transparency.

### Named Rules
**The Tonal Depth Rule.** Separate surfaces by tone and hairlines (`rgba(245,246,250,.14)` on dark), not by drop shadows; the only shadow is the soft light-theme `--sombra`.

## Shapes

Rounded and pill-shaped: buttons and the header CTA are full pills (9999px), single-line fields are 210px-radius pills, textareas and cards use 24px, gallery images and small panels 16px, link hit areas 10px. Tour cards are 1:1 squares with the photo filling the frame.

## Components

### Buttons
- **Shape:** full pill (9999px), 12px 24px, Lato 700 16px.
- **Primary:** teal fill, white text; hover darkens to #007373 with scale 1.02; press scale 0.97.
- **Ghost / Light:** transparent with a 3:1 border, or a theme-inverting neutral pill.
- **Reservar (header):** 40px pill, gold 1px border with glow, uppercase 13px; hover adds a faint gold fill.

### Cards / Containers
- **Tour card:** 1:1, 24px radius, photo fills; the title gets a gold underline that draws in on hover (fine pointers) and focus-visible; the image zooms 1.05.
- **Fact and legal cards:** slate-card fill, 24px radius, no shadow.

### Inputs / Fields
- **Style:** 1px strong-line border, page-tone fill (reads inset on cards), 52px min height, pill radius.
- **Focus:** 2px teal ring, border transparent.
- **Validation:** red/green borders with `aria-invalid` and a linked text hint; success replaces the form with a status panel.

### Navigation
Centred uppercase-free Lato links, active link in teal text, TOURS submenu (hover/first-tap on desktop). Mobile is a CSS checkbox menu. Theme toggle: gold moon (light, default) / sun (dark) icon button named "Tema claro" with `aria-pressed` (true = light).

### Hero slider
The four Próximamente photos crossfade every 5.5s with a slow Ken Burns zoom (1 to 1.1 over 9s). Four 56px-wide progress indicators (the active bar fills over the interval; each is a button named "Ver foto N de 4") and a 40px glass pause button sit bottom-left, un-hidden only with JS; under reduced motion nothing advances and the pause button is hidden. On scroll the stage, slides and text move at different speeds (parallax, composite-only).

### Icons
One inline SVG line set (`.ico`: 24 viewBox, stroke 1.75, round caps/joins, `currentColor`) for the toggle, WhatsApp, contact details, fact-card chips, top bar, footer, menu, hero pause/play, lightbox and arrows. Decorative icons are `aria-hidden`; icon-only controls keep their `aria-label`.

## Do's and Don'ts

### Do:
- **Do** let real photos carry the page; keep the interface quiet around them.
- **Do** use teal fills for actions and gold for labels, icons and accents.
- **Do** keep the hero, covers, footer, top bar and lightbox dark in both themes.
- **Do** keep every effect usable without JS and off under `prefers-reduced-motion`.
- **Do** credit every third-party photo in `creditos.html`.

### Don't:
- **Don't** use raw gold or teal for small text; use `--oro-texto` and `--enlace`.
- **Don't** add drop shadows for depth beyond the soft light-theme `--sombra`; step the tones.
- **Don't** use emoji or text glyphs as icons.
- **Don't** put credit text on or beside photos, or crop/mask a watermark.
- **Don't** present a photo as a different place than it shows.
- **Don't** import brand content from the Terra spec (names, destinations, testimonials).
