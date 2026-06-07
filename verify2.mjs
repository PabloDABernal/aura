import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', e => errors.push(e.message));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

// Screenshot inicial (TestScreen con 8 presets)
await page.screenshot({ path: './ss_01_testscreen.png' });
console.log('Presets:', await page.locator('button').count());

// Abrir preset 1: revelación estándar
await page.getByText('LANZAR VIBRA').click();
await page.waitForTimeout(400);
await page.screenshot({ path: './ss_02_ready.png' });
console.log('Overlay abierto, EMPEZAR visible:', await page.getByText('EMPEZAR', { exact: true }).isVisible());

// Empezar cronómetro - en fase décimas (0-3s)
await page.getByText('EMPEZAR', { exact: true }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: './ss_03_decimas.png' });

// Comprobar que muestra décimas (formato X.X no X.XX)
const timerText1 = await page.evaluate(() => {
  for (const d of document.querySelectorAll('div')) {
    const t = d.textContent.trim();
    if (/^\d+\.\d$/.test(t) || /^\d+\.\d{2}$/.test(t)) return t;
  }
  return null;
});
console.log('Timer at ~0.3s:', timerText1, '(should be X.X décimas)');

// Esperar hasta los 3.5s para ver si pasa a centésimas
await page.waitForTimeout(3300);
await page.screenshot({ path: './ss_04_centesimas.png' });
const timerText2 = await page.evaluate(() => {
  for (const d of document.querySelectorAll('div')) {
    const t = d.textContent.trim();
    if (/^\d+\.\d{2}$/.test(t)) return t;
  }
  return null;
});
console.log('Timer at ~3.6s:', timerText2, '(should be X.XX centésimas)');

// Esperar hasta 6s para ver la marca sutil
await page.waitForTimeout(2600);
await page.screenshot({ path: './ss_05_mark_visible.png' });
const markVisible = await page.evaluate(() => {
  // Buscar la línea de marca (tiene boxShadow con #FFD700)
  const divs = [...document.querySelectorAll('div')];
  return divs.some(d => d.style.boxShadow && d.style.boxShadow.includes('FFD700') && d.style.width === '2px');
});
console.log('Marca sutil visible a 6s+:', markVisible);

// Parar y ver resultado con zonas de colores reveladas
await page.getByText('PARAR', { exact: true }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: './ss_06_result_with_zones.png' });

const resultLabels = ['FLOW', 'VIBRA', 'FALLO', 'PIFIA', 'TIMEOUT'];
let found = null;
for (const lbl of resultLabels) {
  if (await page.getByText(lbl, { exact: true }).count() > 0) { found = lbl; break; }
}
console.log('Resultado:', found);

// Verificar que las zonas de color aparecen tras parar
const zonesAfterStop = await page.evaluate(() => {
  // Las zonas tienen colores oscuros específicos (pifia, fail, vibra, flow)
  const divs = [...document.querySelectorAll('div')];
  return divs.filter(d =>
    d.style.background && (
      d.style.background.includes('rgb(19') || // pifia #130008
      d.style.background.includes('rgb(107')   // fail #6B1010
    )
  ).length;
});
console.log('Zonas de color renderizadas tras parar:', zonesAfterStop);

// Cerrar y probar preset 2 (hideCentesimas)
await page.waitForTimeout(1600);
await page.locator('button').filter({ hasText: '② Solo décimas' }).click();
await page.getByText('LANZAR VIBRA').click();
await page.waitForTimeout(300);
await page.getByText('EMPEZAR', { exact: true }).click();
await page.waitForTimeout(4000); // a los 4s debería SEGUIR en décimas
await page.screenshot({ path: './ss_07_hidecent_4s.png' });
const timerHide = await page.evaluate(() => {
  for (const d of document.querySelectorAll('div')) {
    const t = d.textContent.trim();
    if (/^\d+\.\d$/.test(t)) return t;  // solo décimas
    if (/^\d+\.\d{2}$/.test(t)) return `CENTESIMAS:${t}`;
  }
  return null;
});
console.log('hideCentesimas a 4s:', timerHide, '(debe ser X.X)');
await page.getByText('PARAR', { exact: true }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: './ss_08_hidecent_result.png' });

console.log('\nErrores de consola:', errors.length ? errors : 'ninguno');
await browser.close();
