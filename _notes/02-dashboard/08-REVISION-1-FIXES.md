# 08 · Revision 1 — verified defects and scope change

**Historical revision — superseded on 2026-09-20.** Retained to explain earlier decisions, not as active instructions. The current [master plan](00-MASTER-PLAN.md), [audit](08-REVIEW-FINDINGS.md) and [verification plan](05-VERIFICATION-PLAN.md) take precedence. The monthly aggregation, recon UPDATE parent check and global contrast fixes below are now present in source; hosted verification is separate.

Historical caveats: the monthly-window sum equals an all-time KPI only if both cover the same sales; the original child-reparenting example overstates the effect on B's totals because B's job RLS may hide A's job. The invariant violation is the unauthorized parent association itself. Check it directly. Historical green “committed” markers mean intended scope, not verified implementation. Do not reuse the old timing allowance.

---

## Fix 1 — `monthly_performance()` multiplies counts and margin (SQL, SERIOUS)

**Where:** `0001_init.sql`, `monthly_performance()`.

**Cause:** the function left-joins `vehicle_economics` twice onto the month series
(once by `acquired_on`, once by `sold_on`) and then groups by month. Every acquired
row pairs with every sold row in that month (a fan-out), so the counts and the sum
are inflated.

**Worked example:** a month with 2 cars bought and 3 sold produces 6 joined rows.
`count(a.id)` returns 6 (should be 2), `count(x.id)` returns 6 (should be 3), and
`sum(x.realised_margin)` is doubled. Charts 1 and 3 would both show wrong numbers
that look plausible.

**Fix:** aggregate each side separately, then join the small results to the series.

```sql
create or replace function public.monthly_performance(months_back integer default 6)
returns table (month date, acquired_count bigint, sold_count bigint, realised_margin numeric)
language sql stable security invoker set search_path = public
as $$
  with span as (
    select generate_series(
      date_trunc('month', current_date) - make_interval(months => greatest(months_back,1) - 1),
      date_trunc('month', current_date), interval '1 month')::date as month
  ),
  bought as (
    select date_trunc('month', acquired_on)::date as month, count(*) as n
    from public.vehicle_economics group by 1
  ),
  sold as (
    select date_trunc('month', sold_on)::date as month,
           count(*) as n, sum(realised_margin) as margin
    from public.vehicle_economics where status = 'sold' group by 1
  )
  select s.month, coalesce(b.n,0), coalesce(x.n,0), coalesce(x.margin,0)
  from span s
  left join bought b on b.month = s.month
  left join sold   x on x.month = s.month
  order by s.month;
$$;
```

**Regression checks (added to 05):**
- Seed a fixture month with **2 bought / 3 sold** and known margins; assert the
  function returns exactly `2 / 3 / <hand-summed margin>`.
- Assert `sum(realised_margin)` over all months equals the `realised_margin_total`
  KPI from `dashboard_stats()`.
- Assert total bought over a wide window equals the row count in `vehicles`.

---

## Fix 2 — recon-job UPDATE policy skips the parent-ownership check (RLS, SERIOUS)

**Where:** `recon_update_own`. INSERT re-checks that the parent vehicle belongs to
the caller; UPDATE does not.

**Attack:** dealer A updates one of their own jobs and sets `vehicle_id` to one of
dealer B's car ids. `WITH CHECK owner_id = auth.uid()` still passes (A owns the
row), so A's cost is now attached to B's car — polluting B's `recon_total`,
margin and charts.

**Fix:** the UPDATE `WITH CHECK` gets the same `EXISTS` as INSERT.

```sql
drop policy if exists recon_update_own on public.reconditioning_jobs;
create policy recon_update_own on public.reconditioning_jobs
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.vehicles v
                where v.id = vehicle_id and v.owner_id = (select auth.uid()))
  );
```

**Regression checks — new rows in `verify:rls`:**

| # | Attempt as dealer A | Expected |
|---|---|---|
| 9 | `update reconditioning_jobs set vehicle_id = <B's car> where id = <A's job>` | Rejected by policy |
| 10 | Re-read B's `vehicle_economics` as B | `recon_total` unchanged |

(Row 5 already covers inserting with `owner_id = B`; a matching row is added for
inserting a job against B's `vehicle_id`.)

---

## Fix 3 — colour contrast for small text (DESIGN)

Measured WCAG ratios (`node` calc, not eyeballed):

| Token | On paper | On white | Verdict as small text |
|---|---|---|---|
| `ink-faint #8D97A3` | **2.59** | 2.96 | FAIL (needs 4.5) |
| `signal #E05A26` | **3.24** | 3.71 | FAIL as text (fine for marks ≥3:1 only on white) |
| `margin #0B8F72` | **3.54** | 4.05 | FAIL as text on paper |
| `ink-soft #5B6673` | 5.11 | 5.84 | pass |

**Rule going forward — fills and text use different tokens:**

| Role | Token | Hex | On paper | On white |
|---|---|---|---|---|
| Faint text / axis ticks / eyebrows | `ink-faint` (darkened) | `#5F6975` | 4.88 | 5.58 |
| Signal **text** (loss warnings, negative margin) | `signal-text` | `#B8420F` | 4.80 | 5.49 |
| Margin **text** (positive margin figure) | `margin-text` | `#08725B` | 5.15 | 5.89 |
| Signal / margin **fills** (bars, swatches, dots) | unchanged | `#E05A26` / `#0B8F72` | marks only, validated ≥3:1 vs surface, plus text label alongside | |

Marks keep the brighter colours (validated for CVD separation). Anything a person
must *read* as characters uses the darker text variants. Also: chart tooltip and
legend labels use `ink-soft`, never a series colour.

**Interaction spec tightened:** minimum 40px touch targets on row actions and
toggles; visible focus ring ≥3:1 against both paper and white; status chips show
text; keyboard path documented for add/edit/delete; realtime highlight is
supplementary, never the only signal of a change.

---

## Fix 4 — scope order: realtime becomes a gated stretch

Time-box is the brief's rule 04. Three advanced options was ambitious; the brief
only requires auth plus one.

**Committed (must ship):** full CRUD · two charts minimum (three if time) ·
auth + RLS + the proof script · server-computed analytics · seed + docs · deploy.

**Gated (only after the deployed core passes the pre-submit ritual, and only if
inside 4h total):** Realtime. If it doesn't fit, it is dropped and disclosed under
Known Limitations, and its box is left **unticked** in the form. The header
indicator and video beat 4 are removed in that case.

| Advanced option | Now |
|---|---|
| Secure, isolated data | ✅ committed |
| Server-computed analytics | ✅ committed |
| Real-time updates | 🔶 gated stretch |
| File storage | ❌ skipped |

---

## Updated phase order

| Phase | Est. | Gate |
|---|---|---|
| A. Apply Fix 1–3 to SQL/tokens; screens (overview, inventory, detail) | 70 m | CRUD works on real data |
| B. Seed (with the 2-bought/3-sold fixture) + `verify:rls` (10+ rows) | 30 m | Both green |
| C. Run on live Supabase, fix breakage | 25 m | Console clean |
| D. Deploy | 15 m | Incognito load |
| E. README, BUILD_LOG, `.env.example` | 30 m | Six doc requirements covered |
| F. **Realtime — only if time remains** | 20 m | Two-tab demo |
| G. Video script + rehearsal | 25 m | Drill passes |

---

## Impact on other files

- **00**: advanced-options table and phase table → per this file.
- **01**: B2 (realtime) status → gated; add rows for Fixes 1–2 regression checks.
- **02**: `monthly_performance` body and `recon_update_own` → replaced above.
- **04**: token table → add `signal-text`, `margin-text`, darkened `ink-faint`.
- **05**: `verify:rls` grows from 8 to 10+ rows; add the analytics fixture tests.
- **07**: beat 4 (realtime) and its drill answer become conditional.
