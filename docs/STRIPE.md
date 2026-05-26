# Stripe Setup

Panda Notes is hosted as a static GitHub Pages app, so the safest first Stripe setup is Payment Links. Payment Links keep secret keys out of the browser and send buyers to Stripe-hosted checkout.

## Offers

Create three one-time deposit links:

- Panda Notes Setup Sprint Deposit: `$250`
- Panda Notes Developer Handoff Deposit: `$150`
- Panda Notes Private Integration Deposit: `$1,000`

The public Services page reads `public/stripe-links.json`. If a Stripe URL is present for an offer, its button goes to Stripe checkout. If a Stripe URL is blank, the button falls back to the matching GitHub intake form.

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

```powershell
$env:STRIPE_SECRET_KEY="sk_test_your_key_here"
$env:PANDA_NOTES_BASE_URL="https://p4nd4907.github.io/panda-notes/"
npm.cmd run stripe:links
```

Use a test key first. When the links look right in Stripe, rerun with a live key and commit the generated `public/stripe-links.json`.

Never commit `sk_test_...` or `sk_live_...` keys. `.env` and `.env.local` are ignored by git.

## Go Live Checklist

- Finish Stripe account identity, bank, and tax settings.
- Confirm the customer-facing business name and support email.
- Add refund/cancellation language to checkout or scope docs.
- Test each link with a Stripe test card before switching to live links.
- Keep private contract details, credentials, and confidential source code out of public GitHub issues.

References:

- Stripe Payment Links: <https://docs.stripe.com/payment-links/create>
- Stripe go-live checklist: <https://docs.stripe.com/get-started/checklist/go-live>
