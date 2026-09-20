# Apogee — video and interview preparation

Finalize only after evidence is complete. Bracketed facts must come from the real build log.

## Three-minute beat sheet

**0:00–0:20:** “This is Apogee, a date-addressable archive of Astronomy Picture of the Day. Pick a birthday or any date since June 1995, see that entry, read its story and share the exact view.”

**0:20–0:55:** Change date, previous/next, copy exact URL, open a preceding entry. Brief mobile view.

**0:55–1:30:** Show video/other or media failure, plus one loading/error state. Explain uncropped media and resilient text/source.

**1:30–2:15 — proud part (only if verified):** server-only credential; raw responses normalize into one model; differentiated cache; bounded retries/timeout. Show focused evidence and one trade-off.

**2:15–2:40 — fought back:** actual symptom → cause → fix → verification. Possible only if real: response migration, video without poster, stale image state, Retry-After parsing.

**2:40–3:00:** two honest limitations and next improvement. Finish on product.

## Recording setup

Production app/network ready; image/non-image/state dates noted; terminal output safe; no secret URL/value visible; notifications off; readable zoom; links tested signed out; speak from beats.

## Interview drill

1. What single job does Apogee do, and what was cut?
2. Why APOD and which upstream limitation mattered?
3. Where is client/server boundary?
4. How prove key is absent from browser artifacts?
5. Which raw variants does adapter accept?
6. Why convert upstream HTML to text?
7. Which failures retry and which do not?
8. How handle Retry-After within total budget?
9. What is cached and what proves it?
10. Why URL state?
11. Why contain focal image and crop thumbnails?
12. How differ invalid date, missing entry, media failure and upstream failure?
13. Keyboard/reduced-motion behaviour?
14. What breaks first at scale?
15. How did AI help and which decisions are yours?

Answer 15 plainly: AI accelerated typing/review; candidate owned scope, normalized model, bounded failure handling, fixed context sheet and image-first layout, and verified generated work.

After submission, prepare from the exact final commit: one-page architecture map, cold Q&A and one live debugging scenario (429, malformed payload or broken media).
