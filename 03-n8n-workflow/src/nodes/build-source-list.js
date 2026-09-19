// Fan out: emit one n8n item per configured feed.
// Why: the HTTP node then runs once per source, so a single dead feed fails only its
// own item and drops into the error branch instead of killing the whole execution.
const config = $('Config').first().json;
const sources = Array.isArray(config.sources) ? config.sources : [];

if (sources.length === 0) {
  throw new Error('Config.sources is empty. Add at least one RSS source before running.');
}

return sources.map((source) => ({
  json: {
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: source.url,
    sourceWeight: Number(source.weight) || 1,
  },
}));
