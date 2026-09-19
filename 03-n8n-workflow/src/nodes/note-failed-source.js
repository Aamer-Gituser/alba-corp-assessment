// Reached only through the HTTP node's error output (onError: continueErrorOutput).
// The run stays alive, and the failure travels downstream as data so the digest can
// honestly say "2 of 3 sources responded" instead of silently reporting less news.
return $input.all().map((item) => ({
  json: {
    __degradedSource: true,
    sourceName: item.json.sourceName || 'Unknown source',
    sourceUrl: item.json.sourceUrl || '',
    reason:
      item.json.error?.message ||
      item.json.error?.description ||
      item.json.message ||
      'Feed request failed after retries',
    failedAt: new Date().toISOString(),
  },
}));
