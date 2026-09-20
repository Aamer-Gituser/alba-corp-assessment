# 05 · Strict verification after implementation

Run on the final source/deployment revision when development is complete. This document is a test plan, not evidence of tests already run. [09](09-EXECUTION-AND-EVIDENCE.md) records actual results.

## Safety and evidence rules

Use a dedicated synthetic test project/accounts for mutation/security tests. Current seed deletes all demo-owned rows, and current proof can modify/delete B rows if a policy is broken. Do not run either against a shared production demo without isolated disposable fixtures.

Capture: test ID, commit/hash, environment, timestamp, expected, actual, pass/fail/blocked/skip and redacted evidence. Any unexpected API/network error is failure or blocked, never “access denied” success. Skip is not pass.

## Security proof — repair before trusting output

Seed A and B each with at least two vehicles and jobs, plus empty user C. Put fixture identities/passwords in local env; verify script and seed use the same config. Record fixture IDs. Before attacks, independently read and snapshot B vehicle/job fields and totals as B. Admin provisioning may be separate; attack queries must use a public key plus A's user JWT.

| ID | Case | Expected |
|---|---|---|
| S01 | A and B own SELECT and legitimate create/edit/delete | Both can perform expected operations; broken deny-everything setup fails |
| S02 | No JWT: every table/view/RPC | No business rows or aggregates disclosed |
| S03 | A queries all vehicles/jobs/profiles | Every returned owner/id matches A; expected own fixtures exist |
| S04 | A selects known B vehicle/job/profile UUID | No row |
| S05 | A updates/deletes B vehicle and B job | No affected row and B snapshots unchanged |
| S06 | A inserts vehicle with owner B; changes own owner to B | Specific policy rejection; no new/transferred row |
| S07 | A creates job on B vehicle; reparents own job to B vehicle | Policy rejection; own job and B snapshot unchanged |
| S08 | A queries vehicle_economics | Own known fixture visible; B IDs absent; no unexpected error |
| S09 | All three analytics RPCs as A and B | Exact independent expected counts/sums for each owner, not merely nonnegative values |
| S10 | A edits B profile directly | No row affected; own profile edit persists |
| S11 | Empty user C | Legitimate empty results; totals/empty semantics correct |
| S12 | B re-read after every attack group | Snapshot equals actual before snapshot; fixtures still exist |
| S13 | Optional realtime malicious topic subscription | A cannot receive B insert/update/delete payloads or private invalidations |
| S14 | Final privilege/schema audit | RLS on all tables, 10 intended base policies, invoker view/functions, intended grants only |

Request returned rows or count explicitly for denied writes; assert error semantics, not null-coalesced counts. Missing fixtures fail setup. Exit nonzero on failure, unexpected exception or missing mandatory coverage. Print no tokens/passwords. Replace README's current output only with the corrected script's actual result.

## Analytics and contract cases

| ID | Check |
|---|---|
| A01 | Stats response is exactly one valid object; no undefined/NaN. Empty account is valid empty, outage is unavailable |
| A02 | Unmodified current A seed: fleet 5; stock basis 724550; recon 28250; sold 5; realised contribution 92300 |
| A03 | Dedicated 2-bought/3-sold month: counts 2/3 and margin 50 for +100/−50/0 sales; no fan-out |
| A04 | Month first/last day, December/January, Dubai date boundary; six ordered buckets including current month |
| A05 | Zero-sales versus sold-with-zero-margin versus no-data versus query failure |
| A06 | Zero-cost jobs remain visible; category sum = all-time recon KPI |
| A07 | Missing target, zero target, zero basis, negative margin and cents; no divide-by-zero or false gain/loss |
| A08 | Late correction to sold job changes historical contribution consistently, per disclosed model |
| A09 | Loss-making young vehicle remains in attention despite eight older safe vehicles |
| A10 | Invalid months_back inputs bounded; unknown status/sort rejected/normalized; no silent truncation described as full inventory |

Expected fixture totals in 02 are source calculations, not live evidence. If fixture data changes, regenerate expectations independently and record the anchor date.

## Functional/auth/account cases

| ID | Scenario | Acceptance |
|---|---|---|
| F01 | Signed-out protected page/direct action | Login/authorization rejection; no private data |
| F02 | Valid/wrong login, network failure, throttled login | Correct destination; distinct safe feedback; no secret output |
| F03 | Sign-in/signup mode switch repeatedly | No stale password/defaults/error state; confirmation behavior matches config |
| F04 | Expiry, token refresh, sign-out/back, A→B switch | No stale A data under B; redirects preserve updated cookies |
| F05 | Profile edit/cancel/invalid/failed save | Own names persist/header refresh; email unchanged; input kept on failure |
| F06 | Vehicle create/read/edit/delete | Accurate feedback and persistence; cascade explicitly confirmed |
| F07 | Sold transition/reopen unsold | Sold price/date set together; unsold clears both deliberately |
| F08 | Job create/read/full edit/toggle/delete | Every business field editable; economics/list/overview refreshed |
| F09 | Deleted/missing UUID and denied zero-row update | No false success |
| F10 | Blank/negative/overflow/decimal amounts, bad/future dates, long text | Consistent field validation and DB boundary |
| F11 | Save then close/reopen each modal twice | Form remains open and usable with fresh state |
| F12 | Failed save, double click, cancel dirty, pending close | No duplicate accidental request, lost draft or hidden error |
| F13 | Search/filter/sort, empty results and detail-back | URL/state consistent; Clear filters restores view |
| F14 | Foreign UUID, invalid UUID, missing own row, backend outage | No leakage; 404 only for appropriate successful empty lookup |

## UI / realtime / accessibility

| ID | Case | Acceptance |
|---|---|---|
| U01 | 375/768/1440px, 200% zoom | No clipped primary action or unintentional body scroll |
| U02 | Keyboard-only all forms and dialogs | Focus contained/restored, Escape/Cancel usable, labelled titles/errors |
| U03 | Desktop overview | One complete chart panel per grid cell; title/units/timeframe/table grouped |
| U04 | Loading / empty / partial failure | Correct route geometry; useful actions; no fake zeros/endless skeleton |
| U05 | Zero/loss/long values | Readable text, no colour-only meaning; exact cents available |
| U06 | Reduced motion | CSS and Recharts animation disabled; no repeated entrance sequence |
| U07 | Touch targets, focus on light/dark, screen-reader smoke | Labels/state/announcements and contrast acceptable |
| U08 | Production console and navigation | No hydration errors; no full-document navigation where Link suffices |
| U09 | Optional realtime two same-user tabs | Insert/update/delete converge without manual reload; observe final data, not badge |
| U10 | Offline/reconnect/rapid events/dirty form | Honest status, coalesced refresh, recovered data, draft preserved |
| U11 | Login at small height and settings on phone | Form appears promptly; actions reachable |

## Tooling and final release gate

In 02-dashboard: npm ci; npm run lint; local tsc --noEmit; npm run build. Pin script dependencies and avoid fetching tooling implicitly at verification time. Run corrected RLS and analytics checks in isolated test environment, then a minimal hosted reviewer smoke pass.

Lighthouse/accessibility/performance results must record URL, device/network, build and date; no invented target pass. A score alone does not prove keyboard usability.

Before submission:
- [ ] No open P0 or core requirement failures; all remaining limitations disclosed.
- [ ] Migration from clean project AND upgrade from prior schema verified.
- [ ] Authenticated deployed CRUD/profile and exact totals checked.
- [ ] Every advanced checkbox matches independently evidenced functionality.
- [ ] Live/repo/video/access notes work from a fresh browser.
- [ ] Source public or reviewer-shared; README, log and tracked env example complete.
- [ ] Secret scan reviewed safely; real credentials/tokens absent from source/history/log artifacts.
- [ ] Time ledger accurate; no extra clock reset.
- [ ] User reviews final submission content before the irreversible Submit action.
