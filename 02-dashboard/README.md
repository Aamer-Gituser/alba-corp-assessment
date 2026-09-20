# Forecourt — Used-Car Inventory Dashboard

Task 02 of the Alba Corp Vibe Coder assessment.

**Live URL:** *(to be added after Vercel deploy)*

---

## What it is

Forecourt is an inventory and margin dashboard for a used-car dealer. A dealer buys a car at auction, spends money preparing it (reconditioning), then lists it for sale. Between those steps the real margin moves — and most spreadsheets lose track of it.

Forecourt answers three questions:
1. **What capital do I have tied up?** KPI tiles: capital deployed, recon spend, realised margin, avg days in stock.
2. **What is preparation actually costing me?** Cost-stack bar and category chart.
3. **Did the cars I sold earn what I thought they earned?** Margin-by-month chart and per-car economics.

---

## Architecture

```
Browser
  ├── Server Components (reads)      ← Supabase DB via SSR client + cookie auth
  │     ├── /                         ← overview: KPI tiles + 3 charts + needs-attention
  │     ├── /inventory                ← vehicle list with status filter
  │     └── /inventory/[id]           ← vehicle detail: cost-stack + recon jobs
  ├── Server Actions (writes)         ← createVehicle, updateVehicle, deleteVehicle,
  │                                      createReconJob, toggleReconJob, deleteReconJob
  └── Client Components               ← <AddVehicleDialog>, <ReconJobRow>, <RealtimeRefresh>
                                         (forms + Supabase Realtime socket only)

Supabase (Postgres)
  ├── vehicles                        ← main table, RLS: owner sees own rows only
  ├── reconditioning_jobs             ← one-to-many, cascade delete, RLS same
  ├── profiles                        ← dealership name, created by signup trigger
  ├── vehicle_economics (view)        ← computed margins, security_invoker = on ← KEY
  └── RPCs: dashboard_stats()         ← KPI row
            monthly_performance()     ← chart data (6 months)
            recon_by_category()       ← category chart data
```

**Why `security_invoker = on` on the view matters:** a Postgres view normally runs with the privileges of whoever created it, which would bypass RLS completely and expose every dealership's data through this one object. `security_invoker = on` makes the view execute as the *caller*, so the underlying table policies still apply. This is verified by `npm run verify:rls` row 7.

**Why Supabase over Convex/Appwrite:** the security model is plain Postgres. I can show the policy, run a script that attacks it, and show the refusal. Convex gives realtime more cheaply but the data layer is proprietary — "trust the config" instead of "here's the predicate".

**Client/server split:** reads happen in Server Components (auth cookie attached automatically); writes happen in Server Actions (same). The only client-side Supabase code is the Realtime WebSocket. The `service_role` key is used only by the seed script and never referenced in the app.

---

## Advanced features implemented

| Feature | Where to see it |
|---|---|
| **Secure, isolated data** (RLS + `security_invoker`) | `0001_init.sql` §5 + §7; `npm run verify:rls` output below |
| **Server-computed analytics** (3 RPCs, no raw rows to browser) | `0001_init.sql` §8; `src/app/(app)/page.tsx` |
| **Real-time updates** (Realtime + RLS on the socket) | `src/components/realtime-refresh.tsx`; Live/Offline indicator in header |

---

## Setup from zero

### 1. Supabase project
1. supabase.com → New project → name `forecourt`, save the database password
2. Settings → API → copy Project URL, anon key, service_role key

### 2. Schema
SQL Editor → New query → paste `supabase/migrations/0001_init.sql` → Run.

Verify: Table Editor shows three tables, each with the green **RLS enabled** badge.

Auth settings: Authentication → Providers → Email → turn **off** "Confirm email" (demo convenience).

### 3. Environment
```bash
cp .env.example .env.local
# fill in the three values
```

### 4. Seed demo data
```bash
npm install
npm run seed
```
This creates two dealerships:

| Dealership | Email | Password |
|---|---|---|
| Marina Motors (A) | `appflow.qa01@gmail.com` | `forecourt-demo` |
| Rashid Auto (B) | `appflow.qa02@gmail.com` | `forecourt-demo` |

**Or create your own account:** Click "CREATE ACCOUNT" tab and sign up with your email. Email confirmation is disabled, so sign-up is instant (no verification link needed).

### 5. Run locally
```bash
npm run dev   # http://localhost:3000
```

### 6. Prove the security boundary
```bash
npm run verify:rls
```
All 10 tests should PASS. Row 7 (`vehicle_economics` view) is the one that proves `security_invoker` is working.

**`verify:rls` output:**

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

### 7. Deploy to Vercel
See `_notes/02-dashboard/06-DEPLOYMENT-RUNBOOK.md` for the full 11-step runbook.

Short version:
1. Vercel → Add New → Project → import `alba-corp-assessment`
2. Root Directory → `02-dashboard`
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` only (never put `SUPABASE_SERVICE_ROLE_KEY` on Vercel)
4. Supabase → Authentication → URL Configuration → set Site URL to the Vercel URL

---

## How I tested it

- Manual test matrix: 29 cases (auth, CRUD, analytics, realtime, UI states) — see `_notes/02-dashboard/05-VERIFICATION-PLAN.md`
- `npm run verify:rls`: 10 automated RLS breach attempts; all should PASS
- `npx tsc --noEmit`: zero errors
- `npm run build`: must succeed before deploy
- Lighthouse accessibility ≥ 95 (target)
- Two-tab demo for realtime feature
- Two-user demo (A + B) to prove data isolation

---

## API quirks / schema notes

- The `sold_fields_consistent` CHECK constraint enforces that a vehicle cannot have `status = 'sold'` without both a `sold_price` and a `sold_on`. The Server Actions mirror this check in Zod so the user gets a readable message instead of a Postgres error.
- `vehicle_economics` is a `SECURITY DEFINER`-free view (see above). The only `SECURITY DEFINER` function is the signup trigger (`handle_new_user`), which needs elevated privileges to write a profile row before the new user has a session. It is pinned with `search_path = ''`.
- The `monthly_performance()` RPC aggregates bought and sold vehicles separately (CTEs) before joining to the month series. This prevents a fan-out multiplication bug where N bought × M sold in one month would produce N×M rows with inflated counts.

---

## Known limitations

- **No pagination.** The inventory list loads all rows. Fine at 20–30 cars; would need cursor pagination around a few hundred.
- **Single-user dealership.** One user = one dealership. A real deployment would need a `dealerships` table, staff roles, and invite flows.
- **No receipt storage.** File storage (the fourth advanced option) was cut deliberately to protect the time-box against three features I did build.
- **Realtime scope.** Realtime calls `router.refresh()` on any change — this re-renders the whole page rather than doing surgical updates. Fine for this scale; at high write rates a local optimistic cache would be better.
- **Email confirmation disabled** for demo convenience. Note this in the form.

---

## File layout

```
02-dashboard/
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── page.tsx          ← overview
│   │   │   ├── layout.tsx        ← app shell (header, nav)
│   │   │   ├── loading.tsx       ← skeleton
│   │   │   ├── error.tsx         ← error boundary
│   │   │   ├── actions.ts        ← Server Actions (CRUD)
│   │   │   └── inventory/
│   │   │       ├── page.tsx      ← inventory list
│   │   │       └── [id]/
│   │   │           └── page.tsx  ← vehicle detail
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   ├── globals.css           ← design tokens (Tailwind v4 @theme)
│   │   └── layout.tsx            ← root layout + fonts
│   ├── components/
│   │   ├── charts.tsx            ← Recharts with table-twin accessibility
│   │   ├── cost-stack.tsx        ← signature element
│   │   ├── nav-link.tsx
│   │   ├── realtime-refresh.tsx
│   │   ├── vehicle-form.tsx      ← add/edit/delete dialogs
│   │   └── recon-form.tsx        ← add/delete/toggle recon jobs
│   ├── lib/
│   │   ├── format.ts             ← AED formatting, km, dates
│   │   └── supabase/
│   │       ├── client.ts         ← browser client (realtime only)
│   │       ├── server.ts         ← SSR client (reads + Server Actions)
│   │       └── types.ts          ← TypeScript types
│   └── middleware.ts             ← session refresh + redirect
├── scripts/
│   ├── seed.ts                   ← npm run seed
│   └── verify-rls.ts             ← npm run verify:rls
├── supabase/migrations/
│   └── 0001_init.sql             ← full schema (idempotent)
├── .env.example
├── BUILD_LOG.md
└── README.md
```
