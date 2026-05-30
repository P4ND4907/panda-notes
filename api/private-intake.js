import { applyCors, handleOptions, parseJsonRequest, sendJson } from './_lib/http.js';
import { buildIntakeIssue, validateIntakePayload } from './_lib/intake.js';
import { createPrivateIssue } from './_lib/githubIssues.js';

export default async function handler(request, response) {
  applyCors(request, response);
  if (handleOptions(request, response)) return;
  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, error: 'method_not_allowed' });
    return;
  }

  try {
    const payload = await parseJsonRequest(request);
    const validation = validateIntakePayload(payload);
    if (!validation.ok) {
      sendJson(response, 400, { ok: false, error: 'invalid_intake', details: validation.errors });
      return;
    }

    const issue = buildIntakeIssue(validation.data);
    const created = await createPrivateIssue(issue);
    sendJson(response, 201, {
      ok: true,
      intakeId: issue.intakeId,
      issueUrl: created.html_url || null
    });
  } catch (error) {
    const statusCode = error.message === 'missing_private_intake_github_token' ? 503 : 500;
    sendJson(response, statusCode, {
      ok: false,
      error: statusCode === 503 ? 'private_intake_not_configured' : 'private_intake_failed'
    });
  }
}
