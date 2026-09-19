# Video Script — Alba Market Pulse (Task 03)
> Target: 3–5 minutes. One take is fine; two short retakes beat one nervous long one.

---

## Before You Hit Record

**Tabs open:**
- n8n Cloud — Alba Market Pulse workflow canvas
- n8n Cloud — Executions page (so you can click into a finished run)
- Gmail inbox (recipient address)
- Google Sheet `Alba Market Pulse — History`, tab `Digest History`
- GitHub repo `03-n8n-workflow/` folder (to show source files)

**Data ready:**
- At least one prior successful execution (rows in Sheet, email in inbox)
- One screenshot of the digest email already saved as `docs/screenshots/03-digest-email.png`

**Check:**
- Microphone level OK
- Screen resolution legible at 1080p
- n8n canvas fits in frame (zoom out if needed)

---

## Script

### [0:00–0:20] Intro

> "Hi — I'm [name]. This is Task 3 of the Alba Corp Vibe Coder assessment: an n8n automation workflow. I built Alba Market Pulse — a daily UAE automotive news digest. The idea is simple: Alba Cars is a Dubai used-car marketplace. Every morning, this workflow pulls news from three RSS feeds, scores articles against business keywords like 'resale value' and 'UAE auto market', summarises the top stories with Google Gemini, and emails a styled HTML digest by 07:00 Gulf time. Let me show you how it works."

---

### [0:20–1:00] Canvas Walkthrough

*(Click through the canvas as you talk)*

> "Here's the n8n canvas. Two entry points — a daily cron trigger at 07:00 GST, and a Manual Trigger so a reviewer can run it on demand. They merge into a Config node — that's the single source of truth: feed list, keyword weights, relevance threshold, Gemini model name, recipient address. Nothing is hardcoded anywhere else."

> "Then Load Seen Hashes pulls previous article IDs from Google Sheets — that's idempotency layer two, I'll come back to that."

> "Build Source List fans out one item per feed. This is the key architectural decision: because each feed is its own n8n execution item, a dead feed fails in its own branch and doesn't kill the run."

> "Fetch Feed has three retries with two-second backoff. If it still fails, output 1 routes to Note Failed Source — which converts the error into a data record. The digest will show an amber 'partial run' banner instead of crashing."

---

### [1:00–2:00] Live Demo — Golden Path

*(Execute Workflow — show nodes turning green)*

> "I'll run it now. Watch the nodes light up — Build Source List fans out to three items, Fetch Feed runs three times in parallel, Parse RSS converts XML to JSON, Normalize and Window strips tracking parameters, assigns a djb2 hash to each URL, and drops anything older than 36 hours."

> "Dedupe, Score and Rank is where the business logic lives. It checks each article hash against static data and the Sheets ledger. Articles that pass get scored: keyword hits in the headline count three times more than hits in the blurb, multiplied by the source weight. Anything below the threshold is dropped. The rest are ranked and capped at eight."

> "If we have news — and today we do — we build a Gemini prompt, hit the API, and parse the JSON response. Build Digest Email assembles the HTML. Send Digest fires. Then we log to Sheets and commit the hashes so the next run knows what was already sent."

*(Switch to Gmail inbox)*

> "Email arrived. Subject line, article cards with category tags, one-sentence AI summaries, and a footer that says 'AI-enriched' — proving the LLM path ran."

*(Switch to Sheet)*

> "And here are the rows in Digest History — one per delivered article, with the hash, timestamp, score, and summary."

---

### [2:00–2:45] Advanced Feature — Idempotency Proof

> "Now let me prove idempotency. I'll hit Execute again."

*(Run again — show quiet-note email or 'nothing new' result)*

> "Second run — same articles are in the ledger. The IF node branches false. A quiet-note email arrives explaining why: 'X articles already seen, 0 new articles above threshold.' No duplicate digest. This works even for manual runs because layer two — Google Sheets — persists regardless of whether the workflow is in production mode."

---

### [2:45–3:15] Part I'm Proud Of

> "The thing I'm most proud of is the error isolation. Let me show what happens when a feed dies."

*(Change one feed URL to `https://invalid.example.com` in Config, run)*

> "Feed two failed — network error. But look: the run is amber, not red. Note Failed Source converted the failure into a data record. The digest arrived with a banner: '2 of 3 sources responded.' The other feeds ran normally. One dead API does not kill the morning briefing."

*(Change URL back)*

---

### [3:15–3:45] Part That Fought Me

> "The thing that fought back was Google News. I originally configured the UAE locale — `hl=en-AE&gl=AE`. Tested it — zero bytes, 302 redirect. No items. Spent some time on this before I realised Google News doesn't serve the AE locale via RSS. Fix was simple: switch to `en-US` locale and put 'UAE OR Dubai OR Abu Dhabi' in the query terms instead. Same coverage, no redirect. It's in the BUILD_LOG as a dead end."

---

### [3:45–4:15] Known Limitations & What's Next

> "Two honest limitations. First, summaries are based on feed blurbs only — I'm not fetching full articles. Gemini sees the headline, source, and maybe two sentences. For a daily digest this is fine; for deeper analysis you'd want to fetch and summarise the full text."

> "Second, no reusable sub-workflow. The fetch-parse-normalise chain could be extracted so other workflows can reuse it. I cut it because it's a bonus item and it would have eaten 30 minutes with no new capability in the demo. It's logged in Known Limitations."

> "What I'd do next: add a Slack channel as a second delivery target, switch the idempotency store to a proper database for multi-instance resilience, and add a monthly performance report — which keywords drove the most articles this month?"

---

### [4:15–4:30] Close

> "That's Alba Market Pulse. Scheduled workflow, three external data sources, keyword scoring, LLM summarisation with a fallback path, four independent error-handling layers, and idempotent delivery. Thanks for watching."

---

## Recording Checklist

- [ ] Tabs open as listed above
- [ ] Prior successful run exists (email + Sheets rows)
- [ ] Invalid feed URL ready to paste for error demo
- [ ] Microphone test done
- [ ] Record at 1080p minimum
- [ ] Upload to Google Drive / YouTube (unlisted) and copy link before submitting
