# Panda Notes

Standalone local-first feedback console for developers, alpha testers, and beta testers.

Panda Notes started as the CueForge right-click note loop. This repo splits it into its own app so it can be used by any project that needs tester feedback tied to developer repair work.

## Focus

- Developers select target issues, inspect tester evidence, review mapped code snippets, and export a repair packet.
- Alpha testers capture rough edges early: broken controls, confusing copy, cramped layout, missing states, slow paths, and ideas.
- Beta testers prove repeat issues from real sessions so teams know what to fix next.

## Local

```powershell
npm.cmd install
npm.cmd run dev
```

## Verify

```powershell
npm.cmd test
npm.cmd run build
```

## Privacy Boundary

No hidden telemetry. Notes stay in local browser storage until someone explicitly exports JSON or copies/downloads a developer packet.
