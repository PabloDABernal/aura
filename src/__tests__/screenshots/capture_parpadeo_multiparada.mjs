/**
 * Verifica ParpadeoProbe multi-parada.
 * Captura parpadeo_multiparada.png.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5300';
const DIR  = 'src/__tests__/screenshots';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TEST_CHAR = {
  id: 'parpadeo-mp-char', name: 'MP Test', image: null, auraNumber: 17,
  grade: 5, status: 'active',
  passiveAbility: { id: 'p01', name: 'V', description: 'd', kind: 'passive', scope: 'general' },
  activeAbility:  { id: 'a01', name: 'A', description: 'd', kind: 'active',  scope: 'general' },
  auraAbility:    { id: 'aa01', name: 'R', description: 'd', kind: 'aura',    scope: 'general' },
  failedRunsAtGrade: 0, temporalResidues: 0,
  probeProgress: {},
  stats: { runsCompleted: 0, runsFailed: 0, bestInfiniteScore: 0, hasCrown: false, crowns: 0, runHistory: [] },
};

// Reads "PARADAS: X/Y" from body text → returns { left: X, total: Y } or null
function getStops(page) {
  return page.evaluate(() => {
    const m = document.body.textContent.match(/PARADAS:\s*(\d+)\/(\d+)/);
    return m ? { left: Number(m[1]), total: Number(m[2]) } : null;
  });
}

function hasButton(page, text) {
  return page.evaluate((t) =>
    Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes(t))
  , text);
}

function clickButton(page, text) {
  return page.evaluate((t) => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(t));
    if (btn) { btn.click(); return true; }
    return false;
  }, text);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page    = await ctx.newPage();

  page.on('console', msg => { if (msg.type() === 'error') console.log('[ERR]', msg.text().slice(0, 120)); });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sleep(300);

  await page.evaluate((c) => {
    const raw   = localStorage.getItem('aura-v2');
    const store = raw ? JSON.parse(raw) : { version: 5 };
    if (!store.state) store.state = {};
    store.state.characters = { ...store.state.characters, [c.id]: c };
    store.state.auth = { user: null, playLocal: true };
    localStorage.setItem('aura-v2', JSON.stringify(store));
  }, TEST_CHAR);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(700);

  // Banco tab
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('nav button'))
      .find(b => b.textContent.toLowerCase().includes('banco'))?.click();
  });
  await sleep(800);

  // Select MP Test, expand Parpadeo, click PROBAR
  await clickButton(page, 'MP Test');  await sleep(200);
  await clickButton(page, 'Parpadeo'); await sleep(400);
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('PROBAR'))[0]?.click();
  });
  await sleep(600);

  // EMPEZAR
  const started = await clickButton(page, 'EMPEZAR');
  console.log('EMPEZAR:', started);
  await sleep(400);

  const CHECKS = [];
  CHECKS.push({ label: 'EMPEZAR clicado', pass: started });

  // Read counter
  const s0 = await getStops(page);
  console.log('Stops inicial:', s0);
  CHECKS.push({ label: 'Contador PARADAS visible', pass: s0 !== null });
  CHECKS.push({ label: 'Paradas iniciales = 10/10', pass: s0?.left === 10 && s0?.total === 10 });

  const hasParar = await hasButton(page, 'PARAR');
  console.log('PARAR visible:', hasParar);
  CHECKS.push({ label: 'PARAR visible (running)', pass: hasParar });

  if (hasParar) {
    // Stop 1
    await clickButton(page, 'PARAR');
    await sleep(1000); // wait past 700ms feedback window

    const s1    = await getStops(page);
    const hasPar1 = await hasButton(page, 'PARAR');
    const done1   = await hasButton(page, 'REINTENTAR');
    console.log('Tras PARAR 1 — stops:', s1, '| PARAR:', hasPar1, '| done/REINTENTAR:', done1);

    if (hasPar1) {
      // Miss confirmed — probe kept running
      CHECKS.push({ label: 'Miss: probe continúa (PARAR sigue)', pass: true });
      CHECKS.push({ label: 'Paradas decrementaron a 9/10', pass: s1?.left === 9 && s1?.total === 10 });

      // Stop 2
      await clickButton(page, 'PARAR');
      await sleep(1000);
      const s2 = await getStops(page);
      const hasPar2 = await hasButton(page, 'PARAR');
      console.log('Tras PARAR 2 — stops:', s2, '| PARAR:', hasPar2);
      if (hasPar2) {
        CHECKS.push({ label: 'Paradas decrementaron a 8/10 tras 2do miss', pass: s2?.left === 8 && s2?.total === 10 });
      }
    } else if (done1) {
      // Succeeded on first stop (lucky hit) — also valid
      CHECKS.push({ label: 'Acierto en 1er intento (válido: range 50cs amplio)', pass: true });
      CHECKS.push({ label: 'N/A — éxito inmediato', pass: true });
    } else {
      CHECKS.push({ label: 'Miss: probe continúa (PARAR sigue)', pass: false });
      CHECKS.push({ label: 'Paradas decrementaron a 9/10', pass: false });
    }
  }

  await page.screenshot({ path: `${DIR}/parpadeo_multiparada.png` });
  console.log('✓ parpadeo_multiparada.png');

  console.log('\n── Verificaciones ──');
  let allPass = true;
  for (const c of CHECKS) {
    console.log(`${c.pass ? '✓' : '✗'} ${c.label}`);
    if (!c.pass) allPass = false;
  }

  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
