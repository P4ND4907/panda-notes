# Embedding Panda Notes

Panda Notes is MIT licensed, so teams may link to it, copy it, fork it, and adapt it for their own projects as long as the license notice stays with the software.

## Current Integration

Today, Panda Notes is a standalone local-first console:

- Send testers to the hosted app: <https://p4nd4907.github.io/panda-notes/>
- Export notes as JSON from one browser and import them into another.
- Copy a developer packet or GitHub-ready issue draft from the selected target issue.
- Notes stay in local browser storage until someone explicitly exports or copies them.

The standalone app does not yet inject a right-click popup into another website.

## Planned Right-Click Widget

The next integration target is a tiny widget/SDK that a project can load during alpha or beta testing:

```html
<script src="https://p4nd4907.github.io/panda-notes/panda-notes-widget.js"></script>
<script>
  PandaNotes.init({
    project: "my-app",
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

The widget should prefer these hints before falling back to visible text, ARIA labels, tag names, and CSS paths.

## Widget Roadmap

- `PandaNotes.init()` with project, role, storage key, and context menu options.
- Right-click popup with tag, note, page, target, component, and viewport capture.
- Export JSON compatible with the standalone console.
- Optional screenshot or DOM snapshot hook for projects that opt in.
- Optional GitHub issue draft handoff from captured notes.
- No hidden telemetry by default.
