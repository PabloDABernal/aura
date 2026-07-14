/**
 * Store principal — GDD v4.0 (modelo de personaje v2: 3 habilidades).
 * Clave: 'aura-v2', versión 3.
 */
import { create }  from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_META, metaReducer }                       from './metaSlice.js';
import {
  createCollectionSlice,
  migrateCharactersProbeProgress,
  resetCharactersProbeProgress,
} from './collectionSlice.js';
import { createRunSlice }                                   from './runSlice.js';
import { createEconomySlice }                               from './economySlice.js';
import { pushToFirestore, pullFromFirestore }               from './sync.js';

const DEFAULT_PASSIVE = { id: 'pg01', name: 'Vitalidad',    description: '+1 vida al empezar la run',                           scope: 'general' };
const DEFAULT_ACTIVE  = { id: 'ag01', name: 'Cámara lenta', description: 'Reduce la velocidad del cronómetro al 50% durante 5s', scope: 'general' };
const DEFAULT_AURA    = { id: 'aug01', name: 'Revive',       description: 'Recuperar 1 vida',                                    scope: 'general' };

function migrateToV2(state) {
  const newCombos     = [];
  const newCharacters = {};

  for (const [id, char] of Object.entries(state.characters ?? {})) {
    let migratedChar;

    if (char.passiveAbility) {
      migratedChar = { failedRunsAtGrade: 0, temporalResidues: 0, ...char };
    } else {
      let passiveAbility = DEFAULT_PASSIVE;
      let activeAbility  = DEFAULT_ACTIVE;

      if (char.ability?.type === 'passive') {
        passiveAbility = { id: char.ability.id, name: char.ability.name, description: char.ability.description, scope: 'general' };
      } else if (char.ability?.type === 'active') {
        activeAbility  = { id: char.ability.id, name: char.ability.name, description: char.ability.description, scope: 'general' };
      }

      const auraAbility = char.auraAbility
        ? { id: char.auraAbility.id, name: char.auraAbility.name, description: char.auraAbility.description, scope: 'general' }
        : DEFAULT_AURA;

      migratedChar = { ...char, passiveAbility, activeAbility, auraAbility, failedRunsAtGrade: 0, temporalResidues: 0 };
    }

    newCharacters[id] = migratedChar;

    if (migratedChar.status === 'active' &&
        migratedChar.passiveAbility && migratedChar.activeAbility && migratedChar.auraAbility) {
      const combo = `${migratedChar.passiveAbility.id}|${migratedChar.activeAbility.id}|${migratedChar.auraAbility.id}`;
      if (!newCombos.includes(combo)) newCombos.push(combo);
    }
  }

  const { usedAbilityIds: _old, ...restState } = state;
  return { ...restState, characters: newCharacters, usedAbilityCombos: newCombos };
}

function migrateToV3(state) {
  return {
    ...state,
    lereles:             state.lereles             ?? 100,
    auraFragments:       state.auraFragments        ?? 0,
    extraEcoSlots:       state.extraEcoSlots        ?? 0,
    completedAuraRanges: state.completedAuraRanges  ?? [],
    meta: {
      ...state.meta,
      collectorLevel: state.meta?.collectorLevel ?? 1,
      collectorXP:    state.meta?.collectorXP    ?? 0,
    },
  };
}

function migrateToV4(state) {
  return {
    ...state,
    characters: migrateCharactersProbeProgress(state.characters ?? {}),
  };
}

function migrateToV5(state) {
  // Reset probeProgress al nuevo modelo por parámetro (GDD v4.2). No convierte valores viejos.
  return {
    ...state,
    characters: resetCharactersProbeProgress(state.characters ?? {}),
  };
}

const useStore = create(
  persist(
    (set, get) => ({

      // ── Colección de personajes ────────────────────────────────────────────
      ...createCollectionSlice(set, get),

      // ── Run activa ────────────────────────────────────────────────────────
      ...createRunSlice(set, get),

      // ── Economía ──────────────────────────────────────────────────────────
      ...createEconomySlice(set, get),

      // ── Meta-progresión ───────────────────────────────────────────────────
      meta: INITIAL_META,

      dispatchMeta: (action) =>
        set(state => ({ meta: metaReducer(state.meta, action) })),

      // ── Auth ──────────────────────────────────────────────────────────────
      auth: { user: null, playLocal: false },

      setAuth: (authData) => set({ auth: authData }),

      // ── Sync ──────────────────────────────────────────────────────────────
      syncStatus: 'idle', // 'idle' | 'syncing' | 'synced' | 'offline'

      setSyncStatus: (status) => set({ syncStatus: status }),

      pushToCloud: async () => {
        const state = get();
        const uid   = state.auth?.user?.uid;
        if (!uid || state.auth?.user?.isAnonymous) return;
        set({ syncStatus: 'syncing' });
        try {
          await pushToFirestore(uid, state);
          set({ syncStatus: 'synced' });
        } catch {
          set({ syncStatus: 'offline' });
        }
      },

      mergeFromCloud: async () => {
        const state = get();
        const uid   = state.auth?.user?.uid;
        if (!uid || state.auth?.user?.isAnonymous) return;
        set({ syncStatus: 'syncing' });
        try {
          const remote = await pullFromFirestore(uid);
          if (!remote) { set({ syncStatus: 'synced' }); return; }
          const localTs  = state.meta?.lastUpdated  ?? 0;
          const remoteTs = remote.lastUpdated        ?? 0;
          if (remoteTs > localTs) {
            set({
              characters:          remote.characters          ?? state.characters,
              usedAuraNumbers:     remote.usedAuraNumbers     ?? state.usedAuraNumbers,
              usedAbilityCombos:   remote.usedAbilityCombos   ?? state.usedAbilityCombos,
              completedAuraRanges: remote.completedAuraRanges ?? state.completedAuraRanges,
              lereles:             remote.lereles             ?? state.lereles,
              auraFragments:       remote.auraFragments       ?? state.auraFragments,
              extraEcoSlots:       remote.extraEcoSlots       ?? state.extraEcoSlots,
              meta:                remote.meta                ?? state.meta,
            });
          }
          set({ syncStatus: 'synced' });
        } catch {
          set({ syncStatus: 'offline' });
        }
      },

      // ── UI ────────────────────────────────────────────────────────────────
      screen: 'home',

      setScreen: (screen) => set({ screen }),

      creatorPreselect: null,

      setCreatorPreselect: (n) => set({ creatorPreselect: n }),

      achievementToast: null,

      showAchievementToast: (achievementId) => {
        set({ achievementToast: achievementId });
        setTimeout(() => set({ achievementToast: null }), 3500);
      },
    }),
    {
      name:    'aura-v2',
      version: 5,
      migrate: (persistedState, version) => {
        let s = persistedState;
        if (version < 2) s = migrateToV2(s);
        if (version < 3) s = migrateToV3(s);
        if (version < 4) s = migrateToV4(s);
        if (version < 5) s = migrateToV5(s);
        return s;
      },
      partialize: (state) => ({
        characters:          state.characters,
        usedAuraNumbers:     state.usedAuraNumbers,
        usedAbilityCombos:   state.usedAbilityCombos,
        completedAuraRanges: state.completedAuraRanges,
        activeRun:           state.activeRun,
        lereles:             state.lereles,
        auraFragments:       state.auraFragments,
        extraEcoSlots:       state.extraEcoSlots,
        meta:                state.meta,
        auth:                state.auth,
      }),
    }
  )
);

export default useStore;
