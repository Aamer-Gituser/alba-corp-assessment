// The decision layer: collapse duplicates, drop anything already sent, score what is
// left against the business keyword list, and keep only the top N.
const config = $('Config').first().json;
const minScore = Number(config.minScore) || 1;
const maxItems = Number(config.maxItems) || 8;
const keywords = Array.isArray(config.keywords) ? config.keywords : [];

const incoming = $input.all().map((item) => item.json);
const degraded = incoming.filter((row) => row.__degradedSource);
const candidates = incoming.filter((row) => !row.__degradedSource);

// --- Idempotency, two layers ------------------------------------------------------
// Layer 1: workflow static data. Fast and dependency-free, but n8n only persists it on
// production (scheduled) executions — never on manual ones.
const store = $getWorkflowStaticData('global');
if (!Array.isArray(store.seenHashes)) store.seenHashes = [];
const seen = new Set(store.seenHashes.map(String));

// Layer 2: the Google Sheet history. Survives manual runs and is human-auditable, which
// is what actually makes it safe for a reviewer to hit Execute twice in a row.
try {
  for (const row of $('Load Seen Hashes').all()) {
    if (row.json?.hash) seen.add(String(row.json.hash));
  }
} catch {
  // Sheet not configured yet — static data alone still prevents same-run duplicates.
}

const scoreOf = (article) => {
  const title = String(article.title || '').toLowerCase();
  const body = String(article.summarySource || '').toLowerCase();
  let score = 0;
  const matched = [];

  for (const keyword of keywords) {
    const term = String(keyword.term || '').toLowerCase();
    if (!term) continue;
    const weight = Number(keyword.weight) || 1;
    // A keyword in the headline is worth far more than one buried in the blurb.
    if (title.includes(term)) {
      score += weight * 3;
      matched.push(keyword.term);
    } else if (body.includes(term)) {
      score += weight;
      matched.push(keyword.term);
    }
  }

  return { score: score * (Number(article.sourceWeight) || 1), matched: [...new Set(matched)] };
};

const byHash = new Map();
let duplicatesCollapsed = 0;
let alreadySent = 0;
let belowThreshold = 0;

for (const article of candidates) {
  if (seen.has(article.hash)) {
    alreadySent += 1;
    continue;
  }
  if (byHash.has(article.hash)) {
    duplicatesCollapsed += 1;
    continue;
  }

  const { score, matched } = scoreOf(article);
  if (score < minScore) {
    belowThreshold += 1;
    continue;
  }

  byHash.set(article.hash, { ...article, score, matchedKeywords: matched });
}

const ranked = [...byHash.values()]
  .sort(
    (a, b) =>
      b.score - a.score || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
  .slice(0, maxItems);

return [
  {
    json: {
      hasNews: ranked.length > 0,
      articles: ranked,
      stats: {
        fetched: candidates.length,
        selected: ranked.length,
        duplicatesCollapsed,
        alreadySent,
        belowThreshold,
        sourcesOk: new Set(candidates.map((article) => article.sourceName)).size,
        sourcesFailed: degraded.map((row) => ({ sourceName: row.sourceName, reason: row.reason })),
        generatedAt: new Date().toISOString(),
      },
    },
  },
];
