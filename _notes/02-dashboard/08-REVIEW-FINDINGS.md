# 08 · Task 02 source and screenshot audit

Reviewed 2026-09-20: current 02-dashboard source/config/scripts/docs, eight original planning notes, both named plans, supplied brief and nine screenshots. Application code unchanged. Paths below are relative to 02-dashboard at review time.

**Verdict: not ready for submission.** Preserve the domain and database architecture. The immediate problems are data contracts, interaction state and evidence quality.

## P0 — correctness and trust

| ID | Evidence/location | Finding | Resolution |
|---|---|---|---|
| R01 | Screenshot 1; src/app/(app)/page.tsx:23 | Table-returning dashboard_stats RPC is cast to one object. Array is truthy; properties become undefined and average renders NaN | Use .single() or validate exactly one row before extraction; check errors and finite numeric fields; test empty account and outage |
| R02 | scripts/verify-rls.ts:74–149 | Errors can PASS; mutation count not requested, null treated as zero; skip counted as PASS; nonnegative count proves no isolation; before/after both read after attacks | Fail closed, own-row positive controls, exact errors/results, affected-row checks, real before/after snapshots, setup failure for missing fixtures |
| R03 | seed.ts account constants; verify-rls.ts:45,66; README | Seed/README identities differ from proof identities. B has no jobs; attack 9 skips. Published proof is not reproducible from current setup | Shared env-driven accounts; seed A/B vehicles AND jobs plus empty fixture user; replace old output after rerun |
| R04 | Seed/proof/README; login NEXT_PUBLIC_DEMO_PASSWORD | Provisioned demo passwords embedded in source/docs; public-prefill variable exposes any configured password in browser build | Local env for scripts and private reviewer access note; remove public password variable; rotate exposed provisioned credentials and scan tracked history safely |
| R05 | Overview/inventory/detail reads | Query errors become empty lists, KPI skeletons or 404s | Inspect every error; valid empty, not-found/forbidden, loading and unavailable must be distinct; no fake zero totals |

## P1 — core product

| ID | Evidence/location | Finding | Resolution |
|---|---|---|---|
| R06 | Screenshots 1–2; chart grid and chart fragments | Plot and table disclosure become separate grid cells; missing panel titles/timeframes | One semantic card per visualization containing heading, scope, plot and table |
| R07 | Screenshots 6/8/9; vehicle-form.tsx:236, recon-form.tsx:127 | Dialogs top-left; no explicit centering/gutters/max-height or title linkage | Shared native dialog with explicit margin/inset, viewport bounds/scroll, labelled title, focus return and mobile layout |
| R08 | Form effects state.ok/onSuccess; inline close callbacks | Success state persists while hidden; reopening changes callback identity and can immediately close again | Fresh form lifecycle per opening, stable callbacks, reset action state; test add-close-reopen twice |
| R09 | actions.ts:117–188 and job forms | Delete/toggle ignore errors; vehicle delete redirects regardless; update can report success after zero-row change | Require actual affected row, uniform action result, pending lock, inline errors, no redirect before success |
| R10 | recon-form.tsx | Job cost/category/description/vendor/date cannot be edited | Add full edit action/form; completion toggle alone is insufficient for the promised workflow |
| R11 | App header/routes | No account/profile editing | Own-profile settings using current profiles RLS; see 03/04 |
| R12 | Vehicle Field and Zod coercion/date schemas | Vehicle amount inputs lack decimal step; direct blank numeric payload can coerce to 0; dates only nonempty | Decimal support, strict required/finite/bounded parsing, calendar-date validation and field errors |
| R13 | Screenshot 7; CostStack/detail facts | Duplicate money summaries; target price not explicit; unknown margin gets semantic colour; sold losses mention asking price | One facts group, target price, neutral unknown, actual/projected-specific copy |
| R14 | Inventory/attention/job tables | Mobile card behavior promised but absent; hidden useful fields and wide tables | Cards or deliberate labelled table scroll; retain every core field/action |
| R15 | Login forms/actions and middleware | False prefilled-demo copy possible; mode reuses uncontrolled defaults/action state; all errors called bad password; redirects discard refresh-cookie response | Separate keyed auth forms, accurate guidance/error categories, preserve refresh cookies, authenticate every action |
| R16 | actions.ts:10 | Runtime constant exported from file-wide use-server module conflicts with documented contract | Move state constant to neutral module; async runtime exports only. Compilation passed here: compatibility risk, not an observed build failure |

## P2 — semantics and refinements

| ID | Location | Finding and action |
|---|---|---|
| R17 | Overview limit(8) before attention filter | Young loss-making cars can be excluded. Filter/rank risk in DB before limit; show reason |
| R18 | charts.tsx:112,171 | Zero net margin means “no cars sold”; free jobs vanish. Use counts, retain zero, show losses below zero baseline |
| R19 | format.ts and form dates | Browser-zone date shifts, UTC default dates, whole-dirham rounding, 4-hex display-ID collisions. Use Dubai business dates/date-only formatting, cents in detail, longer label/full UUID route |
| R20 | Realtime subscriber/publication | Wildcard event isolation claims ignore delete-delivery caveats. Live means subscribed, not data freshly loaded. Safe retention decision in 03 |
| R21 | Type assertions | as-casts hide RPC/partial-select mismatch. Typed clients plus focused response validation; no full-vehicle cast for partial attention projection |
| R22 | Mutation invalidation/toggle | Job costs must invalidate overview/list/detail. Stale hidden boolean is not atomic toggle. Set desired value; pending lock; disclose last-writer-wins |
| R23 | CSS/CostStack/login | Global contrast improved; CostStack still uses bright fills for small text; dark login opacity/focus needs checking. CSS reduced-motion does not disable Recharts JS animation |
| R24 | Migration | CREATE TABLE IF NOT EXISTS does not apply later constraints. Inserting view columns before existing ones can break replacement of old schema. Use versioned migration, not rerun-as-rollback |
| R25 | Seed | Deletes all A/B rows, ignores some errors, silently drops jobs with missing parents, date-month overflow risk. Explicit reset/target guard, fixture manifest and checked writes |
| R26 | .gitignore/README/log/notes | .env.example ignored and not listed tracked; live URL placeholder; stale proof; notes say 12 policies, source has 10; log estimates total 250m but summary ~3.5h | Correct artifacts, actual results/revision/timing, ignore exception and links |
| R27 | Inventory | Search/sort/counts missing; back link loses status. Add small URL-backed utilities after blockers |
| R28 | Older implementation plan / revision note | Enquiries/photo-storage plans contradict the actual recon/no-storage scope; old parent-reassignment narrative overstates B-total pollution because job RLS can hide A's job. Supersede old scope and directly test the forbidden parent association |

## Already repaired in current source

Monthly bought/sold are aggregated separately. Recon UPDATE now checks parent ownership. View includes mileage/body type/notes. Global faint and semantic text colours improved. All three main pages and seed/proof scripts now exist.

Do not report these as still-open source bugs. Hosted application of the SQL is unverified. Strong existing choices: request-scoped DB clients, security-invoker view, sold-field CHECK, foreign-key cascade and table alternatives for charts.

## Actual checks

| Check | Result |
|---|---|
| tsc --noEmit --incremental false | PASS, exit 0 |
| npm run lint | FAIL: 2 explicit-any errors in proof, 16 warnings |
| npm run build | Compiled; then spawn EPERM in TypeScript stage. Full build blocked by environment |
| Seed/RLS execution | NOT RUN; scripts mutate shared demo rows |
| Screenshots | Nine desktop screenshots reviewed; none show login/mobile/profile |
| Authenticated live CRUD | Not independently exercised |

## Technical sources

- [PostgreSQL views](https://www.postgresql.org/docs/current/sql-createview.html): base access normally uses view-owner privileges; privileged owners can bypass RLS. security_invoker uses caller policies. Not every default view automatically bypasses RLS.
- [PostgreSQL policies](https://www.postgresql.org/docs/current/sql-createpolicy.html): UPDATE without explicit WITH CHECK reuses USING. Omission alone is not automatically an owner-transfer hole.
- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes): deleted-record event authorization differs; validate actual event payloads/configuration.
- [Next.js use-server exports](https://nextjs.org/docs/messages/invalid-use-server-value): runtime exports should be async functions.
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs): verified identity, cookie refresh and user-session cache isolation.

Open facts: prior actual Task 02 time and exact deadline. Do not invent either.
