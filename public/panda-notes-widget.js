(function () {
  const VERSION = '0.2.0-alpha';
  const NOTE_TAGS = ['broken', 'layout issue', 'missing feedback', 'text issue', 'confusing', 'slow', 'idea'];
  const AUDIENCES = ['alpha', 'beta', 'developer'];
  const DEFAULTS = {
    project: 'Panda Notes Project',
    role: 'alpha',
    mode: 'local',
    contextMenu: true
  };

  let settings = normalizeOptions({});
  let activeTarget = null;
  let activeViewport = null;
  let root = null;
  let form = null;
  let statusNode = null;
  let contextHandler = null;

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

    return api;
  }

  function destroy() {
    if (contextHandler) {
      document.removeEventListener('contextmenu', contextHandler);
      contextHandler = null;
    }
    root?.remove();
    root = null;
    form = null;
    statusNode = null;
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
          <button type="button" data-panda-export>Export JSON</button>
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
    root.querySelector('[data-panda-export]').addEventListener('click', exportNotes);
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
        path: activeTarget?.path || ''
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
        path: clean(target.path || '', 140)
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
      path: describePath(element)
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

    return {
      project,
      role,
      mode: options.mode || DEFAULTS.mode,
      storageKey,
      contextMenu: options.contextMenu !== false
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
      .panda-notes-widget__status {
        min-height: 18px;
        margin: 0;
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

  function slug(value) {
    return String(value || 'project').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'project';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
  }

  function percent(value, size) {
    return clamp((Number(value) / Number(size || 1)) * 100, 0, 100);
  }

  const api = {
    init,
    destroy,
    exportNotes,
    getNotes,
    version: VERSION
  };

  window.PandaNotes = api;
})();
