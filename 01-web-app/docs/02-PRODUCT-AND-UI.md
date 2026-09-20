# Apogee — product and UI specification

## Product thesis

Apogee is a quiet, image-first archive for NASA's Astronomy Picture of the Day. Its single job is to let someone travel to a date, understand that entry, and share the same view. The interface should feel like an observatory's plate catalogue: precise labels, generous image space and restrained motion.

The product hook is personal: “What did the universe look like on a date that matters to you?” This belongs in the intro and demo, not as a separate feature.

## Information architecture

```text
Masthead: Apogee / archive range / source attribution
Intro: one-sentence hook
Date controls: previous | date field | next | today | random | copy link
Selected entry:
  archive index + date
  title
  media frame
  explanation
  credit / medium / original-source link
Preceding entries: fixed contact sheet, maximum 8
Footer: APOD ownership/credit reminder + source archive
```

One route is enough: `/?date=YYYY-MM-DD`. Back/forward must restore the selected date. Invalid dates show an explicit correction notice and a link to the nearest valid date; they should not silently change the user's request.

## Responsive layout

At 1024px and above, use a maximum readable canvas around 1120–1200px. The selected entry uses the image at full content width, with title above it so meaningful content appears while media loads. The explanation and metadata form a 2:1 split beneath it. The contact sheet is four columns.

The focal image must use `object-contain` on the dark plate surface. Cropping astronomy images damages the subject and conflicts with an archive product. Contact-sheet thumbnails may use `object-cover`, with the full title and date available in text.

At 320–639px everything is a single column. Header copy wraps; controls become two rows without horizontal scrolling. Previous and next remain 44×44px or larger. The date input occupies the available width. The explanation comes before metadata. Contact sheet is two columns. At 640–1023px, metadata can sit beside the explanation; contact sheet is three columns.

## Visual system

Keep the existing palette direction:

| Token | Value | Role |
|---|---:|---|
| Plate black | `#08090c` | Page and image surround |
| Plate slate | `#12141b` | Raised surfaces / loading frames |
| Plate edge | `#212634` | Borders only |
| Emulsion | `#ece6d9` | Primary text |
| Graphite | `#858b9c` | Secondary text; calculated contrast is 5.85:1 on plate black and 5.41:1 on slate |
| Safelight | `#e0a850` | Interactive and focus state |
| Cyanotype | `#6fb3c4` | Measured archive metadata |

Fraunces remains the display face; Geist remains body; Geist Mono is reserved for dates/indexes/medium. Body copy is at least 16px with approximately 1.65 line height. Utility labels are at least 12px; avoid low-opacity text because opacity changes real contrast.

Do not use generic glass panels, neon gradients, starfield particles or large rounded dashboard cards. Image, typography and rule lines provide the identity.

## Components and ownership

| Unit | Server/client | Responsibility |
|---|---|---|
| `ArchivePage` | Server | Parse date, fetch selected/context entries concurrently, compose states |
| `SiteHeader` | Server | Identity, date range and attribution |
| `DateNavigator` | Client | Committed navigation and pending announcement; no API key/data fetching |
| `CopyLinkButton` | Client | Clipboard state with selectable-link fallback |
| `FocalPlate` | Server | Semantic entry, explanation, credit and source |
| `PlateMedia` | Client only where needed | Image lifecycle and failure UI; video/other media uses source link rather than unsafe embedding |
| `ContactSheet` | Server | Up to eight preceding entries, no paging state |
| `Notice` | Server/client as needed | Invalid input, missing date, upstream failure and recovery actions |
| `loading.tsx` | Server | Geometry-matched skeleton |
| `error.tsx` | Client | Unexpected render error, logs error and calls installed framework's `retry()` |

## Interaction details

- Date field uses an explicit Go/submit action or navigation on a committed valid value. Avoid firing server navigation for every intermediate edit.
- Previous/next preserve URL state; disabled state is semantic and visible.
- Copy link says “Copied” in an `aria-live` region for about two seconds. When Clipboard API fails, reveal a selected read-only URL field.
- The selected entry changes with a short 180–240ms opacity/translate transition. Image readiness can fade from a static plate surface. Do not blur a full-screen image for 900ms.
- Skeletons reserve the final geometry. Reduced-motion removes translation and shimmer movement while retaining visible placeholders.
- Contact-sheet links use native links for prefetch/back behaviour and expose full titles to assistive tech.
- Image failure is local: show title/medium and a “View at source” action. It must not blank the whole entry.

## Required states

| State | Visual response | Recovery |
|---|---|---|
| Initial route loading | Masthead, title lines, large media frame and contact cells as skeletons | Automatic |
| Navigation pending | Current entry remains readable; live text says loading | User can continue reading |
| Valid entry | Full editorial layout | Date controls/copy/source |
| Valid date, no entry | “No entry was filed for this date” | Previous/next/today |
| Invalid or out-of-range URL | Explain the accepted range and preserve requested value in copy | First/today links |
| Contact range empty | “This is the beginning of the archive” | Selected entry stays intact |
| Contact range failed | Separate small error panel | Retry page; never call it empty |
| Upstream rate limit | State that archive is busy and show retry guidance | Retry after allowed delay |
| Configuration error | Neutral service-unavailable message; details remain server-side | Operator checks deployment env |
| Media failure | Stable dark frame and source action | Open original entry |
| Unexpected render error | Route boundary with reference digest where appropriate | `retry()` |

## Accessibility and quality floor

- Landmarks: header, main, article, navigation with label, footer.
- One `h1`: selected entry title. Masthead wordmark is a link, not another `h1`.
- Native buttons/links/input; visible labels and focus ring; 44px pointer targets.
- Pending and clipboard messages announced politely; failures use alerts only when immediate.
- Meaningful image alt should prefer upstream `alt` when validated; title is fallback. Decorative skeleton/grain is hidden.
- Never encode medium/error/status by colour alone.
- Test 200% zoom, keyboard-only flow, reduced motion, 320px, 375px, 768px, 1024px and 1440px.
- Target measured performance: Lighthouse mobile Performance ≥85, Accessibility/Best Practices/SEO ≥95. Record actual results even if lower.

## What can be added later

If all required gates pass with time remaining, add a custom favicon and dynamic page title first. A custom Open Graph card is next. Full-text search, favourites, map/constellation enrichment, AI summaries and infinite scrolling are future work; they weaken the single-purpose story inside this assessment's time box.
