import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', e => errors.push(e.message));

// 1. Load
await page.goto('http://localhost:5179/', { waitUntil: 'networkidle' });
await page.screenshot({ path: './verify_01_initial.png' });
const bodyText = await page.textContent('body');
console.log('[1] Page loaded. Has "TimingChallenge":', bodyText.includes('TimingChallenge'));

const allBtns = await page.locator('button').allTextContents();
console.log('[1] Buttons found:', JSON.stringify(allBtns));

// 2. Open overlay
await page.getByText('LANZAR VIBRA').click();
await page.waitForTimeout(400);
await page.screenshot({ path: './verify_02_overlay.png' });
const confrontarOk = await page.getByText('CONFRONTAR', { exact: true }).isVisible();
const empezarOk    = await page.getByText('EMPEZAR', { exact: true }).isVisible();
const barSegments  = await page.evaluate(() => {
  const bar = document.querySelector('[style*="overflow: hidden"]');
  if (!bar) return 0;
  return bar.querySelectorAll('[style*="position: absolute"]').length;
});
console.log('[2] Overlay: CONFRONTAR=', confrontarOk, '| EMPEZAR=', empezarOk, '| bar segments=', barSegments);

// 3. Start timer
await page.getByText('EMPEZAR').click();
await page.waitForTimeout(200);
await page.screenshot({ path: './verify_03_running.png' });
const pararOk = await page.getByText('PARAR').isVisible();
console.log('[3] PARAR button visible:', pararOk);

const getTimer = () => page.evaluate(() => {
  for (const d of document.querySelectorAll('div')) {
    if (/^\d+\.\d{2}$/.test(d.textContent.trim())) return d.textContent.trim();
  }
  return null;
});
const t1 = await getTimer();
await page.waitForTimeout(700);
const t2 = await getTimer();
const advancing = t1 !== null && t2 !== null && t1 !== t2;
console.log('[3] Timer advancing:', t1, '->', t2, '|', advancing ? 'PASS' : 'FAIL');

// 4. Stop timer
await page.getByText('PARAR').click();
await page.waitForTimeout(500);
await page.screenshot({ path: './verify_04_result.png' });
const resultLabels = ['FLOW', 'VIBRA', 'FALLO', 'PIFIA', 'TIMEOUT'];
let found = null;
for (const lbl of resultLabels) {
  if (await page.getByText(lbl, { exact: true }).count() > 0) { found = lbl; break; }
}
console.log('[4] Result label:', found);

// 5. Probe: auto-close after 1.5s, then space key
await page.waitForTimeout(1700);
await page.screenshot({ path: './verify_05_closed.png' });
const overlayGone = await page.getByText('PARAR').count() === 0;
console.log('[5] Overlay auto-closed after 1.5s:', overlayGone);

// 6. Probe: space key opens + starts timer
await page.getByText('LANZAR VIBRA').click();
await page.waitForTimeout(300);
await page.keyboard.press('Space');
await page.waitForTimeout(400);
const spaceStarted = await page.getByText('PARAR').isVisible();
console.log('[6] Space key starts timer:', spaceStarted);
await page.keyboard.press('Space');
await page.waitForTimeout(600);
await page.screenshot({ path: './verify_06_space_result.png' });
let found2 = null;
for (const lbl of resultLabels) {
  if (await page.getByText(lbl, { exact: true }).count() > 0) { found2 = lbl; break; }
}
console.log('[6] Space result:', found2);

console.log('\nConsole errors:', errors.length ? errors : 'none');
await browser.close();
