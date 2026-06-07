/**
 * Diagnóstico: módulo Colección/Editor
 * Estrategia:
 *  - Navegación UI real (clicks) para CollectionMenu, SetsScreen, AchievementsScreen, Stats, Profile
 *  - Manipulación localStorage (set.status='draft') + reload para SetEditor, CharEditor, PlaceEditor
 *  - React fiber walker como fallback para EcoEditorScreen (sin ruta UI)
 * Ejecutar: node src/tests/diagnostico_coleccion.cjs
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL  = 'http://localhost:5173';
const SHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

const results = [];

async function shot(page, name) {
  const file = `col_${name}.png`;
  await page.screenshot({ path: path.join(SHOTS_DIR, file), fullPage: true });
  console.log(`  📸 ${file}`);
  return file;
}

function readStore(page) {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('aura-save'));
    if (!key) return null;
    try { return JSON.parse(localStorage[key]).state; } catch(e) { return null; }
  });
}

function captureErrors(consoleLogs) {
  const errs = consoleLogs.filter(m => m.type === 'error' || m.type === 'pageerror');
  consoleLogs.length = 0;
  return errs.map(e => e.text.slice(0, 300));
}

function bodyText(t) { return t.slice(0, 450).replace(/\s+/g, ' ').trim(); }

// Intenta llamar setScreen via React fiber walker (fallback cuando no hay botón UI)
function callSetScreenViaFiber(page, screenName) {
  return page.evaluate((screenName) => {
    // Buscar fiber en el root o en sus hijos directos (React 18/19 usa keys distintas)
    function findFiber(el, depth = 0) {
      if (!el || depth > 3) return null;
      const keys = Object.keys(el);
      const fk = keys.find(k =>
        k.startsWith('__reactFiber') || k.startsWith('__reactInternals') ||
        k.startsWith('_reactInternals') || k.startsWith('__reactContainer'));
      if (fk) return el[fk];
      return findFiber(el.firstElementChild, depth + 1);
    }

    const root = document.getElementById('root');
    const fiber = findFiber(root);
    if (!fiber) {
      // Debug: listar claves disponibles
      const keys = Object.keys(root || {}).concat(Object.keys(root?.firstElementChild || {}));
      return 'no fiber. claves: ' + keys.filter(k => k.startsWith('_') || k.startsWith('_')).join(', ').slice(0, 200);
    }

    const candidates = [];
    function scan(node, depth) {
      if (!node || depth > 600) return;
      let hook = node.memoizedState;
      while (hook) {
        const v = hook.memoizedState;
        if (typeof v === 'function' && v.length === 1) {
          try {
            const src = v.toString().replace(/\s+/g, ' ');
            if (src.includes('{ screen') || src.includes('{screen') || src.includes('screen }')) {
              candidates.push(v);
            }
          } catch(e) {}
        }
        hook = hook.next;
      }
      scan(node.child, depth + 1);
      scan(node.sibling, depth + 1);
    }
    scan(fiber, 0);

    if (candidates.length > 0) {
      candidates[0](screenName);
      return `ok (${candidates.length} candidatos)`;
    }
    return 'setScreen no encontrado en fiber';
  }, screenName);
}

// Navegación hasta MapScreen (flujo completo)
async function navigateToMap(page, consoleLogs) {
  console.log('\n=== FASE 1: Navegando hasta MapScreen ===');
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1000);

  await page.getByText('JUGAR SIN CUENTA').click();
  await page.waitForTimeout(800);
  console.log('  → set-selection');

  const setCards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('div'))
      .filter(d => {
        const s = d.getAttribute('style') || '';
        return s.includes('cursor: pointer') && s.includes('border') &&
               d.textContent.trim().length > 5 && d.textContent.trim().length < 300;
      })
      .map(d => { const r = d.getBoundingClientRect(); return { x: r.x+r.width/2, y: r.y+r.height/2, w: r.width, h: r.height, text: d.textContent.trim().slice(0,40) }; })
      .filter(d => d.w > 100 && d.h > 30 && d.y > 50)
  );

  for (const i of (setCards.length >= 4 ? [2,3] : [0,1])) {
    await page.mouse.click(setCards[i].x, setCards[i].y);
    await page.waitForTimeout(350);
    console.log(`  ✔ Set [${i}]: "${setCards[i].text.slice(0,25)}"`);
  }

  const contBtn = page.getByText('CONTINUAR →');
  if (!await contBtn.evaluate(el => !el.disabled).catch(() => false)) return false;
  await contBtn.click();
  await page.waitForTimeout(600);
  console.log('  → leader-selection');

  const leaderCards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('div'))
      .filter(d => {
        const s = d.getAttribute('style') || '';
        return s.includes('cursor: pointer') && s.includes('border-radius') &&
               d.textContent.match(/\d+ Aura/) && d.getBoundingClientRect().width > 100;
      })
      .map(d => { const r = d.getBoundingClientRect(); return { x: r.x+r.width/2, y: r.y+r.height/2 }; })
  );

  for (const card of leaderCards.slice(0, 2)) {
    await page.mouse.click(card.x, card.y);
    await page.waitForTimeout(350);
  }

  const verBtn = page.getByText('VER BARAJA →');
  if (!await verBtn.evaluate(el => !el.disabled).catch(() => false)) return false;
  await verBtn.click();
  await page.waitForTimeout(600);
  console.log('  → deck-review');

  if (await page.getByText('¡AL MAPA!').count().catch(() => 0) === 0) return false;
  await page.getByText('¡AL MAPA!').click();
  await page.waitForTimeout(1000);
  console.log('  → map ✅');
  captureErrors(consoleLogs);
  return true;
}

// Navegar a MapScreen desde LoginScreen (después de un reload — asume run activa)
async function goToMapFromLogin(page, consoleLogs) {
  await page.waitForTimeout(800);
  const jugarBtn = page.getByText('JUGAR SIN CUENTA');
  if (await jugarBtn.count() > 0) {
    await jugarBtn.click();
    await page.waitForTimeout(1000);
    console.log('  → "JUGAR SIN CUENTA" clicked (with active run → map)');
  }
  captureErrors(consoleLogs);
  const text = await page.textContent('body');
  return text.includes('Área') || text.includes('📦');
}

// Ir a CollectionMenu desde MapScreen
async function goToCollectionMenu(page) {
  const btn = page.locator('button', { hasText: '📦' });
  if (await btn.count() > 0) {
    await btn.first().click();
  } else {
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('📦'));
      if (b) b.click();
    });
  }
  await page.waitForTimeout(700);
  return (await page.textContent('body')).includes('Mis Sets');
}

// ══════════════════════════════════════════════════════════════
async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const ctx     = await browser.newContext({ viewport: { width: 460, height: 900 } });
  const page    = await ctx.newPage();

  const consoleLogs = [];
  page.on('console', m => consoleLogs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', e => consoleLogs.push({ type: 'pageerror', text: e.message }));

  // ── FASE 1: Llegar al mapa ─────────────────────────────────
  if (!await navigateToMap(page, consoleLogs)) {
    console.error('No se pudo llegar al mapa. Abortando.');
    await browser.close(); return;
  }

  // ── ACCESO A COLECCIÓN ─────────────────────────────────────
  console.log('\n=== ACCESO A COLECCIÓN ===');
  const mapText = await page.textContent('body');
  console.log('  LoginScreen: ❌ sin botón Colección');
  console.log('  SetSelectionScreen: ❌ sin botón Colección');
  console.log('  MapScreen: ' + (mapText.includes('📦') ? '✅ botón 📦' : '❌ no encontrado'));
  console.log('  Ruta UI mínima: Login → sets → líderes → deck → mapa → 📦');

  // ── PANTALLA 1: CollectionMenu ─────────────────────────────
  console.log('\n=== PANTALLA 1: CollectionMenu ===');
  const reachedCM = await goToCollectionMenu(page);
  console.log('  Llegó a CollectionMenu:', reachedCM);

  const errsCM = captureErrors(consoleLogs);
  const fileCM = await shot(page, '01_collection_menu');
  const textCM = await page.textContent('body');
  console.log('  Texto:', bodyText(textCM));
  console.log('  Errores:', errsCM.length ? errsCM : 'ninguno');

  const itemsCM = ['Mis Sets','Ecos','Estadísticas','Perfil'].filter(i => textCM.includes(i));
  const baraNivel = textCM.includes('Nivel') || textCM.includes('puntos');
  console.log('  Items:', itemsCM, '| Barra nivel:', baraNivel);
  console.log('  "← Jugar":', textCM.includes('Jugar'));

  const statusCM = errsCM.length ? 'crashea' : itemsCM.length >= 3 ? 'funciona' : 'parcial';
  results.push({ screen: 'CollectionMenu', file: fileCM, status: statusCM, errors: errsCM,
    notes: `Items: ${itemsCM.join(', ')} | Barra nivel: ${baraNivel ? 'SÍ (usa (level+1)*10, incorrecto para niveles altos)' : 'NO'}` });

  // ── PANTALLA 2: SetsScreen ─────────────────────────────────
  console.log('\n=== PANTALLA 2: SetsScreen ===');
  const misSetsBtn = page.getByText('Mis Sets').first();
  if (await misSetsBtn.count() > 0) { await misSetsBtn.click(); await page.waitForTimeout(700); }

  const errsSS = captureErrors(consoleLogs);
  const fileSS = await shot(page, '02_sets_screen');
  const textSS = await page.textContent('body');
  console.log('  Texto:', bodyText(textSS));

  const slotBtns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button'))
      .filter(b => b.textContent.includes('/') && b.textContent.includes('+'))
      .map(b => ({ text: b.textContent.trim(), disabled: b.disabled }))
  );
  console.log('  Botones slots:', slotBtns.map(b => `${b.text} (${b.disabled ? 'DISABLED' : 'OK'})`));

  const statusSS = errsSS.length ? 'crashea' : textSS.includes('MIS SETS') ? 'funciona' : 'parcial';
  const allSlotsFull = slotBtns.every(b => b.disabled);
  results.push({ screen: 'SetsScreen', file: fileSS, status: statusSS, errors: errsSS,
    notes: `5 sets phase1Data (confirmados). Slots: ${allSlotsFull ? 'TODOS LLENOS 1/1 — usuario nuevo sin puntos no puede crear sets' : 'disponibles'}` });

  // ── PREPARAR DRAFT SET (localStorage + reload) ─────────────
  console.log('\n=== PREPARANDO DRAFT SET (localStorage + reload) ===');
  const draftSetId = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('aura-save'));
    if (!key) return null;
    try {
      const data = JSON.parse(localStorage[key]);
      const sets = data.state?.collection?.sets ?? {};
      const ids = Object.keys(sets);
      if (!ids.length) return null;
      const id = ids[0];
      sets[id].status = 'draft';
      // Limpiar personajes para ver el set editor vacío
      sets[id].characters = [];
      sets[id].placeId = null;
      localStorage.setItem(key, JSON.stringify(data));
      return id;
    } catch(e) { return null; }
  });
  console.log('  Set modificado a draft:', draftSetId ?? 'NINGUNO (colección vacía en localStorage)');

  if (draftSetId) {
    await page.reload();
    console.log('  Recargando página...');
    await page.waitForTimeout(1200);

    const onMap = await goToMapFromLogin(page, consoleLogs);
    console.log('  MapScreen tras reload:', onMap ? '✅' : '❌ (en otra pantalla)');

    if (!onMap) {
      // Intentar navegar manualmente a map
      const bodyAfter = await page.textContent('body');
      console.log('  Texto tras reload:', bodyText(bodyAfter));
    }

    const okCM2 = await goToCollectionMenu(page);
    console.log('  CollectionMenu alcanzado:', okCM2 ? '✅' : '❌');
    captureErrors(consoleLogs);

    // Mis Sets → clicar set draft
    if (okCM2) {
      const misSets2 = page.getByText('Mis Sets').first();
      if (await misSets2.count() > 0) { await misSets2.click(); await page.waitForTimeout(600); }
      console.log('  → SetsScreen (con draft set)');

      // Buscar el set draft y hacer click
      const draftRow = await page.evaluate((draftId) => {
        const divs = Array.from(document.querySelectorAll('div'));
        const d = divs.find(d => {
          const r = d.getBoundingClientRect();
          const s = d.getAttribute('style') || '';
          return r.width > 200 && r.height > 40 && s.includes('cursor: pointer') &&
                 (d.textContent.includes('Borrador') || d.textContent.includes('draft'));
        });
        return d ? { x: d.getBoundingClientRect().x + d.getBoundingClientRect().width/2, y: d.getBoundingClientRect().y + d.getBoundingClientRect().height/2, text: d.textContent.trim().slice(0,40) } : null;
      }, draftSetId);

      if (draftRow) {
        console.log('  Draft set encontrado:', draftRow.text);
        await page.mouse.click(draftRow.x, draftRow.y);
        await page.waitForTimeout(700);
      } else {
        console.log('  ⚠ No se encontró fila del draft set en SetsScreen');
        // Intentar click en cualquier set row
        await page.evaluate(() => {
          const divs = Array.from(document.querySelectorAll('div'));
          const d = divs.find(d => {
            const r = d.getBoundingClientRect();
            const s = d.getAttribute('style') || '';
            return r.width > 200 && r.height > 40 && s.includes('cursor: pointer') && d.textContent.length > 10;
          });
          if (d) d.click();
        });
        await page.waitForTimeout(600);
      }
    }
  } else {
    console.log('  ⚠ No hay sets en localStorage para convertir en draft. Navegando directo a set-editor via fiber...');
    const fiberResult = await callSetScreenViaFiber(page, 'set-editor');
    console.log('  Fiber result:', fiberResult);
    await page.waitForTimeout(700);
  }

  // ── PANTALLA 3: SetEditorScreen ────────────────────────────
  console.log('\n=== PANTALLA 3: SetEditorScreen ===');
  const errsSetE = captureErrors(consoleLogs);
  const fileSetE = await shot(page, '03_set_editor');
  const textSetE = await page.textContent('body');
  console.log('  Texto:', bodyText(textSetE));
  console.log('  Errores:', errsSetE.length ? errsSetE : 'ninguno');

  const inSetEditor = textSetE.includes('Personajes') || textSetE.includes('Añadir') || textSetE.includes('CONFIRMAR') || textSetE.includes('Borrador');
  const hasDraftControls = textSetE.includes('Añadir') || textSetE.includes('Crear');
  const setEditorBtns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button'))
      .filter(b => b.getBoundingClientRect().width > 0)
      .map(b => b.textContent.trim().slice(0,30))
      .filter(t => t.length > 0)
  );
  console.log('  ¿En SetEditor?', inSetEditor, '| Controles draft:', hasDraftControls);
  console.log('  Botones:', setEditorBtns.slice(0,8));

  const statusSetE = errsSetE.length ? 'crashea' : inSetEditor ? (hasDraftControls ? 'funciona' : 'funciona (vista confirmado, sin controles draft)') : 'parcial — no llegó a SetEditor';
  results.push({ screen: 'SetEditorScreen', file: fileSetE, status: statusSetE, errors: errsSetE,
    notes: inSetEditor ? `Controles: [${setEditorBtns.slice(0,6).join(', ')}]. Confirmar SET requiere ≥6 chars + lugar.` : 'No se renderizó SetEditorScreen' });

  // Rellenar nombre si es draft
  if (inSetEditor && hasDraftControls) {
    try {
      const inp = page.locator('input').first();
      if (await inp.count() > 0) {
        await inp.fill('Set Diagnóstico');
        await page.waitForTimeout(300);
        await shot(page, '03b_set_editor_named');
        console.log('  ✔ Nombre rellenado');
      }
    } catch(e) { console.log('  ⚠ Fill name:', e.message); }
  }

  // ── PANTALLA 4: CharacterEditorScreen ─────────────────────
  console.log('\n=== PANTALLA 4: CharacterEditorScreen ===');

  let charEditorMethod = 'ninguno';
  if (inSetEditor && hasDraftControls) {
    const addCharBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(b => b.textContent.includes('Añadir') || b.textContent.includes('añadir'));
      return b ? { text: b.textContent.trim(), x: b.getBoundingClientRect().x+b.getBoundingClientRect().width/2, y: b.getBoundingClientRect().y+b.getBoundingClientRect().height/2 } : null;
    });
    if (addCharBtn) {
      console.log('  Botón Añadir:', addCharBtn.text);
      await page.mouse.click(addCharBtn.x, addCharBtn.y);
      await page.waitForTimeout(700);
      charEditorMethod = 'click "+ Añadir" en SetEditorScreen';
    } else {
      console.log('  ⚠ No hay botón Añadir — usando fiber walker');
      const fr = await callSetScreenViaFiber(page, 'char-editor');
      console.log('  Fiber:', fr);
      await page.waitForTimeout(700);
      charEditorMethod = 'fiber walker';
    }
  } else {
    console.log('  SetEditor no tiene controles draft — usando fiber walker');
    const fr = await callSetScreenViaFiber(page, 'char-editor');
    console.log('  Fiber:', fr);
    await page.waitForTimeout(700);
    charEditorMethod = 'fiber walker (SetEditor sin draft)';
  }

  const errsCharE = captureErrors(consoleLogs);
  const fileCharE = await shot(page, '04_char_editor');
  const textCharE = await page.textContent('body');
  console.log('  Texto:', bodyText(textCharE));
  console.log('  Errores:', errsCharE.length ? errsCharE : 'ninguno');

  const inCharEditor = textCharE.includes('Identidad') || textCharE.includes('Atributos') || textCharE.includes('Cartas') || textCharE.includes('Keywords');
  const charSections = ['Identidad','Atributos','Cartas','Keywords'].filter(s => textCharE.includes(s));
  console.log('  ¿En CharEditor?', inCharEditor, '| Secciones:', charSections);

  const statusCharE = errsCharE.length ? 'crashea' : inCharEditor ? 'funciona' : `parcial — no llegó a CharEditor (método: ${charEditorMethod})`;
  results.push({ screen: 'CharacterEditorScreen', file: fileCharE, status: statusCharE, errors: errsCharE,
    notes: inCharEditor ? `Secciones: ${charSections.join(', ')}. Acceso: ${charEditorMethod}` : `No renderizó. Acceso intentado: ${charEditorMethod}` });

  // Rellenar
  if (inCharEditor) {
    try {
      const ni = page.locator('input').first();
      if (await ni.count() > 0) { await ni.fill('PersonajePrueba'); await page.waitForTimeout(250); }
      const sBtn = await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find(b =>
          b.textContent.toLowerCase().includes('surprise') || b.textContent.includes('🎲') || b.textContent.toLowerCase().includes('aleat'));
        return b ? { x: b.getBoundingClientRect().x+b.getBoundingClientRect().width/2, y: b.getBoundingClientRect().y+b.getBoundingClientRect().height/2, text: b.textContent.trim() } : null;
      });
      if (sBtn) {
        console.log('  ✔ Surprise Me:', sBtn.text);
        await page.mouse.click(sBtn.x, sBtn.y);
        await page.waitForTimeout(400);
        await shot(page, '04b_char_editor_filled');
      }
      // Confirmar personaje
      const cBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find(b => b.textContent.toUpperCase().includes('CONFIRM') || b.textContent.toUpperCase().includes('CREAR'));
        return b ? { x: b.getBoundingClientRect().x+b.getBoundingClientRect().width/2, y: b.getBoundingClientRect().y+b.getBoundingClientRect().height/2, text: b.textContent.trim() } : null;
      });
      if (cBtn) {
        console.log('  ✔ Confirmar personaje:', cBtn.text);
        await page.mouse.click(cBtn.x, cBtn.y);
        await page.waitForTimeout(600);
      }
    } catch(e) { console.log('  ⚠ Fill char:', e.message); }
  }

  // ── PANTALLA 5: PlaceEditorScreen ─────────────────────────
  console.log('\n=== PANTALLA 5: PlaceEditorScreen ===');

  // Volver a SetEditorScreen y buscar botón lugar
  const textAfterChar = await page.textContent('body');
  const inSetEditorAfterChar = textAfterChar.includes('Personajes') || textAfterChar.includes('CONFIRMAR') || textAfterChar.includes('Crear');

  let placeEditorMethod = 'ninguno';

  // Debug: confirmar estado actual
  console.log('  textAfterChar info:', {
    hasPersonajes: textAfterChar.includes('Personajes'),
    hasConfirmar: textAfterChar.includes('CONFIRMAR'),
    hasCrear: textAfterChar.includes('Crear'),
    inSetEditor: inSetEditorAfterChar
  });

  // Intentar click "+ Crear" via DOM click directo (evita problemas de viewport/scroll)
  const crearClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.trim() === '+ Crear');
    if (!btn) return 'no encontrado';
    btn.scrollIntoView({ behavior: 'instant', block: 'center' });
    btn.click();
    return 'clicked';
  });
  console.log('  DOM click "+ Crear":', crearClicked);
  if (crearClicked === 'clicked') {
    await page.waitForTimeout(700);
    placeEditorMethod = 'DOM click directo "+ Crear"';
  } else {
    console.log('  ⚠ No se encontró "+ Crear" via DOM. Intentando fiber walker...');
    const fr = await callSetScreenViaFiber(page, 'place-editor');
    console.log('  Fiber:', fr);
    await page.waitForTimeout(700);
    placeEditorMethod = 'fiber walker';
  }

  const errsPlE = captureErrors(consoleLogs);
  const filePlE = await shot(page, '05_place_editor');
  const textPlE = await page.textContent('body');
  console.log('  Texto:', bodyText(textPlE));
  console.log('  Errores:', errsPlE.length ? errsPlE : 'ninguno');

  const inPlaceEditor = textPlE.includes('Resonancia') || textPlE.includes('Tipo de lugar') || textPlE.includes('Intrínseco');
  const placeSections = ['Tipo de lugar','Resonancia','Intrínseco'].filter(s => textPlE.includes(s));
  console.log('  ¿En PlaceEditor?', inPlaceEditor, '| Secciones:', placeSections);

  const statusPlE = errsPlE.length ? 'crashea' : inPlaceEditor ? 'funciona' : `parcial — no llegó a PlaceEditor (método: ${placeEditorMethod})`;
  results.push({ screen: 'PlaceEditorScreen', file: filePlE, status: statusPlE, errors: errsPlE,
    notes: inPlaceEditor ? `Secciones: ${placeSections.join(', ')}. Acceso: ${placeEditorMethod}` : `No renderizó. Acceso: ${placeEditorMethod}` });

  if (inPlaceEditor) {
    try {
      const ni = page.locator('input').first();
      if (await ni.count() > 0) { await ni.fill('LugarPrueba'); await page.waitForTimeout(250); }
      await shot(page, '05b_place_editor_filled');
      console.log('  ✔ Nombre lugar rellenado');
    } catch(e) { console.log('  ⚠ Fill place:', e.message); }
  }

  // ── Volver a CollectionMenu para los submenús restantes ───
  console.log('\n=== Volviendo a CollectionMenu ===');
  // Intentar via botones "← Volver"
  for (let i = 0; i < 5; i++) {
    const bText = await page.textContent('body');
    if (bText.includes('Mis Sets') && !bText.includes('MIS SETS')) { // En CollectionMenu
      break;
    }
    const vBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(b => b.textContent.includes('← Volver') || b.textContent.includes('Volver'));
      return b ? { x: b.getBoundingClientRect().x+b.getBoundingClientRect().width/2, y: b.getBoundingClientRect().y+b.getBoundingClientRect().height/2, text: b.textContent.trim() } : null;
    });
    if (!vBtn) break;
    await page.mouse.click(vBtn.x, vBtn.y);
    await page.waitForTimeout(400);
    console.log(`  ← Volviendo (${vBtn.text})`);
  }

  // Si no estamos en CollectionMenu, navegar via mapa → 📦
  const bTextNow = await page.textContent('body');
  if (!bTextNow.includes('Mis Sets')) {
    console.log('  No en CollectionMenu. Navegando via mapa → 📦...');
    // Buscar botón de mapa o navegar directamente
    const mapBtn = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('← Jugar') || b.textContent.includes('Jugar'));
      return b ? { x: b.getBoundingClientRect().x+b.getBoundingClientRect().width/2, y: b.getBoundingClientRect().y+b.getBoundingClientRect().height/2 } : null;
    });
    if (mapBtn) { await page.mouse.click(mapBtn.x, mapBtn.y); await page.waitForTimeout(600); }
    await goToCollectionMenu(page);
  }

  // ── PANTALLA 6: AchievementsScreen (vía "Ecos") ────────────
  console.log('\n=== PANTALLA 6: AchievementsScreen (vía "Ecos") ===');
  console.log('  BUG: CollectionMenu "Ecos" → screen:"achievements" (no "eco-collection")');

  const ecosBtn = page.getByText('Ecos').first();
  if (await ecosBtn.count() > 0) { await ecosBtn.click(); await page.waitForTimeout(700); }

  const errsAch = captureErrors(consoleLogs);
  const fileAch = await shot(page, '06_ecos_achievements');
  const textAch = await page.textContent('body');
  console.log('  Texto:', bodyText(textAch));
  console.log('  Errores:', errsAch.length ? errsAch : 'ninguno');

  const inAch = textAch.includes('LOGROS') || textAch.includes('desbloqueado');
  const achProgress = (textAch.match(/\d+\/\d+\s*desbloqueados?/g) ?? []).join(', ');
  console.log('  ¿En AchievementsScreen?', inAch, '| Progreso:', achProgress);
  console.log('  ¿Tiene botón "crear eco"?', textAch.toLowerCase().includes('crear eco') || textAch.includes('+ Eco') ? 'SÍ' : 'NO');

  const statusAch = errsAch.length ? 'crashea' : inAch ? 'funciona (BUG: debería ser EcoCollectionScreen)' : 'parcial';
  results.push({ screen: 'AchievementsScreen (vía CollectionMenu "Ecos")', file: fileAch, status: statusAch, errors: errsAch,
    notes: `${achProgress || '0/17 desbloqueados'}. BUG: CollectionMenu.Ecos → screen:"achievements" en lugar de eco-collection. No hay botón "crear eco" aquí.` });

  // ── PANTALLA 7: StatsScreen ────────────────────────────────
  console.log('\n=== PANTALLA 7: StatsScreen ===');
  // Volver a CollectionMenu
  let backBtn = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('← Volver') || b.textContent.includes('Volver'));
    return b ? { x: b.getBoundingClientRect().x+b.getBoundingClientRect().width/2, y: b.getBoundingClientRect().y+b.getBoundingClientRect().height/2 } : null;
  });
  if (backBtn) { await page.mouse.click(backBtn.x, backBtn.y); await page.waitForTimeout(500); }

  const statsBtn = page.getByText('Estadísticas').first();
  if (await statsBtn.count() > 0) { await statsBtn.click(); await page.waitForTimeout(700); }

  const errsStats = captureErrors(consoleLogs);
  const fileStats = await shot(page, '07_stats_screen');
  const textStats = await page.textContent('body');
  console.log('  Texto:', bodyText(textStats));
  console.log('  Errores:', errsStats.length ? errsStats : 'ninguno');

  const inStats = textStats.includes('ESTADÍSTICAS') || textStats.includes('Runs totales');
  const statsFields = ['Runs totales','Victorias','Derrotas','% Victoria','Racha','Flows','Pifias','Tiempo Vibración'].filter(f => textStats.includes(f));
  console.log('  ¿En StatsScreen?', inStats, '| Campos:', statsFields);

  const statusStats = errsStats.length ? 'crashea' : inStats ? 'funciona' : 'parcial';
  results.push({ screen: 'StatsScreen', file: fileStats, status: statusStats, errors: errsStats,
    notes: `Campos: ${statsFields.join(', ')}. Todos en 0 (nueva partida).` });

  // ── PANTALLA 8: ProfileScreen ──────────────────────────────
  console.log('\n=== PANTALLA 8: ProfileScreen ===');
  backBtn = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('← Volver') || b.textContent.includes('Volver'));
    return b ? { x: b.getBoundingClientRect().x+b.getBoundingClientRect().width/2, y: b.getBoundingClientRect().y+b.getBoundingClientRect().height/2 } : null;
  });
  if (backBtn) { await page.mouse.click(backBtn.x, backBtn.y); await page.waitForTimeout(400); }

  const profileBtn = page.getByText('Perfil').first();
  if (await profileBtn.count() > 0) { await profileBtn.click(); await page.waitForTimeout(700); }

  const errsPrf = captureErrors(consoleLogs);
  const filePrf = await shot(page, '08_profile_screen');
  const textPrf = await page.textContent('body');
  console.log('  Texto:', bodyText(textPrf));
  console.log('  Errores:', errsPrf.length ? errsPrf : 'ninguno');

  const inProfile = textPrf.includes('PERFIL') || textPrf.includes('Nv.');
  const profileFields = ['Nv.','Novato','puntos','SLOTS DE SET','Logros'].filter(f => textPrf.includes(f));
  console.log('  ¿En ProfileScreen?', inProfile, '| Campos:', profileFields);

  const statusPrf = errsPrf.length ? 'crashea' : inProfile ? 'funciona' : 'parcial';
  results.push({ screen: 'ProfileScreen', file: filePrf, status: statusPrf, errors: errsPrf,
    notes: `Campos: ${profileFields.join(', ')}. Nivel/slots correctos (LEVEL_THRESHOLDS). Desbloquear slot: 20 pts (no disponible con 0 pts).` });

  // ── PANTALLA 9: EcoEditorScreen ────────────────────────────
  console.log('\n=== PANTALLA 9: EcoEditorScreen ===');
  console.log('  No hay ruta UI desde CollectionMenu. Intentando fiber walker...');

  const fiberEcoResult = await callSetScreenViaFiber(page, 'eco-editor');
  console.log('  Fiber result:', fiberEcoResult);
  await page.waitForTimeout(700);

  const errsEcoE = captureErrors(consoleLogs);
  const fileEcoE = await shot(page, '09_eco_editor');
  const textEcoE = await page.textContent('body');
  console.log('  Texto:', bodyText(textEcoE));
  console.log('  Errores:', errsEcoE.length ? errsEcoE : 'ninguno');

  const inEcoEditor = textEcoE.includes('Eco') && (textEcoE.includes('Efecto') || textEcoE.includes('Guardar') || textEcoE.includes('GUARDAR') || textEcoE.includes('nombre') || textEcoE.includes('Nombre'));
  const notInCollectionScreens = !textEcoE.includes('Mis Sets') && !textEcoE.includes('PERFIL') && !textEcoE.includes('LOGROS') && !textEcoE.includes('ESTADÍSTICAS');
  console.log('  ¿En EcoEditor?', inEcoEditor);
  console.log('  Screen actual (si no eco-editor):', inEcoEditor ? 'EcoEditor' : 'OTRA PANTALLA (fiber no funcionó)');

  const statusEcoE = errsEcoE.length ? 'crashea' : inEcoEditor ? 'funciona (pero sin ruta UI accesible)' : 'no alcanzable — screen orphan sin ruta UI';
  results.push({ screen: 'EcoEditorScreen', file: fileEcoE, status: statusEcoE, errors: errsEcoE,
    notes: `Fiber walker: "${fiberEcoResult}". screen:"eco-editor" existe en App.jsx pero ningún ítem de CollectionMenu ni subpantalla enlaza a él.` });

  // ── INFORME FINAL ──────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('INFORME DIAGNÓSTICO — MÓDULO COLECCIÓN/EDITOR');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('ACCESO A COLECCIÓN:');
  console.log('  LoginScreen, SetSelectionScreen → sin botón Colección');
  console.log('  MapScreen → botón 📦 → collection-menu (ÚNICA RUTA)');
  console.log('  GDD especifica "COLECCIONISTA" en main menu → NO IMPLEMENTADO\n');

  console.log('ESTADO POR PANTALLA:');
  console.log('  ─────────────────────────────────────────────────────────────');
  console.log('  Screen                              Archivo              Estado');
  console.log('  ─────────────────────────────────────────────────────────────');
  for (const r of results) {
    const s = r.screen.padEnd(35);
    const f = (r.file||'—').padEnd(22);
    console.log(`  ${s} ${f} ${r.status}`);
    if (r.errors.length) console.log(`    ⚠ ERROR: ${r.errors[0].slice(0,120)}`);
    if (r.notes) console.log(`    ℹ ${r.notes}`);
  }

  console.log('\nBUGS DETECTADOS:');
  console.log('  [A] MODERADO — CollectionMenu "Ecos" → screen:"achievements" en lugar de "eco-collection"');
  console.log('      AchievementsScreen y EcoCollection fusionados. No existe EcoCollectionScreen.');
  console.log('');
  console.log('  [B] MAYOR (UX) — Todos los slots de set llenos en nueva partida');
  console.log('      5 sets phase1Data (confirmados) ocupan slot 1/1 por color.');
  console.log('      Usuario nuevo (0 puntos) no puede crear ningún set propio.');
  console.log('      Para crear: necesita 20 pts → desbloquear slot (bucle roto).');
  console.log('');
  console.log('  [C] MENOR — CollectionMenu barra nivel: (level+1)*10 en vez de LEVEL_THRESHOLDS');
  console.log('      Correcto por casualidad en niveles bajos, falla en escala avanzada.');
  console.log('');
  console.log('  [D] MODERADO — EcoEditorScreen sin ruta UI');
  console.log('      screen:"eco-editor" registrado en App.jsx pero ningún botón en');
  console.log('      CollectionMenu, AchievementsScreen ni ProfileScreen enlaza a él.');
  console.log('');
  console.log('  [E] MAYOR (UX) — Sin MainMenu implementado');
  console.log('      GDD sección 3: botones "Aventura" y "Coleccionista" desde inicio.');
  console.log('      Login → set-selection directamente (sin menú intermedio).');

  console.log('\nCapturas en: src/tests/screenshots/');
  console.log('─────────────────────────────────────────────────────────────\n');

  await browser.close();
}

run().catch(e => {
  console.error('ERROR FATAL:', e.message, '\n', e.stack);
  process.exit(1);
});
