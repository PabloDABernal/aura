/**
 * Diagnóstico: flujo Login → SetSelection → LeaderSelection → DeckReview → MapScreen
 * Ejecutar con: node src/tests/diagnostico_flujo.cjs
 */
const { chromium } = require('playwright');
const path         = require('path');
const fs           = require('fs');

const BASE_URL  = 'http://localhost:5173';
const SHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

async function shot(page, name) {
  const f = path.join(SHOTS_DIR, `diag_${name}.png`);
  await page.screenshot({ path: f, fullPage: true });
  console.log(`  📸 ${f}`);
}

function bodyText(t) { return t.slice(0, 400).replace(/\s+/g, ' ').trim(); }

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const ctx     = await browser.newContext({ viewport: { width: 460, height: 900 } });
  const page    = await ctx.newPage();

  const consoleLogs = [];
  page.on('console', m => consoleLogs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', e => consoleLogs.push({ type: 'pageerror', text: e.message + '\n' + (e.stack || '') }));

  function flushErrors(label) {
    const errs = consoleLogs.filter(m => m.type === 'error' || m.type === 'pageerror');
    if (errs.length) console.log(`  ❌ Console errors @ ${label}:`, errs.map(e => e.text.slice(0, 300)));
    else console.log(`  ✅ No console errors @ ${label}`);
    consoleLogs.length = 0;
  }

  function readStore(page) {
    return page.evaluate(() => {
      const key = Object.keys(localStorage).find(k => k.startsWith('aura-save'));
      if (!key) return null;
      try { return JSON.parse(localStorage[key]).state; } catch(e) { return { error: e.message }; }
    });
  }

  // ─── PASO 1: Login ────────────────────────────────────────────────────────
  console.log('\n=== PASO 1: Login ===');
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1000);
  await shot(page, '01_login');
  console.log('  Texto:', bodyText(await page.textContent('body')));
  flushErrors('login');

  // ─── PASO 2: Jugar sin cuenta → SetSelection ──────────────────────────────
  console.log('\n=== PASO 2: SetSelectionScreen ===');
  await page.getByText('JUGAR SIN CUENTA').click();
  await page.waitForTimeout(800);
  await shot(page, '02_set_selection');
  console.log('  Texto:', bodyText(await page.textContent('body')));
  flushErrors('set-selection');

  const s2 = await readStore(page);
  console.log('  screen:', s2?.screen);
  console.log('  collection.sets keys:', Object.keys(s2?.collection?.sets ?? {}));

  // ─── PASO 3: Seleccionar 2 sets ───────────────────────────────────────────
  console.log('\n=== PASO 3: Seleccionar 2 sets de onboarding (índices 2+3) ===');

  const setNames = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    return allDivs
      .filter(d => {
        const style = d.getAttribute('style') || '';
        return style.includes('cursor: pointer') && style.includes('border') &&
               d.textContent.trim().length > 5 && d.textContent.trim().length < 300;
      })
      .map(d => {
        const r = d.getBoundingClientRect();
        return { text: d.textContent.trim().slice(0, 60).replace(/\s+/g, ' '), rect: r };
      })
      .filter(d => d.rect.width > 100 && d.rect.height > 30 && d.rect.y > 50);
  });
  console.log('  Sets disponibles:', setNames.map(s => s.text.slice(0, 30)));

  // Usar índices 2 y 3 para seleccionar sets de onboarding (no phase1Data)
  const onbIndices = setNames.length >= 4 ? [2, 3] : [0, 1];
  for (const i of onbIndices) {
    await page.mouse.click(setNames[i].rect.x + setNames[i].rect.width / 2, setNames[i].rect.y + setNames[i].rect.height / 2);
    await page.waitForTimeout(400);
    console.log(`  ✔ Clicked set [${i}]: "${setNames[i].text.slice(0, 30)}"`);
  }

  await shot(page, '03_sets_selected');
  console.log('  Texto:', bodyText(await page.textContent('body')));
  flushErrors('sets-selected');

  // ─── PASO 4: Continuar → LeaderSelection ─────────────────────────────────
  console.log('\n=== PASO 4: LeaderSelectionScreen ===');
  const contBtn = page.getByText('CONTINUAR →');
  const contEnabled = await contBtn.evaluate(el => !el.disabled).catch(() => false);
  console.log('  Botón CONTINUAR habilitado:', contEnabled);
  if (contEnabled) {
    await contBtn.click();
    await page.waitForTimeout(600);
  } else {
    console.log('  ⚠ CONTINUAR deshabilitado — selección fallida');
  }
  await shot(page, '04_leader_selection');
  console.log('  Texto:', bodyText(await page.textContent('body')));
  flushErrors('leader-selection');

  const s4 = await readStore(page);
  console.log('  screen:', s4?.screen);
  console.log('  runConfig.selectedSets:', s4?.runConfig?.selectedSets);

  // ─── PASO 5: Seleccionar 1 líder por set ─────────────────────────────────
  console.log('\n=== PASO 5: Seleccionar líderes (1 por set) ===');

  const leaderCards = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    return allDivs
      .filter(d => {
        const style = d.getAttribute('style') || '';
        return style.includes('cursor: pointer') && style.includes('border-radius') &&
               d.textContent.match(/\d+ Aura/) && d.getBoundingClientRect().width > 100;
      })
      .map(d => {
        const r = d.getBoundingClientRect();
        return { text: d.textContent.trim().slice(0, 50).replace(/\s+/g, ' '), y: r.y, cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
      });
  });

  console.log('  Leader cards encontradas:', leaderCards.map(l => l.text.slice(0, 30)));

  // Onboarding sets: 1 líder por set → 2 líderes totales en índices 0 y 1
  const toClick = leaderCards.slice(0, 2);

  for (const card of toClick) {
    await page.mouse.click(card.cx, card.cy);
    await page.waitForTimeout(400);
    console.log(`  ✔ Clicked leader: "${card.text.slice(0, 30)}"`);
  }

  await shot(page, '05_leaders_selected');
  console.log('  Texto:', bodyText(await page.textContent('body')));
  flushErrors('leaders-selected');

  const verBarajaBtn = page.getByText('VER BARAJA →');
  const verBarajaEnabled = await verBarajaBtn.evaluate(el => !el.disabled).catch(() => false);
  console.log('  VER BARAJA habilitado:', verBarajaEnabled);

  // ─── PASO 6: DeckReview ────────────────────────────────────────────────────
  console.log('\n=== PASO 6: DeckReviewScreen + store dump ===');
  if (verBarajaEnabled) {
    await verBarajaBtn.click();
    await page.waitForTimeout(800);
  } else {
    console.log('  ⚠ VER BARAJA deshabilitado — abortando navegación');
  }
  await shot(page, '06_deck_review');
  console.log('  Texto:', bodyText(await page.textContent('body')));
  flushErrors('deck-review');

  const s6 = await readStore(page);
  console.log('  screen:', s6?.screen);
  console.log('  runConfig:', JSON.stringify(s6?.runConfig, null, 2));
  console.log('  run:', s6?.run ? {
    selectedLeaderIds: s6.run.selectedLeaderIds,
    selectedSetIds: s6.run.selectedSetIds,
    deckLength: (s6.run.deck ?? []).length,
    areasCount: (s6.run.areas ?? []).length,
  } : 'null (no hay run)');

  const deckInfo = await page.evaluate(() =>
    [...new Set(
      Array.from(document.querySelectorAll('*'))
        .filter(e => e.children.length === 0 && e.textContent.trim())
        .map(e => e.textContent.trim())
        .filter(t => t.length > 1 && t.length < 60)
    )].slice(0, 40)
  );
  console.log('  Textos en pantalla:', deckInfo);

  // ─── PASO 7: Al Mapa ─────────────────────────────────────────────────────
  console.log('\n=== PASO 7: MapScreen + store dump ===');
  const alMapaCount = await page.getByText('¡AL MAPA!').count().catch(() => 0);
  console.log('  ¡AL MAPA! botón visible:', alMapaCount);

  if (alMapaCount > 0) {
    await page.getByText('¡AL MAPA!').click();
    await page.waitForTimeout(1000);
  } else {
    // Fallback: buscar botón con MAPA en el texto
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(b => b.textContent.includes('MAPA'));
      if (b) b.click();
    });
    await page.waitForTimeout(800);
  }

  await shot(page, '07_map_screen');
  console.log('  Texto:', bodyText(await page.textContent('body')));
  flushErrors('map-screen');

  const s7 = await readStore(page);
  console.log('  screen:', s7?.screen);
  if (s7?.run) {
    console.log('  run.selectedLeaderIds:', s7.run.selectedLeaderIds);
    console.log('  run.deckLength:', (s7.run.deck ?? []).length);
    console.log('  run.areas:', (s7.run.areas ?? []).length);
    console.log('  run.lereles:', s7.run.lereles);
    const nodes = s7.run.areas?.[0]?.nodes ?? [];
    console.log('  area[0].nodes:', nodes.map(n => ({ type: n.type, corrupt: n.corruptCharId, place: n.placeId, done: n.completed })));
  } else {
    console.log('  ⚠ run: null — run nunca se inició');
  }

  // ─── PASO 8: Click primer nodo ───────────────────────────────────────────
  console.log('\n=== PASO 8: Click primer nodo ===');
  const nodeInfo = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    return allDivs
      .filter(d => {
        const style = d.getAttribute('style') || '';
        const text = d.textContent;
        return style.includes('cursor: pointer') && (text.includes('⚔') || text.includes('Combate') || text.includes('básico'));
      })
      .slice(0, 3)
      .map(d => {
        const r = d.getBoundingClientRect();
        return { text: d.textContent.trim().slice(0, 40).replace(/\s+/g, ' '), cx: r.x + r.width/2, cy: r.y + r.height/2 };
      });
  });
  console.log('  Nodos clicables:', nodeInfo);

  if (nodeInfo.length > 0) {
    await page.mouse.click(nodeInfo[0].cx, nodeInfo[0].cy);
    await page.waitForTimeout(1200);
  } else {
    console.log('  ⚠ No se encontraron nodos clicables');
  }

  await shot(page, '08_after_node_click');
  console.log('  Texto:', bodyText(await page.textContent('body')));
  flushErrors('after-node-click');

  const s8 = await readStore(page);
  console.log('  screen:', s8?.screen);
  if (s8?.combat) {
    console.log('  combat.nodeType:', s8.combat.nodeType);
    console.log('  combat.turn:', s8.combat.turn);
    console.log('  enemies:', (s8.combat.enemies ?? []).map(e => ({ id: e.characterId, aura: e.auraCurrent })));
    console.log('  places:', (s8.combat.places ?? []).map(p => ({ id: p.placeId, res: p.resonanceCurrent })));
    console.log('  hq chars:', (s8.combat.hq ?? []).map(h => ({ id: h.characterId, isLeader: h.isLeader })));
    console.log('  deck count:', (s8.combat.deck ?? []).length);
    console.log('  victory:', s8.combat.victory);
  }

  console.log('\n=== FIN. Capturas en src/tests/screenshots/ ===');
  await browser.close();
}

run().catch(e => {
  console.error('ERROR FATAL:', e.message);
  console.error(e.stack);
  process.exit(1);
});
