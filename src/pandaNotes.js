export const PANDA_NOTES_STORAGE_KEY = 'panda-notes-local-v1';

export const pandaNoteTags = [
  'broken',
  'layout issue',
  'missing feedback',
  'text issue',
  'confusing',
  'slow',
  'idea'
];

export const pandaAudiences = [
  {
    key: 'developer',
    label: 'Developers',
    headline: 'Turn tester notes into code-backed repair queues.',
    detail: 'Select a target issue, inspect evidence, review the mapped source snippet, then run the focused verification path.'
  },
  {
    key: 'alpha',
    label: 'Alpha testers',
    headline: 'Catch first-run friction before it hardens.',
    detail: 'Capture broken controls, confusing text, layout rough spots, and missing states while the product is still changing fast.'
  },
  {
    key: 'beta',
    label: 'Beta testers',
    headline: 'Prove repeat issues from real sessions.',
    detail: 'Attach notes to session reports, compare repeated pain points, and help developers prioritize the next fix.'
  }
];

export const starterCodeStructure = [
  {
    path: 'src/App.jsx',
    role: 'Standalone React console, note creation form, issue selector, packet actions, and audience workflow.',
    audience: 'developer'
  },
  {
    path: 'src/pandaNotes.js',
    role: 'Redaction, note schema, repair queue generation, code snippet mapping, and developer packet export.',
    audience: 'developer'
  },
  {
    path: 'src/styles.css',
    role: 'Responsive desktop-tool layout, selected issue popout, code preview, and mobile containment rules.',
    audience: 'developer'
  },
  {
    path: 'src/pandaNotes.test.js',
    role: 'Behavior tests for privacy redaction, alpha/beta/developer queues, snippets, and packets.',
    audience: 'developer'
  },
  {
    path: 'README.md',
    role: 'Standalone repo overview, tester flow, developer flow, and privacy boundary.',
    audience: 'alpha + beta'
  },
  {
    path: 'package.json',
    role: 'Vite, React, Vitest, and browser QA scripts for the standalone app.',
    audience: 'developer'
  },
  {
    path: 'CueForge import',
    role: 'Optional JSON notes exported from CueForge Panda Notes can be pasted into this app later.',
    audience: 'beta'
  }
];

export const audienceGuides = [
  {
    key: 'developer',
    label: 'Developer handoff',
    summary: 'Start with the highest priority target, inspect the attached code snippet, then make one focused fix.',
    steps: [
      'Open the top repair action and read the newest evidence first.',
      'Use the snippet as the first file to inspect, then follow nearby imports or handlers.',
      'Copy the GitHub draft when the fix needs tracking, or copy the developer packet when it needs handoff.',
      'Run unit tests, build, and browser QA before marking the issue done.'
    ]
  },
  {
    key: 'alpha',
    label: 'Alpha tester pass',
    summary: 'Capture rough first-run friction while the product is still changing quickly.',
    steps: [
      'Walk the first-run path and write down the first moment that feels broken, slow, confusing, or silent.',
      'Use one note per target so developers can map the feedback to a specific component.',
      'Prefer plain words over diagnosis: what you clicked, what happened, and what you expected.',
      'Export JSON at the end of the pass if someone else needs to merge your notes.'
    ]
  },
  {
    key: 'beta',
    label: 'Beta tester proof',
    summary: 'Repeat real user flows and prove which issues are stable enough to prioritize.',
    steps: [
      'Repeat the same flow twice before marking it as broken or slow.',
      'Add viewport, page, target label, and any exact text that misled you.',
      'Look for repeated patterns in the target issue list before filing a new issue.',
      'Share the GitHub draft when a repeated issue is ready for the backlog.'
    ]
  }
];

export const starterSnippets = {
  broken: {
    file: 'src/App.jsx',
    language: 'jsx',
    title: 'Developer packet action path',
    code: `async function copyDeveloperPacket() {
  const packet = buildDeveloperPacket(notes);
  await navigator.clipboard.writeText(packet);
  setStatus('Developer packet copied.');
}`
  },
  'layout issue': {
    file: 'src/styles.css',
    language: 'css',
    title: 'Selected issue and snippet layout',
    code: `.issue-workspace {
  display: grid;
  grid-template-columns: minmax(240px, 0.8fr) minmax(0, 1.2fr);
  align-items: start;
}`
  },
  'missing feedback': {
    file: 'src/pandaNotes.js',
    language: 'js',
    title: 'Repair queue empty and active states',
    code: `return {
  schema: 'panda-repair-queue.v1',
  status: safe.length ? 'ready' : 'no-notes-yet',
  actionCount: actions.length,
  actions
};`
  },
  'text issue': {
    file: 'src/App.jsx',
    language: 'jsx',
    title: 'Tester-facing copy surface',
    code: `<textarea
  value={draft.note}
  placeholder="What happened, what did you expect, and what should the developer inspect?"
/>`
  },
  confusing: {
    file: 'README.md',
    language: 'md',
    title: 'Workflow wording boundary',
    code: `Alpha testers find rough edges.
Beta testers prove repeatability.
Developers turn notes into verified fixes.`
  },
  slow: {
    file: 'src/App.jsx',
    language: 'jsx',
    title: 'Local computation boundary',
    code: `const repairQueue = useMemo(() => buildRepairQueue(notes), [notes]);
const selectedAction = repairQueue.actions.find((item) => item.id === selectedId);`
  },
  idea: {
    file: 'README.md',
    language: 'md',
    title: 'Idea triage rule',
    code: `Ideas are captured, but developer repair queues prioritize broken, layout, missing feedback, and repeatable beta issues first.`
  }
};

export function createPandaNote({
  audience = 'alpha',
  page = 'Standalone App',
  tag = 'confusing',
  note = '',
  target = {},
  viewport = {},
  now = new Date()
} = {}) {
  const safeAudience = pandaAudiences.some((item) => item.key === audience) ? audience : 'alpha';
  const safeTag = pandaNoteTags.includes(tag) ? tag : 'confusing';
  const date = safeDate(now);

  return {
    schema: 'panda-note.v1',
    id: `pn-${date.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: date.toISOString(),
    audience: safeAudience,
    page: sanitizeShortText(page, 90),
    tag: safeTag,
    note: sanitizeLongText(note),
    target: {
      label: sanitizeShortText(target.label || 'Unknown target', 140),
      component: sanitizeShortText(target.component || '', 80),
      path: sanitizeShortText(target.path || '', 140)
    },
    viewport: {
      width: clampNumber(viewport.width, 0, 10000),
      height: clampNumber(viewport.height, 0, 10000),
      x: clampNumber(viewport.x, 0, 10000),
      y: clampNumber(viewport.y, 0, 10000),
      xPercent: clampNumber(viewport.xPercent, 0, 100),
      yPercent: clampNumber(viewport.yPercent, 0, 100)
    }
  };
}

export function sanitizePandaNotes(notes = []) {
  if (!Array.isArray(notes)) return [];
  return notes.slice(-120).map((item) =>
    createPandaNote({
      audience: item.audience,
      page: item.page,
      tag: item.tag,
      note: item.note,
      target: item.target,
      viewport: item.viewport,
      now: safeDate(item.createdAt)
    })
  );
}

export function summarizePandaNotes(notes = []) {
  const safe = sanitizePandaNotes(notes);
  const byTag = Object.fromEntries(pandaNoteTags.map((tag) => [tag, 0]));
  const byAudience = Object.fromEntries(pandaAudiences.map((audience) => [audience.key, 0]));

  for (const note of safe) {
    byTag[note.tag] = (byTag[note.tag] || 0) + 1;
    byAudience[note.audience] = (byAudience[note.audience] || 0) + 1;
  }

  const topTag = Object.entries(byTag).sort((a, b) => b[1] - a[1])[0];

  return {
    total: safe.length,
    topTag: topTag?.[1] ? topTag[0] : 'none yet',
    byTag,
    byAudience,
    latest: safe.at(-1) || null
  };
}

export function buildRepairQueue(notes = [], { now = new Date() } = {}) {
  const safe = sanitizePandaNotes(notes);
  const groups = new Map();

  for (const note of safe) {
    const target = note.target.component || note.target.label || 'Unknown target';
    const key = [note.page, target, note.tag].join('::');
    if (!groups.has(key)) {
      groups.set(key, {
        id: `repair-${groups.size + 1}`,
        page: note.page,
        target,
        tag: note.tag,
        notes: [],
        priority: priorityForTag(note.tag),
        suggestedFix: suggestedFixForTag(note.tag),
        testPlan: testPlanForTag(note.tag)
      });
    }
    groups.get(key).notes.push(note);
  }

  const actions = [...groups.values()]
    .map((group) => ({
      ...group,
      count: group.notes.length,
      latestAt: group.notes.at(-1)?.createdAt || null,
      title: `${titleForTag(group.tag)}: ${group.target}`,
      snippet: getSnippetForTag(group.tag),
      evidence: group.notes.slice(-4).map((note) => ({
        audience: note.audience,
        note: note.note,
        page: note.page,
        target: note.target.label,
        viewport: note.viewport,
        createdAt: note.createdAt
      }))
    }))
    .sort((a, b) => b.priority - a.priority || b.count - a.count || String(b.latestAt).localeCompare(String(a.latestAt)))
    .slice(0, 16);

  return {
    schema: 'panda-repair-queue.v1',
    generatedAt: safeDate(now).toISOString(),
    status: safe.length ? 'ready' : 'no-notes-yet',
    totalNotes: safe.length,
    actionCount: actions.length,
    topAction: actions[0] || null,
    actions,
    boundary: 'No hidden telemetry. Tester notes stay local until someone explicitly exports or copies a packet.'
  };
}

export function buildDeveloperPacket(notes = [], options = {}) {
  const queue = buildRepairQueue(notes, options);
  const lines = [
    'Panda Notes developer packet',
    `Generated: ${queue.generatedAt}`,
    'Audience focus: developers, alpha testers, beta testers',
    `Notes scanned: ${queue.totalNotes}`,
    `Repair actions: ${queue.actionCount}`,
    '',
    'Boundary:',
    queue.boundary,
    '',
    'Developer instruction:',
    'Use selected evidence and target snippets to make the smallest focused fix. Run tests, build, and browser QA before claiming done. No hidden telemetry.',
    '',
    'Code structure:'
  ];

  starterCodeStructure.forEach((entry) => {
    lines.push(`- ${entry.path}: ${entry.role}`);
  });
  lines.push('');

  if (!queue.actions.length) {
    lines.push('No notes yet. Ask alpha testers to capture rough edges or beta testers to prove repeat issues.');
    return lines.join('\n');
  }

  queue.actions.forEach((action, index) => {
    lines.push(`${index + 1}. ${action.title}`);
    lines.push(`   Page: ${action.page}`);
    lines.push(`   Tag: ${action.tag}`);
    lines.push(`   Priority: ${action.priority}`);
    lines.push(`   Evidence count: ${action.count}`);
    lines.push(`   Suggested fix: ${action.suggestedFix}`);
    lines.push(`   Test plan: ${action.testPlan}`);
    lines.push(`   Target code: ${action.snippet.file}`);
    lines.push(`   Snippet: ${action.snippet.title}`);
    action.snippet.code.split('\n').forEach((line) => lines.push(`   > ${line}`));
    action.evidence.forEach((item, itemIndex) => {
      lines.push(`   Note ${itemIndex + 1} (${item.audience}): ${item.note || '[empty]'}`);
      lines.push(`   Target ${itemIndex + 1}: ${item.target || '[unknown]'} at ${formatViewport(item.viewport)}`);
    });
    lines.push('');
  });

  return lines.join('\n').trim();
}

export function filterRepairActions(actions = [], filters = {}) {
  if (!Array.isArray(actions)) return [];

  const query = normalizeQuery(filters.query);
  const tag = filters.tag && filters.tag !== 'all' ? String(filters.tag) : '';
  const audience = filters.audience && filters.audience !== 'all' ? String(filters.audience) : '';

  return actions.filter((action) => {
    if (tag && action.tag !== tag) return false;
    if (audience && !action.evidence?.some((item) => item.audience === audience)) return false;
    if (!query) return true;

    const searchable = [
      action.title,
      action.page,
      action.target,
      action.tag,
      action.suggestedFix,
      action.testPlan,
      action.snippet?.file,
      action.snippet?.title,
      ...(action.evidence || []).flatMap((item) => [
        item.audience,
        item.note,
        item.page,
        item.target
      ])
    ].join(' ');

    return normalizeQuery(searchable).includes(query);
  });
}

export function getAudienceGuide(key = 'alpha') {
  return audienceGuides.find((guide) => guide.key === key) || audienceGuides.find((guide) => guide.key === 'alpha');
}

export function buildGithubIssueDraft(action) {
  if (!action) {
    return {
      title: '[Panda Notes] New tester issue',
      body: [
        '## Summary',
        'No repair action is selected yet.',
        '',
        '## Privacy boundary',
        'No hidden telemetry. Tester notes stay local until someone explicitly exports or copies a packet.'
      ].join('\n'),
      labels: ['panda-notes', 'tester-feedback']
    };
  }

  const snippet = action.snippet || getSnippetForTag(action.tag);
  const language = snippet.language || '';
  const lines = [
    '## Summary',
    action.suggestedFix,
    '',
    '## Target',
    `- Page: ${action.page}`,
    `- Target: ${action.target}`,
    `- Tag: ${action.tag}`,
    `- Priority: ${action.priority}`,
    `- Evidence count: ${action.count}`,
    '',
    '## Tester evidence'
  ];

  (action.evidence || []).forEach((item) => {
    const viewport = formatViewport(item.viewport);
    lines.push(`- ${item.audience}: ${item.note || '[empty]'} (target: ${item.target || '[unknown]'}, viewport: ${viewport})`);
  });

  lines.push(
    '',
    '## Suggested test plan',
    action.testPlan,
    '',
    '## Target code',
    `- File: ${snippet.file}`,
    `- Snippet: ${snippet.title}`,
    '',
    `\`\`\`${language}`,
    snippet.code,
    '```',
    '',
    '## Privacy boundary',
    'No hidden telemetry. Tester notes stay local until someone explicitly exports or copies a packet.'
  );

  return {
    title: `[Panda Notes] ${action.title}`,
    body: lines.join('\n').trim(),
    labels: ['panda-notes', 'tester-feedback', action.tag]
  };
}

export function buildRepairPrompt(action) {
  if (!action) {
    return [
      'You are helping repair a Panda Notes tester issue.',
      'No target issue is selected yet. Ask for the exported Panda Notes JSON or a selected repair action before writing code.'
    ].join('\n');
  }

  const snippet = action.snippet || getSnippetForTag(action.tag);
  const evidence = (action.evidence || []).map((item, index) => [
    `Evidence ${index + 1}:`,
    `- Role: ${item.audience}`,
    `- Note: ${item.note || '[empty]'}`,
    `- Target: ${item.target || '[unknown]'}`,
    `- Viewport: ${formatViewport(item.viewport)}`
  ].join('\n')).join('\n\n');

  return [
    'You are helping repair a Panda Notes tester issue.',
    'Use the tester evidence, target location, and code snippet to propose the smallest safe fix.',
    'Do not invent private app details. If a file or behavior is missing, ask for that code before writing a patch.',
    '',
    `Issue: ${action.title}`,
    `Page: ${action.page}`,
    `Tag: ${action.tag}`,
    `Suggested fix: ${action.suggestedFix}`,
    `Test plan: ${action.testPlan}`,
    '',
    'Tester evidence:',
    evidence || '[none]',
    '',
    'Starting code target:',
    `File: ${snippet.file}`,
    `Snippet: ${snippet.title}`,
    '',
    `\`\`\`${snippet.language || ''}`,
    snippet.code,
    '```',
    '',
    'Return:',
    '1. Probable cause.',
    '2. Minimal code change plan.',
    '3. Patch or exact code edits if enough source is provided.',
    '4. Verification steps.'
  ].join('\n').trim();
}

export function getSnippetForTag(tag) {
  return starterSnippets[pandaNoteTags.includes(tag) ? tag : 'confusing'];
}

function normalizeQuery(value) {
  return String(value || '').trim().toLowerCase();
}

function sanitizeLongText(value) {
  return String(value || '')
    .replace(/[A-Z]:\\(?:[^\\\s]+\\)*[^\\\s]*/gi, '[redacted-path]')
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[redacted-email]')
    .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[redacted-phone]')
    .replace(/\b(?:[A-Z0-9._%+-]+\\)?Users\\[^\\\s]+/gi, 'Users\\[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 900);
}

function sanitizeShortText(value, limit) {
  return sanitizeLongText(value).slice(0, limit);
}

function safeDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
}

function formatViewport(viewport = {}) {
  const size = `${viewport.width || 0}x${viewport.height || 0}`;
  const hasExactPoint = Number(viewport.x) > 0 || Number(viewport.y) > 0;
  const hasPercentPoint = Number(viewport.xPercent) > 0 || Number(viewport.yPercent) > 0;
  const exact = hasExactPoint ? `, click ${viewport.x || 0},${viewport.y || 0}` : '';
  const percent = hasPercentPoint ? ` (${viewport.xPercent || 0}%,${viewport.yPercent || 0}%)` : '';

  return `${size}${exact}${percent}`;
}

function priorityForTag(tag) {
  return {
    broken: 100,
    'layout issue': 90,
    'missing feedback': 82,
    slow: 74,
    'text issue': 66,
    confusing: 58,
    idea: 34
  }[tag] || 50;
}

function titleForTag(tag) {
  return {
    broken: 'Fix broken flow',
    'layout issue': 'Fix layout issue',
    'missing feedback': 'Add missing feedback',
    slow: 'Profile slow path',
    'text issue': 'Rewrite confusing copy',
    confusing: 'Clarify tester flow',
    idea: 'Review tester idea'
  }[tag] || 'Review note';
}

function suggestedFixForTag(tag) {
  return {
    broken: 'Reproduce the action, repair the handler or state path, then add a focused regression check.',
    'layout issue': 'Inspect the noted viewport, fix wrapping/containment/grid sizing, and rerun mobile plus desktop overflow checks.',
    'missing feedback': 'Add visible loading, success, blocked, empty, and error feedback next to the control.',
    slow: 'Profile the path, remove unnecessary synchronous work, and verify the app stays responsive with a realistic note count.',
    'text issue': 'Replace vague wording with direct tester-facing copy that fits mobile and desktop containers.',
    confusing: 'Simplify ordering, labels, and next-step copy so a fresh tester knows what to do.',
    idea: 'Triage the idea against current alpha/beta goals before adding UI.'
  }[tag] || 'Review the note and make the smallest targeted fix.';
}

function testPlanForTag(tag) {
  return {
    broken: 'Run the exact click/type/export path, then run unit tests, build, and browser smoke.',
    'layout issue': 'Check 390px mobile, tablet, and desktop widths for overflow, clipping, and text collision.',
    'missing feedback': 'Trigger pass, fail, blocked, and empty states and confirm visible feedback appears.',
    slow: 'Run before/after browser smoke with 100+ notes loaded locally.',
    'text issue': 'Verify longest labels wrap cleanly and the next action is obvious.',
    confusing: 'Walk the page from a new tester state and confirm each action has a clear next step.',
    idea: 'Add to backlog or reject with a written reason.'
  }[tag] || 'Run focused browser QA for the noted area.';
}
