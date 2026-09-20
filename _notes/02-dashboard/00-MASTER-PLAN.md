# 00 · Forecourt — Task 02 master plan

Reviewed 2026-09-20 against current source, the supplied Task 02 brief and nine screenshots. **This is an improvement plan, not a release certificate. Application code was not changed by this review.**

## Intended outcome

A reviewer signs in, understands the stock position, edits a vehicle and preparation job, sees the correct margin change, and can inspect reproducible isolation evidence. Keep the vehicle/reconditioning relationship and auction-catalogue identity. Fix contracts, workflow and evidence before adding visual effects.

The current app includes overview, inventory, detail, forms, seed and proof scripts. The old monthly fan-out and recon UPDATE ownership gaps are repaired **in source**; their deployment is unverified. The screenshots show a rendered deployment with broken KPIs, chart layout and modal placement. Earlier scaffold-only and “45% complete” descriptions are obsolete.

## Package and authority

| File | Purpose |
|---|---|
| [08 Review findings](08-REVIEW-FINDINGS.md) | Prioritized source-backed findings, screenshot mapping and actual check results |
| [01 Requirements](01-REQUIREMENTS-MATRIX.md) | Official requirements versus user-requested enhancements |
| [02 Data model](02-DATA-MODEL.md) | Schema, ownership, metric definitions and fixtures |
| [03 Architecture](03-ARCHITECTURE.md) | Typed reads, safe writes, auth/profile and realtime |
| [04 Design](04-DESIGN-SPEC.md) | Screen/layout, interaction and motion specification |
| [05 Verification](05-VERIFICATION-PLAN.md) | Strict post-implementation audit |
| [06 Deployment](06-DEPLOYMENT-RUNBOOK.md) | Reproducible setup, migration, seed and deploy |
| [07 Video/interview](07-VIDEO-AND-INTERVIEW.md) | Conditional script and understanding drill |
| [09 Execution/evidence](09-EXECUTION-AND-EVIDENCE.md) | Ordered work, clock and evidence ledger |

These notes replace the older enquiries-based Task 02 plan. The second entity is reconditioning_jobs. Only Task 02 is in scope; changes to the shared master plan must be limited to Task 02 references and a time-budget correction notice.

[Revision 1](08-REVISION-1-FIXES.md) is retained as historical context only; it no longer overrides this package.

## Scope, in priority order

| Priority | Deliver |
|---|---|
| P0 | Correct KPI response shape; honest error/empty states; fail-closed RLS proof; aligned fixture accounts; safe credential handling |
| P1 core | Full job editing; mutation feedback; modal positioning/lifecycle; grouped charts; mobile/keyboard CRUD |
| P1 user request | Profile editing for display/dealership names; account menu; dependable login/logout |
| P2 | Inventory search/sort/counts; filter-preserving back; attention reasons; money/date consistency; restrained motion |
| Conditional | Retain realtime only after event isolation/reconnect/delete checks; otherwise remove claim and disclose |
| Out | Uploads, teams, AI assistant, CRM, payments, exports, dark mode and framework rewrite |

Auth + RLS + server-computed analytics already meets the brief's recommended advanced combination. Three charts exist; keep them if quickly repaired, but two are mandatory. Profile editing is the user's request, not an extra official requirement.

Retain installed Next.js/React/TypeScript/Tailwind/Recharts. Supabase supplies Auth/Postgres/Data API, Vercel hosts, Loom records. SQL suits the real relationship and aggregation; Supabase is recommended by the brief. Convex and Appwrite can also enforce and test access controls.

One user represents one dealership; synthetic data, AED only. Margin is vehicle contribution before VAT, finance, fees and overheads. Do not claim production accounting or unlimited scale.

## Clock — no reset on approval

The brief says roughly 2–4 hours per task and asks candidates to stop and disclose overruns. Include prior planning/coding, review, debugging, deployment, tests and task-specific recording; list waiting separately. Prior active time and exact deadline remain unconfirmed, not zero.

**Remaining allowance = max(0, 240 minutes minus actual Task 02 active minutes already spent).**

Reconcile that total before resuming implementation. If already over, freeze the assessment version, report its state and list next work. Later portfolio improvements must be dated/disclosed separately. Another session or an approval does not create another four hours.

Prioritize correctness/security → full CRUD/account basics → layout/mobile → deployment/evidence → recording. Freeze features before the final verification block. P2 additions must not consume the reserve for security, reviewer access or submission checks. Estimates in 09 are ranges, not proof everything fits.

## Observed checks and limits

- TypeScript passed with --noEmit --incremental false.
- Lint failed: 2 errors and 16 warnings.
- Production build compiled, then stopped with spawn EPERM at the TypeScript stage. Full build is not verified.
- Seed/RLS scripts were inspected, not run: they mutate shared demo data.
- All nine user screenshots reviewed; no fresh authenticated live CRUD, mobile, security or performance pass is claimed.
- Root workspace now resolves as the monorepo; use its existing Git state and remote, not a nested git init.

After implementation, execute 05 against the final revision, fill 09 with actual evidence, update standalone README/build log, then adapt 07 and rehearse. No deployment or submission occurred during this review.
