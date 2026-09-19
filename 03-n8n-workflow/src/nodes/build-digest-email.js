// Assemble the deliverable: subject line, HTML body, and the rows we will log.
//
// The LLM is an enhancement, never a dependency. If Gemini is rate-limited, errors, or
// returns something unparseable, this node falls back to an extractive summary taken
// from the feed text and the digest still goes out — just marked as unenriched.
const config = $('Config').first().json;
const ranked = $('Dedupe, Score & Rank').first().json;
const articles = ranked.articles || [];
const stats = ranked.stats || {};

let aiById = {};
let marketTakeaway = '';
let aiStatus = 'fallback';

try {
  const parts = $json?.candidates?.[0]?.content?.parts ?? [];
  const raw = parts
    .map((part) => part.text || '')
    .join('')
    .trim();
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  const parsed = JSON.parse(cleaned);

  marketTakeaway = String(parsed.marketTakeaway || '').trim();
  for (const item of parsed.items || []) {
    if (!item?.id) continue;
    aiById[item.id] = {
      summary: String(item.summary || '').trim(),
      category: String(item.category || '').trim(),
      relevance: String(item.relevance || '').trim(),
    };
  }
  aiStatus = Object.keys(aiById).length > 0 ? 'ok' : 'empty';
} catch {
  aiStatus = 'fallback';
}

const firstSentence = (value) => {
  const sentence = String(value || '').split(/(?<=[.!?])\s/)[0] || '';
  return sentence.length > 220 ? `${sentence.slice(0, 217)}…` : sentence;
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const enriched = articles.map((article) => {
  const ai = aiById[article.hash];
  return {
    ...article,
    summary:
      ai?.summary || firstSentence(article.summarySource) || 'No summary text in the source feed.',
    category: ai?.category || 'Industry',
    relevance: ai?.relevance || '',
    aiEnriched: Boolean(ai),
  };
});

const categoryColour = {
  Pricing: '#b45309',
  Supply: '#0369a1',
  Regulation: '#7c3aed',
  EV: '#047857',
  Industry: '#475569',
  Other: '#475569',
};

const dateLabel = new Date().toLocaleDateString('en-AE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Dubai',
});

const cards = enriched
  .map((article) => {
    const colour = categoryColour[article.category] || '#475569';
    const published = new Date(article.publishedAt).toLocaleString('en-AE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Dubai',
    });
    const relevanceLine = article.relevance
      ? `<div style="margin-top:10px;padding-left:10px;border-left:2px solid ${colour};color:#475569;font-size:13px;">
           <strong style="color:${colour};">Why it matters:</strong> ${escapeHtml(article.relevance)}
         </div>`
      : '';

    return `
      <div style="padding:18px 0;border-bottom:1px solid #e2e8f0;">
        <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${colour};font-weight:700;">
          ${escapeHtml(article.category)}
          <span style="color:#94a3b8;font-weight:500;"> · ${escapeHtml(article.sourceName)} · ${published}</span>
        </div>
        <a href="${escapeHtml(article.url)}" style="display:block;margin-top:6px;font-size:17px;line-height:1.35;color:#0f172a;font-weight:600;text-decoration:none;">
          ${escapeHtml(article.title)}
        </a>
        <div style="margin-top:8px;font-size:14px;line-height:1.55;color:#334155;">
          ${escapeHtml(article.summary)}
        </div>
        ${relevanceLine}
        <div style="margin-top:10px;font-size:11px;color:#94a3b8;">
          relevance score ${article.score} · matched: ${escapeHtml((article.matchedKeywords || []).join(', ') || 'none')}
        </div>
      </div>`;
  })
  .join('');

const degradedBanner = (stats.sourcesFailed || []).length
  ? `<div style="margin:0 0 18px;padding:12px 14px;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;font-size:13px;color:#92400e;">
       <strong>Partial run.</strong> ${stats.sourcesFailed.length} source(s) did not respond:
       ${escapeHtml(stats.sourcesFailed.map((source) => source.sourceName).join(', '))}.
       The digest below is built from the sources that did.
     </div>`
  : '';

const takeawayBlock = marketTakeaway
  ? `<div style="margin:0 0 20px;padding:16px 18px;background:#0f172a;border-radius:10px;color:#f8fafc;font-size:15px;line-height:1.5;">
       <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Today's takeaway</div>
       ${escapeHtml(marketTakeaway)}
     </div>`
  : '';

const html = `<!doctype html>
<html><body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px 26px;box-shadow:0 1px 3px rgba(15,23,42,.08);">
    <div style="padding-bottom:18px;border-bottom:2px solid #0f172a;">
      <div style="font-size:21px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">${escapeHtml(config.brandName || 'Alba Market Pulse')}</div>
      <div style="margin-top:4px;font-size:13px;color:#64748b;">UAE automotive market intelligence · ${dateLabel}</div>
    </div>
    <div style="padding-top:20px;">
      ${degradedBanner}
      ${takeawayBlock}
      ${cards}
    </div>
    <div style="margin-top:22px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;line-height:1.7;">
      ${stats.fetched} articles scanned · ${stats.selected} selected · ${stats.duplicatesCollapsed} duplicates collapsed ·
      ${stats.alreadySent} already sent previously · ${stats.belowThreshold} below relevance threshold<br>
      summaries: ${aiStatus === 'ok' ? 'Gemini' : 'extractive fallback (LLM unavailable)'} ·
      generated by n8n at ${new Date(stats.generatedAt || Date.now()).toISOString()}
    </div>
  </div>
</body></html>`;

return [
  {
    json: {
      subject: `${config.brandName || 'Alba Market Pulse'} — ${enriched.length} stories · ${dateLabel}`,
      html,
      aiStatus,
      marketTakeaway,
      articles: enriched,
      stats,
    },
  },
];
