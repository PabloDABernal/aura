/**
 * Playwright capture — Péndulo, Bingo, Parpadeo.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const DIR  = 'src/__tests__/screenshots';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TEST_CHAR = {
  id: 'test-char-42', name: 'Test Aura 42', image: null, auraNumber: 42,
  grade: 3, status: 'active',
  passiveAbility: { id: 'p01', name: 'Vitalidad', description: '+1 vida', kind: 'passive', scope: 'general' },
  activeAbility:  { id: 'a01', name: 'Congelar',  description: 'Congela 3s', kind: 'active', scope: 'general' },
  auraAbility:    { id: 'aa01', name: 'Resonancia', description: '+1 vida', kind: 'aura', scope: 'general' },
  failedRunsAtGrade: 0, temporalResidues: 0,
  stats: { runsCompleted: 0, runsFailed: 0, bestInfiniteScore: 0, hasCrown: false, crowns: 0, perfectSyncTime: 0, runHistory: [] },
};

async function setupPage(ctx) {
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sleep(500);

  // Inject character before app reads localStorage
  await page.evaluate((char) => {
    const existing = localStorage.getItem('aura-v2');
    const store = existing ? JSON.parse(existing) : {};
    if (!store.state) store.state = {};
    if (!store.state.characters) store.state.characters = {};
    store.state.characters[char.id] = char;
    if (!store.version) store.version = 0;
    localStorage.setItem('aura-v2', JSON.stringify(store));
  }, TEST_CHAR);

  // Click sin cuenta if on login screen
  const sinCuenta = page.locator('button').filter({ hasText: 'SIN CUENTA' });
  if (await sinCuenta.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sinCuenta.click();
    await sleep(2500);
  } else {
    await sleep(800);
  }

  // Open Práctica
  await page.locator('button').filter({ hasText: 'Práctica' }).click();
  await sleep(1000);

  // Select Test Aura 42
  const charBtn = page.locator('button').filter({ hasText: 'Test Aura 42' });
  if (await charBtn.count() > 0) {
    await charBtn.click();
    await sleep(300);
  }

  return page;
}

async function startProbe(page, probeName) {
  // Select probe from list
  await page.locator(`text=${probeName}`).first().click();
  await sleep(300);
  // Start
  await page.locator('button').filter({ hasText: 'INICIAR PRÁCTICA' }).click();
  await sleep(1500);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: { width: 390, height: 844 } });

  // ── 1. PÉNDULO ─────────────────────────────────────────────────────────────
  {
    const page = await setupPage(ctx);
    await startProbe(page, 'PÉNDULO');
    // Ready state: shows "PARA EN X.42" and bar not visible yet
    await page.screenshot({ path: `${DIR}/pendulo_rango.png` });
    console.log('pendulo_rango.png — PARA EN visible');

    // Start to see the bar
    const empezar = page.locator('button').filter({ hasText: 'EMPEZAR' });
    if (await empezar.count() > 0) {
      await empezar.click();
      await sleep(300);
      await page.screenshot({ path: `${DIR}/pendulo_running.png` });
      console.log('pendulo_running.png — barra con extremos 0 / 3');
    }
    await page.close();
  }

  // ── 2. BINGO ───────────────────────────────────────────────────────────────
  {
    const page = await setupPage(ctx);
    await startProbe(page, 'BINGO A TIEMPO');
    const empezar = page.locator('button').filter({ hasText: 'EMPEZAR' });
    if (await empezar.count() > 0) {
      await empezar.click();
      await sleep(2000);
      // Freeze — click circle center (SVG intercepts, use force)
      await page.locator('text=PARAR').first().click({ force: true });
      await sleep(600);
      await page.screenshot({ path: `${DIR}/bingo_banner.png` });
      console.log('bingo_banner.png — frozen after stop (no aura triggered, banner should not show)');

      // Now resume — banner should clear
      await page.locator('text=REANUDAR').first().click({ force: true });
      await sleep(400);
      await page.screenshot({ path: `${DIR}/bingo_banner_cleared.png` });
      console.log('bingo_banner_cleared.png — after resume (banner definitivamente fuera)');
    }
    await page.close();
  }

  // ── 3. PARPADEO ────────────────────────────────────────────────────────────
  {
    const page = await setupPage(ctx);
    await startProbe(page, 'PARPADEO');
    await page.screenshot({ path: `${DIR}/parpadeo_ready.png` });
    console.log('parpadeo_ready.png — objetivo en ventana OFF');

    const empezar = page.locator('button').filter({ hasText: 'EMPEZAR' });
    if (await empezar.count() > 0) {
      await empezar.click();
      await sleep(600);
      await page.screenshot({ path: `${DIR}/parpadeo_ventanas.png` });
      console.log('parpadeo_ventanas.png — ciclo ON/OFF visible');
    }
    await page.close();
  }

  await browser.close();
  console.log('DONE');
}

main().catch(e => { console.error(e.message); process.exit(1); });
