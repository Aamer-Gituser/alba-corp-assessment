#!/usr/bin/env node
/**
 * Assembles the importable n8n workflow JSON from the readable sources in src/.
 *
 * Why this exists: an exported n8n workflow is a single JSON blob with every Code node
 * squashed into one escaped string — unreviewable in a pull request and painful to edit.
 * Keeping the JavaScript in real .js files and generating the JSON means the repo stays
 * readable, and `npm run build` proves the shipped JSON matches the source.
 *
 *   node src/build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outDir = join(root, 'workflow');

const code = (name) => readFileSync(join(here, 'nodes', `${name}.js`), 'utf8');
const config = readFileSync(join(here, 'workflow.config.json'), 'utf8');

const codeNode = (name, file, position, extra = {}) => ({
  parameters: { mode: 'runOnceForAllItems', jsCode: code(file) },
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position,
  ...extra,
});

/* ------------------------------------------------------------------ *
 * Main workflow: Alba Market Pulse
 * ------------------------------------------------------------------ */
const mainNodes = [
  {
    parameters: {
      rule: { interval: [{ triggerAtHour: 7, triggerAtMinute: 0 }] },
    },
    id: 'schedule-trigger',
    name: 'Daily 07:00 GST',
    type: 'n8n-nodes-base.scheduleTrigger',
    typeVersion: 1.2,
    position: [-220, 260],
  },
  {
    parameters: {},
    id: 'manual-trigger',
    name: 'Run Manually',
    type: 'n8n-nodes-base.manualTrigger',
    typeVersion: 1,
    position: [-220, 460],
  },
  {
    parameters: { mode: 'raw', jsonOutput: config, options: {} },
    id: 'config',
    name: 'Config',
    type: 'n8n-nodes-base.set',
    typeVersion: 3.4,
    position: [20, 360],
    notes:
      'Single source of truth: feeds, keyword weights, thresholds, recipient, model. Tune the digest here, never in code.',
  },
  {
    parameters: {
      documentId: {
        __rl: true,
        value: "={{ $json.historySheetId }}",
        mode: 'id',
      },
      sheetName: {
        __rl: true,
        value: "={{ $json.historySheetTab }}",
        mode: 'name',
      },
      options: {},
    },
    id: 'load-seen-hashes',
    name: 'Load Seen Hashes',
    type: 'n8n-nodes-base.googleSheets',
    typeVersion: 4.5,
    position: [240, 360],
    alwaysOutputData: true,
    onError: 'continueRegularOutput',
    notes:
      'Idempotency layer 2. alwaysOutputData keeps the run alive when the sheet is empty; onError keeps it alive when the sheet is not configured at all.',
  },
  codeNode('Build Source List', 'build-source-list', [460, 360]),
  {
    parameters: {
      url: '={{ $json.sourceUrl }}',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          {
            name: 'User-Agent',
            value: 'Mozilla/5.0 (compatible; AlbaMarketPulse/1.0; +https://n8n.io)',
          },
        ],
      },
      options: {
        timeout: 15000,
        response: { response: { responseFormat: 'text', outputPropertyName: 'data' } },
      },
    },
    id: 'fetch-feed',
    name: 'Fetch Feed',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [680, 360],
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 2000,
    onError: 'continueErrorOutput',
    notes:
      'Runs once per source. 3 tries with 2s backoff for flaky feeds; anything still failing leaves on the second output instead of killing the run.',
  },
  {
    parameters: { dataPropertyName: 'data', options: {} },
    id: 'parse-rss',
    name: 'Parse RSS',
    type: 'n8n-nodes-base.xml',
    typeVersion: 1,
    position: [900, 240],
  },
  {
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          {
            id: 'source-name',
            name: 'sourceName',
            value: "={{ $('Build Source List').item.json.sourceName }}",
            type: 'string',
          },
          {
            id: 'source-weight',
            name: 'sourceWeight',
            value: "={{ $('Build Source List').item.json.sourceWeight }}",
            type: 'number',
          },
        ],
      },
      options: {},
    },
    id: 'attach-source-meta',
    name: 'Attach Source Meta',
    type: 'n8n-nodes-base.set',
    typeVersion: 3.4,
    position: [1120, 240],
    notes:
      'The XML node replaces the item with the parsed tree, dropping which feed it came from. This re-attaches it via paired-item lookup.',
  },
  codeNode('Normalize & Window', 'normalize-and-window', [1340, 240]),
  codeNode('Note Failed Source', 'note-failed-source', [900, 520]),
  codeNode('Dedupe, Score & Rank', 'dedupe-score-rank', [1560, 360]),
  {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [
          {
            id: 'has-news',
            leftValue: '={{ $json.hasNews }}',
            rightValue: '',
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
    id: 'has-news',
    name: 'Any New Relevant News?',
    type: 'n8n-nodes-base.if',
    typeVersion: 2.2,
    position: [1780, 360],
  },
  codeNode('Compose LLM Prompt', 'compose-llm-prompt', [2000, 240]),
  {
    parameters: {
      method: 'POST',
      url: "=https://generativelanguage.googleapis.com/v1beta/models/{{ $json.geminiModel }}:generateContent",
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.geminiBody) }}',
      options: { timeout: 30000 },
    },
    id: 'summarise-gemini',
    name: 'Summarise with Gemini',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [2220, 240],
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 3000,
    onError: 'continueRegularOutput',
    notes:
      'Header-auth credential keeps the key out of the workflow JSON. onError continues so a rate-limited LLM downgrades the digest instead of cancelling it.',
  },
  codeNode('Build Digest Email', 'build-digest-email', [2440, 240]),
  {
    parameters: {
      sendTo: "={{ $('Config').first().json.digestRecipient }}",
      subject: '={{ $json.subject }}',
      emailType: 'html',
      message: '={{ $json.html }}',
      options: { appendAttribution: false },
    },
    id: 'send-digest',
    name: 'Send Digest',
    type: 'n8n-nodes-base.gmail',
    typeVersion: 2.1,
    position: [2660, 240],
    notes: 'The deliverable. HTML digest to the address set in Config.',
  },
  codeNode('Expand History Rows', 'expand-history-rows', [2880, 240]),
  {
    parameters: {
      operation: 'append',
      documentId: {
        __rl: true,
        value: "={{ $('Config').first().json.historySheetId }}",
        mode: 'id',
      },
      sheetName: {
        __rl: true,
        value: "={{ $('Config').first().json.historySheetTab }}",
        mode: 'name',
      },
      columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] },
      options: {},
    },
    id: 'append-history',
    name: 'Append History',
    type: 'n8n-nodes-base.googleSheets',
    typeVersion: 4.5,
    position: [3100, 240],
    onError: 'continueRegularOutput',
    notes:
      'Human-auditable delivery log, and the persistent half of the idempotency story. Non-fatal: the email already went out.',
  },
  codeNode('Commit Seen Ledger', 'commit-seen-ledger', [3320, 240]),
  {
    parameters: {
      sendTo: "={{ $('Config').first().json.digestRecipient }}",
      subject:
        "=Alba Market Pulse — nothing new worth sending ({{ new Date().toLocaleDateString('en-AE') }})",
      emailType: 'html',
      message:
        '=<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#334155;"><h2 style="color:#0f172a;margin:0 0 8px;font-size:18px;">Nothing cleared the bar today</h2><p style="font-size:14px;line-height:1.6;">Scanned <strong>{{ $json.stats.fetched }}</strong> articles from <strong>{{ $json.stats.sourcesOk }}</strong> source(s) over the last {{ $(\'Config\').first().json.lookbackHours }} hours.</p><ul style="font-size:13px;line-height:1.8;color:#475569;"><li>{{ $json.stats.alreadySent }} already sent in a previous digest</li><li>{{ $json.stats.duplicatesCollapsed }} duplicates collapsed</li><li>{{ $json.stats.belowThreshold }} below the relevance threshold</li><li>{{ $json.stats.sourcesFailed.length }} source(s) failed to respond</li></ul><p style="font-size:12px;color:#94a3b8;">A quiet day is a result, not a failure — this note proves the run happened.</p></div>',
      options: { appendAttribution: false },
    },
    id: 'send-quiet-note',
    name: 'Send Quiet Note',
    type: 'n8n-nodes-base.gmail',
    typeVersion: 2.1,
    position: [2000, 520],
    notes:
      'Deliberate empty state. Silence would be indistinguishable from a broken schedule, so a no-news day still reports itself.',
  },
];

const mainConnections = {
  'Daily 07:00 GST': { main: [[{ node: 'Config', type: 'main', index: 0 }]] },
  'Run Manually': { main: [[{ node: 'Config', type: 'main', index: 0 }]] },
  Config: { main: [[{ node: 'Load Seen Hashes', type: 'main', index: 0 }]] },
  'Load Seen Hashes': { main: [[{ node: 'Build Source List', type: 'main', index: 0 }]] },
  'Build Source List': { main: [[{ node: 'Fetch Feed', type: 'main', index: 0 }]] },
  'Fetch Feed': {
    main: [
      [{ node: 'Parse RSS', type: 'main', index: 0 }],
      [{ node: 'Note Failed Source', type: 'main', index: 0 }],
    ],
  },
  'Parse RSS': { main: [[{ node: 'Attach Source Meta', type: 'main', index: 0 }]] },
  'Attach Source Meta': { main: [[{ node: 'Normalize & Window', type: 'main', index: 0 }]] },
  'Normalize & Window': { main: [[{ node: 'Dedupe, Score & Rank', type: 'main', index: 0 }]] },
  'Note Failed Source': { main: [[{ node: 'Dedupe, Score & Rank', type: 'main', index: 0 }]] },
  'Dedupe, Score & Rank': { main: [[{ node: 'Any New Relevant News?', type: 'main', index: 0 }]] },
  'Any New Relevant News?': {
    main: [
      [{ node: 'Compose LLM Prompt', type: 'main', index: 0 }],
      [{ node: 'Send Quiet Note', type: 'main', index: 0 }],
    ],
  },
  'Compose LLM Prompt': { main: [[{ node: 'Summarise with Gemini', type: 'main', index: 0 }]] },
  'Summarise with Gemini': { main: [[{ node: 'Build Digest Email', type: 'main', index: 0 }]] },
  'Build Digest Email': { main: [[{ node: 'Send Digest', type: 'main', index: 0 }]] },
  'Send Digest': { main: [[{ node: 'Expand History Rows', type: 'main', index: 0 }]] },
  'Expand History Rows': { main: [[{ node: 'Append History', type: 'main', index: 0 }]] },
  'Append History': { main: [[{ node: 'Commit Seen Ledger', type: 'main', index: 0 }]] },
};

const mainWorkflow = {
  name: 'Alba Market Pulse — Daily UAE Auto Digest',
  nodes: mainNodes,
  connections: mainConnections,
  settings: { executionOrder: 'v1', timezone: 'Asia/Dubai', saveManualExecutions: true },
  pinData: {},
  meta: { instanceId: 'alba-market-pulse' },
  tags: [],
};

/* ------------------------------------------------------------------ *
 * Error handler workflow
 * ------------------------------------------------------------------ */
const errorWorkflow = {
  name: 'Alba Market Pulse — Error Handler',
  nodes: [
    {
      parameters: {},
      id: 'error-trigger',
      name: 'On Workflow Error',
      type: 'n8n-nodes-base.errorTrigger',
      typeVersion: 1,
      position: [260, 300],
      notes:
        'Set this workflow as the Error Workflow of the main one (Settings → Error workflow).',
    },
    codeNode('Format Error Alert', 'format-error-alert', [480, 300]),
    {
      parameters: {
        sendTo: 'REPLACE_WITH_YOUR_EMAIL@example.com',
        subject: '={{ $json.subject }}',
        emailType: 'html',
        message: '={{ $json.html }}',
        options: { appendAttribution: false },
      },
      id: 'send-alert',
      name: 'Send Failure Alert',
      type: 'n8n-nodes-base.gmail',
      typeVersion: 2.1,
      position: [700, 300],
    },
  ],
  connections: {
    'On Workflow Error': { main: [[{ node: 'Format Error Alert', type: 'main', index: 0 }]] },
    'Format Error Alert': { main: [[{ node: 'Send Failure Alert', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
  pinData: {},
  tags: [],
};

mkdirSync(outDir, { recursive: true });

const targets = [
  ['alba-market-pulse.json', mainWorkflow],
  ['alba-error-handler.json', errorWorkflow],
];

for (const [file, workflow] of targets) {
  const path = join(outDir, file);
  writeFileSync(path, `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');
  console.log(`  ${file.padEnd(28)} ${workflow.nodes.length} nodes`);
}

/* --- guard rails: catch mistakes here, not in the n8n import dialog --- */
const names = new Set(mainWorkflow.nodes.map((node) => node.name));
const problems = [];

for (const [from, outputs] of Object.entries(mainConnections)) {
  if (!names.has(from)) problems.push(`connection source "${from}" is not a node`);
  for (const branch of outputs.main) {
    for (const link of branch) {
      if (!names.has(link.node)) problems.push(`"${from}" points at missing node "${link.node}"`);
    }
  }
}

const triggers = ['Daily 07:00 GST', 'Run Manually'];
const reachable = new Set(triggers);
let changed = true;
while (changed) {
  changed = false;
  for (const [from, outputs] of Object.entries(mainConnections)) {
    if (!reachable.has(from)) continue;
    for (const branch of outputs.main) {
      for (const link of branch) {
        if (!reachable.has(link.node)) {
          reachable.add(link.node);
          changed = true;
        }
      }
    }
  }
}
for (const node of mainWorkflow.nodes) {
  if (!reachable.has(node.name)) problems.push(`"${node.name}" is unreachable from any trigger`);
}

if (problems.length > 0) {
  console.error('\nBuild failed:');
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}

console.log(`\n  graph ok — ${reachable.size} nodes reachable, no dangling connections`);
