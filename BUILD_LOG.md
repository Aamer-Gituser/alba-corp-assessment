# Build Log: Apogee — NASA APOD Archive (Task 01)

## Goal & scope decision
Built Apogee, a date-addressable NASA APOD archive where every view is shareable via `?date=YYYY-MM-DD`. Users pick a date, read the entry's explanation and credit, browse nearby plates in a contact sheet, and copy deep links. Advanced feature claimed: backend-for-frontend with server-only API key, dual-TTL caching, and bounded retry/timeout logic.

Deliberately left out: multi-API fusion (stays focused on one archive), infinite scroll (date-driven exploration doesn't need windowing), separate animation showcase (liquid glass and 3D depth are baked into the aesthetic).

## Stack & tooling
- **Next.js 16.3.5** App Router with React 19.2.8 — Server Components give a genuine server/client boundary; `server-only` guard enforces it at build time
- **TypeScript 5 strict** — Closed error union (`ApodError`) makes every failure case explicit; no silent failures
- **Tailwind CSS v4** — CSS custom properties for design tokens; no class purge needed
- **Vercel** — Zero-config deploy; environment variables in project settings, never in code

## Key decisions & trade-offs
- **`server-only` guard instead of env-var naming**: Naming the key `NEXT_PUBLIC_*` exposes it; not naming it still allows accidents. `import "server-only"` turns accidental client imports into build errors. Trade-off: `posterImage()` had to move to a separate `plates.ts` file since the client needs it.

- **Dual-TTL cache (24h / 5m) instead of single TTL**: Historical plates are stable, but editorial metadata and source links change. 24h for history, 5m for today. Trade-off: required Eastern-time fix to know "today" correctly.

- **URL state (`?date=`) instead of React state**: React state is lost on refresh and can't be shared. The archive's whole point is "here's what the sky looked like on my birthday." Trade-off: URL changes trigger a server round-trip, but that's the right call—result is cached and pages are shareable.

- **Result type instead of throwing**: NASA fails for legitimate reasons (rate limit, 404, network drop). Throwing makes those indistinguishable from bugs. `Result<T>` forces every caller to handle both success and failure.

## Hard parts / dead ends
- **Eastern-time "today" bug**: `new Date().toISOString()` returns UTC date. In UTC+4/+5, that's already tomorrow in Eastern time (NASA's timezone). Requesting future dates returned 404. Fix: `todayInArchiveTime()` uses `Intl.DateTimeFormat` with `timeZone: "America/New_York"`.

- **`posterImage()` in a `server-only` module**: First draft exported it from `nasa.ts` alongside BFF functions. Archive grid is a Client Component and needed it—but couldn't import from `server-only`. Build error. Fix: moved to `plates.ts` (no guard), updated imports.

- **Retry-After header parsing**: `Number(null)` returns 0, so missing headers caused immediate retries. HTTP-date values weren't parsed. Rate limits got truncated. Fix: proper parser handling both integer seconds and HTTP-date format; never retry earlier than requested; return 429 immediately if wait exceeds 12s budget.

- **Image state not resetting on source change**: Failed images stayed failed when `src` changed. Fix: key image lifecycle by `date + posterImage(plate)`.

## How I verified it works
- **Build & lint**: `npm run build` and `npm run lint` pass fresh with zero errors
- **TypeScript**: `npx tsc --noEmit` passes strict mode
- **Tests**: 13 Vitest tests pass (date arithmetic, retry logic, URL validation)
- **Browser checks**: Date navigation (previous/next/today/random), lightbox expand, scroll-to-top on card click, error states, loading states
- **Performance**: Lighthouse mobile — Performance 92, Accessibility 97, Best Practices 100, SEO 100
- **Secret audit**: `grep -r NASA_API_KEY src/` finds only `server-only` imports and `.env.example`; no key in git history or built assets

## Known limitations
- No automated end-to-end tests (Playwright). Manual browser verification done.
- Contact sheet fixed to 8 entries; no pagination (intentional—date-driven model).
- No offline/service-worker support.
- Archive re-fetches on focal-date change rather than merging in-memory cache.
- `DEMO_KEY` fallback will 429 under classroom load (multiple people on same IP).

## Time spent
| Phase | Hours |
|---|---|
| Monorepo skeleton + git setup | inherited |
| Backend: BFF, nasa.ts, route.ts, types | 1.5h |
| Components: focal-plate, archive-strip, site-header, date-navigator | 1.0h |
| Page composition + error handling | 0.5h |
| P1/P2 audit fixes (timeout, retry-after, validation, cache TTL, copyright) | 1.0h |
| Visual restoration (liquid glass, 3D depth, lightbox, scroll-to-top) | 1.0h |
| Docs + BUILD_LOG + README updates | 0.5h |
| **Total** | **~5.5h** |

## Production status
✅ Built and verified on 2026-09-20
✅ Deployed to Vercel (live URL: https://alba-corp-assessment.vercel.app)
⏳ Video walkthrough pending
