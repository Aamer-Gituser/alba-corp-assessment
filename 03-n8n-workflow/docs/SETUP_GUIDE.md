# Setup Guide — Alba Market Pulse

From zero to a running workflow. Roughly 15 minutes.
**No real secret ever goes into this repository.** Everything below lives in n8n's credential
store or in the `Config` node inside n8n.

---

## Prerequisites

| Need | Where | Cost |
|---|---|---|
| n8n Cloud account | https://n8n.io | Free trial |
| Google account | any Gmail account | Free |
| Gemini API key | https://aistudio.google.com | Free tier |
| Node.js 20+ | only to rebuild the JSON from source | Free |

---

## Step 1 — Create the history sheet

1. New Google Sheet, name it `Alba Market Pulse — History`.
2. Rename the first tab to exactly **`Digest History`**.
3. Put these headers in row 1, in this order:

```
hash | sentAt | title | url | source | category | score | summary | aiEnriched
```

These names must match exactly — the `Append History` node uses auto-map mode and matches on
header text.

4. Copy the sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`

---

## Step 2 — Get a Gemini API key

1. https://aistudio.google.com → **Get API key** → **Create API key**.
2. Copy it. It starts with `AIza…`.
3. Keep it out of any file in this repo. It goes into n8n only.

---

## Step 3 — Import the workflows

1. n8n → **Workflows** → **Import from File**.
2. Import `workflow/alba-market-pulse.json`.
3. Import `workflow/alba-error-handler.json`.

Expected: the canvas renders with no "unknown node type" warnings.
If a node appears unrecognised, note your n8n version — it means a `typeVersion` needs lowering.

---

## Step 4 — Connect credentials

### Gmail (3 nodes: `Send Digest`, `Send Quiet Note`, `Send Failure Alert`)
Open each node → Credential → **Create new** → **Gmail OAuth2** → Sign in with Google → allow.
On n8n Cloud this uses n8n's own OAuth app, so no Google Cloud project is needed.

### Google Sheets (2 nodes: `Load Seen Hashes`, `Append History`)
Same flow → **Google Sheets OAuth2** → same Google account.

### Gemini (`Summarise with Gemini`)
The node is already set to Generic Credential Type → Header Auth.
Create a new **Header Auth** credential:

| Field | Value |
|---|---|
| Name | `x-goog-api-key` |
| Value | your `AIza…` key |

Name the credential `Gemini API Key`.

The confirmed model for this project is `gemini-2.5-flash`. In the `Config` node, keep:

```json
"geminiModel": "gemini-2.5-flash"
```

In `Summarise with Gemini`, use this URL in the URL field (without a leading `=`):

```text
https://generativelanguage.googleapis.com/v1beta/models/{{ $json.geminiModel }}:generateContent
```

The URL must stay dynamic so the HTTP request uses the same model shown in `Config`.

---

## Step 5 — Fill in Config

Open the **`Config`** node and replace two placeholders:

| Key | Replace with |
|---|---|
| `digestRecipient` | the email address that should receive the digest |
| `historySheetId` | the sheet ID from Step 1 |

Everything else — feeds, keyword weights, `minScore`, `maxItems`, `lookbackHours`,
`geminiModel` — is tunable here without touching any code.

---

## Step 6 — Register the error workflow

Main workflow → **Settings** (three dots, top right) → **Error Workflow** →
select `Alba Market Pulse — Error Handler` → Save.

In the error workflow, open `Send Failure Alert` and set `sendTo` to your address.

---

## Step 7 — First run

Click **Execute Workflow**.

Expected within ~30 seconds:
- every node on the happy path turns green
- a digest email arrives
- new rows appear in the `Digest History` tab

If `Load Seen Hashes` shows an error but the run continues — that is the designed behaviour
for an unconfigured sheet. Fix the sheet ID if you want the second idempotency layer active.

---

## Step 8 — Activate the schedule (optional)

Toggle the workflow **Active** to enable the 07:00 Asia/Dubai run.
Note: n8n only persists workflow static data on production executions, so the static-data half
of the idempotency ledger starts working once the workflow is active. Until then, the Google
Sheet layer is doing that job.

---

## Rebuilding the JSON from source

The workflow JSON is generated, not hand-edited:

```bash
npm install
node src/build.mjs
```

Edit the Code-node logic in `src/nodes/*.js` and the tunables in `src/workflow.config.json`,
then rebuild. The build validates the node graph and refuses to emit a workflow with dangling
connections or unreachable nodes.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Build Source List` throws "Config.sources is empty" | Config node edited badly | Restore valid JSON in the Config node |
| Digest arrives with no summaries, footer says "extractive fallback" | Gemini key missing, invalid, or rate-limited | Check the Header Auth credential; the digest still ships by design |
| Amber "Partial run" banner | One or more feeds did not respond | Expected behaviour — check the named source |
| Same articles arrive twice | Sheet not configured and workflow not Active, so neither ledger layer persisted | Set `historySheetId`, or activate the workflow |
| `Append History` fails | Header row mismatch | Headers must match Step 1 exactly |
| Nothing arrives at all | Quiet-day branch | Check for the "nothing new worth sending" email; lower `minScore` to test |
