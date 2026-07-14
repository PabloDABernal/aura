/**
 * Capturas: Banco de Pruebas con sistema de pistas.
 * Capturas: banco_parpadeo_nivel.png, banco_bingo_nivel.png
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5300';
const DIR  = 'src/__tests__/screenshots';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TEST_CHAR = {
  id: 'banco-test-char', name: 'Banco Test', image: null, auraNumber: 17,
  grade: 5, status: 'active',
  passiveAbility: { id: 'p01', name: 'Vitalidad', description: '+1 vida', kind: 'passive', scope: 'general' },
  activeAbility:  { id: 'a01', name: 'Congelar',  description: 'Congela 3s', kind: 'active',  scope: 'general' },
  auraAbility:    { id: 'aa01', name: 'Resonancia', description: '+1 vida', kind: 'aura', scope: 'general' },
  failedRunsAtGrade: 0, temporalResidues: 0,
  probeProgress: {},
  stats: { runsCompleted: 0, runsFailed: 0, bestInfiniteScore: 0, hasCrown: false, crowns: 0, runHistory: [] },
};

// Click button by text via JS — case-insensitive substring match
async function clickByText(page, text, timeout = 5000) {
  const lower = text.toLowerCase();
  const end   = Date.now() + timeout;
  while (Date.now() < end) {
    const clicked = await page.evaluate((t) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn  = btns.find(b => b.textContent.toLowerCase().includes(t));
      if (btn) { btn.click(); return true; }
      return false;
    }, lower);
    if (clicked) { await sleep(350); return; }
    await sleep(200);
  }
  await page.screenshot({ path: `${DIR}/_debug.png` });
  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().slice(0, 50))
  );
  throw new Error(`Button "${text}" not found. Buttons: ${btns.join(' | ')}`);
}

async function setSlider(page, value) {
  await page.evaluate((val) => {
    const slider = Array.from(document.querySelectorAll('input[type="range"]'))
      .find(s => s.min === '0' && s.max === '20');
    if (!slider) throw new Error('Pistas slider not found');
    const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    desc.set.call(slider, String(val));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
  await sleep(200);
}

async function getSummaryText(page) {
  return page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const d = divs.find(el => {
      const t = el.textContent || '';
      return t.includes('·') && (
        t.includes('Objetivos') || t.includes('Aciertos') ||
        t.includes('Oscilaciones') || t.includes('Duración') && t.includes('Ciclo')
      );
    });
    return d ? d.textContent.trim() : '(no summary)';
  });
}

async function getAuraBoxText(page) {
  return page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const s = spans.find(el => el.textContent && el.textContent.startsWith('AURA:'));
    if (!s) return '(no aura box)';
    // Return parent container text to include sibling description span
    return s.parentElement ? s.parentElement.textContent.trim() : s.textContent.trim();
  });
}

async function setup(page) {
  // Load page, inject char, reload so zustand re-hydrates with the character
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sleep(400);
  await page.evaluate((char) => {
    const raw   = localStorage.getItem('aura-v2');
    const store = raw ? JSON.parse(raw) : { version: 4 };
    if (!store.state) store.state = {};
    store.state.characters = { ...store.state.characters, [char.id]: char };
    localStorage.setItem('aura-v2', JSON.stringify(store));
  }, TEST_CHAR);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(600);
  // Login if auth modal visible
  const sinCuenta = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some(b => b.textContent.includes('SIN CUENTA'));
  });
  if (sinCuenta) {
    await clickByText(page, 'SIN CUENTA');
    await sleep(1500);
  }
  // Navigate to Banco tab — use nav button specifically to avoid matching character names
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const btn  = btns.find(b => b.textContent.toLowerCase().includes('banco'));
    if (btn) btn.click();
  });
  await sleep(1000);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const CHECKS  = [];

  // ── PARPADEO ──────────────────────────────────────────────────────────────
  {
    const page = await ctx.newPage();
    await setup(page);

    // Select character "Banco Test" (has auraNumber 17)
    const charVisible = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.includes('Banco Test'));
    });
    if (charVisible) await clickByText(page, 'Banco Test');

    // Expand Parpadeo
    await clickByText(page, 'Parpadeo');

    const aura = await getAuraBoxText(page);
    console.log('AuraBox:', aura);
    CHECKS.push({ label: 'parpadeo AuraBox muestra #17',  pass: aura.includes('#17') });
    CHECKS.push({ label: 'parpadeo AuraBox dice ±2',       pass: aura.includes('±2') });

    // Nivel 0
    const s0 = await getSummaryText(page);
    console.log('Parpadeo 0:', s0);
    CHECKS.push({ label: 'parpadeo 0 duración 10s',  pass: s0.includes('10s') });
    CHECKS.push({ label: 'parpadeo 0 ciclo 10cs',    pass: s0.includes('Ciclo 10cs') });

    // Nivel 8
    await setSlider(page, 8);
    const s8 = await getSummaryText(page);
    console.log('Parpadeo 8:', s8);
    CHECKS.push({ label: 'parpadeo 8 duración 3s',   pass: s8.includes('Duración 3s') });
    CHECKS.push({ label: 'parpadeo 8 ciclo 20cs',    pass: s8.includes('Ciclo 20cs') });

    // Nivel 10
    await setSlider(page, 10);
    const s10 = await getSummaryText(page);
    console.log('Parpadeo 10:', s10);
    CHECKS.push({ label: 'parpadeo 10 ciclo 50cs',   pass: s10.includes('Ciclo 50cs') });

    // Nivel 20
    await setSlider(page, 20);
    const s20 = await getSummaryText(page);
    console.log('Parpadeo 20:', s20);
    CHECKS.push({ label: 'parpadeo 20 margen ±0',    pass: s20.includes('Margen ±0') });

    await page.screenshot({ path: `${DIR}/banco_parpadeo_nivel.png` });
    console.log('✓ banco_parpadeo_nivel.png');
    await page.close();
  }

  // ── BINGO ─────────────────────────────────────────────────────────────────
  {
    const page = await ctx.newPage();
    await setup(page);

    const charVisible = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.includes('Banco Test'));
    });
    if (charVisible) await clickByText(page, 'Banco Test');

    await clickByText(page, 'Bingo');

    const b0 = await getSummaryText(page);
    console.log('Bingo 0:', b0);
    CHECKS.push({ label: 'bingo 0 objetivos=3',   pass: b0.includes('Objetivos 3') });
    CHECKS.push({ label: 'bingo 0 margen=±3',     pass: b0.includes('Margen ±3') });
    CHECKS.push({ label: 'bingo 0 tiempo=20s',    pass: b0.includes('Tiempo 20s') });
    CHECKS.push({ label: 'bingo 0 paradas=20',    pass: b0.includes('Paradas 20') });

    await setSlider(page, 20);
    const b20 = await getSummaryText(page);
    console.log('Bingo 20:', b20);
    CHECKS.push({ label: 'bingo 20 objetivos=10', pass: b20.includes('Objetivos 10') });
    CHECKS.push({ label: 'bingo 20 margen=±0',    pass: b20.includes('Margen ±0') });
    CHECKS.push({ label: 'bingo 20 tiempo=10s',   pass: b20.includes('Tiempo 10s') });
    CHECKS.push({ label: 'bingo 20 paradas=10',   pass: b20.includes('Paradas 10') });

    await page.screenshot({ path: `${DIR}/banco_bingo_nivel.png` });
    console.log('✓ banco_bingo_nivel.png');
    await page.close();
  }

  // ── Resultado ──────────────────────────────────────────────────────────────
  let allPass = true;
  console.log('\n── Verificaciones ──');
  for (const c of CHECKS) {
    const icon = c.pass ? '✓' : '✗';
    console.log(`${icon} ${c.label}`);
    if (!c.pass) allPass = false;
  }

  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
