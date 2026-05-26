import { describe, expect, it } from 'vitest';
import {
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

  it('prefers explicit Panda target hints before falling back to element labels', () => {
    const target = describeWidgetTarget({
      tagName: 'BUTTON',
      id: 'submit',
      className: 'primary cta',
      textContent: 'Place order',
      dataset: {
        pandaTarget: 'Checkout submit',
        component: 'CheckoutSubmitButton'
      },
      getAttribute(name) {
        return name === 'aria-label' ? 'Submit checkout' : '';
      }
    });

    expect(target.label).toBe('Checkout submit');
    expect(target.component).toBe('CheckoutSubmitButton');
    expect(target.path).toBe('button#submit.primary.cta');
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
        path: 'button#submit.primary'
      },
      viewport: {
        width: 390,
        height: 844,
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
    expect(note.viewport.width).toBe(390);
  });
});
