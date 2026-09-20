# Apogee — delivery runbook

## Required Task 1 files

`README.md`, `BUILD_LOG.md`, `.env.example`, `VIDEO_SCRIPT.md`, `docs/`, source and package files. The root submission index is owned outside this Task 1 chat; keep Task 1 self-contained inside the existing root repository.

`.gitignore` must include `.env*` and `!.env.example`. The example contains only `NASA_API_KEY=your_nasa_api_key_here`. Treat a personal NASA key as required for production; `DEMO_KEY` is for exploration.

## README order

1. Product hook and screenshot.
2. Live and source links.
3. Features.
4. API choice and why.
5. Architecture and client/server line.
6. Advanced backend: key custody, cache, retry/backoff, timeout, graceful failure.
7. Actually observed API quirks.
8. Local setup and checks.
9. Actual verification/Lighthouse results.
10. Known limitations/next work.
11. Image-credit/source note.

## Build log

Create before implementation continues using the official seven headings. Add short timestamped notes at phase boundaries. State that earlier scaffold/component work predates reliable timing notes; estimate honestly. Record bugs/dead ends only after they occurred.

## Deploy and submit

Vercel is natural. For separate Task 1 repo import normally; for future monorepo choose `01-web-app` Root Directory. Set `NASA_API_KEY` in Production/Preview; use `.env.local` locally.

Final values: deployed URL, public repo/folder, anyone-with-link video, concise real limitations, and **Your own backend** advanced checkbox after proof.

Recommended limitation wording, adapted to reality:

> APOD content and media hosts are upstream-controlled, so an old entry can lose its image while its text remains. Apogee preserves the entry and links to source when media fails. The contact sheet is deliberately limited to eight nearby entries; full-text search, favourites and offline support are outside this time-boxed version.

Final order: Save Draft → open every link signed out → rerun checks/secret scan on submitted commit/deployment → confirm docs/video → tick only proved boxes → paste limitations → submit once.
