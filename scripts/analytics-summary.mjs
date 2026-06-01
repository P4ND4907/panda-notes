import { spawnSync } from 'node:child_process';

const repo = process.env.PRIVATE_INTAKE_REPO || 'P4ND4907/panda-notes-private-intake';
const dayCount = Number(process.argv[2] || 14);
const since = new Date(Date.now() - dayCount * 24 * 60 * 60 * 1000);

const issues = ghJson(['api', `repos/${repo}/issues?state=all&labels=analytics&per_page=100`]);
const events = [];

for (const issue of issues) {
  const comments = ghJson(['api', `repos/${repo}/issues/${issue.number}/comments?per_page=100`]);
  for (const comment of comments) {
    const event = parseEventComment(comment.body || '');
    if (event && new Date(event.timestamp) >= since) {
      events.push(event);
    }
  }
}

const uniqueSessions = new Set(events.map((event) => event.sessionId).filter(Boolean));
const byEvent = countBy(events, (event) => event.eventName);
const byPage = countBy(events, (event) => event.page);
const byOffer = countBy(events, (event) => event.props?.offer).filter((row) => row.name);

console.log(`Panda Notes analytics summary (${dayCount} days)`);
console.log(`Repo: ${repo}`);
console.log(`Events: ${events.length}`);
console.log(`Unique anonymous sessions: ${uniqueSessions.size}`);
printRows('Events by name', byEvent);
printRows('Events by page', byPage);
printRows('Events by offer', byOffer);

function ghJson(args) {
  const result = spawnSync('gh', args, {
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'gh api failed').trim());
  }

  return JSON.parse(result.stdout || '[]');
}

function parseEventComment(body) {
  if (!body.includes('panda-analytics-event')) return null;
  const match = body.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function countBy(items, selectName) {
  const counts = new Map();
  for (const item of items) {
    const name = selectName(item) || '';
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

function printRows(title, rows) {
  console.log(`\n${title}`);
  if (!rows.length) {
    console.log('- none yet');
    return;
  }
  for (const row of rows) {
    console.log(`- ${row.name || '(unknown)'}: ${row.count}`);
  }
}
