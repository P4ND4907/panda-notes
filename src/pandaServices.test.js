import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);

function readProjectFile(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

describe('Panda Notes services conversion path', () => {
  const servicesHtml = readProjectFile('public/services.html');

  it('links every paid intake form from the public services page', () => {
    expect(servicesHtml).toContain('/issues/new?template=setup-sprint.yml');
    expect(servicesHtml).toContain('/issues/new?template=developer-handoff-pack.yml');
    expect(servicesHtml).toContain('/issues/new?template=private-integration.yml');
  });

  it('keeps the free product and privacy boundary visible', () => {
    expect(servicesHtml).toContain('The Free Product Stays Useful');
    expect(servicesHtml).toContain('MIT licensed');
    expect(servicesHtml).toContain('No hidden telemetry');
    expect(servicesHtml).toContain('do not post credentials');
  });

  it('configures GitHub issue forms for paid service leads', () => {
    const setupForm = readProjectFile('.github/ISSUE_TEMPLATE/setup-sprint.yml');
    const handoffForm = readProjectFile('.github/ISSUE_TEMPLATE/developer-handoff-pack.yml');
    const privateForm = readProjectFile('.github/ISSUE_TEMPLATE/private-integration.yml');
    const config = readProjectFile('.github/ISSUE_TEMPLATE/config.yml');

    expect(setupForm).toContain('labels: ["paid-service", "setup-sprint"]');
    expect(handoffForm).toContain('labels: ["paid-service", "developer-handoff"]');
    expect(privateForm).toContain('labels: ["paid-service", "private-integration"]');
    expect(config).toContain('Panda Notes paid services');
  });
});
