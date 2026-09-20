# Master Delivery Plan — Alba Corp Vibe Coder Assessment

> **Status: AWAITING APPROVAL.** This sequences the three task plans. Read alongside `ASSESSMENT_RULES.md`.

> **Task 02 review update — 2026-09-20:** its current source/screenshot audit and repair plan are in [the Task 02 plan](2026-09-19-task-02-dashboard.md) and [the detailed package](../../_notes/02-dashboard/00-MASTER-PLAN.md). These supersede the historical Task 02 scope/timing below. Task 02 is implemented in part but not submission-ready; profile editing is a requested addition, and realtime remains conditional on verification. This update does not review or modify Task 01/03 implementation.

---

## What gets delivered

| # | Name | What it is | Advanced options claimed |
|---|---|---|---|
| 01 | **Apogee** | NASA plate archive — travel to any date since 1995 and see that day's photograph of the universe | Your own backend · Shareable URL-synced state |
| 02 | **Forecourt** | Vehicle inventory and reconditioning dashboard on Supabase | Auth + RLS and server analytics targeted; realtime conditional; none certified by this plan |
| 03 | **Forecourt Signal** | Daily automotive market-intelligence digest in n8n | LLM · multi-source merge · retry/backoff · idempotency · sub-workflow |

All three live in one monorepo: `https://github.com/Aamer-Gituser/alba-corp-assessment`

```
alba-corp-assessment/
├── README.md               ← links every live URL and video
├── ASSESSMENT_RULES.md     ← the rules this work is graded against
├── docs/plans/             ← these four planning documents
├── 01-web-app/             ← README · BUILD_LOG · .env.example · VIDEO_SCRIPT
├── 02-dashboard/           ← README · BUILD_LOG · .env.example · VIDEO_SCRIPT · supabase/ · scripts/
└── 03-n8n-workflow/        ← README · BUILD_LOG · VIDEO_SCRIPT · *.json · screenshots/
```

---

## Build order, and why

**01 → 03 → 02.**

Not the numeric order. The reasoning:

1. **Task 01 first.** It has the fewest external dependencies — one API key, one deploy. It gets a live URL on the board early, which de-risks the whole submission, and it warms up the Next.js + Vercel path that Task 02 also needs.
2. **Task 03 second.** It is mostly clicking in n8n rather than writing code, so it is the natural thing to do when focus is dropping. Its credentials (Google OAuth) take real wall-clock time to authorise, and starting that early means the waiting overlaps with other work.
3. **Task 02 last, with the most time.** It is the heaviest: auth, RLS, two entities of CRUD, three charts, a view, real-time, a seed script, and a security proof. Its checklist has nine items against the others' four. Doing it last means it inherits every lesson from the first two, but it also means it is the one at risk if the clock runs out — so its scope has a defined drop order (below).

---

## Time budget

| Block | Work | Target |
|---|---|---|
| 1 | Task 01 build + deploy + docs | 2h 35m |
| 2 | Task 03 build + docs | 3h 00m |
| 3 | Task 02 build + deploy + docs | 3h 55m |
| 4 | Three videos + interview rehearsal | 1h 30m |
| 5 | Final submission pass, all three forms | 30m |
| | **Total** | **≈11h 30m** |

The brief says 6–10 hours across 3 days. The historical 11h30 estimate exceeds that range; it is not evidence of time compliance. For Task 02, count all earlier planning/coding and follow the stopping rule in the current Task 02 plan. Actual time remains to be reconciled; this review does not grant a fresh time-box.

---

## Drop order if time runs short

Cut from the bottom. Each line is safe to lose without failing a core requirement.

| Order | Drop | Cost |
|---|---|---|
| 1 | Task 02 realtime | Remove unused subscription and Task 02 publication exposure; auth + RLS + analytics retain the recommended combination |
| 2 | Task 01 "load earlier plates" paging | Grid becomes a fixed 12; still satisfies every core requirement |
| 3 | Task 02 third volume chart | Keep the monthly contribution and recon-category charts; two are the stated minimum |
| 4 | Task 03 NHTSA source | Two sources remain; still satisfies multi-source merge |
| 5 | Task 03 sub-workflow, inline the error email | Loses one bonus, keeps deliberate error handling |

**Never droppable, in any scenario:** live URL · public repo · BUILD_LOG.md · `.env.example` with placeholders · Task 02's demo credentials · the RLS proof · a real screenshot of a successful n8n run · secrets audit before every push.

---

## The rule that decides the outcome

Ground rule 02: *"You don't have to write code by hand. But you do need to understand everything you hand in and be able to talk through it."*

Every other requirement can be satisfied by shipping. This one can only be satisfied by understanding. The plan handles it in three places:

1. **During each build**, after every task, a short explanation of what was built and why that approach was chosen over the alternative.
2. **Before each video**, an interview-style Q&A rehearsal — Task 01 §12, [current Task 02 drill](../../_notes/02-dashboard/07-VIDEO-AND-INTERVIEW.md), Task 03 §12. Any shaky answer means going back to the actual code together before recording.
3. **In each video**, the "one part I'm proud of / one part that fought me" segments are scripted from real events in the build log, not invented afterwards.

---

## Pre-submission gate — run for every task, no exceptions

Submission **locks** on submit. There is no edit afterwards.

- [ ] Live URL opens in a **fresh incognito window** — not a cached tab
- [ ] Repository is **public**, verified while signed out of GitHub
- [ ] `BUILD_LOG.md` exists in the task folder and has all seven sections filled
- [ ] `README.md` covers every documentation point the brief lists for that task
- [ ] `.env.example` has placeholders; `git ls-files | grep env` finds no real env file
- [ ] `grep` for key-shaped strings across the task folder comes back clean
- [ ] Video is recorded, uploaded, and the link opens in a private window
- [ ] Advanced options ticked match what was actually built
- [ ] Notes field contains the honest known-limitations summary
- [ ] Every checkbox ticked on the form is genuinely true

---

## Root README contents

One table, filled in as each task completes:

| Task | Live URL | Repo folder | Build log | Video |
|---|---|---|---|---|
| 01 — Apogee | _pending_ | `/01-web-app` | link | link |
| 02 — Forecourt | _pending_ | `/02-dashboard` | link | link |
| 03 — Forecourt Signal | _pending_ | `/03-n8n-workflow` | link | link |

Plus, for each: one line on what it is, the advanced options claimed, and the demo credentials where relevant.

---

## Open decisions needing approval

| # | Decision | Recommendation |
|---|---|---|
| 1 | Task 01 topic — NASA plate archive | Recommended: visual quality is free, and the rate limit makes the backend story genuine rather than decorative |
| 2 | Task 02 topic — car dealership inventory | Recommended: fits "inventory manager" from the brief's own list, has a real 1:N relationship, and the KPIs are actual dealership metrics |
| 3 | Task 03 topic — automotive news digest | Recommended: exercises every required node type and five of five bonus criteria |
| 4 | Build order 01 → 03 → 02 | Recommended: gets a live URL early, overlaps OAuth waiting, protects the heaviest task with the most remaining time |
| 5 | Names: Apogee · Forecourt · Forecourt Signal | Change freely — cosmetic only |
| 6 | LLM provider for Task 03 | OpenAI `gpt-4o-mini` — cheapest node with a first-class n8n integration |
