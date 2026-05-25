import { describe, expect, it } from 'vitest';
import {
  buildDeveloperPacket,
  buildGithubIssueDraft,
  buildRepairQueue,
  createPandaNote,
  filterRepairActions,
  getAudienceGuide,
  pandaNoteTags,
  starterCodeStructure,
  starterSnippets
} from './pandaNotes.js';

describe('panda notes standalone engine', () => {
  it('creates redacted notes for alpha, beta, and developer workflows', () => {
    const note = createPandaNote({
      audience: 'alpha',
      page: 'Checkout Flow',
      tag: 'broken',
      note: 'Click failed for C:\\Users\\tester\\secret.txt and tester@example.com 555-123-4567',
      target: { label: 'Submit report', component: 'ReportActions' },
      viewport: { width: 390, height: 844, xPercent: 80, yPercent: 66 },
      now: new Date('2026-05-24T20:00:00.000Z')
    });

    expect(note.schema).toBe('panda-note.v1');
    expect(note.audience).toBe('alpha');
    expect(note.tag).toBe('broken');
    expect(note.note).toContain('[redacted-path]');
    expect(note.note).toContain('[redacted-email]');
    expect(note.note).toContain('[redacted-phone]');
    expect(JSON.stringify(note)).not.toContain('tester@example.com');
  });

  it('turns repeated tester notes into developer repair actions with snippets', () => {
    const notes = [
      createPandaNote({
        audience: 'beta',
        page: 'Panda Notes',
        tag: 'layout issue',
        note: 'The selected issue panel is cramped on mobile.',
        target: { label: 'Selected issue', component: 'IssueDetail' },
        viewport: { width: 390, height: 844 }
      }),
      createPandaNote({
        audience: 'developer',
        page: 'Panda Notes',
        tag: 'broken',
        note: 'Copy developer packet button did nothing.',
        target: { label: 'Copy dev packet', component: 'PacketActions' },
        viewport: { width: 1440, height: 900 }
      })
    ];

    const queue = buildRepairQueue(notes, { now: new Date('2026-05-24T20:10:00.000Z') });

    expect(queue.schema).toBe('panda-repair-queue.v1');
    expect(queue.actionCount).toBe(2);
    expect(queue.topAction.tag).toBe('broken');
    expect(queue.topAction.snippet.file).toBe('src/App.jsx');
    expect(queue.actions[1].snippet.file).toBe('src/styles.css');
  });

  it('builds a developer packet with code map and tester boundaries', () => {
    const note = createPandaNote({
      audience: 'alpha',
      tag: 'missing feedback',
      note: 'Import looked idle.',
      target: { label: 'Import notes', component: 'ImportPanel' }
    });
    const packet = buildDeveloperPacket([note], { now: new Date('2026-05-24T20:15:00.000Z') });

    expect(packet).toContain('Panda Notes developer packet');
    expect(packet).toContain('Audience focus: developers, alpha testers, beta testers');
    expect(packet).toContain('Target code: src/pandaNotes.js');
    expect(packet).toContain('No hidden telemetry');
    expect(starterCodeStructure.length).toBeGreaterThanOrEqual(6);
    expect(starterSnippets.broken.code).toContain('copyDeveloperPacket');
    expect(pandaNoteTags).toContain('missing feedback');
  });

  it('filters repair actions by search text, tag, and evidence audience', () => {
    const notes = [
      createPandaNote({
        audience: 'beta',
        page: 'Invite Flow',
        tag: 'broken',
        note: 'The invite modal closes before the share link is copied.',
        target: { label: 'Share link', component: 'InviteModal' }
      }),
      createPandaNote({
        audience: 'alpha',
        page: 'Settings',
        tag: 'text issue',
        note: 'The button label does not explain what will change.',
        target: { label: 'Privacy save', component: 'SettingsPanel' }
      }),
      createPandaNote({
        audience: 'developer',
        page: 'Settings',
        tag: 'layout issue',
        note: 'The settings grid overflows at 390px.',
        target: { label: 'Settings grid', component: 'SettingsPanel' }
      })
    ];
    const queue = buildRepairQueue(notes);

    expect(filterRepairActions(queue.actions, { query: 'invite' })).toHaveLength(1);
    expect(filterRepairActions(queue.actions, { tag: 'text issue' })[0].target).toBe('SettingsPanel');
    expect(filterRepairActions(queue.actions, { audience: 'beta' })[0].page).toBe('Invite Flow');
    expect(filterRepairActions(queue.actions, { query: 'settings', tag: 'layout issue', audience: 'developer' })).toHaveLength(1);
    expect(filterRepairActions(queue.actions, { query: 'settings', audience: 'beta' })).toHaveLength(0);
  });

  it('builds audience guides with concrete next actions', () => {
    const developerGuide = getAudienceGuide('developer');
    const alphaGuide = getAudienceGuide('alpha');
    const fallbackGuide = getAudienceGuide('unknown-role');

    expect(developerGuide.label).toBe('Developer handoff');
    expect(developerGuide.steps).toContain('Open the top repair action and read the newest evidence first.');
    expect(alphaGuide.steps[0]).toContain('first-run');
    expect(fallbackGuide.key).toBe('alpha');
  });

  it('builds a GitHub-ready issue draft from a selected repair action', () => {
    const note = createPandaNote({
      audience: 'beta',
      page: 'Developer Packet',
      tag: 'missing feedback',
      note: 'Copying the packet needs a clearer success message.',
      target: { label: 'Copy developer packet', component: 'PacketActions' },
      viewport: { width: 1440, height: 900 },
      now: new Date('2026-05-24T20:20:00.000Z')
    });
    const action = buildRepairQueue([note]).actions[0];
    const issueDraft = buildGithubIssueDraft(action);

    expect(issueDraft.title).toBe('[Panda Notes] Add missing feedback: PacketActions');
    expect(issueDraft.body).toContain('## Tester evidence');
    expect(issueDraft.body).toContain('- beta: Copying the packet needs a clearer success message.');
    expect(issueDraft.body).toContain('```js');
    expect(issueDraft.body).toContain('src/pandaNotes.js');
    expect(issueDraft.body).toContain('No hidden telemetry');
  });
});
