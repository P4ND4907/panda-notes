# Monetization Plan

Panda Notes should grow with an open-core motion: keep the local-first console and alpha widget free, then charge for setup help, private workflows, and managed tester handoffs.

## Positioning

Panda Notes helps small teams turn alpha/beta feedback into developer-ready repair work. The value is not "notes"; the value is a cleaner bug handoff with target context, code hints, and exportable issue drafts.

## Free Exposure Layer

- MIT licensed GitHub repo.
- Hosted demo console and widget demo.
- Hosted services page with clear paid offers.
- Stripe Payment Links config for paid deposits.
- Copy-paste right-click widget.
- Public docs for teams to add `data-panda-target` and `data-component`.
- GitHub issues tracking the roadmap.
- GitHub issue forms for paid service intake.

This creates trust and shareability.

## Paid Offers

### Setup Sprint

For teams that want Panda Notes wired into an app quickly.

- Add the widget to their staging or beta environment.
- Add target/component hints to key flows.
- Teach testers the alpha/beta workflow.
- Deliver import/export handoff docs.

Suggested starting price: `$250-$750` per project depending on scope.

### Developer Handoff Pack

For teams running a beta and drowning in vague bug reports.

- Review exported notes.
- Turn top issues into GitHub issue drafts.
- Add target snippets or suggested code paths.
- Provide a prioritized repair queue.

Suggested starting price: `$150-$500` per beta pass.

### Private/White-Label Build

For teams that need branding, private docs, or deeper integrations.

- Custom theme.
- Private widget config.
- GitHub/Jira/Linear export formatting.
- Optional screenshot/DOM snapshot hooks.

Suggested starting price: `$1,000+`.

## Live Conversion Setup

- Services page: <https://p4nd4907.github.io/panda-notes/services.html>
- Setup sprint intake: <https://github.com/P4ND4907/panda-notes/issues/new?template=setup-sprint.yml>
- Developer handoff intake: <https://github.com/P4ND4907/panda-notes/issues/new?template=developer-handoff-pack.yml>
- Private integration intake: <https://github.com/P4ND4907/panda-notes/issues/new?template=private-integration.yml>
- Stripe setup: [Stripe Setup](STRIPE.md)

Public intake should collect scope only. Keep credentials, private user data, source code, and paid contract details in a private channel after the public request is opened.

## Sponsor/Donation Layer

Use GitHub Sponsors, Ko-fi, or another funding link once an account is ready. Add the funding URL to `.github/FUNDING.yml` so GitHub shows a Sponsor button.

Suggested tiers:

- `$5/month`: Support the open-source widget.
- `$25/month`: Sponsor roadmap work and get priority issue voting.
- `$99/month`: Small-team support tier with setup Q&A.

## Exposure Checklist

- Create GitHub release for each usable alpha.
- Add repository topics: `beta-testing`, `bug-reporting`, `developer-tools`, `feedback-widget`, `open-source`, `qa-tools`.
- Post the live widget demo with a short GIF or screenshot.
- Share in developer communities as a local-first alpha/beta feedback widget, not a generic notes app.
- Ask early users for one concrete quote about cleaner bug reports.

## Next Money Features

- Live Stripe Payment Link URLs in `public/stripe-links.json` after account setup.
- Funding link in `.github/FUNDING.yml` once a Sponsor, Ko-fi, or payment profile is ready.
- Screenshot/DOM capture hooks.
- Export formats for GitHub, Linear, and Jira.
- npm package for installable versioned widget.

## Boundary

No hidden telemetry by default. Monetization should come from support, setup, managed handoffs, and optional hosted/private features, not from quietly collecting tester data.
