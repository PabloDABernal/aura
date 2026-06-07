/**
 * verify_phase3_eco.mjs
 * Verifica el sistema Eco completo: combat → reward → eco-selection → map
 * Uso: node src/tests/verify_phase3_eco.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE  = 'http://localhost:5175';
const SHOTS = path.join('src', 'tests', 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

let shotN = 0;
async function shot(page, label) {
  shotN++;
  const file = path.join(SHOTS, `p3_${String(shotN).padStart(2,'0')}_${label}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${file}`);
}

async function waitForText(page, text, ms = 10000) {
  await page.waitForFunction(t => document.body.innerText.includes(t), text, { timeout: ms });
}

async function dispatch(page, action) {
  return page.evaluate(a => {
    window.__aura_store__.getState().dispatchCombat(a);
  }, action);
}

async function getCombat(page) {
  return page.evaluate(() => {
    const state = window.__aura_store__.getState();
    const c = state.combat;
    if (!c) return null;
    return {
      turn:       c.turn,
      victory:    c.victory,
      hq:         c.hq.map(s => ({ id: s.characterId, t: s.temple, p: s.presencia, i: s.influencia, isKO: s.isKO })),
      pit:        c.pit.map(s => ({ id: s.characterId, t: s.temple, p: s.presencia, i: s.influencia, isKO: s.isKO })),
      enemyAura:  c.enemies[0]?.auraCurrent,
      pendingDef: !!c.pendingDefensiveVibra,
      activeEcos: c.activeEcos ?? [],
    };
  });
}

async function runCombatViaStore(page) {
  const state0 = await getCombat(page);
  if (!state0) throw new Error('combat state unavailable');

  const gokuInHQ = state0.hq.find(s => s.id === 'char-goku');
  if (gokuInHQ) {
    await dispatch(page, { type: 'MOVE_CHARACTER', payload: { characterId: 'char-goku', from: 'hq', to: 'pit' } });
    console.log('  Store: Goku movido al Foso');
    await new Promise(r => setTimeout(r, 2000));
  }

  async function resolveDefensiveIfAny() {
    const c = await getCombat(page);
    if (!c?.pendingDef) return false;
    await dispatch(page, {
      type: 'RESOLVE_DEFENSIVE_VIBRA',
      payload: { result: { result: 'vibra', multiplier: 1, bonusTiempo: 0, finalValue: 0, timeSpent: 500, auraGain: 1 } },
    });
    await new Promise(r => setTimeout(r, 200));
    return true;
  }

  for (let round = 0; round < 50; round++) {
    await new Promise(r => setTimeout(r, 200));
    const c = await getCombat(page);
    if (!c || c.victory) break;

    if (c.pendingDef) {
      await resolveDefensiveIfAny();
      console.log(`  Store ronda ${round}: resolvió defensa`);
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    if (c.turn !== 'player') {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    const pitFighter = c.pit.find(s => !s.isKO);
    if (!pitFighter) {
      const hqFighter = c.hq.find(s => !s.isKO);
      if (!hqFighter) { console.log(`  Store ronda ${round}: todos KO`); break; }
      await dispatch(page, { type: 'MOVE_CHARACTER', payload: { characterId: hqFighter.id, from: 'hq', to: 'pit' } });
      console.log(`  Store ronda ${round}: movió ${hqFighter.id} al Foso`);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    await dispatch(page, {
      type: 'RESOLVE_ACCION_SEGURA',
      payload: { context: { type: 'confront', characterId: pitFighter.id, attribute: pitFighter.p } },
    });
    const newC = await getCombat(page);
    console.log(`  Store ronda ${round}: ataca ${pitFighter.id}, enemyAura=${newC?.enemyAura}`);
    if (newC?.victory) break;
    await new Promise(r => setTimeout(r, 2000));
  }

  const final = await getCombat(page);
  return final;
}

async function run() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx  = await browser.newContext({ viewport: { width: 460, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  const ecoLogs = [];
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.text().includes('[ECO]')) ecoLogs.push(m.text());
  });
  page.on('pageerror', e => errors.push(e.message));

  console.log('\n=== FASE 3 — verificación sistema Eco ===\n');

  // 1. Login + setup
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await waitForText(page, 'AURA');
  await page.evaluate(() => {
    localStorage.removeItem('aura-save-v1');
    localStorage.setItem('aura_tutorial_seen', '1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await waitForText(page, 'AURA');
  await shot(page, 'login');
  console.log('✅ 1. Login');

  await page.click('button:has-text("JUGAR SIN CUENTA")');
  await waitForText(page, 'ELIGE TUS SETS');
  await page.locator('text=One Piece').first().click();
  await page.locator('text=Dragon Ball').first().click();
  await waitForText(page, '2/5 seleccionados');
  await page.click('button:has-text("CONTINUAR")');
  await waitForText(page, 'ELIGE LÍDERES');
  await page.locator('text=Luffy').first().click();
  await page.locator('text=Goku').first().click();
  await page.click('button:has-text("VER BARAJA")');
  await waitForText(page, 'TU BARAJA');
  await page.click('button:has-text("AL MAPA")');
  await waitForText(page, 'Área');
  await shot(page, 'map');
  console.log('✅ 2. Llegamos al mapa');

  // Start combat
  await page.locator('div[style*="cursor: pointer"]').filter({ hasText: 'Combate' }).first().click();
  await new Promise(r => setTimeout(r, 500));
  const modalBtn = page.locator('button:has-text("⚔️ Combatir")');
  if (await modalBtn.isVisible()) await modalBtn.click();
  await waitForText(page, 'Vibración');
  await shot(page, 'combat');
  console.log('✅ 3. CombatScreen carga');

  // Verify activeEcos in combat state
  const initialState = await getCombat(page);
  const ecoInCombat = Array.isArray(initialState?.activeEcos);
  console.log(`  activeEcos en combat state: ${JSON.stringify(initialState?.activeEcos)} — ${ecoInCombat ? '✅' : '❌'}`);

  // Run combat
  const finalCombat = await runCombatViaStore(page);
  await shot(page, 'combat-end');
  console.log(`\n  Combate: ${finalCombat?.victory === 'win' ? 'VICTORIA ✅' : `fin=${finalCombat?.victory}`}`);

  if (finalCombat?.victory !== 'win') {
    console.log('  ❌ Se necesita victoria para probar eco-selection');
    await browser.close();
    process.exit(1);
  }

  // Wait for VictoryOverlay
  await page.waitForFunction(() => document.body.innerText.includes('VICTORIA'), null, { timeout: 5000 });

  // 4. Click VER RECOMPENSAS
  const rewardBtn = page.locator('button').filter({ hasText: 'VER RECOMPENSAS' }).or(
    page.locator('button').filter({ hasText: 'VER RESULTADO' })
  ).first();
  await rewardBtn.waitFor({ timeout: 5000 });
  await rewardBtn.click();
  await waitForText(page, 'VICTORIA', 5000);
  await shot(page, 'reward-lereles');
  console.log('✅ 4. RewardScreen (fase lereles)');

  // Click "ELEGIR ECO →" to advance to eco phase
  await page.click('button:has-text("ELEGIR ECO")');
  await waitForText(page, 'Elige un Eco', 5000);
  await shot(page, 'reward-eco-phase');
  console.log('✅ 5. RewardScreen (fase ecos)');

  // Pick the first eco card
  const ecoCard = page.locator('div[style*="cursor: pointer"]').first();
  await ecoCard.waitFor({ timeout: 5000 });
  await ecoCard.click();
  await waitForText(page, 'Eco añadido', 3000);
  await shot(page, 'reward-eco-done');
  console.log('✅ 6. Eco elegido en RewardScreen');

  // Click CONTINUAR → should go to eco-selection
  await page.click('button:has-text("CONTINUAR")');
  await waitForText(page, 'ECOS', 5000);
  await shot(page, 'eco-selection');
  console.log('✅ 7. EcoSelectionScreen carga tras reward');

  // Check slot count shown
  const slotsText = await page.locator('div').filter({ hasText: /\d+\/10 slots/ }).first().textContent().catch(() => '');
  console.log(`  Slots: "${slotsText}"`);

  // Pick an eco from eco-selection
  const ecoOption = page.locator('div[style*="cursor: pointer"]').first();
  const ecoOptionVisible = await ecoOption.isVisible({ timeout: 3000 }).catch(() => false);

  if (ecoOptionVisible) {
    await ecoOption.click();
    await waitForText(page, 'Eco añadido', 3000);
    await shot(page, 'eco-selection-done');
    console.log('✅ 8. Eco elegido en EcoSelectionScreen');

    // Verify eco added to run
    const runEcos = await page.evaluate(() => window.__aura_store__.getState().run?.activeEcos ?? []);
    console.log(`  run.activeEcos: ${JSON.stringify(runEcos)}`);
    if (runEcos.length >= 1) console.log('✅ 9. Eco guardado en runSlice');
    else console.log('❌ 9. Eco NO guardado en runSlice');

    // Navigate to map
    await page.click('button:has-text("AL MAPA")');
  } else {
    // No ecos available (all owned), use skip
    await page.click('button:has-text("Saltar")');
  }

  await waitForText(page, 'Área', 8000);
  await shot(page, 'map-after-eco');
  console.log('✅ 10. Mapa tras eco-selection');

  // Verify ON_VIBRA_RESULT eco log
  if (ecoLogs.length > 0) {
    console.log('\n  [ECO] logs detectados:');
    ecoLogs.forEach(l => console.log('  ', l));
    console.log('✅ 11. applyEcos ON_VIBRA_RESULT llamado (verificación combate)');
  } else {
    console.log('  ⚠️  No se detectaron logs [ECO] — puede que ON_VIBRA_RESULT no se usó en este combate (se usó RESOLVE_ACCION_SEGURA, no RESOLVE_VIBRA)');
  }

  console.log('\n--- Errores de consola ---');
  if (errors.length === 0) {
    console.log('✅ Sin errores de consola');
  } else {
    errors.forEach(e => console.log('  ❌', e));
  }

  await browser.close();
  console.log('\n=== Verificación Fase 3 completa ===\n');
}

run().catch(e => { console.error('CRASH:', e.message ?? e); process.exit(1); });
