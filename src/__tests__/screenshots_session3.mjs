import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:5186';
const OUT = path.join(__dirname, 'screenshots');

const STATE_HOME = {
  state: {
    characters: {
      'char-p01': {
        id: 'char-p01', name: 'Kira', status: 'active', auraNumber: 7, grade: 2,
        ability: { id: 'p01', type: 'passive', name: 'Vitalidad', description: '+1 vida al empezar la run' },
        auraAbility: { id: 'aa01', name: 'Revive', description: 'Recupera 1 vida' },
        stats: { runsCompleted: 1, runsFailed: 0, hasCrown: false, bestInfiniteScore: 0, runHistory: [] },
      },
      'char-a04': {
        id: 'char-a04', name: 'Zephyr', status: 'active', auraNumber: 42, grade: 5,
        ability: { id: 'a04', type: 'active', name: 'Tiempo extra', description: '+15 segundos al tiempo límite' },
        auraAbility: { id: 'aa04', name: 'Tiempo bonus', description: '+5 segundos' },
        stats: { runsCompleted: 4, runsFailed: 1, hasCrown: false, bestInfiniteScore: 0, runHistory: [] },
      },
      'char-arch': {
        id: 'char-arch', name: 'Archivado', status: 'archived', auraNumber: 15, grade: 3,
        ability: { id: 'p02', type: 'passive', name: 'Precisión', description: '+5 margen' },
        auraAbility: { id: 'aa02', name: 'Recarga', description: 'Habilidad lista de nuevo' },
        stats: { runsCompleted: 2, runsFailed: 3, hasCrown: false, bestInfiniteScore: 0, runHistory: [] },
      },
    },
    usedAuraNumbers: [7, 42, 15],
    usedAbilityIds:  ['a04'],
    activeRun: null,
    meta: { version: '2.1', collectionLevel: 5 },
    auth: {},
  },
  version: 1,
};

const STATE_RUN = {
  state: {
    ...STATE_HOME.state,
    activeRun: {
      characterId: 'char-p01',
      currentProbe: 3,
      lives: 3,
      maxLives: 4,
      activeEcos: [],
      probeSequence: ['bingo','xopportunities','suma100','bingo','cadena','xopportunities','bingo','suma100','cadena','bingo'],
      probeHistory: [
        { probeIndex: 0, probeType: 'bingo', result: 'pass', auraTriggered: false },
        { probeIndex: 1, probeType: 'xopportunities', result: 'pass', auraTriggered: false },
      ],
      infiniteMode: false,
      infiniteScore: 0,
      status: 'active',
      abilityUsed: false,
      activeAbilityEffect: null,
      activeAuraEffect: null,
      firstFailFree: false,
      secondAirUsed: false,
      flowMarginBonus: 0,
    },
  },
  version: 1,
};

const browser = await chromium.launch({ headless: true });

async function shot(state, filename, delay = 900) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, state);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(delay);
  const out = path.join(OUT, filename);
  await page.screenshot({ path: out });
  console.log('Saved:', out);
  await ctx.close();
  return page;
}

// Screenshot 1: HomeScreen Run tab (default)
await shot(STATE_HOME, 'home_run_tab.png');

// Screenshot 2: HomeScreen Personajes tab
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, STATE_HOME);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  // Click Personajes tab (2nd tab)
  const tabs = await page.locator('nav button').all();
  if (tabs[1]) await tabs[1].click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'home_chars_tab.png') });
  console.log('Saved: home_chars_tab.png');
  await ctx.close();
}

// Screenshot 3: HomeScreen Banco tab
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, STATE_HOME);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const tabs = await page.locator('nav button').all();
  if (tabs[2]) await tabs[2].click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'home_bank_tab.png') });
  console.log('Saved: home_bank_tab.png');
  await ctx.close();
}

// Screenshot 4: HomeScreen Ajustes tab
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, STATE_HOME);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const tabs = await page.locator('nav button').all();
  if (tabs[3]) await tabs[3].click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'home_settings_tab.png') });
  console.log('Saved: home_settings_tab.png');
  await ctx.close();
}

// Screenshot 5: RunScreen with exit button visible
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, STATE_RUN);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'run_exit_button.png') });
  console.log('Saved: run_exit_button.png');
  await ctx.close();
}

// Screenshot 6: RunScreen exit modal open
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, STATE_RUN);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  // Click the ✕ Salir button
  const exitBtn = page.locator('button:has-text("✕ Salir")');
  if (await exitBtn.count() > 0) {
    await exitBtn.first().click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(OUT, 'run_exit_modal.png') });
  console.log('Saved: run_exit_modal.png');
  await ctx.close();
}

// Screenshot 7: CharacterCreator with URL input
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, STATE_HOME);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  // Click FAB button
  const fab = page.locator('button:has-text("+")');
  if (await fab.count() > 0) {
    await fab.first().click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(OUT, 'creator_url_input.png') });
  console.log('Saved: creator_url_input.png');
  await ctx.close();
}

await browser.close();
console.log('All screenshots done.');
