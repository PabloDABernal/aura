/**
 * Verificación: MainMenuScreen + navegación completa
 * node src/tests/verificacion_menu.cjs
 */
const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const BASE_URL  = 'http://localhost:5173';
const SHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

async function shot(page, name) {
  const f = path.join(SHOTS_DIR, `menu_${name}.png`);
  await page.screenshot({ path: f, fullPage: true });
  console.log(`  📸 menu_${name}.png`);
}

const errors = [];

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

  // ─── 1. Login → main-menu ────────────────────────────────────────────────
  console.log('\n=== 1. Login → MainMenuScreen ===');
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(800);

  await page.getByText('JUGAR SIN CUENTA').click();
  await page.waitForTimeout(600);
  await shot(page, '01_main_menu');

  const bodyText = await page.textContent('body');
  const hasNuevaAventura  = bodyText.includes('NUEVA AVENTURA');
  const hasColeccion      = bodyText.includes('COLECCIÓN');
  const hasPerfil         = bodyText.includes('PERFIL');
  console.log(`  NUEVA AVENTURA: ${hasNuevaAventura}`);
  console.log(`  COLECCIÓN: ${hasColeccion}`);
  console.log(`  PERFIL: ${hasPerfil}`);
  flushErrors('main-menu');

  // ─── 2. COLECCIÓN → collection-menu → ← Menú ────────────────────────────
  console.log('\n=== 2. COLECCIÓN → CollectionMenu → ← Menú ===');
  await page.getByText('COLECCIÓN / EDITOR').click();
  await page.waitForTimeout(500);
  await shot(page, '02_collection_menu');

  const colText = await page.textContent('body');
  console.log(`  En CollectionMenu: ${colText.includes('COLECCIONISTA')}`);
  console.log(`  Botón ← Menú: ${colText.includes('← Menú')}`);
  flushErrors('collection-menu');

  await page.getByText('← Menú').click();
  await page.waitForTimeout(400);
  const backFromCol = await page.textContent('body');
  console.log(`  Volvió a main-menu: ${backFromCol.includes('NUEVA AVENTURA') || backFromCol.includes('CONTINUAR')}`);
  flushErrors('back-from-collection');

  // ─── 3. PERFIL → ← Menú ─────────────────────────────────────────────────
  console.log('\n=== 3. PERFIL → ← Menú ===');
  await page.getByText('PERFIL').click();
  await page.waitForTimeout(500);
  await shot(page, '03_profile');
  const perfText = await page.textContent('body');
  console.log(`  En Perfil: ${perfText.includes('PERFIL')}`);
  console.log(`  Botón ← Menú: ${perfText.includes('← Menú')}`);
  flushErrors('profile');

  await page.getByText('← Menú').click();
  await page.waitForTimeout(400);
  flushErrors('back-from-profile');

  // ─── 4. ESTADÍSTICAS → ← Menú ───────────────────────────────────────────
  console.log('\n=== 4. ESTADÍSTICAS → ← Menú ===');
  await page.getByText('ESTADÍSTICAS').click();
  await page.waitForTimeout(500);
  const statsText = await page.textContent('body');
  console.log(`  En Stats: ${statsText.includes('ESTADÍSTICAS')}`);
  console.log(`  Botón ← Menú: ${statsText.includes('← Menú')}`);
  flushErrors('stats');

  await page.getByText('← Menú').click();
  await page.waitForTimeout(400);
  flushErrors('back-from-stats');

  // ─── 5. LOGROS → ← Menú ─────────────────────────────────────────────────
  console.log('\n=== 5. LOGROS → ← Menú ===');
  await page.getByText('LOGROS').click();
  await page.waitForTimeout(500);
  const logrosText = await page.textContent('body');
  console.log(`  En Logros: ${logrosText.includes('LOGROS')}`);
  console.log(`  Botón ← Menú: ${logrosText.includes('← Menú')}`);
  flushErrors('achievements');

  await page.getByText('← Menú').click();
  await page.waitForTimeout(400);
  flushErrors('back-from-achievements');

  // ─── 6. NUEVA AVENTURA → set-selection → ... → map ──────────────────────
  console.log('\n=== 6. NUEVA AVENTURA → set-selection → map ===');
  await page.getByText('NUEVA AVENTURA').click();
  await page.waitForTimeout(600);
  await shot(page, '06_set_selection');
  const setSelText = await page.textContent('body');
  console.log(`  En SetSelection: ${setSelText.includes('SETS') || setSelText.includes('set')}`);
  flushErrors('set-selection');

  // Seleccionar 2 sets
  const setCards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div'))
      .filter(d => {
        const style = d.getAttribute('style') || '';
        return style.includes('cursor: pointer') && style.includes('border') &&
               d.textContent.trim().length > 5 && d.textContent.trim().length < 300;
      })
      .map(d => {
        const r = d.getBoundingClientRect();
        return { text: d.textContent.trim().slice(0, 40).replace(/\s+/g,''), rect: { x: r.x, y: r.y, w: r.width, h: r.height } };
      })
      .filter(d => d.rect.w > 100 && d.rect.h > 30 && d.rect.y > 50);
  });

  const toClick = setCards.length >= 4 ? [setCards[2], setCards[3]] : setCards.slice(0, 2);
  for (const c of toClick) {
    await page.mouse.click(c.rect.x + c.rect.w / 2, c.rect.y + c.rect.h / 2);
    await page.waitForTimeout(300);
    console.log(`  ✔ Set: "${c.text.slice(0, 25)}"`);
  }

  const contBtn = page.getByText('CONTINUAR →');
  if (await contBtn.evaluate(el => !el.disabled).catch(() => false)) {
    await contBtn.click();
    await page.waitForTimeout(600);
  }

  // Seleccionar líderes
  const leaderCards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div'))
      .filter(d => {
        const style = d.getAttribute('style') || '';
        return style.includes('cursor: pointer') && d.textContent.match(/\d+ Aura/) &&
               d.getBoundingClientRect().width > 100;
      })
      .slice(0, 2)
      .map(d => {
        const r = d.getBoundingClientRect();
        return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
      });
  });

  for (const c of leaderCards) {
    await page.mouse.click(c.cx, c.cy);
    await page.waitForTimeout(300);
  }

  const verBarajaBtn = page.getByText('VER BARAJA →');
  if (await verBarajaBtn.evaluate(el => !el.disabled).catch(() => false)) {
    await verBarajaBtn.click();
    await page.waitForTimeout(600);
  }

  const alMapaBtn = page.getByText('¡AL MAPA!');
  if (await alMapaBtn.count().then(c => c > 0).catch(() => false)) {
    await alMapaBtn.click();
    await page.waitForTimeout(800);
  }

  await shot(page, '07_map');
  const mapText = await page.textContent('body');
  console.log(`  En Map: ${mapText.includes('Área')}`);
  console.log(`  Botón ← Menú (run guardada): ${mapText.includes('← Menú (run guardada)')}`);
  flushErrors('map');

  // ─── 7. ← Menú desde mapa → main-menu con CONTINUAR AVENTURA ─────────────
  console.log('\n=== 7. ← Menú (run guardada) → main-menu CONTINUAR ===');
  await page.getByText('← Menú (run guardada)').click();
  await page.waitForTimeout(500);
  await shot(page, '08_main_menu_with_run');

  const mainWithRun = await page.textContent('body');
  console.log(`  CONTINUAR AVENTURA: ${mainWithRun.includes('CONTINUAR AVENTURA')}`);
  console.log(`  Info área/nodo: ${mainWithRun.includes('Área') && mainWithRun.includes('Nodo')}`);
  console.log(`  Abandonar aventura: ${mainWithRun.includes('Abandonar aventura')}`);
  flushErrors('main-menu-with-run');

  // ─── 8. CONTINUAR AVENTURA → vuelve al mapa ──────────────────────────────
  console.log('\n=== 8. CONTINUAR AVENTURA → mapa ===');
  await page.getByText('CONTINUAR AVENTURA').click();
  await page.waitForTimeout(500);
  const backOnMap = await page.textContent('body');
  console.log(`  Volvió al mapa: ${backOnMap.includes('Área')}`);
  flushErrors('continuar-aventura');

  console.log('\n═══════════════════════════════════');
  console.log('VERIFICACIÓN COMPLETA');
  console.log('Capturas: src/tests/screenshots/menu_*.png');
  console.log('═══════════════════════════════════');

  await browser.close();
}

run().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
