# Forecourt — Used-Car Inventory & Margin Dashboard

**Live URL:** [https://02-dashboard-fawn.vercel.app](https://02-dashboard-fawn.vercel.app)
**Repo:** `02-dashboard/` folder in the monorepo

---

## What it is

Forecourt is an inventory and margin dashboard for a used-car dealership. A dealer buys a car at auction, spends money reconditioning it, then lists it for sale. The real margin shifts at every step — and spreadsheets lose track of it.

Three questions it answers:

1. **What capital is tied up?** — KPI tiles: capital deployed, recon spend, realised margin, avg days in stock.
2. **What is preparation costing me?** — Cost-stack bar per vehicle, recon-by-category chart, and per-job breakdown.
3. **Did sold cars earn what I thought?** — Margin-by-month chart, analytics page with top performers and slowest movers.

---

## Backend choice — why Supabase

Supabase (Postgres + Auth + RLS + Realtime + Storage) was the brief's recommended pick and the strongest choice for demonstrating security: the protection model is plain SQL policies I can show, test with a script that attacks them, and show the refusal. Convex gives realtime more easily but its data layer is proprietary — "trust the config" rather than "here is the predicate and here is the proof."

---

## Data model

### Tables

#### `vehicles`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `owner_id` | `uuid` FK → `auth.users` | RLS key |
| `make` | `text` | |
| `model` | `text` | |
| `year` | `smallint` | |
| `body_type` | `text` | |
| `mileage_km` | `integer` | |
| `acquisition_price` | `numeric(12,2)` | |
| `asking_price` | `numeric(12,2)` | nullable |
| `sold_price` | `numeric(12,2)` | nullable |
| `acquired_on` | `date` | |
| `sold_on` | `date` | nullable |
| `status` | `vehicle_status` enum | `sourcing / reconditioning / listed / sold` |
| `notes` | `text` | nullable |
| CHECK | — | `sold_fields_consistent`: `status='sold'` requires both `sold_price` and `sold_on` |

#### `reconditioning_jobs`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `vehicle_id` | `uuid` FK → `vehicles(id)` ON DELETE CASCADE | |
| `category` | `recon_category` enum | `mechanical / bodywork / detailing / tyres / electrical / paperwork` |
| `description` | `text` | |
| `cost` | `numeric(10,2)` | |
| `performed_on` | `date` | |
| `completed` | `boolean` | default `false` |

#### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK FK → `auth.users` | |
| `dealership_name` | `text` | nullable |
| `avatar_url` | `text` | nullable — Supabase Storage public URL |

### View — `vehicle_economics`
Joins `vehicles` + aggregated `reconditioning_jobs` and computes:
- `cost_basis` = acquisition + recon total
- `projected_margin` = asking_price − cost_basis
- `realised_margin` = sold_price − cost_basis
- `days_in_stock` = CURRENT_DATE − acquired_on (or sold_on if sold)
- `recon_total`, `recon_count`

**Critical:** created with `security_invoker = true`. A view without this runs as its creator and bypasses RLS, leaking every dealership's data. With `security_invoker = true` it runs as the caller, so the underlying table policies still apply.

### RPCs (server-computed analytics)
| Function | Returns | Used by |
|---|---|---|
| `dashboard_stats()` | single KPI row | Overview page |
| `monthly_performance(months_back)` | one row per month: bought/sold counts, margin | Overview + Analytics charts |
| `recon_by_category()` | one row per category: count, total cost | Overview + Analytics charts |

No raw rows are sent to the browser for analytics — only aggregated results from these functions.

---

## Advanced features

| Feature | Implementation |
|---|---|
| **Auth + RLS + security_invoker** | Every table has RLS enabled. `vehicle_economics` view uses `security_invoker = true`. Signup trigger is `SECURITY DEFINER` only for writing the profile row, pinned with `search_path = ''`. Verified by `npm run verify:rls` (10 automated breach attempts, all PASS). |
| **Server-computed analytics** | 3 RPCs: `dashboard_stats`, `monthly_performance`, `recon_by_category`. The app never fetches raw rows for charts — only aggregated results. |
| **Real-time updates** | `realtime-refresh.tsx` subscribes to `postgres_changes` on `vehicles` and `reconditioning_jobs`. Any insert/update/delete calls `router.refresh()`, re-rendering the server component. Live/Offline dot in the header shows socket state. |
| **File storage** | Dealership avatar/logo upload from the Profile page. Files go to the `avatars` Supabase Storage bucket. `uploadAvatar` Server Action validates type (JPEG/PNG/WebP) and size (≤ 2 MB), upserts to `{owner_id}/avatar`, then writes the public URL to `profiles.avatar_url`. |

### RLS verification output

```
Forecourt RLS verification

Results
──────────────────────────────────────────────────────────────────────
   1  ✅ PASS  SELECT vehicles shows only own rows
   2  ✅ PASS  SELECT B car by id → 0 rows
   3  ✅ PASS  UPDATE B car → 0 rows affected
   4  ✅ PASS  DELETE B car → 0 rows affected
   5  ✅ PASS  INSERT with owner_id=B → rejected
         new row violates row-level security policy for table "vehicles"
   6  ✅ PASS  SELECT recon_jobs shows only own rows
   7  ✅ PASS  vehicle_economics view respects RLS (security_invoker)
   8  ✅ PASS  dashboard_stats returns data for own rows (fleet_count=5)
   9  ✅ PASS  UPDATE recon vehicle_id to B car → n/a (no B jobs)
  10  ✅ PASS  B's recon_total unchanged after A's attack attempts
──────────────────────────────────────────────────────────────────────
All 10 tests passed. RLS boundary is sound.
```

---

## Setup from zero

### 1. Supabase project
1. supabase.com → New project → name `forecourt`, save the database password
2. Settings → API → copy Project URL, anon key, service_role key
3. Authentication → Providers → Email → turn **off** "Confirm email" (demo convenience)

### 2. Schema
SQL Editor → New query → paste `supabase/migrations/0001_init.sql` → Run.

Idempotent — safe to run more than once. Verify: Table Editor shows `vehicles`, `reconditioning_jobs`, `profiles` each with the green **RLS enabled** badge.

### 3. Storage bucket
Storage → New bucket → name `avatars` → Public bucket → Create.

### 4. Environment
```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase Settings → API
# fill SUPABASE_SERVICE_ROLE_KEY for the seed script only — never put this on Vercel
```

### 5. Install and seed
```bash
npm install
npm run seed
```

Creates two dealerships with seeded vehicles and recon jobs:

| Dealership | Email | Password |
|---|---|---|
| Marina Motors (A) | `appflow.qa01@gmail.com` | `forecourt-demo` |
| Rashid Auto (B) | `appflow.qa02@gmail.com` | `forecourt-demo` |

Sign up with your own email also works — email confirmation is disabled.

### 6. Run locally
```bash
npm run dev   # http://localhost:3000
```

### 7. Prove the security boundary
```bash
npm run verify:rls
```
All 10 tests must PASS. Test 7 is the one that would fail if `security_invoker` were missing from the view.

### 8. Deploy to Vercel
1. Vercel → Add New → Project → import this repo
2. Root Directory → `02-dashboard`
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` **only**
4. Never add `SUPABASE_SERVICE_ROLE_KEY` to Vercel — it is for the seed script only
5. After first deploy: Supabase → Authentication → URL Configuration → set Site URL to your Vercel URL

---

## Architecture

```
Browser
  ├── Server Components (reads)
  │     ├── /                     overview: KPI tiles, 3 charts, needs-attention list
  │     ├── /inventory            vehicle list, status pills, date range filter, search
  │     ├── /inventory/[id]       vehicle detail: cost-stack bar + recon job list
  │     ├── /analytics            analytics KPIs, 3 charts, top performers, slowest movers
  │     └── /profile              account settings + avatar upload
  ├── Server Actions (writes)
  │     ├── createVehicle, updateVehicle, deleteVehicle
  │     ├── createReconJob, toggleReconJob, deleteReconJob
  │     ├── uploadAvatar          → Supabase Storage avatars bucket
  │     └── updateProfile, updatePassword
  └── Client Components
        ├── AddVehicleDialog, EditVehicleDialog, DeleteVehicleButton
        ├── AddReconDialog, ReconJobRow (toggle + delete)
        ├── RealtimeRefresh       → postgres_changes subscription
        ├── KpiGrid               → liquid-glass toggle UI state
        └── BackButton            → usePathname, hidden on /

Supabase
  ├── Auth                        email/password, cookie-based SSR session
  ├── Postgres
  │     ├── vehicles              RLS: SELECT/INSERT/UPDATE/DELETE by owner_id
  │     ├── reconditioning_jobs   RLS: via EXISTS check on parent vehicle
  │     ├── profiles              RLS: owner only
  │     ├── vehicle_economics     VIEW, security_invoker = true
  │     └── RPCs: dashboard_stats, monthly_performance, recon_by_category
  ├── Realtime                    postgres_changes filtered by RLS
  └── Storage                     avatars bucket, public URLs
```

**Client/server split:** reads in Server Components (auth cookie attached automatically), writes in Server Actions (same). The only client-side Supabase code is the Realtime WebSocket in `realtime-refresh.tsx`. The `service_role` key is never imported by the app.

---

## File layout

```
02-dashboard/
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── page.tsx              overview: KPIs + charts + attention section
│   │   │   ├── layout.tsx            app shell: header, nav, sign-out, back button
│   │   │   ├── loading.tsx           skeleton loader
│   │   │   ├── error.tsx             error boundary
│   │   │   ├── actions.ts            all Server Actions (CRUD + avatar upload)
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx          list: search, status filter, date range filter
│   │   │   │   └── [id]/page.tsx     detail: cost-stack, recon jobs, notes
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx          KPI tiles, 3 charts, top/slowest tables
│   │   │   └── profile/
│   │   │       ├── page.tsx          account settings shell
│   │   │       ├── avatar-upload.tsx file storage upload component
│   │   │       ├── profile-form.tsx  dealership name edit
│   │   │       └── password-form.tsx password change
│   │   ├── login/
│   │   │   ├── page.tsx              sign-in / sign-up / forgot-password tabs
│   │   │   └── actions.ts            signIn, signUp, signOut, forgotPassword
│   │   ├── globals.css               design tokens (Tailwind v4 @theme), animations
│   │   └── layout.tsx                root layout, fonts (Geist + IBM Plex Mono)
│   ├── components/
│   │   ├── charts.tsx                Recharts: MarginByMonth, ReconSpend, VolumeByMonth
│   │   │                             (gradients, glow, custom tooltips, time-span filter,
│   │   │                              collapsible data table per chart)
│   │   ├── cost-stack.tsx            horizontal bar showing acquisition/recon/margin
│   │   ├── kpi-grid.tsx              client wrapper with liquid-glass toggle
│   │   ├── back-button.tsx           hidden on /, shows on all inner pages
│   │   ├── nav-link.tsx              active-state nav link
│   │   ├── realtime-refresh.tsx      Supabase Realtime subscription + Live dot
│   │   ├── vehicle-form.tsx          add/edit/delete vehicle dialogs (Server Actions)
│   │   └── recon-form.tsx            add/toggle/delete recon job forms
│   ├── lib/
│   │   ├── format.ts                 money (AED), moneyCompact, km, shortDate, stockNumber
│   │   ├── form-state.ts             shared FormState type + EMPTY_FORM_STATE
│   │   └── supabase/
│   │       ├── client.ts             browser client (Realtime only)
│   │       ├── server.ts             SSR client (reads + Server Actions)
│   │       └── types.ts              TypeScript types for all DB entities
│   └── proxy.ts                      session refresh + auth redirect (Next.js 16 proxy)
├── scripts/
│   ├── seed.ts                       npm run seed — creates 2 dealerships + sample data
│   ├── verify-rls.ts                 npm run verify:rls — 10 automated RLS breach tests
│   ├── setup-avatars.ts              one-off: creates avatars storage bucket
│   └── add-profile-cols.ts           one-off: backfill migration helper
├── supabase/migrations/
│   ├── 0001_init.sql                 full schema: tables, RLS, view, RPCs, trigger
│   └── 0002_profile_fields.sql       adds avatar_url + extra profile columns
├── .env.example
├── BUILD_LOG.md
└── README.md
```

---

## Schema notes

- `sold_fields_consistent` CHECK constraint: `status = 'sold'` requires both `sold_price` and `sold_on`. Server Actions mirror this with Zod so users get a readable error instead of a Postgres exception.
- `vehicle_economics` view has no `SECURITY DEFINER`. The only `SECURITY DEFINER` object is the `handle_new_user` trigger function (it needs elevated privileges to write a `profiles` row before the new user has a session). It is pinned with `search_path = ''`.
- `monthly_performance()` aggregates bought and sold separately via CTEs before joining to the month series. A direct double-join would produce N×M rows when N cars bought and M cars sold in one month, inflating every count and sum.

---

## Known limitations

- **No pagination** — inventory list loads all rows; fine at demo scale, needs cursor pagination beyond ~200.
- **Single-user per dealership** — one user = one dealership. A production system needs a `dealerships` table, staff roles, and invite flows.
- **No receipt/invoice storage per recon job** — avatar upload is the file storage demo; attaching photos to individual recon jobs is not implemented.
- **Realtime uses full-page refresh** — `router.refresh()` re-renders the whole server component tree instead of surgical cache invalidation. Correct and simple; at high write rates a local optimistic update would be better.
- **Email confirmation disabled** for demo convenience.
