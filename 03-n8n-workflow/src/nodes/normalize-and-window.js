// Flatten wildly inconsistent RSS into one predictable article shape.
//
// Real-world problems this handles:
//   - <item> is an object when a feed has exactly one entry, an array otherwise
//   - titles/descriptions arrive CDATA-wrapped, HTML-escaped, or full of markup
//   - <link> is a string in RSS 2.0 but an array of objects in Atom
//   - dates come as RFC-822, ISO-8601, or dc:date
//   - the same story appears in two feeds with different tracking parameters
const config = $('Config').first().json;
const lookbackMs = (Number(config.lookbackHours) || 36) * 60 * 60 * 1000;
const cutoff = Date.now() - lookbackMs;

const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);

const text = (value) => {
  if (value == null) return '';
  // XML→JSON can hand back a string, { _: 'text' }, or { '#text': 'text' }.
  const raw = typeof value === 'object' ? (value._ ?? value['#text'] ?? '') : value;
  return String(raw)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

const linkOf = (item) => {
  if (typeof item.link === 'string') return item.link;
  const links = asArray(item.link);
  const withHref = links.find((link) => link?.$?.href);
  return withHref?.$?.href ?? text(links[0]) ?? '';
};

// Strip tracking params so the same article arriving from two feeds hashes identically.
const canonicalUrl = (url) => {
  try {
    const parsed = new URL(String(url));
    [...parsed.searchParams.keys()]
      .filter((key) => /^(utm_|fbclid|gclid|ref$|oc$)/i.test(key))
      .forEach((key) => parsed.searchParams.delete(key));
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return String(url || '').trim();
  }
};

// djb2 — small, dependency-free, stable across runs. This is the idempotency key.
const hash = (value) => {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) h = ((h << 5) + h + value.charCodeAt(i)) | 0;
  return 'a' + (h >>> 0).toString(36);
};

const articles = [];

for (const entry of $input.all()) {
  const data = entry.json;
  const sourceName = data.sourceName || 'Unknown source';
  const sourceWeight = Number(data.sourceWeight) || 1;

  const channel = data?.rss?.channel ?? data?.channel ?? null;
  const rawItems = channel ? asArray(channel.item) : asArray(data?.feed?.entry);

  for (const item of rawItems) {
    const title = text(item.title);
    const url = canonicalUrl(linkOf(item));
    if (!title || !url) continue;

    const publishedRaw = item.pubDate ?? item.published ?? item.updated ?? item['dc:date'];
    const parsedDate = new Date(text(publishedRaw));
    const publishedMs = Number.isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();

    // Time window keeps the digest about *today* and caps how much text reaches the LLM.
    if (publishedMs < cutoff) continue;

    articles.push({
      json: {
        hash: hash(url.toLowerCase()),
        title,
        url,
        summarySource: text(
          item.description ?? item.summary ?? item['content:encoded'] ?? '',
        ).slice(0, 600),
        publishedAt: new Date(publishedMs).toISOString(),
        sourceName,
        sourceWeight,
      },
    });
  }
}

return articles;
