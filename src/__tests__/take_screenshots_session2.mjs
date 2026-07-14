import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:5185';
const OUT = path.join(__dirname, 'screenshots');

// Store state with:
// - char1: passive p01 (+1 vida), grade 2
// - char2: active a04 (+15s), grade 3
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
        ability: { id: 'a04', type: 'active', name: 'Tiempo extra', description: '+15 segundos al tiempo límite de la prueba actual' },
        auraAbility: { id: 'aa04', name: 'Tiempo bonus', description: '+5 segundos al tiempo límite de la prueba actual' },
        stats: { runsCompleted: 4, runsFailed: 1, hasCrown: false, bestInfiniteScore: 0, runHistory: [] },
      },
    },
    usedAuraNumbers: [7, 42],
    usedAbilityIds:  ['p01', 'a04'],
    activeRun: null,
    meta: { version: '2.1' },
    auth: {},
  },
  version: 1,
};

// State with active run (for RunScreen screenshot)
const STATE_RUN = {
  state: {
    ...STATE_HOME.state,
    activeRun: {
      characterId:     'char-p01',
      currentProbe:    3,
      lives:           4,
      maxLives:        4,
      activeEcos:      [],
      probeSequence:   ['bingo','xopportunities','suma100','bingo','cadena','xopportunities','bingo','suma100','cadena','bingo'],
      probeHistory:    [
        { probeIndex: 0, probeType: 'bingo', result: 'pass', auraTriggered: false },
        { probeIndex: 1, probeType: 'xopportunities', result: 'pass', auraTriggered: false },
      ],
      infiniteMode:    false,
      infiniteScore:   0,
      status:          'active',
      abilityUsed:     false,
      activeAbilityEffect: null,
      activeAuraEffect:    null,
      firstFailFree:   false,
      secondAirUsed:   false,
      flowMarginBonus: 0,
    },
  },
  version: 1,
};

// State for life-lost scenario
const STATE_LIFE_LOST = {
  state: {
    ...STATE_HOME.state,
    activeRun: {
      ...STATE_RUN.state.activeRun,
      lives: 2,
      maxLives: 4,
      probeHistory: [
        { probeIndex: 0, probeType: 'bingo', result: 'pass', auraTriggered: false },
        { probeIndex: 1, probeType: 'xopportunities', result: 'fail', auraTriggered: false },
      ],
    },
  },
  version: 1,
};

const browser = await chromium.launch({ headless: true });

async function shot(state, route, filename, delay = 800) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, state);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  if (route === 'run') {
    // Navigate to run screen: the activeRun is set in store, we need app to navigate
    // App reads activeRun and should go to run screen via main app logic
    // Wait for the run screen to appear
    await page.waitForTimeout(delay);
  }
  await page.waitForTimeout(delay);
  const out = path.join(OUT, filename);
  await page.screenshot({ path: out });
  console.log('Saved:', out);
  await ctx.close();
}

// Screenshot 1: HomeScreen glow-up with 2 characters (grade 2 + grade 5)
await shot(STATE_HOME, 'home', 'home_glowup.png');

// Screenshot 2: HomeScreen showing the character modal open
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, STATE_HOME);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  // Click on first character card
  const cards = await page.locator('button').all();
  // Find card by tapping on character area
  await page.mouse.click(60, 220); // approximate position of first char card
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'home_char_modal.png') });
  console.log('Saved: home_char_modal.png');
  await ctx.close();
}

// Screenshot 3: RunScreen with character panel
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, STATE_RUN);
  const page = await ctx.newPage();
  // Need to trigger navigation to run screen
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'run_charPanel.png') });
  console.log('Saved: run_charPanel.png');
  await ctx.close();
}

// Screenshot 4: RunScreen at 2 lives (shows missing heart)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, STATE_LIFE_LOST);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'run_lives_2.png') });
  console.log('Saved: run_lives_2.png');
  await ctx.close();
}

// Screenshot 5: CharacterCreator with enhanced grid
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((s) => { localStorage.setItem('aura-v2', JSON.stringify(s)); }, STATE_HOME);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  // Click FAB button to go to creator
  await page.click('button:has-text("+")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'creator_grid.png') });
  console.log('Saved: creator_grid.png');
  await ctx.close();
}

await browser.close();
console.log('All screenshots done.');
