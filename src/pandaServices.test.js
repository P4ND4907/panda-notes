import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);

function readProjectFile(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

describe('Panda Notes services conversion path', () => {
  const servicesHtml = readProjectFile('public/services.html');
  const stripeConfig = JSON.parse(readProjectFile('public/stripe-links.json'));

  it('links every paid intake form from the public services page', () => {
    expect(servicesHtml).toContain('/issues/new?template=setup-sprint.yml');
    expect(servicesHtml).toContain('/issues/new?template=developer-handoff-pack.yml');
    expect(servicesHtml).toContain('/issues/new?template=private-integration.yml');
  });

  it('keeps the free product and privacy boundary visible', () => {
    expect(servicesHtml).toContain('The Free Product Stays Useful');
    expect(servicesHtml).toContain('MIT licensed');
    expect(servicesHtml).toContain('No hidden telemetry');
    expect(servicesHtml).toContain('do not post credentials');
  });

  it('configures GitHub issue forms for paid service leads', () => {
    const setupForm = readProjectFile('.github/ISSUE_TEMPLATE/setup-sprint.yml');
    const handoffForm = readProjectFile('.github/ISSUE_TEMPLATE/developer-handoff-pack.yml');
    const privateForm = readProjectFile('.github/ISSUE_TEMPLATE/private-integration.yml');
    const config = readProjectFile('.github/ISSUE_TEMPLATE/config.yml');

    expect(setupForm).toContain('labels: ["paid-service", "setup-sprint"]');
    expect(handoffForm).toContain('labels: ["paid-service", "developer-handoff"]');
    expect(privateForm).toContain('labels: ["paid-service", "private-integration"]');
    expect(config).toContain('Panda Notes paid services');
  });

  it('ships Stripe Payment Link wiring with safe GitHub fallbacks', () => {
    expect(servicesHtml).toContain('./stripe-links.json');
    expect(servicesHtml).toContain('data-stripe-offer="setup-sprint"');
    expect(servicesHtml).toContain('data-stripe-offer="developer-handoff"');
    expect(servicesHtml).toContain('data-stripe-offer="private-integration"');
    expect(servicesHtml).toContain('data-stripe-status');
    expect(servicesHtml).toContain('checkout');
    expect(servicesHtml).toContain('isTestCheckoutUrl');

    expect(stripeConfig.mode).toBe('stripe-payment-links');
    expect(stripeConfig.currency).toBe('usd');
    expect(Object.keys(stripeConfig.links).sort()).toEqual([
      'developer-handoff',
      'private-integration',
      'setup-sprint'
    ]);
    expect(stripeConfig.links['setup-sprint'].fallbackUrl).toContain('setup-sprint.yml');
  });

  it('includes a Stripe API helper without committing secret keys', () => {
    const stripeScript = readProjectFile('scripts/create-stripe-payment-links.mjs');

    expect(stripeScript).toContain('STRIPE_SECRET_KEY');
    expect(stripeScript).toContain('payment_links');
    expect(stripeScript).toContain('2026-02-25.clover');
    expect(stripeScript).toContain('redactSecrets');
    expect(stripeScript).toContain('[redacted-stripe-key]');
    expect(JSON.stringify(stripeConfig)).not.toContain('sk_test_');
    expect(JSON.stringify(stripeConfig)).not.toContain('sk_live_');
  });

  it('includes a hidden local secret-key runner for Windows', () => {
    const secureRunner = readProjectFile('scripts/create-stripe-links-secure.ps1');

    expect(secureRunner).toContain('Read-Host "Stripe secret key" -AsSecureString');
    expect(secureRunner).toContain('Remove-Item Env:\\STRIPE_SECRET_KEY');
    expect(secureRunner).toContain('ZeroFreeBSTR');
    expect(secureRunner).not.toContain('Write-Host $plainSecret');
  });
});
