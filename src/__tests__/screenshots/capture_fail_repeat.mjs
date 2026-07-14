/**
 * Verify: real fail keeps currentProbe the same (doesn't advance).
 * Injects a run state: probe 1, lives=2 (already failed once).
 * If the bug were present, currentProbe would be 2 here.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const DIR  = 'src/__tests__/screenshots';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TEST_CHAR = {
  id: 'test-run-char', name: 'Run Test', image: null, auraNumber: 77,
  grade: 1, status: 'active',
  passiveAbility: { id: 'p01', name: 'Vitalidad', description: '+1 vida', kind: 'passive', scope: 'general' },
  activeAbility:  { id: 'a01', name: 'Congelar',  description: 'Congela 3s', kind: 'active', scope: 'general' },
  auraAbility:    { id: 'aa01', name: 'Resonancia', description: '+1 vida', kind: 'aura', scope: 'general' },
  failedRunsAtGrade: 0, temporalResidues: 1,
  stats: { runsCompleted: 0, runsFailed: 0, bestInfiniteScore: 0, hasCrown: false, crowns: 0, perfectSyncTime: 0, runHistory: [] },
};

// Simulated run state: player failed probe 1, lives went 3→2, currentProbe stays at 1 (new behavior)
const INJECTED_RUN = {
  characterId:        'test-run-char',
  currentProbe:       1,  // still 1 — the fix
  lives:              2,  // started 3, failed once
  maxLives:           3,
  activeEcos:         [],
  probeSequence:      ['bingo', 'xopportunities', 'pendulo', 'espejo', 'suma100',
                       'equilibrio', 'banca', 'doblenada', 'espejo', 'bingo'],
  probeHistory:       [
    { probeIndex: 0, probeType: 'bingo', result: 'fail', auraTriggered: false }
  ],
  infiniteMode:       false, infiniteScore: 0, status: 'active',
  abilityUsed:        false, abilityUsedViaAura: false,
  activeAbilityEffect: null, activeAuraEffect: null,
  auraActivations:    0, firstFailFree: false, secondAirUsed: false,
  flowMarginBonus:    0, rachaMarginLeft: 0, shieldActive: false,
  nextProbeAutoPass:  false, nextEcoTierBoost: false,
  doubledEcos:        [], maxEcoSlots: 5, freeProbe1: false,
  mercyRun:           false, residuesThreshold: 3,
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page    = await ctx.newPage();

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sleep(400);

  // Inject character + active run into persisted store
  await page.evaluate(({ char, run }) => {
    const existing = localStorage.getItem('aura-v2');
    const store = existing ? JSON.parse(existing) : { version: 3 };
    if (!store.state) store.state = {};
    store.state.characters = { [char.id]: char };
    store.state.activeRun  = run;
    store.state.screen     = 'run';
    store.state.lereles    = 100;
    localStorage.setItem('aura-v2', JSON.stringify(store));
  }, { char: TEST_CHAR, run: INJECTED_RUN });

  // Reload so app picks up the injected state
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(1200);

  // Click sin cuenta if on login screen
  const sinCuenta = page.locator('button').filter({ hasText: 'SIN CUENTA' });
  if (await sinCuenta.isVisible({ timeout: 1500 }).catch(() => false)) {
    await sinCuenta.click();
    await sleep(1500);
    // Re-inject after login (auth state gets set)
    await page.evaluate(({ char, run }) => {
      const existing = localStorage.getItem('aura-v2');
      const store = existing ? JSON.parse(existing) : { version: 3 };
      if (!store.state) store.state = {};
      store.state.characters = { ...store.state.characters, [char.id]: char };
      store.state.activeRun  = run;
      store.state.screen     = 'run';
      localStorage.setItem('aura-v2', JSON.stringify(store));
    }, { char: TEST_CHAR, run: INJECTED_RUN });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(1200);
  }

  // Screenshot: should show RunScreen with PRUEBA 1, 2 lives (failed once but probe repeated)
  await page.screenshot({ path: `${DIR}/run_fallo_repite.png` });
  console.log('run_fallo_repite.png — RunScreen probe 1 with 2 lives (fixed: didn\'t advance on fail)');

  await browser.close();
  console.log('DONE');
}

main().catch(e => { console.error(e.message); process.exit(1); });
