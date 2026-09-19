# 00 · Master Plan — Task 02: Data Dashboard on a Backend Service

**Status:** AWAITING APPROVAL. No building resumes until signed off.
**Time-box:** 2–4 h (brief rule 04) · target 3h30
**Repo:** https://github.com/Aamer-Gituser/alba-corp-assessment
**Planning package:** 00 Master · 01 Requirements · 02 Data model · 03 Architecture ·
04 Design · 05 Verification · 06 Deployment · 07 Video & interview

---

## 1. The product

**Forecourt** — a used-car inventory and reconditioning dashboard for a dealer.

A dealer buys a car at auction, spends money making it saleable (mechanical,
bodywork, detailing, tyres, electrical, paperwork), lists it, and sells it. Between
the auction and the sale, the real margin quietly changes. Forecourt answers three
questions at a glance:

1. How much capital is tied up in unsold stock right now?
2. What is reconditioning actually costing, and on what?
3. Did the cars I sold earn the margin I thought they would?

## 2. Why this topic

| Reason | Detail |
|---|---|
| Domain fit | Alba Cars buys and sells used cars. Building in the reviewer's own domain is the cheapest way to look like you thought about the reader — that is the Creative Problem Solving 20% |
| On-brief | "An inventory manager" is explicitly listed in the brief's good options |
| Honest schema | One vehicle genuinely has many reconditioning jobs. The relationship isn't invented to satisfy a checkbox |
| Chartable | Money over time, money by category, volume over time — all real questions, no decorative charts |

**Rejected alternatives:** expense tracker (safe but generic, says nothing about
Alba) · habit tracker (weak money story, thin charts) · mini-CRM (schema heavier
than the time-box allows).

## 3. Stack, and why — using the resources the brief gave us

| Layer | Choice | Why this one |
|---|---|---|
| BaaS | **Supabase** (brief resource) | The brief calls it "our recommended pick and a natural fit if you want to show off SQL and row-level security". RLS is Postgres-native, so the security boundary is something we can *show* in SQL rather than describe. Convex would have given realtime more cheaply but hides the SQL; Appwrite's permission model is harder to prove line-by-line |
| Framework | Next.js 16 (App Router) | Server Components put data fetching next to the auth cookie, so RLS applies to every read without extra plumbing. Server Actions give mutations without hand-writing an API layer |
| Charts | Recharts | Composable, small, and easy to give custom tooltips and table twins |
| Hosting | **Vercel** (brief resource) | First-party Next.js deploys; preview URL in minutes |
| Video | **Loom** (brief resource) | Per-task walkthrough |
| Language | TypeScript, strict | Database row types hand-declared and shared between server and client |

## 4. Scope — in and out

**In:** email/password auth · full CRUD on vehicles · full CRUD on reconditioning
jobs · three charts · KPI tiles · needs-attention list · RLS on every table with a
runnable proof · realtime across tabs · server-side aggregation · seeded demo data
with two dealerships · responsive to mobile · skeleton/empty/error states.

**Out, deliberately** (documented in Known Limitations, per rule 06):
file storage/receipt uploads · dark mode · multi-user teams per dealership ·
pagination (the seed is ~20 cars; the list is not virtualised) · automated test
suite beyond the RLS proof script · CSV export.

## 5. Advanced options — 3 of 4

The brief: *"The strongest submissions do auth plus RLS plus one more, and explain
how they checked the security boundary actually holds."*

| Option | Status | One-line summary |
|---|---|---|
| Secure, isolated data | ✅ | Supabase Auth + RLS on all three tables, proven by a script that tries to breach it |
| Real-time updates | ✅ | Both mutable tables replicate; two tabs stay in sync |
| Server-computed analytics | ✅ | A view + three RPCs aggregate in Postgres; the browser never sums raw rows |
| File storage | ❌ | Skipped to protect the time-box; disclosed |

## 6. Timeline from approval

| Phase | Est. | Gate |
|---|---|---|
| A. Finish screens (overview, inventory, detail) | 70 min | All CRUD paths work against real data |
| B. Seed + RLS proof scripts | 25 min | `npm run seed`, `npm run verify:rls` both green |
| C. Run against live Supabase, fix breakages | 25 min | No console errors, all states reachable |
| D. Deploy to Vercel | 15 min | Live URL loads in incognito |
| E. README + BUILD_LOG + .env.example | 30 min | All six doc requirements covered |
| F. Video script + rehearsal Q&A | 25 min | You can answer the drill in 07 unaided |

## 7. Blockers — only you can clear these

| # | What | Why it blocks |
|---|---|---|
| 1 | **Supabase project** + Project URL, `anon` key, `service_role` key | Nothing can run, seed, or be proven without a live database |
| 2 | **Vercel** signed in with GitHub | Deploy step |
| 3 | **Loom** account | Video deliverable |

`service_role` is a secret: it goes in `.env.local` only, is listed in `.gitignore`
before the first commit, and is never referenced in client code. Verified in 05.

## 8. Current build status (honest)

Code was started before approval — my error, logged and corrected.

| Exists | Not started |
|---|---|
| Scaffold + dependencies | Overview screen |
| `0001_init.sql` — schema, RLS, view, RPCs | Inventory list + vehicle detail |
| Supabase clients, middleware, types, formatters | Seed + RLS proof scripts |
| Login screen + auth actions | README, BUILD_LOG, .env.example |
| Design tokens, three charts, cost-stack, nav, realtime | Deploy, video, interview drill |

≈45% written. **Anything here can be thrown away on request** — topic, schema,
design direction, stack.

## 9. Definition of done

Every box in `01-REQUIREMENTS-MATRIX.md` ticked with evidence · all four hand-ins
present (live URL, repo, BUILD_LOG, video) · the pre-submit ritual in `05` passed ·
you can answer the interview drill in `07` without notes.
