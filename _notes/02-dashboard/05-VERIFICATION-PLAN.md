# 05 · Verification Plan

Feeds BUILD_LOG § "How I verified it works" and brief doc requirement C4
("the advanced feature and how you verified it — especially the security boundary").

---

## 1. The security proof — the centrepiece

The brief says: *"Show it off: prove that user A can't read user B's rows."*
A claim isn't proof, so this is a script the reviewer can run themselves.

### `npm run verify:rls`

**Setup:** the seed creates two real dealerships with their own inventory —
`demo@forecourt.test` (dealer A) and `rival@forecourt.test` (dealer B).

**Method:** sign in as dealer A using the *public anon key* — exactly what a
browser has — then attempt, against a known row id belonging to dealer B:

| # | Attempt | Expected result |
|---|---|---|
| 1 | `select * from vehicles` | Only A's cars. B's ids absent |
| 2 | `select * from vehicles where id = <B's car>` | 0 rows — not an error, simply invisible |
| 3 | `update vehicles set asking_price = 1 where id = <B's car>` | 0 rows affected |
| 4 | `delete from vehicles where id = <B's car>` | 0 rows affected |
| 5 | `insert into vehicles (owner_id = B)` | Rejected by the INSERT policy |
| 6 | `select * from reconditioning_jobs` | Only A's jobs |
| 7 | `select * from vehicle_economics` | Only A's rows — **this is the `security_invoker` check.** If the view had been left as the default SECURITY DEFINER, B's economics would appear here |
| 8 | `rpc('dashboard_stats')` | Totals reconcile with A's own rows only |

**Why #7 matters:** it is the one test that would fail on a plausible, common
mistake. It is the proof that the boundary is real rather than incidental.

**Output:** the script prints a PASS/FAIL table. The real output is pasted into
the README verbatim, and shown on screen in the video.

### A second, independent check
Sign in as dealer B in a private window and confirm the dashboard totals differ
from dealer A's. Two routes to the same conclusion — script and eyes.

---

## 2. Functional test matrix — run manually against the deployed URL

### Auth
| # | Case | Expected |
|---|---|---|
| 1 | Visit `/` signed out | Redirect to `/login` |
| 2 | Sign in with demo credentials | Land on overview with seeded data |
| 3 | Wrong password | Inline error; no crash; values preserved |
| 4 | Sign up new account | New dealership, **empty** dashboard — exercises every empty state |
| 5 | Sign out | Redirect to login; back button doesn't restore the dashboard |

### Vehicles CRUD
| # | Case | Expected |
|---|---|---|
| 6 | Add a car with valid data | Appears in list; KPIs and charts move |
| 7 | Add with blank make | Inline validation, nothing written |
| 8 | Status `sold` with no sale price | Readable message — the CHECK never surfaces raw |
| 9 | Status `listed` with a sale price filled | Rejected with instruction to clear it |
| 10 | `sold_on` earlier than `acquired_on` | Rejected |
| 11 | Edit prices | Cost stack and margin recompute |
| 12 | Delete a car with recon jobs | Car and its jobs both gone (cascade); no orphans |

### Reconditioning CRUD
| # | Case | Expected |
|---|---|---|
| 13 | Add a job | Appears; cost stack widens; category chart moves |
| 14 | Negative cost | Rejected |
| 15 | Toggle complete | Persists across reload |
| 16 | Delete a job | Cost basis drops accordingly |

### Analytics correctness
| # | Case | Expected |
|---|---|---|
| 17 | Hand-total one car's recon jobs | Matches `recon_total` in the view |
| 18 | Margin of a sold car | `sold_price − acquisition − recon`, to the dirham |
| 19 | Category chart total | Equals `recon_spend_total` KPI |
| 20 | Month buckets | A car sold on the 1st and one on the 30th land in the same bar |

### Realtime
| # | Case | Expected |
|---|---|---|
| 21 | Two tabs, edit in one | Other updates without reload; flash marks the change |
| 22 | Two *different users* in two browsers | Each sees only their own changes — realtime respects RLS |
| 23 | Kill the network | Indicator → Offline; page still usable; recovers on reconnect |

### UI states
| # | Case | Expected |
|---|---|---|
| 24 | Fresh account | Empty states everywhere, each naming the next action |
| 25 | Throttle to Slow 3G | Skeletons matching final geometry; no layout jump |
| 26 | Break the Supabase URL | `error.tsx` with retry — never a white screen |
| 27 | 375px viewport | No horizontal scroll; all actions reachable |
| 28 | Keyboard only, full CRUD | Every control reachable, focus always visible |
| 29 | `prefers-reduced-motion: reduce` | No animation |

---

## 3. Automated / tooling checks

| Check | Command | Bar |
|---|---|---|
| Types | `npx tsc --noEmit` | Zero errors |
| Lint | `npm run lint` | Zero errors |
| Production build | `npm run build` | Succeeds; no build-time data errors |
| Lighthouse (deployed, mobile) | Chrome DevTools | Accessibility ≥ 95; Performance noted honestly in the build log whatever it says |
| Console | Every screen | No errors, no React warnings |

---

## 4. Pre-submit ritual — run in full before pressing Submit

Submission **locks permanently**, so this is not a rubber stamp.

- [ ] Live URL opens in a **fresh incognito window**
- [ ] Demo credentials in the README actually sign in
- [ ] A reviewer following "Setup from zero" on a clean machine could stand it up
- [ ] Repo is **public**; `02-dashboard/` has README, BUILD_LOG, `.env.example`
- [ ] **Secret scan:** `git log -p | grep -iE "eyJ|sk-|service_role|supabase.co|password"` → only placeholders
- [ ] `.env.local` is untracked (`git check-ignore -v .env.local`)
- [ ] Loom video plays from incognito (sharing set to anyone-with-link)
- [ ] Every core-requirement box honestly ticked; the three advanced options ticked
- [ ] Notes field used to disclose known limitations
- [ ] You can answer the drill in `07` without notes
- [ ] **Only then:** Submit
