# DevKo handoff — Apogee Task 1 only

## Assignment

Continue **Task 1 only** in `D:/Projects/Alba Corp/01-web-app`. Do not modify Task 2, Task 3, or their documentation. The current app is incomplete: a composed archive page exists, but the backend adapter, result bounds, accessibility, media semantics, and submission evidence still need correction.

## Read in this order

1. `AGENTS.md`
2. `docs/00-START-HERE.md`
3. `docs/01-AUDIT.md`
4. `docs/02-PRODUCT-AND-UI.md`
5. `docs/03-BACKEND-CONTRACT.md`
6. `../docs/plans/2026-09-19-task-01-web-app.md`
7. `docs/04-VERIFICATION.md`
8. `docs/05-DELIVERY.md`
9. `docs/07-EVIDENCE.md`

## Outcome

Build a beautiful, responsive, date-addressable APOD archive called **Apogee**. A visitor selects a date, sees that day's astronomy entry, reads its context and credit, can copy the deep link, and can move through a compact nearby-date contact sheet.

The visual direction is a quiet observatory plate catalogue: near-black canvas, warm archival surfaces, restrained cyan interaction, amber observation/status cues, thin rules, large uncropped focal media, readable editorial typography, and precise spacing. Avoid a generic dashboard, glassmorphism, neon effects, 3D scenes, or unrelated decorative features.

## Highest-priority corrections

1. Reconcile the composed page with the product/UI specification and prove it in a browser; do not rewrite working pieces without evidence.
2. Verify the live NASA payload before locking the adapter. The official backend changed recently; do not assume `url` is always the display image.
3. Add runtime payload validation and a normalized server-only `Plate` model.
4. Add bounded timeout/retry behavior and parse `Retry-After` correctly.
5. Fix image state when `src` changes and avoid stale archive-strip state.
6. Handle image, video, other, missing-poster, loading, empty, invalid-date, rate-limit, timeout, configuration, invalid-response, and generic failure states.
7. Preserve the existing root Git repository and current dirty work.
8. Add a tracked placeholder-only `.env.example`; update `.gitignore` so it is not ignored.
9. Expand the planning-handoff README into the final verified project README and keep an honest chronological `BUILD_LOG.md`.
10. Deploy, retest production, and attach evidence for every required checklist item.

## Product and layout decisions

- One primary route: `/?date=YYYY-MM-DD`.
- Header: compact Apogee identity plus archive status.
- Date navigator: previous, native date selection, next, and optional Today.
- Focal section: title first, large contained media second.
- Context section: explanation and metadata/source actions in a roughly 2:1 desktop split.
- Contact sheet: maximum eight entries, fixed-size result set, 2/3/4 columns across mobile/tablet/desktop.
- Mobile interaction targets: minimum 44px.
- Utility text: minimum 12px; body copy near 16px.
- Motion: 180–240ms opacity/transform, with reduced-motion support.

## Architecture decisions

- Keep the NASA credential exclusively on the server.
- Use the backend-for-frontend boundary as the single advanced option claimed in the submission.
- Prefer direct server-component calls to the server-only adapter; keep a route handler only if a client feature requires it.
- Cache historical entries for 24 hours and current-day data for 5 minutes.
- Limit a range to eight inclusive dates.
- Abort each upstream attempt after 4 seconds, allow at most 3 attempts, and keep the complete retry sequence under 12 seconds.
- Treat malformed upstream data as an explicit invalid-response error, never as an empty archive.
- Treat missing copyright as “See source for image credit,” never as proof of public-domain status.

## Scope controls

Do not add AI, a second API, accounts, comments, favorites, a database, infinite scrolling, load-more pagination, a theme switcher, heavy animation, or a CMS. A random-date action is optional and should be dropped before any required behavior.

The assessment gives Task 1 a 2–4 hour window. Prior work and planning count. Record the actual prior time, target 210 minutes total, stop enhancements at 120 minutes, freeze features at 180 minutes, and stop at 240 minutes. If the clock becomes tight, follow the drop order in the executable plan.

## Required proof before completion

- Lint, typecheck, production build, and focused meaningful tests pass.
- Date deep links, previous/next rules, and the first supported date work.
- Image and non-image entries render correctly.
- Loading, empty, error, rate-limit, configuration, timeout, and invalid-response states are reachable and recoverable.
- Keyboard focus, reduced motion, contrast, touch targets, and responsive layouts are checked.
- Chrome and a second browser are checked.
- The actual secret is absent from source, Git history, built assets, HTML, logs, and browser traffic.
- The browser never calls the credentialed APOD endpoint directly.
- The public URL works in a fresh session.
- `docs/07-EVIDENCE.md`, `README.md`, and `BUILD_LOG.md` contain current, truthful evidence.

## Coordination note

The shared master plan currently overstates Task 1's advanced-options claim and carries an older time estimate. The Task 1 implementation must follow this handoff and the revised executable plan. The owner of the shared master plan can later reconcile those two lines without changing Task 2 or Task 3.
