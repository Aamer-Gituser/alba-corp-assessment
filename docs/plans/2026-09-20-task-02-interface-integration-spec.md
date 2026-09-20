# Task 02 Interface Integration Specification

## Goal

Port the supplied Forecourt interface into `02-dashboard` while preserving the existing Next.js, Supabase, authentication, RLS, realtime, server analytics and CRUD implementation.

## Source of truth

- Visual source: `C:/Users/khana/Downloads/324ec7cb-7a9f-459c-ae75-a0fcd132fc45`
- Working application: `D:/Projects/Alba Corp/02-dashboard`
- Assessment brief: `Data Dashboard on a Backend Service`
- Existing data model and server actions remain authoritative. Static mock arrays must not ship in the working application.

## Architecture

Keep the Next.js App Router application and adapt the supplied presentation layer to it. Connect server-rendered pages to Supabase and retain server actions for mutations.

## Screen mapping

| Screen | Working route | Required behavior |
|---|---|---|
| Overview | `/` | Live Supabase KPIs, monthly margin, recon categories, vehicle volume, attention list |
| Inventory | `/inventory` | Real rows, URL status filters, responsive table, add vehicle |
| Vehicle detail | `/inventory/[id]` | Economics, recon jobs, edit/delete vehicle, complete/update/delete jobs |
| Analytics | `/analytics` | Server-computed analytics and meaningful comparisons |
| Profile | `/profile` | Real profile fields and avatar upload |
| Authentication | `/login` | Existing Supabase login/signup in the same visual language |

## Visual contract

Use the supplied tokens, light glass surfaces, ambient background, Forecourt mark, centered pill navigation, Geist and IBM Plex Mono typography, Lucide icons, KPI tiles, charts, data tables, status pills, dialogs and responsive mobile navigation. Preserve visible focus, semantic labels, 44px touch targets, reduced-motion behavior and horizontal table containment.

## Functional contract

- Every displayed value comes from Supabase or an explicit empty/error state.
- No `undefined`, `NaN`, stale mock totals or silent query failures.
- Vehicle and recon-job CRUD provides pending, success and actionable error feedback.
- Profile editing, avatar upload and sign-out remain functional.
- Realtime subscriptions refresh affected pages without leaking cross-user data.
- RLS and `security_invoker` analytics remain intact.

## Assessment release gate

The final submission must visibly prove full CRUD, at least two meaningful charts, responsive/loading/empty/error states, real related BaaS tables, auth, RLS isolation, realtime and server-computed analytics. README, schema, setup-from-zero, seed/demo access, `.env.example`, BUILD_LOG, verification evidence, live URL and Loom script must match the shipped UI and behavior. No real secret may be committed.

## Acceptance checks

- Compare every route against the supplied reference at desktop and 375px widths.
- Run TypeScript, lint and production build.
- Exercise login, filters, vehicle CRUD, recon CRUD, profile update/upload and sign-out.
- Verify two-tab realtime and the two-user RLS proof.
- Confirm README, BUILD_LOG and video script describe the final product accurately.
