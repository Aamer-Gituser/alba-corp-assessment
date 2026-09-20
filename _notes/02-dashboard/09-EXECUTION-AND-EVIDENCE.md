# 09 · Repair order, honest clock and evidence ledger

Planning update only. Do not interpret this as additional assessment time or implementation completed.

## Ordered batches

| Batch | Work | Planning estimate, not actual | Exit gate |
|---|---|---|---|
| A | KPI contract, read errors, chart card grouping, modal center/lifecycle | 25–40 min | Screenshot defects removed; add/save/reopen twice; no fake empty/outage |
| B | Correct proof/accounts, isolated fixtures, explicit counts/snapshots, credentials/template | 25–45 min | Mandatory security/analytics checks genuinely pass; no skipped PASS |
| C | Full job editing, mutation feedback/validation/invalidation | 20–35 min | CRUD both entities, decimals/error paths, persisted results |
| D | Own-profile settings and login/session repair | 20–35 min | Profile/header persistence, cross-user denial, mode/session checks |
| E | Mobile, detail deduplication, attention/zero states; search/sort if remaining | 20–35 min | 375px/keyboard/reduced-motion gates; no scope creep |
| F | Final build/deploy/verification/docs/video | 30–50 min | Evidence and reviewer access matched to release |

Total illustrative repair estimate: **140–240 minutes in addition to time already spent**. This is not compatible with an automatic fresh four-hour allowance. If the original time-box is exhausted, stop assessment implementation and disclose this backlog. Cut P2 and optional realtime first; do not silently extend the official clock.

## Clock ledger

| Segment | Actual |
|---|---|
| Prior Task 02 planning/coding | Unknown; user confirmation needed |
| This review/planning session | Use actual session records; no fabricated duration |
| Subsequent repairs | Record at each phase boundary |
| Verification/deploy/docs/recording | Record separately and include in task total |
| Waiting/external delays | Separate wall-clock notation |
| Exact submission deadline | Unconfirmed |

The old build-log phase estimates add to 250 minutes, not the claimed ~3.5 hours. Keep estimates separate from actuals. Preserve genuine old entries; label corrections and unknowns instead of rewriting history as contemporary notes.

## Evidence ledger

| ID | Revision/environment | Result | Evidence |
|---|---|---|---|
| Review-TS | Local working tree, 2026-09-20 | PASS | tsc --noEmit --incremental false exited 0 |
| Review-lint | Same | FAIL | 2 no-explicit-any errors, 16 warnings |
| Review-build | Same, restricted execution environment | BLOCKED | Compiled; TypeScript stage failed spawn EPERM |
| Review-screens | Nine user screenshots | OBSERVED | Broken KPI, chart grouping, dialog placement |
| Final-security | Not run | PENDING | Corrected script required; current script false-positive paths |
| Final-analytics | Not run | PENDING | Independent fixtures in 02/05 |
| Final-CRUD/profile/auth | Not run | PENDING | Matrix 05 |
| Final-mobile/a11y/performance | Not run | PENDING | Matrix 05 |
| Final-hosted/build | Not run | PENDING | Release commit/deployment URL |
| Final-video/access | Not recorded/verified here | PENDING | Fresh-browser links |

Pending is honest status, not a placeholder to replace with a guessed PASS.

## Handoff after development

Provide final revision, deployment URL, migration version, nonsecret fixture IDs/anchor date and the contemporary build log. Run 05 with real results. Resolve failed core gates within the remaining allowance or disclose them. Adapt 07 to the final implementation and rehearse.

No application source, migrations, seed/proof implementation or deployed state was changed during this review. Only planning/review documents were updated.
