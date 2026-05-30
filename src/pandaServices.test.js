import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);

function readProjectFile(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

describe('Panda Notes services conversion path', () => {
  const servicesHtml = readProjectFile('public/services.html');
  const privateIntakeHtml = readProjectFile('public/private-intake.html');
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
    expect(servicesHtml).toContain('Local-first workflow');
    expect(servicesHtml).toContain('Private handoff after scope');
    expect(servicesHtml).toContain('GitHub/Jira/Linear-ready outputs');
    expect(servicesHtml).toContain('Do not post credentials');
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
    expect(config).toContain('Panda Notes private intake');
  });

  it('documents service workflows and free-to-paid positioning', () => {
    const readme = readProjectFile('README.md');
    const serviceOps = readProjectFile('docs/SERVICE_OPERATIONS.md');
    const abTests = readProjectFile('docs/AB_TESTS.md');

    expect(readme).toContain('How the money works even though GitHub is free');
    expect(readme).toContain('## Service Flows');
    expect(readme).toContain('```mermaid');
    expect(readme).toContain('Setup Sprint');
    expect(readme).toContain('Developer Handoff Pack');
    expect(readme).toContain('Private Integration');
    expect(serviceOps).toContain('The free repo helps people evaluate and adopt Panda Notes');
    expect(serviceOps).toContain('## Request Workflow');
    expect(serviceOps).toContain('Delivery checklist');
    expect(serviceOps).toContain('Private Intake Page Flow');
    expect(serviceOps).toContain('copy/download the private intake packet');
    expect(abTests).toContain('Hero framing');
    expect(abTests).toContain('Turn messy tester feedback into developer-ready work');
    expect(abTests).toContain('CTA verb');
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
    expect(servicesHtml).toContain('Turn messy tester feedback into developer-ready work');
    expect(servicesHtml).toContain('Setup Panda Notes fast, clean up noisy exports');
    expect(servicesHtml).toContain('Get a scoped setup plan');
    expect(servicesHtml).toContain('Request private handoff scope');
    expect(servicesHtml).toContain('Request a private integration proposal');
    expect(servicesHtml).toContain('Need privacy? Start with public-safe scope only');
    expect(servicesHtml).toContain('The tool is free');
    expect(servicesHtml).toContain('The service is paid');
    expect(servicesHtml).toContain('Built For The Handoff Gap');
    expect(servicesHtml).toContain('Why pay?');
    expect(servicesHtml).toContain('The GitHub repo is free so teams can try Panda Notes');
    expect(servicesHtml).toContain('How is Panda Notes different from Marker');
    expect(servicesHtml).toContain('Panda Notes is narrower than full feedback platforms');
    expect(servicesHtml).toContain('After payment');
    expect(servicesHtml).toContain('use the private intake page if your project details should stay out of public issues');
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
    expect(servicesHtml).toContain("script.dataset.domain = 'p4nd4907.github.io'");
    expect(servicesHtml).toContain('schedulePlausibleLoad');
    expect(servicesHtml).toContain('data-analytics-event="cta_primary_click"');
    expect(servicesHtml).toContain('data-analytics-event="cta_secondary_click"');
    expect(servicesHtml).toContain('data-analytics-event="plan_card_click_setup"');
    expect(servicesHtml).toContain('data-analytics-event="plan_card_click_handoff"');
    expect(servicesHtml).toContain('data-analytics-event="plan_card_click_private"');
    expect(servicesHtml).toContain('data-analytics-event="private_request_start"');
    expect(servicesHtml).toContain('data-analytics-view-event="comparison_section_view"');
    expect(servicesHtml).toContain('trackServiceEvent');
    expect(servicesHtml).toContain('panda-service-event');
    expect(servicesHtml).toContain('github_issue_start');
    expect(servicesHtml).toContain('deposit_click');
    expect(servicesHtml).toContain('faq_expand_');
    expect(servicesHtml).toContain("window.gtag('event', eventName, props)");
    expect(servicesHtml).toContain("category: 'comparison'");

    const analyticsDocs = readProjectFile('docs/ANALYTICS.md');
    expect(analyticsDocs).toContain('| `private_request_start` | Private intake page CTA click |');
    expect(analyticsDocs).toContain('- `private_request_start`');
  });

  it('keeps keyboard navigation and focus states accessible on the services page', () => {
    expect(servicesHtml).toContain('<a class="skip-link" href="#main-content">Skip to main content</a>');
    expect(servicesHtml).toContain('<main id="main-content" tabindex="-1">');
    expect(servicesHtml).toContain('.skip-link:focus');
    expect(servicesHtml).toContain('a:focus-visible');
    expect(servicesHtml).toContain('button:focus-visible');
    expect(servicesHtml).toContain('input:focus-visible');
    expect(servicesHtml).toContain('outline: 3px solid var(--grove)');
    expect(servicesHtml).toContain('outline-offset: 3px');
    expect(servicesHtml).toContain('initSkipLinkFocus()');
    expect(servicesHtml).toContain('document.getElementById(\'main-content\')');
  });

  it('makes public-safe intake and private handoff boundaries explicit', () => {
    expect(servicesHtml).toContain('Public-safe request');
    expect(servicesHtml).toContain('Private handoff');
    expect(servicesHtml).toContain('./private-intake.html');
    expect(servicesHtml).toContain('Open private intake');
    expect(servicesHtml).toContain('aria-label="Open public-safe GitHub setup sprint request"');
    expect(servicesHtml).toContain('aria-label="Open public-safe GitHub handoff request; private files are shared after scope confirmation"');
    expect(servicesHtml).toContain('private files move to an agreed private channel after scope confirmation');
    expect(servicesHtml).not.toContain('Need privacy? Use the private intake path instead of public GitHub issues');
  });

  it('keeps the services page light with idle Stripe hydration and lazy below-fold rendering', () => {
    expect(servicesHtml).toContain('<link rel="preconnect" href="https://buy.stripe.com" crossorigin />');
    expect(servicesHtml).toContain('.section-lazy');
    expect(servicesHtml).toContain('content-visibility: auto;');
    expect(servicesHtml).toContain('contain-intrinsic-size: 800px;');
    expect(servicesHtml).toContain('class="step-grid section-lazy"');
    expect(servicesHtml).toContain('class="proof-grid section-lazy"');
    expect(servicesHtml).toContain('scheduleStripeHydration()');
    expect(servicesHtml).toContain('requestIdleCallback');
    expect(servicesHtml).toContain('DOMContentLoaded');
    expect(servicesHtml).not.toContain('body::before {\n        content: "";\n        position: fixed;');
  });

  it('ships a local-only private intake page for paid customers', () => {
    expect(privateIntakeHtml).toContain('<title>Panda Notes Private Intake | Secure Project Scope Packet</title>');
    expect(privateIntakeHtml).toContain('rel="canonical" href="https://p4nd4907.github.io/panda-notes/private-intake.html"');
    expect(privateIntakeHtml).toContain('data-private-intake-form');
    expect(privateIntakeHtml).toContain('data-intake-output');
    expect(privateIntakeHtml).toContain('Copy packet');
    expect(privateIntakeHtml).toContain('Download JSON');
    expect(privateIntakeHtml).toContain('Open email draft');
    expect(privateIntakeHtml).toContain('Submit private intake');
    expect(privateIntakeHtml).toContain('data-intake-endpoint="https://panda-notes-smoky.vercel.app/api/private-intake"');
    expect(privateIntakeHtml).toContain('fetch(intakeEndpoint');
    expect(privateIntakeHtml).toContain('Clear local draft');
    expect(privateIntakeHtml).toContain('localStorage');
    expect(privateIntakeHtml).toContain('navigator.clipboard.writeText');
    expect(privateIntakeHtml).toContain('URL.createObjectURL');
    expect(privateIntakeHtml).toContain('mailto:');
    expect(privateIntakeHtml).toContain('This page does not upload files or submit private data to GitHub.');
    expect(privateIntakeHtml).toContain('data-intake-email="khepri26@gmail.com"');
    expect(privateIntakeHtml).toContain('Email draft opened to ${intakeEmail}. Review the packet before sending.');
    expect(sitemapXml).toContain('<loc>https://p4nd4907.github.io/panda-notes/private-intake.html</loc>');
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
