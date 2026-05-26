import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);

function readProjectFile(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

describe('Panda Notes services conversion path', () => {
  const servicesHtml = readProjectFile('public/services.html');
  const stripeConfig = JSON.parse(readProjectFile('public/stripe-links.json'));
  const robotsTxt = readProjectFile('public/robots.txt');
  const sitemapXml = readProjectFile('public/sitemap.xml');

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

  it('documents service workflows and free-to-paid positioning', () => {
    const readme = readProjectFile('README.md');
    const serviceOps = readProjectFile('docs/SERVICE_OPERATIONS.md');

    expect(readme).toContain('How the money works even though GitHub is free');
    expect(readme).toContain('## Service Flows');
    expect(readme).toContain('```mermaid');
    expect(readme).toContain('Setup Sprint');
    expect(readme).toContain('Developer Handoff Pack');
    expect(readme).toContain('Private Integration');
    expect(serviceOps).toContain('The free repo helps people evaluate and adopt Panda Notes');
    expect(serviceOps).toContain('## Request Workflow');
    expect(serviceOps).toContain('Delivery checklist');
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

  it('ships a human-sounding service guide for common buyer questions', () => {
    expect(servicesHtml).toContain('Panda Service Guide');
    expect(servicesHtml).toContain('data-service-guide');
    expect(servicesHtml).toContain('serviceGuideAnswers');
    expect(servicesHtml).toContain('How Panda Notes makes money');
    expect(servicesHtml).toContain('The tool is free');
    expect(servicesHtml).toContain('The service is paid');
    expect(servicesHtml).toContain('Built For The Handoff Gap');
    expect(servicesHtml).toContain('Why pay?');
    expect(servicesHtml).toContain('The GitHub repo is free so teams can try Panda Notes');
    expect(servicesHtml).toContain('How is Panda Notes different from Marker');
    expect(servicesHtml).toContain('Panda Notes is narrower than full feedback platforms');
    expect(servicesHtml).toContain('After payment');
    expect(servicesHtml).toContain('Do not post secrets');
    expect(servicesHtml).toContain('phone-friendly');
  });

  it('ships search metadata, canonical URLs, sitemap, robots, and service schema', () => {
    expect(servicesHtml).toContain('<title>Panda Notes Services | Bug Triage, Setup, and Developer Handoff</title>');
    expect(servicesHtml).toContain('name="description"');
    expect(servicesHtml).toContain('rel="canonical" href="https://p4nd4907.github.io/panda-notes/services.html"');
    expect(servicesHtml).toContain('property="og:title" content="Panda Notes Services"');
    expect(servicesHtml).toContain('name="twitter:card" content="summary"');
    expect(servicesHtml).toContain('application/ld+json');
    expect(servicesHtml).toContain('"@type": "Organization"');
    expect(servicesHtml).toContain('"@type": "OfferCatalog"');
    expect(servicesHtml).toContain('"Setup Sprint"');
    expect(servicesHtml).toContain('"Developer Handoff Pack"');
    expect(servicesHtml).toContain('"Private Integration"');

    expect(robotsTxt).toContain('User-agent: *');
    expect(robotsTxt).toContain('Sitemap: https://p4nd4907.github.io/panda-notes/sitemap.xml');
    expect(sitemapXml).toContain('<loc>https://p4nd4907.github.io/panda-notes/services.html</loc>');
    expect(sitemapXml).toContain('<lastmod>2026-05-26</lastmod>');
  });

  it('adds privacy-aligned analytics hooks for the service funnel', () => {
    expect(servicesHtml).toContain('https://plausible.io/js/script.js');
    expect(servicesHtml).toContain('data-domain="p4nd4907.github.io"');
    expect(servicesHtml).toContain('data-analytics-event="cta_primary_click"');
    expect(servicesHtml).toContain('data-analytics-event="cta_secondary_click"');
    expect(servicesHtml).toContain('data-analytics-event="plan_card_click_setup"');
    expect(servicesHtml).toContain('data-analytics-event="plan_card_click_handoff"');
    expect(servicesHtml).toContain('data-analytics-event="plan_card_click_private"');
    expect(servicesHtml).toContain('data-analytics-view-event="comparison_section_view"');
    expect(servicesHtml).toContain('trackServiceEvent');
    expect(servicesHtml).toContain('panda-service-event');
    expect(servicesHtml).toContain('github_issue_start');
    expect(servicesHtml).toContain('deposit_click');
    expect(servicesHtml).toContain('faq_expand_');
    expect(servicesHtml).toContain("window.gtag('event', eventName, props)");
    expect(servicesHtml).toContain("category: 'comparison'");
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
