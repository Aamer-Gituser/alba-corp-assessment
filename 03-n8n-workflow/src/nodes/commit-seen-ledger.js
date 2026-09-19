// Commit the idempotency ledger LAST, after the email is out and the history row is
// written. Ordering matters: if delivery fails, these hashes stay unseen and the next
// run retries them instead of silently swallowing a day of news.
const digest = $('Build Digest Email').first().json;
const store = $getWorkflowStaticData('global');

if (!Array.isArray(store.seenHashes)) store.seenHashes = [];

const fresh = (digest.articles || []).map((article) => article.hash);
const merged = [...store.seenHashes, ...fresh];

// Keep the ledger bounded — a rolling window is enough to stop repeats, and it stops
// static data growing without limit across months of daily runs.
store.seenHashes = [...new Set(merged)].slice(-500);
store.lastRunAt = new Date().toISOString();
store.lastRunCount = fresh.length;

return [
  {
    json: {
      committed: fresh.length,
      ledgerSize: store.seenHashes.length,
      lastRunAt: store.lastRunAt,
      note: 'Static data persists on production (scheduled) executions only — the Google Sheet layer covers manual runs.',
    },
  },
];
