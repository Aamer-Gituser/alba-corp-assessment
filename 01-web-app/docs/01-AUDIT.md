# Task 1 — audit of the current draft

Reviewed 2026-09-20. This is a source and plan review, not a production test report. **Verdict: revise before implementation continues.** Existing type unions, the server-only guard and catalogue palette are useful foundations; the app is not submission-ready.

## Scope and method

Read all first-party Task 1 TypeScript/TSX/CSS, configuration, README, agent instructions and SVG assets; examined package/lock metadata and root Git status. Read the old Task 1 plan and shared assessment documents for contradictions. Dependency/generated directories were not audited line by line. The starter favicon was inventoried, not visually inspected. No claim of an exhaustive dependency security audit is made. The implementation changed concurrently during this review; current-state findings below reflect the composed page present at commit `462de62` plus the working tree visible immediately afterward.

The main plan is replaced with a continuation plan. Other tasks and shared master documents are intentionally unchanged because the user assigned those to separate chats. If an old shared summary contradicts this Task 1 package, use this package for our design choices and the supplied brief for official requirements.

## Prioritized findings

| ID | Priority / evidence | Finding and consequence | Required plan correction |
|---|---|---|---|
| F01 | P0 compatibility gate; official upstream documentation | NASA's repository announced a September 10 response migration. The current adapter assumes `url` is an image. The new documented example makes it an article URL and adds new media hosts. Live endpoint behaviour was not confirmed here. | Capture a real current response; normalize old/new fields and validate image hosts before rendering. |
| F02 | P1; `src/app/page.tsx` | A composed archive page now exists, but it has not been exercised against the verification matrix. Range failure is still converted to an empty strip, and the page asks for 12 entries while the revised bounded contract calls for at most 8. | Cap and validate the result set, distinguish empty from failure, then exercise the page in a browser. |
| F03 | P1; `src/lib/nasa.ts` | No fetch timeout. Three retry attempts are not a bounded request if each fetch can hang. | Four-second attempt timeout and twelve-second total upstream budget, including waits. |
| F04 | P1; `src/lib/nasa.ts` | `Number(null)` is zero, so an absent Retry-After causes an immediate retry. HTTP-date values are not parsed, and long requested waits are truncated to four seconds. | Parse both forms; use jitter only when no usable delay exists; return 429 when the requested wait exceeds the remaining budget. Never retry earlier than requested. |
| F05 | P1; `src/lib/nasa.ts`, `types.ts` | `as T` provides no runtime validation; invalid range payload becomes `[]`. Bad upstream data can masquerade as a genuinely empty archive. | Parse `unknown`, normalize fields and return `invalid_response` for malformed content. |
| F06 | P1; `plate-image.tsx` | Image status is initialized once. A failed image remains failed when a new `src` arrives in the same component. A previously ready image can skip loading state. | Key image lifecycle by date + normalized image URL; test failed → valid and valid → valid navigation. |
| F07 | P1; old page/grid plan | `useState(initialPlates)` does not reset on a new focal date; old contact-sheet items can survive URL navigation. | Prefer a server-rendered fixed grid. If paging is added later, key by focal date and cancel obsolete requests. |
| F08 | P1; old page plan | `archiveResult.ok ? data : []` turns a network failure into “no earlier plates.” At the archive start it also attempts a reversed range. | Distinguish failure from empty; skip the range call when end < start. |
| F09 | P1; `next.config.ts`, `focal-plate.tsx` | Allowlist lacks the newly documented asset host; image URLs/source links are not normalized. Missing copyright is labeled “Public domain.” | Safe HTTPS links, specific image paths, text credit, “See source for credit” when absent. No blanket rights claim. |
| F10 | P1; old advanced-feature checklist | Date-in-URL alone is claimed as the complete advanced search/filter option. | Claim only the BFF after it passes. Keep shareable dates as a normal feature. |
| F11 | P1; old plan | Planned timezone/JSON incidents and tests are narrated as things already experienced. Build log is deferred to a late task. | Start an honest log now; label prior work unrecorded; derive the eventual video difficulty from actual evidence. |
| F12 | P1; old repo instructions | Proposed deleting Git metadata even though the project is already inside the root repository at `D:/Projects/Alba Corp/.git`. | Preserve root history and the dirty working tree. No reinitialization, automatic deletion, reset, or force push. |
| F13 | P2; `src/app/api/apod/route.ts` | Difference-of-days check allows 41 inclusive days while saying maximum 40. Missing/invalid parameters have inconsistent error envelopes. | Validate real dates first; use difference + 1; unified response and error codes. |
| F14 | P2; cache comments | Historical APOD entries are called immutable and cached for a year. Editorial content may change; no actual cache-hit evidence exists. | Historical TTL is a product choice, not an immutability guarantee; use 24h and measure cache reuse in production mode. |
| F15 | P2; `dates.ts`, old copy | Eastern “today” is assumed to guarantee publication; every entry is called a photograph. | Use Eastern time as a date boundary convention, acknowledge publication delay, support image/video/other media. |
| F16 | P2; `notices.tsx`, `types.ts` | Every failure returns to today, including a failure already on today. Backend network failure is blamed on the visitor's connection; 403 is described as NASA's fault. | Distinct retry/date/source recovery; classify configuration error separately. |
| F17 | P2; CSS and image component | Large blur animation, 900ms reveal, 600ms entrance and fixed grain layer are unmeasured. They may delay useful content or repaint heavily. | Short opacity/transform reveal; optional static frame texture; measure instead of claiming 60fps. |
| F18 | P2; typography and controls | Frequent 10–11px uppercase labels, opacity-reduced text and 40px step controls weaken readability/touch use. | 12px minimum labels, 16px body, 44px controls; measure blended colours independently. |
| F19 | P2; `.gitignore`, README | `.env*` excludes the required `.env.example`; the earlier README made unverified completion claims. A test script now exists, but no current build log, deployment proof, or completed evidence register was found. | Add the example exception during implementation; replace claims with verified evidence and ship the required delivery material. |
| F20 | P2; old verification instructions | Searching for env variable names or demanding zero `nasa.gov` traffic is not a secret proof. External source visits and media can legitimately use NASA domains. | Check actual secret values without printing them, JSON/HTML/RSC/client artifacts, and absence of browser requests to the credentialed API. |
| F21 | P2; installed framework docs | Old plan uses image `priority` and assumes error `reset()` refetches. Installed Next 16.3.5 docs deprecate `priority` and distinguish `retry()` from `reset()`. | Follow bundled docs/types and prove recovery behaviour against this version. |
| F22 | P2; date input / URL contract | Repeated params, impossible dates, input edits and date changes across midnight are not covered. | Validate URL shape on server; use a committed date-form submission; test back/forward and clock boundaries. |

P0 here means a dependency decision must be resolved before feature work; it does not mean a live exploit was demonstrated. P1 means required correctness/completion work. P2 means polish, edge-case or documentation reliability work that still belongs in the acceptance plan.

## File review register

| Current path (relative to Task 1) | Assessment / next action |
|---|---|
| `AGENTS.md`, `CLAUDE.md` | Read; bundled Next docs must guide implementation; preserve these files. |
| `package.json`, `package-lock.json` | Next 16.3.5 / React 19.2.8; lock and manifest top-level declarations align. No test script. Motion installed but not used by current components. No dependency upgrade needed for this review. |
| `tsconfig.json`, `next-env.d.ts` | Strict mode enabled; Next generated routes referenced. Do not hand-edit generated declarations. |
| `eslint.config.mjs`, `postcss.config.mjs` | Standard Next/Tailwind configuration; no source-review blocker identified. Not a lint pass. |
| `next.config.ts` | Specific current hosts; update only for observed valid media; do not widen to every host. |
| `.gitignore` | Protects local env; must explicitly unignore `.env.example`. |
| `src/lib/types.ts` | Good explicit Result/error foundation; needs normalized `Plate` contract and runtime parser. |
| `src/lib/dates.ts` | Good UTC day arithmetic and real-date round-trip; inject clock for tests, skip empty boundary range. Plate number is our derived index, not NASA's identifier. |
| `src/lib/nasa.ts` | Key guard present; timing, retry, caching assumptions and payload handling need corrections. |
| `src/app/api/apod/route.ts` | Existing bounded range surface; fix inclusive bound and failure contracts. |
| `src/app/page.tsx` | Scaffold, not product. |
| `src/app/layout.tsx` | Font roles established; metadata overstates photographs; retain font fallbacks. |
| `src/app/globals.css` | Coherent palette; keep full-strength text colours, simplify motion. |
| `src/components/plate-image.tsx` | Lifecycle defect; use contain for hero, cover only for thumbnails; preserve image placeholders. |
| `src/components/date-navigator.tsx` | URL/transition foundation; add deliberate form commit, accessible pending behaviour and same-date retry elsewhere. |
| `src/components/focal-plate.tsx` | Useful editorial structure; fix media/credit assumptions, local index label and uncropped presentation. |
| `src/components/notices.tsx` | Typed copy exists; recovery actions need differentiation and announcement semantics. |
| `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Starter assets inspected; not a custom visual identity. Remove only after actual app stops using them. |
| `src/app/favicon.ico` | Starter binary inventoried; replace as a small enhancement. |
| `README.md` | Replaced with honest Task 1 status and navigation to this package. |
| Old Task 1 plan | Replaced; no second executable legacy plan retained. |

The existing `posterImage` import in the server-rendered FocalPlate is not currently a client-boundary build failure. It becomes one if the old planned client grid imports it from `nasa.ts`. Normalization on the server removes that future coupling.

## Sources and review limits

NASA's [API repository update](https://github.com/nasa/apod-api) documents a changed payload including article URLs and media fields; its example also contains HTML in explanation/credit. This requires a compatibility check, not an assumption that every deployed response has changed identically. The direct live probe in this environment failed before a usable response was obtained.

APOD's [credit guidance](https://apod.nasa.gov/apod/lib/about_apod.html) distinguishes image owners. An absent field is insufficient evidence to assign a licence.

The UI skill's written guidance was used. Its optional search script was unavailable at the installed path and resolved fallback; no generated design-system or colour-vision validation is claimed. Exact base-token contrast calculations and source observations are recorded in [Evidence](07-EVIDENCE.md).
