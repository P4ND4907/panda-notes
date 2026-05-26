# Embedding Panda Notes

Panda Notes is MIT licensed, so teams may link to it, copy it, fork it, and adapt it for their own projects as long as the license notice stays with the software.

## Current Integration

Today, Panda Notes includes a standalone local-first console and an alpha right-click widget:

- Send testers to the hosted app: <https://p4nd4907.github.io/panda-notes/>
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
    contextMenu: true
  });
</script>
```

Expected tester flow:

1. Tester right-clicks a target UI element.
2. Panda Notes opens a small themed note popup.
3. Tester picks a tag and writes what happened.
4. The widget captures page, route, viewport, element label, and optional `data-component`.
5. Notes remain local until the tester exports JSON or copies a handoff packet.

## Suggested Markup

Apps that want better developer handoff should add stable hints to important controls:

```html
<button
  data-component="CheckoutSubmitButton"
  data-panda-target="Checkout submit"
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
  contextMenu: true
});

PandaNotes.getNotes();
PandaNotes.exportNotes();
PandaNotes.destroy();
```

The exported JSON is compatible with the standalone console import flow.

## Still To Strengthen

- Optional screenshot or DOM snapshot hook for projects that opt in.
- Optional GitHub issue draft handoff from captured notes.
- Import helper that sends widget JSON directly into the standalone console.
- More browser coverage around cross-origin app shells and shadow DOM targets.
- No hidden telemetry remains the default.
