/**
 * Esquema de personaje y pools de habilidades. GDD v2.1 Sección 2 y 5.
 */

export const ABILITY_POOL = [
  // Pasivas generales (scope: 'general') — siempre activas durante la run
  { id: 'p01',    name: 'Vitalidad',         type: 'passive', scope: 'general', description: '+1 vida al empezar la run' },
  { id: 'p02',    name: 'Margen amplio',     type: 'passive', scope: 'general', description: 'Margen de acierto +5 centésimas en todas las pruebas' },
  { id: 'p03',    name: 'Sin prisa',         type: 'passive', scope: 'general', description: 'Tiempo límite +10 segundos en todas las pruebas' },
  { id: 'p04',    name: 'Resistencia',       type: 'passive', scope: 'general', description: 'El primer fallo de la run no quita vida' },
  { id: 'p_tempo',name: 'Cronista',          type: 'passive', scope: 'general', description: 'Los Residuos Temporales se activan tras 2 fallos en lugar de 3' },
  { id: 'p05',    name: 'Reset suave',       type: 'passive', scope: 'suma100', description: 'En Suma 100: al pasarse el marcador va a 50 en lugar de 0' },
  { id: 'p06',    name: 'Concentración',     type: 'passive', scope: 'bingo',   description: 'Las pruebas de Bingo muestran 1 objetivo menos' },
  { id: 'p07',    name: 'Veterano',          type: 'passive', scope: 'general', description: 'Recibes 1 opción de eco adicional en cada selección' },
  { id: 'p08',    name: 'Segundo aire',      type: 'passive', scope: 'general', description: 'Al llegar a 1 vida, el siguiente fallo no quita vida (una vez por run)' },
  { id: 'p09',    name: 'Flujo',             type: 'passive', scope: 'general', description: 'Cada prueba superada añade +2 centésimas de margen a la siguiente' },
  { id: 'p10',    name: 'Instinto',          type: 'passive', scope: 'xopportunities', description: 'En X Oportunidades: el primer intento siempre cuenta como captura' },
  // Activas generales — se usan una vez por run
  { id: 'a01', name: 'Cámara lenta',         type: 'active',  scope: 'general', description: 'Reduce la velocidad del cronómetro al 50% durante 5 segundos' },
  { id: 'a02', name: 'Vista previa',         type: 'active',  scope: 'general', description: 'Ver los objetivos de la próxima prueba 3 segundos antes de que empiece' },
  { id: 'a03', name: 'Segunda oportunidad',  type: 'active',  scope: 'general', description: 'Repite la prueba actual sin perder vida' },
  { id: 'a04', name: 'Tiempo extra',         type: 'active',  scope: 'general', description: '+15 segundos al tiempo límite de la prueba actual' },
  { id: 'a05', name: 'Escudo',               type: 'active',  scope: 'general', description: 'El siguiente fallo no resta vida (se activa ahora, consume en el próximo fallo)' },
  { id: 'a06', name: 'Descifrado',           type: 'active',  scope: 'general', description: 'Muestra la posición exacta de todos los objetivos durante 2 segundos' },
  { id: 'a07', name: 'Turbo',                type: 'active',  scope: 'general', description: 'La próxima prueba dura el doble de tiempo' },
  { id: 'a08', name: 'Reset seguro',         type: 'active',  scope: 'suma100', description: 'En Suma 100: el siguiente reset no penaliza' },
  { id: 'a09', name: 'Racha',                type: 'active',  scope: 'general', description: 'Las próximas 3 pruebas tienen el margen de acierto duplicado' },
  { id: 'a10', name: 'Oportunidad extra',    type: 'active',  scope: 'xopportunities', description: 'En X Oportunidades: añade 2 intentos adicionales' },
];

export const AURA_ABILITY_POOL = [
  { id: 'aa01', name: 'Revive',              scope: 'general', description: 'Recupera 1 vida' },
  { id: 'aa02', name: 'Habilidad libre',     scope: 'general', description: 'Activa tu habilidad activa gratis (sin gastar el uso)' },
  { id: 'aa03', name: 'Eco de oro',          scope: 'general', description: 'El siguiente eco es de rareza superior' },
  { id: 'aa04', name: 'Tiempo bonus',        scope: 'general', description: '+5 segundos al tiempo límite de la prueba actual' },
  { id: 'aa05', name: 'Autopaso',            scope: 'general', description: 'La siguiente prueba se supera automáticamente' },
  { id: 'aa06', name: 'Extra vida',          scope: 'general', description: 'Gana 1 vida extra (máximo 4)' },
  { id: 'aa07', name: 'Objetivo borrado',    scope: 'general', description: 'Elimina el objetivo más difícil de la prueba actual' },
  { id: 'aa08', name: 'Continuidad',         scope: 'general', description: 'La prueba actual no puede contar como fallo' },
  { id: 'aa09', name: 'Flash',               scope: 'general', description: 'Muestra la posición exacta de todos los objetivos durante 1 segundo' },
  { id: 'aa10', name: 'Suma bonus',          scope: 'suma100', description: 'En Suma 100: añade 10 al marcador actual' },
  { id: 'aa11', name: 'Lentitud',            scope: 'general', description: 'Cronómetro al 75% de velocidad durante 3 segundos' },
  { id: 'aa12', name: 'Acierto garantizado', scope: 'general', description: 'La próxima parada cuenta como acierto sin importar el valor' },
  { id: 'aa13', name: 'Eco gratis',          scope: 'general', description: 'Recibes un eco adicional ahora mismo' },
  { id: 'aa14', name: 'Visión',              scope: 'general', description: 'Muestra todos los objetivos restantes durante 2 segundos' },
  { id: 'aa15', name: 'Segunda vida',        scope: 'general', description: 'Si fallas la prueba actual por primera vez, no cuenta como fallo esta vez' },
];

export const CHARACTER_DEFAULTS = {
  grade: 1,
  status: 'active',
  failedRunsAtGrade: 0,
  temporalResidues: 0,
  stats: {
    runsCompleted: 0,
    runsFailed: 0,
    bestInfiniteScore: 0,
    hasCrown: false,
    crowns: 0,
    perfectSyncTime: 0,
    runHistory: [],
  },
};
