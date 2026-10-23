# Feature: remove-stats-photos

Locator: `odd/tasks/remove-stats-photos.md` · Engram topic: `odd/remove-stats-photos/tasks` · Branch: `feat/remove-stats-photos` (from `main` @ 9d4105a)

## Objective
Remove the home "En cifras." section and enrich the site with freely licensed photos of the real tour places, credited on a separate `creditos.html` page linked from every footer.

## Problem / Why
The user asked to drop the stats block and to use good-looking internet photos. Only Parque Nacional Tingo María and general Tingo María scenery have freely licensed photos (Wikimedia Commons CC BY / CC BY-SA, Unsplash License); none exist for Laguna de los Milagros or Catarata Honolulo. CC BY / CC BY-SA require attribution, and `main` deploys to the live domain, so credits go on a discreet dedicated page (user approved).

## Scope
- T1: remove "En cifras." (HTML, CSS, counters JS, CLAUDE.md).
- T2: optimized photos in `img/`; Parque Nacional cover + gallery, home PN card + a wide Tingo María image; replace the watermarked honol-01/honol-09 uses with clean own Honolulo photos; new `creditos.html` (full shared chrome) + "Créditos de fotos" footer link on every page; CLAUDE.md.

## Constraints
- Never present a photo of one place as another; no photos for Laguna or Honolulo from the internet.
- Every third-party image must appear in `creditos.html` with author, license (linked) and source page (linked).
- Keep the Apple dark design rules, no-JS, reduced motion, no horizontal scroll at 360–390px; shared chrome goes to all pages.
- Push/merge to `main` deploys to production → only with explicit user approval.

## Delivery strategy
`exception-ok` — two small work units; branch stays local until the user approves.

## Tasks
- [x] T1 — Remove the stats section. Route: inline (mechanical deletions). Commit 78ab246.
- [x] T2 — Licensed photos + credits page. Route: delegated (13+ files, new page).

## Acceptance criteria
- No "En cifras." / `data-contar` left; `node --check script.js` passes.
- New images ≤ ~400 KB each, ~1600–2000px long edge; all credited; footer link on every page (`grep -c 'creditos.html'`).
- No `honol-01`/`honol-09` references left in HTML.

## Checks
- Test-first exception: no test runner. Structural greps + headless Chrome screenshots.

## Progress / Evidence
- T1 (inline). Removed the section from index.html, `.grid-cifras`/`.cifra*` CSS, the counters block and `.cifra` reveal target in script.js, and CLAUDE.md mentions. `node --check` OK; grep clean. Commit 78ab246. RDD: medium, under_budget (112); the stop hook then offered it as a candidate, consent GRANTED, 1-lens reliability review approved with no findings and acknowledged (lineage review-e9920aa047207ed6).

- T2 (delegated writer; trigger: 13 modified + 7 new files). Images `pntm-10` (cave interior, PN cover + home card), `pntm-11` (cave entrance), `pntm-12` (río Monzón), `tingo-01` (Huallaga sunset, new home `.banda-foto`), `tingo-02` (Mirador de la Cruz), `tingo-03` (Unsplash Bella Durmiente); 322–368 KB each, EXIF/GPS stripped. PN gallery +4. Honolulo cover → honol-08; honol-01/09 no longer referenced (files kept). New `creditos.html` (author, linked license deed, linked source per photo) + "Créditos de fotos" footer link on all 12 pages; CLAUDE.md updated; styles.css +43. Deviations: three phone photos are below the requested long edge to stay ≤ ~400 KB; the band has no scroll zoom (script.js was out of scope). Evidence: `node --check` OK, footer link on all 12, no honol-01/09 refs (writer + parent); 1366px and 390px screenshots inspected (parent spot-checked the PN page).

## Status
All tasks done on `feat/remove-stats-photos` (local). The user decides push/merge (push to `main` = production deploy).

## Next step
User decision on delivery.
