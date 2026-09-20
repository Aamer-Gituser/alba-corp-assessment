# BUILD_LOG — Alba Market Pulse

**Assessment:** Alba Corp Vibe Coder — Task 03, n8n Automation Workflow
**Build date:** 20 September 2026
**Active build time:** approximately 2 hours 05 minutes (within the required 2–4 hour task window)
**Status:** working workflow, importable JSON, live verification evidence captured

## Goal and scope

Alba Market Pulse runs at 07:00 Asia/Dubai and can also be run manually. It fetches three RSS sources, normalises and time-filters articles, scores them against UAE automotive business keywords, removes duplicates, asks Gemini for structured summaries, and delivers a styled Gmail digest. Google Sheets stores one auditable row per delivered article.

The workflow deliberately stays small enough to explain and operate in the assessment time-box. Full-article scraping, Slack delivery, a database, and a reusable sub-workflow are documented follow-up ideas rather than unfinished hidden scope.

## Implementation record

| Phase | Evidence of work | Time on 20 Sep 2026 (IST) |
|---|---|---:|
| Architecture, source list, scoring and error design | `PLAN.md`, `src/nodes/` | 25 min |
| n8n JSON builder and workflow assembly | `src/build.mjs`, `workflow/*.json` | 35 min |
| Credentials, live import and configuration | n8n Cloud | 25 min |
| Live happy path, idempotency and degraded-feed checks | Gmail, Sheets, n8n executions | 25 min |
| Documentation, evidence index and video preparation | README and `docs/` | 15 min |
| **Total active build time** | **2 h 05 min** | |

## Key decisions

**Fan-out and explicit fan-in.** `Build Source List` emits one item per feed. `Fetch Feed` retries each item independently; `Merge Feed Results` then appends successful articles and failure records before scoring. A dead source therefore becomes visible partial-run data instead of silently stopping the morning digest.

**Gemini through HTTP Request.** The model call uses Header Auth with `x-goog-api-key`, keeping the secret in n8n credentials. The live project confirmed `gemini-2.5-flash` through the Models API. The request URL is built from `Config.geminiModel`, so the configured model and transport cannot silently drift apart.

**Fallback before delivery.** Gemini returns structured JSON when available. If it is unavailable, rate-limited, or malformed, `Build Digest Email` uses the feed blurb's first sentence and labels the digest as extractive fallback. The useful report still arrives.

**Commit after delivery.** Article hashes are read before scoring and committed after Gmail and Sheets. This avoids marking an article delivered before the recipient has received it. The Sheet is the human-auditable idempotency layer for manual runs; static data is the fast production layer.

## Dead ends and fixes

| Issue | What happened | Resolution |
|---|---|---|
| Google News UAE RSS locale | `hl=en-AE&gl=AE&ceid=AE:en` returned a redirect with no usable body | Kept UAE/Dubai terms in the query and used the working US RSS locale |
| Gemini model mismatch | An earlier `gemini-2.5-flash-lite` URL returned 404; the project Models API listed `gemini-2.5-flash` | Config and HTTP URL now use the confirmed `gemini-2.5-flash` model |
| XML source identity | The XML node replaces the incoming item and drops source metadata | `Attach Source Meta` restores paired source metadata before normalisation |
| Duplicate delivery | Manual executions do not reliably persist static data | Google Sheets history is read before scoring and proves the second-run quiet branch |

## Verification performed on 20 September 2026

- `node src/build.mjs` completed successfully: 21 main nodes including the explicit Merge node, no dangling connections, and the error workflow exported separately.
- Main workflow imported into n8n Cloud without unknown-node warnings.
- Gmail OAuth2, Google Sheets OAuth2, and Gemini Header Auth were connected in n8n; no credential values are stored in this repository.
- Successful live run delivered an HTML digest with Gemini summaries, category labels, relevance explanations, and a “summaries: Gemini” footer.
- Successful Sheet proof contains `aiEnriched = yes` and categories including `EV`, `Industry`, and `Regulation`.
- Immediate repeat run delivered the quiet-note email and reported previously sent items, proving the history-based duplicate check.
- A deliberately unavailable source was handled as a partial run and did not stop the remaining sources.
- Separate Error Trigger workflow was imported and wired to an alert email.
- Repository evidence is stored in `evidence/`; the exact mapping is in `docs/REQUIREMENTS_MAP.md`.
- Secret review found no real API key or OAuth token in tracked files. `.env.example` contains placeholders only.

## Known limitations

- The model receives RSS headlines and blurbs, not full article pages. This keeps the workflow fast and avoids paywalls and unnecessary token usage.
- Google Sheets is suitable for a reviewer-visible ledger but is not a transactional database. If the Sheet is unavailable after email delivery, an operator should reconcile the run before retrying.
- The static-data ledger is best for active production executions; the Sheet provides the persistent manual-run history.
- There is no reusable sub-workflow because extracting one would add setup complexity without improving this assessment's delivered result.

## Evidence index

| File | Proof |
|---|---|
| `evidence/01-ai-enriched-email.png` | Delivered HTML email with Gemini summaries and “summaries: Gemini” |
| `evidence/02-sheets-ai-enriched.png` | Sheet rows with `aiEnriched = yes` and AI categories |
| `evidence/03-idempotency-quiet-note.png` | Second-run quiet-note output and duplicate counts |
| `evidence/04-degraded-feed-quiet-note.png` | Controlled degraded-source run |
| `evidence/05-main-workflow-canvas.png` | Main workflow canvas with Merge and branches |
| `evidence/06-error-handler-workflow.png` | Separate Error Trigger → alert workflow |
