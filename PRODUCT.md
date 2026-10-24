# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Domestic (Peruvian) and international travellers planning a visit to Tingo María, Peru. They compare the tours, read the itinerary and contact the agency to book, by WhatsApp, the contact form or phone. Many arrive on a phone.

## Product Purpose
Marketing site for "Los Cristales", a travel agency in Tingo María (legal entity: CORPORACIÓN TULUMAYO MYSTIC S.A.C., RUC 20616494750). It presents three tours, announces an upcoming destination, and turns interest into a booking enquiry. It also carries the legal pages the business must publish, including the Libro de Reclamaciones required in Peru.

## Positioning
Local operator in Tingo María, with tours to Parque Nacional Tingo María, Laguna de los Milagros and Catarata Honolulo. Differentiator wording is not yet confirmed by the business.

## Operating Context
- Static HTML, one stylesheet, one vanilla JS file, one PHP form handler (`enviar.php`); no build step. Hosted on cPanel; every push to `main` deploys to production.
- Both forms (contact, Libro de Reclamaciones) email `mistyctulum@gmail.com`; the Libro also emails the consumer a copy with a claim number.
- Legal texts come from the business's Word documents and are reproduced verbatim.

## Capabilities and Constraints
- Pages: home, three tour pages, contact, credits, four legal pages, Libro de Reclamaciones (11 pages, shared chrome copy-pasted).
- Copy is Spanish today. Both domestic and international audiences were confirmed, so an EN/ES version is likely wanted; not yet decided or scheduled.
- Open, undecided facts: the name of the upcoming destination; whether the Términos rows "Libro de Reclamaciones Virtual" and "Constancia DNPST" are needed; the deposit (30% in the new document vs 50% before).
- Contact data is hardcoded in many places (phone 978571323, info@turismoloscristales.com, WhatsApp wa.me/51978571323).

## Brand Commitments
- Current visual system is the user-supplied "Terra" spec (brand-agnostic parts): light by default with a dark theme behind a header toggle (hero, covers and footer stay dark), teal actions, aged-gold accents, Playfair Display and Lato. It lives on branches `feat/terra-redesign` and `feat/home-modern` and is not yet in production.
- Do not invent business data (hours, social accounts, map pins, testimonials).
- Third-party photos must be credited in `creditos.html`; never crop or mask a watermark; never present a photo as a different place.

## Evidence on Hand
- Business photos per tour in `img/` (`pntm`, `lagu`, `honol`, `prox`), EXIF/GPS stripped.
- Third-party photos (CC BY-SA 4.0 / Unsplash): `pntm-10`–`12`, `tingo-01`–`03`.
- Absent: testimonials, reviews, prices, schedules, social accounts. Future work must not fabricate them.

## Product Principles
- Real places and real photos over generic travel imagery.
- Booking should take one tap: WhatsApp and the contact form stay prominent.
- Legal and regulatory content stays faithful to the business's documents.
- Works without JavaScript, with reduced motion, and on a 360px phone.
- Say only what the business has confirmed.

## Accessibility & Inclusion
Text contrast of at least 4.5:1 in both themes, keyboard operation, reduced-motion support and no horizontal scroll at 360–390px are maintained today and must stay.
