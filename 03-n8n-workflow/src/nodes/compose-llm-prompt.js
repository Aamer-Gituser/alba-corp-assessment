// Build the Gemini request body here rather than inline in the HTTP node, so the prompt
// is reviewable in git and the HTTP node stays a dumb transport.
const config = $('Config').first().json;
const { articles, stats } = $input.first().json;

// Only the fields the model needs. Sending less keeps us inside the free-tier token
// budget and stops the model from inventing detail it was never given.
const payload = articles.map((article) => ({
  id: article.hash,
  title: article.title,
  source: article.sourceName,
  blurb: String(article.summarySource || '').slice(0, 400),
}));

const instruction = [
  'You are a market analyst for Alba Cars, a used-car dealership and marketplace in Dubai, UAE.',
  'You will receive a JSON array of news articles.',
  '',
  'For EVERY article, return:',
  '  - id: copy the id exactly as given',
  '  - summary: one sentence, max 25 words, plain factual language, no hype',
  '  - category: exactly one of "Pricing", "Supply", "Regulation", "EV", "Industry", "Other"',
  '  - relevance: max 12 words on why a used-car dealer in the UAE should care',
  '',
  'Also return marketTakeaway: one sentence, max 30 words, summarising the day overall.',
  '',
  'Rules: use only facts present in the supplied text. If an article gives you too little',
  'to work with, say so plainly in the summary rather than guessing.',
  '',
  'Respond with JSON matching this shape exactly:',
  '{"marketTakeaway":"...","items":[{"id":"...","summary":"...","category":"...","relevance":"..."}]}',
  '',
  `Articles (${payload.length} total, ${stats.sourcesOk} sources):`,
  JSON.stringify(payload),
].join('\n');

return [
  {
    json: {
      geminiModel: config.geminiModel,
      geminiBody: {
        contents: [{ role: 'user', parts: [{ text: instruction }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          // Forcing a JSON mime type is the difference between parsing a response and
          // regexing prose out of a markdown code fence.
          responseMimeType: 'application/json',
        },
      },
    },
  },
];
