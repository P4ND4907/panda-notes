# Panda Notes Service Workflows

This document explains how paid Panda Notes requests move from checkout to delivery while keeping the public issue tracker free of secrets and private customer data.

## Service Stack

- Stripe Payment Links collect deposits before work starts.
- GitHub issue forms capture public-safe service scope in a structured format.
- GitHub Actions post the repeatable checklist as soon as a paid service issue opens.
- GitHub labels show request state: scope needed, payment confirmed, waiting on customer, in progress, or delivered.
- The Panda Notes Services page explains offers and answers common questions before a customer opens a request.
- The Private Intake page lets paid customers prepare scope locally, then copy/download the private intake packet without posting private data to public GitHub issues.
- The private intake API can submit packets to a private GitHub inbox repo when Vercel secrets are configured.
- The Stripe webhook API can create private `payment-confirmed` records after verified checkout events.

The free repo helps people evaluate and adopt Panda Notes. The paid service sells saved time, setup help, clean developer handoffs, and private integration work.

## Request Workflow

1. Check Stripe for new deposits.
2. Review new `paid-service` issues or private intake packets sent through the agreed private channel.
3. Confirm the customer picked the right service and did not post secrets publicly.
4. Reply with the next action: scope confirmation, private channel, export request, or delivery date.
5. Move the work through labels or private status notes such as `scope-needed`, `in-progress`, `waiting-on-customer`, and `delivered`.
6. Close the issue or private thread with a short delivery summary and links to public-safe deliverables.

## Private Intake Page Flow

The private intake page is a GitHub Pages-safe bridge between public marketing and private paid work:

1. Customer pays a Stripe deposit or asks for scope.
2. Customer opens <https://p4nd4907.github.io/panda-notes/private-intake.html>.
3. Customer fills service, payment reference, contact email, project URL, deadline, scope, and private-material notes.
4. Customer can copy/download the private intake packet.
5. Customer can submit the packet to the private intake API, or send it through the agreed private channel if the API is unavailable.
6. Owner confirms scope, deposit, and delivery window before asking for credentials, private exports, or confidential code.

The page stores drafts only in the customer's browser using local storage. It does not upload files, submit to GitHub, or send private data automatically.

Email handoff is intentionally explicit. The email-draft button opens a customer-controlled draft to `khepri26@gmail.com`; customers should review the packet before sending it. The address is visible in the public GitHub Pages HTML. If a private form endpoint replaces email later, update `data-intake-email` on `#main-content` in `public/private-intake.html` and the related QA expectations.

## Backend Automation

The serverless backend is designed for Vercel:

- `POST /api/private-intake`: validates a private intake packet and creates an issue in `P4ND4907/panda-notes-private-intake`.
- `POST /api/stripe-webhook`: verifies Stripe's webhook signature and creates a private payment-confirmation issue.
- `POST /api/analytics-event`: records privacy-safe service funnel events as comments on daily private analytics issues.

Required Vercel environment variables:

- `PRIVATE_INTAKE_GITHUB_TOKEN`: GitHub token with access to the private intake repo.
- `PRIVATE_INTAKE_REPO`: private repo name, usually `P4ND4907/panda-notes-private-intake`.
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret for the deployed `/api/stripe-webhook` endpoint.
- `PANDA_ALLOWED_ORIGINS`: comma-separated origins allowed to submit intake, usually `https://p4nd4907.github.io,https://panda-notes-smoky.vercel.app`.

Never put `PRIVATE_INTAKE_GITHUB_TOKEN`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` in browser code, GitHub Pages HTML, screenshots, public issues, or committed files.

To check interest from your phone or laptop, open the private repo issues labeled `analytics`, or run:

```powershell
npm.cmd run analytics:summary
```

## Setup Sprint Flow

```mermaid
flowchart TD
  A["Customer pays $250 setup deposit"] --> B["Customer opens setup sprint issue form"]
  B --> C["Auto-comment adds public-safe intake checklist"]
  C --> D["Owner confirms app URL, tester roles, target flows, and timeline"]
  D --> E["Owner installs widget or gives exact script/config instructions"]
  E --> F["Owner verifies tester capture and JSON export workflow"]
  F --> G["Owner posts delivery summary and next steps"]
```

Delivery checklist:

- Confirm payment before starting work.
- Confirm whether the app URL is public, staging, or private.
- Ask for a private channel before receiving credentials, tokens, or private code.
- Deliver widget install notes, tester workflow, and a small developer handoff checklist.

## Developer Handoff Pack Flow

```mermaid
flowchart TD
  A["Customer pays $150 handoff deposit"] --> B["Customer opens handoff issue form"]
  B --> C["Auto-comment asks for note volume, destination, labels, and deadline"]
  C --> D["Customer sends Panda Notes JSON or public-safe summary"]
  D --> E["Owner groups duplicate notes into target issues"]
  E --> F["Owner writes GitHub-ready issue drafts and fix order"]
  F --> G["Owner delivers repair queue and closes with summary"]
```

Delivery checklist:

- Confirm note volume before promising turnaround.
- Redact private user data before creating issue drafts.
- Group duplicate notes by page, target, component, tag, and tester role.
- Deliver fix order, labels, issue drafts, and test-plan notes.

## Private Integration Flow

```mermaid
flowchart TD
  A["Customer pays $1,000 private build deposit"] --> B["Customer opens private integration form"]
  B --> C["Auto-comment asks for branding, export target, privacy, and timeline"]
  C --> D["Owner confirms budget, private channel, and success criteria"]
  D --> E["Owner builds custom widget, theme, export, or workflow"]
  E --> F["Owner verifies install and handoff docs"]
  F --> G["Owner ships review notes and delivery summary"]
```

Delivery checklist:

- Confirm deposit, budget range, and whether the work needs a private repo.
- Keep customer secrets out of public GitHub issues.
- Define the exact custom output: branded widget, white-label console, export format, screenshot/DOM hook, or support pack.
- Deliver setup docs and maintenance notes.

## Labels To Use

- `paid-service`: every paid lead.
- `scope-needed`: waiting on final service scope.
- `payment-confirmed`: deposit is confirmed.
- `waiting-on-customer`: blocked on customer info or files.
- `in-progress`: work has started.
- `delivered`: handoff has been sent.

## Customer Message Template

Thanks for opening a Panda Notes service request. Panda Notes keeps public GitHub issues free of secrets and private customer data.

Next, please confirm:

- Which service you want.
- Whether the deposit is paid or you need the Stripe link.
- Public-safe app URL or repo link, if shareable.
- Target deadline.
- Whether any private details need to move to a private channel.

Once scope and deposit are confirmed, the request gets a delivery date and the exact handoff you will receive.
