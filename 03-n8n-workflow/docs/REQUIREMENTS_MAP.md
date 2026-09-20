# Requirements Map — Task 03

Every line the assessment asks for, mapped to where it is satisfied and what proves it.
Run through this before ticking a single box on the submission form.

---

## Core requirements (all mandatory)

| # | Requirement (brief wording) | Implementation | Evidence |
|---|---|---|---|
| 1 | **A trigger** — schedule/cron, webhook, or manual | `Daily 07:00 GST` (cron, Asia/Dubai) **and** `Run Manually` | [`evidence/05-main-workflow-canvas.png`](../evidence/05-main-workflow-canvas.png) |
| 2 | **External data** — ≥1 real API call or scrape | `Fetch Feed` HTTP node × 3 RSS sources, plus the Gemini REST call | [`evidence/01-ai-enriched-email.png`](../evidence/01-ai-enriched-email.png) |
| 3 | **Transformation** — reshape the data | `Config` (Set), `Attach Source Meta` (Set), `Parse RSS` (XML), 8 Code nodes, date windowing | `NODE_REFERENCE.md` §9, §11 |
| 4 | **Conditional logic** — IF/Switch and/or a loop | `Any New Relevant News?` (IF) · `Fetch Feed` two-output error branch · per-feed item fan-out from `Build Source List` | [`evidence/04-degraded-feed-quiet-note.png`](../evidence/04-degraded-feed-quiet-note.png) |
| 5 | **Error handling** — deliberate, not accidental | Four independent layers, see below | [`evidence/04-degraded-feed-quiet-note.png`](../evidence/04-degraded-feed-quiet-note.png), [`evidence/06-error-handler-workflow.png`](../evidence/06-error-handler-workflow.png) |
| 6 | **A delivered, verifiable output** | Gmail HTML digest **and** Google Sheet history log | [`evidence/01-ai-enriched-email.png`](../evidence/01-ai-enriched-email.png), [`evidence/02-sheets-ai-enriched.png`](../evidence/02-sheets-ai-enriched.png) |

### Requirement 5 in detail — the four error layers

| Layer | Mechanism | Failure it absorbs |
|---|---|---|
| 1 | `retryOnFail` ×3, 2s backoff on `Fetch Feed` | transient 5xx / timeout |
| 2 | `onError: continueErrorOutput` → `Note Failed Source` | a feed that is permanently dead |
| 3 | `onError: continueRegularOutput` on Gemini and both Sheets nodes | rate-limited LLM, unconfigured sheet |
| 4 | Separate **Error Trigger** workflow → alert email | anything unhandled: credentials, delivery, unexpected throw |

---

## Bonus items (explicitly listed in the brief)

| Bonus | Claimed | Where |
|---|---|---|
| LLM/AI node for summarising or classifying | ✅ | `Summarise with Gemini` — one-sentence summary, category, and relevance per article |
| Merging data from two or more sources | ✅ | `Merge Feed Results` appends successful and failed feed records before `Dedupe, Score & Rank` |
| A reusable sub-workflow | ❌ | **Not done.** Cut for the time-box; recorded in Known Limitations |
| Retry/backoff on flaky calls | ✅ | `Fetch Feed` 3 tries / 2s, `Summarise with Gemini` 2 tries / 3s |
| Idempotency (re-running doesn't duplicate) | ✅ | Two layers: static-data ledger + Google Sheet history, committed only after delivery |

---

## Documentation requirements (all 5)

| # | Requirement | Lives in |
|---|---|---|
| 1 | **What and why** — what it does, why it's useful | `README.md` §1 |
| 2 | **Node-by-node walkthrough** — every significant node, how data moves | `README.md` §3, sourced from `docs/NODE_REFERENCE.md` |
| 3 | **Setup and credentials** — placeholders, never real secrets | `README.md` §4 + `docs/SETUP_GUIDE.md` + `.env.example` |
| 4 | **How to run it** — manual trigger or wait for schedule | `README.md` §5 |
| 5 | **How to verify it worked** — exactly what to see and where, **with a screenshot from a successful run** | `README.md` + `evidence/` |

---

## Hand-in requirements

| # | Requirement | Plan |
|---|---|---|
| 1 | Live n8n instance (preferred), with credentials | Live n8n Cloud instance is configured; repository remains the reproducible hand-in |
| 2 | **Or** exported workflow JSON + everything needed to import it | `workflow/*.json` + `docs/SETUP_GUIDE.md` — this route is explicitly allowed |
| 3 | `README.md` | Present at folder root |
| 4 | `BUILD_LOG.md` | Present at folder root; dated 20 September 2026 |
| 5 | Video walkthrough | `docs/VIDEO_SCRIPT.md`; add final Loom URL to the submission form |

---

## Repository rules

| Rule | Status |
|---|---|
| Folder stands on its own: README, build log, `.env.example`, run instructions | Task 4 |
| **Never commit real secrets** | Enforced by the Task 4 Step 4 grep and the Task 6 `git log -p` scan |
| Monorepo layout `/01-web-app`, `/02-dashboard`, `/03-n8n-workflow` | This folder is `03-n8n-workflow` |
| Root `README.md` linking every live version and video | Written when Tasks 1 and 2 land |

---

## Pre-submit checklist (from the form — tick only what is genuinely true)

- [ ] All URLs are working and accessible
- [ ] Repository is public or shared with reviewer
- [ ] `BUILD_LOG.md` is included
- [ ] Video walkthrough is recorded and linked

### Our own additions, from `ASSESSMENT_RULES.md` §11

- [ ] Interviewer-style Q&A rehearsal passed before recording
- [ ] Workflow JSON re-imported from the GitHub raw link into a clean n8n workspace
- [ ] Known Limitations list written and pasted into the form's Notes field
- [ ] Repo opened in a private browser window to confirm public visibility
