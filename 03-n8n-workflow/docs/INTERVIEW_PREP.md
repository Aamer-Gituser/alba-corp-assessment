# Interview Prep — Alba Market Pulse (Task 03)

> 25 core questions + 5 curveballs, all grounded in the actual code.
> After reading, ask the interviewer to quiz you one question at a time.

---

## Architecture & Design

**Q1. Why fan-out one item per feed instead of three separate HTTP nodes?**
> With three hardcoded HTTP nodes, a failure in node 2 stops execution. With fan-out, Build Source List emits one item per feed. n8n runs Fetch Feed once per item, so a failure in item 2 routes to `onError: continueErrorOutput` — its own error branch — while items 1 and 3 continue. Scale to 10 feeds without changing the graph.

**Q2. Why is Config a Set node with raw JSON instead of environment variables?**
> n8n doesn't expose env vars to Code nodes at runtime on the Cloud tier. A Set node with a raw JSON value makes the entire config object available to every downstream node via `$('Config').first().json`. One place to change `minScore` or add a feed without touching code.

**Q3. What happens when Gemini rate-limits?**
> `Summarise with Gemini` has `onError: continueRegularOutput`. An error response becomes a regular output item. Build Digest Email checks `response?.candidates?.[0]?.content` — if missing or malformed, it falls back to the first sentence of the feed blurb. The email still ships; the footer says "extractive fallback (LLM unavailable)."

**Q4. Why does Attach Source Meta exist? Can't Parse RSS carry the source name?**
> n8n's XML node replaces the entire item — it discards any properties the previous node added. After Parse RSS, we've lost which feed the XML came from. Attach Source Meta uses `$('Build Source List').item` — n8n's paired-item lookup that walks execution lineage — to re-attach `sourceName` and `sourceWeight` even after failed feeds have shifted the indices.

**Q5. Explain the two-layer idempotency design.**
> Layer 1: `$getWorkflowStaticData('global').seenHashes` — fast in-memory, but n8n only persists static data on production (scheduled) executions. A reviewer hitting Execute manually would have no memory between runs. Layer 2: Google Sheets — `Load Seen Hashes` reads the full history before each run. Both layers are checked in `Dedupe, Score & Rank`. Hashes are committed *after* delivery, so a failed send means next run retries.

**Q6. Why commit hashes after delivery, not before?**
> If we commit first and then the Gmail node fails, those articles are marked seen but never delivered. They'd never be retried. Committing after delivery means a failure leaves the hashes unseen — next run picks them up again. The worst case is a duplicate delivery on a retry, which is better than a silent loss.

---

## Error Handling

**Q7. What are the four error layers?**
> 1. `retryOnFail` ×3, 2s backoff on Fetch Feed — absorbs transient 5xx. 2. `onError: continueErrorOutput` on Fetch Feed — a permanently dead feed becomes a data record. 3. `onError: continueRegularOutput` on Gemini + Sheets nodes — optional enhancements must not cancel the delivery. 4. Separate Error Trigger workflow — catches credentials expiry, delivery failure, unexpected throws.

**Q8. When does the Error Trigger workflow fire vs. the in-flow error branches?**
> In-flow branches handle *expected* failures — a feed that's down, an LLM that rate-limits. The Error Trigger fires for *unexpected* failures: a node that throws an uncaught exception, a credential that expired mid-run, the Gmail node itself failing. It's the last-resort net. The distinction matters because expected failures should be handled gracefully; unexpected failures should alert someone.

**Q9. What does the quiet-note email contain and why send it at all?**
> The quiet-note email lists why nothing qualified: `alreadySeen`, `belowThreshold`, `degradedSources`, `totalConsidered`. Silence would be indistinguishable from a broken schedule. A recipient who sees nothing in their inbox doesn't know if it's a quiet news day or a workflow failure. The quiet note tells them it ran.

---

## Data & Transformation

**Q10. How does URL canonicalisation work?**
> `Normalize & Window` strips tracking parameters (`utm_*`, `ref`, `source`, `cid`, etc.) from each article URL before hashing it. The djb2 hash of the cleaned URL is the idempotency key. Without canonicalisation, the same story from two feeds with different UTM parameters would have two different hashes and appear twice.

**Q11. How does the keyword scoring work?**
> Each keyword has a weight (1–4). For each article, the function checks the title and a concatenated blurb. A keyword hit in the title scores `weight × 3`; a hit in the body scores `weight × 1`. The sum is multiplied by the feed's source weight (1–3). A story about "used cars in UAE" from the high-weight Google News feed might score 4×3 + 3×3 = 21 before the source multiplier.

**Q12. What does alwaysOutputData do on Load Seen Hashes?**
> If the Sheet is empty or unconfigured, the Google Sheets read node returns zero rows. In n8n, a node with zero output items stops execution — the chain stalls before Fetch Feed. `alwaysOutputData: true` forces at least one (empty) item through, so the run continues. The `onError: continueRegularOutput` setting handles the case where the sheet doesn't exist yet.

**Q13. How does the 36-hour lookback window work?**
> After parsing each article's `pubDate` (RSS 2.0) or `dc:date` (Atom), Normalize & Window drops anything older than `Config.lookbackHours`. This caps the token load sent to Gemini and keeps the digest current. The 36-hour window vs. 24 is intentional — it catches yesterday-evening stories that might have been published after a previous morning run.

---

## Code Architecture

**Q14. Why keep Code-node logic in .js files instead of inline in n8n?**
> n8n exports Code nodes as JSON string blobs — they're not readable in a git diff and you can't run a linter on them. Keeping logic in `src/nodes/*.js` means a reviewer can read the code directly, and `build.mjs` embeds those strings into the workflow JSON at build time. The build script also validates the graph (no dangling connections, no unreachable nodes).

**Q15. What does build.mjs validate?**
> After assembling the node graph, it walks every connection and checks: (a) the source node exists, (b) the target node exists, (c) there are no nodes with no outgoing connections except designated terminals (Send Digest, Send Quiet Note, Send Failure Alert, Commit Seen Ledger). Any violation throws and refuses to write the JSON file.

**Q16. Why is `responseMimeType: 'application/json'` set on the Gemini request?**
> Without it, Gemini returns a markdown-fenced JSON block as a string: ` ```json\n{...}\n``` `. To extract the JSON you'd have to regex it out, which is brittle. With `responseMimeType`, the API returns a raw JSON string that you can `JSON.parse` directly. This is a Gemini-specific feature that costs nothing and eliminates a parsing failure mode.

---

## Deployment & Operations

**Q17. How does a reviewer verify the workflow without waiting until 07:00?**
> The canvas has a Manual Trigger node — a second entry point into the same chain. Click Execute Workflow and the entire run fires immediately. The schedule and the manual trigger both feed the same Config node so the behaviour is identical.

**Q18. What credentials does this workflow need and where do they live?**
> Three: Gmail OAuth2 (for Send Digest, Send Quiet Note, Send Failure Alert), Google Sheets OAuth2 (for Load Seen Hashes, Append History), Gemini Header Auth (for Summarise with Gemini). All three live exclusively in n8n's credential store. The exported JSON contains the credential *name* only — no key material. A reviewer importing the JSON gets a workflow with broken credentials until they reconnect their own accounts.

**Q19. What happens if Append History fails after the email is sent?**
> `Append History` has `onError: continueRegularOutput`. The email has already gone out. A Sheets logging failure must not fail the run. The next node — Commit Seen Ledger — still runs, so static-data idempotency still works. The Sheet log will be incomplete, but the digest was delivered.

**Q20. How would you run this without n8n Cloud?**
> `docker run -it --rm -p 5678:5678 n8nio/n8n` and import the same JSON. The only difference is credentials must be reconnected. The workflow JSON is fully portable.

---

## Security & Secrets

**Q21. Prove no secrets are in the exported workflow JSON.**
> The Gemini credential is a Header Auth credential named `Gemini API Key`. In the exported JSON the node references it as `{ "id": "...", "name": "Gemini API Key" }` — the credential ID and name only. The actual `AIza...` key is stored encrypted in n8n's internal database. Run `grep -r "AIza" .` on the repo — nothing.

**Q22. What's in .env.example and why?**
> Placeholders only: `DIGEST_RECIPIENT`, `HISTORY_SHEET_ID`, `GEMINI_API_KEY` with example values. These values are not read by the workflow — they're documentation. Real values go into the n8n Config node (for non-secret tunables) or the credential store (for secrets). The file exists so a new developer knows what to provision.

---

## Trade-offs & Scale

**Q23. What breaks at 50 feeds instead of 3?**
> Build Source List fans out 50 items. Fetch Feed runs 50 times. n8n Cloud free tier has a 5-execution concurrency limit — 50 fan-out items may queue. Normalize & Window could return thousands of articles, making the Gemini prompt enormous and the Sheets log expensive. Fix: add pagination, chunk the LLM calls, or move to a database store.

**Q24. What would you change if this were production?**
> Replace static-data idempotency with a proper key-value store (Redis or a small Postgres). Add a monitoring webhook so a dead workflow sends a PagerDuty alert, not just an email. Add a configurable Slack delivery channel. Cache the Gemini responses for 24 hours so the same story doesn't burn tokens twice.

**Q25. Why Google Sheets instead of a database?**
> The brief asks for a "delivered, verifiable output." A Google Sheet is human-readable, shareable by link, requires no infrastructure, and satisfies the requirement. For a real product, a Postgres table with an index on `hash` would be faster and more reliable. Sheets is the right choice for a demo where the reviewer needs to verify the output without setting up a database.

---

## Curveballs

**CB1. What if two feeds publish the exact same URL with different UTM parameters?**
> Handled. `Normalize & Window` strips all tracking params before hashing. Both copies hash to the same djb2 value and `Dedupe, Score & Rank` collapses them to one article.

**CB2. The Gemini response comes back as a markdown fence. Your JSON.parse throws. What happens?**
> `Build Digest Email` wraps the parse in a try/catch. If parsing fails for any reason, it falls back to extractive summaries. The email ships with "extractive fallback (LLM unavailable)" in the footer. I also set `responseMimeType: 'application/json'` to prevent this in the first place.

**CB3. A feed returns 200 but the body is valid XML with zero `<item>` elements.**
> `Normalize & Window` returns an empty array — zero items. The fan-in at `Dedupe, Score & Rank` receives nothing from that branch. The run continues with whatever the other feeds produced. Zero items is not an error; it's a valid state (quiet feed today).

**CB4. Can the same execution see both the static data AND the Sheets ledger disagree?**
> Yes, but only benignly. Static data might have hashes from yesterday's scheduled run; Sheets has everything since the Sheet was created. `Dedupe, Score & Rank` unions both sets — an article seen by either is considered seen. The union is conservative: it will never send a duplicate, but might occasionally suppress a story that static data thinks was seen when the Sheet says otherwise (if static data was reset). The Sheet is the authoritative record.

**CB5. Why daily at 07:00 GST specifically?**
> Dubai's working day starts around 08:00–09:00. A 07:00 delivery gives the team the digest before they open Slack or start client calls. It also runs in the middle of the night in most Western time zones, so n8n Cloud's free-tier queues are less congested. The schedule is a product decision, not an afterthought — that's why it's framed as "before the showroom opens" in the README.

---

## One-Page Architecture Cheat Sheet

```
TRIGGERS
  ├─ Cron: daily 07:00 Asia/Dubai
  └─ Manual: Execute Workflow button

DATA SOURCES (3 RSS feeds)
  ├─ Google News — UAE used-car market   (weight 3)
  ├─ Google News — UAE auto & mobility   (weight 2)
  └─ Carscoops — global auto industry    (weight 1)

KEY TRANSFORMS
  Config        → single source of truth for all tunables
  Build Source  → fan-out: 1 item/feed enables per-feed error isolation
  Fetch + Parse → HTTP with retry, XML to JSON
  Normalize     → strip tracking params, djb2 hash, 36h window filter
  Dedupe/Score  → union seen-hashes (static + Sheets), keyword score, rank
  Compose/LLM   → Gemini 1.5 Flash JSON mode, extractive fallback

OUTPUTS
  Gmail         → HTML digest (true branch) OR quiet note (false branch)
  Google Sheets → one row per delivered article

ERROR HANDLING (4 layers)
  1. retryOnFail ×3 on Fetch Feed
  2. continueErrorOutput → dead feed becomes data record
  3. continueRegularOutput on LLM + Sheets (optional enhancements)
  4. Error Trigger workflow → failure alert email

IDEMPOTENCY (2 layers)
  1. Static data — fast, production runs only
  2. Google Sheets — persistent, survives manual runs

SECRETS
  All credentials in n8n credential store only
  Repo contains: credential NAMES, never VALUES
```
