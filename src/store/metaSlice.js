/**
 * Meta-progresión del coleccionista. GDD sección 10 + GDD v4.0 §8.1.
 * Nivel 1-20, puntos, historial de runs, logros, maestría de ecos, collector XP.
 */
import { checkRunAchievements } from '../data/achievements.js';
import { computeCollectorLevel } from '../data/economyConfig.js';

// Umbral de puntos para alcanzar cada nivel (índice 0 = nivel 1).
export const LEVEL_THRESHOLDS = [
  0, 10, 25, 45, 70, 100, 140, 190, 250, 320,
  400, 490, 590, 700, 820, 950, 1100, 1260, 1430, 1610,
];

// Nombres temáticos de nivel.
export const LEVEL_NAMES = [
  'Novato',         // 1
  'Seguidor',       // 2
  'Aficionado',     // 3
  'Buscador',       // 4
  'Coleccionista',  // 5
  'Explorador',     // 6
  'Estudioso',      // 7
  'Custodio',       // 8
  'Analista',       // 9
  'Experto',        // 10
  'Curador',        // 11
  'Guardián',       // 12
  'Maestro',        // 13
  'Veterano',       // 14
  'Élite',          // 15
  'Campeón',        // 16
  'Leyenda',        // 17
  'Gran Maestro',   // 18
  'Purificador',    // 19
  'PSA 10',         // 20
];

/** Devuelve el nivel (1-20) para los puntos dados. */
export function getCollectorLevel(points) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return Math.min(20, level);
}

/** Slots disponibles para seleccionar sets en una run según nivel. */
export function getSlotsForLevel(level) {
  if (level >= 20) return 8;
  if (level >= 16) return 7;
  if (level >= 12) return 6;
  if (level >= 8)  return 5;
  if (level >= 4)  return 4;
  return 3;
}

export const POINTS = {
  confirmSet: 5, confirmCharacter: 1, confirmPlaceSet: 2, confirmPlaceGeneric: 3,
  confirmEco: 2, completeRun: 10, defeatBoss: 3, defeatFused: 5,
};

export const INITIAL_META = {
  collectionLevel:  1,
  collectionPoints: 0,
  collectorLevel:   1,
  collectorXP:      0,
  leveledUp:        undefined,
  achievements:     {},           // { [achievementId]: { unlocked: bool, unlockedAt: ms } }
  runHistory:       [],           // max 50
  currentWinStreak: 0,
  bestWinStreak:    0,
  globalStats: {
    totalRuns:         0,
    totalWins:         0,
    totalFlows:        0,
    totalPifias:       0,
    totalVibrationTime: 0,
  },
  ecoMastery:           {},       // { [ecoId]: timesChosen }
  characterUsage:       {},       // { [characterId]: timesPlayed }
  placeStats:           {},       // { [placeId]: timesConquered }
  dailyChallengeState:  null,     // { date: 'YYYYMMDD', completed: bool, probesPassed: number }
  bestDailyResult:      null,     // { date: 'YYYYMMDD', probesPassed: number }
  audioEnabled:         true,
  savedProbeConfigs:    {},       // { [probeType]: [{id, name, config, createdAt}] } max 5 per type
  hasSeenIntro:         false,
};

export function metaReducer(meta = INITIAL_META, action) {
  switch (action.type) {

    case 'GAIN_POINTS': {
      const newPoints = Math.max(0, (meta.collectionPoints ?? 0) + action.amount);
      const newLevel  = getCollectorLevel(newPoints);
      return { ...meta, collectionPoints: newPoints, collectionLevel: newLevel };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      if (meta.achievements?.[action.id]?.unlocked) return meta;
      return {
        ...meta,
        achievements: {
          ...meta.achievements,
          [action.id]: { unlocked: true, unlockedAt: Date.now() },
        },
      };
    }

    case 'RECORD_RUN_END': {
      const rd = action.runData ?? {};
      const isWin = rd.result === 'win';

      // Historia
      const entry = {
        id:             crypto.randomUUID(),
        date:           Date.now(),
        result:         rd.result ?? 'lose',
        nodesCompleted: rd.nodesCompleted ?? 0,
        ecosUsed:       rd.ecosUsed ?? 0,
        kosReceived:    rd.kosReceived ?? 0,
        setIds:         rd.setIds ?? [],
        leaderIds:      rd.leaderIds ?? [],
        totalFlows:     rd.totalFlows ?? 0,
        vibrationTimeMs: rd.vibrationTimeMs ?? 0,
      };

      // Estadísticas globales
      const gs = meta.globalStats ?? {};
      const newTotalWins = (gs.totalWins ?? 0) + (isWin ? 1 : 0);
      const newStreak    = isWin ? (meta.currentWinStreak ?? 0) + 1 : 0;
      const newBest      = Math.max(meta.bestWinStreak ?? 0, newStreak);

      // Uso de personajes
      const charUsage = { ...meta.characterUsage };
      for (const cid of (rd.leaderIds ?? [])) {
        charUsage[cid] = (charUsage[cid] ?? 0) + 1;
      }

      // Maestría de ecos
      const ecoMastery = { ...meta.ecoMastery };
      for (const eid of (rd.activeEcos ?? [])) {
        ecoMastery[eid] = (ecoMastery[eid] ?? 0) + 1;
      }

      // Estadísticas de lugares
      const placeStats = { ...meta.placeStats };
      for (const pid of (rd.conqueredPlaceIds ?? [])) {
        placeStats[pid] = (placeStats[pid] ?? 0) + 1;
      }

      // Puntos y nivel
      const pointsEarned = isWin ? POINTS.completeRun : 2;
      const newPoints    = (meta.collectionPoints ?? 0) + pointsEarned;
      const newLevel     = getCollectorLevel(newPoints);

      // Evaluar logros
      const runResult = {
        win:             isWin,
        leadersUsed:     (rd.leaderIds ?? []).length,
        totalFlows:      rd.totalFlows ?? 0,
        totalPifias:     rd.totalPifias ?? 0,
        vibrationTimeMs: rd.vibrationTimeMs ?? 0,
        defeatedFused:   rd.defeatedFused ?? false,
        setsConfirmed:   rd.setsConfirmed ?? 0,
      };
      const newUnlocked = checkRunAchievements(runResult, meta.achievements ?? {});
      const updatedAchievements = { ...(meta.achievements ?? {}) };
      const now = Date.now();
      for (const id of newUnlocked) {
        updatedAchievements[id] = { unlocked: true, unlockedAt: now };
      }

      return {
        ...meta,
        collectionPoints:  newPoints,
        collectionLevel:   newLevel,
        currentWinStreak:  newStreak,
        bestWinStreak:     newBest,
        runHistory:        [entry, ...(meta.runHistory ?? [])].slice(0, 50),
        globalStats: {
          ...gs,
          totalRuns:          (gs.totalRuns ?? 0) + 1,
          totalWins:          newTotalWins,
          totalFlows:         (gs.totalFlows ?? 0) + (rd.totalFlows ?? 0),
          totalPifias:        (gs.totalPifias ?? 0) + (rd.totalPifias ?? 0),
          totalVibrationTime: (gs.totalVibrationTime ?? 0) + (rd.vibrationTimeMs ?? 0),
        },
        characterUsage:    charUsage,
        ecoMastery,
        placeStats,
        achievements:      updatedAchievements,
        newlyUnlocked:     newUnlocked,   // leído por RunEndScreen para toasts, luego limpiado
      };
    }

    case 'CLEAR_NEW_UNLOCKED':
      return { ...meta, newlyUnlocked: [] };

    case 'GAIN_COLLECTOR_XP': {
      const newXP    = (meta.collectorXP ?? 0) + (action.amount ?? 0);
      const newLevel = computeCollectorLevel(newXP);
      const leveled  = newLevel > (meta.collectorLevel ?? 1);
      return {
        ...meta,
        collectorXP:    newXP,
        collectorLevel: newLevel,
        ...(leveled ? { leveledUp: newLevel } : {}),
      };
    }

    case 'CLEAR_LEVEL_UP':
      return { ...meta, leveledUp: undefined };

    case 'SET_DAILY_CHALLENGE': {
      const prev       = meta.bestDailyResult;
      const isNewBest  = !prev || action.probesPassed > prev.probesPassed;
      return {
        ...meta,
        dailyChallengeState: { date: action.date, completed: action.completed, probesPassed: action.probesPassed },
        bestDailyResult: isNewBest
          ? { date: action.date, probesPassed: action.probesPassed }
          : prev,
      };
    }

    case 'SET_HAS_SEEN_INTRO':
      return { ...meta, hasSeenIntro: true };

    case 'SET_AUDIO_ENABLED':
      return { ...meta, audioEnabled: action.enabled };

    case 'SAVE_PROBE_CONFIG': {
      const { probeType, entry } = action;
      const existing = meta.savedProbeConfigs?.[probeType] ?? [];
      return {
        ...meta,
        savedProbeConfigs: {
          ...(meta.savedProbeConfigs ?? {}),
          [probeType]: [...existing, entry].slice(-5),
        },
      };
    }

    case 'DELETE_PROBE_CONFIG': {
      const { probeType, id } = action;
      const existing = meta.savedProbeConfigs?.[probeType] ?? [];
      return {
        ...meta,
        savedProbeConfigs: {
          ...(meta.savedProbeConfigs ?? {}),
          [probeType]: existing.filter(e => e.id !== id),
        },
      };
    }

    // Compat: acciones antiguas
    case 'RECORD_RUN': {
      const entry = { ...action.run, date: action.run.endedAt ?? Date.now() };
      return { ...meta, runHistory: [entry, ...(meta.runHistory ?? [])].slice(0, 50) };
    }

    case 'UPDATE_GLOBAL_STATS':
      return { ...meta, globalStats: { ...(meta.globalStats ?? {}), ...action.patch } };

    default:
      return meta;
  }
}
