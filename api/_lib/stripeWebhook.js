import { createHmac, timingSafeEqual } from 'node:crypto';

const acceptedEventTypes = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'payment_intent.succeeded'
]);

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

export function buildStripeIssue(event) {
  const object = event?.data?.object || {};
  const payment = extractPaymentSummary(event);
  const marker = `stripe-event-${event.id}`;
  const title = `[Stripe Paid] ${payment.amountLabel} - ${payment.email || payment.customer || event.id}`;
  const body = [
    `<!-- ${marker} -->`,
    '# Panda Notes Stripe Confirmation',
    '',
    `Event ID: ${event.id}`,
    `Event type: ${event.type}`,
    `Created: ${event.created ? new Date(event.created * 1000).toISOString() : new Date().toISOString()}`,
    `Amount: ${payment.amountLabel}`,
    `Customer email: ${payment.email || 'Not provided'}`,
    `Customer ID: ${payment.customer || 'Not provided'}`,
    `Payment link: ${payment.paymentLink || 'Not provided'}`,
    `Checkout session: ${object.id || 'Not provided'}`,
    `Payment intent: ${payment.paymentIntent || 'Not provided'}`,
    '',
    '## Metadata',
    codeBlock(JSON.stringify(object.metadata || {}, null, 2)),
    '',
    '## Owner Checklist',
    '- Match this payment to a private intake packet or public-safe GitHub request.',
    '- Add `payment-confirmed` to the matching work item.',
    '- Confirm scope and delivery date before work starts.'
  ].join('\n');

  return {
    marker,
    title,
    body,
    labels: ['paid-service', 'payment-confirmed', 'stripe-deposit']
  };
}

export function extractPaymentSummary(event) {
  const object = event?.data?.object || {};
  const amount = object.amount_total ?? object.amount_received ?? object.amount ?? 0;
  const currency = String(object.currency || 'usd').toUpperCase();
  const email = object.customer_details?.email || object.receipt_email || object.billing_details?.email || '';
  return {
    amount,
    amountLabel: formatAmount(amount, currency),
    currency,
    customer: typeof object.customer === 'string' ? object.customer : '',
    email,
    paymentIntent: typeof object.payment_intent === 'string' ? object.payment_intent : object.id || '',
    paymentLink: typeof object.payment_link === 'string' ? object.payment_link : ''
  };
}

function formatAmount(amount, currency) {
  const major = Number(amount || 0) / 100;
  return `${major.toLocaleString('en-US', { style: 'currency', currency })} ${currency}`;
}

function codeBlock(value) {
  return ['```json', value, '```'].join('\n');
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
