import { chromium } from 'playwright';

const BASE = 'http://localhost:5300';
const DIR  = 'src/__tests__/screenshots';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TEST_CHAR = {
  id: 'aura-verify-99', name: 'Verify99', image: null, auraNumber: 99,
  grade: 3, status: 'active',
  passiveAbility: { id: 'p01', name: 'V', description: 'd', kind: 'passive', scope: 'general' },
  activeAbility:  { id: 'a01', name: 'A', description: 'd', kind: 'active',  scope: 'general' },
  auraAbility:    { id: 'aa01', name: 'R', description: 'd', kind: 'aura',    scope: 'general' },
  failedRunsAtGrade: 0, temporalResidues: 0,
  probeProgress: {},
  stats: { runsCompleted: 0, runsFailed: 0, bestInfiniteScore: 0, hasCrown: false, crowns: 0, runHistory: [] },
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page    = await ctx.newPage();

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sleep(400);
  await page.evaluate((c) => {
    const raw = localStorage.getItem('aura-v2');
    const store = raw ? JSON.parse(raw) : { version: 4 };
    if (!store.state) store.state = {};
    store.state.characters = { ...store.state.characters, [c.id]: c };
    localStorage.setItem('aura-v2', JSON.stringify(store));
  }, TEST_CHAR);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(600);

  // Login if needed
  const sinCuenta = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('SIN CUENTA'))
  );
  if (sinCuenta) {
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('SIN CUENTA'))?.click();
    });
    await sleep(1500);
  }

  // Banco tab via nav
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('nav button'))
      .find(b => b.textContent.toLowerCase().includes('banco'))?.click();
  });
  await sleep(1000);

  // Select Verify99 character
  const charBtn = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Verify99'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('Char selected:', charBtn);
  await sleep(400);

  // Expand Bingo (first catalog probe, has PISTAS badge)
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('Bingo'));
    btn?.click();
  });
  await sleep(500);

  const auraText = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const s = spans.find(el => el.textContent?.startsWith('AURA:'));
    return s ? s.parentElement?.textContent?.trim() ?? s.textContent.trim() : '(no aura box)';
  });
  console.log('AuraBox:', auraText);

  const CHECKS = [
    { label: 'AuraBox visible',     pass: auraText !== '(no aura box)' },
    { label: 'Muestra #99',         pass: auraText.includes('#99') },
    { label: 'Parar en .99',        pass: auraText.includes('.99') },
    { label: 'No contiene .42',     pass: !auraText.includes('.42') },
    { label: '+1 al margen bingo',  pass: auraText.includes('+1 al margen') },
  ];

  await page.screenshot({ path: `${DIR}/aura_coherente.png` });
  console.log('✓ aura_coherente.png');

  console.log('\n── Verificaciones ──');
  let allPass = true;
  for (const c of CHECKS) {
    console.log(`${c.pass ? '✓' : '✗'} ${c.label}`);
    if (!c.pass) allPass = false;
  }

  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
