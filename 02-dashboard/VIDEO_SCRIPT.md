# Forecourt — Video Walkthrough Script

**Target length:** 3–5 minutes
**Format:** Screen share + voiceover. No need to edit — one clean take is fine.

---

## Intro (15 sec)

> "Hey — this is my submission for Task 02, the backend dashboard. I built Forecourt: a margin and inventory tracker for a used-car dealership. I'll demo the app, then show you the two things I want to highlight — one I'm proud of, one that fought me."

---

## Part 1 — The problem it solves (20 sec)

*Stay on the login page while talking.*

> "A car dealer buys a car at auction, spends money fixing it up — tyres, bodywork, detailing — then lists it. Between those two steps the real margin moves. Most dealers track the purchase price in one spreadsheet and the prep costs somewhere else. By the time the car sells, they don't actually know what they made. Forecourt makes that cost-stack visible in one place."

---

## Part 2 — Login and Overview (45 sec)

*Sign in as Marina Motors: `appflow.qa01@gmail.com` / `forecourt-demo`*

> "Signing in — you'll see the Overview page loads instantly. These four KPI tiles pull from a server-side RPC called `dashboard_stats` — capital deployed, recon spend, realised margin, and average days in stock. The progress bars are data-driven: the blue one is capital as a percentage of a 1 million AED benchmark, the amber one is recon as a percentage of deployed capital, the green one is margin percentage on sold units."

*Point at the charts.*

> "Below that are three charts — margin by month, recon by category, and volume bought vs sold. All three have a time-span filter and a collapsible data table underneath for accessibility. These don't pull raw rows — they call server-side Postgres functions and get back aggregated results only."

*Point at the Live Sync dot in the header.*

> "That green dot in the header is the Realtime connection — I'll come back to that."

---

## Part 3 — Inventory (45 sec)

*Navigate to /inventory*

> "Inventory list. I can filter by status — sourcing, in recon, listed, sold — by date range, or search by make, model, or body type. All filters compose together."

*Click Add vehicle, fill in a car quickly.*

> "Adding a car — make, model, year, acquisition price. I'll also set a status of reconditioning."

*Click into the new vehicle.*

> "On the detail page you can see the cost-stack bar. Right now it's just the acquisition price. Let me add a recon job."

*Add one recon job (e.g. Mechanical, AED 3000).*

> "The bar updates — you can now see acquisition on the left, recon in amber, and the projected margin on the right. The numbers are live. I can toggle jobs as complete, add more, delete them."

---

## Part 4 — Analytics (30 sec)

*Navigate to /analytics*

> "The Analytics page has four business-level KPIs — total revenue, average margin percentage, sell-through rate, and average recon cost per unit. Below that the same three charts, and then two ranked tables: top performers by realised margin, and slowest movers by days in stock with red badges over 60 days."

---

## Part 5 — Profile and File Storage (20 sec)

*Navigate to /profile*

> "The profile page is also where file storage lives. I can upload a dealership logo — this goes to a Supabase Storage bucket called `avatars`. The Server Action validates the type and size, upserts to the bucket, and writes the public URL back to the profiles table. It shows up in the header avatar ring."

---

## Part 6 — The thing I'm proud of (45 sec)

*Open terminal and run `npm run verify:rls`*

> "The thing I'm most proud of is the security proof. I wrote a script — `npm run verify:rls` — that authenticates as Marina Motors, then attempts 10 breach scenarios as that user against Rashid Auto's data: SELECT, UPDATE, DELETE, INSERT with a forged owner ID, and querying through the analytics view."

*Let the output run, show all 10 PASS.*

> "All 10 pass. The important one is test 7 — the `vehicle_economics` view. A Postgres view normally runs with the privileges of whoever created it, which bypasses RLS entirely. Any logged-in user could have read every dealership's margins through that one object. The fix is `security_invoker = true` on the view definition — it makes the view run as the *caller* instead, so the table policies still apply. That is not the default. Easy to miss, very damaging to miss. Test 7 is the one that would fail on that specific mistake."

---

## Part 7 — The thing that fought me (30 sec)

> "The thing that fought me was the fan-out bug in the monthly performance RPC. The original version joined the vehicle data to the month-series twice — once for acquired, once for sold. With N cars bought and M cars sold in a given month, you get N×M rows back. The margin totals looked plausible — just inflated by a factor of 2 or 3 — which is exactly the kind of silent bug that slips into demos and makes the charts look roughly right. The fix was to aggregate bought and sold separately in CTEs first, then join the already-small results to the month series."

---

## Outro (15 sec)

> "That's Forecourt. README covers the full schema, setup from zero, and the RLS verification output. Seed script creates both dealerships in one command. Any questions — happy to walk through any part of it."

---

## Screen order cheat-sheet (so you don't have to ad-lib)

1. `/login` — talk about the problem
2. Sign in → `/` — KPIs, charts, Live Sync dot
3. `/inventory` — filters, add car, detail page, add recon job, cost-stack bar
4. `/analytics` — KPI tiles, tables
5. `/profile` — avatar upload
6. Terminal — `npm run verify:rls` (keep terminal visible, let it print)
7. Outro

---

## Tips

- Record in one take — stumbles are fine, reviewers know it's a demo
- Keep cursor near what you're describing
- Don't read from the script word-for-word — use it as bullet prompts
- Show the terminal `verify:rls` output in full — that 10/10 is the strongest proof in the submission
