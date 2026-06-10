# Embedding Panda Notes

Panda Notes is MIT licensed, so teams may link to it, copy it, fork it, and adapt it for their own projects as long as the license notice stays with the software.

Paid setup is available when a team wants Panda Notes installed, configured, and handed off without doing the integration work themselves.

## Current Integration

Today, Panda Notes includes a standalone local-first console and a v0.3 right-click widget:

- Send testers to the hosted app: <https://p4nd4907.github.io/panda-notes/>
- Generate a paid-install snippet: <https://p4nd4907.github.io/panda-notes/install.html>
- Try the widget demo: <https://p4nd4907.github.io/panda-notes/widget-demo.html>
- Export notes as JSON from one browser and import them into another.
- Copy a developer packet or GitHub-ready issue draft from the selected target issue.
- Notes stay in local browser storage until someone explicitly exports or copies them.

The widget is intentionally local-first and alpha-stage. It is useful for internal testing, but teams should still review it before putting it on public production pages.

## Right-Click Widget

Projects can load the widget during alpha or beta testing:

```html
<script src="https://p4nd4907.github.io/panda-notes/panda-notes-widget.js"></script>
<script>
  PandaNotes.init({
    project: "my-app",
    role: "beta",
    mode: "local",
    contextMenu: true,
    launcher: true,
    hotkey: "ctrl+shift+p",
    privateIntakeUrl: "https://p4nd4907.github.io/panda-notes/private-intake.html",
    installPlan: "setup-sprint"
  });
</script>
```

Expected tester flow:

1. Tester right-clicks a target UI element.
2. Panda Notes opens a small themed note popup.
3. Tester picks a tag and writes what happened.
4. The widget captures page, route, viewport, exact right-click point, element label, CSS selector/path, selected text, optional `data-component`, and optional code hints.
5. Notes remain local until the tester exports JSON, copies a handoff packet, or copies a GitHub-ready issue draft.

## Suggested Markup

Apps that want better developer handoff should add stable hints to important controls:

```html
<button
  data-component="CheckoutSubmitButton"
  data-panda-target="Checkout submit"
  data-panda-file="src/checkout/CheckoutSubmitButton.jsx"
  data-panda-symbol="handleCheckoutSubmit"
>
  Place order
</button>
```

The widget prefers these hints before falling back to visible text, ARIA labels, tag names, and CSS paths.

## API

```js
PandaNotes.init({
  project: "my-app",
  role: "alpha", // alpha, beta, or developer
  storageKey: "panda-notes-widget:my-app",
  contextMenu: true,
  launcher: true,
  hotkey: "ctrl+shift+p",
  privateIntakeUrl: "https://p4nd4907.github.io/panda-notes/private-intake.html",
  installPlan: "setup-sprint"
});

PandaNotes.openForTarget(document.querySelector('[data-panda-target]'), { x: 320, y: 240 });
PandaNotes.getNotes();
PandaNotes.exportNotes();
PandaNotes.destroy();
```

The exported JSON is compatible with the standalone console import flow.

## Paid Install Checklist

For a setup sprint, send the app URL, the target flows, tester roles, preferred delivery window, and whether the widget should use only right-click, the launcher button, the hotkey, or all three. Keep credentials and private files out of public GitHub issues; use the private intake page for scope and move secrets only through the agreed private channel.

## Still To Strengthen

- Optional screenshot or DOM snapshot hook for projects that opt in.
- Import helper that sends widget JSON directly into the standalone console.
- More browser coverage around cross-origin app shells and shadow DOM targets.
- No hidden telemetry remains the default.
