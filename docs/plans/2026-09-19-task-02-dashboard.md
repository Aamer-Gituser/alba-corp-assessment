# Task 02 — Forecourt: current repair and completion plan

Updated 2026-09-20 after reviewing the current source and nine supplied screenshots. This replaces the earlier enquiries-based plan. The implemented entities are vehicles and reconditioning jobs. Task 01 and Task 03 are outside this review.

**Status: review/planning complete; application fixes not applied by this review. Not submission-ready.**

## Authoritative package

Start with [source/screenshot findings](../../_notes/02-dashboard/08-REVIEW-FINDINGS.md), then [master plan](../../_notes/02-dashboard/00-MASTER-PLAN.md). Detailed contracts: [data model](../../_notes/02-dashboard/02-DATA-MODEL.md), [architecture/login/profile](../../_notes/02-dashboard/03-ARCHITECTURE.md), [UI/UX](../../_notes/02-dashboard/04-DESIGN-SPEC.md).

Use [requirements](../../_notes/02-dashboard/01-REQUIREMENTS-MATRIX.md), [verification](../../_notes/02-dashboard/05-VERIFICATION-PLAN.md), [deployment](../../_notes/02-dashboard/06-DEPLOYMENT-RUNBOOK.md), [video/interview](../../_notes/02-dashboard/07-VIDEO-AND-INTERVIEW.md) and [execution/evidence](../../_notes/02-dashboard/09-EXECUTION-AND-EVIDENCE.md).

## Keep

Next.js App Router, Supabase Auth/Postgres, user-scoped Server Components/Actions, vehicle/job relationship, security-invoker analytics, existing catalogue visual identity and meaningful chart/table alternatives. Current monthly separate-CTE aggregation and recon UPDATE parent check are source fixes already present; verify their deployed versions rather than re-report them as missing.

## Repair in dependency order

1. **Data and visible regressions:** unwrap/validate the one-row stats RPC; surface read errors; group each chart/table into a panel; center/bound dialogs and reset form state on reopen.
2. **Trustworthy proof and access:** align seed/proof identities; add B job fixtures; exact affected-row checks, pre/post snapshots and legitimate-operation positive controls; remove credentials from source/public variables; track the environment template.
3. **Complete CRUD:** full recon edit, strict decimal/date parsing, errors/pending for delete/toggle, zero-row handling, correct invalidation of overview/list/detail.
4. **Requested account workflow:** own display/dealership-name settings, read-only email, save/cancel/errors and immediate header update. Repair login mode/session/error behavior.
5. **UX details:** deduplicate economics, explicit asking/sold price, honest zero/unknown/loss states, attention predicate before limit, mobile/keyboard and reduced-motion behavior. Search/sort/counts only if the clock permits.
6. **Final evidence and delivery:** lint/types/build, isolated security/analytics checks, hosted CRUD and reviewer access, standalone docs, truthful short video.

Do not grow scope into teams, uploads, CRM or a new UI framework. Realtime is conditional: prove event isolation including delete/reconnect or remove the subscription/publication exposure and the advanced-feature claim. Auth + RLS + server analytics is already the recommended advanced combination.

## Current audit results

- TypeScript passed locally.
- Lint failed with 2 errors and 16 warnings.
- Build compiled then failed at TypeScript worker spawn with EPERM in this environment; full production build remains unverified.
- Existing security output is not sufficient evidence: proof has false-positive paths and mismatched accounts.
- User screenshots confirm rendered pages and visible defects; fresh authenticated runtime/mobile/security checks were not run here.

## Clock

The brief's 2–4 hours applies to the whole task, including earlier work. Prior actual time/deadline are unconfirmed. The old 4h25 plan and a new repair budget cannot both be treated as within four hours. Reconcile the actual ledger before resuming; stop/disclose if overrun. Post-assessment portfolio work must be distinguished from the submitted version.

## Completion gate

Every mandatory requirement has actual evidence for the final revision; no P0/core failure is hidden; profile workflow is verified if included; setup and reviewer credentials work; selected advanced options match reality. After development the strict pass follows the verification document. Record video and prepare interview answers from the shipped implementation, not from planned features.
