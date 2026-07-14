/**
 * Verify visual aid gating in Practice mode (OFF and ON toggle)
 * and confirm run mode shows no visual aid by default.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const DIR  = 'src/__tests__/screenshots';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TEST_CHAR = {
  id: 'ayuda-test-char', name: 'Ayuda Test', image: null, auraNumber: 42,
  grade: 3, status: 'active',
  passiveAbility: { id: 'p01', name: 'Vitalidad', description: '+1 vida', kind: 'passive', scope: 'general' },
  activeAbility:  { id: 'a01', name: 'Congelar',  description: 'Congela 3s', kind: 'active', scope: 'general' },
  auraAbility:    { id: 'aa01', name: 'Resonancia', description: '+1 vida', kind: 'aura', scope: 'general' },
  failedRunsAtGrade: 0, temporalResidues: 0,
  stats: { runsCompleted: 0, runsFailed: 0, bestInfiniteScore: 0, hasCrown: false, crowns: 0, runHistory: [] },
};

async function injectChar(page) {
  await page.evaluate((char) => {
    const existing = localStorage.getItem('aura-v2');
    const store = existing ? JSON.parse(existing) : { version: 3 };
    if (!store.state) store.state = {};
    store.state.characters = { ...store.state.characters, [char.id]: char };
    localStorage.setItem('aura-v2', JSON.stringify(store));
  }, TEST_CHAR);
}

async function loginIfNeeded(page) {
  const sinCuenta = page.locator('button').filter({ hasText: 'SIN CUENTA' });
  if (await sinCuenta.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sinCuenta.click();
    await sleep(1800);
  }
}

async function goToPractice(page) {
  await page.locator('button').filter({ hasText: 'Práctica' }).click();
  await sleep(800);
  const charBtn = page.locator('button').filter({ hasText: 'Ayuda Test' });
  if (await charBtn.count() > 0) { await charBtn.click(); await sleep(300); }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: { width: 390, height: 844 } });

  // ── 1. Espejo + Pendulo — AYUDA OFF ──────────────────────────────────────────
  {
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await sleep(500);
    await injectChar(page);
    await loginIfNeeded(page);
    await goToPractice(page);

    // Select Espejo
    await page.locator('text=ESPEJO').first().click();
    await sleep(200);
    // Ayuda OFF (default) — screenshot config
    await page.screenshot({ path: `${DIR}/ayuda_practica_off.png` });
    console.log('ayuda_practica_off.png — toggle OFF visible in config');

    // Start to see probe without aid
    await page.locator('button').filter({ hasText: 'INICIAR PRÁCTICA' }).click();
    await sleep(1200);
    await page.locator('button').filter({ hasText: 'EMPEZAR' }).click();
    await sleep(600);
    await page.screenshot({ path: `${DIR}/espejo_sin_ayuda.png` });
    console.log('espejo_sin_ayuda.png — EspejoBar NOT visible (toggle OFF)');
    await page.close();
  }

  // ── 2. Espejo + Pendulo — AYUDA ON ───────────────────────────────────────────
  {
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await sleep(500);
    await injectChar(page);
    await loginIfNeeded(page);
    await goToPractice(page);

    // Select Pendulo
    await page.locator('text=PÉNDULO').first().click();
    await sleep(200);
    // Click Ayuda visual toggle (ON)
    await page.locator('button').filter({ hasText: 'OFF' }).click();
    await sleep(200);
    await page.screenshot({ path: `${DIR}/ayuda_practica_on.png` });
    console.log('ayuda_practica_on.png — toggle ON visible in config');

    // Start to see probe WITH aid
    await page.locator('button').filter({ hasText: 'INICIAR PRÁCTICA' }).click();
    await sleep(1200);
    await page.locator('button').filter({ hasText: 'EMPEZAR' }).click();
    await sleep(600);
    await page.screenshot({ path: `${DIR}/pendulo_con_ayuda.png` });
    console.log('pendulo_con_ayuda.png — margin zone + target marker visible (toggle ON)');
    await page.close();
  }

  // ── 3. Run sin ecos/habilidad de ayuda visual ─────────────────────────────────
  {
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await sleep(500);
    await injectChar(page);
    // Inject a run with pendulo as first probe (showVisualAid defaults to false)
    await page.evaluate((char) => {
      const existing = localStorage.getItem('aura-v2');
      const store = existing ? JSON.parse(existing) : { version: 3 };
      if (!store.state) store.state = {};
      store.state.activeRun = {
        characterId: char.id, currentProbe: 1, lives: 3, maxLives: 3,
        activeEcos: [], probeSequence: ['pendulo','espejo','bingo','xopportunities','suma100',
                                         'equilibrio','banca','doblenada','espejo','bingo'],
        probeHistory: [], infiniteMode: false, infiniteScore: 0, status: 'active',
        abilityUsed: false, abilityUsedViaAura: false, activeAbilityEffect: null,
        activeAuraEffect: null, auraActivations: 0, firstFailFree: false, secondAirUsed: false,
        flowMarginBonus: 0, rachaMarginLeft: 0, shieldActive: false, nextProbeAutoPass: false,
        nextEcoTierBoost: false, doubledEcos: [], maxEcoSlots: 5, freeProbe1: false,
        mercyRun: false, residuesThreshold: 3,
      };
      store.state.screen = 'run';
      localStorage.setItem('aura-v2', JSON.stringify(store));
    }, TEST_CHAR);
    await loginIfNeeded(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(1200);
    // Start the probe
    const empezar = page.locator('button').filter({ hasText: 'EMPEZAR' });
    if (await empezar.count() > 0) { await empezar.click(); await sleep(500); }
    await page.screenshot({ path: `${DIR}/run_sin_ayuda.png` });
    console.log('run_sin_ayuda.png — Pendulo in run without visual aid (no marker, no zone)');
    await page.close();
  }

  await browser.close();
  console.log('DONE');
}

main().catch(e => { console.error(e.message); process.exit(1); });
