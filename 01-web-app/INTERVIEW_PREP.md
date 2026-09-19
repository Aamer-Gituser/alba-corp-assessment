# Interview Prep Pack — Task 01: Apogee

---

## One-Page Architecture Cheat Sheet

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  URL: /?date=YYYY-MM-DD  ←── shares state, history works   │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  Server Component: page.tsx                 │           │
│  │  • reads searchParams.date                  │           │
│  │  • Promise.all([getPlate, getPlateRange])   │           │
│  │  • renders FocalPlate + ArchiveStrip        │           │
│  └─────────────────────────────────────────────┘           │
│                │                                            │
│  ┌─────────────┴───────────────────────────────┐           │
│  │  Client Component: ArchiveStrip             │           │
│  │  • initial plates from server props         │           │
│  │  • "Load more" → fetch /api/apod?start=&end=│           │
│  └─────────────────────────────────────────────┘           │
└──────────────────────────┬──────────────────────────────────┘
                           │ /api/apod (our route handler)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVER                                │
│                                                             │
│  /api/apod/route.ts                                         │
│  • validates start/end params                               │
│  • calls getPlate() or getPlateRange()                      │
│  • sets Cache-Control header                                │
│                                                             │
│  src/lib/nasa.ts  ← import "server-only"                    │
│  • API_KEY = process.env.NASA_API_KEY                       │
│  • fetch with next.revalidate (dual TTL)                    │
│  • retry/backoff up to 3 attempts                           │
│  • returns Result<T> (never throws)                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
                    api.nasa.gov/planetary/apod
```

**Key facts:**
- Browser makes ZERO requests to nasa.gov — verified in Network tab
- `server-only` guard = build error if NASA key leaks to client
- Cache: 1yr historical, 15min today (dual-TTL)
- `?date=` in URL = every view is a shareable link

---

## 25 Technical Questions & Answers

### Core architecture

**1. Why is there a `server-only` import at the top of `nasa.ts`?**

It makes the API key boundary structural, not conventional. If `nasa.ts` is accidentally imported from a Client Component, the build fails with an error — it's not a runtime leak, it's a compile-time prevention. Naming the key without `NEXT_PUBLIC_` would also keep it server-side, but that's easy to forget. `server-only` is impossible to forget.

**2. Why does `posterImage()` live in `plates.ts` and not `nasa.ts`?**

The archive grid (`archive-strip.tsx`) is a Client Component — it uses `useState` and `fetch`. Client Components can't import from `server-only` files. `posterImage()` is a pure function that touches no secret and makes no network call, so there's no reason it needs to be server-only. Moving it to `plates.ts` (no guard) lets both the server-rendered focal plate and the client grid use the same function.

**3. Why do historical plates cache for a year but today's for 15 minutes?**

A photograph from 2011 is immutable — NASA will never change it. Caching it for 15 minutes wastes bandwidth and burns through the rate limit. Today's plate might still be published (NASA sometimes publishes late) or have a minor revision, so a shorter TTL is correct. The `cacheTtlFor(date)` function picks based on whether the date equals today's Eastern-time date.

**4. What is the dual-TTL cache, concretely?**

The `fetch()` call to NASA includes `next: { revalidate: ttlSeconds }`. This is Next.js's Data Cache — it stores the response at the CDN/server level. A cache hit never touches NASA. `IMMUTABLE_TTL_SECONDS = 31536000` (1 year) for historical. `TODAY_TTL_SECONDS = 900` (15 minutes) for today.

**5. What happens when NASA returns 429, step by step?**

1. `requestApod()` reads `response.status === 429`.
2. If `attempt < MAX_ATTEMPTS`: reads the `Retry-After` header. If present and finite, waits that many milliseconds (capped at `MAX_BACKOFF_MS = 4000`). If absent, uses `backoffDelay(attempt)` — exponential with jitter.
3. On the last attempt: returns `err({ kind: "rate_limited", retryAfterSeconds: ... })`.
4. The page renders an `<ErrorNotice>` with the rate_limited copy.

**6. Why return a `Result<T>` type instead of throwing?**

NASA can be unavailable for legitimate reasons — rate limit, maintenance, date out of range. If those threw exceptions, the error boundary would catch them and they'd look like bugs. A `Result<T>` forces every caller to handle both cases. The discriminated union is exhaustive, so TypeScript will warn if a new error kind is added but not handled in the UI.

**7. Why is `searchParams` typed as `Promise<{date?: string}>` in Next.js 16?**

Next.js 16 made searchParams async — you must `await` them. This was a breaking change from 15. The `searchParams` prop is now a Promise so the framework can defer parsing. Forgetting `await` gives you a Promise object, not the parsed params.

### URL-synced state

**8. Why is the selected date in the URL rather than React state?**

Three reasons: (1) every view is shareable — "here's what the sky looked like on my birthday" is the whole point; (2) browser history works — Back/Forward navigates dates; (3) the page is a Server Component, so state must be passed as props (which means the URL is the natural store for server-side data).

**9. How does DateNavigator change the URL without a full page reload?**

`useRouter().push()` inside `useTransition`. `useTransition` keeps the current UI interactive while the server is computing the new page. The result is: the user sees the old plate slightly dimmed while the new one loads, rather than a blank screen.

**10. What happens if someone visits `?date=2099-01-01`?**

`isValidDateString("2099-01-01")` returns true (it's a valid date string). Then `isWithinArchive("2099-01-01")` returns false (it's after today). `clampToArchive("2099-01-01")` returns today's date. The page renders today's plate. No error, no crash — a bad link still shows you the cosmos.

**11. What happens with `?date=banana`?**

`isValidDateString("banana")` returns false (doesn't match `YYYY-MM-DD` and can't be parsed). The `requested` check fails, so `focalDate` falls back to `todayInArchiveTime()`. Same result as above.

### BFF / API

**12. What is the BFF pattern and why use it here?**

Backend-for-Frontend: our Next.js route handler sits between the browser and NASA. The browser talks only to our origin. This is not just about hiding the API key — it also lets us add caching, retry logic, rate-limit handling, and typed error translation at a single point rather than duplicating it in every component. The browser gets a clean, safe API from our own origin.

**13. Why `parallel` fetch of focal plate and archive range?**

`Promise.all([getPlate(focalDate), getPlateRange(start, end)])` runs both in parallel. The archive grid doesn't depend on the focal plate result. Without parallel fetching, the grid would wait for the focal plate to finish before starting — doubling the TTFB.

**14. How does the route handler validate the start/end params?**

`/api/apod/route.ts` checks both are present, both are valid date strings, and the range doesn't exceed `MAX_RANGE_DAYS = 40`. If any check fails, it returns a 400 with a typed error object. This prevents the browser from ever reaching NASA with a malformed request.

**15. What is `thumbs=true` in the NASA request and why?**

NASA sometimes publishes a video as the APOD (YouTube embeds). Video entries have no image at `url` — only a YouTube link. The `thumbs=true` parameter asks NASA to include `thumbnail_url`, which is a static image of the video. Without it, the grid would show a broken image for video entries. The UI marks them with a "motion plate" badge.

### Design & UX

**16. Why does the title sit above the image instead of below it?**

NASA's titles are often the most evocative thing on the page ("A Perseid Below", "Rings Around the Ring Nebula"). If the title appears below, it's invisible while the image loads. Putting it above means the page says something the instant it renders, while the exposure is still developing underneath.

**17. What is the signature animation and how is it implemented?**

The "develop" animation: an image arrives as a dark, grainy, slightly blurred plate and resolves through blur, saturation, and brightness into the finished photograph — like a plate in a developing bath. It's implemented as a CSS keyframe (`@keyframes develop` in `globals.css`) on the `<img>` element inside `PlateImage`. Three states: `loading` (undeveloped, safelight sweep), `ready` (triggers the animation), `failed` (shows a placeholder). No JavaScript animation library is needed.

**18. How is `prefers-reduced-motion` handled?**

In `globals.css`, inside `@media (prefers-reduced-motion: reduce)`, all the animation durations are set to `0.01ms`. The images still transition through the three states, but instantly — no develop animation. The API data and layout are unchanged.

### Security

**19. Prove the API key can't reach the browser.**

Run `npm run build`, then `grep -rl "NASA_API_KEY" .next/static/`. Returns nothing. The client bundle contains zero references to the key. The structural proof is the `import "server-only"` at the top of `nasa.ts` — importing it from any file that renders on the client is a build error.

**20. What if the `.env.local` file is accidentally committed?**

The `.gitignore` excludes `.env`, `.env.local`, and `.env.*.local`. The `!**/.env.example` negation ensures the placeholder file is always tracked. Before every push: `git ls-files | grep -E "\.env($|\.)"` — should return nothing except `.env.example`.

### Testing & quality

**21. What do the 13 vitest tests cover?**

All date-handling edge cases: `isValidDateString` (valid, invalid shape, non-existent date), `isWithinArchive` (before archive start, at start, after today), `shiftDate` (month boundary, leap day), `clampToArchive` (pre-archive date), `plateNumber` (first and second plate), `precedingWindow` (end = focalDate-1, never before archive start). None of these need a network call or Next.js context.

**22. Why not test `nasa.ts` with vitest?**

`nasa.ts` has `import "server-only"`, which throws in a non-Next.js environment (vitest). Testing it would require mocking the entire Next.js fetch extension (`next: { revalidate: ... }`). The logic worth testing — date handling — is in `dates.ts`, which has no server dependencies. End-to-end behaviour of the BFF is verified manually and by the `grep` check on the built bundle.

### Scale & trade-offs

**23. What breaks at scale?**

At high traffic: the cache protects NASA (historical plates hit the CDN), but the route handler's `getPlateRange()` is unbounded if someone crafts a request with a 40-day range. I'd add rate limiting on the route handler. At very high traffic: the Next.js Data Cache is process-local; a serverless deployment with many instances would have cache misses on cold starts. Moving to Redis or a CDN-level cache would help.

**24. What would you change about the architecture?**

I'd add virtual scrolling (`react-window`) for the archive grid so it doesn't grow the DOM indefinitely. I'd also add a proper search/calendar date picker. The current date input is just a text field — it works but isn't ideal UX for jumping decades.

**25. Why Next.js App Router over Pages Router for this?**

Server Components. `page.tsx` is a Server Component — it can `await` both NASA calls directly, with no `useEffect` or client-side fetch. The data is in the HTML before JavaScript runs. Pages Router would require `getServerSideProps` and separate data-fetching lifecycle, and the client would still need to fetch for the "load more" feature. App Router's model is cleaner for this mix of server-rendered content and client interactions.

---

## 5 Curveball Questions

**C1. NASA's API is free — why not just call it from the client and skip the BFF complexity?**

Three reasons beyond the key: (1) rate limiting — DEMO_KEY is 30 req/hr/IP. A page with 12 grid items could hit that in one visit. Server-side, one cache hit serves many clients. (2) Cache-Control — we control the caching headers from our own origin. (3) Error translation — NASA returns different error shapes and status codes; normalising them to a typed `ApodError` union on the server means the client code is simple.

**C2. If `searchParams` is now async in Next.js 16, does that mean the page is always dynamic?**

Yes — accessing `searchParams` opts the page out of static rendering. The `ƒ` marker in the build output confirms it's dynamic. That's correct here: the focal plate depends on a query parameter that varies per request. A "latest plate" homepage variant could be statically rendered, but that's not what this page does.

**C3. The `develop` animation runs on every image load. Isn't that annoying on slow connections?**

The animation is 1.8 seconds and only plays once per image. On slow connections, the animation is doing real work — the image genuinely isn't loaded yet, so showing "developing" is accurate. On fast connections, it's a brief 0.4-second reveal. `prefers-reduced-motion` skips it entirely. The plan originally considered only playing it on the focal plate and skipping it on grid thumbnails, but that would require two versions of `PlateImage`. I kept it consistent.

**C4. Could you cache the archive range client-side to avoid refetching when the focal date changes?**

Yes. Currently, when the focal date changes, `ArchiveStrip` re-renders with new `initialPlates` from the server and discards the in-memory plates the user loaded with "Load more". A proper fix would be to lift the archive state to a React context or a library like `swr`, key the cache by date, and merge new server data with existing client data. That's a known limitation documented in the build log.

**C5. What happens if the user's clock is wrong?**

`todayInArchiveTime()` runs on the server and uses `Intl.DateTimeFormat` with the server's system time, converted to Eastern time. The client's clock only matters for the `DateNavigator`'s "Today" button, which calls `todayInArchiveTime()` on the client too. If the client clock is significantly wrong, the "Today" button might navigate to a wrong date. But the server would clamp it to the archive's actual today, so at worst they see yesterday's or tomorrow's plate. Not a safety issue.

---

## Quiz yourself

When you're ready, say "quiz me" and I'll ask these one at a time and grade your answers.
