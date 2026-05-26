import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const demoUrl = pathToFileURL(resolve(root, 'public/widget-demo.html')).href;
const artifactDir = await mkdtemp(join(tmpdir(), 'panda-widget-qa-'));
const screenshotPath = join(artifactDir, 'right-click-widget.png');
const storageKey = 'panda-notes-widget:panda-notes-demo';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];

page.on('pageerror', (error) => pageErrors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) {
    pageErrors.push(`${message.type()}: ${message.text()}`);
  }
});

try {
  await page.goto(demoUrl, { waitUntil: 'load' });
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);

  const placeOrder = page.getByRole('button', { name: 'Place order' });
  const buttonBox = await placeOrder.boundingBox();
  if (!buttonBox) throw new Error('Place order button bounding box missing.');

  const clickX = Math.round(buttonBox.x + buttonBox.width / 2);
  const clickY = Math.round(buttonBox.y + buttonBox.height / 2);

  await page.mouse.click(clickX, clickY, { button: 'right' });
  await page.waitForSelector('.panda-notes-widget.is-open', { timeout: 5000 });

  const targetValue = await page.locator('input[name="targetLabel"]').inputValue();
  const componentValue = await page.locator('input[name="component"]').inputValue();
  const popupBox = await page.locator('.panda-notes-widget').boundingBox();

  await page.locator('textarea[name="note"]').fill('Automated QA note: place order did not respond at the clicked point.');
  await page.getByRole('button', { name: 'Save note' }).click();
  await page.waitForFunction((key) => {
    const notes = JSON.parse(localStorage.getItem(key) || '[]');
    return notes.length > 0;
  }, storageKey, { timeout: 5000 });

  const notes = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), storageKey);
  const saved = notes[0];
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const result = {
    demoUrl,
    popupOpened: Boolean(popupBox),
    popupOpenedNearClick: popupBox
      ? popupBox.x >= clickX && popupBox.x - clickX <= 24 && popupBox.y <= clickY && clickY <= popupBox.y + popupBox.height
      : false,
    popupBox,
    targetValue,
    componentValue,
    clickX,
    clickY,
    noteCount: notes.length,
    savedTarget: saved?.target,
    savedViewport: saved?.viewport,
    exactPointSaved: saved?.viewport?.x === clickX && saved?.viewport?.y === clickY,
    percentPointSaved: Number.isFinite(saved?.viewport?.xPercent) && Number.isFinite(saved?.viewport?.yPercent),
    pageErrors,
    screenshotPath
  };

  const failures = [
    !result.popupOpened && 'popup did not open',
    !result.popupOpenedNearClick && 'popup did not open near the right-click point',
    result.targetValue !== 'Checkout submit' && 'target label was not captured',
    result.componentValue !== 'CheckoutSubmitButton' && 'component was not captured',
    result.noteCount < 1 && 'note was not saved',
    saved?.target?.path !== 'button.primary' && 'target CSS path was not captured',
    !result.exactPointSaved && 'exact click x/y was not saved',
    !result.percentPointSaved && 'percent click location was not saved',
    result.pageErrors.length > 0 && 'page emitted console or runtime errors'
  ].filter(Boolean);

  console.log(JSON.stringify(result, null, 2));

  if (failures.length) {
    throw new Error(`Widget QA failed: ${failures.join('; ')}`);
  }
} finally {
  await browser.close();
}
