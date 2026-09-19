# Task 02 — Forecourt: Data Dashboard on a Backend Service — Implementation Plan

> **Status: AWAITING APPROVAL.** Nothing gets built until this document is approved.

**Goal:** Ship a dealership inventory and enquiry dashboard on Supabase where each dealer sees only their own stock, all aggregation happens in Postgres rather than the browser, and the security boundary is provably enforced.

**Architecture:** Next.js App Router talking to Supabase Postgres. Authentication via Supabase Auth with cookie-based sessions. Every table carries `owner_id` and is protected by Row-Level Security, so isolation is enforced by the database rather than by application code. Dashboard KPIs come from a Postgres view that inherits RLS through `security_invoker`. Live changes arrive over a Supabase Realtime subscription.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · `@supabase/supabase-js` · `@supabase/ssr` · Recharts · Supabase (Postgres + Auth + Realtime) · deployed on Vercel.

**Why this topic:** The brief asks for "a topic with naturally structured, multi-entity data" and lists inventory manager as an option. A used-car forecourt is the clearest case of it: vehicles and the enquiries against them are a real one-to-many, and the metrics that matter to a dealer (days on lot, gross margin, sell-through) are genuine KPIs rather than invented chart fodder. It is also the business Alba Corp is in, which made the domain rules easy to reason about.

---

## Assessment Requirement Mapping

| # | Brief requirement | Where it is satisfied | Task |
|---|---|---|---|
| 1 | Full CRUD with optimistic / clearly-handled feedback | Vehicles + enquiries, Server Actions with pending and error states | 6, 7 |
| 2 | ≥2 meaningful visualisations | Stock composition by status · 12-month margin and units sold · days-on-lot distribution | 8 |
| 3 | Beautiful, fluid UI — transitions, empty and loading states, responsive | Shared shell, skeletons, empty states per surface | 5, 6, 8 |
| 4 | Backend doing real work | Postgres tables, FK relationship, RLS policies, an aggregate view, Realtime | 2, 3, 9 |
| 5 | Docs including the full data model | Schema tables, ER diagram, policies, view definition, setup from zero | 11 |

| Advanced option | Chosen | Where |
|---|---|---|
| **Secure, isolated data (auth + RLS)** | ✅ baseline + proof | Tasks 3, 10 |
| **Server-computed analytics** | ✅ | Task 9 — `dealer_stats` view with `security_invoker` |
| **Real-time updates** | ✅ | Task 9 — postgres_changes subscription |
| **File storage** | ✅ | Task 9b — private bucket, per-dealer folder policy, signed-URL previews |

> The brief says the strongest submissions do "auth plus RLS plus one more, and explain how they checked the security boundary actually holds." This plan claims **all four** advanced options, and Task 10 exists solely to prove the boundary with an automated 8-check script.

---

## Global Constraints

- **No real secrets in the repository.** `.env.local` gitignored. `.env.example` holds placeholders only.
- **The service-role key never leaves the server** and is used only by the seed script. It is never imported into any component.
- **RLS is enabled on every table before any data is inserted.** A table with RLS off is a data leak, not a TODO.
- **Every aggregate runs in Postgres, not the browser.** If a number can be computed by the database, it is.
- **Test credentials must be in the README** so a reviewer can log in with zero setup (brief: "A way in").
- **Time-box: 2–4 hours.** This is the heaviest of the three tasks; budget toward 4.
- **`npm run build` and `npm run lint` pass clean before deploy.**
- **BUILD_LOG.md appended at every task boundary**, not written at the end.

---

## Data Model

### Entity relationship

```
auth.users (Supabase-managed)
    │
    │ 1:1
    ▼
profiles ───────────────┐
  id (PK, FK→auth.users)│
  dealership_name       │
  created_at            │
                        │ 1:N (owner_id)
                        ▼
                    vehicles
                      id (PK)
                      owner_id (FK→auth.users)
                      make, model, year, vin
                      mileage_km
                      acquired_price, asking_price
                      status: in_stock | reserved | sold
                      acquired_on, sold_on, sold_price
                      created_at, updated_at
                        │
                        ├── 1:N (vehicle_id, ON DELETE CASCADE) ──▶ vehicle_photos
                        │                                            id (PK), vehicle_id, owner_id
                        │                                            path (unique) → Storage object
                        │                                            is_cover, created_at
                        │
                        │ 1:N (vehicle_id, ON DELETE CASCADE)
                        ▼
                    enquiries
                      id (PK)
                      vehicle_id (FK→vehicles)
                      owner_id (FK→auth.users)
                      contact_name, contact_email
                      offer_amount
                      stage: new | contacted | test_drive | negotiating | won | lost
                      created_at
```

### Why `owner_id` is duplicated onto `enquiries`

An enquiry's owner could be derived by joining through `vehicles`. It is stored directly instead so the RLS policy on `enquiries` is a single index-backed comparison rather than a subquery per row. This is a deliberate denormalisation for policy performance, and it is kept honest by a trigger that copies the parent vehicle's owner on insert.

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/0001_schema.sql` | Tables, enums, indexes, trigger |
| `supabase/migrations/0002_rls.sql` | RLS enablement and all policies |
| `supabase/migrations/0003_analytics.sql` | `dealer_stats` and `monthly_performance` views |
| `scripts/seed.ts` | Creates two demo dealers and their data |
| `src/lib/supabase/client.ts` | Browser client (anon key only) |
| `src/lib/supabase/server.ts` | Server client, cookie-bound |
| `src/lib/supabase/admin.ts` | Service-role client, seed script only |
| `src/lib/types.ts` | `Vehicle`, `Enquiry`, `DealerStats`, enums |
| `src/lib/format.ts` | Currency, date, and KPI formatting |
| `src/app/(auth)/login/page.tsx` | Sign in / sign up |
| `src/app/(dash)/layout.tsx` | Authenticated shell, nav, sign out |
| `src/app/(dash)/page.tsx` | Overview: KPI row + charts |
| `src/app/(dash)/inventory/page.tsx` | Vehicle list + CRUD |
| `src/app/(dash)/vehicles/[id]/page.tsx` | Vehicle detail + its enquiries |
| `src/app/actions/vehicles.ts` | Server Actions: create, update, delete |
| `src/app/actions/enquiries.ts` | Server Actions: create, advance stage, delete |
| `src/components/kpi-row.tsx` | Server-computed KPI tiles |
| `src/components/charts/*.tsx` | Recharts visualisations |
| `src/components/vehicle-form.tsx` | Create/edit form with pending + error state |
| `src/components/realtime-refresher.tsx` | Subscription that revalidates on change |
| `src/proxy.ts` | Session refresh + route protection (Next 16 name; was `middleware.ts`) |
| `supabase/migrations/0004_storage.sql` | `vehicle-photos` bucket, size/type limits, per-dealer folder policies |
| `scripts/verify-rls.ts` | Automated 8-check proof of the security boundary |
| `src/components/photo-uploader.tsx` | Upload with preview, progress and error state |
| `src/components/photo-gallery.tsx` | Signed-URL gallery for a vehicle |
| `src/app/actions/photos.ts` | Server Actions: record upload, delete photo |
| `.env.example` · `README.md` · `BUILD_LOG.md` | Docs |

---

## Task 1: Supabase project and local wiring

- [ ] **Step 1: Create the Supabase project**

supabase.com → New project. Region closest to you. Save the database password.

- [ ] **Step 2: Collect the three values**

Project Settings → API:
- Project URL
- `anon` public key
- `service_role` secret key

- [ ] **Step 3: Scaffold the app**

```bash
cd "D:/Projects/Alba Corp"
npx create-next-app@latest 02-dashboard --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git --use-npm --turbopack
cd 02-dashboard
npm install @supabase/supabase-js @supabase/ssr recharts
npm install -D tsx
```

- [ ] **Step 4: Write `.env.example`**

```bash
# Supabase — https://supabase.com/dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Server-only. Bypasses RLS. Used by scripts/seed.ts and nothing else.
# Never expose this to the browser and never commit the real value.
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

- [ ] **Step 5: Create `.env.local` with the real values and confirm it is ignored**

Run: `git check-ignore -v 02-dashboard/.env.local`
Expected: a line showing the matching `.gitignore` rule. If it prints nothing, stop and fix `.gitignore`.

- [ ] **Step 6: Commit**

```bash
git add 02-dashboard/ -- ':!02-dashboard/.env.local'
git commit -m "chore(02-dashboard): scaffold Next.js app with Supabase dependencies"
```

---

## Task 2: Schema migration

**Files:** Create `supabase/migrations/0001_schema.sql`

- [ ] **Step 1: Write the schema**

```sql
-- Enums keep status values honest at the database level rather than in app code.
create type vehicle_status as enum ('in_stock', 'reserved', 'sold');
create type enquiry_stage as enum ('new', 'contacted', 'test_drive', 'negotiating', 'won', 'lost');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  dealership_name text not null,
  created_at timestamptz not null default now()
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  make text not null,
  model text not null,
  year int not null check (year between 1950 and 2100),
  vin text,
  mileage_km int not null default 0 check (mileage_km >= 0),
  acquired_price numeric(12,2) not null check (acquired_price >= 0),
  asking_price numeric(12,2) not null check (asking_price >= 0),
  status vehicle_status not null default 'in_stock',
  acquired_on date not null default current_date,
  sold_on date,
  sold_price numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A sold vehicle must carry its sale facts; an unsold one must not.
  constraint sold_rows_are_complete check (
    (status = 'sold' and sold_on is not null and sold_price is not null)
    or (status <> 'sold' and sold_on is null and sold_price is null)
  )
);

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles on delete cascade,
  owner_id uuid not null references auth.users on delete cascade,
  contact_name text not null,
  contact_email text not null,
  offer_amount numeric(12,2),
  stage enquiry_stage not null default 'new',
  created_at timestamptz not null default now()
);

-- Photos live in Storage; this table is the index of which object belongs to
-- which vehicle. `path` is always '<owner_id>/<vehicle_id>/<file>', which is
-- what lets the storage policy (0004) authorise by folder name.
create table vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles on delete cascade,
  owner_id uuid not null references auth.users on delete cascade,
  path text not null unique,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes chosen for the access patterns that exist: "my rows" and
-- "children of this vehicle". Both are used by every RLS policy check.
create index vehicles_owner_idx on vehicles (owner_id, status);
create index enquiries_owner_idx on enquiries (owner_id);
create index enquiries_vehicle_idx on enquiries (vehicle_id);
create index photos_owner_idx on vehicle_photos (owner_id);
create index photos_vehicle_idx on vehicle_photos (vehicle_id);

-- A real signup must get a profile row, or the shell has no dealership name to
-- show. The seed script creates its users through the admin API and fires this
-- same trigger, so demo accounts and real accounts take one path.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, dealership_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'dealership_name', 'My Dealership'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- An enquiry inherits its vehicle's owner. Doing this in a trigger means the
-- client cannot set owner_id to someone else, even accidentally.
create or replace function set_enquiry_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select owner_id into new.owner_id from vehicles where id = new.vehicle_id;
  return new;
end;
$$;

create trigger enquiries_set_owner
  before insert on enquiries
  for each row execute function set_enquiry_owner();

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vehicles_touch_updated_at
  before update on vehicles
  for each row execute function touch_updated_at();
```

- [ ] **Step 2: Run it**

Supabase dashboard → SQL Editor → paste → Run.
Expected: "Success. No rows returned."

- [ ] **Step 3: Verify the tables exist**

Run in SQL Editor: `select table_name from information_schema.tables where table_schema='public';`
Expected: `profiles`, `vehicles`, `enquiries`

- [ ] **Step 4: Commit**

```bash
git add 02-dashboard/supabase/migrations/0001_schema.sql
git commit -m "feat(02-dashboard): add vehicles and enquiries schema with integrity constraints"
```

---

## Task 3: Row-Level Security

**Files:** Create `supabase/migrations/0002_rls.sql`

- [ ] **Step 1: Write the policies**

```sql
-- RLS is enabled before any row exists. A table with RLS off is readable by
-- anyone holding the anon key, which is shipped to every browser.
alter table profiles       enable row level security;
alter table vehicles       enable row level security;
alter table enquiries      enable row level security;
alter table vehicle_photos enable row level security;

-- profiles: a dealer reads and edits only their own profile row.
create policy "profiles are self-service"
  on profiles for all
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- vehicles: full ownership. `using` governs which rows are visible to
-- select/update/delete; `with check` governs what may be written, which is what
-- stops a dealer inserting a row owned by someone else.
create policy "dealers read their own vehicles"
  on vehicles for select
  using (owner_id = (select auth.uid()));

create policy "dealers insert their own vehicles"
  on vehicles for insert
  with check (owner_id = (select auth.uid()));

create policy "dealers update their own vehicles"
  on vehicles for update
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "dealers delete their own vehicles"
  on vehicles for delete
  using (owner_id = (select auth.uid()));

-- enquiries: same ownership rule. The insert check also verifies the parent
-- vehicle belongs to the caller, so an enquiry cannot be attached to a
-- stranger's vehicle even though the trigger sets owner_id afterwards.
create policy "dealers read their own enquiries"
  on enquiries for select
  using (owner_id = (select auth.uid()));

create policy "dealers insert enquiries on their own vehicles"
  on enquiries for insert
  with check (
    exists (
      select 1 from vehicles v
      where v.id = vehicle_id and v.owner_id = (select auth.uid())
    )
  );

create policy "dealers update their own enquiries"
  on enquiries for update
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "dealers delete their own enquiries"
  on enquiries for delete
  using (owner_id = (select auth.uid()));

-- vehicle_photos: same ownership rule, plus the insert must target a vehicle the
-- caller owns, so a photo row cannot be attached to a stranger's vehicle.
create policy "dealers read their own photos"
  on vehicle_photos for select
  using (owner_id = (select auth.uid()));

create policy "dealers insert photos on their own vehicles"
  on vehicle_photos for insert
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from vehicles v
      where v.id = vehicle_id and v.owner_id = (select auth.uid())
    )
  );

create policy "dealers update their own photos"
  on vehicle_photos for update
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "dealers delete their own photos"
  on vehicle_photos for delete
  using (owner_id = (select auth.uid()));
```

> `(select auth.uid())` rather than bare `auth.uid()` is deliberate: wrapping it lets Postgres evaluate the function once per statement instead of once per row, which is the difference between a fast and a slow policy on a large table.

- [ ] **Step 2: Run it in the SQL Editor**

- [ ] **Step 3: Verify RLS is on for all three tables**

```sql
select relname, relrowsecurity from pg_class
where relname in ('profiles','vehicles','enquiries');
```
Expected: `relrowsecurity = true` for all three.

- [ ] **Step 4: Commit**

```bash
git add 02-dashboard/supabase/migrations/0002_rls.sql
git commit -m "feat(02-dashboard): enable RLS with per-dealer ownership policies"
```

---

## Task 4: Supabase clients and proxy

> **Next.js 16 renamed `middleware.ts` to `proxy.ts`** and the exported function from `middleware` to `proxy` (confirmed in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`: "The `middleware` file convention is deprecated and has been renamed to `proxy`"). The first draft of this plan used the old name, which would have produced a deprecation warning at best. The logic is identical; only the file and function names changed.

**Files:** `src/lib/supabase/{client,server,admin}.ts`, `src/proxy.ts`

- [ ] **Step 1: Write `src/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

/**
 * The browser client. Carries the anon key, which is public by design — it
 * grants nothing on its own because every table is behind RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Write `src/lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * The server client, bound to the request's cookies so every query runs as the
 * signed-in dealer. This is what makes RLS meaningful: the database sees a real
 * user id, not a service account.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Middleware refreshes the session instead, so this is safe to skip.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Write `src/lib/supabase/admin.ts`**

```ts
import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * The service-role client. Bypasses RLS entirely, which is why it exists in
 * exactly one place and is imported by exactly one file: the seed script.
 *
 * The `server-only` guard turns any import from client code into a build error.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

- [ ] **Step 4: Write `src/proxy.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the auth session on every request and gates the dashboard.
 *
 * Doing the redirect here rather than in each page means an unauthenticated
 * request never reaches a Server Component that would query the database.
 *
 * This is a routing convenience, not the security boundary. Even if this file
 * were deleted, RLS would still stop one dealer reading another's rows.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)"],
};
```

- [ ] **Step 5: Commit**

```bash
git add 02-dashboard/src/lib/supabase 02-dashboard/src/proxy.ts
git commit -m "feat(02-dashboard): add cookie-bound Supabase clients and route protection"
```

---

## Task 5: Auth screen and dashboard shell

**Files:** `src/app/(auth)/login/page.tsx`, `src/app/(dash)/layout.tsx`

- [ ] **Step 1: Build the login page** — email + password, sign in and sign up modes, inline error text (not a toast), disabled submit while pending, and a visible "Demo account" hint block containing the seeded credentials so a reviewer can get in without reading the README.

- [ ] **Step 2: Build the dashboard shell** — reads the user server-side, shows dealership name, nav links (Overview · Inventory), and a sign-out Server Action.

- [ ] **Step 3: Verify the gate**

| Check | Expected |
|---|---|
| Visit `/` signed out | Redirected to `/login` |
| Sign in with demo credentials | Land on `/` |
| Visit `/login` signed in | Redirected to `/` |
| Sign out | Redirected to `/login`, back button does not restore the dashboard |

- [ ] **Step 4: Commit**

---

## Task 6: Vehicle CRUD

**Files:** `src/app/actions/vehicles.ts`, `src/app/(dash)/inventory/page.tsx`, `src/components/vehicle-form.tsx`

- [ ] **Step 1: Write the Server Actions**

Four actions: `createVehicle`, `updateVehicle`, `markSold`, `deleteVehicle`. Each one:
- validates input and returns `{ error: string }` on failure rather than throwing
- never accepts `owner_id` from the form — it is read from the session
- calls `revalidatePath` on success

```ts
"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { error: null };

/**
 * owner_id is taken from the session, never from the submitted form. Even if a
 * caller forged it, the RLS `with check` clause would reject the write — but
 * not accepting it at all means there is nothing to forge.
 */
export async function createVehicle(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const year = Number(formData.get("year"));
  const acquired = Number(formData.get("acquired_price"));
  const asking = Number(formData.get("asking_price"));

  if (!formData.get("make") || !formData.get("model")) {
    return { error: "Make and model are required." };
  }
  if (!Number.isFinite(year) || year < 1950 || year > 2100) {
    return { error: "Year must be between 1950 and 2100." };
  }
  if (!Number.isFinite(acquired) || !Number.isFinite(asking)) {
    return { error: "Prices must be numbers." };
  }

  const { error } = await supabase.from("vehicles").insert({
    owner_id: user.id,
    make: String(formData.get("make")),
    model: String(formData.get("model")),
    year,
    vin: (formData.get("vin") as string) || null,
    mileage_km: Number(formData.get("mileage_km")) || 0,
    acquired_price: acquired,
    asking_price: asking,
  });

  if (error) return { error: error.message };

  revalidatePath("/inventory");
  revalidatePath("/");
  return { error: null };
}
```

`markSold` must set `status`, `sold_on` and `sold_price` together, because the `sold_rows_are_complete` constraint rejects a partial update — this is the constraint doing its job.

- [ ] **Step 2: Build the inventory table** — sortable columns, status pill, row link to detail, empty state ("No vehicles on the forecourt yet — add the first one"), and a loading skeleton.

- [ ] **Step 3: Build the form** with `useActionState` + `useFormStatus` so the submit button reports pending state and errors render inline.

- [ ] **Step 4: Verify CRUD end to end**

| Action | Expected |
|---|---|
| Create a vehicle | Appears in the list without a manual refresh |
| Edit price | New value persists after reload |
| Mark sold without a price | Rejected with a readable message (the DB constraint firing) |
| Delete a vehicle with enquiries | Both disappear (cascade) |
| Submit an empty form | Inline validation, no network call |

- [ ] **Step 5: Commit**

---

## Task 7: Enquiries — the related entity

**Files:** `src/app/actions/enquiries.ts`, `src/app/(dash)/vehicles/[id]/page.tsx`

- [ ] **Step 1: Write `createEnquiry`, `advanceStage`, `deleteEnquiry`.**

- [ ] **Step 2: Build the vehicle detail page** — vehicle facts, derived days-on-lot, and its enquiries as a pipeline ordered by stage.

- [ ] **Step 3: Verify the trigger works**

Insert an enquiry, then check in SQL Editor that `owner_id` was populated automatically:
```sql
select id, vehicle_id, owner_id from enquiries order by created_at desc limit 1;
```
Expected: `owner_id` matches the vehicle's owner, without the client having sent it.

- [ ] **Step 4: Commit**

---

## Task 8: Charts

**Files:** `src/components/charts/*.tsx`, `src/components/kpi-row.tsx`

Three visualisations, each answering a question a dealer actually asks:

| Chart | Question it answers | Form |
|---|---|---|
| Stock composition | "What is sitting on my forecourt right now?" | Horizontal stacked bar by status, with value not just count |
| Margin and units, 12 months | "Am I making money, and is volume moving?" | Bars for units sold, line for gross margin, shared x-axis |
| Days on lot | "What is going stale?" | Histogram bucketed 0–30 / 31–60 / 61–90 / 90+ |

- [ ] **Step 1: Build the KPI row** from `dealer_stats` (Task 9): units in stock, stock value, average days on lot, gross margin this year.

> Edge case that would otherwise crash a brand-new account: `dealer_stats` is `group by owner_id`, so a dealer with zero vehicles gets **no row at all**, not a row of zeros. The query must use `.maybeSingle()` and default every KPI to 0 when it returns null.

- [ ] **Step 2: Build the three charts** with Recharts, reading from server-computed data passed as props. No aggregation in the component.

- [ ] **Step 3: Handle the empty case** — a new account has no data. Every chart renders an empty state that explains what will appear, not a blank box.

- [ ] **Step 4: Verify responsiveness** — charts reflow at 375px without clipped labels.

- [ ] **Step 5: Commit**

---

## Task 9: Server-computed analytics and real-time

**Files:** `supabase/migrations/0003_analytics.sql`, `src/components/realtime-refresher.tsx`

- [ ] **Step 1: Write the views**

```sql
-- security_invoker makes the view run with the querying user's permissions, so
-- the underlying RLS policies still apply. Without it a view silently becomes a
-- hole straight through row-level security.
create view dealer_stats
with (security_invoker = on) as
select
  owner_id,
  count(*) filter (where status = 'in_stock')                      as units_in_stock,
  coalesce(sum(asking_price) filter (where status = 'in_stock'), 0) as stock_value,
  coalesce(avg(sold_on - acquired_on) filter (where status = 'sold'), 0) as avg_days_on_lot,
  coalesce(sum(sold_price - acquired_price) filter (where status = 'sold'), 0) as gross_margin
from vehicles
group by owner_id;

create view monthly_performance
with (security_invoker = on) as
select
  owner_id,
  date_trunc('month', sold_on)::date            as month,
  count(*)                                       as units_sold,
  sum(sold_price - acquired_price)               as gross_margin,
  sum(sold_price)                                as revenue
from vehicles
where status = 'sold' and sold_on is not null
group by owner_id, date_trunc('month', sold_on)
order by month;
```

- [ ] **Step 2: Prove the view respects RLS**

Sign in as dealer A, query `dealer_stats`, and confirm exactly one row comes back — A's. If two rows appear, `security_invoker` is not on and the boundary is broken.

- [ ] **Step 3: Enable Realtime in the migration, not by clicking**

Append to `0003_analytics.sql`, so a from-scratch setup reproduces it (the brief asks for "whatever config is needed to stand it up from scratch", and a dashboard toggle is not reproducible):

```sql
alter publication supabase_realtime add table vehicles, enquiries, vehicle_photos;
```

Realtime `postgres_changes` honours RLS for an authenticated client, so a dealer only ever receives events for rows they can read. Note one real caveat to state honestly in the docs: Realtime cannot apply a filter to DELETE events, so the client re-fetches through the normal RLS-checked path rather than trusting the event payload.

- [ ] **Step 4: Write the subscriber**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Revalidates the route when the dealer's own rows change anywhere.
 *
 * The subscription re-fetches through the normal server path rather than
 * patching local state, so what arrives is already filtered by RLS. A change
 * to another dealer's row is never delivered here in the first place.
 */
export function RealtimeRefresher({ ownerId }: { ownerId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const onChange = () => router.refresh();
    const filter = `owner_id=eq.${ownerId}`;

    // One channel, three tables: the KPI row depends on vehicles, the pipeline
    // on enquiries, and the gallery on photos.
    const channel = supabase
      .channel("dealer-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles", filter }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "enquiries", filter }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicle_photos", filter }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId, router]);

  return null;
}
```

- [ ] **Step 5: Verify real-time with two tabs**

Open the dashboard in two tabs signed in as the same dealer. Add a vehicle in tab 1. Tab 2's KPI row and inventory update without a manual refresh. **Record this for the video — it is the strongest 15 seconds in the demo.**

- [ ] **Step 6: Commit**

---

## Task 9b: File storage — vehicle photos

**Files:** `supabase/migrations/0004_storage.sql`, `src/components/photo-uploader.tsx`, `src/components/photo-gallery.tsx`, `src/app/actions/photos.ts`

The brief's fourth option: "uploads to a storage bucket with previews and sensible access rules." The design decision that matters is **private bucket + signed URLs**, not a public bucket. Car photos are the dealer's stock; a public bucket would make every image URL guessable and permanently shareable.

- [ ] **Step 1: Write the storage migration**

```sql
-- Private bucket with hard limits enforced by Storage itself, so a bad client
-- cannot upload a 500MB file or a non-image regardless of what the UI allows.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-photos', 'vehicle-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Object paths are '<owner_id>/<vehicle_id>/<filename>'. The first path segment
-- is the owner, so authorisation is a folder-name comparison — no join needed.
create policy "dealers read their own photo objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'vehicle-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "dealers upload into their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'vehicle-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "dealers delete their own photo objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'vehicle-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
```

- [ ] **Step 2: Write the upload flow**

The browser uploads the file directly to Storage with the dealer's own session (so the storage policy above is what authorises it), then calls a Server Action that records the row in `vehicle_photos`. Two steps rather than routing bytes through Next: the file never touches our server, which matters on Vercel's request-size limits.

```ts
// photo-uploader.tsx (client) — the path is built from the session, not user input
const path = `${user.id}/${vehicleId}/${crypto.randomUUID()}.${extension}`;
const { error } = await supabase.storage.from("vehicle-photos").upload(path, file, { contentType: file.type });
if (error) return setError(error.message);
await recordPhoto(vehicleId, path); // Server Action inserts the vehicle_photos row
```

Client-side checks (type, ≤5 MB) exist for fast feedback only. The bucket limits are the real enforcement, and the README must say so.

- [ ] **Step 3: Write the gallery with signed-URL previews**

Server Component: fetch the vehicle's `vehicle_photos` rows, then `createSignedUrls(paths, 3600)` in one call. Render with `next/image`. Empty state: "No photos yet — add one so buyers can see the car." Cover photo shown on the inventory list row as a thumbnail.

- [ ] **Step 4: Handle the failure paths deliberately**

| Case | Expected |
|---|---|
| File over 5 MB | Inline message before upload starts |
| Non-image file | Rejected client-side and, if bypassed, by the bucket's mime allow-list |
| Upload succeeds but `recordPhoto` fails | The orphaned object is deleted, so Storage and the table never disagree |
| Deleting a vehicle | Its `vehicle_photos` rows cascade; a Server Action also removes the objects, because Postgres cannot delete Storage files |

- [ ] **Step 5: Verify against the security boundary**

`verify-rls.ts` check 8 (A cannot sign a URL for B's photo) must pass. Additionally, open a signed URL in a private window, wait past its expiry, and confirm it stops working.

- [ ] **Step 6: Commit**

```bash
git add 02-dashboard/supabase/migrations/0004_storage.sql 02-dashboard/src/components/photo-*.tsx 02-dashboard/src/app/actions/photos.ts
git commit -m "feat(02-dashboard): add private photo storage with per-dealer folder policies and signed previews"
```

---

## Task 10: Prove the security boundary

This task exists because the brief asks for proof, not a claim. Its output is a section of the README and a screenshot.

- [ ] **Step 1: Confirm two seeded dealers exist with different data**

Dealer A: `dealer.a@forecourt.demo` · Dealer B: `dealer.b@forecourt.demo`

- [ ] **Step 2: Capture a vehicle id belonging to dealer B**

Run in SQL Editor (service role, bypasses RLS):
```sql
select id, make, model, owner_id from vehicles
where owner_id = (select id from auth.users where email = 'dealer.b@forecourt.demo')
limit 1;
```
Record the id.

- [ ] **Step 3: Write `scripts/verify-rls.ts` — the boundary check as an automated, repeatable script**

An earlier draft of this plan had the check typed into the browser console via `window.__sb`. That global does not exist anywhere in the app, so the step could never have run. A script is also strictly better evidence: anyone can re-run it, and the brief lists "automated checks" under how you tested.

The script uses only the **anon key** and real sign-ins — exactly what a hostile user holds. The service-role key is used only to look up B's ids.

```ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const results: { check: string; pass: boolean; detail: string }[] = [];
const record = (check: string, pass: boolean, detail: string) => {
  results.push({ check, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${check}  —  ${detail}`);
};

async function signedIn(email: string) {
  const client = createClient(url, anon);
  const { error } = await client.auth.signInWithPassword({ email, password: "demo-password-123" });
  if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  return client;
}

async function main() {
  const { data: users } = await admin.auth.admin.listUsers();
  const a = users.users.find((u) => u.email === "dealer.a@forecourt.demo")!;
  const b = users.users.find((u) => u.email === "dealer.b@forecourt.demo")!;

  const { data: bVehicle } = await admin.from("vehicles").select("id").eq("owner_id", b.id).limit(1).single();
  const clientA = await signedIn("dealer.a@forecourt.demo");

  // 1. RLS filters, it does not error: B's row is simply invisible to A.
  const read = await clientA.from("vehicles").select("*").eq("id", bVehicle!.id);
  record("A cannot read B's vehicle by id", read.data?.length === 0 && !read.error,
    `rows=${read.data?.length}, error=${read.error?.message ?? "none"}`);

  // 2. A's unfiltered read contains only A's rows.
  const all = await clientA.from("vehicles").select("owner_id");
  record("A's full vehicle list contains only A's rows",
    !!all.data?.length && all.data.every((r) => r.owner_id === a.id),
    `${all.data?.length} rows, all owned by A`);

  // 3. A cannot insert a row owned by B.
  const forged = await clientA.from("vehicles").insert({
    owner_id: b.id, make: "X", model: "Y", year: 2020, acquired_price: 1, asking_price: 2,
  });
  record("A cannot insert a vehicle owned by B", !!forged.error,
    forged.error?.message ?? "insert unexpectedly succeeded");

  // 4. A cannot update B's row — it matches zero rows rather than erroring.
  const upd = await clientA.from("vehicles").update({ asking_price: 1 }).eq("id", bVehicle!.id).select();
  record("A cannot update B's vehicle", upd.data?.length === 0, `rows affected=${upd.data?.length}`);

  // 5. A cannot delete B's row, and it still exists afterwards.
  await clientA.from("vehicles").delete().eq("id", bVehicle!.id);
  const still = await admin.from("vehicles").select("id").eq("id", bVehicle!.id);
  record("A cannot delete B's vehicle", still.data?.length === 1, "row still exists");

  // 6. The aggregate view is not a bypass: exactly one row, A's.
  const stats = await clientA.from("dealer_stats").select("owner_id");
  record("dealer_stats returns only A's row (security_invoker works)",
    stats.data?.length === 1 && stats.data[0].owner_id === a.id, `${stats.data?.length} row(s)`);

  // 7. A cannot enqueue an enquiry onto B's vehicle.
  const enq = await clientA.from("enquiries").insert({
    vehicle_id: bVehicle!.id, contact_name: "x", contact_email: "x@x.com",
  });
  record("A cannot attach an enquiry to B's vehicle", !!enq.error, enq.error?.message ?? "insert unexpectedly succeeded");

  // 8. Storage: A cannot fetch a signed URL for a photo in B's folder.
  const { data: bPhoto } = await admin.from("vehicle_photos").select("path").eq("owner_id", b.id).limit(1).single();
  const signed = await clientA.storage.from("vehicle-photos").createSignedUrl(bPhoto!.path, 60);
  record("A cannot sign a URL for B's photo", !!signed.error || !signed.data?.signedUrl,
    signed.error?.message ?? "no URL issued");

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

Add the script: `"verify:rls": "tsx --env-file=.env.local scripts/verify-rls.ts"`

- [ ] **Step 4: Run it**

Run: `npm run verify:rls`
Expected: `8/8 checks passed`. Any FAIL means a policy is wrong — fix the policy, not the script.

> This is the important detail to be able to explain: RLS does not error. It filters. A forbidden row simply does not exist from A's perspective, which is why check 1 returns an empty array and not a 403 — and why checks 4 and 5 "succeed" while affecting zero rows. Only an *insert* has no row to hide behind, which is why check 3 is the one that errors.

- [ ] **Step 5: Break it on purpose, once**

Temporarily drop the `security_invoker` option from `dealer_stats` (`alter view dealer_stats set (security_invoker = off);`), re-run the script, and confirm check 6 FAILS with two rows. Then restore it. Seeing the hole appear is what makes the explanation in the interview credible instead of recited. Record this in BUILD_LOG under "How I verified it works".

- [ ] **Step 6: Screenshot the passing terminal output and write the README section**

The README must state the method, list all eight checks, and show the observed results — not "RLS is enabled".

---

## Task 11: Seed script and documentation

**Files:** `scripts/seed.ts`, `README.md`, `BUILD_LOG.md`

- [ ] **Step 1: Write the seed script**

Creates two confirmed users via the admin client, their profiles, ~20 vehicles each spread across statuses and across the last 14 months, and ~30 enquiries. Sold vehicles get realistic `sold_on`/`sold_price` so the charts have shape. The script is idempotent: it deletes rows owned by the two demo users before inserting.

- [ ] **Step 2: Add the script**

```json
"scripts": { "seed": "tsx scripts/seed.ts" }
```

- [ ] **Step 3: Run and verify**

```bash
npm run seed
```
Expected: `Seeded 2 dealers, 40 vehicles, 60 enquiries, 24 photos.`

The seed also uploads a few small generated PNGs (rendered with `sharp` from an SVG carrying the make/model text) into each dealer's folder of the `vehicle-photos` bucket, so the gallery and cover thumbnails are populated on first login and the storage RLS check has something to test against.

- [ ] **Step 3b: Turn off email confirmation for the demo**

Supabase → Authentication → Providers → Email → disable **Confirm email**. With it on, a reviewer who signs up with a fresh address is blocked waiting for a mail that may never arrive, and the "way in" requirement fails for anyone who does not use the seeded logins. State in the README that this was a deliberate demo-only choice and would be on in production.

- [ ] **Step 4: Write the README** covering all six required documentation points:

1. **Backend choice and why** — Supabase, because RLS is Postgres-native rather than an application-layer abstraction, which makes the security boundary something the database enforces and something explainable in one sentence.
2. **Full schema** — tables, columns, types, constraints, the ER diagram above.
3. **Services used** — Auth, Postgres, Realtime, Storage (`vehicle-photos`, private, 5 MB, jpeg/png/webp), the two views, the three triggers, the realtime publication.
4. **Advanced feature verification** — the four-check RLS proof with screenshots.
5. **Setup from zero** — create project, run the three migrations in order, set env vars, `npm run seed`, `npm run dev`.
6. **A way in** — the two demo logins, stated plainly near the top of the README.

- [ ] **Step 5: Write BUILD_LOG.md** using the official seven-section template.

Known limitations must honestly include: the only automated test is the RLS script (no UI or unit tests); Realtime cannot filter DELETE events so the client re-fetches instead of trusting the payload; signed photo URLs expire after an hour so a long-open tab needs a refresh; no image resizing or thumbnails server-side; email confirmation is off for the demo; the seed script's randomness means chart shapes differ between runs; no pagination on the inventory table.

- [ ] **Step 6: Commit**

---

## Task 12: Deploy and final verification

- [ ] **Step 1: Secrets audit**

```bash
cd "D:/Projects/Alba Corp"
git ls-files | grep -E "\.env($|\.)" && echo "!!! STOP !!!" || echo "CLEAN"
grep -rn "service_role\|eyJ[A-Za-z0-9_-]\{30,\}" --include="*.ts" --include="*.tsx" 02-dashboard/src/ || echo "NO KEYS IN SOURCE"
```

- [ ] **Step 2: Deploy to Vercel** with Root Directory `02-dashboard` and all three env vars set.

- [ ] **Step 3: Add the Vercel URL to Supabase** → Authentication → URL Configuration → Site URL and Redirect URLs.

- [ ] **Step 4: Verify in a fresh incognito window**

| Check | Expected |
|---|---|
| Live URL signed out | Redirect to `/login` |
| Sign in as dealer A | Dashboard with populated charts |
| Sign in as dealer B in a private window | Completely different data |
| Two tabs, add a vehicle | Other tab updates live |
| 375px viewport | No horizontal scroll |
| DevTools → search `service_role` | No match |

- [ ] **Step 5: Record the live URL in both READMEs, commit and push**

---

## Task 13: Video walkthrough

- [ ] **Step 1: Write `VIDEO_SCRIPT.md`** — a 3–4 minute beat sheet:
  1. What it is, and log in as dealer A — 20s
  2. CRUD: add a vehicle, mark one sold, watch the KPIs move — 45s
  3. **Proud of:** the security boundary. Show the console proof live — A asking for B's row and receiving an empty array, then the rejected insert. Explain that RLS filters rather than errors — 70s
  4. **Also proud of:** `security_invoker` on the view, and why a view without it is a hole straight through RLS — 30s
  5. **Fought me:** the `sold_rows_are_complete` constraint rejecting partial updates until `markSold` was rewritten to set all three fields together — 40s
  6. Real-time: two tabs, live update — 20s

- [ ] **Step 2: Interview rehearsal.** Every answer must be yours, unprompted:
  1. What exactly does RLS do when a row is not yours — error or filter?
  2. Why is the anon key safe to ship to the browser?
  3. What is `security_invoker` and what breaks without it?
  4. Why is `owner_id` duplicated onto `enquiries` instead of joining through `vehicles`?
  5. Why is `(select auth.uid())` wrapped in a subquery in the policies?
  6. Where does the service-role key live, and what stops it reaching the client?
  7. Why compute the KPIs in a view instead of in the dashboard?
  8. What happens if someone POSTs a vehicle with another dealer's `owner_id`?
  9. Why is the photo bucket private with signed URLs instead of public?
  10. How does a storage policy know which dealer owns a file? (Answer: the first path segment is the owner id.)
  11. Why does the browser upload straight to Storage instead of through a Next route?
  12. Why did Next 16 rename `middleware.ts` to `proxy.ts`, and is it your security boundary? (Answer: no — RLS is.)
  13. In `verify-rls.ts`, why do the update and delete checks "pass" without an error?

- [ ] **Step 3: Record with Loom and link it in the form**

---

## Submission Checklist (Task 02 form — 9 items)

- [ ] Live URL · [ ] GitHub repo · [ ] README.md · [ ] BUILD_LOG.md · [ ] A way into the app (demo credentials) · [ ] Video demo
- [ ] All URLs working · [ ] Repository public · [ ] BUILD_LOG included
- [ ] Advanced options ticked: **Secure isolated data** + **Server-computed analytics** + **Real-time updates** + **File storage** (all four, each backed by evidence in the README)
- [ ] Notes field filled with honest known limitations

---

## Time Budget

| Phase | Target |
|---|---|
| Tasks 1–3 (project, schema, RLS) | 40 min |
| Task 4–5 (clients, middleware, auth shell) | 35 min |
| Tasks 6–7 (CRUD both entities) | 55 min |
| Task 8 (charts) | 35 min |
| Task 9 (views + realtime) | 30 min |
| Task 9b (file storage) | 40 min |
| Task 10 (automated security proof) | 30 min |
| Task 11 (seed + docs) | 35 min |
| Task 12 (deploy + verify) | 25 min |
| Task 13 (video) | 30 min |
| **Total** | **≈5h15m** — over the 2–4h box. With all four advanced options this is the honest number. Drop order if short: (1) real-time on enquiries/photos, keep vehicles; (2) days-on-lot histogram; (3) photo cover-thumbnail on the list. Never drop auth, RLS, the proof script, or the demo logins. |
