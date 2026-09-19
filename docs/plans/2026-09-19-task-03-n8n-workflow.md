# Task 03 — Forecourt Signal: n8n Automation Workflow — Implementation Plan

> **Status: AWAITING APPROVAL.** Nothing gets built until this document is approved.

**Goal:** A daily automotive market-intelligence digest. It pulls news from multiple feeds, merges and normalises them, scores each item for relevance to a used-car dealership, drops anything already sent, summarises the survivors with an LLM, emails a formatted digest, and logs what it sent so re-running never duplicates.

**Why it is useful:** A dealer needs to know about model recalls, price movements, and EV policy changes before a customer quotes them at the counter. Reading six feeds daily is exactly the chore worth automating, and the output — one short email at 07:00 — is something a real person would keep.

**Why not "fetch one URL and print it":** The brief rules that out explicitly. This workflow branches, merges two sources, holds state between runs for idempotency, and degrades rather than dying when a feed goes down.

---

## Assessment Requirement Mapping

| # | Brief requirement | Node(s) | Task |
|---|---|---|---|
| 1 | A trigger | Schedule (daily 07:00) + Manual + Webhook — all three trigger types | 3 |
| 2 | External data — real API call or scrape | RSS Read ×3 + HTTP Request to NHTSA, looped over stocked models | 3, 4 |
| 3 | Transformation | Code: Normalise & Score · Code: Filter New · Code: Build Digest | 4, 6, 8 |
| 4 | Conditional logic | IF: any items at all · IF: any new signals · Split In Batches loop over stocked models | 3b, 5, 6 |
| 5 | **Error handling — deliberate** | `onError: continueRegularOutput` + retry on every network node, a guard branch, and a separate Error Trigger workflow | 5, 10 |
| 6 | Delivered, verifiable output | Gmail digest + Google Sheet run log | 9 |

| Bonus criterion | Done | How |
|---|---|---|
| LLM/AI node for summarising or classifying | ✅ | Summarises and categorises the top signals |
| Merging data from 2+ sources | ✅ | Two RSS feeds + one JSON API, merged |
| Reusable sub-workflow | ✅ | "Notify Failure" sub-workflow, called by the error path |
| Retry/backoff on flaky calls | ✅ | `retryOnFail`, `maxTries: 3`, `waitBetweenTries: 2000` on every network node |
| Idempotency | ✅ | Stable SHA-1 signal id, checked against a Google Sheet ledger before sending |

---

## Global Constraints

- **Never commit real credentials.** The exported JSON is scrubbed; the README uses placeholders only. This is the brief's "instant red flag".
- **One dead feed must not kill the run.** Every network node continues on failure and the workflow checks what actually arrived.
- **Re-running the workflow twice in a row must send nothing the second time.** Idempotency is a hard requirement, not a bonus we hope for.
- **The README must contain a screenshot of a real successful run** — the brief asks for it by name.
- **Time-box: 2–4 hours.**

---

## Data Flow

```
┌────────────┐ ┌────────────┐ ┌──────────────────┐
│ Schedule   │ │ Manual     │ │ Webhook (POST,   │
│ 07:00      │ │ (testing)  │ │ header-auth)     │
└─────┬──────┘ └─────┬──────┘ └────────┬─────────┘
      └──────────────┼─────────────────┘
                     ▼
      ┌───────────────────────────────────────┐
      │ 4 sources, in parallel                │  retryOnFail ×3
      │  • RSS: Motor1     (industry)         │  onError: continue
      │  • RSS: Car and Driver (buying/used)  │
      │  • RSS: Electrek   (EV & policy)      │
      │  • Stock Models → Split In Batches    │
      │      → HTTP: NHTSA per model → Wait   │  ← the loop
      │      → Recent Recalls Only (120 days) │
      └───────────────────┬───────────────────┘
                          ▼
                   ┌────────────┐
                   │   Merge    │  append, 4 inputs
                   └─────┬──────┘
                         ▼
            ┌────────────────────────┐
            │ Code: Normalise & Score│  one shape, cyrb53 id from URL, keyword score
            └────────────┬───────────┘
                         ▼
                ┌──────────────────┐
                │ IF: any items?   │── false ──▶ Stop and Error (fires error workflow)
                └────────┬─────────┘
                         ▼ true
            ┌────────────────────────┐
            │ Sheets: read ledger    │  ids already sent
            └────────────┬───────────┘
                         ▼
            ┌────────────────────────┐
            │ Code: Filter new       │  idempotency gate + min score
            └────────────┬───────────┘
                         ▼
                ┌──────────────┐
                │ IF: any new? │
                └───┬──────┬───┘
              false │      │ true
                    ▼      ▼
   ┌────────────────────┐  ┌─────────────────────┐
   │ Sheets: log quiet  │  │ Limit → top 6       │
   │ day · Respond      │  └──────────┬──────────┘
   │ {quiet_day}        │             ▼
   └────────────────────┘  ┌───────────────────────┐
                           │ LLM: summarise +      │  retry ×3, continue on error
                           │ classify each signal  │
                           └──────────┬────────────┘
                                      ▼
                           ┌───────────────────────┐
                           │ Code: Parse LLM output│  tolerates fenced / malformed JSON
                           └──────────┬────────────┘
                                      ▼
                           ┌───────────────────────┐
                           │ Code: Build Digest    │  urgent first, subject prefix
                           └──────────┬────────────┘
                                      ▼
                           ┌───────────────────────┐
                           │ Gmail: send digest    │
                           └──────────┬────────────┘
                                      ▼
                           ┌───────────────────────┐
                           │ Sheets: append ids    │  written AFTER a successful send
                           └──────────┬────────────┘
                                      ▼
                           ┌───────────────────────┐
                           │ Respond to Webhook    │  {sent, count, signals[]}
                           └───────────────────────┘

  ┌──────────────────────────────────────────────┐
  │ SEPARATE WORKFLOW: Error Trigger             │
  │   → calls "Notify Failure" sub-workflow      │
  │   → emails the failed node, message, run URL │
  └──────────────────────────────────────────────┘
```

---

## Task 1: n8n instance and project folder

- [ ] **Step 1: Create a free n8n Cloud account** at n8n.io and note the instance URL.

- [ ] **Step 2: Create the project folder**

```bash
mkdir -p "D:/Projects/Alba Corp/03-n8n-workflow/screenshots"
```

- [ ] **Step 3: Commit the skeleton**

```bash
cd "D:/Projects/Alba Corp"
git add 03-n8n-workflow/
git commit -m "chore(03-n8n): add workflow project folder"
```

---

## Task 2: Credentials

Three credentials. Set each up in n8n → Credentials, never in a node's raw fields.

| Credential | Used by | How to obtain |
|---|---|---|
| Google (OAuth2) | Gmail send, Sheets read/append | n8n → Credentials → Google OAuth2 → follow the in-app consent flow |
| OpenAI (API key) | Summarise & classify | platform.openai.com → API keys |
| — | RSS + NHTSA | No auth required |

- [ ] **Step 1: Create the Google credential and authorise Gmail + Sheets scopes.**
- [ ] **Step 2: Create the OpenAI credential.**
- [ ] **Step 3: Create the ledger spreadsheet**

A Google Sheet named `forecourt-signal-ledger` with one tab `sent`, and this header row:

| signal_id | title | url | source | score | sent_at |
|---|---|---|---|---|---|

- [ ] **Step 4: Record the sheet ID** from its URL — it goes in the README as a placeholder, never the real one.

---

## Task 3: Triggers and sources

- [ ] **Step 1: Add the Schedule Trigger** — Interval: Days, at 07:00.

- [ ] **Step 2: Add a Manual Trigger** so a reviewer can run it on demand without waiting for 07:00. The brief asks how to run it; this is the answer.

- [ ] **Step 2b: Add a Webhook Trigger** (`POST /forecourt-signal`, Respond: "Using 'Respond to Webhook' Node")

The brief lists three trigger types (schedule, webhook, manual) and three of its output types include a webhook response. Wiring all of them costs one node each, and it lets a reviewer run the whole thing with a single `curl` and see the result in the HTTP response, with no Gmail access needed:

```bash
curl -X POST https://YOUR-INSTANCE.app.n8n.cloud/webhook/forecourt-signal
```

Protect it with a **Header Auth** credential so the URL is not an open trigger for anyone who finds it. Put the header name and a placeholder value in the README. Never the real value.

- [ ] **Step 3: Add the source nodes, all wired from the triggers**

Every URL below was fetched during plan review; the results are recorded so this is not a guess.

| Node | Type | Configuration | Verified |
|---|---|---|---|
| `RSS: Industry` | RSS Read | `https://www.motor1.com/rss/news/all/` | 200, `application/rss+xml`, 20 items |
| `RSS: Buying & Used` | RSS Read | `https://www.caranddriver.com/rss/all.xml/` | 200, `text/xml`, 50 items |
| `RSS: EV & Policy` | RSS Read | `https://electrek.co/feed/` | 200, `application/rss+xml`, 100 items |
| `HTTP: NHTSA Recalls` | HTTP Request, inside the loop from Step 3b | `GET https://api.nhtsa.gov/recalls/recallsByVehicle?make={{make}}&model={{model}}&modelYear={{year}}` | 200, JSON, has `ReportReceivedDate` |

> **Correction from the first draft:** the plan originally used `https://www.autocar.co.uk/rss`. Fetching it returns **HTTP 202 with an HTML page and zero `<item>` elements** — it is not an RSS feed at all, and n8n's RSS node would have failed on it every run. It was replaced with Car and Driver, which also suits a used-car audience better. Motor1's feed was likewise tested (20 items) before being kept. Feed URLs still rot over time, which is exactly why the workflow tolerates a dead source (Step 4) and why this is listed under known limitations.

- [ ] **Step 3b: Loop the recall lookup over the models the dealership stocks**

NHTSA's recall endpoint answers per vehicle (make + model + year) and has no "recalls since yesterday" query. So the honest design is to loop over the dealership's stock. This is also the genuine loop the brief's conditional-logic requirement asks for.

1. Add a Code node `Stock Models` that emits one item per stocked model:

```js
// In production this list would come from the dealership's own inventory
// (Task 02's `vehicles` table). It is inlined here so this workflow runs
// standalone for a reviewer with no other setup.
return [
  { make: 'toyota', model: 'camry',   year: 2023 },
  { make: 'toyota', model: 'corolla', year: 2022 },
  { make: 'honda',  model: 'civic',   year: 2022 },
  { make: 'honda',  model: 'accord',  year: 2021 },
  { make: 'ford',   model: 'f-150',   year: 2022 },
  { make: 'nissan', model: 'altima',  year: 2021 },
].map((json) => ({ json }));
```

2. Add `Split In Batches` (batch size 2) → `HTTP: NHTSA Recalls` → `Wait` (1 second, to stay polite to a public API) → back to Split In Batches. The loop's done output continues to the Merge.

3. Add a Code node `Recent Recalls Only` after the loop. NHTSA returns every historical recall for the model-year, and `ReportReceivedDate` is `dd/MM/yyyy`. Without a recency filter, the first run would email recalls from years ago as if they were news:

```js
// "15/06/2023" -> Date. Keeps only recalls reported in the last 120 days.
const cutoff = Date.now() - 120 * 24 * 60 * 60 * 1000;
const parse = (s) => { const [d, m, y] = s.split('/').map(Number); return new Date(y, m - 1, d).getTime(); };

const out = [];
for (const item of $input.all()) {
  for (const r of item.json.results ?? []) {
    if (r.ReportReceivedDate && parse(r.ReportReceivedDate) >= cutoff) out.push({ json: r });
  }
}
return out;
```

> An honest consequence to state in the README: a 120-day window may legitimately return zero recalls on a given day, in which case the digest is built from the RSS sources alone. That is the design working, not a bug.

- [ ] **Step 4: Set resilience on all three**

In each node's Settings tab:
- `Retry On Fail`: on
- `Max Tries`: 3
- `Wait Between Tries`: 2000 ms
- `On Error`: **Continue (using error output)**

> This is the deliberate error handling the brief asks for. A feed that 503s is retried three times with a pause, and if it still fails the workflow keeps running with the sources that did respond, rather than dying.

- [ ] **Step 5: Add a Merge node** in **Append** mode with 4 inputs (three RSS feeds + the recall loop's output).

- [ ] **Step 6: Execute the workflow manually and confirm items arrive.**

---

## Task 4: Normalise and score

- [ ] **Step 1: Add a Code node named `Normalise & Score`** (Run Once for All Items)

```js
/**
 * Three sources with three different shapes become one.
 *
 * Each item gets a stable id derived from its URL, which is what makes the
 * whole workflow idempotent: the same article always hashes to the same id, so
 * the ledger check downstream recognises it on every future run.
 */
// A pure-JS hash on purpose. `require('crypto')` inside an n8n Code node is
// governed by the instance's allowed-builtins setting, which is restricted on
// hosted plans, so relying on it would make the workflow break on import for a
// reviewer. cyrb53 is a fast, well-distributed non-cryptographic hash; a signal
// id only needs to be stable and collision-resistant enough for a few thousand
// URLs, not secure.
const hash = (str) => {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
};

// Terms a used-car dealer actually needs to act on, weighted by how much.
const SIGNAL_TERMS = [
  { term: 'recall', weight: 5 },
  { term: 'safety', weight: 3 },
  { term: 'price', weight: 3 },
  { term: 'used car', weight: 4 },
  { term: 'resale', weight: 4 },
  { term: 'depreciation', weight: 4 },
  { term: 'ev', weight: 2 },
  { term: 'tariff', weight: 3 },
  { term: 'import', weight: 3 },
  { term: 'emissions', weight: 2 },
];

const normalised = [];

for (const item of $input.all()) {
  const d = item.json;

  // RSS gives title/link/contentSnippet; NHTSA gives Component/Summary/NHTSACampaignNumber.
  const isRecall = Boolean(d.NHTSACampaignNumber);

  const title = isRecall
    ? `Recall ${d.NHTSACampaignNumber}: ${d.Component ?? 'unspecified component'}`
    : (d.title ?? '').trim();

  // Each recall needs its own URL. A shared "nhtsa.gov/recalls" link would hash
  // every recall to the SAME id, so the ledger would treat all future recalls
  // as already sent after the first one. The campaign number makes it unique.
  const url = isRecall
    ? `https://www.nhtsa.gov/?nhtsaId=${encodeURIComponent(d.NHTSACampaignNumber)}`
    : (d.link ?? d.guid ?? '').trim();

  const summary = (isRecall ? d.Summary : (d.contentSnippet ?? d.content ?? ''))
    .replace(/<[^>]*>/g, '')      // strip any HTML the feed embedded
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);

  // An item with no title or no link cannot be sent or deduped. Drop it here
  // rather than letting it produce an empty row in the digest.
  if (!title || !url) continue;

  const haystack = `${title} ${summary}`.toLowerCase();
  const score = SIGNAL_TERMS.reduce(
    (total, { term, weight }) => (haystack.includes(term) ? total + weight : total),
    0,
  );

  normalised.push({
    json: {
      signal_id: hash(url),
      title,
      url,
      summary,
      source: isRecall ? 'NHTSA' : (d.creator ?? d.source ?? 'RSS'),
      published_at: d.isoDate ?? d.pubDate ?? new Date().toISOString(),
      score,
      is_recall: isRecall,
    },
  });
}

// Highest-signal first, so the Limit node downstream keeps what matters.
normalised.sort((a, b) => b.json.score - a.json.score);

return normalised;
```

- [ ] **Step 2: Execute and confirm** every item now has `signal_id`, `score`, and a clean `summary`.

---

## Task 5: Guard against a total source failure

- [ ] **Step 1: Add an IF node named `Any items at all?`** immediately after Normalise & Score.

Condition: `{{ $input.all().length }}` **is greater than** `0`

- [ ] **Step 2: Wire the false branch** to a `Stop and Error` node with the message:
`All sources returned no usable items — check feed availability.`

> This is the difference between silent failure and handled failure. If every feed is down, the run stops loudly and the Error Trigger workflow fires, rather than sending an empty email that looks like a quiet news day.

---

## Task 6: Idempotency

- [ ] **Step 1: Add `Sheets: Read Ledger`** — Google Sheets node, operation **Get Row(s)**, sheet `sent`. Settings: retry on fail, 3 tries.

- [ ] **Step 2: Add a Code node `Filter New Signals`** (Run Once for All Items)

```js
/**
 * The idempotency gate.
 *
 * Everything already in the ledger is dropped, so running the workflow twice in
 * a row sends one email and then nothing. Without this, every run would resend
 * the same articles, which is the fastest way to get a digest muted forever.
 */
const ledgerRows = $('Sheets: Read Ledger').all();
const alreadySent = new Set(
  ledgerRows.map((row) => row.json.signal_id).filter(Boolean),
);

const MIN_SCORE = 3;

return $('Normalise & Score')
  .all()
  .filter((item) => !alreadySent.has(item.json.signal_id))
  .filter((item) => item.json.score >= MIN_SCORE);
```

- [ ] **Step 3: Add an IF node `Any new signals?`**

Condition: `{{ $input.all().length }}` **is greater than** `0`

- [ ] **Step 4: Wire the false branch** to a `Sheets: Append` row recording a quiet day, with no email sent. A quiet day is a real outcome and should be visible in the log rather than indistinguishable from a broken run.

- [ ] **Step 5: Verify idempotency**

Run the workflow twice. First run: an email arrives and the ledger grows. Second run: the false branch is taken, no email. **Screenshot both runs — this is required README evidence.**

---

## Task 7: Limit and classify

- [ ] **Step 1: Add a Limit node** — Max Items: 6. The list is already sorted by score, so this keeps the six most relevant.

- [ ] **Step 2: Add the OpenAI node `Summarise & Classify`** (Run Once for Each Item)

Model: `gpt-4o-mini`. Settings: retry on fail, 3 tries, `On Error: Continue`.

System prompt:
```
You brief a used-car dealership manager. You are given one news item.
Reply with JSON only, no prose, in exactly this shape:
{"brief":"<one sentence, max 25 words, what this means for a used-car dealer>","category":"recall|pricing|policy|technology|market","severity":"urgent|normal"}
Mark severity urgent only for safety recalls or immediate price/regulatory impact.
```

User prompt:
```
Title: {{ $json.title }}
Source: {{ $json.source }}
Summary: {{ $json.summary }}
```

- [ ] **Step 3: Add a Code node `Parse LLM Output`** that safely parses the JSON and falls back when the model returns something unexpected

```js
/**
 * The model is asked for JSON, but a model is not a schema. A malformed reply
 * must degrade to the raw item rather than breaking the digest, so the dealer
 * still gets the headline even if the brief is missing.
 *
 * Mode: Run Once for Each Item. `$('Limit').item` resolves the exact upstream
 * item this reply was generated from, through n8n's item linking. Indexing into
 * `$('Limit').all()` by position would silently attach the wrong article's
 * metadata to a brief if an earlier item failed and shifted the order.
 */
const source = $('Limit').item.json;
let parsed = {};

try {
  const raw = $json.message?.content ?? $json.text ?? '{}';
  parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
} catch {
  parsed = {};
}

return {
  json: {
    ...source,
    brief: parsed.brief ?? source.summary?.slice(0, 140) ?? 'No summary available.',
    category: parsed.category ?? 'market',
    severity: parsed.severity ?? (source.is_recall ? 'urgent' : 'normal'),
  },
};
```

- [ ] **Step 4: Severity is handled inside `Build Digest`, not by a Switch node**

An earlier draft added a Switch on severity whose two branches converged straight back together, changing nothing. A branch that does not change behaviour is decoration, and a reviewer reading the canvas would notice. The real conditional logic in this workflow is the two IF guards, the recall loop, and the per-source error outputs. Severity instead drives what matters: the subject-line prefix and putting urgent items first (Task 8).

---

## Task 8: Build the digest

- [ ] **Step 1: Add a Code node `Build Digest`** (Run Once for All Items)

```js
/**
 * One email, built once from all items. Plain, scannable HTML — this lands in a
 * dealer's inbox at 07:00, not in a browser.
 */
// Urgent first, then by score, so a safety recall is never buried at item five.
const signals = $input.all().map((i) => i.json).sort(
  (a, b) => (b.severity === 'urgent') - (a.severity === 'urgent') || b.score - a.score,
);
const urgentCount = signals.filter((s) => s.severity === 'urgent').length;

const today = new Date().toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric',
});

const subject = urgentCount
  ? `⚠ Forecourt Signal — ${urgentCount} urgent — ${today}`
  : `Forecourt Signal — ${signals.length} items — ${today}`;

const rows = signals.map((s) => `
  <tr>
    <td style="padding:16px 0;border-bottom:1px solid #e5e2db;">
      <div style="font:600 11px/1.4 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:${s.severity === 'urgent' ? '#b4411f' : '#8a8578'};">
        ${s.category}${s.severity === 'urgent' ? ' · urgent' : ''} · ${s.source}
      </div>
      <a href="${s.url}" style="display:block;margin:6px 0 4px;font:600 17px/1.35 Georgia,serif;color:#16150f;text-decoration:none;">
        ${s.title}
      </a>
      <div style="font:400 14px/1.6 -apple-system,system-ui,sans-serif;color:#4a463c;">
        ${s.brief}
      </div>
    </td>
  </tr>`).join('');

const html = `
<div style="max-width:620px;margin:0 auto;padding:28px 20px;background:#faf8f3;">
  <div style="font:600 11px/1.4 ui-monospace,monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a8578;">
    Forecourt Signal · ${today}
  </div>
  <h1 style="margin:10px 0 20px;font:400 28px/1.2 Georgia,serif;color:#16150f;">
    ${signals.length} ${signals.length === 1 ? 'signal' : 'signals'} worth your morning
  </h1>
  <table style="width:100%;border-collapse:collapse;">${rows}</table>
  <p style="margin-top:24px;font:400 12px/1.6 -apple-system,system-ui,sans-serif;color:#8a8578;">
    Sources: Motor1 · Car and Driver · Electrek · NHTSA. Items already sent are never repeated.
  </p>
</div>`;

return [{ json: { subject, html, signals, count: signals.length } }];
```

---

## Task 9: Deliver and log

- [ ] **Step 1: Add the Gmail node `Send Digest`**

To: the reviewer-visible demo inbox · Subject: `{{ $json.subject }}` · Message: `{{ $json.html }}` · Email Type: HTML.
Settings: retry on fail, 3 tries.

- [ ] **Step 2: Add `Sheets: Append Sent`** — appends one row per signal to the `sent` tab:

`signal_id` · `title` · `url` · `source` · `score` · `sent_at = {{ $now.toISO() }}`

> Order matters: the ledger is written **after** the email succeeds. Writing it first would mean a failed send permanently suppresses those articles.

- [ ] **Step 2b: Add `Respond to Webhook`** at the end of the success path, returning JSON `{ "status": "sent", "count": N, "subject": "...", "signals": [ {title, url, category, severity} ] }`. On the "no new signals" branch, respond `{ "status": "quiet_day", "count": 0 }`. Both branches respond, otherwise a webhook caller on a quiet day would hang until timeout. This is the "webhook response" output type from the brief, and the fastest verification path for a reviewer.

- [ ] **Step 3: Run the full workflow and confirm** the email lands and the sheet gains rows.

- [ ] **Step 4: Screenshot** the received email, the filled sheet, and the green n8n execution view into `03-n8n-workflow/screenshots/`.

---

## Task 10: Error handling workflow and sub-workflow

- [ ] **Step 1: Create a sub-workflow `Notify Failure`**

Nodes: `Execute Workflow Trigger` → `Gmail: Send`. It accepts `workflow_name`, `node_name`, `error_message`, `execution_url` and emails a failure alert. Being a separate workflow makes it reusable by the other two tasks' automations later, which is the brief's "reusable sub-workflow" bonus.

- [ ] **Step 2: Create a workflow `Forecourt Signal — Error Handler`**

`Error Trigger` → `Execute Sub-workflow (Notify Failure)`, mapping:
- `workflow_name`: `{{ $json.workflow.name }}`
- `node_name`: `{{ $json.execution.lastNodeExecuted }}`
- `error_message`: `{{ $json.execution.error.message }}`
- `execution_url`: `{{ $json.execution.url }}`

- [ ] **Step 3: Attach it to the main workflow**

Main workflow → Settings → **Error Workflow** → `Forecourt Signal — Error Handler`.

- [ ] **Step 4: Prove it fires**

Temporarily point `HTTP: NHTSA Recalls` at `https://api.nhtsa.gov/this-does-not-exist` **and** set its On Error to "Stop Workflow". Execute. Expect: the run fails, the error workflow fires, a failure email arrives. **Screenshot it.** Then restore the URL and the Continue setting.

> Two different failure behaviours are demonstrated on purpose: a single flaky feed is absorbed and the run continues; a genuine fault stops the run and raises an alert. The brief asks for failures to be dealt with "on purpose" — this is what that looks like.

---

## Task 11: Export, document, verify

- [ ] **Step 1: Export all three workflows** to `03-n8n-workflow/`:
  - `forecourt-signal.json`
  - `forecourt-signal-error-handler.json`
  - `notify-failure.json`

- [ ] **Step 2: Scrub the exports**

```bash
cd "D:/Projects/Alba Corp/03-n8n-workflow"
grep -o '"[a-zA-Z]*[Kk]ey"\s*:\s*"[^"]*"' *.json || echo "NO INLINE KEYS"
grep -o 'sk-[A-Za-z0-9]\{20,\}' *.json && echo "!!! STOP: API KEY IN EXPORT !!!" || echo "CLEAN"
```

Replace any real spreadsheet id or email address with `YOUR_SHEET_ID` / `you@example.com`.
Expected: `NO INLINE KEYS` and `CLEAN`.

- [ ] **Step 3: Write `03-n8n-workflow/README.md`** covering all five required documentation points:

1. **What and why** — the digest, and why a dealer wants it.
2. **Node-by-node walkthrough** — every significant node, what it does, and what shape the data has when it leaves. The flow diagram above goes here.
3. **Setup and credentials** — Google OAuth2 (Gmail + Sheets), OpenAI API key, the ledger sheet's header row, and the placeholder ids. **No real secrets.**
4. **How to run it** — import the three JSON files, attach the error workflow in settings, then either click Execute Workflow or wait for 07:00.
5. **How to verify it worked** — the email that lands (screenshot), the ledger rows that appear (screenshot), the green execution view (screenshot), and the second-run-sends-nothing proof (screenshot).

- [ ] **Step 4: Write `03-n8n-workflow/BUILD_LOG.md`** using the official seven-section template.

Known limitations must honestly include: RSS feeds can change or disappear without notice; keyword scoring is naive and has no semantic understanding; the NHTSA query is pinned to one make/model rather than a dealer's real stock; the ledger grows without pruning; the LLM occasionally returns non-JSON and falls back to the raw summary.

- [ ] **Step 5: Commit**

```bash
git add 03-n8n-workflow/
git commit -m "feat(03-n8n): add Forecourt Signal digest workflow with error handling and idempotency"
```

---

## Task 12: Reviewer access and video

- [ ] **Step 1: Decide the access route**

Preferred by the brief: a live n8n instance the reviewer can open and run. If the free tier does not allow sharing, the importable JSON plus the README is the documented fallback — state plainly in the README which one is provided.

- [ ] **Step 2: Write `VIDEO_SCRIPT.md`** — a 3-minute beat sheet:
  1. What it does and who it is for — 20s
  2. Canvas tour: four sources (one looped) → merge → score → ledger gate → LLM → digest — 50s
  3. Live execution, then the email arriving in the inbox — 35s
  4. **Proud of:** idempotency. Run it again live, show the IF node taking the false branch and no second email — 40s
  5. **Fought me:** the LLM returning fenced ```json blocks that broke `JSON.parse`, and the fallback that now absorbs it — 35s
  6. Error handling: the two different behaviours, absorbed vs raised — 20s

- [ ] **Step 3: Interview rehearsal.** Every answer must be yours, unprompted:
  1. What makes this workflow idempotent, exactly?
  2. Why is the ledger written after the email rather than before?
  3. What happens when one feed is down? What happens when all three are?
  4. Why is there both a Manual and a Schedule trigger?
  5. What does the Error Trigger workflow receive, and where does it send it?
  6. Why is `signal_id` hashed from the URL rather than the title?
  7. What does the workflow do on a genuinely quiet news day?

- [ ] **Step 4: Record with Loom and link it in the form**

---

## Submission Checklist (Task 03 form)

- [ ] Live n8n instance **or** exported JSON + import instructions
- [ ] README.md with node-by-node walkthrough and run screenshots
- [ ] BUILD_LOG.md included
- [ ] Repository public
- [ ] Video recorded and linked
- [ ] No real secrets in any exported JSON
- [ ] Notes field filled with honest known limitations

---

## Time Budget

| Phase | Target |
|---|---|
| Tasks 1–2 (instance, credentials, ledger sheet) | 25 min |
| Tasks 3–4 (triggers, sources, normalise) | 35 min |
| Tasks 5–6 (guards, idempotency) | 30 min |
| Tasks 7–8 (LLM, digest) | 35 min |
| Task 9 (deliver + log + screenshots) | 20 min |
| Task 10 (error workflow + sub-workflow) | 25 min |
| Task 11 (export, scrub, docs) | 30 min |
| Task 12 (video) | 25 min |
| **Total** | **≈3h25m** — inside the box |
