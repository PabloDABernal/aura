# SDD — Aura
## Software Design Document v1.6
### Documento técnico de implementación. Acompaña al GDD v1.0.

---

# 0. Cómo usar este documento

Este SDD traduce el GDD (el *qué*) a decisiones técnicas (el *cómo*). Está pensado para que Claude Code implemente el juego por fases sin inventarse arquitectura.

**Regla de oro para Claude Code:** el GDD manda en diseño, el SDD manda en implementación. Si algo no está en ninguno, se pregunta antes de inventar.

**Orden de trabajo:** se implementa por fases (sección 8). No se salta a una fase posterior sin cerrar la anterior. La Fase 1 es un vertical slice jugable: un combate con el cronómetro funcionando. Todo lo demás se construye encima de eso una vez validado que es divertido.

---

# 1. Decisión de arquitectura

## 1.1 Reinicio limpio
El proyecto se construyó desde cero siguiendo el GDD. No hay código anterior que reutilizar.



## 1.2 Stack
- **React 19 + Vite** (JavaScript, sin TypeScript)
- **Framer Motion** para animaciones
- **Inline styles + objetos de estilo** (sin CSS modules ni librerías de UI)
- **Capacitor** desde el inicio, para poder exportar APK Android
- **Zustand** como store global en lugar de Context + useReducer múltiples

### Por qué Zustand y no Context
El juego tiene mucho estado compartido (combate, run, colección, meta). Múltiples Context anidados con useReducer se vuelven inmanejables y provocan re-renders en cascada. Zustand da un store global con slices, selectores granulares (menos re-renders) y un reducer-like más limpio. Es ligero y compatible con Capacitor.

Si Claude Code no conoce bien Zustand, alternativa aceptable: un único Context con useReducer y un solo árbol de estado bien tipado por convención. Pero Zustand es la recomendación.

## 1.3 Persistencia
- **Fase inicial: localStorage** mediante el middleware `persist` de Zustand. Todo el progreso del coleccionista (sets, personajes, lugares, ecos, meta) se serializa a localStorage
- **Fase posterior: Firebase** (Auth con Google + Firestore). Se añade como capa de sincronización sin reescribir el store: el mismo estado que va a localStorage se sincroniza a Firestore cuando hay sesión
- El estado de una run activa también se persiste, para poder cerrar y continuar

## 1.4 Capacitor
- Inicializar Capacitor desde el principio aunque se desarrolle en navegador
- Diseño mobile-first vertical (ver GDD Sección 11)
- El build de Vite alimenta a Capacitor para generar el APK
- Evitar APIs de navegador no disponibles en WebView Android

---

# 2. Estructura de carpetas

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Router de pantallas (estado: pantalla activa)
│
├── store/                      # Zustand store con slices
│   ├── index.js                # Combina slices, aplica persist
│   ├── collectionSlice.js      # Sets, personajes, lugares, ecos del jugador
│   ├── metaSlice.js            # Nivel coleccionista, logros, historial, slots
│   ├── runSlice.js             # Estado de la run activa (áreas, nodos, baraja, ecos activos, lereles)
│   ├── combatSlice.js          # Estado del combate activo
│   └── uiSlice.js              # Pantalla activa, modales, overlays
│
├── engine/                     # Lógica pura, sin React
│   ├── combat/
│   │   ├── combatReducer.js    # Resuelve acciones de combate (función pura)
│   │   ├── actions.js          # Definición de acciones y sus validaciones
│   │   ├── vibra.js            # Lógica de la prueba de Vibra (cálculo de resultado)
│   │   ├── timeline.js         # Tiempo de Vibración y umbrales
│   │   ├── enemyAI.js          # Intención y resolución del turno del corrupto
│   │   ├── keywords/           # Implementación de cada keyword
│   │   │   ├── index.js        # Registro de keywords → handlers
│   │   │   ├── activeKeywords.js
│   │   │   ├── passiveKeywords.js
│   │   │   ├── triggerKeywords.js   # alRobarse, enHQ, alDescartarse
│   │   │   └── corruptKeywords.js
│   │   ├── states.js           # Estados alterados (Cancelado, etc.)
│   │   └── victory.js          # Condiciones de victoria/derrota
│   │
│   ├── run/
│   │   ├── runGenerator.js     # Genera áreas, nodos, enemigos, lugares
│   │   ├── deckBuilder.js      # Construye la baraja desde los líderes
│   │   ├── rewards.js          # Cálculo de recompensas entre nodos
│   │   └── checkpoints.js      # Lógica de checkpoints y experiencia
│   │
│   ├── character/
│   │   ├── auraCalculator.js   # Calcula Aura total desde habilidades
│   │   ├── attributeSplit.js   # Reparte Aura en Presencia/Influencia/Temple por color
│   │   └── runLevels.js        # Niveles de carta durante la run (Común→Legendaria)
│   │
│   ├── eco/
│   │   ├── ecoEngine.js        # Aplica efectos de ecos en los puntos clave
│   │   └── ecoHooks.js         # Define los hooks donde los ecos intervienen
│   │
│   └── editor/
│       ├── validators.js       # Validaciones del editor (tiempo real y al confirmar)
│       └── surpriseMe.js       # Generación aleatoria coherente por color
│
├── data/                       # Datos estáticos del juego (no del jugador)
│   ├── colors.js               # 5 colores, perfiles de reparto de atributos
│   ├── keywords.js             # Definiciones de todas las keywords (glosario, niveles, colores)
│   ├── placeTypes.js           # Los 12 tipos de lugar y sus parámetros
│   ├── genericPlaces.js        # 22 lugares genéricos intrínsecos
│   ├── ecoLibrary.js           # Todos los ecos base del juego
│   ├── achievements.js         # Definición de logros
│   └── exampleSets/            # Los 5 sets de ejemplo (uno por color)
│
├── components/
│   ├── screens/                # Una carpeta por pantalla
│   │   ├── LoginScreen.jsx
│   │   ├── MainMenu.jsx
│   │   ├── adventure/
│   │   │   ├── SetSelectionScreen.jsx
│   │   │   ├── LeaderSelectionScreen.jsx
│   │   │   ├── DeckReviewScreen.jsx
│   │   │   ├── MapScreen.jsx
│   │   │   ├── CombatScreen.jsx
│   │   │   ├── RewardScreen.jsx
│   │   │   ├── MerchantScreen.jsx
│   │   │   └── RunEndScreen.jsx
│   │   └── collection/
│   │       ├── CollectionMenu.jsx
│   │       ├── SetsScreen.jsx
│   │       ├── SetEditorScreen.jsx
│   │       ├── CharacterEditorScreen.jsx
│   │       ├── PlaceEditorScreen.jsx
│   │       ├── EcoCollectionScreen.jsx
│   │       ├── EcoEditorScreen.jsx
│   │       ├── StatsScreen.jsx
│   │       └── ProfileScreen.jsx
│   │
│   ├── combat/                 # Componentes del tablero de combate
│   │   ├── EnemyPanel.jsx
│   │   ├── Pit.jsx             # El Foso
│   │   ├── Place.jsx           # Un lugar
│   │   ├── HQ.jsx
│   │   ├── CombatToolbar.jsx
│   │   ├── CharacterActionPanel.jsx
│   │   ├── VibrationTimer.jsx  # Tiempo de Vibración global
│   │   └── CombatLog.jsx
│   │
│   ├── vibra/
│   │   └── TimingChallenge.jsx # El cronómetro (componente central)
│   │
│   ├── cards/
│   │   ├── CharacterCard.jsx   # Carta de personaje (con grado, atributos)
│   │   └── MiniCard.jsx        # Versión pequeña para el tablero
│   │
│   └── ui/                     # Componentes reutilizables
│       ├── KeywordTooltip.jsx
│       ├── AuraBar.jsx
│       ├── Button.jsx
│       └── Modal.jsx
│
├── hooks/                      # Hooks de React reutilizables
│   ├── useTimer.js             # Hook del cronómetro (rAF, precisión)
│   └── useLongPress.js         # Para tooltips en móvil
│
└── styles/
    ├── tokens.js               # Design tokens: colores, espaciado, tipografía
    └── colorThemes.js          # Temas visuales por color de carta
```

---

# 3. Modelo de datos

Todos los objetos son JS planos serializables (sin clases, sin funciones en el estado) para que persistan bien en localStorage y Firestore.

## 3.1 Color (estático)

```js
// data/colors.js
const COLORS = {
  rojo:    { id: 'rojo',    label: 'Rojo',    hex: '#E03B3B', split: { presencia: 0.50, influencia: 0.20, temple: 0.30 } },
  morado:  { id: 'morado',  label: 'Morado',  hex: '#8B3BE0', split: { presencia: 0.25, influencia: 0.50, temple: 0.25 } },
  negro:   { id: 'negro',   label: 'Negro',   hex: '#2B2B33', split: { presencia: 0.35, influencia: 0.35, temple: 0.30 } },
  verde:   { id: 'verde',   label: 'Verde',   hex: '#3BA84F', split: { presencia: 0.20, influencia: 0.30, temple: 0.50 } },
  naranja: { id: 'naranja', label: 'Naranja', hex: '#E0823B', split: { presencia: 0.30, influencia: 0.20, temple: 0.50 } },
};
```

## 3.2 Categoría

Las categorías son del jugador (puede crearlas), pero se guardan en la colección, no como dato estático. Cada color admite máximo 3.

```js
// dentro de collectionSlice
categories: {
  rojo:    ['Anime'],        // el jugador puede añadir hasta 3
  morado:  ['Series'],
  negro:   ['Videojuegos'],
  verde:   ['Literatura'],
  naranja: ['Deportes'],
}
```

## 3.3 Keyword (estática)

```js
// data/keywords.js
{
  id: 'viral',
  name: 'Viral',
  glosario: 'Ganas Aura por cada aliado en tu zona (Lugar o Foso, no HQ).',
  category: 'activa',          // activa | pasiva | alRobarse | enHQ | alDescartarse | confrontacion | intervencion | corrupto_activa | corrupto_pasiva
  scalesByLevel: true,
  values: [1, 2, 3, 4],        // lv1..lv4. null si no escala
  attribute: 'presencia',      // a qué atributo afecta si suma Aura: presencia | influencia | temple | null
  lereleCost: 1,               // cuánto suma al coste (solo activas)
  inheritable: true,           // si un invitado puede heredarla
  colors: ['rojo'],            // colores que pueden usarla
}
```

## 3.4 Personaje (del jugador)

```js
{
  id: 'uuid',
  setId: 'uuid-del-set',
  status: 'draft',             // draft | confirmed
  basics: {
    name: 'Monkey D. Luffy',
    phrase: 'Voy a ser el Rey de los Piratas',  // opcional
    image: 'url-o-dataurl',
  },
  // color y categoría se heredan del set, no se guardan aquí

  leader: {
    activeAbility: AbilityOrNull,   // máximo 1
    passiveAbility: AbilityOrNull,  // máximo 1
    ultimate: UltimateOrNull,
    // aura total y split se CALCULAN, no se guardan
  },

  guest: {
    inheritedAbilityIds: [],        // ids de habilidades del líder marcadas heredables
    onDrawOrInHQ: { trigger: 'onDraw'|'inHQ', ability: AbilityOrNull },
    onDiscard: { fromHQ: AbilityOrNull, fromZone: AbilityOrNull },
    // aura total y split se CALCULAN
  },

  corrupt: {
    vibraTarget: 78,            // 0-99
    baseActions: {
      attackPit:    { value: 2 },
      recover:      { value: 2 },
      interveneRise:{ value: 3 },
      attackPlace:  { value: 2 },
    },
    activeKeywordId: 'corrupcion'|null,
    passiveKeywordId: 'corrupto'|null,
    lostPlaceReaction: { type: 'buffStats'|'changeTimer'|'special', value: any },
    extraTurnConditions: [ { type: 'pitEmpty'|'placeNotConquered'|'playerAuraBelow', value: any } ],
    ultimateCondition: 'auraBelow50'|'turnsWithoutConfront'|'placeConquered'|'allLeadersKO',
    timerModifiers: { hideMark: true, hideCentesimas: false, reducedTime: null, segundosUntil: 0, separatorsFrom: 5, markFrom: 9 },
    pitTimer: null,            // minutos de Vibración en Foso que disparan su Ultimate, o null
    // aura como jefe se CALCULA según tipo de combate
  },
}

// Ability
{
  keywordIds: ['viral'],       // 1 keyword normal salvo Ultimate (varias)
  level: 1,                    // nivel base de la keyword (sube en run)
  customName: '' | null,       // si null se autogenera
  // cost se calcula: sum(lereleCost de keywords), cap 3 activa / 10 ultimate
}

// Ultimate (extiende Ability)
{
  keywordIds: ['viral','desenmascarado'],
  level: 1,
  customName: 'Gear Fifth',
  cost: 7,                     // 1-10, define potencia
}
```

## 3.5 Set (del jugador)

```js
{
  id: 'uuid',
  status: 'draft',             // draft | confirmed | inUse | archived
  color: 'rojo',
  category: 'Anime',
  name: 'One Piece',
  characterIds: [],            // personajes del set
  placeId: 'uuid' | null,      // lugar del set (1)
  leaderUnlockOrder: [],        // orden de desbloqueo de líderes
  unlockedLeaderIds: [],        // líderes desbloqueados como jugables
  stats: {
    runsPlayed: 0,
    runsCompleted: 0,
    bestResult: null,
  },
  collectionPointsEarned: 0,    // para revertir al eliminar
}
```

## 3.6 Lugar (del jugador o genérico)

```js
{
  id: 'uuid',
  status: 'draft'|'confirmed',
  setId: 'uuid' | null,        // null = genérico
  isIntrinsic: false,          // true = uno de los 22 base, no editable
  name: 'Soul Society',
  icon: '🌙',
  type: 'basico',              // ver placeTypes
  resonance: 40,               // resonancia inicial
  upperLimit: 50 | null,       // si el rival lo supera, derrota
  vibra: {                     // parámetros según type
    mode: 'punto'|'centesimas',
    target: 278,               // ms (punto) o centésimas 0-99
    timeLimit: 7,              // segundos
    pifiaMargin: 20,           // centésimas
  },
  pifiaConsequence: { type: 'loseAura'|'raiseResonance'|'discardCard', value: 3 },
  conquerBonus: { type: 'lereles'|'aura'|'randomEco'|'immediate', value: any },
  passive: { description: '', effect: EffectOrNull },
  zoneTimer: null,             // minutos de Vibración en zona que disparan algo
  setAbility: {                // solo si setId != null
    ifNoMatch:  { description: '', effect: Effect },  // a favor del rival
    ifMatch:    { description: '', effect: Effect },  // a favor del jugador
  },
  stats: { timesConquered: 0, timesPlayed: 0 },
}
```

## 3.7 Eco

```js
{
  id: 'uuid',
  name: 'Pulso Estable',
  description: 'El margen de acierto aumenta en +5 centésimas permanente.',
  category: 'vibra',           // vibra | personaje | lugar | economia | sinergia
  rarity: 'normal',            // normal | infrecuente | raro | especial
  doubleEdge: false,
  penalty: null,               // si doubleEdge
  effect: { hook: 'onVibraSetup', type: 'marginBonus', value: 5 },
  unlock: { unlocked: true, condition: null },
  isGoldenEgg: false,
  custom: false,               // creado por el jugador
  stats: { timesUsed: 0, winsCorona2: 0, winsCorona3: 0, winsCorona4: 0, winsCorona5: 0 },
}
```

## 3.8 RunState (estado de la run activa)

```js
{
  active: true,
  leaderIds: [],               // líderes elegidos (2-5)
  setIds: [],                  // sets de esos líderes
  areas: [                     // tantas como líderes + 1
    {
      areaIndex: 0,
      bossSetId: 'uuid',       // set del jefe de esta área
      nodes: [                 // 6 nodos
        {
          nodeIndex: 0,
          type: 'combat_basic', // combat_basic | combat_elite | conquista | merchant | boss | fused
          canBeMerchant: true,  // si el jugador puede ir a tienda en su lugar
          enemyIds: [],         // corrupto(s)
          placeConfigs: [],     // lugares de este nodo
          completed: false,
          result: null,
        }
      ],
    }
  ],
  currentAreaIndex: 0,
  currentNodeIndex: 0,
  deck: [],                    // ids de invitados en orden (la baraja)
  discardPile: [],
  activeEcos: [],              // máximo 10
  lereles: 0,
  runLevels: {},               // { characterId: 'comun'|'infrecuente'|'rara'|'legendaria' }
  runAuraBonus: {},            // { characterId: { presencia, influencia, temple } } mejoras temporales
  checkpointsPassed: 0,
  vibrationTimeTotal: 0,       // ms acumulados en toda la run (para stats)
}
```

## 3.9 CombatState (estado del combate activo)

```js
{
  nodeType: 'combat_basic',
  turn: 'player'|'enemy',
  enemies: [                   // 1 o 2 corruptos
    {
      characterId: 'uuid',
      auraMax: 40,
      auraCurrent: 40,
      vibraTarget: 78,
      intention: { action: 'attackPlace', value: 2, ambush: false, targetId: null },
      states: [],              // estados alterados (cancelado, etc.)
      buffs: {},
    }
  ],
  pit: [                       // personajes en el Foso (máximo 5)
    { characterId, presencia, influencia, temple, exhausted, states, cooldowns }
  ],
  places: [                    // 1 a 3 lugares
    {
      placeId: 'uuid',
      type: 'basico',
      resonanceCurrent: 40,
      resonanceMax: 40,
      rivalResonance: null,    // solo carrera de auras
      occupants: [],           // personajes en el lugar (máximo 5)
      conquered: false,
      state: null,             // estado del lugar (modificadores de cronómetro)
      zoneTime: 0,             // ms de Vibración en esta zona
    }
  ],
  hq: [                        // máximo 5
    { characterId, presencia, influencia, temple, exhausted, isKO, states, cooldowns, isLeader }
  ],
  deck: [],                    // referencia a run.deck (los aún no robados)
  discardPile: [],
  lereles: 0,                  // referencia a run.lereles
  vibrationTime: 0,            // ms de Vibración en este combate
  log: [],                     // entradas del log
  pendingVibra: null,          // si hay un TimingChallenge en curso
  victory: null,               // null | 'win' | 'lose'
}
```

---

# 4. El motor de combate

## 4.1 Principio: lógica pura separada de React
Toda la resolución de combate vive en `engine/combat/` como funciones puras: reciben estado + acción, devuelven estado nuevo. React solo lee el estado del store y dispara acciones. Esto permite testear el motor sin UI y evita bugs de re-render.

## 4.2 Flujo de un turno del jugador

```
1. Jugador selecciona personaje y acción (UI)
2. validateAction(state, action) → ¿es legal?
3a. Acción automática (mover, robar, descansar, descartar):
    → combatReducer(state, action) → nuevo estado → render
3b. Acción con Vibra (confrontar, intervenir, activa con keyword):
    → el jugador elige modo: Acción Segura o Vibra
    → Acción Segura: resuelve directo con valor base, suma tiempo fijo
    → Vibra: abre TimingChallenge (pendingVibra)
       → jugador para el cronómetro
       → vibra.resolve() calcula resultado (Flow/Vibra/Fallo/Pifia/Timeout)
       → combatReducer aplica efecto según resultado
       → suma tiempo de Vibración real gastado
4. Tras la acción: checkVictory(state)
5. Si no hay victoria: turn = 'enemy' → resolveEnemyTurn()
6. resolveEnemyTurn ejecuta la intención mostrada, recalcula nueva intención
7. checkVictory de nuevo → turn = 'player'
```

## 4.3 La prueba de Vibra (`vibra.js`)

```js
// Entrada
resolveVibra({
  mode,            // 'centesimas' | 'punto'
  target,          // centésimas 0-99 (centesimas) o ms objetivo (punto)
  stopTime,        // ms en que el jugador paró
  margin,          // centésimas de margen total (= atributo del personaje)
  marginSide,      // 'both' | 'before' | 'after'. 'both' reparte margin/2 a cada lado
  pifiaMargin,     // centésimas extra antes de pifia (default 20)
  baseDamage,      // presencia (confrontar) o influencia (intervenir)
  ecoModifiers,    // modificadores de ecos activos
})

// Cálculo
// modo centesimas: extraer centésimas de stopTime, comparar con target
// modo punto: comparar stopTime con target directamente
// diff = distancia al objetivo respetando marginSide:
//   - 'both': abs(parada - objetivo), zona de acierto = ±(margin/2)
//   - 'before': solo cuenta si paró ANTES del objetivo, zona = margin completo antes
//   - 'after': solo cuenta si paró DESPUÉS, zona = margin completo después
// bonusTiempo (solo centesimas): según el segundo en que paró (5/4/3/2/1/0)

// Salida
{
  result: 'flow'|'vibra'|'fail'|'pifia'|'timeout',
  multiplier: 2|1|0,
  bonusTiempo: 0..5,
  finalValue: baseDamage * multiplier + bonusTiempo,
  auraGain: number,  // flow: 2+bonusTiempo, vibra: 1+bonusTiempo, fail/timeout: 0, pifia: -1
  timeSpent: stopTime,
}
```

Resultados (GDD Sección 2):
- **flow**: diff === 0 → multiplier 2, auraGain = 2 + bonusTiempo. En modo punto (Intervenir): diff===0 también cuenta como flow
- **vibra**: diff <= margin → multiplier 1, auraGain = 1 + bonusTiempo
- **fail**: diff <= margin + pifiaMargin → multiplier 0, auraGain 0
- **pifia**: diff > margin + pifiaMargin → multiplier 0, auraGain -1
- **timeout**: multiplier 0, auraGain 0
- **accion_segura**: daño base fijo (presencia sin multiplicador), auraGain 0

## 4.4 Tiempo de Vibración (`timeline.js`)
- `vibrationTime` (combate) y `vibrationTimeTotal` (run) en ms
- Cada Vibra suma `timeSpent`. Cada Acción Segura suma una constante fija (ej: 3000ms)
- El rival puede sumar tiempo vía keywords (Contaminación)
- Al conquistar un lugar: restar `place.zoneTime` del total del combate
- Umbral 5min (300000ms): flag `enemyDoubleEffect = true`
- Umbral 10min (600000ms): `victory = 'lose'`

## 4.5 Cálculo de atributos (`auraCalculator.js` + `attributeSplit.js`)

```js
// auraCalculator: Aura total del líder
function leaderAura(character) {
  let aura = 8;
  if (character.leader.activeAbility) aura -= 1;
  if (character.leader.passiveAbility) aura -= 1;
  if (character.leader.ultimate?.cost >= 5) aura -= 1;
  return aura; // 5..8
}

// guest aura: 5 - (nº habilidades), min 1
// corrupt aura: leaderAura * multiplicador según tipo combate
// Multiplicadores: normal=×3, élite=×5, jefe=×10, fusionado=×10 (sumado)

## 4.6 Sistema de daño y KO
- El daño del rival resta primero a `temple`
- Si temple llega a 0, el sobrante resta de `presencia` o `influencia` (aleatorio)
- KO cuando presencia + influencia + temple === 0
- Invitado KO → a discardPile
- Líder KO → a hq con `isKO: true`, reanimar cuesta 1 acción + 5 lereles

**Ganancia de Aura al acertar (resolveVibra):**
- Flow (+2 Aura): se reparte entre los atributos del personaje según el perfil de su color
- Vibra (+1 Aura): ídem
- Pifia (-1 Aura): resta de temple primero
- Acción Segura: sin ganancia de Aura
- El bonus de Aura es acumulativo: varias habilidades y Ecos pueden amplificarlo

## 4.7 IA del corrupto (`enemyAI.js`)
- Calcula intención al final del turno del jugador, la muestra en `enemy.intention`
- Lógica base (GDD Sección 4):
  - resonancia del lugar < 30% del máximo → intervenir (subir resonancia)
  - hay personaje en el Foso → atacar Foso
  - hay personajes en lugar → atacar lugar
  - si no → recuperar Aura
  - 20% probabilidad de emboscada (ambush) si tiene la keyword
- Los ataques ATACAR_FOSO y ATACAR_LUGAR son esquivables SOLO si el rival tiene keyword Emboscada activa ese turno. Sin Emboscada el daño se aplica directo. Con Emboscada: genera pendingDefensiveVibra. Parry si para antes de segundosUntil: esquiva + contrataque de Presencia del personaje

## 4.8 Keywords (`keywords/`)
Cada keyword es un handler registrado por id. El motor no tiene `if` gigantes: busca el handler de la keyword y lo ejecuta en el hook correcto.

```js
// keywords/index.js
const KEYWORD_HANDLERS = {
  viral: { hook: 'onActivate', apply: (ctx) => { /* +aura por aliado */ } },
  tendencia: { hook: 'onRest', apply: (ctx) => { /* +aura */ } },
  // ...
};
```

Hooks disponibles: `onActivate`, `onPassiveTick`, `onMove`, `onReturnHQ`, `onLeaderReturnHQ`, `onKO`, `onConquer`, `onAllyEnter`, `onConfront`, `onTargeted`, `onRest`, `onDraw`, `inHQ`, `onDiscard`.

---

# 5. El componente TimingChallenge

El componente más importante del juego. Vive en `components/vibra/TimingChallenge.jsx`.

## 5.1 Precisión del cronómetro
- Usar `requestAnimationFrame`, NO `setInterval` (setInterval acumula drift)
- Guardar `startTimestamp = performance.now()` al pulsar EMPEZAR
- En cada frame: `elapsed = performance.now() - startTimestamp`
- Al pulsar PARAR: `stopTime = elapsed`, congelar y resolver
- `performance.now()` da precisión sub-milisegundo, suficiente para centésimas

## 5.2 Props
```js
{
  mode: 'centesimas'|'punto',
  target,           // centésimas (0-99) o ms objetivo
  margin,           // del atributo del personaje (Presencia o Influencia). Repartido ±margin/2 a cada lado
  marginSide,       // 'both' | 'before' | 'after' (default 'both')
  pifiaMargin,      // centésimas extra antes de pifia (default 20)
  timeLimit,        // segundos (default 10 centesimas, 7 punto)
  reveal,           // umbrales de revelación progresiva (ver 5.3). Configurable por enemigo/lugar/eco
  actionLabel,      // "CONFRONTAR" | "INTERVENIR"
  actionContext,    // "Luffy vs Corrupto X"
  ecoModifiers,
  onResult,         // callback(resultObj)
}

// reveal (objeto de umbrales, todos configurables):
{
  segundosUntil: 0,      // 0 = centésimas desde el inicio (DEFAULT). >0 = segundos enteros primero
  separatorsFrom: 5,     // desde aquí aparecen separadores (default: 5s de 10s)
  markFrom: 9,           // último segundo (default: timeLimit-1). hideMark:true por defecto
  hideMark: true,        // por defecto la marca NO aparece. Solo con showMark:true (habilidad activa)
  hideSeparators: false, // si true, los separadores nunca aparecen
  hideCentesimas: false, // si true, solo décimas siempre (modificador especial rival difícil)
  soloBar: false,        // si true, número nunca visible. Separadores aparecen en timeLimit-3s
  // Ventana que se Cierra:
  closingWindow: false,
  closingRate: 5,
  closingMinMargin: 0,
  // Acelerón:
  acceleration: false,
  startSpeed: 1.0,
  speedPerSecond: 0.3,
  maxSpeed: 3.0,
  // Péndulo (solo modo 'pendulo'):
  pendulumRange: 5,
  pendulumDecay: 0.1,
}

// MARGEN: atributo / 2, repartido a cada lado
// Presencia 8 → ±4 centésimas. Presencia 4 → ±2.
// NO usar margen fijo. Siempre derivado del atributo del personaje.
```

## 5.3 Comportamiento y revelación progresiva
1. Aparece como **overlay modal centrado**, oscureciendo el combate detrás
2. Cronómetro PARADO en 0.00
3. Muestra siempre: objetivo (número), margen (`atributo/2` a cada lado), qué es Pifia, qué es Flow, bonus de tiempo
4. Botón EMPEZAR grande (tecla Espacio / tap en cualquier parte)
5. Al pulsar: arranca con requestAnimationFrame, botón pasa a PARAR

**Revelación progresiva mientras corre (modo centesimas):**
- Por defecto (`segundosUntil: 0`): **centésimas desde el inicio** (0.78). Barra completamente limpia
- Si `segundosUntil > 0`: muestra segundos enteros hasta ese momento, luego centésimas
- Desde `reveal.separatorsFrom` s (default 5s): aparecen **separadores de segundos** en la barra
- Desde `reveal.markFrom` s (default 9s, último segundo): aparece la **marca sutil amarilla** si `showMark=true`
- `hideCentesimas`: solo décimas siempre (modificador especial para rivales difíciles)
- `soloBar`: número nunca visible. Separadores aparecen en `timeLimit - 3` segundos

**Revelación progresiva (modo punto):**
- El número objetivo siempre visible
- Barra completamente limpia hasta el último segundo antes del objetivo → aparecen separadores
- La marca sutil NO aparece por defecto (`hideMark: true`). Solo aparece si el personaje tiene la habilidad activa "Visión" activa en esa intervención

6. Al pulsar PARAR o llegar a timeLimit: congela el número y revela todas las zonas de colores (verde acierto, rojo fallo, negro pifia con calavera)
7. Anima el resultado 1.5s, llama onResult y cierra

## 5.4 Cálculo del margen dinámico
```js
// El margen crece linealmente durante la prueba:
// t=0 → margen = MIN_MARGIN (2 centésimas)
// t=separatorsFrom (5s) → margen = maxMargin
// Entre 0 y separatorsFrom: interpolación lineal
const MIN_MARGIN = 2;
const maxMarginConfront = Math.max(character.presencia, MIN_MARGIN);
const maxMarginIntervenir = Math.max(character.influencia, MIN_MARGIN);

function getDynamicMargin(elapsed, separatorsFromMs, maxMargin) {
  const t = Math.min(elapsed / separatorsFromMs, 1); // 0..1
  return Math.round(MIN_MARGIN + t * (maxMargin - MIN_MARGIN));
}
// separatorsFromMs = reveal.separatorsFrom * 1000

// TimingChallenge recibe maxMargin + separatorsFrom.
// Calcula margen actual en cada frame → zona de acierto crece visualmente.
// Al parar usa el margen del momento exacto para resolver.

// Esquivar defensivo: margen FIJO min(max(temple,1),3) — no dinámico
const dodgeMargin = Math.min(Math.max(character.temple, 1), 3);

// marginSide 'both': [target-margin, target+margin]
// 'before'/'after': asimétrico con margin*2 en un lado
// Modo punto (Intervenir): diff===0 → Flow (×2)
```

## 5.5 Variante defensiva — Esquivar y Parry (última oportunidad)
El TimingChallenge defensivo se activa automáticamente cuando un ataque del rival haría llevar a 0 alguno de los atributos del personaje atacado. No depende de Emboscada. Es la última oportunidad antes del KO.

Margen: `min(max(temple, 1), 3)` a cada lado. Máximo ±3, mínimo ±1.

- **Parry** (stopTime < segundosUntil * 1000): esquiva + contrataque de Presencia al rival
- **Éxito** (dentro del margen): esquiva el daño
- **Fallo**: recibe el daño que iba a matar el atributo
- **Pifia**: recibe el doble del daño
- **Timeout**: recibe el daño normal

Puede ocurrir hasta 3 veces por personaje (una por atributo). La keyword Emboscada del rival ya no activa defensivo: en su lugar, Emboscada permite al rival encadenar una acción extra.

---

# 6. Estado y store (Zustand)

## 6.1 Slices
- `collectionSlice`: sets, personajes, lugares del jugador, ecos custom, categorías. Persiste
- `metaSlice`: nivel coleccionista, puntos, logros, historial, slots desbloqueados. Persiste
- `runSlice`: RunState. Persiste (para continuar run)
- `combatSlice`: CombatState. Persiste mientras dure el combate
- `uiSlice`: pantalla activa, modales. No persiste

## 6.2 Acciones de combate
El combatSlice no implementa la lógica: delega en `engine/combat/combatReducer.js`.

```js
// combatSlice
dispatchCombat: (action) => set((state) => ({
  combat: combatReducer(state.combat, action, getDataContext())
}))
```

`getDataContext()` proporciona acceso a datos estáticos (keywords, colores) y a la colección (personajes) que el reducer necesita para resolver.

## 6.3 Selectores
Definir selectores granulares para que los componentes solo se re-rendericen cuando cambia lo suyo:
```js
const useLereles = () => useStore(s => s.run.lereles);
const useEnemyIntention = () => useStore(s => s.combat.enemies[0]?.intention);
```

---

# 7. Persistencia

## 7.1 localStorage (fase inicial)
Middleware `persist` de Zustand sobre collectionSlice, metaSlice, runSlice, combatSlice. Clave única `aura-save-v1`. Versionar el esquema para migraciones futuras.

## 7.2 Firebase (fase posterior)
- Google Auth
- Firestore: documento por usuario con la misma forma que el estado persistido
- Estrategia: localStorage es la fuente de verdad en sesión; al login se sincroniza con Firestore (merge), y los cambios se escriben a Firestore con debounce
- No reescribe el store: es una capa de sincronización encima

## 7.3 Capacitor / APK
- `@capacitor/preferences` puede sustituir localStorage en Android para mayor robustez, pero localStorage funciona en WebView. Empezar con localStorage
- Build: `vite build` → `npx cap sync` → `npx cap open android` → generar APK
- Documentar el proceso de build de APK en el README

---

# 8. Plan de implementación por fases

## FASE 1 — Vertical slice del cronómetro ✅ COMPLETADA
Objetivo: validar que "para el cronómetro" es divertido. Un solo combate básico hardcodeado, jugable de principio a fin.

Incluye:
- Andamiaje del proyecto (Vite + React + Zustand + Capacitor + Framer Motion)
- Design tokens y estilos base
- `TimingChallenge` completo y pulido (modo centésimas y punto)
- `auraCalculator` + `attributeSplit`
- Motor de combate mínimo: confrontar, intervenir, mover, descansar, robar, descartar, pasar
- Acción Segura vs Vibra
- Tiempo de Vibración con umbrales
- IA del corrupto básica (4 acciones + intención visible)
- Sistema de daño/KO con los tres atributos
- CombatScreen con layout vertical (Foso, 1 Lugar, HQ, enemigo, toolbar, log)
- 2 colores implementados (Rojo y Verde) con sus keywords básicas
- 6 personajes hardcodeados (3 por color) + 1 corrupto + 1 lugar tipo Básico
- Condiciones de victoria/derrota

NO incluye: mapa, run completa, editor, ecos, meta, otros tipos de lugar, otros colores.

Al final de Fase 1: se puede jugar un combate completo contra un corrupto, con el cronómetro, y ganar o perder. Aquí se valida la diversión antes de seguir.

## FASE 2 — La run completa ✅ COMPLETADA
Entregado: runGenerator, checkpoints, runLevels, flujo completo Login→Set→Leader→Deck→Map→Combat→Reward→Map, completeNode(), setRun en store, MerchantScreen y RewardScreen sin crash, RunEndScreen. Build limpio 466KB.
Pendiente (no bloquea Fase 3): tipos élite/conquista/jefe/fusionado, tipos de lugar cronometrado/carrera/bastión, editors de colección completos.

## FASE 3 — Ecos ✅ COMPLETADA
Entregado: `engine/eco/ecoHooks.js` (7 constantes), `engine/eco/ecoEngine.js` (applyEcos puro), integración en combatReducer en los 5 hooks (ON_DRAW, ON_REST, ON_VIBRA_RESULT, ON_KO, ON_PLACE_CONQUERED), `EcoSelectionScreen` con flujo de descarte a 10 ecos, flujo combat→reward→eco-selection→map operativo.

## FASE 4 — Editor y colección ✅ COMPLETADA
Entregado: collectionSlice completo (draft/confirmed/inUse/archived), SetEditorScreen, CharacterEditorScreen (4 secciones + Surprise Me), PlaceEditorScreen (12 tipos + intrínseco toggle), EcoEditorScreen (nuevo, con live preview), 3 colores restantes en colors.js, placeTypes.js con 12 tipos, onboarding 5 sets precargados, SetSelectionScreen/LeaderSelectionScreen/DeckReviewScreen migrados a getDataCtx(). Build limpio 471 módulos.

## FASE 5 — Meta-progresión ✅ COMPLETADA
Entregado: metaSlice completo (collectionPoints, collectorLevel 1–20, runHistory, unlockedAchievements, ecoMastery, characterUsage, placeStats), RECORD_RUN_END con evaluación de logros y toasts secuenciales, ProfileScreen con LEVEL_NAMES y barra de progreso, StatsScreen con tabs Global/Historial, AchievementsScreen con estado visual, SetSelectionScreen limitado por slots de nivel. Build limpio 471 módulos.

## CORRECCIONES POST-FASES (aplicadas tras cierre de Fase 6 parcial)

**Navegación — MainMenuScreen**
Nuevo hub central tras login. Botones: JUGAR (detecta run activa → continuar/nueva), COLECCIÓN, PERFIL, ESTADÍSTICAS, LOGROS. Botón "← Menú" en todas las pantallas de nivel superior. Acceso a colección eliminado desde el mapa. Login siempre va a main-menu.

**Combate — resolución de charDef**
CombatScreen usaba `CHARACTERS` hardcodeado de phase1Data para resolver personajes en UI. Reemplazado por `useMemo` que fusiona `CHARACTERS` + `collection.characters` y `PLACES` + `collection.places`. Todos los personajes (phase1Data, onboarding, colección del jugador) se renderizan correctamente.

**Combate — layout HQ**
HQ sticky al fondo, siempre visible con cartas en fila. Sin huecos muertos. Layout: enemigo arriba → zonas (Foso/Lugar) en medio → HQ + acciones abajo fijo.

**Sets fantasma eliminados**
One Piece y Dragon Ball migrados de phase1Data a collectionSlice como sets confirmed con ownerId: 'local'. Ahora son 7 sets visibles en el editor. Todos los sets jugables son sets de la colección.
Estado actual: `src/__tests__/build_android.md` existe con instrucciones. No hay integración Firebase ni build Capacitor configurado.

A implementar:
- Firebase Auth: Google Sign-In + anónimo. `LoginScreen` ya tiene el botón de Google deshabilitado — activarlo
- Firestore: sincronización de colección (sets/personajes/lugares/ecos propios) y meta (puntos, logros, historial) vinculados al uid
- Regla de merge: datos locales (localStorage/Zustand persist) tienen prioridad si son más recientes que Firestore
- `src/firebase.js`: inicialización con config de entorno (.env), exports de auth y db
- `authSlice` en el store: uid, displayName, photoURL, isAnonymous, syncStatus
- Sincronización lazy: al hacer login, pull de Firestore → merge con local → push si local es más nuevo
- Capacitor build: `npx cap sync android`, configurar `capacitor.config.ts` con appId `com.aura.cardgame`, appName `Aura`
- `AndroidManifest.xml`: permisos internet + vibración
- Generar APK debug con `./gradlew assembleDebug` desde `android/`
- El APK final en `android/app/build/outputs/apk/debug/app-debug.apk`

## FASE 4 — Editor y colección
- collectionSlice completo
- SetEditorScreen con estados (draft/confirmed/inUse/archived)
- CharacterEditorScreen con las 4 secciones y validación
- PlaceEditorScreen
- EcoEditorScreen
- Surprise Me
- Los 5 sets de ejemplo + onboarding
- 3 colores restantes (Morado, Negro, Naranja) y todas las keywords
- Los 12 tipos de lugar
- 22 lugares genéricos intrínsecos

## FASE 5 — Meta-progresión
- metaSlice completo
- Nivel de coleccionista y puntos
- Slots de sets desbloqueables
- Historial completo
- Logros
- Maestría de ecos
- StatsScreen

## FASE 6 — Persistencia en la nube y APK
- Firebase Auth + Firestore
- LoginScreen funcional
- Sincronización
- Build de APK con Capacitor, pruebas en Android

## FASE 7 — Pulido
- Animaciones y transiciones (Framer Motion)
- Intros de jefes
- Grados visuales de cartas
- Glosario in-game
- Balance

---

# 9. Convenciones de código

- JavaScript, sin TypeScript, pero con JSDoc en funciones del motor para documentar shapes
- Componentes funcionales con hooks
- Lógica de juego SIEMPRE en `engine/`, nunca en componentes
- Los componentes leen del store y disparan acciones, no calculan reglas
- Inline styles desde `styles/tokens.js`, no valores mágicos
- IDs con `crypto.randomUUID()`
- Nada de localStorage directo: todo vía el persist del store
- Funciones del motor puras y testeables (mismo input → mismo output)
- Mobile-first vertical en todos los componentes

---

# 10. Notas para Claude Code

## Bloque obligatorio de inicio de sesión
Pegar SIEMPRE al principio de cualquier prompt antes de pedir nada:
```
Lee docs/GDD.md (v1.1) y docs/SDD.md (v1.6) antes de empezar.
Estoy en Windows con PowerShell. Ejecuta siempre en modo --dangerously-skip-permissions para esta sesión. Tienes permiso permanente para ejecutar cualquier comando npm, npx, node y operaciones de ficheros sin pedir confirmación en ningún momento de esta sesión.
Guarda tests en src/__tests__/ y capturas en src/__tests__/screenshots/.
Nunca en la raíz del proyecto.
```

## Reglas generales

- Lee el GDD v1.1 junto a este SDD v1.6. GDD = qué, SDD = cómo
- Fases 1–5 completadas. Correcciones críticas aplicadas. Rediseño de combate en curso (Prompt D1).
- **CAMBIO DE PARADIGMA EN COMBATE (v1.6):** el daño ya no es automático entre jugador y corrupto. Todo pasa por el cronómetro. Ver GDD v1.1 Sección 2 para el diseño completo.

**Motor de combate — estado objetivo tras Prompt D1:**
- `applyDamageToChar`: Temple primero, luego Presencia/Influencia aleatoriamente, mínimo de acción = 2
- `vibra.js`: multiplicadores por segundo (0.xx=×2, 1.xx=×1.8 ... 5.xx+=×1.0)
- Fallo Confrontar: corrupto aplica Presencia × N personajes a TODOS del Foso
- Fallo Intervenir: corrupto sube resonancia del Lugar en su Influencia
- Pifia: fallo + pierde 1 atributo (Temple primero)
- Mover consume turno
- Descansar: solo en HQ, solo recarga CDs
- Atributos del corrupto dinámicos: presencia/influencia/temple, crecen con sus acciones
- Acciones del corrupto: rest, presencia_up, influencia_up, temple_up, attack_place, intervene_place
- Sin daño automático del corrupto al jugador salvo attack_place
- No empieces una fase sin cerrar la anterior
- Si una decisión técnica no está aquí, pregunta antes de inventar
- Guarda todos los archivos de prueba y tests en src/__tests__/. Nunca en la raíz del proyecto
- Las capturas de pantalla y scripts de verificación van en src/__tests__/screenshots/
- Cada fase termina con algo ejecutable y probable, no con código a medias
- Lanzar Claude Code con: `claude --dangerously-skip-permissions`

---

*SDD v1.6 — Acompaña al GDD v1.1. Documento técnico vivo.*