# Stripe Setup

Panda Notes is hosted as a static GitHub Pages app, so the safest first Stripe setup is Payment Links. Payment Links keep secret keys out of the browser and send buyers to Stripe-hosted checkout.

## Offers

Create three one-time deposit links:

- Panda Notes Setup Sprint Deposit: `$250`
- Panda Notes Developer Handoff Deposit: `$150`
- Panda Notes Private Integration Deposit: `$1,000`

The public Services page reads `public/stripe-links.json`. If a Stripe URL is present for an offer, its button goes to Stripe checkout. If a Stripe URL is blank, the button falls back to the matching GitHub intake form.

Generated Payment Links redirect buyers back to Panda Notes after checkout. The current automation routes buyers to the private intake path so the paid customer can submit service, payment reference, reply email, scope, deadline, project URL, and delivery context without posting private details to public GitHub issues.

## Dashboard Setup

1. Open Stripe Dashboard Payment Links.
2. Create the three products above as one-time payments.
3. Copy each `https://buy.stripe.com/...` URL.
4. Paste each URL into `public/stripe-links.json`.
5. Run:

```powershell
npm.cmd test
npm.cmd run build
```

## API Setup

This repo also includes a script that creates Products, Prices, and Payment Links for you.

For Windows, use the secure prompt so the key is not posted in chat, printed in the terminal, or saved to disk:

```powershell
npm.cmd run stripe:links:secure
```

The prompt hides your pasted key, passes it only to the child process, then clears `STRIPE_SECRET_KEY` when the script exits.

You can also set the environment variable yourself:

```powershell
$env:STRIPE_SECRET_KEY="sk_test_your_key_here"
$env:PANDA_NOTES_BASE_URL="https://p4nd4907.github.io/panda-notes/"
npm.cmd run stripe:links
```

Use a test key first. When the links look right in Stripe, rerun with a live key and commit the generated `public/stripe-links.json`.

If `public/stripe-links.json` contains `https://buy.stripe.com/test_...` links, the public Services page keeps using GitHub intake by default. Preview test checkout with:

```text
https://p4nd4907.github.io/panda-notes/services.html?checkout=test
```

Live checkout appears on the public Services page only after the config contains non-test Stripe Payment Links.

Never commit `sk_test_...` or `sk_live_...` keys. `.env` and `.env.local` are ignored by git.

## Go Live Checklist

- Finish Stripe account identity, bank, and tax settings.
- Confirm the customer-facing business name and support email.
- Add refund/cancellation language to checkout or scope docs.
- Test each link with a Stripe test card before switching to live links.
- Keep private contract details, credentials, and confidential source code out of public GitHub issues.
- Add a Stripe webhook endpoint for `https://panda-notes-smoky.vercel.app/api/stripe-webhook`.
- Store the webhook signing secret as `STRIPE_WEBHOOK_SECRET` in Vercel.
- Enable at least `checkout.session.completed` and `checkout.session.async_payment_succeeded` events.

## Webhook Confirmation

Panda Notes includes a serverless webhook at `/api/stripe-webhook`. It verifies Stripe's `Stripe-Signature` header with `STRIPE_WEBHOOK_SECRET`, ignores unrelated event types, and creates a private `payment-confirmed` issue in the private intake repo for successful checkout events. The private issue includes the matched offer, amount, customer email when Stripe provides it, and a ready-to-send private intake link.

Do not expose the webhook signing secret in GitHub Pages, public issues, or committed files.

For Windows, create the webhook and store the signing secret in Vercel with:

```powershell
npm.cmd run stripe:webhook:secure
```

Then redeploy Vercel production:

```powershell
npx.cmd vercel --prod --yes
```

References:

- Stripe Payment Links: <https://docs.stripe.com/payment-links/create>
- Stripe go-live checklist: <https://docs.stripe.com/get-started/checklist/go-live>
