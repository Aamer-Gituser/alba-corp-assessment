# Alba Market Pulse — Daily UAE Automotive Digest

> **Alba Corp Vibe Coder Assessment — Task 03: n8n Automation Workflow**

An n8n workflow that wakes at **07:00 Gulf Standard Time**, pulls UAE automotive news from three RSS feeds, deduplicates and scores it against a business keyword list, summarises the top stories with Google Gemini, and emails a styled HTML digest — while logging every delivered article to Google Sheets.

---

## Why This Exists

Alba Cars is a Dubai used-car marketplace. A pricing analyst or buyer's assistant who opens their inbox at 07:05 and sees "3 stories about resale values in UAE today, 1 about EV tariffs, 1 about import finance" has a 5-minute edge before the day starts. That is the product idea. The LLM doesn't replace judgement — it gives a one-sentence frame so the reader decides whether to click.

---

## Architecture

```
Daily 07:00 GST (cron) ─┐
Run Manually ───────────┴→ Config (Set)
   → Load Seen Hashes (Sheets read)
   → Build Source List (fan-out: 1 item per feed)
   → Fetch Feed (HTTP, retry ×3, 2s backoff)
        ├── ok   → Parse RSS → Attach Source Meta → Normalize & Window
        └── fail → Note Failed Source
   → Dedupe, Score & Rank   ← both branches merge here
   → IF: Any New Relevant News?
        ├── true  → Compose LLM Prompt → Summarise with Gemini
        │           → Build Digest Email → Send Digest (Gmail)
        │           → Expand History Rows → Append History (Sheets)
        │           → Commit Seen Ledger
        └── false → Send Quiet Note (Gmail)

Error workflow: On Workflow Error → Format Error Alert → Send Failure Alert
```

**Fan-out/fan-in** — one item per feed means a dead feed fails its own path, not the whole run.

**Two-layer idempotency** — n8n static data (fast, production only) + Google Sheets (survives manual runs). Running Execute twice will not duplicate articles.

**LLM as optional enhancement** — if Gemini rate-limits, the digest downgrades to extractive summaries and ships anyway. The footer says which path ran.

**Four error layers:**
1. `retryOnFail` ×3 on each feed fetch
2. `onError: continueErrorOutput` → failed feeds become a data record, not a crash
3. `onError: continueRegularOutput` on Gemini + Sheets nodes
4. Separate Error Trigger workflow for unhandled failures

See [docs/NODE_REFERENCE.md](docs/NODE_REFERENCE.md) for the full node-by-node walkthrough.

---

## Setup from Zero (≈ 15 minutes)

Full step-by-step: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

**Quick version:**

1. Create a Google Sheet named `Alba Market Pulse — History`, tab `Digest History`, headers: `hash | sentAt | title | url | source | category | score | summary | aiEnriched`
2. Get a Gemini API key at https://aistudio.google.com (free)
3. Import `workflow/alba-market-pulse.json` and `workflow/alba-error-handler.json` into n8n
4. Connect credentials: Gmail OAuth2, Google Sheets OAuth2, Gemini Header Auth (`x-goog-api-key`)
5. In the `Config` node, set `digestRecipient` and `historySheetId`
6. Register `Alba Market Pulse — Error Handler` as the main workflow's Error Workflow
7. Click **Execute Workflow**

Expected: all nodes green, digest email arrives, rows added to Sheets.

---

## Advanced Features

| Feature | Where | What to look for |
|---|---|---|
| LLM summarisation | `Compose LLM Prompt` + `Summarise with Gemini` | Email footer: "AI-enriched" vs "extractive fallback" |
| Multi-source merge | `Dedupe, Score & Rank` | Articles from different sources in one digest |
| Two-layer idempotency | `Dedupe, Score & Rank` + `Commit Seen Ledger` | Run Execute twice — second run sends nothing |
| Per-feed error isolation | `Fetch Feed` output 1 → `Note Failed Source` | Set one feed URL to invalid — amber banner appears |
| Quiet-day handling | `Any New Relevant News?` false branch | Raise `minScore` to 999 in Config — quiet-note email |

---

## How I Tested It

See [BUILD_LOG.md §5](BUILD_LOG.md) for the full verification checklist with pass/fail.

Key tests:
- Two consecutive executions — no duplicate articles
- One feed URL broken — partial run, amber banner, email still delivers
- `minScore` set to 999 — quiet-note email received, no crash
- Secrets grep: `grep -r "AIza" .` returns nothing

---

## Rebuilding the JSON from Source

```bash
npm install
node src/build.mjs
```

Edit Code-node logic in `src/nodes/*.js` and tunables in `src/workflow.config.json`, then rebuild. The build validates the node graph and refuses to emit a workflow with dangling connections.

---

## Known Limitations

- No reusable sub-workflow (bonus item, cut for time-box — see BUILD_LOG)
- Summaries are based on feed blurbs only, not full articles
- Static-data ledger resets on n8n Cloud restarts; Google Sheets layer compensates

---

## Repo Layout

```
03-n8n-workflow/
├── workflow/
│   ├── alba-market-pulse.json      # importable, 20 nodes
│   └── alba-error-handler.json     # importable, 3 nodes
├── src/
│   ├── build.mjs                   # generates + validates JSON
│   ├── workflow.config.json        # all tunables (no secrets)
│   └── nodes/                      # Code-node JS, one file per node
├── docs/
│   ├── NODE_REFERENCE.md           # every node explained
│   ├── SETUP_GUIDE.md              # zero-to-running
│   └── REQUIREMENTS_MAP.md         # brief → implementation mapping
├── README.md
├── BUILD_LOG.md
└── .env.example                    # placeholders only, never real values
```
