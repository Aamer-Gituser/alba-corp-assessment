// The digest is one item (one email). The history log needs one row per article, so
// fan back out here. Runs after the email is sent: nothing is recorded as "delivered"
// until it actually was.
const digest = $('Build Digest Email').first().json;

return (digest.articles || []).map((article) => ({
  json: {
    hash: article.hash,
    sentAt: new Date().toISOString(),
    title: article.title,
    url: article.url,
    source: article.sourceName,
    category: article.category,
    score: article.score,
    summary: article.summary,
    aiEnriched: article.aiEnriched ? 'yes' : 'no',
  },
}));
