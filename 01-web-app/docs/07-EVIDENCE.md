# Apogee — evidence register

Planning review: 2026-09-20. Planned work is not completed evidence.

## Captured now

| Area | Result |
|---|---|
| Brief | User-supplied Task 1 requirements mapped |
| Source | First-party code/config/docs and starter assets reviewed; dependencies/generated folders not exhaustively audited; implementation changed concurrently and was re-read at commit `462de62` |
| UI | Composed page exists; submission remains incomplete and unverified against this register |
| Git | Root repository and dirty multi-task working tree inspected; history preserved |
| NASA docs | Official repo update dated 2026-09-10 documents response change; compatibility gate required |
| Rights | Official APOD guidance says rights vary by owner |
| Quota | api.data.gov: default 1,000/hour; DEMO_KEY 30/hour/IP, 50/day/IP |
| Framework | Installed Next 16.3.5 docs read; fetch cache opt-in; image priority deprecated; error boundary supports retry |
| Contrast | Graphite 5.85:1 black / 5.41 slate; amber 9.37/8.66; cyan 8.46/7.81; opacity variants pending |
| Live API | Direct probe failed in environment; no deployed payload claim |
| UI skill | Written checklist used; optional search script unavailable; no generated design system claim |
| Unit tests | 2026-09-20: `npm.cmd test` passed, 1 file / 13 tests; unrestricted rerun used because the sandbox cannot spawn Vitest workers |
| Production build | 2026-09-20: `npm.cmd run build` passed on Next.js 16.3.5 |
| Lint | 2026-09-20: `npm.cmd run lint` passed with zero errors and warnings |

## Fill after implementation

| Gate | Method/result | Status |
|---|---|---|
| Five redacted API fixture classes | | Pending |
| Tests | `npm run test` | Fresh pass: 13/13 |
| Lint | `npm run lint` | Fresh pass |
| Type check | `npm run typecheck` | Pending |
| Build | `npm run build` | Fresh pass |
| Functional matrix | `docs/04-VERIFICATION.md` | Pending |
| Accessibility/responsive/motion | manual | Pending |
| Lighthouse | production mobile | Pending |
| Cache proof | repeated production-mode request/counter | Pending |
| Source/history/artifact key scans | redacted scripts | Pending |
| Production/repo/video access | signed-out browser | Pending |

Earlier Task 1 time is unknown; candidate must supply honest estimate. Include planning/review if it contributed to delivery and record future phase times live.
