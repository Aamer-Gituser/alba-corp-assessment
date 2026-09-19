# BUILD LOG — Task 01: Apogee

_Written live during the build. Each section appended at its phase boundary._

---

## 1. Goal & Scope Decision

**Goal:** A polished archive viewer for NASA's APOD, where every view is a shareable link and the API key never leaves the server.

**Scope decision:** Two advanced options — "Your own backend" and "Shareable URL-synced state" — because both are genuinely exercised by the domain, not decorative. The backend story is real: NASA rate-limits at 30 req/hr on DEMO_KEY, and immutable historical images can be cached for a year. The URL-sync story is real: an observatory catalogue without addressable entries is useless.

**Out of scope (recorded here, not hidden):** windowed infinite scroll, multi-API fusion, offline support.

---

## 2. Stack & Tooling

| Tool | Version | Why |
|---|---|---|
| Next.js App Router | 16.3.5 | Server Components give a genuine server/client boundary; `server-only` enforces it at build time |
| React | 19.2.8 | Required by Next.js 16 |
| TypeScript | 5 | Closed error union (`ApodError`) makes every failure case explicit |
| Tailwind CSS | v4 | CSS-variable tokens; no class purge needed |
| `motion` | latest | `animate-develop` keyframe via CSS; motion library available for future enhancements |
| Vitest | 5 | Fast, zero-config unit tests for the date library |
| Vercel | — | Zero-config Next.js deploy; environment variables set in project settings |

---

## 3. Key Decisions & Trade-offs

**`server-only` over env-var naming convention**
Naming the key `NEXT_PUBLIC_NASA_API_KEY` would expose it; not naming it that still lets accidents happen. `import "server-only"` at the top of `nasa.ts` turns any accidental client import into a build error. The key genuinely cannot reach the browser. _Trade-off:_ `posterImage()` had to be split into a separate `plates.ts` file because it's a pure function the client grid needs — it can't live in the server-only module.

**Dual-TTL cache instead of a single TTL**
Historical plates are immutable — a photo from 2011 will never change. Caching it for 15 minutes wastes bandwidth and risks rate-limiting. Caching it for a year is correct. Today's plate might still be published or revised, so it gets 15 minutes. _Trade-off:_ the TTL logic depends on knowing today's date correctly, which required the Eastern-time fix described in §4.

**`?date=` in the URL instead of React state**
Any state kept in React is lost on refresh and can't be shared. The archive's whole point is findability — "here's what the sky looked like on my birthday". _Trade-off:_ URL changes trigger a server round-trip (the page is a Server Component), but that's the right trade-off: the result is cached and the page is always shareable.

**Result type instead of throwing**
NASA can be unavailable for legitimate reasons (rate limit, date out of range, network drop). Throwing would make those indistinguishable from bugs. A `Result<T>` type forces every caller to handle both the success and failure case. The error boundary (`error.tsx`) exists only for unexpected render failures, not for upstream API errors.

**Parallel data fetching on the server**
`Promise.all([getPlate(), getPlateRange()])` means the archive grid does not wait for the focal plate. Both requests are independent; running them in parallel cuts the TTFB roughly in half.

---

## 4. Hard Parts & Dead Ends

**The Eastern-time "today" bug**
Calling `new Date().toISOString().slice(0,10)` to get "today" returns the UTC date. In UTC+4 or UTC+5, the UTC date is already the next day relative to Eastern time — NASA's publishing timezone. Requesting that future date returns 404. Fix: `todayInArchiveTime()` uses `Intl.DateTimeFormat` with `timeZone: "America/New_York"` to always match NASA's calendar.

**`posterImage()` in a `server-only` module**
The first draft of `nasa.ts` exported `posterImage()` alongside the BFF functions. The archive grid (`archive-strip.tsx`) is a Client Component and needs `posterImage()` — but it can't import from a `server-only` file. Build error. Fix: moved `posterImage()` into a new `plates.ts` (no `server-only` guard), updated `focal-plate.tsx` import. The BFF functions stay in `nasa.ts` and remain server-only.

**Vitest needing `vite` as a separate install**
`npm install -D vitest` did not pull `vite` as a dependency in this Node/npm version. Running `vitest run` threw `ERR_MODULE_NOT_FOUND` for `vite`. Fix: `npm install -D vite --legacy-peer-deps`. All 13 tests then passed.

---

## 5. How I Verified It Works

| Check | Result |
|---|---|
| `npm run build` | ✓ Compiled successfully, zero TS errors |
| `grep -rl "NASA_API_KEY" .next/static/` | ✓ Empty — key not in client bundle |
| `npm test` (13 vitest tests) | ✓ All pass |
| Today's plate loads | ✓ Verified in dev server |
| `?date=1995-06-16` (first plate) | ✓ Plate 1 renders, prev button disabled |
| `?date=2099-01-01` | ✓ Silently clamped to today |
| `?date=banana` | ✓ Silently clamped to today |
| Load earlier plates | ✓ 12 more appended, no layout shift |
| Video entry (`?date=2023-11-27`) | ✓ Poster frame + "motion plate" badge |
| Offline → Load earlier plates | ✓ Inline alert, no crash |
| Build bundle secrets scan | ✓ Clean |

_Lighthouse scores (production build, mobile):_
Performance: 92 · Accessibility: 97 · Best Practices: 100 · SEO: 100

---

## 6. Known Limitations

- No automated end-to-end tests (Playwright)
- "Load earlier plates" is a button, not windowed infinite scroll — the grid grows unboundedly
- No offline/service-worker support
- Archive grid re-fetches on focal-date change rather than merging in-memory cache
- `DEMO_KEY` fallback will 429 under classroom load (multiple people on the same IP)

---

## 7. Time Spent

| Phase | Planned | Actual |
|---|---|---|
| Monorepo skeleton + git setup | 15 min | 10 min |
| BFF layer (nasa.ts, plates.ts, route.ts) verify + tests | 30 min | 25 min |
| Archive strip + site header | 20 min | 15 min |
| Page composition + loading/error | 20 min | 15 min |
| Build verify + secrets scan | 10 min | 10 min |
| Docs (README, BUILD_LOG, .env.example) | 30 min | 35 min |
| Deploy + live verification | 25 min | _pending_ |
| Video script | 30 min | _pending_ |
| **Total** | **≈3h05m** | **≈1h50m so far** |
