import { createPandaNote, pandaAudiences } from './pandaNotes.js';

const DEFAULT_PROJECT = 'Panda Notes Project';
const DEFAULT_WIDGET_BASE_URL = 'https://p4nd4907.github.io/panda-notes/';
const installPlans = new Set(['setup-sprint', 'developer-handoff', 'private-integration', 'self-install']);

export function normalizeWidgetOptions(options = {}) {
  const project = sanitizeWidgetText(options.project || DEFAULT_PROJECT, 80) || DEFAULT_PROJECT;
  const role = pandaAudiences.some((audience) => audience.key === options.role) ? options.role : 'alpha';
  const storageKey = sanitizeWidgetText(options.storageKey, 120) || createWidgetStorageKey(project);
  const privateIntakeUrl = sanitizeWidgetUrl(options.privateIntakeUrl);
  const installPlan = installPlans.has(options.installPlan) ? options.installPlan : 'self-install';

  return {
    project,
    role,
    storageKey,
    contextMenu: options.contextMenu !== false,
    launcher: Boolean(options.launcher),
    hotkey: sanitizeWidgetText(options.hotkey, 32),
    privateIntakeUrl,
    installPlan
  };
}

export function buildWidgetInstallSnippet(options = {}) {
  const normalized = normalizeWidgetOptions(options);
  const baseUrl = withTrailingSlash(sanitizeWidgetUrl(options.baseUrl) || DEFAULT_WIDGET_BASE_URL);
  const widgetUrl = new URL('panda-notes-widget.js', baseUrl).toString();
  const config = {
    project: normalized.project,
    role: normalized.role,
    contextMenu: normalized.contextMenu,
    launcher: normalized.launcher,
    privateIntakeUrl: normalized.privateIntakeUrl,
    installPlan: normalized.installPlan
  };

  if (normalized.hotkey) config.hotkey = normalized.hotkey;

  return [
    `<script src="${widgetUrl}" defer></script>`,
    '<script>',
    '  window.addEventListener("DOMContentLoaded", () => {',
    '    window.PandaNotes.init(',
    indentJson(config, 6),
    '    );',
    '  });',
    '</script>'
  ].join('\n');
}

export function createWidgetStorageKey(project = DEFAULT_PROJECT) {
  const slug = String(project || DEFAULT_PROJECT)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'project';

  return `panda-notes-widget:${slug}`;
}

export function describeWidgetTarget(element) {
  if (!element) {
    return {
      label: 'Unknown target',
      component: '',
      path: ''
    };
  }

  const dataset = element.dataset || {};
  const label = firstText([
    dataset.pandaTarget,
    element.getAttribute?.('data-panda-target'),
    element.getAttribute?.('aria-label'),
    element.getAttribute?.('title'),
    element.getAttribute?.('alt'),
    element.textContent,
    element.tagName
  ]);

  const component = firstText([
    dataset.component,
    element.getAttribute?.('data-component'),
    dataset.pandaComponent,
    element.getAttribute?.('data-panda-component')
  ], 80);

  return {
    label: label || 'Unknown target',
    component,
    path: describeElementPath(element),
    selector: describeElementPath(element),
    selectedText: sanitizeWidgetText(element.ownerDocument?.getSelection?.().toString?.(), 220),
    code: {
      file: firstText([
        dataset.pandaFile,
        element.getAttribute?.('data-panda-file'),
        dataset.pandaSource,
        element.getAttribute?.('data-panda-source')
      ], 160),
      symbol: firstText([
        dataset.pandaSymbol,
        element.getAttribute?.('data-panda-symbol'),
        dataset.pandaHandler,
        element.getAttribute?.('data-panda-handler')
      ], 120)
    }
  };
}

export function buildWidgetNote({
  project = DEFAULT_PROJECT,
  role = 'alpha',
  tag = 'confusing',
  note = '',
  page = '',
  target = {},
  viewport = {},
  now = new Date()
} = {}) {
  const safeProject = sanitizeWidgetText(project, 80) || DEFAULT_PROJECT;
  const pageLabel = `${safeProject} / ${describePage(page)}`;

  return createPandaNote({
    audience: role,
    page: pageLabel,
    tag,
    note,
    target,
    viewport,
    now
  });
}

export function describePage(value = '') {
  if (!value) return 'current page';

  try {
    const parsed = new URL(String(value));
    return parsed.pathname || '/';
  } catch {
    return sanitizeWidgetText(value, 80) || 'current page';
  }
}

function describeElementPath(element) {
  const tag = String(element.tagName || 'element').toLowerCase();
  const id = sanitizeSelectorPart(element.id);
  const className = typeof element.className === 'string' ? element.className : '';
  const classes = className
    .split(/\s+/)
    .map(sanitizeSelectorPart)
    .filter(Boolean)
    .slice(0, 3)
    .map((item) => `.${item}`)
    .join('');

  return `${tag}${id ? `#${id}` : ''}${classes}`.slice(0, 140);
}

function firstText(values, limit = 140) {
  for (const value of values) {
    const text = sanitizeWidgetText(value, limit);
    if (text) return text;
  }
  return '';
}

function sanitizeSelectorPart(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 48);
}

function sanitizeWidgetText(value, limit = 140) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function sanitizeWidgetUrl(value) {
  const text = sanitizeWidgetText(value, 260);
  if (!text) return '';

  try {
    const url = new URL(text);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function withTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function indentJson(value, spaces) {
  return JSON.stringify(value, null, 2)
    .split('\n')
    .map((line) => `${' '.repeat(spaces)}${line}`)
    .join('\n');
}
