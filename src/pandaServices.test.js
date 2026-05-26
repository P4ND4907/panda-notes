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
    expect(setupForm).toContain('id: payment-status');
    expect(handoffForm).toContain('id: payment-status');
    expect(privateForm).toContain('id: payment-status');
    expect(setupForm).toContain('Preferred delivery window');
    expect(handoffForm).toContain('Preferred delivery window');
    expect(privateForm).toContain('Preferred delivery window');
    expect(config).toContain('Panda Notes paid services');
  });

  it('documents phone-manageable service operations and service flowcharts', () => {
    const readme = readProjectFile('README.md');
    const serviceOps = readProjectFile('docs/SERVICE_OPERATIONS.md');

    expect(readme).toContain('## Service Flows');
    expect(readme).toContain('```mermaid');
    expect(readme).toContain('Setup Sprint');
    expect(readme).toContain('Developer Handoff Pack');
    expect(readme).toContain('Private Integration');
    expect(serviceOps).toContain('GitHub Mobile');
    expect(serviceOps).toContain('Daily Phone Workflow');
    expect(serviceOps).toContain('not fully passive');
  });

  it('auto-triages paid service issues with a reusable checklist', () => {
    const paidServiceTriage = readProjectFile('.github/workflows/paid-service-triage.yml');

    expect(paidServiceTriage).toContain('name: Paid service triage');
    expect(paidServiceTriage).toContain('types: [opened, labeled]');
    expect(paidServiceTriage).toContain('paid-service');
    expect(paidServiceTriage).toContain('panda-paid-service-triage');
    expect(paidServiceTriage).toContain('Confirm deposit in Stripe');
    expect(paidServiceTriage).toContain('SERVICE_OPERATIONS.md');
  });

  it('ships a no-key service bot for common buyer questions', () => {
    expect(servicesHtml).toContain('Panda Service Bot');
    expect(servicesHtml).toContain('data-service-bot');
    expect(servicesHtml).toContain('serviceBotAnswers');
    expect(servicesHtml).toContain('After payment');
    expect(servicesHtml).toContain('Do not post secrets');
    expect(servicesHtml).toContain('phone-friendly');
    expect(servicesHtml).toContain('no API key');
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
