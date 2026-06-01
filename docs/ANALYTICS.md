# Panda Notes Analytics Taxonomy

Panda Notes uses privacy-aligned, stable snake_case event names on the Services and Private Intake pages. The Services page sends events to the Panda Notes collector at `/api/analytics-event`, sends events to Plausible when the Plausible script is active, emits a local `panda-service-event` for QA, and also calls `gtag('event', ...)` when a GA4 tag is present.

No analytics secret keys are stored in this repo. The Panda Notes collector uses the existing private GitHub intake repo token in Vercel and stores append-only daily rollup comments in the private intake repo. It does not store IP addresses, raw user-agent strings, private intake form bodies, customer secrets, or uploaded files.

To view the current private rollup from a machine with `gh` logged in:

```powershell
npm.cmd run analytics:summary
```

## Live Events

| Event name | Trigger | Why it matters |
| --- | --- | --- |
| `page_view` | Services or Private Intake page loaded | Counts anonymous sessions reaching the funnel. |
| `cta_primary_click` | Hero primary CTA click | Measures above-the-fold setup intent. |
| `cta_secondary_click` | Hero secondary CTA click | Measures above-the-fold handoff intent. |
| `plan_card_click_setup` | Setup Sprint card CTA click | Measures setup-sprint demand. |
| `plan_card_click_handoff` | Developer Handoff Pack card CTA click | Measures handoff-pack demand. |
| `plan_card_click_private` | Private Integration card CTA click | Measures premium/private integration demand. |
| `private_request_start` | Private intake page CTA click | Measures privacy-sensitive buyer appetite. |
| `private_intake_submit` | Private intake submit button clicked after local validation | Measures serious private lead intent. |
| `private_intake_submit_success` | Private intake API submission succeeds | Primary private-lead conversion. |
| `private_intake_submit_error` | Private intake API submission fails | Shows broken lead capture or temporary backend issues. |
| `github_issue_start` | Any GitHub issue-template CTA click | Measures the current default public lead path. |
| `deposit_click` | Stripe-hosted deposit link click | Measures commercial intent. |
| `comparison_section_view` | Pricing/options grid reaches 50% viewport visibility | Measures buyer evaluation beyond the hero. |
| `faq_expand_*` | Service Guide question answered, with suffix such as `comparison`, `privacy`, or `why_pay` | Measures buyer objections and uncertainty. |

## Planned Events

| Event name | Trigger | Why it matters |
| --- | --- | --- |
| `sample_output_view` | Redacted sample deliverable opens | Measures proof and trust-building engagement. |
| `contact_submit` | Private/contact form submission succeeds | Primary lead conversion. |
| `thank_you` | Buyer reaches a thank-you/confirmation page | Primary conversion and attribution endpoint. |

## GA4 Key Events

If GA4 is added later, mark these as key events:

- `private_intake_submit_success`
- `thank_you`
- `deposit_click`

`github_issue_start` is useful as a lead-start event, but it is weaker than a true private form submission or Stripe deposit click. `plan_card_click_*` events are demand signals, not final conversion events.

## Plausible Goals

Create goals for:

- `deposit_click`
- `page_view`
- `private_intake_submit_success`
- `github_issue_start`
- `cta_primary_click`
- `cta_secondary_click`
- `plan_card_click_setup`
- `plan_card_click_handoff`
- `plan_card_click_private`
- `comparison_section_view`
- `faq_expand_comparison`
- `faq_expand_privacy`
- `faq_expand_why_pay`

Plausible optional measurements can also track outbound links, file downloads, and form submissions when enabled in the Plausible site settings.

## QA

Run:

```powershell
npm.cmd run test:services
```

The QA script checks title/canonical/schema/sitemap and verifies these live funnel events in a headless browser:

- `cta_primary_click`
- `github_issue_start`
- `private_request_start`
- `plan_card_click_setup`
- `deposit_click`
- `comparison_section_view`
- `faq_expand_comparison`
