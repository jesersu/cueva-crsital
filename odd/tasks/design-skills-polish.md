# Feature: design-skills-polish

Locator: `odd/tasks/design-skills-polish.md` · Engram topic: `odd/design-skills-polish/tasks` · Branch: `feat/design-skills-polish` (from local `main` @ ba0cfdc)

## Objective
Install the `emilkowalski/skills` design skills for the project, keep them out of the production deploy, and use them (emil-design-eng, apple-design, mobile-native, review-animations, animation-performance) to polish the existing Apple-style dark site.

## Problem / Why
The user asked to apply the newly installed design skills to improve the site. The redesign is live; the skills encode polish details (press feedback, easing/duration discipline, interruptible motion, hover on touch devices, tap highlight, 100vh, safe areas, input zoom, typography) that the current CSS/JS may not yet follow.

## Scope
- T1: deploy excludes for `.claude/` and `skills-lock.json`, commit skills + lock, CLAUDE.md note.
- T2: audit + polish pass on `styles.css`, `script.js` and, only where needed, the `<head>` of the 11 HTML pages (e.g. `theme-color`, `viewport-fit=cover`), guided by the skills. No redesign: keep the Apple dark language, tokens, color rationing and page structure.
- T3: CLAUDE.md update for any new conventions.

## Constraints
- Vanilla HTML/CSS/JS, no build step, no new dependencies.
- Keep color rationing (one blue CTA per page), no box-shadows, weights 400/600, legacy aliases, no-JS and reduced-motion behavior, no horizontal scroll at 360–390px.
- Shared chrome is copy-pasted in 11 pages: any `<head>`/chrome edit goes to all pages (verify with `grep -c`).
- No invented business data; never crop or mask watermarks.
- Push/merge to `main` deploys to production → only with explicit user approval.

## Delivery strategy
`exception-ok` — small chore commit plus one polish pass; branch stays local until the user approves.

## Tasks
- [x] T1 — Deploy excludes + skills commit. Route: inline (mechanical). Commits c1e9b16 (ci) + e58350a (skills).
- [ ] T2 — Skills-guided polish pass. Route: delegated (2+ non-trivial files).
- [ ] T3 — CLAUDE.md update. Route: inline.

## Acceptance criteria
- `.claude/**` and `skills-lock.json` excluded from the FTPS deploy.
- Each polish change traces to a specific skill rule; no visual regressions at 1366px and 360/390px; no-JS and reduced-motion still show all content.
- `node --check script.js` passes; lightbox, mobile menu, contact form still work.

## Checks
- Test-first exception: no test runner. Structural (`node --check`, greps) + visual (headless Chrome / Playwright screenshots).

## Progress / Evidence
- T1 (inline). deploy.yml exclude gains `**/.claude/**` and `skills-lock.json`; CLAUDE.md deploy line updated; 15 skills + lock committed. Check: diff readback. The first combined commit exceeded the reviewer context budget (`lens_context_budget_exceeded`), so it was split locally (unpushed) into c1e9b16 (ci) and e58350a (skills). RDD c1e9b16: high (shell_source in deploy.yml), consent GRANTED, 4-lens review approved and acknowledged (lineage review-8512951cfd79df84). Advisories: R3-001 bare `skills-lock.json` matches the root only (intended, the lock lives at the root); R4-stale-excluded-artifacts (no stale copies are possible: `.claude/` and `skills-lock.json` were never on `main`). RDD e58350a: medium (slice_budget_reached, 4934 lines of vendored third-party skill Markdown), consent GRANTED, START refused with `lens_context_budget_exceeded` (no authority created) → outcome unavailable; the skills were manually inspected at install time (Markdown only, no scripts). RDD stays on; next base = e58350a.

## Next step
T2 delegated writer.
