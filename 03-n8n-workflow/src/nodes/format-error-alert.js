// Runs in the separate error-handler workflow, triggered by n8n when the main workflow
// throws anything the in-flow branches did not already catch.
const context = $input.first().json;
const workflow = context.workflow || {};
const execution = context.execution || {};
const error = execution.error || context.error || {};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const failedNode = error.node?.name || execution.lastNodeExecuted || 'unknown node';
const message = error.message || 'No error message supplied by n8n.';
const when = new Date().toISOString();

const html = `<!doctype html>
<html><body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;padding:26px;border-top:4px solid #dc2626;">
    <div style="font-size:19px;font-weight:700;color:#0f172a;">Alba Market Pulse — run failed</div>
    <div style="margin-top:4px;font-size:13px;color:#64748b;">${escapeHtml(when)}</div>
    <table style="margin-top:18px;width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
      <tr><td style="padding:6px 0;color:#64748b;width:130px;">Workflow</td><td>${escapeHtml(workflow.name || 'Alba Market Pulse')}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Failed at node</td><td><strong>${escapeHtml(failedNode)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Execution</td><td>${escapeHtml(execution.id || 'n/a')}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;vertical-align:top;">Message</td><td style="color:#b91c1c;">${escapeHtml(message)}</td></tr>
    </table>
    ${
      execution.url
        ? `<a href="${escapeHtml(execution.url)}" style="display:inline-block;margin-top:18px;padding:10px 16px;background:#0f172a;color:#f8fafc;border-radius:8px;text-decoration:none;font-size:13px;">Open the failed execution</a>`
        : ''
    }
    <div style="margin-top:18px;font-size:12px;color:#94a3b8;line-height:1.6;">
      Feed-level failures are handled inside the workflow and do not reach this alert.
      This email means something outside that path broke — credentials, the LLM call, or the delivery step.
    </div>
  </div>
</body></html>`;

return [
  {
    json: {
      subject: `[ALERT] Alba Market Pulse failed at "${failedNode}"`,
      html,
      failedNode,
      message,
      executionUrl: execution.url || '',
      failedAt: when,
    },
  },
];
