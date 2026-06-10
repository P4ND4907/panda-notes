import { describe, expect, it } from 'vitest';
import {
  buildWidgetInstallSnippet,
  buildWidgetNote,
  createWidgetStorageKey,
  describeWidgetTarget,
  normalizeWidgetOptions
} from './pandaWidget.js';

describe('panda notes embeddable widget core', () => {
  it('normalizes widget options for safe local-first installs', () => {
    const options = normalizeWidgetOptions({
      project: 'Checkout App',
      role: 'beta',
      storageKey: 'custom-key',
      contextMenu: false
    });

    expect(options.project).toBe('Checkout App');
    expect(options.role).toBe('beta');
    expect(options.storageKey).toBe('custom-key');
    expect(options.contextMenu).toBe(false);
    expect(normalizeWidgetOptions({ role: 'unknown' }).role).toBe('alpha');
    expect(createWidgetStorageKey('Checkout App')).toBe('panda-notes-widget:checkout-app');
  });

  it('normalizes paid install options without allowing script URLs or secrets', () => {
    const options = normalizeWidgetOptions({
      project: 'Customer Portal',
      role: 'developer',
      launcher: true,
      hotkey: 'ctrl+shift+p',
      privateIntakeUrl: 'https://p4nd4907.github.io/panda-notes/private-intake.html',
      installPlan: 'setup-sprint'
    });

    expect(options.launcher).toBe(true);
    expect(options.hotkey).toBe('ctrl+shift+p');
    expect(options.privateIntakeUrl).toBe('https://p4nd4907.github.io/panda-notes/private-intake.html');
    expect(options.installPlan).toBe('setup-sprint');
    expect(normalizeWidgetOptions({ privateIntakeUrl: 'javascript:alert(1)' }).privateIntakeUrl).toBe('');
  });

  it('builds a copy-paste install snippet for customer apps', () => {
    const snippet = buildWidgetInstallSnippet({
      project: 'Customer Portal',
      role: 'beta',
      baseUrl: 'https://p4nd4907.github.io/panda-notes/',
      privateIntakeUrl: 'https://p4nd4907.github.io/panda-notes/private-intake.html',
      launcher: true
    });

    expect(snippet).toContain('https://p4nd4907.github.io/panda-notes/panda-notes-widget.js');
    expect(snippet).toContain('PandaNotes.init');
    expect(snippet).toContain('"project": "Customer Portal"');
    expect(snippet).toContain('"role": "beta"');
    expect(snippet).toContain('"launcher": true');
    expect(snippet).toContain('"privateIntakeUrl": "https://p4nd4907.github.io/panda-notes/private-intake.html"');
    expect(snippet).not.toContain('sk_test_');
    expect(snippet).not.toContain('sk_live_');
   });

  it('prefers explicit Panda target hints before falling back to element labels', () => {
    const target = describeWidgetTarget({
      tagName: 'BUTTON',
      id: 'submit',
      className: 'primary cta',
      textContent: 'Place order',
      dataset: {
        pandaTarget: 'Checkout submit',
        component: 'CheckoutSubmitButton',
        pandaFile: 'src/checkout/CheckoutSubmitButton.jsx',
        pandaSymbol: 'handleCheckoutSubmit'
      },
      getAttribute(name) {
        return name === 'aria-label' ? 'Submit checkout' : '';
      }
    });

    expect(target.label).toBe('Checkout submit');
    expect(target.component).toBe('CheckoutSubmitButton');
    expect(target.path).toBe('button#submit.primary.cta');
    expect(target.selector).toBe('button#submit.primary.cta');
    expect(target.code.file).toBe('src/checkout/CheckoutSubmitButton.jsx');
    expect(target.code.symbol).toBe('handleCheckoutSubmit');
  });

  it('builds import-compatible panda-note.v1 records from right-click widget context', () => {
    const note = buildWidgetNote({
      project: 'Checkout App',
      role: 'beta',
      tag: 'broken',
      note: 'Click failed for tester@example.com on C:\\Users\\tester\\secret.txt',
      page: 'https://example.com/checkout?session=123',
      target: {
        label: 'Checkout submit',
        component: 'CheckoutSubmitButton',
        path: 'button#submit.primary',
        selector: 'button#submit.primary',
        selectedText: 'Pay now',
        code: {
          file: 'src/checkout/CheckoutSubmitButton.jsx',
          symbol: 'handleCheckoutSubmit'
        }
      },
      viewport: {
        width: 390,
        height: 844,
        x: 164,
        y: 743,
        xPercent: 42,
        yPercent: 88
      },
      now: new Date('2026-05-25T04:00:00.000Z')
    });

    expect(note.schema).toBe('panda-note.v1');
    expect(note.audience).toBe('beta');
    expect(note.page).toBe('Checkout App / /checkout');
    expect(note.tag).toBe('broken');
    expect(note.note).toContain('[redacted-email]');
    expect(note.note).toContain('[redacted-path]');
    expect(note.target.label).toBe('Checkout submit');
    expect(note.target.component).toBe('CheckoutSubmitButton');
    expect(note.target.selector).toBe('button#submit.primary');
    expect(note.target.selectedText).toBe('Pay now');
    expect(note.target.code.file).toBe('src/checkout/CheckoutSubmitButton.jsx');
    expect(note.target.code.symbol).toBe('handleCheckoutSubmit');
    expect(note.viewport.width).toBe(390);
    expect(note.viewport.x).toBe(164);
    expect(note.viewport.y).toBe(743);
    expect(note.viewport.xPercent).toBe(42);
    expect(note.viewport.yPercent).toBe(88);
  });
});
