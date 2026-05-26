import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bug,
  ClipboardCopy,
  ClipboardList,
  Code2,
  Download,
  ExternalLink,
  FileJson,
  FilterX,
  GitBranch,
  Github,
  Handshake,
  ListChecks,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users
} from 'lucide-react';
import {
  buildDeveloperPacket,
  buildGithubIssueDraft,
  buildRepairQueue,
  createPandaNote,
  filterRepairActions,
  getAudienceGuide,
  PANDA_NOTES_STORAGE_KEY,
  pandaAudiences,
  pandaNoteTags,
  starterCodeStructure,
  summarizePandaNotes
} from './pandaNotes.js';

const seedNotes = [
  createPandaNote({
    audience: 'alpha',
    page: 'Install Flow',
    tag: 'missing feedback',
    note: 'The import button looked idle after I picked a JSON file.',
    target: { label: 'Import notes', component: 'ImportPanel' },
    viewport: { width: 390, height: 844, xPercent: 58, yPercent: 52 },
    now: new Date('2026-05-24T18:00:00.000Z')
  }),
  createPandaNote({
    audience: 'beta',
    page: 'Developer Packet',
    tag: 'broken',
    note: 'Copy developer packet did not show confirmation on the second try.',
    target: { label: 'Copy developer packet', component: 'PacketActions' },
    viewport: { width: 1440, height: 900, xPercent: 74, yPercent: 42 },
    now: new Date('2026-05-24T18:08:00.000Z')
  }),
  createPandaNote({
    audience: 'developer',
    page: 'Issue Detail',
    tag: 'layout issue',
    note: 'Code snippet and evidence need to stay readable side by side.',
    target: { label: 'Selected issue detail', component: 'IssueDetail' },
    viewport: { width: 1180, height: 820, xPercent: 66, yPercent: 58 },
    now: new Date('2026-05-24T18:14:00.000Z')
  })
];

function loadNotes() {
  try {
    const saved = localStorage.getItem(PANDA_NOTES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : seedNotes;
  } catch {
    return seedNotes;
  }
}

function saveNotes(notes) {
  localStorage.setItem(PANDA_NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export default function App() {
  const [notes, setNotes] = useState(loadNotes);
  const [selectedAudience, setSelectedAudience] = useState('developer');
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('Local-first console ready. Notes stay in this browser until you export or copy a packet.');
  const [issueFilters, setIssueFilters] = useState({ query: '', tag: 'all', audience: 'all' });
  const [draft, setDraft] = useState({
    audience: 'alpha',
    page: 'Standalone App',
    tag: 'broken',
    note: '',
    target: { label: 'Describe the target', component: 'ComponentName' },
    viewport: { width: 1440, height: 900, xPercent: 50, yPercent: 50 }
  });

  const summary = useMemo(() => summarizePandaNotes(notes), [notes]);
  const repairQueue = useMemo(() => buildRepairQueue(notes), [notes]);
  const filteredActions = useMemo(() => filterRepairActions(repairQueue.actions, issueFilters), [repairQueue.actions, issueFilters]);
  const selectedAction = filteredActions.find((item) => item.id === selectedId) || filteredActions[0] || null;
  const selectedIssueDraft = useMemo(() => buildGithubIssueDraft(selectedAction), [selectedAction]);
  const activeAudience = pandaAudiences.find((item) => item.key === selectedAudience) || pandaAudiences[0];
  const activeGuide = getAudienceGuide(selectedAudience);
  const hasIssueFilters = Boolean(issueFilters.query || issueFilters.tag !== 'all' || issueFilters.audience !== 'all');

  function updateDraft(path, value) {
    setDraft((current) => {
      if (path.startsWith('target.')) {
        const key = path.replace('target.', '');
        return { ...current, target: { ...current.target, [key]: value } };
      }
      if (path.startsWith('viewport.')) {
        const key = path.replace('viewport.', '');
        return { ...current, viewport: { ...current.viewport, [key]: Number(value) } };
      }
      return { ...current, [path]: value };
    });
  }

  function updateIssueFilter(name, value) {
    setIssueFilters((current) => ({ ...current, [name]: value }));
    setSelectedId('');
  }

  function clearIssueFilters() {
    setIssueFilters({ query: '', tag: 'all', audience: 'all' });
    setSelectedId('');
    setStatus('Issue filters cleared. Showing the full repair queue.');
  }

  function addNote() {
    if (!draft.note.trim()) {
      setStatus('Write the tester note first, then add it.');
      return;
    }
    const next = [createPandaNote(draft), ...notes].slice(0, 120);
    setNotes(next);
    saveNotes(next);
    setDraft((current) => ({ ...current, note: '' }));
    setStatus('Note saved locally and added to the developer repair queue.');
  }

  async function copyDeveloperPacket() {
    const packet = buildDeveloperPacket(notes);
    try {
      await navigator.clipboard.writeText(packet);
      setStatus('Developer packet copied. Send it to the person fixing the code.');
    } catch {
      setStatus('Clipboard was blocked. Export the packet instead.');
    }
  }

  async function copyGithubIssueDraft() {
    if (!selectedAction) {
      setStatus('Select a target issue before copying a GitHub draft.');
      return;
    }
    const draftText = `${selectedIssueDraft.title}\n\n${selectedIssueDraft.body}`;
    try {
      await navigator.clipboard.writeText(draftText);
      setStatus('GitHub issue draft copied with evidence, target code, and test plan.');
    } catch {
      setStatus('Clipboard was blocked. Export the GitHub issue draft instead.');
    }
  }

  function exportGithubIssueDraft() {
    if (!selectedAction) {
      setStatus('Select a target issue before exporting a GitHub draft.');
      return;
    }
    downloadText('panda-notes-github-issue.md', `# ${selectedIssueDraft.title}\n\n${selectedIssueDraft.body}`);
    setStatus('GitHub issue draft exported.');
  }

  function exportDeveloperPacket() {
    downloadText('panda-notes-developer-packet.txt', buildDeveloperPacket(notes));
    setStatus('Developer packet exported.');
  }

  function exportJson() {
    downloadText('panda-notes.json', JSON.stringify(notes, null, 2));
    setStatus('Notes JSON exported.');
  }

  async function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error('Expected an array of notes.');
      const next = parsed.map((item) => createPandaNote(item)).slice(0, 120);
      setNotes(next);
      saveNotes(next);
      setStatus(`Imported ${next.length} note${next.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setStatus(error.message || 'Could not import that notes file.');
    } finally {
      event.target.value = '';
    }
  }

  function resetSeed() {
    setNotes(seedNotes);
    saveNotes(seedNotes);
    setSelectedId('');
    setStatus('Demo notes restored.');
  }

  function clearNotes() {
    setNotes([]);
    saveNotes([]);
    setSelectedId('');
    setStatus('All local notes cleared.');
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <span className="panda-face">
              <span className="panda-ear panda-ear-left" />
              <span className="panda-ear panda-ear-right" />
              <span className="panda-eye panda-eye-left" />
              <span className="panda-eye panda-eye-right" />
              <span className="panda-nose" />
            </span>
          </div>
          <div>
            <strong>Panda Notes</strong>
            <span>Developer + tester repair loop</span>
          </div>
        </div>
        <nav aria-label="Audience focus">
          {pandaAudiences.map((audience) => (
            <button
              aria-pressed={selectedAudience === audience.key}
              className={selectedAudience === audience.key ? 'active' : ''}
              key={audience.key}
              onClick={() => setSelectedAudience(audience.key)}
            >
              {audience.key === 'developer' ? <Code2 size={18} /> : audience.key === 'alpha' ? <Sparkles size={18} /> : <Activity size={18} />}
              <span>{audience.label}</span>
            </button>
          ))}
        </nav>
        <div className="side-note">
          <ShieldCheck size={18} />
          <span>No hidden telemetry. Local notes leave only when exported or copied.</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="hero">
          <div>
            <h1>Panda Notes</h1>
            <p>{activeAudience.headline}</p>
            <span>{activeAudience.detail}</span>
          </div>
          <div className="hero-actions">
            <button className="primary" onClick={copyDeveloperPacket}><ClipboardCopy size={18} /> Copy dev packet</button>
            <button onClick={exportDeveloperPacket}><Download size={18} /> Export packet</button>
            <button onClick={exportJson}><FileJson size={18} /> Export JSON</button>
            <a className="button-link" href="./widget-demo.html"><ExternalLink size={18} /> Widget demo</a>
            <a className="button-link" href="./services.html"><Handshake size={18} /> Services</a>
            <label className="import-button">
              <FileJson size={18} /> Import JSON
              <input type="file" accept="application/json,.json" onChange={importJson} />
            </label>
          </div>
        </header>

        <section className="status-strip">
          <Metric label="Notes" value={summary.total} tone="green" />
          <Metric label="Top tag" value={summary.topTag} tone="amber" />
          <Metric label="Repair actions" value={repairQueue.actionCount} tone="green" />
          <Metric label="Visible issues" value={filteredActions.length} tone="amber" />
        </section>

        <p className="callout" aria-live="polite">{status}</p>

        <section className="grid two">
          <Panel title="Capture Tester Note" icon={Users}>
            <div className="form-grid">
              <label>
                <span>Audience</span>
                <select value={draft.audience} onChange={(event) => updateDraft('audience', event.target.value)}>
                  {pandaAudiences.map((audience) => <option value={audience.key} key={audience.key}>{audience.label}</option>)}
                </select>
              </label>
              <label>
                <span>Tag</span>
                <select value={draft.tag} onChange={(event) => updateDraft('tag', event.target.value)}>
                  {pandaNoteTags.map((tag) => <option value={tag} key={tag}>{tag}</option>)}
                </select>
              </label>
              <label>
                <span>Page or flow</span>
                <input value={draft.page} onChange={(event) => updateDraft('page', event.target.value)} />
              </label>
              <label>
                <span>Target label</span>
                <input value={draft.target.label} onChange={(event) => updateDraft('target.label', event.target.value)} />
              </label>
              <label>
                <span>Component or module</span>
                <input value={draft.target.component} onChange={(event) => updateDraft('target.component', event.target.value)} />
              </label>
              <label>
                <span>Viewport width</span>
                <input type="number" min="0" value={draft.viewport.width} onChange={(event) => updateDraft('viewport.width', event.target.value)} />
              </label>
              <label className="wide-field">
                <span>Tester note</span>
                <textarea
                  value={draft.note}
                  onChange={(event) => updateDraft('note', event.target.value)}
                  placeholder="What happened, what did you expect, and what should the developer inspect?"
                />
              </label>
            </div>
            <div className="button-row">
              <button className="primary" onClick={addNote}><Bug size={18} /> Add note</button>
              <button onClick={resetSeed}><RefreshCw size={18} /> Restore demo</button>
              <button className="danger-action" onClick={clearNotes}><Trash2 size={18} /> Clear local</button>
            </div>
          </Panel>

          <Panel title="Role Quick Start" icon={ListChecks}>
            <article className="guide-card">
              <strong>{activeGuide.label}</strong>
              <span>{activeGuide.summary}</span>
            </article>
            <ol className="guide-list">
              {activeGuide.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </Panel>
        </section>

        <section className="panel wide-panel">
          <div className="panel-title"><GitBranch size={18} /><span>Target Issues + Code Snippet Popout</span></div>
          <div className="issue-toolbar">
            <label className="search-field">
              <span>Search issues</span>
              <div className="input-with-icon">
                <Search size={16} />
                <input
                  value={issueFilters.query}
                  onChange={(event) => updateIssueFilter('query', event.target.value)}
                  placeholder="Target, page, note, or snippet"
                />
              </div>
            </label>
            <label>
              <span>Tag</span>
              <select value={issueFilters.tag} onChange={(event) => updateIssueFilter('tag', event.target.value)}>
                <option value="all">All tags</option>
                {pandaNoteTags.map((tag) => <option value={tag} key={tag}>{tag}</option>)}
              </select>
            </label>
            <label>
              <span>Evidence from</span>
              <select value={issueFilters.audience} onChange={(event) => updateIssueFilter('audience', event.target.value)}>
                <option value="all">All roles</option>
                {pandaAudiences.map((audience) => <option value={audience.key} key={audience.key}>{audience.label}</option>)}
              </select>
            </label>
            <div className="filter-action">
              <span aria-hidden="true">Filters</span>
              <button disabled={!hasIssueFilters} onClick={clearIssueFilters}><FilterX size={18} /> Clear filters</button>
            </div>
          </div>
          <div className="issue-workspace">
            <div className="issue-list">
              {!repairQueue.actions.length && (
                <article className="empty-state">
                  <strong>No repair queue yet</strong>
                  <span>Add a tester note and Panda Notes will turn it into a developer action.</span>
                </article>
              )}
              {!!repairQueue.actions.length && !filteredActions.length && (
                <article className="empty-state">
                  <strong>No matching issues</strong>
                  <span>Clear the filters or search for another page, tag, target, or tester note.</span>
                  <button onClick={clearIssueFilters}><FilterX size={18} /> Clear filters</button>
                </article>
              )}
              {filteredActions.map((action) => (
                <button
                  aria-label={`${action.title}. ${action.count} note${action.count === 1 ? '' : 's'}, priority ${action.priority}.`}
                  aria-pressed={selectedAction?.id === action.id}
                  className={selectedAction?.id === action.id ? 'issue-card selected' : 'issue-card'}
                  key={action.id}
                  onClick={() => setSelectedId(action.id)}
                >
                  <strong>{action.title}</strong>
                  <span>{action.page} / {action.count} note{action.count === 1 ? '' : 's'} / priority {action.priority}</span>
                  <small>{action.evidence[0]?.note}</small>
                </button>
              ))}
            </div>
            <div className="issue-detail">
              {selectedAction ? (
                <>
                  <strong>{selectedAction.title}</strong>
                  <p>{selectedAction.suggestedFix}</p>
                  <span>{selectedAction.testPlan}</span>
                  <div className="handoff-card">
                    <div>
                      <strong><Github size={17} /> GitHub draft</strong>
                      <span>{selectedIssueDraft.title}</span>
                      <small>Labels: {selectedIssueDraft.labels.join(', ')}</small>
                    </div>
                    <div className="handoff-actions">
                      <button onClick={copyGithubIssueDraft}><ClipboardList size={18} /> Copy issue</button>
                      <button onClick={exportGithubIssueDraft}><Download size={18} /> Export MD</button>
                    </div>
                  </div>
                  <div className="evidence-stack">
                    {selectedAction.evidence.map((item, index) => (
                      <article className="evidence-card" key={`${item.createdAt}-${index}`}>
                        <strong>{item.audience} note {index + 1}</strong>
                        <span>{item.note || 'No note text.'}</span>
                        <small>{item.target} / {item.viewport.width}x{item.viewport.height}</small>
                      </article>
                    ))}
                  </div>
                  <div className="snippet">
                    <strong>{selectedAction.snippet.file}</strong>
                    <span>{selectedAction.snippet.title}</span>
                    <pre>{selectedAction.snippet.code}</pre>
                  </div>
                </>
              ) : (
                <article className="empty-state">
                  <strong>Select a repair action</strong>
                  <span>The selected note will pop its target issue, evidence, and code snippet here.</span>
                </article>
              )}
            </div>
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="panel-title"><Code2 size={18} /><span>Developer Code Structure</span></div>
          <div className="code-map">
            {starterCodeStructure.map((entry) => (
              <article key={entry.path}>
                <strong>{entry.path}</strong>
                <span>{entry.role}</span>
                <em>{entry.audience}</em>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }) {
  return (
    <article className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="panel">
      <div className="panel-title"><Icon size={18} /><span>{title}</span></div>
      {children}
    </section>
  );
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
