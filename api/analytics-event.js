import { applyCors, handleOptions, isAllowedOrigin, parseJsonRequest, sendJson } from './_lib/http.js';
import { recordAnalyticsEvent } from './_lib/analytics.js';

export default async function handler(request, response) {
  applyCors(request, response);
  if (handleOptions(request, response)) return;
  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, error: 'method_not_allowed' });
    return;
  }

  const origin = request.headers.origin || '';
  if (origin && !isAllowedOrigin(origin)) {
    sendJson(response, 403, { ok: false, error: 'origin_not_allowed' });
    return;
  }

  try {
    const payload = await parseJsonRequest(request, 8_000);
    const recorded = await recordAnalyticsEvent(payload);
    sendJson(response, 202, {
      ok: true,
      issueNumber: recorded.issueNumber,
      commentUrl: recorded.commentUrl
    });
  } catch (error) {
    if (error.message === 'invalid_analytics_event') {
      sendJson(response, 400, { ok: false, error: 'invalid_analytics_event', details: error.details || [] });
      return;
    }

    const statusCode = error.message === 'missing_private_intake_github_token' ? 503 : 500;
    sendJson(response, statusCode, {
      ok: false,
      error: statusCode === 503 ? 'analytics_not_configured' : 'analytics_event_failed'
    });
  }
}
