import { createHmac, timingSafeEqual } from 'node:crypto';

const acceptedEventTypes = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'payment_intent.succeeded'
]);

const offerLabels = {
  'setup-sprint': 'Setup Sprint',
  'developer-handoff': 'Developer Handoff Pack',
  'private-integration': 'Private Integration',
  'scope-needed': 'Scope Needed'
};

export function verifyStripeSignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  if (!signatureHeader || !secret) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    })
  );
  const timestamp = Number(parts.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;

  const signatures = signatureHeader
    .split(',')
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3));
  if (!signatures.length) return false;

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');

  return signatures.some((signature) => secureCompareHex(signature, expected));
}

export function shouldRecordStripeEvent(event) {
  return acceptedEventTypes.has(event?.type);
}

export function buildStripeIssue(event, options = {}) {
  const object = event?.data?.object || {};
  const payment = extractPaymentSummary(event);
  const offerLabel = offerLabels[payment.offerKey] || 'Panda Notes Service';
  const intakeLink = buildPaidIntakeUrl({
    offerKey: payment.offerKey,
    eventId: event.id,
    email: payment.email,
    paymentIntent: payment.paymentIntent
  }, options.baseUrl || process.env.PANDA_NOTES_BASE_URL || 'https://p4nd4907.github.io/panda-notes/');
  const marker = `stripe-event-${event.id}`;
  const title = `[Stripe Paid] ${offerLabel} - ${payment.amountLabel} - ${payment.email || payment.customer || event.id}`;
  const body = [
    `<!-- ${marker} -->`,
    '# Panda Notes Stripe Confirmation',
    '',
    `Event ID: ${event.id}`,
    `Event type: ${event.type}`,
    `Offer: ${offerLabel}`,
    `Created: ${event.created ? new Date(event.created * 1000).toISOString() : new Date().toISOString()}`,
    `Amount: ${payment.amountLabel}`,
    `Customer email: ${payment.email || 'Not provided'}`,
    `Customer ID: ${payment.customer || 'Not provided'}`,
    `Payment link: ${payment.paymentLink || 'Not provided'}`,
    `Checkout session: ${object.id || 'Not provided'}`,
    `Payment intent: ${payment.paymentIntent || 'Not provided'}`,
    `Private intake link: ${intakeLink}`,
    '',
    '## Metadata',
    codeBlock(JSON.stringify(object.metadata || {}, null, 2)),
    '',
    '## Owner Checklist',
    '- Send the private intake link to the customer if they did not already submit scope.',
    '- Match this payment to a private intake packet or public-safe GitHub request.',
    '- Add `payment-confirmed` to the matching work item.',
    '- Confirm scope and delivery date before work starts.'
  ].join('\n');

  return {
    marker,
    title,
    body,
    labels: ['paid-service', 'payment-confirmed', 'stripe-deposit', payment.offerKey].filter(Boolean)
  };
}

export function extractPaymentSummary(event) {
  const object = event?.data?.object || {};
  const amount = object.amount_total ?? object.amount_received ?? object.amount ?? 0;
  const currency = String(object.currency || 'usd').toUpperCase();
  const email = object.customer_details?.email || object.receipt_email || object.billing_details?.email || '';
  const offerKey = normalizeOfferKey(object.metadata?.panda_notes_offer || object.metadata?.service || '');
  return {
    amount,
    amountLabel: formatAmount(amount, currency),
    currency,
    customer: typeof object.customer === 'string' ? object.customer : '',
    email,
    offerKey,
    paymentIntent: typeof object.payment_intent === 'string' ? object.payment_intent : object.id || '',
    paymentLink: typeof object.payment_link === 'string' ? object.payment_link : ''
  };
}

export function buildPaidIntakeUrl({
  offerKey = 'scope-needed',
  eventId = '',
  email = '',
  paymentIntent = ''
} = {}, baseUrl = 'https://p4nd4907.github.io/panda-notes/') {
  const url = new URL('private-intake.html', withTrailingSlash(baseUrl));
  url.searchParams.set('service', offerLabels[normalizeOfferKey(offerKey)] || 'Not sure yet');
  if (eventId) url.searchParams.set('paymentReference', eventId);
  if (email) url.searchParams.set('replyEmail', email);
  if (paymentIntent) url.searchParams.set('stripePayment', paymentIntent);
  return url.toString();
}

function formatAmount(amount, currency) {
  const major = Number(amount || 0) / 100;
  return `${major.toLocaleString('en-US', { style: 'currency', currency })} ${currency}`;
}

function codeBlock(value) {
  return ['```json', value, '```'].join('\n');
}

function normalizeOfferKey(value) {
  const key = String(value || '').trim().toLowerCase();
  return offerLabels[key] ? key : 'scope-needed';
}

function withTrailingSlash(value) {
  return String(value || '').endsWith('/') ? String(value) : `${value}/`;
}

function secureCompareHex(a, b) {
  try {
    const left = Buffer.from(a, 'hex');
    const right = Buffer.from(b, 'hex');
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}
