# Task 02 Interface Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the supplied Forecourt UI as the fully working Task 02 Next.js and Supabase assessment submission.

**Architecture:** Retain Next.js App Router, Supabase server queries/actions and RLS. Port the supplied design system and compose it around real server data, using client components only for navigation, dialogs, charts, form state and realtime refresh.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase SSR, Recharts, Lucide, Zod.

**Spec:** `docs/plans/2026-09-20-task-02-interface-integration-spec.md`

## Global Constraints

- All shipped application code stays inside `02-dashboard`.
- Static mock data must not become a runtime data source.
- Preserve auth, RLS, realtime and server analytics.
- Never commit real secrets or service-role credentials.
- Assessment evidence must correspond to behavior that can actually be reproduced.

---

### Task 1: Design foundation and application shell

**Files:** Modify `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(app)/layout.tsx`; create focused navigation/shell components under `src/components`.

- [ ] Port semantic design tokens, utilities, typography and motion rules.
- [ ] Adapt ForecourtShell to Next.js links, pathname state, real profile data and server sign-out.
- [ ] Verify keyboard focus, mobile navigation and reduced motion.

### Task 2: Shared UI and mutation feedback

**Files:** Modify `src/components/vehicle-form.tsx`, `src/components/recon-form.tsx`, `src/components/cost-stack.tsx`; create only required primitives.

- [ ] Apply supplied dialog, field, button, status and economics visuals.
- [ ] Preserve server-action validation and expose pending, success and error states.
- [ ] Verify create/update/delete flows with invalid and valid values.

### Task 3: Real-data overview and analytics

**Files:** Modify `src/app/(app)/page.tsx`, chart components; create `src/app/(app)/analytics/page.tsx` and focused chart clients as required.

- [ ] Normalize Supabase RPC return shapes and render explicit failures.
- [ ] Connect supplied KPI, margin, recon, volume and attention visuals to server data.
- [ ] Add the Analytics route using backend-computed datasets.
- [ ] Verify all zero-data and populated-data states contain no `NaN` or mock totals.

### Task 4: Inventory and vehicle detail

**Files:** Modify `src/app/(app)/inventory/page.tsx` and `src/app/(app)/inventory/[id]/page.tsx`.

- [ ] Port the supplied inventory filters/table with real counts and responsive containment.
- [ ] Port the detail economics and recon-job presentation.
- [ ] Verify deep links, not-found behavior and all mutations.

### Task 5: Profile and authentication

**Files:** Modify profile and login pages/components.

- [ ] Port the supplied dealer profile presentation to real profile fields and avatar storage.
- [ ] Restyle login/signup to the same design system.
- [ ] Verify session protection, profile update/upload and sign-out.

### Task 6: Assessment evidence and release verification

**Files:** Modify `02-dashboard/README.md`, `02-dashboard/BUILD_LOG.md`, assessment planning/evidence documents and Loom script.

- [ ] Run TypeScript, lint and production build; fix all introduced failures.
- [ ] Run browser checks at desktop and 375px including CRUD and error/empty/loading states.
- [ ] Run or document reproducible realtime and two-user RLS verification with truthful results.
- [ ] Reconcile README, schema/setup, seed/demo path, BUILD_LOG, deployment checklist and Loom narration with the shipped application.
