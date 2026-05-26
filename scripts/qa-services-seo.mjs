import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(new URL('../public', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const server = createServer(async (request, response) => {
  const cleanPath = decodeURIComponent((request.url || '/').split('?')[0]);
  const relativePath = cleanPath === '/' ? 'services.html' : cleanPath.replace(/^\//, '');
  const filePath = resolve(root, relativePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('forbidden');
    return;
  }

  try {
    const body = await readFile(filePath);
    const contentType = filePath.endsWith('.xml')
      ? 'application/xml'
      : filePath.endsWith('.txt')
        ? 'text/plain'
        : filePath.endsWith('.json')
          ? 'application/json'
          : 'text/html';
    response.writeHead(200, { 'content-type': contentType });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('missing');
  }
});

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));

const baseUrl = `http://127.0.0.1:${server.address().port}`;
const pageUrl = `${baseUrl}/services.html`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageIssues = [];

page.on('pageerror', (error) => pageIssues.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  const text = message.text();
  const isLocalAnalyticsWarning = text.includes('Ignoring Event: localhost');
  if (['error', 'warning'].includes(message.type()) && !text.includes('plausible') && !isLocalAnalyticsWarning) {
    pageIssues.push(`${message.type()}: ${text}`);
  }
});

try {
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  const title = await page.title();
  const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
  const metaDescription = await page.locator('meta[name=description]').getAttribute('content');
  const schemaText = await page.locator('script[type="application/ld+json"]').textContent();
  const schema = JSON.parse(schemaText || '{}');
  const serviceOffers = schema?.makesOffer?.itemListElement || [];

  await page.evaluate(() => {
    window.__pandaEvents = [];
    window.addEventListener('panda-service-event', (event) => {
      window.__pandaEvents.push(event.detail);
    });
  });
  await page.locator('[data-analytics-event="Hero Setup Sprint CTA"]').evaluate((element) => {
    element.addEventListener('click', (event) => event.preventDefault(), { once: true });
    element.click();
  });
  const analyticsEvents = await page.evaluate(() => window.__pandaEvents || []);

  const sitemapResponse = await page.goto(`${baseUrl}/sitemap.xml`);
  const sitemap = await sitemapResponse.text();

  const result = {
    pageUrl,
    title,
    canonical,
    descriptionLength: metaDescription?.length || 0,
    schemaType: schema['@type'],
    offerCount: serviceOffers.length,
    analyticsEventCount: analyticsEvents.length,
    firstAnalyticsEvent: analyticsEvents[0],
    sitemapHasServices: sitemap.includes('/services.html'),
    pageIssues
  };

  console.log(JSON.stringify(result, null, 2));

  const failures = [
    title !== 'Panda Notes Services | Bug Triage, Setup, and Developer Handoff' && 'unexpected page title',
    canonical !== 'https://p4nd4907.github.io/panda-notes/services.html' && 'canonical URL missing or wrong',
    !metaDescription?.includes('developer-ready handoff packs') && 'meta description missing service promise',
    schema['@type'] !== 'Organization' && 'Organization schema missing',
    serviceOffers.length !== 3 && 'OfferCatalog should include three offers',
    analyticsEvents.length < 1 && 'analytics CTA event did not dispatch',
    !sitemap.includes('https://p4nd4907.github.io/panda-notes/services.html') && 'sitemap missing services URL',
    pageIssues.length > 0 && 'page emitted console or runtime errors'
  ].filter(Boolean);

  if (failures.length) {
    throw new Error(`Services SEO QA failed: ${failures.join('; ')}`);
  }
} finally {
  await browser.close();
  server.close();
}
