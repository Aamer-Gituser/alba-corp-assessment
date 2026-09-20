# Apogee — NASA APOD archive

Apogee is a date-addressable observatory catalogue built around NASA’s Astronomy Picture of the Day API. Choose a date, read the entry’s context and credit, move through nearby dates, and share the exact view through `?date=YYYY-MM-DD`.

**Status:** ✅ Built and verified 2026-09-20. P1/P2 audit fixes + visual restoration complete. Deployed to Vercel. Video walkthrough pending.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `NASA_API_KEY` in `.env.local`. Never commit the real value. `DEMO_KEY` is suitable only for light local testing because NASA applies strict rate limits.

## Architecture

The page is a Next.js App Router Server Component. It reads the date from the URL and calls the server-only NASA adapter. The browser never calls NASA directly and never receives the API key. `src/lib/plates.ts` normalizes and validates upstream data before the UI renders it. The route handler is limited to a maximum eight-date range.

The adapter uses a 24-hour cache for historical entries and a five-minute cache for the current date. Each upstream attempt has a four-second timeout, at most three attempts, and a twelve-second total budget. `Retry-After` values are respected when NASA rate-limits the request.

The chosen advanced feature is the own backend boundary. The date URL is a core archive capability, not a separate search-and-filter claim.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The current local verification passes lint, typecheck, production build, and 13 focused unit tests. Browser, production secret, live URL, and deployment evidence are recorded separately in [`docs/07-EVIDENCE.md`](docs/07-EVIDENCE.md).

## Documentation

- [`docs/00-START-HERE.md`](docs/00-START-HERE.md) — project entry point
- [`docs/01-AUDIT.md`](docs/01-AUDIT.md) — audit findings and risk register
- [`docs/02-PRODUCT-AND-UI.md`](docs/02-PRODUCT-AND-UI.md) — visual and interaction specification
- [`docs/03-BACKEND-CONTRACT.md`](docs/03-BACKEND-CONTRACT.md) — normalized data and resilience contract
- [`docs/04-VERIFICATION.md`](docs/04-VERIFICATION.md) — strict acceptance matrix
- [`docs/07-EVIDENCE.md`](docs/07-EVIDENCE.md) — evidence register
- [`VIDEO_SCRIPT.md`](VIDEO_SCRIPT.md) — final walkthrough script
- [`BUILD_LOG.md`](BUILD_LOG.md) — chronological decisions, bugs, and verification
