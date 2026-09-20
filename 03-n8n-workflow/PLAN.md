# Alba Market Pulse — Implementation Plan (Task 03, n8n Automation Workflow)

> **Status: IMPLEMENTED AND VERIFIED — 20 September 2026.** The live workflow is configured in n8n Cloud and the reproducible source/export is in this folder.

**Goal:** A scheduled n8n workflow that collects UAE automotive-market news from three feeds, deduplicates and scores it against a business keyword list, summarises the survivors with an LLM, and emails a styled daily digest — while surviving a dead feed, a rate-limited LLM, and a double-click on Execute.

**Architecture:** Fan-out/fan-in. A Config node holds every tunable value. One item is emitted per feed so a single failing source drops into an error branch instead of killing the run. Successful feeds are parsed, normalised, merged back with the failure notices, then deduplicated and ranked in one decision node. An IF node splits "we have news" from "quiet day", and both branches deliver something. Idempotency is two-layered: n8n static data (fast, production runs) plus a Google Sheet (persistent, survives manual runs).

**Tech Stack:** n8n Cloud (free tier) · Google Gemini REST API (free tier) · Gmail node · Google Sheets node · Node.js 24 for the local build/test tooling.

---

## Global Constraints

Copied from `../ASSESSMENT_RULES.md`. Every task inherits these.

| Constraint | Value |
|---|---|
| Time-box | 2–4 hours total for this task; stop and document if exceeded |
| Secrets | **Never commit real secrets.** `.env.example` placeholders only. Stated twice in the brief as an instant red flag |
| Required deliverables | Live n8n instance **or** importable JSON · `README.md` · `BUILD_LOG.md` · video walkthrough |
| Build log | Written *during* the build at phase boundaries, not reconstructed at the end |
| Honesty | Known limitations listed explicitly — the brief scores this as a gain |
| Understanding gate | Every decision must be explainable unprompted on video and in interview |
| Repo path | `03-n8n-workflow/` inside `github.com/Aamer-Gituser/alba-corp-assessment` |

---

## 1. Scope Decision

### In scope
- Three RSS sources (two Google News queries, one publisher feed) merged into one digest
- Keyword-weighted relevance scoring with a configurable threshold
- URL-canonicalising dedupe (same story from two feeds collapses to one)
- LLM summarisation + categorisation with a non-LLM fallback path
- HTML email digest + Google Sheet history log
- Dedicated error-handler workflow

### Explicitly OUT (recorded here so the build log's scope section is honest)
- **Reusable sub-workflow** — a bonus item. The fetch+parse chain is the natural candidate, but extracting it costs ~30 min and buys no new capability inside the time-box. Listed as a known limitation.
- **Scraping any dealership or classifieds site** — deliberately avoided. Scraping a competitor of the hiring company is a bad look and a fragile dependency. RSS is stable and sanctioned.
- **Slack/Discord delivery** — email + Sheet already satisfy "delivered, verifiable output" with fewer accounts to provision.
- **Full-article fetching** — feed blurbs are enough for a digest and keep us inside the LLM free tier.

---

## 2. Topic Justification

**Alba Market Pulse — daily UAE automotive market intelligence.**

- Matches the brief's own suggested idea #1 ("Topic news digest"), so it cannot be judged out of scope.
- Topic is the hiring company's industry (Alba Cars — Dubai used-car marketplace), which is where the Creative Problem Solving 20% is won. The demo line is *"your pricing team could open this on Monday morning."*
- RSS needs no API keys, so the reviewer's setup burden is one Google account and one Gemini key.

---

## 3. Node Design (21 nodes, main workflow)

```
Daily 07:00 GST (cron) ─┐
Run Manually ───────────┴→ Config
   → Load Seen Hashes (Sheets read)
   → Build Source List (fan-out: 1 item per feed)
   → Fetch Feed (HTTP, retry ×3, 2s backoff)
        ├── output 0 (ok)   → Parse RSS → Attach Source Meta → Normalize & Window
        └── output 1 (fail) → Note Failed Source
   → Dedupe, Score & Rank        ← both branches converge here
   → IF: Any New Relevant News?
        ├── true  → Compose LLM Prompt → Summarise with Gemini → Build Digest Email
        │           → Send Digest (Gmail) → Expand History Rows
        │           → Append History (Sheets) → Commit Seen Ledger
        └── false → Send Quiet Note (Gmail)
```

Second workflow: `On Workflow Error` → `Format Error Alert` → `Send Failure Alert`.

Full per-node specification lives in `docs/NODE_REFERENCE.md`.

### Three decisions worth defending in interview

1. **Code-node JavaScript lives in `src/nodes/*.js`; `src/build.mjs` generates the importable JSON.**
   An n8n export squashes every Code node into one escaped string — unreviewable in a pull request. Generating the JSON keeps the repo readable and lets the build validate the graph (dangling connections, unreachable nodes) before n8n ever sees it.

2. **Gemini is called via HTTP Request, not the native AI node.**
   Imports cleanly on any n8n version with no LangChain package dependency, and the retry/`onError` semantics stay identical to the other HTTP node — one failure model across the whole workflow. The key sits in n8n's credential store as Header Auth, never in the JSON.

3. **The ledger commits last, after delivery.**
   If the email fails, those hashes stay unseen and tomorrow's run retries them. Committing before delivery would silently swallow a day of news.

---

## 4. Requirement Coverage

| Brief requirement | Where it is satisfied |
|---|---|
| A trigger | `Daily 07:00 GST` (cron) **+** `Run Manually` (reviewer runs instantly) |
| External data | `Fetch Feed` × 3 RSS sources + `Summarise with Gemini` |
| Transformation | `Config` (Set), `Attach Source Meta` (Set), `Parse RSS` (XML), 8 Code nodes, date windowing |
| Conditional logic | `Any New Relevant News?` (IF) + HTTP error-output branch + per-feed item fan-out |
| Error handling | `continueErrorOutput` → handled branch · retry ×3 with backoff · LLM `continueRegularOutput` fallback · separate Error Trigger workflow |
| Delivered, verifiable output | Gmail HTML digest **+** Google Sheet history (shareable link) |

**Bonus items claimed:** LLM node ✅ · 2+ sources merged ✅ · retry/backoff ✅ · idempotency ✅ (two layers) · reusable sub-workflow ❌ (documented limitation)

---

## 5. Credentials Required

Never committed. `.env.example` carries placeholders only; the real values live in n8n's credential store.

| Credential | n8n type | How to obtain | Used by |
|---|---|---|---|
| `GEMINI_API_KEY` | Header Auth (`x-goog-api-key`) | aistudio.google.com → Get API key (free tier) | Summarise with Gemini |
| Gmail OAuth | Gmail OAuth2 | n8n's built-in Google sign-in | Send Digest, Send Quiet Note, Send Failure Alert |
| Google Sheets OAuth | Google Sheets OAuth2 | same Google account | Load Seen Hashes, Append History |
| `DIGEST_RECIPIENT` | plain config value | your email address | Config node |
| `HISTORY_SHEET_ID` | plain config value | from the Sheet URL | Config node |

Step-by-step provisioning: `docs/SETUP_GUIDE.md`.

---

## 6. File Structure

```
03-n8n-workflow/
├── PLAN.md                        ← this file
├── README.md                      ← required deliverable (Task 4)
├── BUILD_LOG.md                   ← required deliverable, written during build
├── .env.example                   ← placeholders only
├── package.json                   ← build + test scripts, xml2js dev dependency
├── src/
│   ├── workflow.config.json       ← feeds, keyword weights, thresholds  [DRAFTED]
│   ├── build.mjs                  ← generates + validates workflow JSON [DRAFTED]
│   ├── verify.mjs                 ← local harness, real feeds           [Task 1]
│   └── nodes/
│       ├── build-source-list.js       [DRAFTED]
│       ├── normalize-and-window.js    [DRAFTED]
│       ├── note-failed-source.js      [DRAFTED]
│       ├── dedupe-score-rank.js       [DRAFTED]
│       ├── compose-llm-prompt.js      [DRAFTED]
│       ├── build-digest-email.js      [DRAFTED]
│       ├── expand-history-rows.js     [DRAFTED]
│       ├── commit-seen-ledger.js      [DRAFTED]
│       └── format-error-alert.js      [DRAFTED]
├── workflow/
│   ├── alba-market-pulse.json     ← generated, importable [DRAFTED]
│   └── alba-error-handler.json    ← generated, importable [DRAFTED]
└── docs/
    ├── NODE_REFERENCE.md          ← node-by-node spec
    ├── SETUP_GUIDE.md             ← credential provisioning
    ├── REQUIREMENTS_MAP.md        ← requirement → evidence
    ├── VIDEO_SCRIPT.md            [Task 5]
    ├── INTERVIEW_PREP.md          [Task 5]
    └── screenshots/               ← evidence from a real run [Task 3]
```

`[DRAFTED]` = written during the pre-approval spike; regenerated or revised once this plan is approved.

---

## 7. Tasks

### Task 1: Prove the parsing and scoring logic locally

The n8n editor is a slow place to debug a text parser. This harness runs the real Code-node
sources against real feed responses, so by the time anything is imported the only unknowns
left are credentials.

**Files:**
- Create: `src/verify.mjs`
- Modify: `package.json` (add `"verify": "node src/verify.mjs"`)
- Uses: `src/nodes/normalize-and-window.js`, `src/nodes/dedupe-score-rank.js`

**Interfaces:**
- Consumes: `workflow.config.json` (`sources[]`, `keywords[]`, `minScore`, `maxItems`, `lookbackHours`)
- Produces: console report — per-feed item counts, normalised sample, dedupe/scoring stats. Exit code 1 on failure.

- [ ] **Step 1: Write the harness**

It shims the four n8n globals the Code nodes use (`$input`, `$`, `$json`, `$getWorkflowStaticData`),
fetches each configured feed, parses with `xml2js` (the same library n8n's XML node uses), and
runs the two logic nodes in sequence.

- [ ] **Step 2: Run it against live feeds**

Run: `npm run verify`
Expected: all three sources report HTTP 200 and a non-zero item count; normalisation yields
articles with non-empty `title`, `url`, `hash`, `publishedAt`; dedupe reports a stats block.

- [ ] **Step 3: Assert the three behaviours that actually matter**

  1. **Dedupe works** — feed the same article twice, expect `duplicatesCollapsed: 1`.
  2. **Idempotency works** — pre-seed a hash as "already sent", expect `alreadySent: 1` and that
     article absent from the output.
  3. **Degraded run works** — inject a fake `__degradedSource` item, expect the run to still
     produce a ranked list and report `sourcesFailed.length: 1`.

- [ ] **Step 4: Fix the Google News locale redirect**

Already diagnosed: `hl=en-AE&gl=AE&ceid=AE:en` returns **302** and redirects to the US edition.
Change both Google News URLs in `workflow.config.json` to `hl=en-US&gl=US&ceid=US:en`. Geographic
filtering stays in the query terms (`UAE OR Dubai OR "Abu Dhabi"`), which is what actually selects
the stories.

Run: `npm run verify`
Expected: no redirects, HTTP 200 direct, ≥20 items from each Google News source.

- [ ] **Step 5: Rebuild and commit**

```bash
node src/build.mjs
git add src package.json workflow
git commit -m "feat(n8n): add local verification harness for feed parsing and scoring"
```

---

### Task 2: Import into n8n Cloud and connect credentials

**Files:**
- Create: `docs/SETUP_GUIDE.md` (written first, then followed — if a step is wrong, the guide is wrong)
- Modify: `src/workflow.config.json` (real recipient + sheet ID, kept out of git via the value being non-secret but replaced before commit)

**Interfaces:**
- Consumes: `workflow/alba-market-pulse.json`, `workflow/alba-error-handler.json`
- Produces: two live workflows in n8n Cloud; three connected credentials

- [ ] **Step 1: Create the Google Sheet**

One sheet named `Digest History`, row 1 exactly:
`hash | sentAt | title | url | source | category | score | summary | aiEnriched`
Header names must match the Code node output keys — `Append History` uses auto-map mode.

- [ ] **Step 2: Get the Gemini key**

aistudio.google.com → Get API key → copy. In n8n: Credentials → Header Auth →
Name `x-goog-api-key`, Value `<the key>`. Name the credential `Gemini API Key`.

- [ ] **Step 3: Import both workflows**

n8n → Workflows → Import from File → `alba-market-pulse.json`, repeat for `alba-error-handler.json`.
Expected: no "unknown node type" warnings. If any node shows unrecognised, note the n8n version and
report back before continuing.

- [ ] **Step 4: Attach credentials and set the error workflow**

Gmail nodes (3) → Gmail OAuth2. Sheets nodes (2) → Google Sheets OAuth2.
`Summarise with Gemini` → Generic Credential Type → Header Auth → `Gemini API Key`.
Main workflow → Settings → Error Workflow → `Alba Market Pulse — Error Handler`.

- [ ] **Step 5: Fill Config**

Open the `Config` node, replace `REPLACE_WITH_YOUR_EMAIL@example.com` and
`REPLACE_WITH_GOOGLE_SHEET_ID` with real values. These stay in n8n, not in git.

---

### Task 3: Run it for real and capture evidence

**Files:**
- Evidence captured in `evidence/`: AI-enriched email, Sheet rows, quiet-note run, degraded run,
  main canvas, and Error Handler canvas.

**Interfaces:**
- Consumes: the configured workflows from Task 2
- Produces: the screenshot set the README's "How to verify it worked" section requires

- [ ] **Step 1: Execute manually, happy path**

Click Execute Workflow. Expected: every node green, an email arrives, new rows appear in the Sheet.
Screenshot the canvas and the delivered email.

- [ ] **Step 2: Execute again immediately — the idempotency proof**

Expected: the same articles are **not** re-sent. `Dedupe, Score & Rank` reports a non-zero
`alreadySent`, and either the digest contains only genuinely new items or the run takes the
quiet-day branch. This is the single most convincing 20 seconds of the demo video.

- [ ] **Step 3: Break a feed on purpose — the error-handling proof**

In `Config`, change one `sources[].url` to `https://news.google.com/rss/search?q=THIS_WILL_404_xyz`
or a nonexistent host. Execute. Expected: run completes, `Note Failed Source` shows one item,
digest arrives carrying the amber "Partial run" banner. Screenshot it, then restore the URL.

- [ ] **Step 4: Force the error workflow**

Temporarily clear the Gemini credential, or set `Config.digestRecipient` to an invalid address, to
push a failure past the handled branches. Expect the alert email from the error workflow.
Screenshot, then restore.

- [ ] **Step 5: Commit the evidence**

```bash
git add evidence
git commit -m "docs(n8n): add verification screenshots from live runs"
```

---

### Task 4: Write the required documentation

**Files:**
- Create: `README.md`, `BUILD_LOG.md`, `.env.example`
- Create: `docs/NODE_REFERENCE.md`, `docs/REQUIREMENTS_MAP.md`

**Interfaces:**
- Consumes: screenshots from Task 3, decisions recorded throughout
- Produces: the five documentation points the brief demands

`README.md` must cover, in this order (mirroring the brief):
1. **What and why** — what the workflow does and why a UAE dealership wants it
2. **Node-by-node walkthrough** — every significant node and how data moves
3. **Setup and credentials** — placeholders only, never real secrets
4. **How to run it** — manual trigger or wait for the 07:00 schedule
5. **How to verify it worked** — exactly what lands where, with the screenshots inline

`BUILD_LOG.md` uses the brief's seven-section template verbatim, including the Google News
302 discovery under "Hard parts / dead ends" and the missing sub-workflow under
"Known limitations".

- [ ] **Step 1: Write `.env.example` with placeholders only**
- [ ] **Step 2: Write `README.md` with screenshots embedded**
- [ ] **Step 3: Write `BUILD_LOG.md` from notes taken during Tasks 1–3**
- [ ] **Step 4: Secrets audit**

```bash
git grep -nEi "AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|@gmail\.com" -- . ':!*.md'
```
Expected: no output, or only the `REPLACE_WITH_*` placeholders.

- [ ] **Step 5: Commit**

```bash
git add README.md BUILD_LOG.md .env.example docs
git commit -m "docs(n8n): add README, build log and environment template"
```

---

### Task 5: Video script and interview preparation

The brief scores "how clearly you walk us through it", and Ground Rule 02 makes this the
highest-risk item in the whole assessment.

**Files:**
- Create: `docs/VIDEO_SCRIPT.md`, `docs/INTERVIEW_PREP.md`

- [ ] **Step 1: Write a 3–4 minute script**

Beats: what it does and who for (20s) → canvas tour (40s) → live manual run (40s) →
the delivered email (30s) → **proud part: two-layer idempotency, and why the ledger commits
last** (45s) → **fought-back part: the Google News 302 and the XML node dropping source
identity** (45s) → known limitations (20s).

- [ ] **Step 2: Write the interview Q&A sheet**

At minimum: Why RSS over scraping? What happens if two feeds carry the same story? Why does
the ledger commit after the email? What breaks if Gemini is down? Why not the native AI node?
Why static data *and* a Sheet? How would you scale this to 50 feeds?

- [ ] **Step 3: Rehearsal gate**

I ask the questions cold, you answer without reading. Any shaky answer means we reopen that
node together before recording. **Do not record until this passes.**

- [ ] **Step 4: Record with Loom, commit the script**

```bash
git add docs/VIDEO_SCRIPT.md docs/INTERVIEW_PREP.md
git commit -m "docs(n8n): add video script and interview preparation notes"
```

---

### Task 6: Publish and submit

- [ ] **Step 1: Initialise the monorepo and push**

```bash
cd "D:/Projects/Alba Corp"
git init -b main
git remote add origin https://github.com/Aamer-Gituser/alba-corp-assessment.git
git add .
git commit -m "feat: add Task 03 n8n automation workflow"
git push -u origin main
```

- [ ] **Step 2: Final pre-submit checks**

  - Repository is public — open it in a private browser window to confirm
  - `workflow/*.json` downloads and re-imports cleanly from the GitHub raw link
  - Video link plays for a logged-out viewer
  - `git log -p | grep -iE "AIza|sk-"` returns nothing

- [ ] **Step 3: Fill the submission form**

Live URL → the n8n instance (or the repo path to the importable JSON).
Repository URL → the GitHub link. Video URL → Loom.
Notes field → the same Known Limitations list as the build log.
Tick only boxes that are genuinely true.

---

## 8. Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Google Sheets OAuth is fiddly in n8n Cloud | Medium | Both Sheets nodes carry `onError: continueRegularOutput` and `alwaysOutputData`. Worst case: disable both, email still ships, idempotency falls back to static data, documented honestly |
| Gemini free tier rate-limits mid-demo | Medium | `Build Digest Email` falls back to extractive summaries and labels the digest "LLM unavailable" — a demonstrable feature, not a failure |
| n8n version rejects a node typeVersion on import | Low | No LangChain nodes used; all core nodes at conservative versions. Task 2 Step 3 catches it before time is spent |
| A feed changes shape or dies | Medium | Exactly what the error branch exists for — and Task 3 Step 3 demonstrates it deliberately |
| Paired-item lookup in `Attach Source Meta` returns nothing | Low | Caught by Task 3 Step 1; fallback is to carry source identity through a different node ordering |
| Time-box overrun | Medium | Sub-workflow extraction already cut. If Tasks 1–4 exceed 3h, ship with the quiet-day branch untested and say so in the build log |

---

## 9. Time Budget (target 2.5–3h)

| Phase | Target |
|---|---|
| Task 1 — local verification | 30 min |
| Task 2 — n8n import + credentials | 30 min |
| Task 3 — live runs + evidence | 25 min |
| Task 4 — documentation | 35 min |
| Task 5 — video script, rehearsal, recording | 40 min |
| Task 6 — publish + submit checks | 20 min |

---

## 10. Open Questions — need your answer before Task 1

1. **Topic** — approve "Alba Market Pulse / UAE auto market digest", or pick a different subject?
2. **Delivery channel** — Gmail + Google Sheet as planned, or do you want Slack/Discord instead?
3. **Gemini key** — can you create one at aistudio.google.com, or should the LLM step be swapped for an OpenAI/Anthropic key you already hold?
4. **Recipient** — which email address should receive the digest?
5. **Live instance vs JSON** — the brief prefers a live n8n instance with credentials shared. Are you willing to share n8n access, or do we submit the importable JSON route (also explicitly allowed)?
