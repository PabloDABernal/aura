# SDD — Aura
## Software Design Document v3.4

> Acompaña al GDD v4.1. GDD = qué, SDD = cómo. Rama activa: `cronometro-core`.

---

# 1. Stack y arquitectura

- **Frontend**: React 19 + Vite
- **Estado**: Zustand con persist (clave localStorage `aura-v2`)
- **Móvil**: Capacitor (Android primero). Mobile-first, contenedor centrado tipo móvil en desktop
- **Animación**: Framer Motion
- **Audio**: Web Audio API / Tone.js (Fase G)
- **Estilos**: design tokens en `src/styles/tokens.js` + `colorThemes.js`

---

# 2. Modelo de datos (v4.0 — CAMBIO BREAKING respecto a v2.0)

## Personaje
```
{
  id: uuid,
  name: string,
  image: string | null,
  auraNumber: number,            // 00-99, único entre activos+archivados
  passiveAbility: { id, name, description, scope: 'general'|probeType },
  activeAbility:  { id, name, description, scope: 'general'|probeType },
  auraAbility:    { id, name, description, scope: 'general'|probeType },
  grade: number,                 // 1-10
  status: 'active'|'archived',
  failedRunsAtGrade: number,     // para Run de Misericordia (3 fallos seguidos)
  temporalResidues: number,      // 0-3, se resetean al completar run o archivar
  stats: {
    runsCompleted, runsFailed, bestInfiniteScore, hasCrown,
    crowns: number,              // 1 por grado alcanzado, máx 10
    perfectSyncTime: number,     // tiempo acumulado de Sincronía Perfecta
    runHistory: [{ date, result, probesPassed, perfectSyncs }]
  }
}
```
**Regla de unicidad**: ningún personaje activo puede tener la misma COMBINACIÓN de (passiveAbility.id, activeAbility.id, auraAbility.id). Habilidades individuales sí pueden repetirse si la combinación difiere.

**MIGRACIÓN**: los personajes existentes con el modelo antiguo (`ability` + `auraAbility`) se migran: `ability` → `passiveAbility` o `activeAbility` según su type; el hueco restante se rellena con una habilidad general por defecto.

## Estado de run
```
{
  characterId, probeSequence: [], currentProbe: 1-10,
  lives: number,                 // 3 base, 2 en grado 9+, máx 5 (Sincronía Perfecta)
  activeEcos: [],                // máx 5 (7 con Fragmentos)
  probeHistory: [{ probeType, result: 'perfect'|'pass'|'fail', auraTriggered }],
  activeAbilityUsed: bool,
  mercyRun: bool,                // Run de Misericordia activa
  freeProbe1: bool,              // consumo de 3 Residuos
  infiniteMode, infiniteScore, status
}
```

## Meta (metaSlice)
```
{
  collectorLevel, collectorXP,
  lereles: number,
  auraFragments: number,         // moneda premium, solo se gana
  records: { maxRunStreak, ... },
  unlockedFamilies: [],          // según nivel coleccionista
  dailyChallengeState: {}
}
```

---

# 3. Los tres estados por prueba

Toda prueba evalúa su resultado con esta lógica común (en `src/engine/run/resultEvaluator.js`):
- **perfect**: diferencia ≤ margen × 0.5 → +1 vida (máx 5), +50% Lereles, activa Aura si coincide
- **pass**: diferencia ≤ margen → progresa, Lereles base
- **fail**: fuera → −1 vida, +1 Residuo Temporal (máx 3)

Las pruebas que no son de "parar en un valor" (Suma 100, Banca, Equilibrio, Pacto...) definen su propio criterio de perfect en su spec (ej: Suma 100 exacto sin resets = perfect).

## Residuos Temporales
- Se almacenan en el personaje (persisten entre runs)
- Al iniciar run con 3 residuos: la prueba 1 se marca superada automáticamente (estado pass, sin bonus), residuos a 0
- Se resetean al completar una run o archivar
- NO se generan en Modo Práctica

---

# 4. Sistema de habilidades

## Motor — `src/engine/abilities/abilityEngine.js`
Hooks: `RUN_START`, `PROBE_CONFIG`, `PROBE_RESULT` (puede convertir fail→pass), `ACTIVE_USE`, `AURA_TRIGGER`, `PROBE_UI` (para pasivas que añaden elementos visuales como flechas, rastros, guías).

## Catálogo — `src/data/abilityCatalog.js`
Estructura única para las 60+ específicas + generales:
```
{
  id, name, description,
  kind: 'passive'|'active'|'aura',
  scope: 'general' | probeType,   // específicas solo afectan su prueba
  hook, apply: (context) => modifiedContext,
  unlockLevel: number             // nivel de coleccionista requerido
}
```
Las habilidades específicas por prueba están definidas en las tablas del GDD §4 (3 por prueba × 20 pruebas). Se implementan POR FAMILIAS, no de golpe.

## Desbloqueo
Nivel 1: pool básico general. Nivel 5: específicas familias 4.1+4.5. Nivel 10: 4.2+4.3+4.4. Nivel 15: 4.6 + Editor. Nivel 20: pool completo.

---

# 5. Motor de pruebas

- Cada prueba: componente en `src/components/probes/`, registrada en `probeRegistry.js`
- Recibe `{ config, character, onComplete }`. `config` ya viene procesada por grado + ecos + pasiva del personaje (hook PROBE_CONFIG)
- `generateProbeSequence(grade, collectorLevel)`: alterna familias, respeta desbloqueos, prueba 10 con peso ≥ 7
- `generateProbeConfig(probeType, grade, ecos, character)`: tabla base del GDD §4 → modificadores de ecos → hook PROBE_CONFIG
- Sistema de pesos según GDD §4.1 en `src/engine/run/probeWeights.js`
- Mecánica estándar de parar/reanudar manual; ayudas visuales solo con `showVisualAid: true` (por habilidad/eco/config)

---

# 6. Ecos — `src/data/ecoLibrary.js`

Tres tiers: `basic` (siempre), `advanced` (personaje grado 5+), `legendary` (5% de aparición). Pool según GDD §6.2. Selección cada 3 pruebas superadas; si 5 activos, descartar antes de elegir. Slots máx 5 (7 comprando con Fragmentos).

---

# 7. Economía

- **Lereles**: ganancia por prueba (base × grado, ×1.5 si perfect) y por run completada. Gasto: crear personaje (coste base + extra por número redondo 00/11/22...), reactivar archivado, skins
- **Fragmentos de Aura**: solo se ganan (grado 10, colecciones de números, desafíos diarios). Gasto: desbloqueo anticipado de habilidades, slots eco 6-7, re-roll de ecos
- **Residuos**: no gastables, automáticos

---

# 8. Modos de juego

| Modo | Requisito | Notas |
|---|---|---|
| Run Estándar | — | el actual |
| Práctica | — | sin vidas/recompensas/residuos, config libre de pruebas desbloqueadas |
| Infinito | grado 7 del personaje | velocidad +0.05x/5 pruebas, margen −1cs/10 |
| Desafío Diario | — | seed diaria determinista (fecha como semilla), condiciones especiales, recompensa Fragmentos |
| Sincronía Perfecta | nivel coleccionista 25 | todo grado 10, sin ecos, 1 vida |

---

# 9. Pantallas

Tabs: **Run** (selección de personaje + botones de modo), **Personajes** (colección, archivo, creador), **Banco de Pruebas** (informativo; Editor en nivel 15), **Ajustes**.
Durante la run: cronómetro central, vidas arriba-izq, residuos arriba-dcha (3 fragmentos de reloj), ecos abajo, botón de habilidad activa con estado, indicador "Prueba N/10 — [nombre]", brillo sutil al pasar por X.NN.

---

# 10. Estado de implementación

## Hecho (base v2.0/v3.0 del GDD)
- Creador de personaje (modelo ANTIGUO: 1 habilidad + 1 aura) — **requiere migración a 3 habilidades**
- Run de 10 pruebas, vidas, persistencia `aura-v2`, subida de grado
- 20 componentes de prueba base en `probes/` (pulidos: Bingo, Espejo, Péndulo; resto en versión inicial)
- Menú 4 tabs, borrado de archivados, imagen por URL/upload, botón salir de run
- Sistema de hooks de habilidad básico, ecos básicos, carta reactiva en run, feedback de vidas

## Pendiente (plan de trabajo v4.0)
Ver ROADMAP de fases A–I.

## Cambios arquitectónicos pendientes (documentados en GDD v4.2 — NO implementados aún)

(a) **probeProgress por parámetro**: `probeProgress[probeType]` pasa de `number` a `{ [param]: count }`. Migración de personajes existentes = reset a todos los parámetros en 0 (no conversión del número viejo). Zustand store pasa a v5 con migración idempotente.

(b) **resolveConfigFromPistas y addPista por parámetro**: `resolveConfigFromPistas(probeType, pistasByParam)` recibe el objeto `{ [param]: count }` en vez de un entero. `addPista(characterId, probeType, param)` incrementa el parámetro concreto. Mientras Práctica/Banco no migren, se mantiene un fallback de compatibilidad para llamadas con `number`.

(c) **ParpadeoProbe multi-parada**: honra `maxStops` (pista real, ya sin `hidden: true`); `requiredHits = 1` fijo. El jugador tiene `maxStops` intentos; basta 1 acierto en la ventana OFF.

(d) **range de parpadeo invertido**: base = 50cs (Nivel 1, más fácil). Progresión de la pista: 50 → 25 → 20 → 10. `values: [50, 25, 20, 10]` en catálogo.

---

# 11. Notas para Claude Code

## Bloque obligatorio de inicio de sesión
```
Lee docs/GDD.md (v4.0) y docs/SDD.md (v3.0) antes de empezar.
Estoy en Windows con PowerShell. Ejecuta siempre en modo --dangerously-skip-permissions para esta sesión. Tienes permiso permanente para ejecutar cualquier comando npm, npx, node y operaciones de ficheros sin pedir confirmación en ningún momento de esta sesión.
Guarda tests en src/__tests__/ y capturas en src/__tests__/screenshots/.
Nunca en la raíz del proyecto.
```

## Reglas
- GDD v4.2 = qué, SDD v3.4 = cómo. Rama: `cronometro-core`
- El combate por turnos está muerto (vive en `main` como histórico)
- NUNCA crear componentes de prueba nuevos: los 20 existen. Solo modificar
- Habilidades específicas se implementan por familias, no de golpe
- Cada fase del roadmap termina con algo ejecutable y verificado en navegador
- Las verificaciones: una sola al final de cada prompt, build + flujo manual
- Lanzar con `claude --dangerously-skip-permissions`

---

*SDD v3.4 — Acompaña al GDD v4.2. Documento técnico vivo. Rama: cronometro-core.*

---

# 12. Catálogo de habilidades (v3.1 — Fase B cerrada)

## Hooks canónicos (abilityEngine.js)
- `applyRunStart(baseState, character)` — vidas extra (p01), umbral de Residuos (p_tempo)
- `applyProbeConfig(config, character, probeType)` — generales (p02,p03,p05,p06,p09,p10) + específicas via catálogo
- `applyProbeResult(result, character, probeType, context)` — absorción de fallos: shieldActive → p04 → p08
- `applyActiveUse(character, runState, probeType)` — 10 generales (a01-a10) + específicas
- `applyAuraTrigger(character, runState, probeType)` — 15 generales (aa01-aa15, incl. aa05 nextProbeAutoPass) + específicas

## Inventario
- 15 generales (5 pasivas p01-p05 + variantes p06-p10, 10 activas a01-a10, 15 aura aa01-aa15)
- 30 específicas familias 4.1+4.5 (10 pruebas × 3) — unlockLevel 5
- 18 específicas familias 4.2+4.4 (6 pruebas × 3) — unlockLevel 10
- 12 específicas familias 4.6+4.7 (4 pruebas × 3) — unlockLevel 15
- **Total: 75 habilidades en abilityCatalog.js**

## Criterios de Sincronía Perfecta por prueba (resultEvaluator.js + componentes)
- Pruebas "parar en valor" (10): `difference <= margin * 0.5`
- Suma100: `score === target && resets === 0`
- DobleNada: `diff <= margin/2`
- CuentaInterna, CadenciaFantasma, CargaEnergia: `error <= margin * 0.5`
- Poliritmo: todos los hits con `|t-pt| <= margin*0.5`
- Equilibrio: nunca toca el borde exacto del rango seguro durante toda la duración
- Banca: suma final en la mitad estricta del rango objetivo (`[min+w/4, max-w/4]`)
- Pacto: acierto al primer intento con rango de amplitud mínima (paso 0.1s)

**Fase B: COMPLETA. Las 20 pruebas tienen criterio perfect definido y habilidades específicas implementadas.**

---

# 13. Estado del roadmap (v3.2)

| Fase | Estado | Contenido |
|---|---|---|
| A | ✅ | Modelo 3 habilidades + migración, 3 estados + Residuos, paredes de grado + Misericordia |
| B | ✅ | Motor de hooks + 75 habilidades (15 generales + 60 específicas), criterios perfect en 20 pruebas |
| C | ✅ | Ecos completos: 17 ecos (5 básicos + 8 avanzados + 4 legendarios), tiers, descarte, slots |
| E | ✅ | Economía (Lereles/Fragmentos/costes), Nivel Coleccionista con desbloqueos reales, récords/coronas/AuraCollectionScreen |
| F | ✅ | Práctica, Modo Infinito, Desafío Diario (seed determinista), Sincronía Perfecta |
| G | ✅ | HomeScreen completo, indicador de Aura en vivo, audio sintético (Web Audio API), drone ambiental |
| H | ✅ | Editor de Pruebas (nivel 15): sliders, peso en vivo, guardar 5/familia, compartir/importar config |
| I | ⏳ pendiente | Firebase Auth + Firestore sync, build Android/APK |

**Antes de Fase I se recomienda una ronda de QA manual** — el sistema tiene ~75 habilidades, 17 ecos y 20 pruebas con muchas combinaciones posibles que no se han probado todas en navegador real, solo verificadas parcialmente prompt a prompt.

---

# 14. Cambios arquitectónicos pendientes (v3.3 — documentados, NO implementados)

Los siguientes cambios están diseñados en GDD v4.1 §Niveles de Prueba y Sincronía pero aún no tienen código. Se registran aquí para guiar la próxima sesión de implementación.

## (a) generateProbeConfig → lectura desde estado de pistas del personaje
`generateProbeConfig` actualmente deriva la config de prueba del tier de Grado (tabla hardcoded por tipo). Con el modelo de pistas (GDD v4.1), la config se leerá del estado de pistas del personaje al instanciar la prueba. Cada pista tiene un índice y un efecto (+1 objetivo, −1cs margen, etc.); la función aplica el efecto acumulado sobre la config Nivel 1.
- Afecta: `src/engine/run/runEngine.js` (`generateProbeConfig`) y el modelo de datos del personaje (añadir `probeProgress: { [probeType]: number }` con valor 0–20).
- Las tablas hardcoded de `runEngine.js` pasarán a definir la config Nivel 1 (punto de partida) y el catálogo de pistas por prueba.

## (b) Cablear activeEcos y passiveAbility en generateProbeConfig
`generateProbeConfig` recibe `activeEcos` y `passiveAbility` como parámetros pero ningún `case` los aplica (bug #5 del diagnóstico). El cableado pendiente:
- Pasar config base generada → `applyProbeConfig(config, character, probeType)` del motor de habilidades (ya existe en `abilityEngine.js`).
- Aplicar modificadores de ecos activos que tengan `scope === probeType` o `scope === 'general'` y hook `PROBE_CONFIG`.
- Resultado: la config final que recibe el componente ya refleja pasiva + ecos.

## (c) Ayuda visual: gating por eco/habilidad en run; libre en Práctica
Estado actual: `showVisualAid`/`helpMode` se leen del config del panel libremente en run y en práctica.
Estado objetivo:
- En run: `showVisualAid: false` por defecto en todos los casos. Solo se activa si un eco activo o la pasiva del personaje lo habilita (via hook `PROBE_CONFIG` → añade `showVisualAid: true`).
- En modo Práctica: el panel de config puede activarlo libremente (sin eco, sin coste).
- Afecta: la lectura de `cfgShowAid` en BingoProbe, EspejoProbe, PenduloProbe, ParpadeoProbe (y el resto de pruebas al implementarlas). Ninguno de los cuatro consulta el modo de sesión; necesitarán recibir un prop `practicaMode` o que la config ya venga con el flag correcto desde el generador.