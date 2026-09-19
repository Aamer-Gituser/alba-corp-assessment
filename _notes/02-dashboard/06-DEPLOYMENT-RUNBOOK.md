# 06 · Deployment Runbook — zero to live

Feeds brief doc requirements C5 ("setup from zero") and C6 ("a way in").
Uses the brief's own resources: **Supabase** and **Vercel**.

---

## Step 1 — Provision Supabase  *(you do this; ~5 min)*

1. supabase.com → **New project**
2. Name `forecourt` · region nearest you · **save the database password**
3. Wait for the project to finish provisioning
4. **Settings → API**, copy three values:

| Value | Where it ends up | Secret? |
|---|---|---|
| Project URL | `.env.local` **and** Vercel | No — public by design |
| `anon` public key | `.env.local` **and** Vercel | No — public by design, RLS is what protects the data |
| `service_role` key | `.env.local` **only** | **YES.** Never committed, never on Vercel, never in client code |

> Why `service_role` never leaves your machine: it **bypasses RLS entirely**.
> It is used once, by the seed script, to create the two demo users. The running
> app never touches it. Putting it in Vercel would mean a server-side bug could
> read every dealership's rows.

## Step 2 — Apply the schema  *(one paste)*

Supabase → **SQL Editor** → New query → paste the whole of
`02-dashboard/supabase/migrations/0001_init.sql` → **Run**.

Creates: 2 enums · 3 tables · 4 indexes · RLS + 12 policies · signup trigger ·
`vehicle_economics` view · 3 RPC functions · realtime publication.
It is idempotent — safe to re-run.

**Verify:** Table Editor shows three tables, each with the green **RLS enabled**
badge. If any badge is missing, stop — that table is public.

## Step 3 — Auth settings

**Authentication → Providers → Email**

- Enable Email provider
- **Turn OFF "Confirm email"** — so a reviewer creating a throwaway account gets
  straight in instead of waiting for a verification mail. Noted in the README as a
  demo-convenience decision, not something you'd ship to production

## Step 4 — Environment

```bash
cd 02-dashboard
cp .env.example .env.local
```

Fill `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # local seeding only
```

`.gitignore` already covers `.env*`. Confirm before the first commit:
```bash
git check-ignore -v .env.local     # must print a match
```

## Step 5 — Seed  *(the "way in")*

```bash
npm install
npm run seed
```

Creates two dealerships so the RLS boundary can be demonstrated:

| Dealership | Email | Password | Inventory |
|---|---|---|---|
| Marina Motors (A) | `demo@forecourt.test` | `forecourt-demo` | ~14 cars, ~35 recon jobs, 6 months of history |
| Rashid Auto (B) | `rival@forecourt.test` | `forecourt-demo` | ~6 cars — exists to prove A can't see them |

Idempotent: re-running clears and rebuilds the demo data rather than duplicating it.

## Step 6 — Run locally

```bash
npm run dev          # http://localhost:3000
```

Smoke test: sign in as A → overview shows KPIs and three charts → open a car →
add a recon job → the cost stack widens.

## Step 7 — Prove the boundary

```bash
npm run verify:rls
```

Expect every row PASS. Paste the real output into the README. If row 7
(`vehicle_economics`) fails, the view lost `security_invoker` — fix before shipping.

## Step 8 — Push

```bash
cd "D:/Projects/Alba Corp/02-dashboard"
git init
git add .
git status                                    # eyeball: no .env.local
git commit -m "Forecourt: inventory and reconditioning dashboard"
git remote add origin https://github.com/Aamer-Gituser/alba-corp-assessment.git
git push -u origin main
```

> The repo already contains `01-web-app` from the other task's session. If the
> remote is not empty we rebase onto it rather than force-pushing — Task 1's work
> must not be overwritten.

## Step 9 — Deploy to Vercel  *(you drive, I guide)*

1. vercel.com → **Add New → Project** → import `alba-corp-assessment`
2. **Root Directory → `02-dashboard`** ← the one setting people miss
3. Framework: Next.js (auto-detected)
4. **Environment Variables** — add exactly two:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Do not add `SUPABASE_SERVICE_ROLE_KEY`.** The app doesn't use it
5. Deploy

## Step 10 — Point Supabase at the live URL

Supabase → **Authentication → URL Configuration**

- **Site URL:** `https://<your-app>.vercel.app`
- **Redirect URLs:** add the same

Skipping this is the classic "works locally, auth loops in production" bug.

## Step 11 — Verify the deployment

- [ ] Live URL in a **fresh incognito window**
- [ ] Demo credentials sign in
- [ ] Charts render with seeded data
- [ ] Add a car on production — it persists after reload
- [ ] Two tabs → realtime updates
- [ ] 375px viewport → no horizontal scroll
- [ ] Console clean

---

## Rollback

| Problem | Fix |
|---|---|
| Bad deploy | Vercel → Deployments → previous → Promote to Production |
| Schema wrong | Re-run `0001_init.sql` (idempotent) |
| Demo data messy | `npm run seed` again — it rebuilds from scratch |
| Secret committed by mistake | **Rotate the key in Supabase immediately**, then clean history. Rotation first — a pushed key must be treated as burned |
