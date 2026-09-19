# ⚠️ MASTER RULES FILE — Alba Corp "Vibe Coder" Engineering Assessment

> **THIS FILE IS THE SOURCE OF TRUTH FOR ALL 3 TASKS.**
> Read before starting any task. Check against it before submitting any task.
> Do not deviate. Every rule here comes directly from the official assessment brief.

---

## 0. Assessment Overview

| Field | Value |
|---|---|
| Position | Vibe Coder |
| Company | Alba Corp. (devtest.albacars.ae) |
| Duration | 3 days (~6–10 hours total) |
| Tasks | 3 (each submitted separately, each locks on submit) |
| Status tracking | https://devtest.albacars.ae/apply/onfbdgbvtx2hgz/status |

**Their stated philosophy:**
> "You're not judged on hand-written code. You're judged on what you build, how well you understand it, and how clearly you walk us through it."

---

## 1. Ground Rules (all 6 — verbatim intent)

| # | Rule | What it means in practice |
|---|---|---|
| 01 | **Use AI freely.** Anything you'd reach for on the job is fair game. | No restriction. AI-assisted is expected. |
| 02 | **You don't have to write code by hand. But you MUST understand everything you hand in and be able to talk through it.** | ⚠️ **HIGHEST RISK ITEM.** Video + interview will test this. Every architectural decision must be explainable by the candidate, unprompted. |
| 03 | **Document as you go.** Each task needs a short build log. Jot it down while you work, don't reconstruct it at the end. | BUILD_LOG.md written *during* build, at checkpoints. Reconstructed logs read fake to reviewers. |
| 04 | **Be honest with the clock.** Each task ≈2–4h. If you run over, stop, note where you landed, say what you'd do next. | *"A well-documented 80% beats a mysterious 100% every time."* |
| 05 | **Working beats feature-packed.** | *"A smaller thing that runs flawlessly and is well explained wins over an ambitious mess."* |
| 06 | **Own your limitations.** | *"Flagging a bug or a shortcut you took actually helps your score. Hiding it hurts."* |

---

## 2. Scoring Rubric (weights are official)

| Dimension | Weight | What it actually rewards |
|---|---|---|
| **Product Quality & Polish** | **25%** | Real typography, coherent look, meaningful motion, fast perceived loading, graceful empty/error/loading states. Must feel *finished*, not "localhost demo". |
| **Technical Judgment & Architecture** | **25%** | Where the client/server line sits, caching strategy, schema design, security boundaries. The *decisions*, not the framework. |
| **Creative Problem Solving** | **20%** | Topic choice + the one "genuinely advanced" feature. Non-obvious beats obvious. |
| **Communication & Documentation** | **20%** | Stranger can run it from zero. Build log shows real reasoning, real dead ends. |
| **Speed & Resourcefulness** | **10%** | Time-boxed well, honestly reported. |

> **Polish + Architecture = 50% of total score.** A narrow, obsessively-polished app with a real architectural story beats a feature-rich app with default styling and no error states.

---

## 3. Submission Structure (MANDATORY)

**Ideal (we are using this):** one GitHub monorepo:

```
/01-web-app          → Task 1: Creative, API-Integrated Web App
/02-dashboard        → Task 2: Data Dashboard on a Backend Service
/03-n8n-workflow     → Task 3: n8n Automation Workflow
README.md            → root, links every live URL + video
```

**Each folder MUST stand on its own and contain:**
- [ ] `README.md`
- [ ] `BUILD_LOG.md`
- [ ] `.env.example` (placeholders only)
- [ ] Instructions to run it

### 🚨 HARD RULE (stated twice in the brief)
> **"Never commit real secrets. Live API keys or credentials in a repo are an instant red flag."**

Before every push: verify `.env*` is gitignored, verify no key in client bundle, verify `.env.example` has placeholders only.

---

## 4. What to Hand In — per task (all 4 required)

| # | Deliverable | Notes |
|---|---|---|
| 01 | **Live URL** | Vercel / Netlify / Cloudflare Pages. (Task 3: reachable n8n instance OR importable JSON.) |
| 02 | **Source Repository** | Git repo or monorepo folder, with clear README.md. |
| 03 | **BUILD_LOG.md** | Process journal. "A handful of lines per phase is plenty. We want your reasoning, not an essay." |
| 04 | **Video walkthrough** | Demo it + talk through **one part you're proud of** and **one part that fought you**. Marked "optional" in the form field but listed as a required hand-in. **We treat it as REQUIRED.** |

### Video rule
**One separate video per task** — each task's submission form has its own Video URL field. Do NOT submit one combined video.

---

## 5. BUILD_LOG.md Template (official — use verbatim structure)

```markdown
# Build Log: [Assignment Name]

## Goal & scope decision
- What I chose to build and why. What I deliberately left out to fit the time-box.

## Stack & tooling
- Frameworks, libraries, BaaS, AI tools I used and why.

## Key decisions & trade-offs
- Decision: ... because ... (alternative considered: ...)
- (repeat for each meaningful fork in the road)

## Hard parts / dead ends
- What fought back, and how I got past it (or worked around it).

## How I verified it works
- What I tested, edge cases checked, anything automated, what I'd add with more time.

## Known limitations
- Honest list of bugs, shortcuts, or things I'd do differently.

## Time spent
- Rough breakdown by phase.
```

---

## 6. TASK 01 — Creative, API-Integrated Web App (2–4h)

**Brief:** *"Pick a topic you actually find interesting and build a polished, single-purpose app around a public API. The bar isn't 'it works.' It's 'I'd happily put this in my portfolio.'"*

### Core Requirements (ALL required)
| # | Requirement | Acceptance bar |
|---|---|---|
| 1 | **Third-party API** | ≥1 real third-party API (resource list or bring your own) |
| 2 | **Creative, distinctive UI** | NOT default component-library dashboard look. "Show some taste." |
| 3 | **Smooth animation & performance** | 60fps target, no jank on scroll/route change, respectable Lighthouse on mid-range device |
| 4 | **Proper states** | Loading = **skeletons & shimmers, not just a spinner**; plus empty, error, and sensible response when a request fails |
| 5 | **Good practices** | Reasonable component structure, accessible markup, responsive down to mobile, **no secrets in client code** |
| 6 | **Docs** | Feature list, architecture overview, how to run it, API quirks encountered |

### Advanced Options — pick ≥1 (tick in form)
- [ ] **Your own backend (big bonus)** — Next.js BFF: API keys server-side, caching layer (ISR/edge/KV/Redis), rate limits with retry+backoff, graceful upstream failure
- [ ] Multi-API data fusion — 2+ sources blended into one view neither gives alone
- [ ] High-performance lists — infinite scroll + windowing + prefetching + skeletons, smooth at thousands of items
- [ ] Shareable, URL-synced state — debounced server-backed search, filters in URL
- [ ] A signature animation — shared-element/FLIP, scroll-driven, or physics-based, holding 60fps

### Documentation Requirements (all 4)
1. **API choice** — which API(s) and why
2. **Architecture** — where the client/server line sits, where caching lives
3. **Advanced feature** — how it works
4. **How I tested this** — what you clicked through, edge cases, automated checks

### Available API resources
| API | Category | Auth |
|---|---|---|
| TMDB | Movies & TV | Free API key |
| RAWG | Video games | Free API key |
| NASA Open APIs | Space | Free key (demo key works) |
| The Met / Art Institute of Chicago | Art | No key |
| Open-Meteo | Weather | No key, no signup |
| TheCocktailDB / TheMealDB | Food & drink | Free key |
| REST Countries | Geography | No key |
| Finnhub / Alpha Vantage | Finance | Free key |
| Spotify Web API | Music | OAuth 2.0 |
| PokeAPI | Games / data | No key |

### Pre-submit checklist (from form)
- [ ] All URLs are working and accessible
- [ ] Repository is public or shared with reviewer
- [ ] BUILD_LOG.md is included
- [ ] Video walkthrough is recorded and linked
- [ ] ≥1 advanced option ticked

---

## 7. TASK 02 — Data Dashboard on a Backend Service (2–4h)

**Brief:** topic with naturally structured, multi-entity data. **≥2 related entities** (so schema isn't trivial) and data worth charting.
Suggested topics: expense/finance tracker, habit tracker, small CRM, inventory manager, project/task board, fitness log.

**Backend:** Supabase (recommended by them), Appwrite, or Convex. **Must explain why you chose it.**

> ⚠️ **"Authentication is the baseline for the advanced part — add auth, PLUS at least one of the advanced options. The strongest submissions do auth plus RLS plus one more, and explain how they checked the security boundary actually holds."**

### Core Requirements (ALL required)
1. **Full CRUD** on main entities with optimistic or clearly-handled UI feedback
2. **Charts and data viz** — ≥2 visualisations that actually mean something (not decorative)
3. **A beautiful, fluid UI** — smooth list/detail transitions, thoughtful empty & loading states, responsive
4. **The backend doing real work** — data lives in the BaaS (not local state/JSON), using real features (tables/collections, relationships, queries)
5. **Docs that include the data model** — full schema (tables/collections, fields, types, relationships), storage buckets, functions/edge functions, config to stand it up from scratch

### Advanced Options — pick ≥1 (auth is baseline, on top of it)
- [ ] **Secure, isolated data** — auth + RLS/permission rules; **prove user A can't read user B's rows**
- [ ] **Real-time updates** — two tabs, edit one, other updates live via subscriptions
- [ ] **Server-computed analytics** — aggregations in DB views/functions/edge functions, not browser
- [ ] **File storage** — uploads to a bucket with previews and sensible access rules

### Documentation Requirements (all 6)
1. Backend choice — and why
2. Full schema — diagram is a nice touch
3. Services used — buckets/functions/services
4. Advanced feature verification — especially the security boundary if RLS
5. Setup from zero — run locally + provision backend from scratch
6. **A way in** — seeded demo data or one-command seed script, **plus test credentials** so reviewer can log in and poke around with no setup

### Pre-submit checklist (from form — 9 items, heaviest task)
- [ ] Live URL
- [ ] Github Repo
- [ ] README.md file
- [ ] BUILD_LOG.md file
- [ ] A way into the app
- [ ] Video Demo
- [ ] All URLs are working and accessible
- [ ] Repository is public or shared with reviewer
- [ ] BUILD_LOG.md is included
- [ ] ≥1 advanced option ticked

---

## 8. TASK 03 — n8n Automation Workflow (2–4h)

**Brief:** *"Automate a real task end-to-end. Skip 'fetch one URL and print it.' Build something with branching, transformation, and an output a real person would actually want."*

Suggested ideas: topic news digest · price/availability watcher · job/listing aggregator · repo activity report · lead enrichment pipeline.

**Bonus points for:** LLM/AI node for summarising or classifying · merging data from 2+ sources · a reusable sub-workflow · retry/backoff on flaky calls · idempotency (re-running doesn't create duplicates).

### Core Requirements (ALL required)
1. **A trigger** — schedule/cron, webhook, or manual
2. **External data** — ≥1 real API call (HTTP Request node) or a scrape
3. **Transformation** — reshape the data (Code/Function, Set, Item Lists, Aggregate, Date/Time…)
4. **Conditional logic** — IF/Switch branching and/or a loop; not just a straight line
5. **Error handling** — deliberate: error-trigger workflow, or continueOnFail with a handled branch. *"Don't let one bad API response quietly kill the run."*
6. **A delivered, verifiable output** — email, Slack/Discord, Google Sheet/Notion row, generated report/PDF, or webhook response. *"We need to be able to see the result."*

### What to Hand In (differs from other tasks)
1. **Live n8n instance (preferred)** — free cloud tier fine, with credentials so they can open and run it
2. **OR: exported workflow JSON** + everything needed to import and run it
3. **README.md** — see below

### Documentation Requirements (all 5)
1. **What and why** — what the workflow does and why it's useful
2. **Node-by-node walkthrough** — what each significant node does, how data moves between them
3. **Setup and credentials** — which API keys/connections needed, how to set up (**placeholders, never real secrets**)
4. **How to run it** — trigger manually or wait for schedule
5. **How to verify it worked** — exactly what to see and where (the email that lands, the sheet that fills, the Slack message) — **with a screenshot or sample from a successful run**

### Pre-submit checklist (from form)
- [ ] All URLs are working and accessible
- [ ] Repository is public or shared with reviewer
- [ ] BUILD_LOG.md is included
- [ ] Video walkthrough is recorded and linked

---

## 9. Form Mechanics

| Field | Notes |
|---|---|
| Live URL | `https://your-app.vercel.app` |
| Repository URL | `https://github.com/you/repo` |
| Video URL (optional) | `https://loom.com/…` |
| Attachments | Drop files / click to upload |
| Notes (optional) | Known limitations, decisions, anything else |

- **Save Draft** — stores progress, nothing sent for review, can return anytime.
- **Submit** — ⚠️ **sends for review and LOCKS. Cannot be changed after.** Double-check everything first.
- Checkboxes are self-reported and saved with the draft. **Do not tick anything that isn't genuinely true** — a reviewer clicking a dead link after you ticked "all URLs working" is worse than an honest note in the Notes field.

---

## 10. Official Resources Provided

| Resource | Purpose |
|---|---|
| [Vercel](https://vercel.com/) | Free frontend hosting |
| [Railway](https://railway.app/) | Backend hosting |
| [Loom](https://loom.com/) | Video recording |
| [Supabase](https://supabase.com/) | BaaS (Task 2) |
| [n8n Cloud](https://n8n.io/) | Automation (Task 3) — free trial |

---

## 11. Our Non-Negotiable Internal Rules (self-imposed, to protect the score)

1. **Understanding gate** — before each video, run an interviewer-style Q&A rehearsal on the candidate's own architecture. If any answer is shaky, revisit that code together until it isn't. Rule 02 is the highest-risk item in this assessment.
2. **Build log in real time** — append to BUILD_LOG.md at every phase boundary, not at the end.
3. **Secrets audit before every push** — `.gitignore` verified, no key in client bundle, `.env.example` placeholders only.
4. **Deploy early, not last** — get the live URL working before final polish, so deployment bugs surface with time left.
5. **Test in a fresh incognito window** — the reviewer's first load is a cold, unauthenticated, uncached one. Test that exact path.
6. **Honest limitations section** — every task ships with a real Known Limitations list. Rule 06 makes this a score *gain*.
7. **Scope frozen before build** — decide what's explicitly OUT before writing code, and record it in the build log's "Goal & scope decision".

---

_Last updated: 2026-09-19 · Keep this file at repo root. Every task references it._
