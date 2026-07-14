/**
 * Capturas: Práctica con sistema de pistas.
 * Verifica que el slider de nivel cambia el config summary en vivo.
 * Capturas: parpadeo_pistas.png, bingo_nivel0.png, bingo_nivel20.png
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5300';
const DIR  = 'src/__tests__/screenshots';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TEST_CHAR = {
  id: 'pistas-test-char', name: 'Pistas Test', image: null, auraNumber: 42,
  grade: 5, status: 'active',
  passiveAbility: { id: 'p01', name: 'Vitalidad', description: '+1 vida', kind: 'passive', scope: 'general' },
  activeAbility:  { id: 'a01', name: 'Congelar',  description: 'Congela 3s', kind: 'active',  scope: 'general' },
  auraAbility:    { id: 'aa01', name: 'Resonancia', description: '+1 vida', kind: 'aura',  scope: 'general' },
  failedRunsAtGrade: 0, temporalResidues: 0,
  probeProgress: {},
  stats: { runsCompleted: 0, runsFailed: 0, bestInfiniteScore: 0, hasCrown: false, crowns: 0, runHistory: [] },
};

async function injectChar(page) {
  await page.evaluate((char) => {
    const existing = localStorage.getItem('aura-v2');
    const store = existing ? JSON.parse(existing) : { version: 4 };
    if (!store.state) store.state = {};
    store.state.characters = { ...store.state.characters, [char.id]: char };
    localStorage.setItem('aura-v2', JSON.stringify(store));
  }, TEST_CHAR);
}

async function loginIfNeeded(page) {
  const btn = page.locator('button').filter({ hasText: 'SIN CUENTA' });
  if (await btn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await btn.click();
    await sleep(1800);
  }
}

async function goToPractice(page) {
  await page.locator('button').filter({ hasText: 'Práctica' }).click();
  await sleep(800);
}

async function setSlider(page, value) {
  await page.evaluate((val) => {
    const slider = document.getElementById('pistas-level-slider');
    if (!slider) throw new Error('Slider #pistas-level-slider not found');
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    descriptor.set.call(slider, String(val));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
  await sleep(250);
}

async function getSummary(page) {
  return page.$eval('#config-summary', el => el.textContent).catch(() => '(no summary)');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: { width: 390, height: 844 } });

  const CHECKS = [];

  // ── PARPADEO — niveles 0, 8, 10, 20 ──────────────────────────────────────
  {
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await sleep(600);
    await injectChar(page);
    await loginIfNeeded(page);
    await goToPractice(page);

    // Select Parpadeo
    await page.locator('text=PARPADEO').first().click({ force: true });
    await sleep(400);

    await setSlider(page, 0);
    const p0 = await getSummary(page);
    console.log('Parpadeo 0:', p0);
    CHECKS.push({ label: 'parpadeo 0 duración=10s',    pass: p0.includes('10s') });
    CHECKS.push({ label: 'parpadeo 0 ciclo=10cs',      pass: p0.includes('Ciclo 10cs') });

    await setSlider(page, 8);
    const p8 = await getSummary(page);
    console.log('Parpadeo 8:', p8);
    CHECKS.push({ label: 'parpadeo 8 duración=3s',     pass: p8.includes('Duración 3s') });
    CHECKS.push({ label: 'parpadeo 8 ciclo=20cs',      pass: p8.includes('Ciclo 20cs') });

    await setSlider(page, 10);
    const p10 = await getSummary(page);
    console.log('Parpadeo 10:', p10);
    CHECKS.push({ label: 'parpadeo 10 ciclo=50cs',     pass: p10.includes('Ciclo 50cs') });

    await setSlider(page, 20);
    const p20 = await getSummary(page);
    console.log('Parpadeo 20:', p20);
    CHECKS.push({ label: 'parpadeo 20 duración=3s',    pass: p20.includes('Duración 3s') });
    CHECKS.push({ label: 'parpadeo 20 ciclo=50cs',     pass: p20.includes('Ciclo 50cs') });
    CHECKS.push({ label: 'parpadeo 20 margen=0',       pass: p20.includes('Margen ±0') });

    await page.screenshot({ path: `${DIR}/parpadeo_pistas.png` });
    console.log('✓ parpadeo_pistas.png');
    await page.close();
  }

  // ── BINGO — nivel 0 ────────────────────────────────────────────────────────
  {
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await sleep(600);
    await injectChar(page);
    await loginIfNeeded(page);
    await goToPractice(page);

    await page.locator('text=BINGO').first().click({ force: true });
    await sleep(400);

    await setSlider(page, 0);
    const b0 = await getSummary(page);
    console.log('Bingo 0:', b0);
    CHECKS.push({ label: 'bingo 0 objetivos=3',    pass: b0.includes('Objetivos 3') });
    CHECKS.push({ label: 'bingo 0 margen=±3',      pass: b0.includes('Margen ±3') });
    CHECKS.push({ label: 'bingo 0 tiempo=20s',     pass: b0.includes('Tiempo 20s') });
    CHECKS.push({ label: 'bingo 0 paradas=20',     pass: b0.includes('Paradas 20') });

    await page.screenshot({ path: `${DIR}/bingo_nivel0.png` });
    console.log('✓ bingo_nivel0.png');

    await setSlider(page, 20);
    const b20 = await getSummary(page);
    console.log('Bingo 20:', b20);
    CHECKS.push({ label: 'bingo 20 objetivos=10',  pass: b20.includes('Objetivos 10') });
    CHECKS.push({ label: 'bingo 20 margen=±0',     pass: b20.includes('Margen ±0') });
    CHECKS.push({ label: 'bingo 20 tiempo=10s',    pass: b20.includes('Tiempo 10s') });
    CHECKS.push({ label: 'bingo 20 paradas=10',    pass: b20.includes('Paradas 10') });

    await page.screenshot({ path: `${DIR}/bingo_nivel20.png` });
    console.log('✓ bingo_nivel20.png');
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
}

main().catch(e => { console.error(e); process.exit(1); });
