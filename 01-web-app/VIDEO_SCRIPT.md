# Apogee — Final Task 1 video script

**Target length:** 3–4 minutes
**Recording order:** record only after deployment and browser verification

## Before recording

- Open the public URL in a fresh private window.
- Keep browser zoom at 100% and silence notifications.
- Prepare `1969-07-20` for date navigation.
- Prepare one video or non-image APOD date from the verified evidence register.
- Keep the README, build log, and evidence register available in a second tab.
- Do not show API keys, `.env.local`, private dashboards, or unredacted logs.

## 0:00–0:25 — Introduction

> “This is Apogee, a date-addressable archive built around NASA’s Astronomy Picture of the Day API. A visitor can travel to any supported date, read the context for that entry, and share the exact view through the URL.”

> “The visual language is intentionally closer to an observatory catalogue than a dashboard: a dark plate surface, restrained cyan and amber signals, large editorial typography, and a fixed contact sheet for nearby dates.”

Show the landing page and let the focal media finish loading.

## 0:25–1:05 — Core product flow

> “I’ll jump to July 20th, 1969. The URL now contains `?date=1969-07-20`, so this exact plate is bookmarkable and shareable.”

Use the date picker, then show previous and next navigation.

> “Previous and next keep the URL as the source of truth. The current date disables Next, and the first archive date disables Previous.”

Scroll to the contact sheet.

> “The archive window is deliberately bounded to eight nearby entries. That keeps the page predictable and avoids an unbounded load-more list. Every card links to its own deep URL.”

## 1:05–1:45 — Media and failure states

Open the verified video/non-image entry.

> “APOD is not always a still image. Image entries use the best available still source. Video or other media gets a deliberate placeholder and a source action, so the UI never presents a video as a broken photograph.”

Show the relevant credit/source metadata.

> “When NASA does not provide a copyright field, the app says ‘See source for image credit’. It does not guess that the image is public domain.”

Show the documented error or loading state if available.

> “Loading, rate limiting, timeout, invalid response, configuration, and empty states each have an actionable message. An upstream failure is never silently converted into an empty archive.”

## 1:45–2:30 — What I’m proud of: the backend boundary

> “The part I’m most proud of is the server boundary. The browser never receives the NASA API key and never calls the credentialed NASA endpoint directly.”

Open DevTools Network only if the production evidence has been captured.

> “The page talks to our own server-rendered route. The NASA adapter imports `server-only`, so importing it from a client component becomes a build error. The credential is protected structurally, not just by convention.”

> “The adapter validates and normalizes the upstream payload before the UI sees it. Historical entries use a 24-hour cache and the current day uses a five-minute cache. Requests have a four-second attempt timeout, at most three attempts, and a twelve-second total budget. `Retry-After` supports both seconds and HTTP-date values.”

Show the relevant source files briefly: `src/lib/nasa.ts`, `src/lib/plates.ts`, and `src/app/api/apod/route.ts`.

## 2:30–3:20 — Bugs I found and fixed

> “The most important bug was the meaning of ‘today’. Using UTC could request tomorrow before NASA had published that entry. I fixed it with the archive’s US Eastern timezone.”

> “Another build issue came from putting `posterImage()` in the server-only NASA file while the client contact sheet needed it. I moved the pure media helper into its own module, keeping secrets server-only.”

> “I also fixed image state that could remain failed after the date changed, an archive strip that could retain stale initial data, and a retry path that could retry immediately when `Retry-After` was missing.”

> “During the audit I found two misleading product assumptions: a missing copyright field is not proof of public-domain rights, and a date URL alone should not be claimed as the brief’s separate search-and-filter advanced option. The final submission claims one advanced option honestly: the own backend boundary.”

## 3:20–3:45 — Verification and limitations

> “The final local verification is clean: lint, typecheck, production build, and 13 focused unit tests pass. The evidence register records the remaining production checks separately.”

> “The remaining limitation is intentional scope: this is a focused archive viewer, not an account system, CMS, infinite feed, or multi-API product. With more time I would add end-to-end browser coverage and production observability.”

Show the public URL, repository, README, build log, and evidence register.

## Closing line

> “Apogee is small by design: one useful archive experience, one defensible backend boundary, clear failure states, and enough documentation that another engineer can verify every important decision.”
