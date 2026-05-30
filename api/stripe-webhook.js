import { applyCors, readRawBody, sendJson } from './_lib/http.js';
import { createPrivateIssue, findIssueByMarker } from './_lib/githubIssues.js';
import { buildStripeIssue, shouldRecordStripeEvent, verifyStripeSignature } from './_lib/stripeWebhook.js';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(request, response) {
  applyCors(request, response);
  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, error: 'method_not_allowed' });
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    sendJson(response, 503, { ok: false, error: 'stripe_webhook_not_configured' });
    return;
  }

  try {
    const rawBody = await readRawBody(request, 64_000);
    const signature = request.headers['stripe-signature'];
    if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
      sendJson(response, 400, { ok: false, error: 'invalid_signature' });
      return;
    }

    const event = JSON.parse(rawBody);
    if (!shouldRecordStripeEvent(event)) {
      sendJson(response, 200, { ok: true, ignored: true, eventType: event.type });
      return;
    }

    const issue = buildStripeIssue(event);
    const existing = await findIssueByMarker(issue.marker);
    if (existing) {
      sendJson(response, 200, { ok: true, duplicate: true, issueUrl: existing.html_url || null });
      return;
    }

    const created = await createPrivateIssue(issue);
    sendJson(response, 201, {
      ok: true,
      eventId: event.id,
      issueUrl: created.html_url || null
    });
  } catch {
    sendJson(response, 500, { ok: false, error: 'stripe_webhook_failed' });
  }
}
