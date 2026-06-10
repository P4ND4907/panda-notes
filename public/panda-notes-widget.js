(function () {
  const VERSION = '0.3.0-alpha';
  const NOTE_TAGS = ['broken', 'layout issue', 'missing feedback', 'text issue', 'confusing', 'slow', 'idea'];
  const AUDIENCES = ['alpha', 'beta', 'developer'];
  const DEFAULTS = {
    project: 'Panda Notes Project',
    role: 'alpha',
    mode: 'local',
    contextMenu: true,
    launcher: false,
    hotkey: '',
    privateIntakeUrl: '',
    installPlan: 'self-install'
  };
  const INSTALL_PLANS = ['setup-sprint', 'developer-handoff', 'private-integration', 'self-install'];

  let settings = normalizeOptions({});
  let activeTarget = null;
  let activeViewport = null;
  let root = null;
  let form = null;
  let statusNode = null;
  let launcherButton = null;
  let contextHandler = null;
  let hotkeyHandler = null;

  function init(options = {}) {
    destroy();
    settings = normalizeOptions(options);
    injectStyles();
    buildPopup();

    if (settings.contextMenu) {
      contextHandler = (event) => {
        event.preventDefault();
        activeTarget = describeTarget(event.target);
        activeViewport = {
          width: window.innerWidth || 0,
          height: window.innerHeight || 0,
          x: event.clientX,
          y: event.clientY,
          xPercent: percent(event.clientX, window.innerWidth || 1),
          yPercent: percent(event.clientY, window.innerHeight || 1)
        };
        openPopup(event.clientX, event.clientY);
      };
      document.addEventListener('contextmenu', contextHandler);
    }

    if (settings.launcher) {
      buildLauncher();
    }

    if (settings.hotkey) {
      hotkeyHandler = (event) => {
        if (!matchesHotkey(event, settings.hotkey)) return;
        event.preventDefault();
        openForTarget(document.activeElement || document.body, {
          x: Math.round((window.innerWidth || 640) / 2),
          y: Math.round((window.innerHeight || 480) / 2)
        });
      };
      document.addEventListener('keydown', hotkeyHandler);
    }

    return api;
  }

  function destroy() {
    if (contextHandler) {
      document.removeEventListener('contextmenu', contextHandler);
      contextHandler = null;
    }
    if (hotkeyHandler) {
      document.removeEventListener('keydown', hotkeyHandler);
      hotkeyHandler = null;
    }
    root?.remove();
    launcherButton?.remove();
    root = null;
    form = null;
    statusNode = null;
    launcherButton = null;
  }

  function buildLauncher() {
    launcherButton = document.createElement('button');
    launcherButton.type = 'button';
    launcherButton.className = 'panda-notes-widget__launcher';
    launcherButton.textContent = 'Panda Notes';
    launcherButton.setAttribute('aria-label', 'Open Panda Notes feedback widget');
    launcherButton.addEventListener('click', () => {
      openForTarget(document.body, {
        x: Math.max(24, window.innerWidth - 360),
        y: Math.max(24, window.innerHeight - 520)
      });
    });
    document.body.append(launcherButton);
  }

  function buildPopup() {
    root = document.createElement('section');
    root.className = 'panda-notes-widget';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `
      <form class="panda-notes-widget__card">
        <div class="panda-notes-widget__head">
          <span class="panda-notes-widget__mark" aria-hidden="true"></span>
          <div>
            <strong>Panda Notes</strong>
            <span>Right-click tester note</span>
          </div>
          <button class="panda-notes-widget__icon" type="button" data-panda-close aria-label="Close Panda Notes">x</button>
        </div>
        <label>
          <span>Role</span>
          <select name="role">
            <option value="alpha">Alpha tester</option>
            <option value="beta">Beta tester</option>
            <option value="developer">Developer</option>
          </select>
        </label>
        <label>
          <span>Tag</span>
          <select name="tag">
            ${NOTE_TAGS.map((tag) => `<option value="${tag}">${tag}</option>`).join('')}
          </select>
        </label>
        <label>
          <span>Target</span>
          <input name="targetLabel" />
        </label>
        <label>
          <span>Component</span>
          <input name="component" />
        </label>
        <label>
          <span>Tester note</span>
          <textarea name="note" placeholder="What happened, what did you expect, and what should the developer inspect?"></textarea>
        </label>
        <div class="panda-notes-widget__actions">
          <button class="panda-notes-widget__primary" type="submit">Save note</button>
          <button type="button" data-panda-copy-draft>Copy issue draft</button>
          <button type="button" data-panda-export>Export JSON</button>
          ${settings.privateIntakeUrl ? '<a class="panda-notes-widget__link" data-panda-private-intake target="_blank" rel="noopener">Private intake</a>' : ''}
        </div>
        <p class="panda-notes-widget__status" aria-live="polite"></p>
      </form>
    `;

    document.body.append(root);
    form = root.querySelector('form');
    statusNode = root.querySelector('.panda-notes-widget__status');
    form.elements.role.value = settings.role;
    form.addEventListener('submit', saveFromForm);
    root.querySelector('[data-panda-close]').addEventListener('click', closePopup);
    root.querySelector('[data-panda-copy-draft]').addEventListener('click', copyIssueDraft);
    root.querySelector('[data-panda-export]').addEventListener('click', exportNotes);
    const privateLink = root.querySelector('[data-panda-private-intake]');
    if (privateLink) privateLink.href = settings.privateIntakeUrl;
  }

  function openForTarget(element = document.body, position = {}) {
    const x = clamp(position.x ?? Math.round((window.innerWidth || 640) / 2), 0, window.innerWidth || 10000);
    const y = clamp(position.y ?? Math.round((window.innerHeight || 480) / 2), 0, window.innerHeight || 10000);
    activeTarget = describeTarget(element);
    activeViewport = {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0,
      x,
      y,
      xPercent: percent(x, window.innerWidth || 1),
      yPercent: percent(y, window.innerHeight || 1)
    };
    openPopup(x, y);
  }

  function openPopup(clientX, clientY) {
    if (!root || !form) return;
    form.elements.role.value = settings.role;
    form.elements.tag.value = 'broken';
    form.elements.targetLabel.value = activeTarget?.label || 'Unknown target';
    form.elements.component.value = activeTarget?.component || '';
    form.elements.note.value = '';
    setStatus('');

    const popupHeight = Math.min(570, Math.max(360, (window.innerHeight || 600) - 24));
    root.style.left = `${Math.min(clientX + 12, Math.max(12, window.innerWidth - 340))}px`;
    root.style.top = `${Math.min(clientY + 12, Math.max(12, window.innerHeight - popupHeight - 12))}px`;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    form.elements.note.focus();
  }

  function closePopup() {
    root?.classList.remove('is-open');
    root?.setAttribute('aria-hidden', 'true');
  }

  function saveFromForm(event) {
    event.preventDefault();
    const data = new FormData(form);
    const noteText = String(data.get('note') || '').trim();
    if (!noteText) {
      setStatus('Write the tester note first.');
      return;
    }

    const nextNote = buildNote({
      project: settings.project,
      role: String(data.get('role') || settings.role),
      tag: String(data.get('tag') || 'confusing'),
      note: noteText,
      target: {
        label: String(data.get('targetLabel') || activeTarget?.label || 'Unknown target'),
        component: String(data.get('component') || activeTarget?.component || ''),
        path: activeTarget?.path || '',
        selector: activeTarget?.selector || activeTarget?.path || '',
        selectedText: activeTarget?.selectedText || '',
        code: activeTarget?.code || {}
      },
      viewport: activeViewport || {
        width: window.innerWidth || 0,
        height: window.innerHeight || 0,
        x: 0,
        y: 0,
        xPercent: 0,
        yPercent: 0
      }
    });

    const notes = getNotes();
    notes.unshift(nextNote);
    localStorage.setItem(settings.storageKey, JSON.stringify(notes.slice(0, 120)));
    setStatus(`Saved locally. ${notes.length} note${notes.length === 1 ? '' : 's'} ready to export.`);
    form.elements.note.value = '';
  }

  async function copyIssueDraft() {
    const notes = getNotes();
    const note = notes[0] || buildDraftNoteFromForm();
    if (!note?.note) {
      setStatus('Save or write a tester note before copying a draft.');
      return;
    }

    try {
      await navigator.clipboard.writeText(buildIssueDraft(note));
      setStatus('GitHub-ready issue draft copied.');
    } catch {
      setStatus('Clipboard was blocked. Export JSON instead.');
    }
  }

  function buildDraftNoteFromForm() {
    if (!form) return null;
    const data = new FormData(form);
    const noteText = String(data.get('note') || '').trim();
    if (!noteText) return null;
    return buildNote({
      project: settings.project,
      role: String(data.get('role') || settings.role),
      tag: String(data.get('tag') || 'confusing'),
      note: noteText,
      target: {
        label: String(data.get('targetLabel') || activeTarget?.label || 'Unknown target'),
        component: String(data.get('component') || activeTarget?.component || ''),
        path: activeTarget?.path || '',
        selector: activeTarget?.selector || activeTarget?.path || '',
        selectedText: activeTarget?.selectedText || '',
        code: activeTarget?.code || {}
      },
      viewport: activeViewport || {
        width: window.innerWidth || 0,
        height: window.innerHeight || 0,
        x: 0,
        y: 0,
        xPercent: 0,
        yPercent: 0
      }
    });
  }

  function buildIssueDraft(note) {
    const target = note.target || {};
    const codeHint = target.code?.file || target.code?.symbol
      ? `${target.code?.file || '[file not provided]'}${target.code?.symbol ? ` :: ${target.code.symbol}` : ''}`
      : 'Not provided';
    return [
      `# [Panda Notes] ${note.tag}: ${target.component || target.label || 'Unknown target'}`,
      '',
      '## Tester evidence',
      `- Role: ${note.audience}`,
      `- Page: ${note.page}`,
      `- Target: ${target.label || 'Unknown target'}`,
      `- Component: ${target.component || 'Not provided'}`,
      `- Selector: ${target.selector || target.path || 'Not provided'}`,
      `- Selected text: ${target.selectedText || 'Not provided'}`,
      `- Click point: ${formatViewport(note.viewport)}`,
      '',
      '## Note',
      note.note || '[empty]',
      '',
      '## Code hint',
      codeHint,
      '',
      '## Privacy boundary',
      'This draft came from local Panda Notes data. Do not paste secrets, credentials, customer data, or confidential source code into public issues.'
    ].join('\n');
  }

  function exportNotes() {
    const notes = getNotes();
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slug(settings.project)}-panda-notes.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${notes.length} note${notes.length === 1 ? '' : 's'}.`);
  }

  function getNotes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(settings.storageKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function buildNote({ project, role, tag, note, target, viewport }) {
    const safeRole = AUDIENCES.includes(role) ? role : 'alpha';
    const safeTag = NOTE_TAGS.includes(tag) ? tag : 'confusing';
    const date = new Date();

    return {
      schema: 'panda-note.v1',
      id: `pn-${date.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: date.toISOString(),
      audience: safeRole,
      page: `${clean(project, 80)} / ${location.pathname || '/'}`,
      tag: safeTag,
      note: redact(note).slice(0, 900),
      target: {
        label: clean(target.label || 'Unknown target', 140),
        component: clean(target.component || '', 80),
        path: clean(target.path || '', 140),
        selector: clean(target.selector || target.path || '', 160),
        selectedText: clean(target.selectedText || '', 220),
        code: {
          file: clean(target.code?.file || target.file || '', 180),
          symbol: clean(target.code?.symbol || target.symbol || '', 140)
        }
      },
      viewport: {
        width: clamp(viewport.width, 0, 10000),
        height: clamp(viewport.height, 0, 10000),
        x: clamp(viewport.x, 0, 10000),
        y: clamp(viewport.y, 0, 10000),
        xPercent: clamp(viewport.xPercent, 0, 100),
        yPercent: clamp(viewport.yPercent, 0, 100)
      }
    };
  }

  function describeTarget(element) {
    const dataset = element?.dataset || {};
    return {
      label: first([
        dataset.pandaTarget,
        element?.getAttribute?.('data-panda-target'),
        element?.getAttribute?.('aria-label'),
        element?.getAttribute?.('title'),
        element?.textContent,
        element?.tagName
      ]) || 'Unknown target',
      component: first([
        dataset.component,
        element?.getAttribute?.('data-component'),
        dataset.pandaComponent,
        element?.getAttribute?.('data-panda-component')
      ], 80),
      path: describePath(element),
      selector: describePath(element),
      selectedText: clean(element?.ownerDocument?.getSelection?.().toString?.(), 220),
      code: {
        file: first([
          dataset.pandaFile,
          element?.getAttribute?.('data-panda-file'),
          dataset.pandaSource,
          element?.getAttribute?.('data-panda-source')
        ], 180),
        symbol: first([
          dataset.pandaSymbol,
          element?.getAttribute?.('data-panda-symbol'),
          dataset.pandaHandler,
          element?.getAttribute?.('data-panda-handler')
        ], 140)
      }
    };
  }

  function describePath(element) {
    if (!element) return '';
    const tag = String(element.tagName || 'element').toLowerCase();
    const id = selectorPart(element.id);
    const classes = typeof element.className === 'string'
      ? element.className.split(/\s+/).map(selectorPart).filter(Boolean).slice(0, 3).map((item) => `.${item}`).join('')
      : '';
    return `${tag}${id ? `#${id}` : ''}${classes}`.slice(0, 140);
  }

  function normalizeOptions(options) {
    const project = clean(options.project || DEFAULTS.project, 80) || DEFAULTS.project;
    const role = AUDIENCES.includes(options.role) ? options.role : DEFAULTS.role;
    const storageKey = clean(options.storageKey, 120) || `panda-notes-widget:${slug(project)}`;
    const privateIntakeUrl = safeUrl(options.privateIntakeUrl);

    return {
      project,
      role,
      mode: options.mode || DEFAULTS.mode,
      storageKey,
      contextMenu: options.contextMenu !== false,
      launcher: Boolean(options.launcher),
      hotkey: clean(options.hotkey, 32),
      privateIntakeUrl,
      installPlan: INSTALL_PLANS.includes(options.installPlan) ? options.installPlan : DEFAULTS.installPlan
    };
  }

  function injectStyles() {
    if (document.getElementById('panda-notes-widget-style')) return;
    const style = document.createElement('style');
    style.id = 'panda-notes-widget-style';
    style.textContent = `
      .panda-notes-widget {
        position: fixed;
        z-index: 2147483647;
        display: none;
        width: min(328px, calc(100vw - 24px));
        color: #18221d;
        font: 14px/1.35 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .panda-notes-widget.is-open { display: block; }
      .panda-notes-widget__card {
        display: grid;
        gap: 10px;
        margin: 0;
        border: 1px solid rgba(43, 68, 54, 0.22);
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(255, 252, 241, 0.98), rgba(248, 237, 215, 0.96));
        box-shadow: 0 20px 70px rgba(24, 34, 29, 0.28);
        max-height: calc(100vh - 24px);
        overflow: auto;
        padding: 12px;
      }
      .panda-notes-widget__head {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 9px;
        align-items: center;
      }
      .panda-notes-widget__head strong,
      .panda-notes-widget__head span {
        display: block;
      }
      .panda-notes-widget__head span,
      .panda-notes-widget label span,
      .panda-notes-widget__status {
        color: #5b7663;
        font-size: 12px;
        font-weight: 800;
      }
      .panda-notes-widget__mark {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background:
          radial-gradient(circle at 32% 38%, #18221d 0 4px, transparent 5px),
          radial-gradient(circle at 68% 38%, #18221d 0 4px, transparent 5px),
          radial-gradient(circle at 50% 64%, #18221d 0 3px, transparent 4px),
          radial-gradient(circle at 22% 18%, #18221d 0 5px, transparent 6px),
          radial-gradient(circle at 78% 18%, #18221d 0 5px, transparent 6px),
          linear-gradient(135deg, #dff0c2, #f4d37c);
      }
      .panda-notes-widget label {
        display: grid;
        gap: 5px;
        font-weight: 750;
      }
      .panda-notes-widget input,
      .panda-notes-widget select,
      .panda-notes-widget textarea {
        min-width: 0;
        width: 100%;
        border: 1px solid rgba(43, 68, 54, 0.2);
        border-radius: 8px;
        background: rgba(255, 252, 241, 0.95);
        color: #18221d;
        font: inherit;
        padding: 9px 10px;
      }
      .panda-notes-widget textarea {
        min-height: 92px;
        resize: vertical;
      }
      .panda-notes-widget button {
        min-height: 36px;
        border: 1px solid rgba(43, 68, 54, 0.16);
        border-radius: 8px;
        background: rgba(251, 246, 232, 0.86);
        color: #18221d;
        cursor: pointer;
        font: inherit;
        font-weight: 850;
        padding: 0 12px;
      }
      .panda-notes-widget__primary {
        border-color: rgba(31, 101, 64, 0.32) !important;
        background: linear-gradient(135deg, #4fb36a, #b8e26b) !important;
      }
      .panda-notes-widget__icon {
        width: 32px;
        padding: 0 !important;
      }
      .panda-notes-widget__actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .panda-notes-widget__link {
        min-height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(43, 68, 54, 0.16);
        border-radius: 8px;
        background: rgba(251, 246, 232, 0.86);
        color: #18221d;
        font-weight: 850;
        padding: 0 12px;
        text-decoration: none;
      }
      .panda-notes-widget__status {
        min-height: 18px;
        margin: 0;
      }
      .panda-notes-widget__launcher {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483646;
        min-height: 42px;
        border: 1px solid rgba(31, 101, 64, 0.32);
        border-radius: 8px;
        background: linear-gradient(135deg, #4fb36a, #b8e26b);
        color: #102017;
        box-shadow: 0 14px 42px rgba(24, 34, 29, 0.24);
        cursor: pointer;
        font: 850 14px/1 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 0 14px;
      }
    `;
    document.head.append(style);
  }

  function setStatus(message) {
    if (statusNode) statusNode.textContent = message;
  }

  function first(values, limit = 140) {
    for (const value of values) {
      const text = clean(value, limit);
      if (text) return text;
    }
    return '';
  }

  function redact(value) {
    return clean(value, 900)
      .replace(/[A-Z]:\\(?:[^\\\s]+\\)*[^\\\s]*/gi, '[redacted-path]')
      .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[redacted-email]')
      .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[redacted-phone]');
  }

  function clean(value, limit = 140) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
  }

  function selectorPart(value) {
    return String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
  }

  function safeUrl(value) {
    const text = clean(value, 260);
    if (!text) return '';
    try {
      const url = new URL(text);
      return url.protocol === 'https:' ? url.toString() : '';
    } catch {
      return '';
    }
  }

  function slug(value) {
    return String(value || 'project').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'project';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
  }

  function percent(value, size) {
    return clamp((Number(value) / Number(size || 1)) * 100, 0, 100);
  }

  function formatViewport(viewport = {}) {
    const width = clamp(viewport.width, 0, 10000);
    const height = clamp(viewport.height, 0, 10000);
    const x = clamp(viewport.x, 0, 10000);
    const y = clamp(viewport.y, 0, 10000);
    const xPercent = clamp(viewport.xPercent, 0, 100);
    const yPercent = clamp(viewport.yPercent, 0, 100);
    return `${width}x${height}, click ${x},${y} (${xPercent}%,${yPercent}%)`;
  }

  function matchesHotkey(event, hotkey) {
    const parts = String(hotkey || '').toLowerCase().split('+').map((part) => part.trim()).filter(Boolean);
    if (!parts.length) return false;
    const key = parts.at(-1);
    return event.key?.toLowerCase() === key
      && event.ctrlKey === parts.includes('ctrl')
      && event.shiftKey === parts.includes('shift')
      && event.altKey === parts.includes('alt')
      && event.metaKey === parts.includes('meta');
  }

  const api = {
    init,
    destroy,
    openForTarget,
    exportNotes,
    getNotes,
    version: VERSION
  };

  window.PandaNotes = api;
})();
