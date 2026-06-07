/**
 * Verificación: combate jugable — HQ con cartas
 * node src/tests/verificacion_combate.cjs
 */
const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const BASE_URL  = 'http://localhost:5173';
const SHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

async function shot(page, name) {
  const f = path.join(SHOTS_DIR, `combat_${name}.png`);
  await page.screenshot({ path: f, fullPage: false });
  console.log(`  📸 combat_${name}.png`);
}

const errors = [];

async function navigateBack(page) {
  const menuBtn = page.getByText('← Menú');
  const backBtn = page.getByText('← Volver');
  if (await menuBtn.count().then(c => c > 0).catch(() => false)) {
    await menuBtn.click();
  } else if (await backBtn.count().then(c => c > 0).catch(() => false)) {
    await backBtn.click();
  }
  await page.waitForTimeout(400);
}

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 120 });
  const ctx     = await browser.newContext({ viewport: { width: 460, height: 900 } });
  const page    = await ctx.newPage();

  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  function flushErrors(label) {
    if (errors.length) {
      console.log(`  ❌ Errores @ ${label}:`, errors.map(e => e.slice(0, 200)));
    } else {
      console.log(`  ✅ Sin errores @ ${label}`);
    }
    errors.length = 0;
  }

  // ─── 1. Fresh start ──────────────────────────────────────────────────────────
  console.log('\n=== 1. Fresh start + login ===');
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(800);
  await page.getByText('JUGAR SIN CUENTA').click();
  await page.waitForTimeout(600);
  flushErrors('login');

  // ─── 2. Colección: verificar 7 sets ─────────────────────────────────────────
  console.log('\n=== 2. Colección: 7 sets ===');
  await page.getByText('COLECCIÓN / EDITOR').click();
  await page.waitForTimeout(500);
  await page.getByText('SETS').click();
  await page.waitForTimeout(500);
  await shot(page, '01_sets_screen');

  const setsText = await page.textContent('body');
  console.log(`  One Piece visible: ${setsText.includes('One Piece')}`);
  console.log(`  Dragon Ball visible: ${setsText.includes('Dragon Ball')}`);
  flushErrors('sets-screen');

  // Count total sets shown
  const setCount = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div'))
      .filter(d => {
        const s = d.getAttribute('style') || '';
        return s.includes('border') && s.includes('border-radius') && d.textContent.trim().length > 3
               && d.getBoundingClientRect().width > 150 && d.getBoundingClientRect().height > 40;
      }).length;
  });
  console.log(`  Elementos tipo set (aprox): ${setCount}`);

  // ─── 3. Volver al menú e iniciar aventura ────────────────────────────────────
  console.log('\n=== 3. Iniciar aventura con One Piece ===');
  await navigateBack(page);
  await page.waitForTimeout(300);
  await navigateBack(page);
  await page.waitForTimeout(300);

  await page.getByText('NUEVA AVENTURA').click();
  await page.waitForTimeout(700);

  // Seleccionar 2 sets cualesquiera
  const clickable = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div'))
      .filter(d => {
        const style = d.getAttribute('style') || '';
        return style.includes('cursor: pointer') && style.includes('border') &&
               d.textContent.trim().length > 5;
      })
      .map(d => {
        const r = d.getBoundingClientRect();
        return { text: d.textContent.trim().slice(0, 40).replace(/\s+/g,' '), rect: { x: r.x, y: r.y, w: r.width, h: r.height } };
      })
      .filter(d => d.rect.w > 100 && d.rect.h > 30 && d.rect.y > 50 && d.rect.y < 800);
  });

  // Try to click One Piece set, else first two
  const opEntry = clickable.find(c => c.text.includes('One Piece'));
  const firstTwo = clickable.slice(0, 2);
  const toSel = opEntry ? [opEntry, clickable.find((c,i) => i > 0 && c !== opEntry) || clickable[1]] : firstTwo;

  for (const c of toSel.filter(Boolean).slice(0, 2)) {
    await page.mouse.click(c.rect.x + c.rect.w/2, c.rect.y + c.rect.h/2);
    await page.waitForTimeout(300);
    console.log(`  ✔ Set: "${c.text.slice(0,25)}"`);
  }

  // CONTINUAR
  const cont = page.getByText('CONTINUAR →');
  if (await cont.evaluate(el => !el.disabled).catch(() => false)) {
    await cont.click();
    await page.waitForTimeout(600);
  }

  // Seleccionar 1 líder por set: primer y tercer resultado (índices 0 y 2)
  await page.waitForTimeout(400);
  const allLeaders = await page.evaluate(() =>
    Array.from(document.querySelectorAll('div'))
      .filter(d => {
        const s = d.getAttribute('style') || '';
        return s.includes('cursor: pointer') && d.textContent.match(/\d+\s*Aura/) &&
               d.getBoundingClientRect().width > 80;
      })
      .map(d => { const r = d.getBoundingClientRect(); return { cx: r.x+r.width/2, cy: r.y+r.height/2 }; })
  );
  // Pick one from first set and one from second: indices 0 and half
  const half = Math.floor(allLeaders.length / 2);
  const toClick = [allLeaders[0], allLeaders[half]].filter(Boolean);
  for (const c of toClick) {
    await page.mouse.click(c.cx, c.cy);
    await page.waitForTimeout(400);
  }

  // VER BARAJA
  const vb = page.getByText('VER BARAJA →');
  if (await vb.evaluate(el => !el.disabled).catch(() => false)) {
    await vb.click();
    await page.waitForTimeout(600);
  }

  // AL MAPA
  const mapa = page.getByText('¡AL MAPA!');
  if (await mapa.count().then(c => c > 0).catch(() => false)) {
    await mapa.click();
    await page.waitForTimeout(800);
  }

  // Click primer nodo
  const node = await page.evaluate(() => {
    const d = Array.from(document.querySelectorAll('div'))
      .find(d => {
        const s = d.getAttribute('style') || '';
        return s.includes('cursor: pointer') && s.includes('border') &&
               (d.textContent.includes('Combate') || d.textContent.includes('combat'));
      });
    if (!d) return null;
    const r = d.getBoundingClientRect();
    return { x: r.x+r.width/2, y: r.y+r.height/2, text: d.textContent.trim().slice(0,40) };
  });

  if (node) {
    console.log(`  Nodo: "${node.text}"`);
    await page.mouse.click(node.x, node.y);
    await page.waitForTimeout(900);
  }

  // ─── 4. Verificar HQ con cartas ──────────────────────────────────────────────
  console.log('\n=== 4. Combat — HQ con personajes ===');
  const bodyText = await page.textContent('body');
  console.log(`  En combate: ${bodyText.includes('HQ') && bodyText.includes('FOSO')}`);
  console.log(`  TU TURNO: ${bodyText.includes('TU TURNO')}`);
  flushErrors('enter-combat');

  await shot(page, '02_combat_initial');

  // Buscar sticky HQ y contar cartas
  const hqInfo = await page.evaluate(() => {
    const sticky = Array.from(document.querySelectorAll('div'))
      .find(d => {
        const s = d.getAttribute('style') || '';
        return s.includes('sticky') && s.includes('bottom: 0');
      });
    if (!sticky) return { found: false };
    const label = sticky.querySelector('div')?.textContent ?? '';
    const cards = Array.from(sticky.querySelectorAll('div'))
      .filter(d => {
        const s = d.getAttribute('style') || '';
        return s.includes('cursor') && s.includes('border') && s.includes('border-radius');
      });
    return { found: true, label, cardCount: cards.length, cardTexts: cards.map(c => c.textContent.trim().slice(0,15)) };
  });
  console.log(`  HQ sticky encontrado: ${hqInfo.found}`);
  console.log(`  Label HQ: "${hqInfo.label}"`);
  console.log(`  Cartas visibles: ${hqInfo.cardCount}`, hqInfo.cardTexts);

  flushErrors('hq-check');

  // ─── 5. Robar carta ──────────────────────────────────────────────────────────
  console.log('\n=== 5. Robar carta ===');
  const robar = page.getByText(/Robar/);
  if (await robar.evaluate(el => !el.disabled).catch(() => false)) {
    await robar.click();
    await page.waitForTimeout(600);
    const afterDraw = await page.textContent('body');
    // HQ should now have more cards
    const hqMatch = afterDraw.match(/HQ \((\d+)/);
    console.log(`  HQ tras robar: ${hqMatch ? hqMatch[0] : '?'}`);
    await shot(page, '03_after_draw');
    flushErrors('draw-card');
  } else {
    console.log('  Robar deshabilitado');
  }

  // ─── 6. Tocar carta → ActionPanel ────────────────────────────────────────────
  console.log('\n=== 6. Tocar carta en HQ → ActionPanel ===');
  const hqCard = await page.evaluate(() => {
    const sticky = Array.from(document.querySelectorAll('div'))
      .find(d => (d.getAttribute('style') || '').includes('sticky') && (d.getAttribute('style') || '').includes('bottom: 0'));
    if (!sticky) return null;
    const card = Array.from(sticky.querySelectorAll('div'))
      .find(d => {
        const s = d.getAttribute('style') || '';
        return s.includes('cursor: pointer') && s.includes('border') && s.includes('border-radius');
      });
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { x: r.x + r.width/2, y: r.y + r.height/2, text: card.textContent.trim().slice(0,20) };
  });

  if (hqCard) {
    console.log(`  Tocando carta: "${hqCard.text}"`);
    await page.mouse.click(hqCard.x, hqCard.y);
    await page.waitForTimeout(600);
    await shot(page, '04_action_panel');
    const actionText = await page.textContent('body');
    const panelVisible = actionText.includes('→ Foso') || actionText.includes('→ Lugar') || actionText.includes('Descansar') || actionText.includes('CONFRONTAR');
    console.log(`  ActionPanel visible: ${panelVisible}`);
    flushErrors('action-panel');

    if (panelVisible) {
      // Move to Foso
      const foso = page.getByText('→ Foso');
      if (await foso.count().then(c => c > 0).catch(() => false)) {
        await foso.click();
        await page.waitForTimeout(600);
        const fosoText = await page.textContent('body');
        const fosoFull = fosoText.match(/EL FOSO \((\d+)/);
        console.log(`  Tras mover al Foso: ${fosoFull ? fosoFull[0] : '?'}`);
        await shot(page, '05_moved_to_foso');
        flushErrors('move-foso');
      }
    }
  } else {
    console.log('  ⚠ No se encontró carta clickeable en HQ');
    await shot(page, '04_no_hq_card');
  }

  // ─── 7. Screenshot final ─────────────────────────────────────────────────────
  console.log('\n=== 7. Screenshot final ===');
  await shot(page, '06_combat_final');
  flushErrors('final');

  console.log('\n════════════════════════════════════════');
  console.log('VERIFICACIÓN COMBATE COMPLETA');
  console.log('Capturas: src/tests/screenshots/combat_*.png');
  console.log('════════════════════════════════════════');

  await browser.close();
}

run().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
