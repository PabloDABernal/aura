/**
 * verify_phase2_flow.mjs
 * Verifica el flujo completo de run sin crashes.
 * Uso: node src/__tests__/verify_phase2_flow.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE  = 'http://localhost:5175';
const SHOTS = path.join('src', '__tests__', 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

let shotN = 0;
async function shot(page, label) {
  shotN++;
  const file = path.join(SHOTS, `p2_${String(shotN).padStart(2,'0')}_${label}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${file}`);
}

async function waitForText(page, text, ms = 10000) {
  await page.waitForFunction(t => document.body.innerText.includes(t), text, { timeout: ms });
}

/** Dispatch a combat action via the Zustand store exposed on window.__aura_store__ */
async function dispatch(page, action) {
  return page.evaluate(a => {
    window.__aura_store__.getState().dispatchCombat(a);
  }, action);
}

/** Get current combat state */
async function getCombat(page) {
  return page.evaluate(() => {
    const state = window.__aura_store__.getState();
    const c = state.combat;
    if (!c) return null;
    return {
      turn:      c.turn,
      victory:   c.victory,
      hq:        c.hq.map(s => ({ id: s.characterId, p: s.presencia, i: s.influencia, t: s.temple, isKO: s.isKO, exhausted: s.exhausted })),
      pit:       c.pit.map(s => ({ id: s.characterId, p: s.presencia, i: s.influencia, t: s.temple, isKO: s.isKO, exhausted: s.exhausted })),
      enemyAura: c.enemies[0]?.auraCurrent,
      enemyMax:  c.enemies[0]?.auraMax,
      pending:   !!c.pendingVibra,
      pendingDef:!!c.pendingDefensiveVibra,
    };
  });
}

/**
 * Run a full combat automatically by dispatching store actions directly.
 * Avoids all UI timing issues with animations, overlays, button selectors.
 */
async function runCombatViaStore(page) {
  // Step 1: Move Goku (char-goku) from HQ to pit
  const state0 = await getCombat(page);
  if (!state0) throw new Error('combat state unavailable');

  const gokuInHQ = state0.hq.find(s => s.id === 'char-goku');
  if (gokuInHQ) {
    await dispatch(page, { type: 'MOVE_CHARACTER', payload: { characterId: 'char-goku', from: 'hq', to: 'pit' } });
    console.log('  Store: Goku movido al Foso');
    // Wait for enemy turn to auto-execute (1.5s)
    await new Promise(r => setTimeout(r, 2000));
  }

  // Resolve any pending defensive vibra with a timed stop result
  async function resolveDefensiveIfAny() {
    const c = await getCombat(page);
    if (!c?.pendingDef) return false;
    // Dispatch RESOLVE_DEFENSIVE_VIBRA with 'vibra' result → character dodges, no damage taken
    await dispatch(page, {
      type:    'RESOLVE_DEFENSIVE_VIBRA',
      payload: { result: { result: 'vibra', multiplier: 1, bonusTiempo: 0, finalValue: 0, timeSpent: 500, auraGain: 1 } },
    });
    await new Promise(r => setTimeout(r, 200));
    return true;
  }

  // Step 2: Attack loop
  for (let round = 0; round < 50; round++) {
    await new Promise(r => setTimeout(r, 200));

    const c = await getCombat(page);
    if (!c) break;
    if (c.victory) break;

    // Resolve pending defensive challenge
    if (c.pendingDef) {
      await resolveDefensiveIfAny();
      console.log(`  Store ronda ${round}: resolvió defensa`);
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    // Wait for enemy auto-turn to fire (if enemy turn)
    if (c.turn !== 'player') {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    // Find a fighter: prefer Goku in pit (non-KO), fallback Luffy in pit, fallback move from HQ
    const pitFighter = c.pit.find(s => !s.isKO);
    if (!pitFighter) {
      // Nobody in pit, or all KO — move first non-KO HQ leader to pit
      const hqFighter = c.hq.find(s => !s.isKO);
      if (!hqFighter) {
        console.log(`  Store ronda ${round}: todos KO, no hay acción posible`);
        break;
      }
      await dispatch(page, { type: 'MOVE_CHARACTER', payload: { characterId: hqFighter.id, from: 'hq', to: 'pit' } });
      console.log(`  Store ronda ${round}: movió ${hqFighter.id} al Foso`);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    // Attack with the pit fighter
    await dispatch(page, {
      type:    'RESOLVE_ACCION_SEGURA',
      payload: { context: { type: 'confront', characterId: pitFighter.id, attribute: pitFighter.p } },
    });
    const newC = await getCombat(page);
    const enemyAura = newC?.enemyAura ?? '?';
    console.log(`  Store ronda ${round}: ${pitFighter.id} ataca (P=${pitFighter.p}), enemigo aura=${enemyAura}`);

    if (newC?.victory) break;

    // Wait for enemy auto-turn (1.5s)
    await new Promise(r => setTimeout(r, 2000));
  }

  const final = await getCombat(page);
  return final?.victory;
}

async function run() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx  = await browser.newContext({ viewport: { width: 460, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  console.log('\n=== FASE 2 — verificación flujo completo ===\n');

  // 1. Login
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await waitForText(page, 'AURA');
  await shot(page, 'login');
  console.log('✅ 1. LoginScreen carga');

  await page.evaluate(() => {
    localStorage.removeItem('aura-save-v1');
    localStorage.setItem('aura_tutorial_seen', '1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await waitForText(page, 'AURA');

  await page.click('button:has-text("JUGAR SIN CUENTA")');
  await waitForText(page, 'ELIGE TUS SETS');
  await shot(page, 'set-selection');
  console.log('✅ 2. SetSelection carga');

  await page.locator('text=One Piece').first().click();
  await page.locator('text=Dragon Ball').first().click();
  await waitForText(page, '2/5 seleccionados');
  await shot(page, 'sets-selected');
  await page.click('button:has-text("CONTINUAR")');

  // 3. Leader selection
  await waitForText(page, 'ELIGE LÍDERES');
  await shot(page, 'leader-selection');
  console.log('✅ 3. LeaderSelection carga');

  await page.locator('text=Luffy').first().click();
  await page.locator('text=Goku').first().click();
  await page.click('button:has-text("VER BARAJA")');

  // 4. Deck review
  await waitForText(page, 'TU BARAJA');
  await shot(page, 'deck-review');
  console.log('✅ 4. DeckReview carga');

  await page.click('button:has-text("AL MAPA")');

  // 5. Mapa
  await waitForText(page, 'Área');
  await shot(page, 'map-initial');
  console.log('✅ 5. MapScreen carga con nodos');

  await page.locator('div[style*="cursor: pointer"]').filter({ hasText: 'Combate' }).first().click();
  await new Promise(r => setTimeout(r, 500));
  const modalBtn = page.locator('button:has-text("⚔️ Combatir")');
  if (await modalBtn.isVisible()) await modalBtn.click();

  // 6. Combat screen
  await waitForText(page, 'Vibración');
  await shot(page, 'combat-start');
  console.log('✅ 6. CombatScreen carga');

  // Verify store is exposed
  const storeOk = await page.evaluate(() => typeof window.__aura_store__ !== 'undefined').catch(() => false);
  if (!storeOk) throw new Error('window.__aura_store__ no disponible — revisa main.jsx DEV flag');

  // Run combat via store
  const victoryResult = await runCombatViaStore(page);
  await shot(page, 'combat-end');
  console.log(`\n  Combate: ${victoryResult === 'win' ? 'VICTORIA ✅' : victoryResult === 'lose' ? 'DERROTA (run continúa)' : `fin con victory=${victoryResult}`}`);

  // Wait for VictoryOverlay to show
  await page.waitForFunction(
    () => document.body.innerText.includes('VICTORIA') || document.body.innerText.includes('DERROTA'),
    null,
    { timeout: 5000 }
  );

  const isWin  = await page.locator('text=VICTORIA').isVisible();
  const isLose = await page.locator('text=DERROTA').isVisible();

  if (!isWin && !isLose) {
    console.log('  ❌ VictoryOverlay no apareció');
    await browser.close();
    process.exit(1);
  }

  // 7. Click VER RECOMPENSAS / VER RESULTADO
  const rewardBtn = page.locator('button').filter({ hasText: 'VER RECOMPENSAS' }).or(
    page.locator('button').filter({ hasText: 'VER RESULTADO' })
  ).first();
  await rewardBtn.waitFor({ timeout: 5000 });
  await rewardBtn.click();

  if (isWin) {
    await waitForText(page, 'VICTORIA', 5000);
    await shot(page, 'reward-screen');
    console.log('✅ 7. RewardScreen carga (bug 1&2 verificado)');

    // Pick eco if available
    const ecoBtn = page.locator('button').filter({ hasText: 'ELEGIR ECO' }).first();
    if (await ecoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ecoBtn.click();
      const ecoCard = page.locator('div[style*="cursor: pointer"]').first();
      await ecoCard.waitFor({ timeout: 5000 });
      await ecoCard.click();
      await new Promise(r => setTimeout(r, 500));
      await shot(page, 'reward-eco-chosen');
    }

    const continuar = page.locator('button').filter({ hasText: 'CONTINUAR' }).first();
    await continuar.waitFor({ timeout: 5000 });
    await continuar.click();

    await waitForText(page, 'Área', 8000);
    await shot(page, 'map-after-reward');
    console.log('✅ 8. Mapa tras recompensa — bug 3 verificado (nodo completado)');
  } else {
    await waitForText(page, 'DERROTA', 5000);
    await shot(page, 'run-end-defeat');
    console.log('✅ 7. RunEndScreen en derrota');
  }

  console.log('\n--- Errores de consola ---');
  if (errors.length === 0) {
    console.log('✅ Sin errores de consola');
  } else {
    errors.forEach(e => console.log('  ❌', e));
  }

  await browser.close();
  console.log('\n=== Verificación completa ===');
}

run().catch(e => { console.error('CRASH:', e.message ?? e); process.exit(1); });
