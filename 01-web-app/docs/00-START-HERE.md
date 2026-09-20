# Apogee — Task 1 delivery brief

Updated 2026-09-20 (Asia/Kolkata). **Planning review complete; implementation and deployed verification remain open.** This package belongs only to Task 1. Other chats own Tasks 2 and 3.

## Product and outcome

**Apogee: a date-addressable observatory archive.** Choose a date and explore its Astronomy Picture of the Day entry, explanation and source credit. The image is the centrepiece; a small contact sheet provides context. “The cosmos, filed by date” is the proposed masthead line.

The desired reviewer experience: understand the product in five seconds, change a date without instructions, share that exact view, and see that errors are handled deliberately. A short backend explanation then demonstrates key custody, caching, validation and bounded retries.

The product is not complete today. A composed archive page now exists, but it was committed while this review was in progress. It has not yet passed the backend-contract, accessibility, cross-browser, secret, production, or delivery checks in this pack.

## Read in this order

| Document | Purpose |
|---|---|
| [Audit](01-AUDIT.md) | Current files, actual defects, unsupported claims and scope of review |
| [Product and UI](02-PRODUCT-AND-UI.md) | Screens, hierarchy, interactions, tokens and accessibility |
| [Backend contract](03-BACKEND-CONTRACT.md) | Data model, API, caching, security and failure behaviour |
| [Implementation plan](../../docs/plans/2026-09-19-task-01-web-app.md) | Ordered work with file ownership, acceptance gates and time limits |
| [Verification](04-VERIFICATION.md) | Strict post-development checks and evidence requirements |
| [Delivery](05-DELIVERY.md) | Environment, deployment, README and submission instructions |
| [Video and interview](06-VIDEO-AND-INTERVIEW.md) | Evidence-dependent script, explanation practice and follow-up questions |
| [Evidence register](07-EVIDENCE.md) | What was checked now versus what still needs to be run |

## Requirement coverage

The supplied assessment text is authoritative. This table separates official requirements from our implementation choices. Shared root rules contain older interpretations; do not treat their stronger wording as an additional official requirement for Task 1.

| ID | Assessment requirement | Proposed implementation | Evidence gate |
|---|---|---|---|
| C1 | At least one third-party API | NASA APOD through Next.js server code | Real successful request and rendered entry |
| C2 | Creative, distinctive UI | Observatory catalogue, editorial image and contact sheet | Desktop/mobile screenshots and interactive walkthrough |
| C3 | Smooth motion and respectable performance | Brief opacity/transform transitions, reserved image space, measured loading | Production Lighthouse report and interaction inspection |
| C4 | Skeleton/shimmer, empty, error and request failure states | Route/section/image skeletons; separate missing-entry and service-failure UI | Deliberately exercised state matrix |
| C5 | Good structure, accessibility, mobile support, no client secrets | Small server/client boundaries, keyboard controls, 320px+ layout, server-only credentials | Build, keyboard/mobile checks and secret scan |
| C6 | Feature list, architecture, run instructions, API quirks | Project README plus focused supporting docs | Fresh-reader setup check |
| A1 | At least one advanced option | **Own backend:** key custody, caching, rate-limit retry/backoff, graceful failure | Backend tests plus real deployment evidence |
| D1 | Live app and accessible repository | Independent Next.js deployment; source public or shared with reviewer | Fresh browser / reviewer-access check |
| D2 | Build log and environment example | Honest seven-section log and placeholder-only environment instructions | File and Git tracking checks |
| D3 | Video walkthrough | Recommended short Task 1 video with demo, proud part and real difficulty | Recording plays without owner login |

**Advanced claims:** A1 is planned, not already earned. A shareable `?date=` remains a good product feature, but the brief's separate URL-state option explicitly includes debounced server-backed search and filters. We will not tick that option for a date picker alone. We will not claim virtualized lists, multi-API fusion or advanced animation.

**Video ambiguity:** the hand-in prose asks for a video, while the form labels it optional. Recording is our recommendation, not a claim that the brief forbids combined videos. No fixed video length is stated. Aim for about three minutes for Task 1.

## Scope and strongest impression

| Priority | Deliverable | Why it earns its place |
|---|---|---|
| Required | One selected APOD entry with date navigation, explanation and source | Complete core interaction |
| Required | BFF, validated data, cache, timeouts/retries, truthful failures | A defensible advanced feature |
| Required | Accessible responsive UI and all loading/error/empty states | Product quality extends beyond the happy path |
| Required | README, build log, live URL, source access and verification | Reviewer can evaluate it independently |
| Small enhancement | Copy this date, with copy failure fallback | Makes URL state useful with very little surface area |
| Small enhancement | Up to eight preceding entries in a contact sheet | Discovery and a distinctive archive composition |
| Small enhancement | Title reflects the entry; a modest custom favicon | A finished browser experience |
| Conditional | Random date | Retain only if missing-entry and navigation cases pass |
| Defer | Load-more, full-text search, favourites, accounts, AI astronomy summaries, second API, 3D starfield, downloads | More scope, quota, verification and explanation than this time box justifies |

Cut optional work in this order: random-date polish; custom social card; contact sheet expansion beyond the first eight. Do not cut the selected entry, safe media handling, required states, backend evidence or delivery docs. Copy-link can be omitted if platform testing consumes its small budget. A direct URL still works.

## Time rules

The brief allows three days and roughly 6–10 hours overall; each task is intended to take 2–4 hours. No deadline timestamp or trustworthy prior Task 1 time record was supplied. Do not infer a fresh four-hour allowance from this review.

**Task 1 target: 210 minutes total; hard planning cap: 240 minutes including prior work, this review, testing, docs, deployment and recording.** This is an internal interpretation intended to respect the user's request for strict timing, not an extra rule quoted from the brief.

`remaining = max(0, min(240 - actual Task 1 time already spent, actual time until deadline))`.

Record unknown earlier time as unknown until the candidate supplies an honest estimate. At 120 elapsed minutes freeze enhancements; at 180 freeze new features and use the rest for validation/delivery; at 240 stop, describe the current result and next steps. If already over, report the overrun; a new chat does not reset the clock. Planning is work too.

## Current decisions and handoff

- Keep NASA/Apogee and the existing Next.js stack; avoid restarting a scaffold.
- Verify upstream compatibility before polishing. A recent NASA documentation change makes the existing image assumptions unsafe.
- Keep runtime changes inside `01-web-app`; this chat may also edit the linked Task 1 plan. Do not change the root repo, remotes, shared rules, Task 2 or Task 3 without coordination.
- Preserve the existing root Git history and current working tree. Do not delete or reinitialize `.git`.
- No deployment, submission, credential changes or application-code edits were performed by this documentation review.
- When development is finished, use [Verification](04-VERIFICATION.md). Verification findings then drive the final video wording; interview preparation follows the actual submitted revision.
