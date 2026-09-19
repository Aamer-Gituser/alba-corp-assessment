# Apogee — NASA APOD Plate Archive

Travel to any date since 16 June 1995 and see the photograph NASA published of the universe that day.

**Live:** _[pending deploy]_

---

## What it is

A single-page archive viewer backed by NASA's Astronomy Picture of the Day (APOD) API. Every view is a shareable link (`?date=YYYY-MM-DD`). The browser never talks to NASA directly — all API calls happen on the server.

---

## Architecture

```
Browser
  │
  ├── Server Component (page.tsx)
  │     └── reads ?date= from URL
  │     └── calls getPlate() + getPlateRange() in parallel
  │     └── renders FocalPlate + ArchiveStrip (initial SSR data)
  │
  ├── Client Component (ArchiveStrip)
  │     └── "Load earlier plates" → fetch /api/apod?start=&end=
  │
  └── /api/apod  ← our own route handler (BFF)
        └── calls NASA with the API key (server-side only)
        └── sets Cache-Control header for CDN caching
```

**Key boundary:** `src/lib/nasa.ts` begins with `import "server-only"`. Importing it from a Client Component is a build error — not a convention. The NASA key can never reach the browser.

**Dual-TTL caching:** Historical plates are immutable → `revalidate: 31536000` (1 year). Today's plate might still be published or revised → `revalidate: 900` (15 min). Cache hits never touch NASA, which is what keeps the app inside the rate limit.

**Retry/backoff:** Up to 3 attempts with exponential backoff + jitter. `Retry-After` header is honoured on 429 responses.

---

## Advanced features

### Your own backend (BFF)
- API key lives in `process.env.NASA_API_KEY`, never in the client bundle
- Proven: `grep -rl "NASA_API_KEY" .next/static/` returns empty after build
- Dual-TTL cache reduces NASA requests dramatically on repeat visits
- Retry with backoff survives rate limiting transparently

### Shareable, URL-synced state
- Selected date is always in `?date=YYYY-MM-DD`
- Every view is a direct link — bookmark it, share it, paste it in a message
- `useRouter().push()` inside a `useTransition` so the UI stays responsive during navigation

---

## Running locally

```bash
# 1. Clone and enter the folder
git clone https://github.com/Aamer-Gituser/alba-corp-assessment.git
cd alba-corp-assessment/01-web-app

# 2. Install dependencies
npm install

# 3. Copy env template and add your NASA key (optional — DEMO_KEY works for local dev)
cp .env.example .env.local
# Edit .env.local: NASA_API_KEY=your_key

# 4. Start the dev server
npm run dev
# → http://localhost:3000
```

---

## API quirks and how they're handled

| Quirk | Handling |
|---|---|
| NASA publishes on US Eastern time, so "today" in UTC+4 can 404 | `todayInArchiveTime()` always uses `America/New_York` |
| `media_type` can be `"video"`, which has no image | `thumbs=true` param requests a poster frame; UI marks it "motion plate" |
| `hdurl` is absent on video entries | Falls back to `url` |
| `copyright` field contains embedded newlines | Whitespace collapsed before display |
| Range queries return oldest-first and silently skip missing dates | Results are reversed; callers never assume a fixed length |
| Archive starts 1995-06-16; earlier dates return 400 | Date validated before any request is sent |
| `DEMO_KEY` capped at 30 req/hour/IP | Dual-TTL cache + retry/backoff; documented in `.env.example` |

---

## How I tested it

- **Unit tests:** 13 vitest tests cover all date-handling edge cases (`npm test`)
- **Secrets audit:** `grep -rl "NASA_API_KEY" .next/static/` → empty (no key in client bundle)
- **Manual golden path:** today → date jump → random plate ×5 → load earlier plates → video entry
- **Edge cases:** `?date=2099-01-01` (clamped to today) · `?date=banana` (clamped to today) · `?date=1995-06-16` (first plate, prev disabled)
- **Failure states:** invalid API key → typed error notice · offline → inline alert · slow network → developing shimmer visible
- **Accessibility:** tab-only navigation (focus ring always visible) · screen reader text on loading skeletons · reduced-motion respected
- **Build verification:** `npm run build` passes with zero errors and zero type errors

---

## Known limitations

- No automated end-to-end tests (Playwright)
- "Load earlier plates" is a button rather than windowed infinite scroll
- No offline/service-worker support
- Archive grid re-fetches on focal-date change rather than merging the in-memory cache
