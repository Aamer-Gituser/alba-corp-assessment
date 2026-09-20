# 06 · Task 02 reproducible setup and deployment

Target procedure after repairs, not a claim that the current seed/proof is safe. Do not run the current reset-style seed on the hosted reviewer dataset. See 08 findings first.

## 1. Record target and clock

Confirm task allowance, intended Supabase project, branch/revision and Vercel project. Use a dedicated synthetic-data database. Source directory is D:/Projects/Alba Corp/02-dashboard; Git root currently resolves to D:/Projects/Alba Corp. Preserve unrelated changes.

## 2. Runtime and environment

Record a Node version supported by the pinned Next.js release and use it locally/Vercel. Install the committed lockfile with npm ci. Current tsx is a dev dependency: scripts should call the pinned tsx directly instead of npx fetching anything unexpectedly.

Copy placeholder .env.example to ignored .env.local. Keep only the project URL and public publishable/legacy anon key in browser-prefixed variables. Existing app expects NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY; keep names consistent or change all consumers together.

Local-only provisioning/proof variables:
- SUPABASE_SERVICE_ROLE_KEY, only if using admin automation.
- TEST_A_EMAIL, TEST_A_PASSWORD, TEST_B_EMAIL, TEST_B_PASSWORD.
- Optional TEST_EMPTY_EMAIL/PASSWORD.
- Expected test-project identifier and fixture reset flag.

These TEST_* names are proposed script configuration; they are not yet implemented. Do not imply the current script reads them. Admin provisioning can instead be done through Supabase dashboard, then seed through authenticated user clients. A service-role key is not needed by the running app.

Remove NEXT_PUBLIC_DEMO_PASSWORD. Never paste keys into chat, screenshots, README or recordings. Public project keys are designed for client use; elevated keys are not. [Supabase key types](https://supabase.com/docs/guides/getting-started/api-keys).

Add !.env.example after .env* in the task's ignore file. Verify the template is tracked and the real local file is ignored. Current template is ignored and not listed as tracked; that must be repaired.

## 3. Apply migrations correctly

For a new database, apply the corrected base migration and later migrations in order. For an already-provisioned database, use a new numbered migration for alterations. Do not call CREATE TABLE IF NOT EXISTS a schema-upgrade or rollback strategy.

The current view added mileage/body_type/notes before pre-existing columns. Upgrading an older view can require append-only column ordering or explicit dependent-object recreation in a transaction. Recheck grants, invoker settings and dependent RPCs after any replacement.

Verify deployed enums, fields, constraints, four indexes, two trigger functions, 10 base policies, invoker view and three analytics RPCs. Audit grants to anon/authenticated and function execute rights. Check actual schema, not only an RLS badge.

## 4. Auth setup

Provision confirmed A/B reviewer users and C empty test user. Use synthetic dealership records. If signup stays visible, match actual confirmation/callback configuration and test it; otherwise reviewer accounts make signup unnecessary. Disabling confirmation is a demo decision, not a requirement.

Set live Site URL and required callback redirect allowlist; password sign-in itself does not require an invented callback flow. Do not promise URL configuration alone fixes every auth loop.

## 5. Repair and run the seed

Before execution:
- Seed and proof use identical configured identities.
- Both A/B have vehicles and jobs; empty C has no business rows.
- Fixed fixture IDs/manifest and an explicit date anchor make expectations reproducible.
- Required parent lookups throw if missing; every API error is checked.
- Existing-user lookup handles pagination and does not mask unrelated create errors.
- Default rerun affects only owned fixture IDs, not all user rows.
- Explicit reset checks project/account IDs and clearly reports what will change.
- No passwords printed in logs.

Seed in the isolated project. Check counts and hand-calculated expectations from 02. Existing source seed has 10 A vehicles/10 jobs and 2 B vehicles/no jobs; current notes promising ~20 cars or 35 jobs are obsolete.

## 6. Local verification

Run lint, TypeScript and production build. Start app and test login → overview → edit vehicle → edit job → profile → sign out. Run corrected proof against disposable fixtures. Save redacted outputs with revision/date. A failed command or skipped mandatory test blocks its completion claim.

## 7. Repository preparation

Read-only inspection from the existing root:
```powershell
git -C 'D:/Projects/Alba Corp' status --short
git -C 'D:/Projects/Alba Corp' remote -v
git -C 'D:/Projects/Alba Corp' rev-parse --show-toplevel
git -C 'D:/Projects/Alba Corp' ls-files -- 02-dashboard/.env.example
git -C 'D:/Projects/Alba Corp/02-dashboard' check-ignore -v .env.local
```

Do not git init inside the task or blindly add the entire workspace. Review/stage intended Task 02 files and approved plan changes only. No force push or overwrite of other tasks. A separate repo is also allowed by the brief if intentionally chosen; this runbook assumes the current monorepo.

Review tracked files/history with a redacted secret scanner; a grep for every occurrence of “password” or “supabase.co” is not a valid secrets audit. If a real credential was exposed, rotate it first and then remove it from tracked artifacts/history as appropriate.

## 8. Vercel

Import the existing repository; Root Directory = 02-dashboard; use the lockfile and pinned runtime. Set only public project URL/key needed by runtime. No service-role or test-account password variable in the deployment.

Deploy, record deployment URL and source revision. Screenshot URL supplied by user: https://02-dashboard-fawn.vercel.app — candidate live URL, not an independently verified release.

## 9. Hosted reviewer path

Fresh browser: login, exact KPIs, complete chart cards, vehicle/job persistence, profile save, sign out. Repeat phone/keyboard checks. Verify realtime only if retained and secured.

README must stand alone: explain setup locally, include schema summary, services, actual tests/limitations and accessible links. Do not depend exclusively on private _notes that may not be in the published source.

Provide working credentials privately in submission notes/access attachment; README points to that delivery. Verify repository public OR shared, and Loom anyone-with-link access in a fresh browser.

## Recovery

| Failure | Recovery |
|---|---|
| Frontend regression | Promote known good Vercel deployment; check database compatibility |
| SQL migration failure | Inspect error and apply tested forward repair; do not blindly rerun base SQL |
| Damaged fixtures | Explicit scoped fixture reset in test project; no blanket production deletion |
| Exposed provisioned password/key | Rotate first, repair artifacts and verify access again |

Changing database state is not undone by rolling back a Vercel deployment. Submission remains the user's final action after link/evidence review.
