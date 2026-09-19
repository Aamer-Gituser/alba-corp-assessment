# 01 · Requirements Matrix — every box the brief asks for

Nothing ships until every row has evidence. "Evidence" means a thing a reviewer can
click, run, or read — not an assertion.

---

## A. Core requirements (all mandatory)

| # | Brief wording | How it's met | Evidence a reviewer can check |
|---|---|---|---|
| A1 | **Full CRUD** on main entities with optimistic or clearly-handled UI feedback | Vehicles: create / edit / delete. Reconditioning jobs: create / toggle complete / delete. Server Actions with `useActionState`; every submit shows a pending state; validation failures render inline above the button | Add, edit and delete a car live on the deployed URL |
| A2 | **Charts and data viz** — at least two, meaningful not decorative | Three: (1) margin realised by month (2) reconditioning spend by category (3) vehicles bought vs sold by month | Overview screen |
| A3 | **A beautiful, fluid UI** — smooth list/detail transitions, thoughtful empty and loading states, responsive | Custom design system (04), route-level skeletons, empty states written as next actions, mobile layout at 375px | Resize the window; visit with an empty account |
| A4 | **The backend doing real work** — data in the BaaS, real tables/relationships/queries | Postgres: 3 tables, 2 enums, FK with cascade, CHECK constraints, 4 indexes, 1 view, 3 RPC functions | `supabase/migrations/0001_init.sql`; Supabase table editor |
| A5 | **Docs that include the data model** — full schema, buckets, functions, config to stand it up from scratch | README: schema table per table, Mermaid ER diagram, RPC list, "no buckets used" stated, full provisioning steps | README.md |

## B. Advanced options — brief requires ≥1 on top of auth

| # | Option | Status | Evidence |
|---|---|---|---|
| B1 | **Secure, isolated data** — "prove that user A can't read user B's rows" | ✅ | `npm run verify:rls` — signs in as dealer A, attempts SELECT / UPDATE / DELETE against dealer B's rows, prints each refusal. Output pasted in README |
| B2 | **Real-time updates** — two tabs, edit one, watch the other | ✅ | Live indicator in header; demo in the video |
| B3 | **Server-computed analytics** — aggregation in DB, not the browser | ✅ | `vehicle_economics` view + `dashboard_stats()`, `monthly_performance()`, `recon_by_category()`. Network tab shows small aggregate payloads, not raw inventory |
| B4 | File storage | ❌ Skipped | Declared in README Known Limitations with the reason |

## C. Documentation requirements (6)

| # | Brief wording | Where it lives |
|---|---|---|
| C1 | Backend choice — and why | README § Why Supabase (with the alternatives considered) |
| C2 | Full schema — "a diagram is a nice touch" | README § Data model — table specs + Mermaid ER diagram |
| C3 | Services used — buckets / functions / services | README § Services — Auth, Postgres, Realtime, RPC; explicitly no storage buckets |
| C4 | Advanced feature + **how it was verified**, especially the RLS security boundary | README § Proving the boundary holds — the script, the method, the real output |
| C5 | Setup from zero — run locally + provision backend | README § Setup from zero — 6 numbered steps, copy-pasteable |
| C6 | **A way in** — seeded data or one-command seed + test credentials | README § A way in — `npm run seed` and two logins printed at the top of the README |

## D. Hand-ins (4)

| # | Item | Plan |
|---|---|---|
| D1 | Live URL on Vercel | Deployed in phase D; verified in a fresh incognito window |
| D2 | Source repo with clear README | `02-dashboard/` in the assessment repo, public |
| D3 | BUILD_LOG.md — 7 sections, written *during* the work | Template pre-created; filled at each phase gate, not reconstructed |
| D4 | Video walkthrough — demo + one part proud of + one part that fought you | Script in 07; recorded on Loom |

## E. Hard rules

| # | Rule | Control |
|---|---|---|
| E1 | **Never commit real secrets** — "an instant red flag" | `.gitignore` covers `.env*` before the first commit; `.env.example` holds placeholders only; secret-scan step in the pre-submit ritual (05) |
| E2 | Folder stands on its own — README, build log, `.env.example`, run instructions | All four present in `02-dashboard/` |
| E3 | Honest clock | Real timings recorded per phase in BUILD_LOG § Time spent |
| E4 | Own limitations | README § Known limitations lists skipped file storage, no pagination, no dark mode, single-user dealerships |
| E5 | Submission locks on submit | Pre-submit ritual (05) run in full before pressing Submit |

## F. Self-imposed quality bar (not required, but where the 50% lives)

| # | Bar | Why |
|---|---|---|
| F1 | No dual-axis charts | Two y-scales invent a correlation that isn't in the data. Volume gets its own chart rather than riding on the margin axis |
| F2 | Categorical palette validated by script, not by eye | First teal failed the chroma floor; replacement passes all six checks (ΔE 9.8 protan) |
| F3 | Every chart has a table view | Colour is never the only channel carrying a value |
| F4 | Keyboard focus visible, `prefers-reduced-motion` respected | Accessibility is named in the brief's "good practices" |
| F5 | Money in tabular figures only where digits align in columns | Hero numbers use proportional figures — tabular at display size reads loose |
