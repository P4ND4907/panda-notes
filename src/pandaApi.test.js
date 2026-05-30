import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildIntakeIssue, validateIntakePayload } from '../api/_lib/intake.js';
import { buildStripeIssue, shouldRecordStripeEvent, verifyStripeSignature } from '../api/_lib/stripeWebhook.js';

describe('Panda Notes private intake API helpers', () => {
  it('validates private intake packets before creating private issues', () => {
    const validation = validateIntakePayload({
      service: 'Developer Handoff Pack',
      replyEmail: 'buyer@example.com',
      customerName: 'Buyer Team',
      scope: 'Turn 15 tester notes into ranked GitHub issues.',
      privacyConfirm: true
    });

    expect(validation.ok).toBe(true);
    const issue = buildIntakeIssue(validation.data);
    expect(issue.title).toContain('[Private Intake] Developer Handoff Pack');
    expect(issue.labels).toEqual(expect.arrayContaining(['paid-service', 'private-intake', 'developer-handoff', 'scope-needed']));
    expect(issue.body).toContain('buyer@example.com');
    expect(issue.body).toContain('Owner Checklist');
  });

  it('rejects missing privacy consent, bad email, short scope, and honeypot spam', () => {
    const validation = validateIntakePayload({
      replyEmail: 'not-email',
      scope: 'too short',
      website: 'spam'
    });

    expect(validation.ok).toBe(false);
    expect(validation.errors).toEqual(expect.arrayContaining([
      'privacy confirmation is required',
      'valid reply email is required',
      'scope must be at least 12 characters',
      'spam honeypot was filled'
    ]));
  });
});

describe('Panda Notes Stripe webhook helpers', () => {
  it('verifies Stripe signatures with timestamp tolerance', () => {
    const rawBody = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' });
    const secret = 'whsec_test_secret';
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`, 'utf8')
      .digest('hex');

    expect(verifyStripeSignature(rawBody, `t=${timestamp},v1=${signature}`, secret)).toBe(true);
    expect(verifyStripeSignature(rawBody, `t=${timestamp},v1=bad`, secret)).toBe(false);
  });

  it('builds a private payment confirmation issue from checkout events', () => {
    const event = {
      id: 'evt_123',
      type: 'checkout.session.completed',
      created: 1780100000,
      data: {
        object: {
          id: 'cs_test_123',
          amount_total: 25000,
          currency: 'usd',
          customer: 'cus_123',
          customer_details: { email: 'buyer@example.com' },
          payment_link: 'plink_123',
          payment_intent: 'pi_123',
          metadata: { service: 'setup-sprint' }
        }
      }
    };

    expect(shouldRecordStripeEvent(event)).toBe(true);
    const issue = buildStripeIssue(event);
    expect(issue.marker).toBe('stripe-event-evt_123');
    expect(issue.title).toContain('[Stripe Paid]');
    expect(issue.body).toContain('$250.00 USD');
    expect(issue.body).toContain('buyer@example.com');
    expect(issue.labels).toEqual(expect.arrayContaining(['paid-service', 'payment-confirmed', 'stripe-deposit']));
  });
});
