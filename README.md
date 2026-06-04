# Panda Notes

Turn messy alpha and beta tester feedback into developer-ready repair work.

Panda Notes is a standalone local-first feedback console for developers, alpha testers, and beta testers. It captures rough tester notes with target context, groups repeated issues, and creates GitHub-ready repair drafts developers can actually use.

Panda Notes started as the CueForge right-click note loop. This repo splits it into its own app so it can be used by any project that needs tester feedback tied to developer repair work.

Live app: <https://p4nd4907.github.io/panda-notes/>

Widget demo: <https://p4nd4907.github.io/panda-notes/widget-demo.html>

Paid services: <https://p4nd4907.github.io/panda-notes/services.html>

Private intake: <https://p4nd4907.github.io/panda-notes/private-intake.html>

Launch kit: <https://p4nd4907.github.io/panda-notes/launch.html>

Need it installed or cleaned up for you? Start with the [Panda Notes services page](https://p4nd4907.github.io/panda-notes/services.html).

## Fast Pitch

- Testers capture the broken, confusing, missing, cramped, or slow part of a product while the target context is fresh.
- Developers review a grouped repair queue with note evidence, role/tag filters, code hints, JSON exports, and issue drafts.
- Teams keep the public tool free and local-first, then pay for setup sprints, feedback cleanup, or private integration when they want help.

## Focus

- Developers select target issues, inspect tester evidence, review mapped code snippets, and export a repair packet.
- Alpha testers capture rough edges early: broken controls, confusing copy, cramped layout, missing states, slow paths, and ideas.
- Beta testers prove repeat issues from real sessions so teams know what to fix next.

## What It Does Now

- Role quick starts for developers, alpha testers, and beta testers.
- Local tester note capture with page, target, component, viewport, exact right-click point, tag, and redacted note text.
- Target issue repair queue grouped by page, target, and tag.
- Search, tag, and evidence-role filters for narrowing the repair queue.
- Code snippet popout for the selected target issue.
- GitHub-ready issue draft copy/export with tester evidence, labels, target code, and test plan.
- Repair prompt copy/export for handing a selected issue to Codex, ChatGPT, or another code assistant without adding secrets to the widget.
- Developer packet copy/export and JSON import/export for moving notes between browsers or projects.
- Alpha embeddable right-click widget at `/panda-notes-widget.js`.

## Can I Use It In My Project?

Yes. Panda Notes is MIT licensed, so teams may link to it, fork it, copy it, and adapt it for their own alpha/beta testing workflows as long as the license notice stays with the software.

Current integration:

- Link testers to the hosted console.
- Import/export Panda Notes JSON between projects or browsers.
- Copy developer packets and GitHub-ready issue drafts.
- Add the alpha right-click widget to a project with one script tag.

Alpha widget install:

```html
<script src="https://p4nd4907.github.io/panda-notes/panda-notes-widget.js"></script>
<script>
  PandaNotes.init({
    project: "my-app",
    role: "beta",
    mode: "local",
    contextMenu: true
  });
</script>
```

See [Embedding Panda Notes](docs/EMBEDDING.md) for the widget API, demo page, and markup hints.

## Monetization

Panda Notes is free and MIT licensed, with a practical path to paid setup/support:

- Free console and right-click widget for adoption.
- Paid setup sprints for teams that want it installed in staging/beta.
- Paid developer handoff packs for turning tester exports into repair queues.
- Optional private/white-label integrations later.

How the money works even though GitHub is free:

- The public repo is the trust builder and adoption path.
- The paid service sells time saved, setup support, cleaner repair queues, and private custom work.
- Teams can do it themselves for free, or pay when they want it handled faster and cleaner.

Live intake has two paths:

- Private intake page for paid customers who need to prepare project scope without public GitHub details.
- GitHub issue forms for public-safe setup, handoff, and private integration scope.
- Serverless private intake submission for paid packets when the Vercel API is configured.
- Stripe webhook confirmation for checkout events when `STRIPE_WEBHOOK_SECRET` is configured.

- [Setup sprint](https://github.com/P4ND4907/panda-notes/issues/new?template=setup-sprint.yml)
- [Developer handoff pack](https://github.com/P4ND4907/panda-notes/issues/new?template=developer-handoff-pack.yml)
- [Private integration](https://github.com/P4ND4907/panda-notes/issues/new?template=private-integration.yml)

See [Panda Notes Services](https://p4nd4907.github.io/panda-notes/services.html), [Monetization Plan](docs/MONETIZATION.md), [Competitive Comparison](docs/COMPETITIVE_COMPARISON.md), [Analytics Taxonomy](docs/ANALYTICS.md), and [A/B Test Backlog](docs/AB_TESTS.md).

Stripe Payment Links are wired through `public/stripe-links.json`. Create or paste the three deposit links, then the Services page will send buyers to Stripe-hosted checkout. See [Stripe Setup](docs/STRIPE.md).

## Service Flows

Panda Notes uses a lightweight public intake path: Stripe Payment Links collect deposits, GitHub issue forms collect public-safe scope, and GitHub Actions add the repeatable request checklist.

More detail: [Service Operations](docs/SERVICE_OPERATIONS.md).

### Setup Sprint

```mermaid
flowchart LR
  Buyer["Buyer pays setup deposit"] --> Intake["Setup sprint GitHub form"]
  Intake --> AutoReply["GitHub Action posts scope checklist"]
  AutoReply --> Confirm["Confirm app URL, tester roles, flows, timeline"]
  Confirm --> Install["Install widget and configure project hints"]
  Install --> Handoff["Send install notes and tester workflow"]
  Handoff --> Close["Close issue with delivery summary"]
```

### Developer Handoff Pack

```mermaid
flowchart LR
  Buyer["Buyer pays handoff deposit"] --> Intake["Handoff GitHub form"]
  Intake --> AutoReply["GitHub Action posts handoff checklist"]
  AutoReply --> Export["Collect Panda Notes JSON or public-safe notes"]
  Export --> Triage["Group duplicates and rank target issues"]
  Triage --> Drafts["Write GitHub-ready issue drafts"]
  Drafts --> Deliver["Deliver repair queue and next-fix order"]
```

### Private Integration

```mermaid
flowchart LR
  Buyer["Buyer pays private build deposit"] --> Intake["Private integration GitHub form"]
  Intake --> AutoReply["GitHub Action posts discovery checklist"]
  AutoReply --> Scope["Confirm branding, privacy, exports, and budget"]
  Scope --> PrivateChannel["Move secrets or private code to agreed private channel"]
  PrivateChannel --> Build["Build custom widget, console, or export path"]
  Build --> Review["Review deliverables and handoff docs"]
```

## Workflow

1. Pick a role in the sidebar.
2. Capture notes as testers find broken, confusing, slow, missing, or cramped UI.
3. Filter the target issue list by search text, tag, or evidence role.
4. Select an issue to review evidence and mapped code.
5. Copy the GitHub issue draft or export the developer packet.

## Local

```powershell
npm.cmd install
npm.cmd run dev
```

## Verify

```powershell
npm.cmd test
npm.cmd run test:services
npm.cmd run build
npm.cmd run lighthouse:services
```

`test:services` runs the rendered services and private-intake QA flow with Playwright. `lighthouse:services` runs Lighthouse against a local static copy of the Services page and fails if performance, accessibility, best-practices, or SEO scores fall below the configured thresholds.

## Backend Automation

The `/api/private-intake`, `/api/stripe-webhook`, and `/api/analytics-event` functions are deployable on Vercel. They keep private customer packets, payment confirmations, and privacy-safe funnel counts out of the public repository by writing to the private `P4ND4907/panda-notes-private-intake` repo.

Required production secrets:

- `PRIVATE_INTAKE_GITHUB_TOKEN`
- `PRIVATE_INTAKE_REPO`
- `STRIPE_WEBHOOK_SECRET`
- `PANDA_ALLOWED_ORIGINS`

Use `npm.cmd run stripe:webhook:secure` to create the Stripe webhook and store `STRIPE_WEBHOOK_SECRET` in Vercel without printing the secret.

Use `npm.cmd run analytics:summary` to read the private analytics rollup from GitHub and print page views, anonymous sessions, CTA clicks, Stripe clicks, and private-intake submits.

## Stripe Links

```powershell
npm.cmd run stripe:links:secure
```

That command uses a hidden PowerShell prompt so the Stripe secret key is not posted, printed, or committed. It writes only public Stripe Payment Link URLs into `public/stripe-links.json`.

## Privacy Boundary

The public service funnel records privacy-safe analytics events so the owner can see page views and conversion clicks. It does not send private note content, private intake form bodies, IP addresses, raw user-agent strings, customer secrets, or uploaded files. Notes stay in local browser storage until someone explicitly exports JSON or copies/downloads a developer packet.

## License

MIT. See [LICENSE](LICENSE).
