import { describe, expect, it } from 'vitest';
import {
  buildDeveloperPacket,
  buildRepairQueue,
  createPandaNote,
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
});
