import { createIssueComment, createPrivateIssue, findIssueByMarker } from './githubIssues.js';

const allowedPages = new Set(['services', 'private-intake', 'launch']);
const exactEvents = new Set([
  'page_view',
  'cta_primary_click',
  'cta_secondary_click',
  'plan_card_click_setup',
  'plan_card_click_handoff',
  'plan_card_click_private',
  'private_request_start',
  'private_intake_submit',
  'private_intake_submit_success',
  'private_intake_submit_error',
  'github_issue_start',
  'deposit_click',
  'sample_output_view',
  'comparison_section_view',
  'launch_copy_post',
  'launch_outbound_click'
]);

export function validateAnalyticsPayload(payload = {}) {
  const errors = [];
  const eventName = cleanToken(payload.eventName, 80);
  const page = cleanToken(payload.page, 40);
  const sessionId = cleanToken(payload.sessionId, 100);

  if (!isKnownEvent(eventName)) errors.push('known analytics event is required');
  if (!allowedPages.has(page)) errors.push('known analytics page is required');
  if (!/^[a-zA-Z0-9._:-]{8,100}$/.test(sessionId)) errors.push('valid anonymous session id is required');

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      eventName,
      page,
      path: cleanPath(payload.path),
      title: cleanString(payload.title, 120),
      referrerHost: getReferrerHost(payload.referrer),
      sessionId,
      props: cleanProps(payload.props)
    }
  };
}

export function buildAnalyticsDailyIssue(event, now = new Date()) {
  const day = getAnalyticsDay(now);
  const marker = `panda-analytics-${day}`;

  return {
    marker,
    title: `[Analytics] Panda Notes funnel ${day}`,
    labels: ['analytics', 'service-funnel'],
    body: [
      `<!-- ${marker} -->`,
      `# Panda Notes Analytics - ${day}`,
      '',
      'Privacy-safe daily funnel rollup for Panda Notes.',
      '',
      'Captured:',
      '- Page views',
      '- Service CTA clicks',
      '- Stripe deposit clicks',
      '- GitHub issue starts',
      '- Private intake starts and submits',
      '',
      'Not captured:',
      '- IP addresses',
      '- Raw user-agent strings',
      '- Private intake form body',
      '- Customer secrets or uploaded files',
      '',
      'Each event is appended as a comment on this issue. Run `npm.cmd run analytics:summary` to summarize counts.'
    ].join('\n')
  };
}

export function buildAnalyticsComment(event, now = new Date()) {
  const body = {
    timestamp: now.toISOString(),
    eventName: event.eventName,
    page: event.page,
    path: event.path,
    title: event.title,
    referrerHost: event.referrerHost,
    sessionId: event.sessionId,
    props: event.props
  };

  return [
    '<!-- panda-analytics-event -->',
    '```json',
    JSON.stringify(body, null, 2),
    '```'
  ].join('\n');
}

export async function recordAnalyticsEvent(payload, { fetchImpl = fetch, now = new Date() } = {}) {
  const validation = validateAnalyticsPayload(payload);
  if (!validation.ok) {
    const error = new Error('invalid_analytics_event');
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  const event = validation.data;
  const dailyIssue = buildAnalyticsDailyIssue(event, now);
  let issue = await findIssueByMarker(dailyIssue.marker, fetchImpl);
  if (!issue) {
    issue = await createPrivateIssue(dailyIssue, fetchImpl);
  }

  const comment = await createIssueComment(issue.number, buildAnalyticsComment(event, now), fetchImpl);
  return {
    event,
    issueNumber: issue.number,
    commentUrl: comment.html_url || null
  };
}

function isKnownEvent(eventName) {
  return exactEvents.has(eventName) || /^faq_expand_[a-z0-9_-]{1,48}$/.test(eventName);
}

function getAnalyticsDay(now) {
  return now.toISOString().slice(0, 10);
}

function cleanToken(value, maxLength) {
  return cleanString(value, maxLength).replace(/[^a-zA-Z0-9._:-]/g, '');
}

function cleanString(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function cleanPath(value) {
  const clean = cleanString(value, 220);
  if (!clean.startsWith('/')) return '/';
  return clean.split('?')[0].split('#')[0].slice(0, 160) || '/';
}

function getReferrerHost(referrer) {
  const clean = cleanString(referrer, 300);
  if (!clean) return '';
  try {
    return new URL(clean).hostname.slice(0, 120);
  } catch {
    return '';
  }
}

function cleanProps(props = {}) {
  if (!props || typeof props !== 'object' || Array.isArray(props)) return {};
  return Object.fromEntries(
    Object.entries(props)
      .slice(0, 20)
      .filter(([key, value]) => /^[a-zA-Z0-9._:-]{1,48}$/.test(key) && isScalar(value))
      .map(([key, value]) => [key, typeof value === 'string' ? cleanString(value, 160) : value])
  );
}

function isScalar(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' || typeof value === 'boolean';
}
