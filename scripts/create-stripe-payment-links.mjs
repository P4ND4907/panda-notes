import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STRIPE_API_VERSION = '2026-02-25.clover';
const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const secretKey = process.env.STRIPE_SECRET_KEY;
const baseUrl = withTrailingSlash(process.env.PANDA_NOTES_BASE_URL || 'https://p4nd4907.github.io/panda-notes/');
const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'stripe-links.json');

const offers = [
  {
    key: 'setup-sprint',
    label: 'Pay $250 setup deposit',
    amount: '$250',
    unitAmount: 25000,
    productName: 'Panda Notes Setup Sprint Deposit',
    description: 'Deposit for installing Panda Notes into a staging or beta app.',
    fallbackUrl: 'https://github.com/P4ND4907/panda-notes/issues/new?template=setup-sprint.yml'
  },
  {
    key: 'developer-handoff',
    label: 'Pay $150 handoff deposit',
    amount: '$150',
    unitAmount: 15000,
    productName: 'Panda Notes Developer Handoff Deposit',
    description: 'Deposit for turning Panda Notes tester exports into developer-ready repair work.',
    fallbackUrl: 'https://github.com/P4ND4907/panda-notes/issues/new?template=developer-handoff-pack.yml'
  },
  {
    key: 'private-integration',
    label: 'Pay $1,000 private build deposit',
    amount: '$1,000',
    unitAmount: 100000,
    productName: 'Panda Notes Private Integration Deposit',
    description: 'Deposit for a private, branded, or deeper Panda Notes integration.',
    fallbackUrl: 'https://github.com/P4ND4907/panda-notes/issues/new?template=private-integration.yml'
  }
];

if (!secretKey || !secretKey.startsWith('sk_')) {
  console.error('Missing STRIPE_SECRET_KEY. Set it to a Stripe test or live secret key before running this script.');
  process.exit(1);
}

const links = {};

try {
  for (const offer of offers) {
    const product = await stripeRequest('products', {
      name: offer.productName,
      description: offer.description,
      'metadata[panda_notes_offer]': offer.key
    });

    const price = await stripeRequest('prices', {
      product: product.id,
      currency: 'usd',
      unit_amount: String(offer.unitAmount),
      'metadata[panda_notes_offer]': offer.key
    });

    const paymentLink = await stripeRequest('payment_links', {
      'line_items[0][price]': price.id,
      'line_items[0][quantity]': '1',
      'after_completion[type]': 'redirect',
      'after_completion[redirect][url]': buildReturnUrl(offer.key),
      'metadata[panda_notes_offer]': offer.key
    });

    links[offer.key] = {
      label: offer.label,
      amount: offer.amount,
      url: paymentLink.url,
      fallbackUrl: offer.fallbackUrl,
      paymentLinkId: paymentLink.id,
      productId: product.id,
      priceId: price.id
    };
  }

  const config = {
    mode: 'stripe-payment-links',
    currency: 'usd',
    links,
    updatedAt: new Date().toISOString()
  };

  await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  console.log(`Wrote Stripe Payment Links to ${outputPath}`);
  for (const [key, value] of Object.entries(links)) {
    console.log(`${key}: ${value.url}`);
  }
} catch (error) {
  console.error(redactSecrets(error.message || 'Stripe link creation failed.'));
  process.exitCode = 1;
}

async function stripeRequest(path, params) {
  const response = await fetch(`${STRIPE_API_BASE}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION
    },
    body: new URLSearchParams(params)
  });

  const body = await response.json();
  if (!response.ok) {
    const message = body?.error?.message || `Stripe request failed with ${response.status}`;
    throw new Error(redactSecrets(message));
  }
  return body;
}

function buildReturnUrl(offerKey) {
  const url = new URL('services.html', baseUrl);
  url.searchParams.set('paid', offerKey);
  return url.toString();
}

function withTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function redactSecrets(value) {
  return String(value).replace(/sk_(test|live)_[^\s'"`]+/g, '[redacted-stripe-key]');
}
