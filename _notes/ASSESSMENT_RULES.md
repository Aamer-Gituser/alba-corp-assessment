# ⚠️ IMPORTANT — Alba Corp Assessment: Rules, Format & Standing Orders

**This file is the single source of truth. Paste/reference it at the start of every task chat.**
**This folder (`_notes/`) is gitignored — reviewers must never see it.**

---

## 0. Standing orders (agreed with user)

1. Every task is built to the letter of its brief — no missed checkbox, no missed doc requirement.
2. Time-box is respected (2–4h/task). If over, we STOP, document where we landed + what's next.
3. User must be able to defend every line in the video walkthrough AND a live interview.
   → After each task: rehearsal Q&A before recording.
4. Never commit real secrets. `.env.example` with placeholders only. Verify before every push.
5. Known limitations are documented honestly — the brief says this *raises* the score.
6. Build log is written *during* the work, not reconstructed at the end.

---

## 1. Assessment overview

- **Role:** Vibe Coder, Alba Corp. (`devtest.albacars.ae`)
- **Window:** 3 days, ~6–10 hours total
- **Tasks:** 3 independent submissions, each with its own form, checklist, and **own video**
- **Submission locks on submit** — no edits afterwards.

### Ground rules (verbatim intent)
| # | Rule | What it means for us |
|---|---|---|
| 01 | Use AI freely | No restriction on tooling |
| 02 | Needn't hand-write code, **but must understand everything and talk through it** | The real bar. Video + interview are comprehension checks |
| 03 | Document as you go | BUILD_LOG.md written live, not at the end |
| 04 | Be honest with the clock | "A well-documented 80% beats a mysterious 100%" |
| 05 | Working beats feature-packed | "A smaller thing that runs flawlessly... wins over an ambitious mess" |
| 06 | Own your limitations | Flagging a bug/shortcut **helps** the score; hiding hurts |

### Scoring weights
| Dimension | % | Where it's won |
|---|---|---|
| Product Quality & Polish | 25 | Typography, motion, loading/empty/error states, responsive |
| Technical Judgment & Architecture | 25 | Client/server line, caching, schema, security boundary |
| Creative Problem Solving | 20 | Topic choice + the advanced feature |
| Communication & Documentation | 20 | README, BUILD_LOG, video clarity |
| Speed & Resourcefulness | 10 | Scope discipline, honest time reporting |

**Polish + Architecture = 50%.** Narrow + flawless + well-argued beats broad + rough.

### Universal deliverables (every task)
1. Live URL (Vercel/Netlify/Cloudflare) — n8n: live instance or importable JSON
2. Source repo with clear README.md
3. BUILD_LOG.md
4. Video walkthrough — demo + **one part proud of** + **one part that fought you**
   (form says "optional", the hand-in list treats it as required → always record)

### Repo structure (their stated ideal)
```
/01-web-app
/02-dashboard
/03-n8n-workflow
README.md          ← root, links every live URL + video
```
Each folder stands alone: README, BUILD_LOG.md, `.env.example`, run instructions.
**Hard rule:** never commit real secrets — "an instant red flag".

### BUILD_LOG.md template (7 sections, verbatim from brief)
```
# Build Log: [Assignment Name]
## Goal & scope decision
## Stack & tooling
## Key decisions & trade-offs
## Hard parts / dead ends
## How I verified it works
## Known limitations
## Time spent
```

### Free resources given
Vercel (hosting) · Railway (backend hosting) · Loom (video) · Supabase (BaaS)

---

## 2. TASK 01 — Creative, API-Integrated Web App (2–4h)

**Build:** polished single-purpose app on ≥1 public API. Bar = "I'd put this in my portfolio."

**Core requirements (all mandatory):**
1. Third-party API (their list or own)
2. Creative, distinctive UI — *not* default component-library dashboard look
3. Smooth animation + performance — 60fps, no scroll/route jank, respectable Lighthouse
4. Proper states — skeletons/shimmers (not just a spinner), empty, error, failed-request handling
5. Good practices — component structure, accessible markup, responsive to mobile, **no secrets in client code**
6. Docs — feature list, architecture overview, how to run, API quirks

**Advanced options (pick ≥1, tick it in the form):**
- **Your own backend (big bonus)** — Next.js BFF: keys server-side, caching (ISR/edge/KV/Redis), rate-limit retry+backoff, graceful upstream failure
- Multi-API data fusion
- High-performance lists (infinite scroll + windowing + prefetch)
- Shareable URL-synced state (debounced server-backed search, filters in URL)
- A signature animation (shared-element/FLIP, scroll-driven, physics)

**Doc requirements:** API choice + why · Architecture (client/server line, where caching lives) · How the advanced feature works · How I tested this

**API list:** TMDB (key) · RAWG (key) · NASA (demo key ok) · The Met / Art Institute (no key) · Open-Meteo (no key) · TheCocktailDB/MealDB (key) · REST Countries (no key) · Finnhub/Alpha Vantage (key) · Spotify (OAuth2) · PokeAPI (no key)

**Submit checklist:** URLs working · repo public/shared · BUILD_LOG included · video linked · ≥1 advanced option ticked

---

## 3. TASK 02 — Data Dashboard on a Backend Service (2–4h) ← HEAVIEST

**Build:** dashboard over a BaaS with ≥2 related entities and data worth charting.
Suggested topics: expense/finance tracker · habit tracker · small CRM · **inventory manager** · project/task board · fitness log

**Backend:** Supabase (their recommended — SQL + RLS) / Appwrite / Convex. **Must justify the choice.**

**Critical note (verbatim):** *"Authentication is the baseline for the advanced part — add auth, plus at least one of the advanced options. The strongest submissions do auth plus RLS plus one more, and explain how they checked the security boundary actually holds."*

**Core requirements (all mandatory):**
1. Full CRUD on main entities, optimistic or clearly-handled UI feedback
2. ≥2 visualisations that actually mean something (not decorative)
3. Beautiful fluid UI — list/detail transitions, empty + loading states, responsive
4. Backend doing real work — data in the BaaS, real tables/relationships/queries
5. Docs including the data model — full schema, buckets, functions, config to stand it up from scratch

**Advanced options (≥1, on top of auth):**
- **Secure, isolated data** — auth + RLS; *prove* user A can't read user B's rows
- **Real-time updates** — two tabs, edit one, other updates via subscriptions
- **Server-computed analytics** — aggregation in DB views/functions/edge functions, not the browser
- **File storage** — uploads to a bucket with previews + access rules

**Doc requirements (6):** Backend choice + why · **Full schema** (diagram is a nice touch) · Services used · Advanced feature + **how the security boundary was verified** · Setup from zero (local + provision backend) · **A way in** — seeded demo data / one-command seed script **+ test credentials**

**Submit checklist (9 items):** Live URL · GitHub repo · README.md · BUILD_LOG.md · A way into the app · video · URLs working · repo public/shared · BUILD_LOG included · ≥1 advanced option ticked

---

## 4. TASK 03 — n8n Automation Workflow (2–4h)

**Build:** end-to-end useful automation. Explicitly NOT "fetch one URL and print it."
Ideas: topic news digest · price/availability watcher · job/listing aggregator · repo activity report · lead enrichment pipeline

**Core requirements (all mandatory):**
1. A trigger — schedule/cron, webhook, or manual
2. External data — ≥1 real HTTP Request call or scrape
3. Transformation — Code/Set/Item Lists/Aggregate/Date-Time
4. Conditional logic — IF/Switch branching and/or a loop (not a straight line)
5. Error handling — error-trigger workflow or continueOnFail + handled branch; one bad response must not silently kill the run
6. Delivered, verifiable output — email/Slack/Discord/Sheet/Notion/report/PDF/webhook response

**Bonus points:** LLM/AI node · merging ≥2 sources · reusable sub-workflow · retry/backoff · idempotency (re-run makes no duplicates)

**Hand in:** live n8n instance with credentials (preferred) **or** exported workflow JSON + everything needed to import/run

**Doc requirements (5):** What & why · **Node-by-node walkthrough** (incl. how data moves) · Setup + credentials (**placeholders only**) · How to run it · **How to verify it worked** — exactly what to see and where, with a screenshot/sample from a successful run

---

## 5. Pre-submit ritual (run for EVERY task before hitting Submit)

- [ ] Open the live URL in a **fresh incognito window** — it loads, no console errors
- [ ] Demo credentials actually log in (Task 02)
- [ ] GitHub repo is **public**, README + BUILD_LOG + `.env.example` present
- [ ] `git log -p | grep -iE "eyJ|sk-|service_role|password|secret"` → no real keys
- [ ] Video plays from an incognito window (sharing permissions correct)
- [ ] Every core-requirement checkbox honestly ticked; advanced option(s) ticked
- [ ] "Notes" field used to disclose known limitations
- [ ] Only then: Submit (it locks permanently)
