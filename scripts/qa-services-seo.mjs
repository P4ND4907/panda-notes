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
const mobileScreenshotPath = resolve(tmpdir(), 'panda-notes-services-mobile.png');
const privateIntakeScreenshotPath = resolve(tmpdir(), 'panda-notes-private-intake.png');
const installScreenshotPath = resolve(tmpdir(), 'panda-notes-install.png');
const launchScreenshotPath = resolve(tmpdir(), 'panda-notes-launch-kit.png');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageIssues = [];
const mobileIssues = [];
const privateIntakeIssues = [];
const installIssues = [];
const launchIssues = [];

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
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  mobilePage.on('pageerror', (error) => mobileIssues.push(`pageerror: ${error.message}`));
  mobilePage.on('console', (message) => {
    const text = message.text();
    const isLocalAnalyticsWarning = text.includes('Ignoring Event: localhost');
    if (['error', 'warning'].includes(message.type()) && !text.includes('plausible') && !isLocalAnalyticsWarning) {
      mobileIssues.push(`${message.type()}: ${text}`);
    }
  });
  await mobilePage.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  const mobileState = await mobilePage.evaluate(() => ({
    hasHeroCopy: document.body.innerText.includes('Turn messy tester feedback into developer-ready work'),
    hasPublicPrivateLabels: document.body.innerText.includes('Public-safe request')
      && document.body.innerText.includes('Private handoff'),
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    viewportWidth: document.documentElement.clientWidth
  }));
  await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: false });
  await mobilePage.close();

  const privatePage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  privatePage.on('pageerror', (error) => privateIntakeIssues.push(`pageerror: ${error.message}`));
  privatePage.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      privateIntakeIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  await privatePage.goto(`${baseUrl}/private-intake.html`, { waitUntil: 'domcontentloaded' });
  await privatePage.getByRole('button', { name: 'Submit private intake' }).waitFor({ state: 'visible' });
  await privatePage.selectOption('select[name="service"]', 'Developer Handoff Pack');
  await privatePage.fill('input[name="customerName"]', 'QA Customer');
  await privatePage.fill('input[name="replyEmail"]', 'qa@example.com');
  await privatePage.fill('input[name="paymentReference"]', 'stripe-test-ref');
  await privatePage.fill('input[name="projectUrl"]', 'https://example.com/app');
  await privatePage.fill('input[name="deadline"]', 'Next Friday');
  await privatePage.fill('textarea[name="scope"]', 'Clean up 12 beta notes into a ranked repair queue.');
  await privatePage.fill('textarea[name="privateMaterials"]', 'Panda Notes JSON and screenshots after scope confirmation.');
  await privatePage.fill('textarea[name="outputTarget"]', 'GitHub issues and Codex repair prompt.');
  await privatePage.check('input[name="privacyConfirm"]');
  const privatePacketText = await privatePage.locator('[data-intake-output]').innerText();
  const download = await Promise.all([
    privatePage.waitForEvent('download'),
    privatePage.getByRole('button', { name: 'Download JSON' }).click()
  ]);
  await download[0].cancel();
  const intakeEmail = await privatePage.locator('#main-content').getAttribute('data-intake-email');
  const intakeEndpoint = await privatePage.locator('#main-content').getAttribute('data-intake-endpoint');
  await privatePage.getByRole('button', { name: 'Clear local draft' }).click();
  const clearStatus = await privatePage.locator('[data-intake-status]').innerText();
  const privateIntakeState = {
    title: await privatePage.title(),
    packetHasScope: privatePacketText.includes('Clean up 12 beta notes'),
    packetHasPrivacyConfirmation: privatePacketText.includes('Privacy confirmation: Confirmed'),
    intakeEmail,
    intakeEndpoint,
    clearStatus,
    horizontalOverflow: await privatePage.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth))
  };
  await privatePage.screenshot({ path: privateIntakeScreenshotPath, fullPage: false });
  await privatePage.close();

  const installPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  installPage.on('pageerror', (error) => installIssues.push(`pageerror: ${error.message}`));
  installPage.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      installIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  await installPage.goto(`${baseUrl}/install.html`, { waitUntil: 'domcontentloaded' });
  await installPage.getByRole('button', { name: 'Copy install snippet' }).click();
  await installPage.waitForFunction(() => /Install snippet copied|Copy was blocked/.test(document.querySelector('[data-install-status]')?.textContent || ''));
  const installState = await installPage.evaluate(() => {
    const snippet = document.querySelector('[data-install-snippet]')?.textContent || '';
    return {
      title: document.title,
      snippetHasInit: snippet.includes('PandaNotes.init'),
      snippetHasWidget: snippet.includes('panda-notes-widget.js'),
      snippetHasLauncher: snippet.includes('"launcher": true'),
      statusUpdated: /Install snippet copied|Copy was blocked/.test(document.querySelector('[data-install-status]')?.textContent || ''),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  });
  await installPage.screenshot({ path: installScreenshotPath, fullPage: false });
  await installPage.close();

  const launchPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  launchPage.on('pageerror', (error) => launchIssues.push(`pageerror: ${error.message}`));
  launchPage.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      launchIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  await launchPage.goto(`${baseUrl}/launch.html`, { waitUntil: 'domcontentloaded' });
  await launchPage.waitForLoadState('networkidle');
  await launchPage.evaluate(() => {
    window.__pandaLaunchEvents = [];
    window.addEventListener('panda-launch-event', (event) => {
      window.__pandaLaunchEvents.push(event.detail);
    });
  });
  await launchPage.getByRole('button', { name: 'Copy short post' }).click();
  await launchPage.waitForFunction(() => /Copied short launch copy|Copy was blocked/.test(document.querySelector('[data-copy-status]')?.textContent || ''));
  const launchState = await launchPage.evaluate(() => {
    const image = document.querySelector('img[src="./assets/panda-notes-console-preview.png"]');
    return {
      title: document.title,
      hasHeroCopy: document.body.innerText.includes('Turn messy tester feedback into developer-ready repair work'),
      hasCopyStatus: /Copied short launch copy|Copy was blocked/.test(document.querySelector('[data-copy-status]')?.textContent || ''),
      imageLoaded: Boolean(image && image.naturalWidth > 100 && image.naturalHeight > 100),
      launchEvents: window.__pandaLaunchEvents?.map((event) => event.eventName) || [],
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  });
  await launchPage.screenshot({ path: launchScreenshotPath, fullPage: false });
  await launchPage.close();

  const bodyText = await page.locator('body').innerText();
  const title = await page.title();
  const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
  const metaDescription = await page.locator('meta[name=description]').getAttribute('content');
  const schemaText = await page.locator('script[type="application/ld+json"]').textContent();
  const schema = JSON.parse(schemaText || '{}');
  const serviceOffers = schema?.makesOffer?.itemListElement || [];
  const performanceFlags = await page.evaluate(() => ({
    bodyOverlayPosition: getComputedStyle(document.body, '::before').position,
    hasStripePreconnect: Boolean(document.querySelector('link[rel="preconnect"][href="https://buy.stripe.com"]')),
    lazySectionCount: document.querySelectorAll('.section-lazy').length,
    publicPrivateLabelsVisible: document.body.innerText.includes('Public-safe request')
      && document.body.innerText.includes('Private handoff')
  }));

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
  await page.locator('[data-analytics-event="private_request_start"]').evaluate((element) => {
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
    performanceFlags,
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
    sitemapHasPrivateIntake: sitemap.includes('/private-intake.html'),
    screenshotPath,
    skipScreenshotPath,
    mobileScreenshotPath,
    privateIntakeScreenshotPath,
    installScreenshotPath,
    launchScreenshotPath,
    mobileState,
    mobileIssues,
    privateIntakeState,
    privateIntakeIssues,
    installState,
    installIssues,
    launchState,
    launchIssues,
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
    !performanceFlags.hasStripePreconnect && 'Stripe preconnect missing',
    performanceFlags.lazySectionCount < 4 && 'expected lazy below-fold sections',
    performanceFlags.bodyOverlayPosition === 'fixed' && 'decorative body overlay should not be fixed',
    !performanceFlags.publicPrivateLabelsVisible && 'public/private intake labels should be visible',
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
    !analyticsEvents.some((event) => event.eventName === 'private_request_start') && 'private intake event did not dispatch',
    !analyticsEvents.some((event) => event.eventName === 'github_issue_start') && 'GitHub issue event did not dispatch',
    !analyticsEvents.some((event) => event.eventName === 'plan_card_click_setup') && 'setup plan event did not dispatch',
    !analyticsEvents.some((event) => event.eventName === 'deposit_click') && 'Stripe deposit event did not dispatch',
    !analyticsEvents.some((event) => event.eventName === 'comparison_section_view') && 'comparison view event did not dispatch',
    !analyticsEvents.some((event) => event.eventName === 'faq_expand_comparison') && 'FAQ comparison event did not dispatch',
    !sitemap.includes('https://p4nd4907.github.io/panda-notes/services.html') && 'sitemap missing services URL',
    !sitemap.includes('https://p4nd4907.github.io/panda-notes/private-intake.html') && 'sitemap missing private intake URL',
    !mobileState.hasHeroCopy && 'mobile page should render hero copy',
    !mobileState.hasPublicPrivateLabels && 'mobile page should render public/private intake labels',
    mobileState.horizontalOverflow > 1 && `mobile page has horizontal overflow: ${mobileState.horizontalOverflow}px`,
    mobileIssues.length > 0 && 'mobile page emitted console or runtime errors',
    privateIntakeState.title !== 'Panda Notes Private Intake | Secure Project Scope Packet' && 'private intake title mismatch',
    !privateIntakeState.packetHasScope && 'private intake packet did not include scope',
    !privateIntakeState.packetHasPrivacyConfirmation && 'private intake packet did not include privacy confirmation',
    privateIntakeState.intakeEmail !== 'khepri26@gmail.com' && 'private intake email draft recipient is not configured',
    privateIntakeState.intakeEndpoint !== 'https://panda-notes-smoky.vercel.app/api/private-intake' && 'private intake submission endpoint is not configured',
    !privateIntakeState.clearStatus.includes('draft cleared') && 'private intake clear draft did not update status',
    privateIntakeState.horizontalOverflow > 1 && `private intake has horizontal overflow: ${privateIntakeState.horizontalOverflow}px`,
    privateIntakeIssues.length > 0 && 'private intake page emitted console or runtime errors',
    installState.title !== 'Panda Notes Install | Right-Click Feedback Widget' && 'install page title mismatch',
    !installState.snippetHasInit && 'install page snippet missing PandaNotes.init',
    !installState.snippetHasWidget && 'install page snippet missing widget script',
    !installState.snippetHasLauncher && 'install page snippet missing launcher option',
    !installState.statusUpdated && 'install copy button did not update status',
    installState.horizontalOverflow > 1 && `install page has horizontal overflow: ${installState.horizontalOverflow}px`,
    installIssues.length > 0 && 'install page emitted console or runtime errors',
    launchState.title !== 'Panda Notes Launch Kit | Share the Beta Feedback Workflow' && 'launch page title mismatch',
    !launchState.hasHeroCopy && 'launch page should render hero copy',
    !launchState.hasCopyStatus && 'launch copy button did not update status',
    !launchState.imageLoaded && 'launch page preview image did not load',
    !launchState.launchEvents.includes('launch_copy_post') && 'launch copy event did not dispatch',
    launchState.horizontalOverflow > 1 && `launch page has horizontal overflow: ${launchState.horizontalOverflow}px`,
    launchIssues.length > 0 && 'launch page emitted console or runtime errors',
    pageIssues.length > 0 && 'page emitted console or runtime errors'
  ].filter(Boolean);

  if (failures.length) {
    throw new Error(`Services SEO QA failed: ${failures.join('; ')}`);
  }
} finally {
  await browser.close();
  server.close();
}
