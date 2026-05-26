# Panda Notes Service Operations

This is the practical service desk for turning Panda Notes into income without needing a full SaaS backend on day one.

## Free Stack

- Stripe Payment Links: collects deposits before work starts.
- GitHub issue forms: captures service intake in a structured format.
- GitHub Actions: posts the repeatable checklist as soon as a paid service issue opens.
- GitHub Mobile: lets you label, comment, assign, and close service issues from your phone.
- Panda Notes Services page: explains offers and answers common questions before people contact you.

This makes the business phone-manageable, not fully passive. You still confirm scope, protect private data, do the paid work, handle refunds or disputes, and deliver on the timeline you promise.

## Daily Phone Workflow

1. Check Stripe for new deposits.
2. Open GitHub Mobile and review new `paid-service` issues.
3. Confirm the customer picked the right service and did not post secrets.
4. Reply with the next action: scope confirmation, private channel, export request, or delivery date.
5. Move the issue through labels such as `scope-needed`, `in-progress`, `waiting-on-customer`, and `delivered`.
6. Close the issue with a short delivery summary and links to public-safe deliverables.

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

Owner checklist:

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

Owner checklist:

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

Owner checklist:

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

Thanks for opening a Panda Notes service request. I will keep public GitHub issues free of secrets and private customer data.

Next, please confirm:

- Which service you want.
- Whether the deposit is paid or you need the Stripe link.
- Public-safe app URL or repo link, if shareable.
- Target deadline.
- Whether any private details need to move to a private channel.

Once scope and deposit are confirmed, I will reply with the delivery date and the exact handoff you will receive.
