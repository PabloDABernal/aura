/**
 * Slice de run activa — GDD v2.1 Sección 3.
 * Una run = 10 pruebas de cronómetro, 3 vidas, ecos entre pruebas.
 */
import { generateProbeSequence }        from '../engine/run/runEngine.js';
import { getGradeConfig }               from '../engine/run/gradeConfig.js';
import {
  applyRunStart,
  applyProbeResult,
  applyActiveUse,
  applyAuraTrigger,
  getRunStartBonuses,
  getActiveAbilityEffect,
  computeAuraEffect,
} from '../engine/abilities/abilityEngine.js';
import { getEcosToConsumeAfterProbe } from '../engine/eco/runEcoEngine.js';
import {
  BASE_LERELES_PER_PROBE, GRADE_MULTIPLIER_STEP, PERFECT_MULTIPLIER,
  RUN_COMPLETE_BONUS, GRADE10_FRAGMENT_REWARD,
  XP_PER_RUN_COMPLETED, XP_PER_GRADE_UP, XP_PER_GRADE10,
} from '../data/economyConfig.js';
import { getTodayStr } from '../engine/run/dailyChallenge.js';

export function createRunSlice(set, get) {
  return {
    activeRun:     null,
    lastRunResult: null,

    startRun: (characterId) => {
      const state     = get();
      const char      = state.characters[characterId];
      if (!char || char.status !== 'active') return;

      const gradeConfig      = getGradeConfig(char.grade ?? 1);
      const mercyRun         = (char.failedRunsAtGrade ?? 0) >= 3;
      const collectorLevel   = state.meta?.collectorLevel ?? 1;
      const extraEcoSlots    = state.extraEcoSlots ?? 0;

      const { extraLives, residuesThreshold } = applyRunStart({}, char);
      const startingLives = gradeConfig.startingLives + extraLives;

      const freeProbe1    = (char.temporalResidues ?? 0) >= residuesThreshold;
      const probeSequence = generateProbeSequence(char.grade ?? 1, collectorLevel, mercyRun);

      const pid      = char?.passiveAbility?.id ?? char?.ability?.id;
      const normPid  = { pg01:'p01', pg02:'p02', pg03:'p03', pg04:'p04', pg05:'p_tempo' }[pid] ?? pid;

      set({
        activeRun: {
          characterId,
          currentProbe:        1,
          lives:               startingLives,
          maxLives:            startingLives,
          activeEcos:          [],
          probeSequence,
          probeHistory:        [],
          infiniteMode:        false,
          infiniteScore:       0,
          status:              'active',
          abilityUsed:         false,
          abilityUsedViaAura:  false,
          activeAbilityEffect: null,
          activeAuraEffect:    null,
          auraActivations:     0,
          firstFailFree:       normPid === 'p04' || normPid === 'pg04',
          secondAirUsed:       false,
          flowMarginBonus:     0,
          rachaMarginLeft:     0,
          shieldActive:        false,
          nextProbeAutoPass:   false,
          nextEcoTierBoost:    false,
          doubledEcos:         [],
          maxEcoSlots:         5 + extraEcoSlots,
          freeProbe1,
          mercyRun,
          residuesThreshold,
        },
      });

      if (freeProbe1) {
        get().updateCharacter(characterId, { temporalResidues: 0 });
      }
    },

    finishProbe: (result) => {
      set(state => {
        const run = state.activeRun;
        if (!run || run.status !== 'active') return {};

        const char      = state.characters?.[run.characterId];
        const probeType = run.probeSequence[run.currentProbe - 1] ?? 'bingo';

        const probeResult = {
          probeIndex:    run.currentProbe - 1,
          probeType,
          result:        result.result,
          auraTriggered: result.auraTriggered ?? false,
        };

        let lives            = run.lives;
        let firstFailFree    = run.firstFailFree;
        let secondAirUsed    = run.secondAirUsed;
        let flowBonus        = run.flowMarginBonus ?? 0;
        let shieldActive     = run.shieldActive ?? false;
        let charPatch        = null;
        let activeEcos       = [...(run.activeEcos ?? [])];
        let lifeActuallyLost = false; // true only when a life is deducted (real fail, not absorbed)

        if (result.result === 'fail') {
          const absorption = applyProbeResult(
            'fail', char, probeType,
            { firstFailFree, secondAirUsed, lives, shieldActive }
          );
          firstFailFree = absorption.firstFailFree;
          secondAirUsed = absorption.secondAirUsed;
          if (absorption.shieldConsumed) shieldActive = false;

          if (!absorption.absorb) {
            if (activeEcos.includes('eco-segunda')) {
              // eco-segunda acts as an extra life: no life lost, eco consumed, probe advances
              activeEcos = activeEcos.filter(id => id !== 'eco-segunda');
            } else {
              lives = Math.max(0, lives - 1);
              lifeActuallyLost = true;
            }
          }

          const cur       = char?.temporalResidues ?? 0;
          const threshold = run.residuesThreshold ?? 3;
          // Residuo only on real fail (not absorbed by ability or eco-segunda)
          if (lifeActuallyLost && cur < threshold) charPatch = { temporalResidues: cur + 1 };
        } else {
          const pid     = char?.passiveAbility?.id ?? char?.ability?.id;
          const normPid = { pg01:'p01', pg02:'p02', pg03:'p03', pg04:'p04', pg05:'p_tempo' }[pid] ?? pid;
          if (normPid === 'p09') flowBonus += 2;
          const noHeal = run.dailyCondition?.noHealOnPerfect ?? false;
          if (result.result === 'perfect' && !noHeal) lives = Math.min(lives + 1, 5);
        }

        const consumed = getEcosToConsumeAfterProbe(activeEcos);
        if (consumed.length > 0) activeEcos = activeEcos.filter(id => !consumed.includes(id));

        if (lives <= 0 && activeEcos.includes('eco-ultimo-aliento')) {
          lives = 1;
          activeEcos = activeEcos.filter(id => id !== 'eco-ultimo-aliento');
        }

        // Award lereles for this probe
        const grade        = char?.grade ?? 1;
        const gradeBonus   = 1 + (grade - 1) * GRADE_MULTIPLIER_STEP;
        const perfectMult  = result.result === 'perfect' ? PERFECT_MULTIPLIER : 1;
        const probeLerels  = Math.round(BASE_LERELES_PER_PROBE * gradeBonus * perfectMult);

        const newRachaMarginLeft = Math.max(0, (run.rachaMarginLeft ?? 0) - 1);
        // Real fail → repeat same probe (don't advance). Absorbed fail / pass / perfect → advance.
        const newCurrentProbe    = lifeActuallyLost ? run.currentProbe : run.currentProbe + 1;
        const newHistory         = [...run.probeHistory, probeResult];

        let status = 'active';
        if (lives <= 0) {
          status = 'failed';
        } else if (!lifeActuallyLost && run.currentProbe >= 10 && !run.infiniteMode) {
          status = 'completed';
        }

        const probePassed   = result.result !== 'fail';
        const newInfiniteScore = run.infiniteMode && probePassed
          ? (run.infiniteScore ?? 0) + 1
          : (run.infiniteScore ?? 0);

        const stateUpdate = {
          lereles: (state.lereles ?? 0) + probeLerels,
          activeRun: {
            ...run,
            currentProbe:        newCurrentProbe,
            lives,
            firstFailFree,
            secondAirUsed,
            shieldActive,
            flowMarginBonus:     flowBonus,
            rachaMarginLeft:     newRachaMarginLeft,
            activeEcos,
            probeHistory:        newHistory,
            infiniteScore:       newInfiniteScore,
            status,
            activeAuraEffect:    null,
            abilityUsedViaAura:  false,
            nextProbeAutoPass:   false,
          },
        };
        if (charPatch && run.characterId) {
          const prevChar = state.characters[run.characterId];
          stateUpdate.characters = {
            ...state.characters,
            [run.characterId]: { ...prevChar, ...charPatch },
          };
        }
        return stateUpdate;
      });
    },

    addRunEco: (ecoId) => {
      set(state => {
        if (!state.activeRun) return {};
        const ecos       = state.activeRun.activeEcos ?? [];
        const doubled    = state.activeRun.doubledEcos ?? [];
        const maxSlots   = state.activeRun.maxEcoSlots ?? 5;
        const hasPasado  = ecos.includes('eco-pasado') && ecoId !== 'eco-pasado';

        if (ecos.length >= maxSlots || ecos.includes(ecoId)) return {};

        let newEcos    = [...ecos, ecoId];
        let newDoubled = [...doubled];

        if (hasPasado) {
          newEcos    = newEcos.filter(id => id !== 'eco-pasado');
          newDoubled = [...newDoubled, ecoId];
        }

        return {
          activeRun: {
            ...state.activeRun,
            activeEcos:       newEcos,
            doubledEcos:      newDoubled,
            nextEcoTierBoost: false,
          },
        };
      });
    },

    removeRunEco: (ecoId) => {
      set(state => {
        if (!state.activeRun) return {};
        return {
          activeRun: {
            ...state.activeRun,
            activeEcos:  (state.activeRun.activeEcos ?? []).filter(id => id !== ecoId),
            doubledEcos: (state.activeRun.doubledEcos ?? []).filter(id => id !== ecoId),
          },
        };
      });
    },

    startPerfectSyncRun: (characterId) => {
      const state          = get();
      const char           = state.characters[characterId];
      if (!char || char.status !== 'active') return;

      const collectorLevel = state.meta?.collectorLevel ?? 1;
      const extraEcoSlots  = state.extraEcoSlots ?? 0;
      const probeSequence  = generateProbeSequence(10, collectorLevel, false);

      set({
        activeRun: {
          characterId,
          currentProbe:        1,
          lives:               1,
          maxLives:            1,
          activeEcos:          [],
          probeSequence,
          probeHistory:        [],
          infiniteMode:        false,
          infiniteScore:       0,
          status:              'active',
          abilityUsed:         false,
          abilityUsedViaAura:  false,
          activeAbilityEffect: null,
          activeAuraEffect:    null,
          auraActivations:     0,
          firstFailFree:       false,  // no absorption — any fail ends run
          secondAirUsed:       false,
          flowMarginBonus:     0,
          rachaMarginLeft:     0,
          shieldActive:        false,
          nextProbeAutoPass:   false,
          nextEcoTierBoost:    false,
          doubledEcos:         [],
          maxEcoSlots:         5 + extraEcoSlots,
          freeProbe1:          false,
          mercyRun:            false,
          residuesThreshold:   3,
          isPerfectSync:       true,
          syncStartTime:       Date.now(),
        },
      });
    },

    startDailyRun: (dailyChar, condition) => {
      const state       = get();
      const extraEcoSlots = state.extraEcoSlots ?? 0;
      const collectorLevel = state.meta?.collectorLevel ?? 1;
      const startingLives  = condition?.startingLives ?? 3;
      const probeSequence  = generateProbeSequence(10, collectorLevel, false);

      set(s => ({
        characters: { ...s.characters, [dailyChar.id]: dailyChar },
        activeRun: {
          characterId:         dailyChar.id,
          currentProbe:        1,
          lives:               startingLives,
          maxLives:            startingLives,
          activeEcos:          [],
          probeSequence,
          probeHistory:        [],
          infiniteMode:        false,
          infiniteScore:       0,
          status:              'active',
          abilityUsed:         false,
          abilityUsedViaAura:  false,
          activeAbilityEffect: null,
          activeAuraEffect:    null,
          auraActivations:     0,
          firstFailFree:       false,
          secondAirUsed:       false,
          flowMarginBonus:     0,
          rachaMarginLeft:     0,
          shieldActive:        false,
          nextProbeAutoPass:   false,
          nextEcoTierBoost:    false,
          doubledEcos:         [],
          maxEcoSlots:         5 + extraEcoSlots,
          freeProbe1:          false,
          mercyRun:            false,
          residuesThreshold:   3,
          isDailyChallenge:    true,
          dailyCondition:      condition ?? null,
        },
      }));
    },

    enableInfiniteMode: () => {
      set(state => {
        if (!state.activeRun) return {};
        return {
          activeRun: { ...state.activeRun, infiniteMode: true, status: 'active', currentProbe: 11 },
        };
      });
    },

    startInfiniteDirectRun: (characterId) => {
      const state       = get();
      const char        = state.characters[characterId];
      if (!char || char.status !== 'active') return;

      const collectorLevel = state.meta?.collectorLevel ?? 1;
      const extraEcoSlots  = state.extraEcoSlots ?? 0;
      const probeSequence  = generateProbeSequence(10, collectorLevel, false);
      const { extraLives, residuesThreshold } = applyRunStart({}, char);
      const gradeConfig    = getGradeConfig(10);
      const startingLives  = gradeConfig.startingLives + extraLives;

      const pid     = char?.passiveAbility?.id ?? char?.ability?.id;
      const normPid = { pg01:'p01', pg02:'p02', pg03:'p03', pg04:'p04', pg05:'p_tempo' }[pid] ?? pid;

      set({
        activeRun: {
          characterId,
          currentProbe:        11,   // start at 11 so infiniteN = currentProbe - 10 = 1
          lives:               startingLives,
          maxLives:            startingLives,
          activeEcos:          [],
          probeSequence,
          probeHistory:        [],
          infiniteMode:        true,
          isDirectInfinite:    true,
          infiniteScore:       0,
          status:              'active',
          abilityUsed:         false,
          abilityUsedViaAura:  false,
          activeAbilityEffect: null,
          activeAuraEffect:    null,
          auraActivations:     0,
          firstFailFree:       normPid === 'p04' || normPid === 'pg04',
          secondAirUsed:       false,
          flowMarginBonus:     0,
          rachaMarginLeft:     0,
          shieldActive:        false,
          nextProbeAutoPass:   false,
          nextEcoTierBoost:    false,
          doubledEcos:         [],
          maxEcoSlots:         5 + extraEcoSlots,
          freeProbe1:          false,
          mercyRun:            false,
          residuesThreshold,
        },
      });
    },

    endRun: () => {
      const { activeRun, characters, updateCharacter } = get();
      if (!activeRun) return;

      const char             = characters[activeRun.characterId];
      const isDirectInfinite = activeRun.isDirectInfinite ?? false;
      const wasInfinite      = activeRun.infiniteMode;
      const finalInfiniteScore = wasInfinite ? (activeRun.infiniteScore ?? 0) : 0;
      const isPerfectSync    = activeRun.isPerfectSync ?? false;
      // Direct infinite runs end by death — not counted as completions for grade purposes
      const isCompleted      = isDirectInfinite ? false : (activeRun.status === 'completed' || wasInfinite);

      const prevGrade = char?.grade ?? 1;
      // Perfect sync and direct infinite don't grade up
      const newGrade  = (isPerfectSync || isDirectInfinite) ? prevGrade : (isCompleted ? Math.min(prevGrade + 1, 10) : prevGrade);
      const gradeUp   = newGrade > prevGrade;
      const hasCrown  = newGrade >= 10;

      const isGrade10First = !isPerfectSync && !isDirectInfinite && gradeUp && newGrade === 10 && !(char?.stats?.grade10FragmentsAwarded);

      // Perfect sync timing
      const syncTime = (isPerfectSync && isCompleted && activeRun.syncStartTime)
        ? Date.now() - activeRun.syncStartTime
        : null;
      const prevBestSync    = char?.stats?.bestPerfectSyncTime ?? null;
      const isNewSyncRecord = isPerfectSync && isCompleted && syncTime !== null &&
        (prevBestSync === null || syncTime < prevBestSync);

      const probesPassed      = (activeRun.probeHistory ?? []).filter(p => p.result === 'pass' || p.result === 'perfect').length;
      const perfectSyncs      = (activeRun.probeHistory ?? []).filter(p => p.result === 'perfect').length;
      const totalProbes       = Math.min((activeRun.probeHistory ?? []).length, 10);
      const auraTriggered     = (activeRun.probeHistory ?? []).some(p => p.auraTriggered);
      const newCurrentStreak  = isCompleted ? (char?.stats?.currentRunStreak ?? 0) + 1 : 0;

      if (char) {
        const prevHistory = char.stats?.runHistory ?? [];
        updateCharacter(activeRun.characterId, {
          grade: newGrade,
          // Direct infinite: no grade-run impact on failedRunsAtGrade
          failedRunsAtGrade: isDirectInfinite ? (char.failedRunsAtGrade ?? 0) : (isCompleted ? 0 : (char.failedRunsAtGrade ?? 0) + 1),
          ...(isCompleted ? { temporalResidues: 0 } : {}),
          stats: {
            runsCompleted:          (char.stats?.runsCompleted ?? 0) + (isCompleted ? 1 : 0),
            runsFailed:             (char.stats?.runsFailed ?? 0) + (!isCompleted && !isDirectInfinite ? 1 : 0),
            hasCrown,
            crowns:                 Math.min((char.stats?.crowns ?? 0) + (gradeUp ? 1 : 0), 10),
            // Direct infinite doesn't reset run streak
            currentRunStreak:       isDirectInfinite ? (char.stats?.currentRunStreak ?? 0) : newCurrentStreak,
            maxRunStreak:           Math.max(char.stats?.maxRunStreak ?? 0, isDirectInfinite ? (char.stats?.currentRunStreak ?? 0) : newCurrentStreak),
            totalPerfectSyncs:      (char.stats?.totalPerfectSyncs ?? 0) + perfectSyncs,
            grade10FragmentsAwarded: isGrade10First ? true : (char.stats?.grade10FragmentsAwarded ?? false),
            bestInfiniteScore: Math.max(
              char.stats?.bestInfiniteScore ?? 0,
              finalInfiniteScore
            ),
            bestPerfectSyncTime: isNewSyncRecord
              ? syncTime
              : (char.stats?.bestPerfectSyncTime ?? null),
            runHistory: [
              ...prevHistory.slice(-9),
              { date: Date.now(), result: isCompleted ? 'completed' : 'failed', probesPassed, perfectSyncs },
            ],
          },
        });
      }

      // Economy awards
      if (isPerfectSync) {
        if (isCompleted) get().addLereles(RUN_COMPLETE_BONUS(10) * 3);
      } else if (isDirectInfinite) {
        if (finalInfiniteScore > 0) {
          get().addLereles(RUN_COMPLETE_BONUS(10));
          get().dispatchMeta({ type: 'GAIN_COLLECTOR_XP', amount: XP_PER_RUN_COMPLETED });
        }
      } else {
        if (isCompleted) get().addLereles(RUN_COMPLETE_BONUS(newGrade));
        if (isGrade10First) get().addAuraFragments(GRADE10_FRAGMENT_REWARD);
        let xpAmount = isCompleted ? XP_PER_RUN_COMPLETED : 0;
        if (gradeUp)        xpAmount += XP_PER_GRADE_UP;
        if (isGrade10First) xpAmount += XP_PER_GRADE10;
        if (xpAmount > 0) get().dispatchMeta({ type: 'GAIN_COLLECTOR_XP', amount: xpAmount });
      }

      // Daily challenge resolution
      if (activeRun.isDailyChallenge) {
        get().dispatchMeta({
          type:        'SET_DAILY_CHALLENGE',
          date:        getTodayStr(),
          completed:   isCompleted,
          probesPassed,
        });
        if (isCompleted) {
          get().addAuraFragments(3);
        } else if (probesPassed >= 5) {
          get().addAuraFragments(1);
        }
        // Remove temporary system character
        set(s => {
          const { 'daily-system-char': _rm, ...rest } = s.characters;
          return { characters: rest };
        });
      }

      const prevBestInfinite    = char?.stats?.bestInfiniteScore ?? 0;
      const isNewInfiniteRecord = wasInfinite && finalInfiniteScore > prevBestInfinite;

      const lastRunResult = {
        characterId:    activeRun.characterId,
        characterName:  char?.name ?? '',
        characterGrade: newGrade,
        result:         isCompleted ? 'completed' : 'failed',
        probesPassed,
        totalProbes,
        livesRemaining: activeRun.lives,
        auraTriggered,
        prevGrade,
        newGrade,
        gradeUp,
        wasInfinite,
        infiniteScore:        finalInfiniteScore,
        isNewInfiniteRecord,
        isPerfectSync,
        syncTime,
        isNewSyncRecord,
        isDirectInfinite,
      };

      set({ activeRun: null, lastRunResult });
    },

    abandonRun: () => set({ activeRun: null }),

    clearLastRunResult: () => set({ lastRunResult: null }),

    useActiveAbility: (probeType) => {
      const { activeRun, characters } = get();
      if (!activeRun || activeRun.abilityUsed) return null;
      const char = characters[activeRun.characterId];
      const hasAbility = char?.activeAbility ?? (char?.ability?.type === 'active' ? char.ability : null);
      if (!hasAbility) return null;

      const { effect, runPatch } = applyActiveUse(char, activeRun, probeType ?? null);

      set(state => ({
        activeRun: {
          ...state.activeRun,
          abilityUsed:         true,
          activeAbilityEffect: effect,
          ...runPatch,
        },
      }));
      return effect;
    },

    clearActiveAbilityEffect: () => {
      set(state => state.activeRun ? {
        activeRun: { ...state.activeRun, activeAbilityEffect: null },
      } : {});
    },

    applyAuraAbilityEffect: (probeType) => {
      const { activeRun, characters } = get();
      if (!activeRun) return null;
      const char = characters[activeRun.characterId];
      if (!char?.auraAbility) return null;

      const { runPatch, message } = applyAuraTrigger(char, activeRun, probeType ?? null);
      const newActivations = (activeRun.auraActivations ?? 0) + 1;

      if (Object.keys(runPatch).length > 0 || newActivations !== activeRun.auraActivations) {
        set(state => ({
          activeRun: { ...state.activeRun, ...runPatch, auraActivations: newActivations },
        }));
      }

      return message ?? null;
    },

    clearAuraEffect: () => {
      set(state => state.activeRun ? {
        activeRun: { ...state.activeRun, activeAuraEffect: null },
      } : {});
    },
  };
}
