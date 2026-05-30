import { spawn } from 'node:child_process';

const STRIPE_API_VERSION = '2026-02-25.clover';
const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookUrl = process.env.PANDA_NOTES_STRIPE_WEBHOOK_URL || 'https://panda-notes-smoky.vercel.app/api/stripe-webhook';
const webhookEvents = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'payment_intent.succeeded'
];

if (!secretKey || !secretKey.startsWith('sk_')) {
  console.error('Missing STRIPE_SECRET_KEY. Use npm.cmd run stripe:webhook:secure so the key stays out of logs.');
  process.exit(1);
}

try {
  const webhook = await stripeRequest('webhook_endpoints', {
    url: webhookUrl,
    enabled_events: webhookEvents,
    description: 'Panda Notes payment confirmation webhook',
    metadata: {
      panda_notes: 'stripe-confirmation'
    }
  });

  if (!webhook.secret?.startsWith('whsec_')) {
    throw new Error('Stripe did not return a webhook signing secret.');
  }

  await setVercelEnvSecret('STRIPE_WEBHOOK_SECRET', webhook.secret);

  console.log(`Stripe webhook created: ${webhook.id}`);
  console.log(`Webhook URL: ${webhookUrl}`);
  console.log('Stored STRIPE_WEBHOOK_SECRET in Vercel production environment.');
  console.log('Redeploy Vercel production after setting the secret so the function can read it.');
} catch (error) {
  console.error(redactSecrets(error.message || 'Stripe webhook creation failed.'));
  process.exitCode = 1;
}

async function stripeRequest(path, params) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => body.append(`${key}[]`, item));
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        body.append(`${key}[${nestedKey}]`, nestedValue);
      });
      return;
    }
    body.append(key, value);
  });

  const response = await fetch(`${STRIPE_API_BASE}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION
    },
    body
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(redactSecrets(result?.error?.message || `Stripe request failed with ${response.status}`));
  }
  return result;
}

async function setVercelEnvSecret(name, value) {
  await runVercel(['env', 'rm', name, 'production', '--yes'], '', true);
  await runVercel(['env', 'add', name, 'production'], value);
}

function runVercel(args, stdin = '', allowFailure = false) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return new Promise((resolve, reject) => {
    const child = spawn(command, ['vercel', ...args], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('close', (code) => {
      if (code && !allowFailure) {
        reject(new Error(redactSecrets(output || `vercel exited with ${code}`)));
        return;
      }
      resolve(output);
    });
    child.stdin.end(stdin ? `${stdin}\n` : '');
  });
}

function redactSecrets(value) {
  return String(value)
    .replace(/sk_(test|live)_[^\s'"`]+/g, '[redacted-stripe-key]')
    .replace(/whsec_[^\s'"`]+/g, '[redacted-webhook-secret]');
}
