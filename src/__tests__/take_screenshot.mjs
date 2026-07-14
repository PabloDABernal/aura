import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STATE = {
  state: {
    characters: {
      'char-01': {
        id: 'char-01', name: 'Kira', status: 'active', auraNumber: 7, grade: 2,
        ability: { id: 'p02', type: 'passive', name: 'Puntería', description: '+5 centésimas de margen' },
        auraAbility: { id: 'a07', name: 'Tiempo Borroso', description: 'Las pruebas ciegas muestran el timer 1s más.' },
        stats: { runsCompleted: 1, runsFailed: 0, hasCrown: false, bestInfiniteScore: 0, runHistory: [] },
      },
    },
    usedAuraNumbers: [7],
    usedAbilityIds:  ['p02'],
    activeRun: null,
    meta: { version: '2.1' },
    auth: {},
  },
  version: 1,
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(s => {
  localStorage.setItem('aura-v2', JSON.stringify(s));
}, STATE);

const page = await ctx.newPage();
await page.goto('http://localhost:5178', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const out = path.join(__dirname, 'screenshots', 'home_grade2.png');
await page.screenshot({ path: out, fullPage: false });
console.log('Screenshot saved:', out);
await browser.close();
