# Panda Notes Services A/B Test Backlog

These tests should wait until the Services page has enough traffic for the results to mean something. Until then, use the current page as the opinionated baseline and collect directional analytics.

| Test | Variant A | Variant B | Primary metric | Guardrails |
| --- | --- | --- | --- | --- |
| Hero framing | Panda Notes Services | Turn messy tester feedback into developer-ready work | Primary CTA CTR | Bounce rate, scroll depth |
| Intake path | GitHub-first | Private request first, GitHub secondary | Lead-start rate | Lead quality, spam rate |
| Pricing presentation | Cards only | Cards plus comparison matrix and turnaround | Plan-card CTR | Time on page |
| Trust messaging | MIT/local-first/no telemetry | Privacy-first/private intake/integration-ready | CTA CTR | Qualified lead rate |
| Proof section | No samples | Redacted sample outputs and before/after queues | Lead-start rate | Scroll depth |
| CTA verb | Book / Request / Discuss | Scope / Upload / Propose | CTA CTR | Deposit conversion |
| Offer order | Setup / Handoff / Private | Handoff / Setup / Private | Click distribution | Completion rate |

## Current Baseline

The live baseline uses the outcome-first hero, privacy-forward trust row, and action verbs from Variant B for hero framing, trust messaging, and CTA verb:

- Hero: "Turn messy tester feedback into developer-ready work"
- Primary CTA: "Get a scoped setup plan"
- Secondary CTA: "Upload exports privately"
- Premium CTA: "Request a private integration proposal"
- Trust row: "Local-first workflow", "Private-first intake available", "GitHub/Jira/Linear-ready outputs"

## Measurement

Use [Analytics Taxonomy](ANALYTICS.md) for current event names:

- Hero CTA click-through: `cta_primary_click`, `cta_secondary_click`
- Plan demand: `plan_card_click_setup`, `plan_card_click_handoff`, `plan_card_click_private`
- Lead starts: `github_issue_start`, future `private_request_start`
- Commercial intent: `deposit_click`
- Buyer evaluation: `comparison_section_view`, `faq_expand_*`
