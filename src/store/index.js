import { create }  from 'zustand';
import { persist } from 'zustand/middleware';
import { combatReducer }                    from '../engine/combat/combatReducer.js';
import { INITIAL_COMBAT_STATE, DATA_CTX } from '../data/phase1Data.js';
import { INITIAL_META, metaReducer }        from './metaSlice.js';
import { INITIAL_COLLECTION, collectionReducer } from './collectionSlice.js';

/**
 * Normaliza los sets de la colección del jugador al formato que espera el runGenerator
 * (leaders[], guests[], placeIds[], corruptIds[]).
 */
function normalizeCollectionSets(collection) {
  const chars = collection?.characters ?? {};
  const result = {};
  for (const [id, s] of Object.entries(collection?.sets ?? {})) {
    if (s.status === 'archived') continue;
    const setChars = (s.characters ?? [])
      .map(cid => chars[cid])
      .filter(Boolean)
      .filter(c => c.status === 'confirmed');
    const leaders  = setChars.filter(c => c.leader !== null).map(c => c.id);
    const guests   = setChars.filter(c => c.leader === null).map(c => c.id);
    result[id] = {
      ...s,
      icon:      s.icon ?? '⭐',
      leaders:   leaders.length > 0 ? leaders : [],
      guests:    guests.length  > 0 ? guests  : setChars.slice(1).map(c => c.id),
      placeIds:  s.placeId ? [s.placeId] : [],
      corruptIds: leaders.slice(0, 1),
    };
  }
  return result;
}

function buildDataCtx(collection) {
  const extraChars  = collection?.characters ?? {};
  const extraPlaces = collection?.places     ?? {};
  const normalizedSets = normalizeCollectionSets(collection);
  return {
    characters: { ...DATA_CTX.characters, ...extraChars },
    places:     { ...DATA_CTX.places,     ...extraPlaces },
    sets:       { ...normalizedSets },
  };
}

const useStore = create(
  persist(
    (set, get) => ({

      // ── CombatState ────────────────────────────────────────────────────────
      combat: INITIAL_COMBAT_STATE,

      dispatchCombat: (action) =>
        set(state => ({
          combat: combatReducer(state.combat, action, buildDataCtx(state.collection)),
        })),

      resetCombat: () =>
        set({ combat: INITIAL_COMBAT_STATE }),

      setCombat: (newState) =>
        set({ combat: newState }),

      // ── RunConfig (selección previa) ──────────────────────────────────────
      runConfig: { selectedSets: [], selectedLeaders: {} },

      setRunConfig: (cfg) => set({ runConfig: cfg }),

      // ── Run activa (RunState completo) ────────────────────────────────────
      run: null,

      initRun: (runState) => set({ run: runState }),

      setRun: (newRun) => set({ run: newRun }),

      completeNode: (areaIdx, nodeIdx, result) =>
        set(state => {
          if (!state.run) return {};
          const areas = state.run.areas.map((a, ai) => {
            if (ai !== areaIdx) return a;
            const nodes = a.nodes.map((n, ni) =>
              ni === nodeIdx ? { ...n, completed: true, result } : n
            );
            return { ...a, nodes, currentNodeIndex: nodeIdx + 1 };
          });
          const area = areas[areaIdx];
          const areaComplete = area.nodes.every(n => n.completed);
          const currentAreaIndex = areaComplete
            ? Math.min(areaIdx + 1, areas.length - 1)
            : areaIdx;
          return { run: { ...state.run, areas, currentAreaIndex } };
        }),

      updateRun: (patch) =>
        set(state => ({ run: state.run ? { ...state.run, ...patch } : state.run })),

      addRunEco: (ecoId) =>
        set(state => {
          if (!state.run) return {};
          const ecos = state.run.activeEcos ?? [];
          if (ecos.length >= 10 || ecos.includes(ecoId)) return {};
          return { run: { ...state.run, activeEcos: [...ecos, ecoId] } };
        }),

      removeRunEco: (ecoId) =>
        set(state => {
          if (!state.run) return {};
          return { run: { ...state.run, activeEcos: (state.run.activeEcos ?? []).filter(id => id !== ecoId) } };
        }),

      endRun: (victory) =>
        set(state => ({ run: state.run ? { ...state.run, victory, active: false } : state.run })),

      // ── MetaState ──────────────────────────────────────────────────────────
      meta: INITIAL_META,

      dispatchMeta: (action) =>
        set(state => ({ meta: metaReducer(state.meta, action) })),

      // ── Colección del jugador ─────────────────────────────────────────────
      collection: INITIAL_COLLECTION,

      dispatchCollection: (action) =>
        set(state => ({ collection: collectionReducer(state.collection, action) })),

      // Devuelve el dataCtx con personajes, lugares y sets fusionados (phase1Data + colección).
      getDataCtx: () => buildDataCtx(get().collection),

      // ── Auth ───────────────────────────────────────────────────────────────
      auth: { user: null, playLocal: false },

      setAuth: (auth) => set({ auth }),

      // ── UI ─────────────────────────────────────────────────────────────────
      screen:    'login',
      setScreen: (screen) => set({ screen }),

      // ID del set que se está editando actualmente (no persiste entre sesiones)
      currentEditSetId: null,
      setCurrentEditSetId: (id) => set({ currentEditSetId: id }),

      // Toast de logro
      achievementToast: null,
      showAchievementToast: (achievementId) => {
        set({ achievementToast: achievementId });
        setTimeout(() => set({ achievementToast: null }), 3500);
      },
    }),
    {
      name: 'aura-save-v1',
      version: 1,
      migrate: (persisted, fromVersion) => {
        if (fromVersion < 1) {
          const col = persisted.collection;
          if (col) {
            const rmSets  = ['set-one-piece', 'set-dragon-ball'];
            const rmChars = ['char-luffy','char-zoro','char-nami','char-robin','char-chopper','char-usopp',
                             'char-goku','char-vegeta','char-piccolo','char-gohan','char-bulma','char-yamcha'];
            const rmPlaces = ['place-1', 'place-2'];
            const sets       = { ...col.sets };
            const characters = { ...col.characters };
            const places     = { ...col.places };
            rmSets.forEach(id   => delete sets[id]);
            rmChars.forEach(id  => delete characters[id]);
            rmPlaces.forEach(id => delete places[id]);
            persisted.collection = { ...col, sets, characters, places };
          }
        }
        return persisted;
      },
      partialize: (state) => ({
        combat:     state.combat,
        run:        state.run,
        meta:       state.meta,
        collection: state.collection,
        runConfig:  state.runConfig,
        auth:       state.auth,
        // currentEditSetId NO persiste intencionalmente
      }),
    }
  )
);

export default useStore;
