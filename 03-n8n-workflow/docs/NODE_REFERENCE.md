# Node Reference — Alba Market Pulse

Every node, what it does, why it exists, and what it hands to the next one.
This is the source for the README's node-by-node walkthrough and for the video script.

---

## Main workflow — `Alba Market Pulse — Daily UAE Auto Digest` (20 nodes)

### 1. `Daily 07:00 GST` — Schedule Trigger
Fires daily at 07:00 Asia/Dubai. The digest is meant to be read before the showroom opens,
so the schedule is the product decision, not an afterthought.
**Out:** one empty item.

### 2. `Run Manually` — Manual Trigger
A second entry point into the same chain so a reviewer can execute on demand instead of
waiting until morning. The brief asks for "a trigger"; shipping both costs one node and
makes the workflow demonstrable.
**Out:** one empty item.

### 3. `Config` — Set (raw JSON)
Single source of truth: feed list, keyword weights, relevance threshold, lookback window,
max items, Gemini model, recipient, sheet ID. Every downstream node reads it with
`$('Config').first().json`, so tuning the digest never means editing code.
**Out:** one item containing the whole config object.

### 4. `Load Seen Hashes` — Google Sheets (read)
Idempotency layer 2. Pulls previously-delivered article hashes from the history sheet.
- `alwaysOutputData: true` — an empty sheet returns zero rows, and a node with zero items
  does not execute in n8n, which would stall the whole chain. This forces one empty item through.
- `onError: continueRegularOutput` — if the sheet is not configured at all, the run continues
  with static data alone rather than failing.
**Out:** one item per history row (or one empty item).

### 5. `Build Source List` — Code
Fan-out. Reads `Config.sources[]` and emits **one item per feed**. This is the structural
decision that makes per-source error isolation possible: because the next node receives N items,
it executes N times, and a failure belongs to one item instead of the run.
Throws deliberately if `sources` is empty — a misconfiguration should fail loudly, not silently
send an empty digest.
**Out:** N items — `{ sourceId, sourceName, sourceUrl, sourceWeight }`.

### 6. `Fetch Feed` — HTTP Request
Fetches each feed as text.
- `retryOnFail`, `maxTries: 3`, `waitBetweenTries: 2000` — RSS endpoints are flaky; three
  attempts with backoff absorbs transient 5xx and timeouts.
- `onError: continueErrorOutput` — anything still failing leaves on **output 1** instead of
  aborting. This is the requirement "don't let one bad API response quietly kill the run."
- A browser-ish `User-Agent`, because some publishers reject default automation agents.
- `timeout: 15000`, response forced to `text` into `data`.
**Out 0 (ok):** `{ data: "<rss…>" }` · **Out 1 (fail):** original item + `error`.

### 7. `Parse RSS` — XML
Converts the raw XML string in `data` into a JSON tree using xml2js, the same parser the
local verification harness uses.
**Out:** the parsed tree — and *nothing else*, which is the problem the next node solves.

### 8. `Attach Source Meta` — Set
The XML node **replaces** the item, discarding which feed the XML came from. This re-attaches
`sourceName` and `sourceWeight` using `$('Build Source List').item`, n8n's paired-item lookup,
which walks the lineage back to the correct source even though failed feeds have shifted the
indices. `includeOtherFields: true` keeps the parsed tree.
**Out:** parsed tree + source identity.

### 9. `Normalize & Window` — Code
The messiest node, and the one worth talking about on video. RSS in the wild is inconsistent:
- `<item>` is an object for single-entry feeds, an array otherwise
- `<link>` is a string in RSS 2.0, an array of objects with `$.href` in Atom
- text arrives CDATA-wrapped, HTML-escaped, or full of markup
- dates come as RFC-822, ISO-8601, or `dc:date`
- the same story carries different `utm_*` parameters per feed

It flattens all of that to one shape, strips tracking parameters to canonicalise the URL,
hashes that URL with djb2 as the idempotency key, and drops anything older than
`Config.lookbackHours` — which both keeps the digest current and caps the tokens sent to the LLM.
**Out:** one item per in-window article — `{ hash, title, url, summarySource, publishedAt, sourceName, sourceWeight }`.

### 10. `Note Failed Source` — Code
Reached only from `Fetch Feed` output 1. Converts a failure into a data record carrying the
source name and reason, so the digest can say "2 of 3 sources responded" instead of quietly
reporting less news.
**Out:** one item per dead feed, flagged `__degradedSource: true`.

### 11. `Dedupe, Score & Rank` — Code
The decision layer. Both branches converge here, so it first splits degraded notices from
real articles. Then:
- **Idempotency layer 1** — `$getWorkflowStaticData('global').seenHashes`. Fast, no external
  call, but n8n only persists static data on production (scheduled) executions.
- **Idempotency layer 2** — hashes read from the Google Sheet. Survives manual runs and is
  human-auditable, which is what actually makes it safe for a reviewer to hit Execute twice.
- **Dedupe** — same hash from two feeds collapses to one.
- **Scoring** — each configured keyword contributes its weight; a hit in the **headline counts
  ×3** versus one buried in the blurb, then the total is multiplied by the source weight.
  Anything under `minScore` is dropped.
- **Ranking** — sorted by score, then recency, capped at `maxItems`.
**Out:** exactly one item — `{ hasNews, articles[], stats{} }`.

### 12. `Any New Relevant News?` — IF
Branches on `hasNews`. Both sides deliver something; the false branch is a deliberate empty
state, not a dead end.

### 13. `Compose LLM Prompt` — Code
Builds the Gemini request body in version-controlled JavaScript rather than inline in the HTTP
node, so the prompt is reviewable in a diff. Sends only `id`, `title`, `source`, and a trimmed
blurb — less context means lower cost and less room for the model to invent detail.
Sets `responseMimeType: 'application/json'`, which is the difference between parsing a response
and regexing prose out of a markdown fence.
**Out:** one item — `{ geminiModel, geminiBody }`.

### 14. `Summarise with Gemini` — HTTP Request
POSTs to `…/models/{model}:generateContent` with Header Auth (`x-goog-api-key`), so the key
lives in n8n's credential store and never in the exported JSON.
`onError: continueRegularOutput` — a rate-limited or erroring LLM must **downgrade** the digest,
not cancel it.
**Out:** the Gemini response, or an error object that the next node tolerates.

### 15. `Build Digest Email` — Code
Parses the model's JSON, then assembles subject line and HTML body.
The fallback path is the point: if the response is missing, malformed, or fence-wrapped, it
catches, falls back to the first sentence of the feed blurb, and stamps the footer
"extractive fallback (LLM unavailable)". The digest still ships and honestly says how it was built.
Also renders the amber "Partial run" banner when any source failed.
**Out:** one item — `{ subject, html, aiStatus, marketTakeaway, articles[], stats }`.

### 16. `Send Digest` — Gmail
The deliverable. HTML email to `Config.digestRecipient`.

### 17. `Expand History Rows` — Code
The digest is one item (one email); the history log needs one row per article. Fans back out.
Positioned **after** the send, so nothing is recorded as delivered until it was.
**Out:** one item per article, shaped to the sheet's header row.

### 18. `Append History` — Google Sheets (append)
Auto-maps input fields to matching column headers. `onError: continueRegularOutput` — the email
has already gone out, so a logging failure must not fail the run.

### 19. `Commit Seen Ledger` — Code
Writes the delivered hashes into static data, capped at a rolling 500 so the ledger cannot grow
unbounded across months of daily runs. **Ordering is the design:** this runs last, after delivery.
If the email had failed, these hashes stay unseen and tomorrow's run retries them.

### 20. `Send Quiet Note` — Gmail (false branch)
A no-news day still reports itself, with the counts explaining *why* nothing qualified
(already sent / duplicates / below threshold / sources failed). Silence would be
indistinguishable from a broken schedule.

---

## Error workflow — `Alba Market Pulse — Error Handler` (3 nodes)

### 1. `On Workflow Error` — Error Trigger
Registered as the main workflow's Error Workflow. Fires only for failures the in-flow branches
did **not** already handle — credentials, delivery, or an unexpected throw.

### 2. `Format Error Alert` — Code
Extracts workflow name, failing node, execution id, message, and execution URL into a readable
HTML alert.

### 3. `Send Failure Alert` — Gmail
Emails the alert with a deep link to the failed execution.

---

## Data shape at each stage

| Stage | Items | Shape |
|---|---|---|
| After `Build Source List` | 3 | `{ sourceId, sourceName, sourceUrl, sourceWeight }` |
| After `Fetch Feed` (ok) | 0–3 | `{ data: "<xml>" }` |
| After `Fetch Feed` (fail) | 0–3 | original + `error` |
| After `Normalize & Window` | 0–300 | one per in-window article |
| After `Dedupe, Score & Rank` | 1 | `{ hasNews, articles[≤8], stats }` |
| After `Build Digest Email` | 1 | `{ subject, html, … }` |
| After `Expand History Rows` | ≤8 | one per delivered article |
