import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
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
const screenshotPath = resolve(tmpdir(), 'panda-notes-services-accessibility.png');
const skipScreenshotPath = resolve(tmpdir(), 'panda-notes-services-skip-link.png');
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

  const bodyText = await page.locator('body').innerText();
  const title = await page.title();
  const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
  const metaDescription = await page.locator('meta[name=description]').getAttribute('content');
  const schemaText = await page.locator('script[type="application/ld+json"]').textContent();
  const schema = JSON.parse(schemaText || '{}');
  const serviceOffers = schema?.makesOffer?.itemListElement || [];

  await page.keyboard.press('Tab');
  const skipFocus = await page.evaluate(() => {
    const active = document.activeElement;
    const rect = active?.getBoundingClientRect();
    const style = active ? getComputedStyle(active) : null;
    return {
      text: active?.textContent?.trim() || '',
      className: active?.className || '',
      outlineStyle: style?.outlineStyle || '',
      outlineWidth: style?.outlineWidth || '',
      outlineOffset: style?.outlineOffset || '',
      rect: rect ? {
        height: Math.round(rect.height),
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width)
      } : null
    };
  });
  await page.screenshot({ path: skipScreenshotPath, fullPage: false });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement?.id === 'main-content' && window.location.hash === '#main-content');
  const skipTarget = await page.evaluate(() => ({
    activeId: document.activeElement?.id || '',
    hash: window.location.hash
  }));

  const primaryCta = page.locator('[data-analytics-event="cta_primary_click"]');
  await primaryCta.focus();
  const primaryCtaFocus = await primaryCta.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset
    };
  });
  const targetSizeIssues = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href], button, input'))
      .filter((element) => !element.disabled && element.getAttribute('aria-hidden') !== 'true')
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label: element.textContent?.trim() || element.getAttribute('aria-label') || element.id || element.tagName.toLowerCase(),
          height: Math.round(rect.height),
          width: Math.round(rect.width)
        };
      })
      .filter((target) => target.width < 24 || target.height < 24);
  });
  const contrastChecks = await page.evaluate(() => {
    function parseHex(value) {
      const clean = value.trim().replace('#', '');
      const numeric = Number.parseInt(clean, 16);
      return {
        r: (numeric >> 16) & 255,
        g: (numeric >> 8) & 255,
        b: numeric & 255
      };
    }

    function channel(value) {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    }

    function luminance(color) {
      return (0.2126 * channel(color.r)) + (0.7152 * channel(color.g)) + (0.0722 * channel(color.b));
    }

    function contrastRatio(foreground, background) {
      const foregroundLum = luminance(parseHex(foreground));
      const backgroundLum = luminance(parseHex(background));
      const lighter = Math.max(foregroundLum, backgroundLum);
      const darker = Math.min(foregroundLum, backgroundLum);
      return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
    }

    const checks = [
      { background: '#fbf6e8', foreground: '#32443a', minimum: 4.5, name: 'utility text on warm paper' },
      { background: '#193429', foreground: '#c4d9c7', minimum: 4.5, name: 'brand helper text on header' },
      { background: '#ffffff', foreground: '#18221d', minimum: 4.5, name: 'skip link text on white' },
      { background: '#ffffff', foreground: '#235940', minimum: 3, name: 'focus ring on white' }
    ];

    return checks.map((check) => ({
      ...check,
      ratio: contrastRatio(check.foreground, check.background)
    }));
  });
  await page.screenshot({ path: screenshotPath, fullPage: false });

  await page.evaluate(() => {
    window.__pandaEvents = [];
    window.addEventListener('panda-service-event', (event) => {
      window.__pandaEvents.push(event.detail);
    });
  });
  await page.locator('[data-analytics-event="cta_primary_click"]').evaluate((element) => {
    element.addEventListener('click', (event) => event.preventDefault(), { once: true });
    element.click();
  });

  await page.locator('[data-analytics-event="plan_card_click_setup"]').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const element = document.querySelector('[data-analytics-event="plan_card_click_setup"]');
    return element?.dataset.checkoutState === 'stripe';
  });
  await page.locator('[data-analytics-event="plan_card_click_setup"]').evaluate((element) => {
    element.addEventListener('click', (event) => event.preventDefault(), { once: true });
    element.click();
  });

  await page.locator('[data-analytics-view-event="comparison_section_view"]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    return (window.__pandaEvents || []).some((event) => event.eventName === 'comparison_section_view');
  });

  await page.getByRole('button', { name: 'Comparison' }).click();
  const analyticsEvents = await page.evaluate(() => window.__pandaEvents || []);

  const sitemapResponse = await page.goto(`${baseUrl}/sitemap.xml`);
  const sitemap = await sitemapResponse.text();

  const result = {
    pageUrl,
    title,
    canonical,
    bodyHasMeaningfulContent: bodyText.includes('Turn messy tester feedback into developer-ready work'),
    descriptionLength: metaDescription?.length || 0,
    schemaType: schema['@type'],
    offerCount: serviceOffers.length,
    skipFocus,
    skipTarget,
    primaryCtaFocus,
    targetSizeIssueCount: targetSizeIssues.length,
    targetSizeIssues,
    contrastChecks,
    analyticsEventCount: analyticsEvents.length,
    analyticsEvents: analyticsEvents.map((event) => event.eventName),
    firstAnalyticsEvent: analyticsEvents[0],
    sitemapHasServices: sitemap.includes('/services.html'),
    screenshotPath,
    skipScreenshotPath,
    pageIssues
  };

  console.log(JSON.stringify(result, null, 2));

  const failures = [
    !bodyText.includes('Turn messy tester feedback into developer-ready work') && 'page did not render meaningful service content',
    title !== 'Panda Notes Services | Bug Triage, Setup, and Developer Handoff' && 'unexpected page title',
    canonical !== 'https://p4nd4907.github.io/panda-notes/services.html' && 'canonical URL missing or wrong',
    !metaDescription?.includes('developer-ready handoff packs') && 'meta description missing service promise',
    schema['@type'] !== 'Organization' && 'Organization schema missing',
    serviceOffers.length !== 3 && 'OfferCatalog should include three offers',
    skipFocus.text !== 'Skip to main content' && 'first keyboard focus should reveal the skip link',
    (!skipFocus.rect || skipFocus.rect.top < 0 || skipFocus.rect.width < 24 || skipFocus.rect.height < 24) && 'skip link should be visible and target-sized when focused',
    skipTarget.activeId !== 'main-content' && 'skip link should move focus to main content',
    skipTarget.hash !== '#main-content' && 'skip link should update the main content hash',
    primaryCtaFocus.outlineStyle !== 'solid' && 'primary CTA focus outline should be solid',
    Number.parseFloat(primaryCtaFocus.outlineWidth) < 3 && 'primary CTA focus outline should be at least 3px',
    primaryCtaFocus.outlineOffset !== '3px' && 'primary CTA focus outline offset should be 3px',
    targetSizeIssues.length > 0 && `interactive targets below 24px: ${targetSizeIssues.map((target) => `${target.label} ${target.width}x${target.height}`).join(', ')}`,
    contrastChecks.some((check) => check.ratio < check.minimum) && `contrast check failed: ${contrastChecks.filter((check) => check.ratio < check.minimum).map((check) => `${check.name} ${check.ratio}:1`).join(', ')}`,
    !analyticsEvents.some((event) => event.eventName === 'cta_primary_click') && 'primary CTA event did not dispatch',
    !analyticsEvents.some((event) => event.eventName === 'github_issue_start') && 'GitHub issue event did not dispatch',
    !analyticsEvents.some((event) => event.eventName === 'plan_card_click_setup') && 'setup plan event did not dispatch',
    !analyticsEvents.some((event) => event.eventName === 'deposit_click') && 'Stripe deposit event did not dispatch',
    !analyticsEvents.some((event) => event.eventName === 'comparison_section_view') && 'comparison view event did not dispatch',
    !analyticsEvents.some((event) => event.eventName === 'faq_expand_comparison') && 'FAQ comparison event did not dispatch',
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
