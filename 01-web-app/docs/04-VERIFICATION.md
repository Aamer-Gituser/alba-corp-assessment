# Apogee — strict verification plan

Run after implementation. Do not mark a line complete from code inspection alone. Record command, date, environment and observed result in `07-EVIDENCE.md` and summarize it in `BUILD_LOG.md`.

## Automated gate

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

All must exit 0. Tests must include parser/retry/date/route boundary cases from the backend contract.

## Functional matrix

| Case | Expected |
|---|---|
| `/` | Current archive date or honest not-yet-published state |
| `/?date=1995-06-16` | First entry; previous disabled; no reversed range |
| historical image | Uncropped media, explanation, credit/source |
| video/other | Safe poster if available; otherwise source action, no broken image |
| impossible/before/future date | Explicit date UI; no upstream request |
| missing entry | Entry-specific empty state with adjacent navigation |
| back/forward | Restores date and content |
| copy link | Exact URL copied; live confirmation; denial fallback |
| media 404 | Local failed-media state; article remains |
| contact query fails | Error is not presented as empty |
| API key absent/invalid | Configuration response; no detail leak |
| 429 | Retry-After obeyed; clear final state |
| 5xx then success | Bounded retry recovers |
| offline/timeout | Recoverable failure within total budget |

## Responsive, accessibility and performance

- Viewports: 320×568, 375×812, 768×1024, 1024×768, 1440×900; no overflow or clipping.
- Keyboard-only full flow; visible focus; logical order; 44px targets.
- Screen reader smoke: one `h1`, nav/input labels, pending/copy announcements, useful alt text.
- 200% zoom and reduced motion remain usable.
- Lighthouse mobile production run: target Performance ≥85; Accessibility, Best Practices, SEO ≥95. Record actual scores and LCP/CLS/INP.
- Selected image only eager/high priority; context media lazy; correct `sizes`; no full-screen filter animation; no stale UI after navigation; console clean.

Claim “60fps” only after Performance-tool observation on representative throttling. Otherwise report compositor-friendly motion and observed behaviour.

## Security and deployment

- No tracked `.env.local`; tracked placeholder `.env.example`.
- Scan source, history and built browser artifacts for the actual local key without printing it; zero matches.
- Browser makes no request to credentialed APOD endpoint. Image/source host traffic is expected.
- Query parameters cannot choose upstream targets/hosts; no raw upstream HTML rendering.
- Production works signed out for happy, boundary, video/other, invalid and error cases.
- Repo/folder, live app and video links open signed out.
- Tick **own backend** only after evidence passes. Save Draft, recheck links, then submit because it locks.

## Evidence rule

Never write “passed,” “secure,” “cached,” “60fps,” “accessible,” or “production-ready” without a fresh evidence row. Screenshots prove visual states; command output proves checks; network/timing data proves cache/performance/security claims.
