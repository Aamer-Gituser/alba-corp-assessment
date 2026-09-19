# Alba Corp — Vibe Coder Assessment

Three tasks, one repo.

| Task | Name | Live URL | Folder | Build log | Video |
|---|---|---|---|---|---|
| 01 | Apogee — NASA APOD archive | _pending_ | [`/01-web-app`](./01-web-app) | [BUILD_LOG](./01-web-app/BUILD_LOG.md) | _pending_ |
| 02 | Forecourt — Dealership dashboard | _pending_ | [`/02-dashboard`](./02-dashboard) | _pending_ | _pending_ |
| 03 | Forecourt Signal — n8n digest | _pending_ | [`/03-n8n-workflow`](./03-n8n-workflow) | _pending_ | _pending_ |

---

## Task 01 — Apogee

NASA APOD plate archive. Travel to any date since 16 June 1995 and see the photograph of the universe from that day. Backend-for-frontend pattern: the API key lives on the server, never in the browser. Dual-TTL caching (1 year for historical plates, 15 min for today). Every view is a shareable URL.

**Advanced options:** Your own backend · Shareable URL-synced state

---

## Task 02 — Forecourt

Dealership inventory and enquiry pipeline dashboard. Supabase Postgres with Row-Level Security (dealers see only their own data), server-computed analytics, real-time subscriptions, and signed-URL file storage for vehicle photos.

**Advanced options:** Auth + RLS · Server-computed analytics · Real-time · File storage

---

## Task 03 — Forecourt Signal

Daily automotive market-intelligence digest built in n8n. Merges RSS feeds (Motor1, Car and Driver, Electrek) with NHTSA recall data, summarises with OpenAI gpt-4o-mini, deduplicates with a cyrb53 hash ledger in Google Sheets, and delivers a structured email.

**Advanced options:** LLM · Multi-source merge · Retry/backoff · Idempotency · Sub-workflow
