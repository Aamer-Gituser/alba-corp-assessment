# 01 · Task 02 requirements and evidence

Use planned / implemented-unverified / pass / fail / blocked / excluded. Existing code is not a pass. Record revision/date/environment in [09](09-EXECUTION-AND-EVIDENCE.md).

## Official core requirements

| ID | Requirement | Current assessment | Acceptance evidence |
|---|---|---|---|
| C1 | Full CRUD with feedback | Vehicles exist; job fields cannot be edited; deletes/toggles hide failures | Both entities create/read/edit/delete, reload, pending/error/success and zero-row checks |
| C2 | At least two useful visualisations | Three charts exist; grid broken and zero-value states misleading | Exact monthly/category fixtures; titled panels with table alternatives |
| C3 | Beautiful fluid UI, states, responsive | Coherent identity; misplaced dialogs; mobile/smoothness unverified | 375/768/1440px, keyboard CRUD, reduced motion and stable loading |
| C4 | Backend does real work | Relational tables, view and RPCs exist; KPI response mishandled | Persisted mutations, exact totals, independent A/B data |
| C5 | Schema/services/setup docs | Docs exist with stale claims | Complete schema and clean setup reproduced |

## Advanced options — authentication is baseline

| ID | Option | Decision | Gate |
|---|---|---|---|
| X1 | Secure isolated data | Core target, not certified | Corrected proof, own-row positive controls, anonymous/A/B queries, child ownership and all RPCs |
| X2 | Server analytics | Core target, implemented-unverified | Exact independent expected totals and single-row stats contract |
| X3 | Realtime | Conditional retention | Same-user insert/update/delete, other-user event isolation, reconnect and draft preservation |
| X4 | File storage | Excluded | Explicit no-bucket declaration; no upload claims |

Auth + X1 + X2 matches the recommended combination. A Live badge alone does not prove X3.

## Six documentation requirements

| Section | Content |
|---|---|
| Backend choice | Why Supabase, fair alternatives and limitations |
| Full schema | Fields/types/defaults, relationships, checks, indexes, policies, view, RPCs, triggers and diagram |
| Services | Auth/Postgres/Data API; Realtime if retained; no Storage/Edge Functions |
| Verification | Executable proof and redacted actual results; pass/fail/skip/blocked distinguished |
| Setup from zero | Runtime/lockfile, ordered migrations, environment, users, seed, start and deploy |
| Way in | Seeded data and working test credentials privately in submission notes/access attachment; README points there |

No actual password in source or NEXT_PUBLIC variables. A privately supplied login preserves both reviewer access and the brief's no-live-credentials-in-repo rule.

## Submission and process

- Live URL; source public OR explicitly shared with reviewer.
- Standalone README, BUILD_LOG with the seven official headings, placeholder .env.example, run instructions.
- Contemporary log entries and actual elapsed time; disclose unknown history and overruns.
- Video is requested by the hand-in narrative but labelled optional by the form. We plan one; its four-minute length is our own choice.
- Check links/access before user submission; the form locks.
- Known limitations must describe actual shortcuts; never fabricate passes, timings or struggles.

## User-requested improvements

| Feature | Acceptance |
|---|---|
| Profile edit | Own display/dealership names, read-only email, validation, save/cancel/error/pending, header refresh and persistence; cross-user update denied |
| Smooth UI | Centered reusable dialogs, one chart/card, bounded motion, draft preservation, no replay on each realtime refresh |
| Inventory utilities | Search make/model, allowlisted sort/status, counts, clear filters; preserve state on return |
| Login quality | Password visibility, separate mode state, accurate access guidance, safe return path, network/session errors handled |

These improve the product but cannot replace core correctness, deployment or security evidence.
