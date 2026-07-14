/**
 * Slice de colección de personajes — GDD v4.0 Sección 2 y 5 + D1 economía.
 * Unicidad por COMBINACIÓN de habilidades, no por habilidad individual.
 */
import { CHARACTER_DEFAULTS } from '../data/characterSchema.js';
import {
  getCreateCost, REACTIVATE_COST,
  RANGE_FRAGMENT_REWARD, XP_PER_CHARACTER_CREATED,
} from '../data/economyConfig.js';
import { PROBE_TYPES } from '../components/probes/probeRegistry.js';
import { PROBE_PISTAS } from '../data/probePistas.js';

/**
 * Crea un probeProgress vacío con el nuevo modelo por parámetro (GDD v4.2).
 * Pruebas con catálogo: { [param]: 0 }. Sin catálogo: {} (se rellenará cuando lo tengan).
 */
export function makeProbeProgress() {
  return Object.fromEntries(
    PROBE_TYPES.map(t => [
      t,
      PROBE_PISTAS[t]
        ? Object.fromEntries(PROBE_PISTAS[t].pistas.map(p => [p.key, 0]))
        : {},
    ])
  );
}

/**
 * Migración v4 — idempotente: añade probeProgress a personajes que no lo tienen.
 * Si ya existe, rellena las claves que falten sin machacar valores existentes.
 */
export function migrateCharactersProbeProgress(characters) {
  const empty = makeProbeProgress();
  const result = {};
  for (const [id, char] of Object.entries(characters)) {
    result[id] = {
      ...char,
      probeProgress: { ...empty, ...(char.probeProgress ?? {}) },
    };
  }
  return result;
}

/**
 * Migración v5 — RESET: descarta el probeProgress viejo (numérico) y crea el nuevo
 * modelo por parámetro con todos los contadores a 0. No convierte valores anteriores.
 * Idempotente: ejecutar varias veces da el mismo resultado.
 */
export function resetCharactersProbeProgress(characters) {
  const result = {};
  for (const [id, char] of Object.entries(characters)) {
    result[id] = { ...char, probeProgress: makeProbeProgress() };
  }
  return result;
}

/**
 * Pura: aplica +1 al parámetro dado de la prueba, con tope = steps del catálogo.
 * No-op si el parámetro ya está al tope o no existe en el catálogo.
 */
export function applyAddPista(characters, characterId, probeType, param) {
  const char = characters[characterId];
  if (!char) return characters;
  const catalog = PROBE_PISTAS[probeType];
  const pistaDef = catalog?.pistas.find(p => p.key === param);
  if (!pistaDef) return characters;
  const progress    = char.probeProgress ?? makeProbeProgress();
  const typeProgress = (progress[probeType] && typeof progress[probeType] === 'object')
    ? progress[probeType]
    : {};
  const current = typeProgress[param] ?? 0;
  if (current >= pistaDef.steps) return characters;
  return {
    ...characters,
    [characterId]: {
      ...char,
      probeProgress: {
        ...progress,
        [probeType]: { ...typeProgress, [param]: current + 1 },
      },
    },
  };
}

function makeCombo(char) {
  return `${char.passiveAbility?.id}|${char.activeAbility?.id}|${char.auraAbility?.id}`;
}

export function createCollectionSlice(set, get) {
  return {
    characters:          {},   // { [id: string]: CharacterData }
    usedAuraNumbers:     [],   // number[] — slots 00-99 ocupados (nunca se liberan al archivar)
    usedAbilityCombos:   [],   // string[] — "passiveId|activeId|auraId" de activos
    completedAuraRanges: [],   // number[] — índices 0-9 de rangos (00-09 … 90-99) completados

    /** Crea un nuevo personaje. Devuelve id generado o null si falla. */
    createCharacter: (data) => {
      const state = get();

      if (state.usedAuraNumbers.includes(data.auraNumber)) return null;

      const combo = `${data.passiveAbility?.id}|${data.activeAbility?.id}|${data.auraAbility?.id}`;
      if (state.usedAbilityCombos.includes(combo)) return null;

      const cost = getCreateCost(data.auraNumber);
      if ((state.lereles ?? 0) < cost) return null;

      const id = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

      const char = {
        ...CHARACTER_DEFAULTS,
        ...data,
        id,
        status:       'active',
        createdAt:    Date.now(),
        probeProgress: data.probeProgress ?? makeProbeProgress(),
        stats: { ...CHARACTER_DEFAULTS.stats, ...(data.stats ?? {}) },
      };

      set(s => ({
        characters:        { ...s.characters, [id]: char },
        usedAuraNumbers:   [...s.usedAuraNumbers, data.auraNumber],
        usedAbilityCombos: [...s.usedAbilityCombos, combo],
        lereles:           (s.lereles ?? 0) - cost,
      }));

      // Check range completions after creation
      const updated = get();
      const newRanges = [];
      for (let r = 0; r < 10; r++) {
        if ((updated.completedAuraRanges ?? []).includes(r)) continue;
        const allPresent = Array.from({ length: 10 }, (_, i) => r * 10 + i)
          .every(n => updated.usedAuraNumbers.includes(n));
        if (allPresent) newRanges.push(r);
      }
      if (newRanges.length > 0) {
        set(s => ({
          auraFragments:       (s.auraFragments ?? 0) + newRanges.length * RANGE_FRAGMENT_REWARD,
          completedAuraRanges: [...(s.completedAuraRanges ?? []), ...newRanges],
        }));
      }

      // Award collector XP
      get().dispatchMeta({ type: 'GAIN_COLLECTOR_XP', amount: XP_PER_CHARACTER_CREATED });

      return id;
    },

    /** Actualiza campos de un personaje (incluye stats si se pasan). */
    updateCharacter: (id, patch) => {
      set(state => {
        const char = state.characters[id];
        if (!char) return {};
        return {
          characters: {
            ...state.characters,
            [id]: {
              ...char,
              ...patch,
              stats: { ...char.stats, ...(patch.stats ?? {}) },
            },
          },
        };
      });
    },

    /**
     * Archiva un personaje.
     * Libera el combo pero el número de Aura queda retirado permanentemente.
     */
    archiveCharacter: (id) => {
      set(state => {
        const char = state.characters[id];
        if (!char || char.status === 'archived') return {};
        const combo = makeCombo(char);
        return {
          characters: {
            ...state.characters,
            [id]: { ...char, status: 'archived', temporalResidues: 0 },
          },
          usedAbilityCombos: state.usedAbilityCombos.filter(c => c !== combo),
        };
      });
    },

    /**
     * Reactiva un personaje archivado. Coste: REACTIVATE_COST lereles.
     * Devuelve true si tuvo éxito.
     */
    reactivateCharacter: (id) => {
      const state = get();
      const char  = state.characters[id];
      if (!char || char.status !== 'archived') return false;

      const combo = makeCombo(char);
      if ((state.usedAbilityCombos ?? []).includes(combo)) return false;
      if ((state.lereles ?? 0) < REACTIVATE_COST) return false;

      set(s => ({
        characters: {
          ...s.characters,
          [id]: { ...s.characters[id], status: 'active' },
        },
        usedAbilityCombos: [...(s.usedAbilityCombos ?? []), combo],
        lereles:           (s.lereles ?? 0) - REACTIVATE_COST,
      }));

      return true;
    },

    /**
     * Elimina un personaje permanentemente.
     * Libera su número de Aura y su combo.
     */
    deleteCharacter: (id) => {
      set(state => {
        const char = state.characters[id];
        if (!char) return {};
        const { [id]: _removed, ...rest } = state.characters;
        const combo = makeCombo(char);
        return {
          characters:        rest,
          usedAuraNumbers:   state.usedAuraNumbers.filter(n => n !== char.auraNumber),
          usedAbilityCombos: state.usedAbilityCombos.filter(c => c !== combo),
        };
      });
    },

    getAvailableAuraNumbers: () => {
      const { usedAuraNumbers } = get();
      return Array.from({ length: 100 }, (_, i) => i)
        .filter(n => !usedAuraNumbers.includes(n));
    },

    resetCollection: () => set({
      characters: {}, usedAuraNumbers: [], usedAbilityCombos: [], completedAuraRanges: [],
    }),

    isComboUsed: (passiveId, activeId, auraId) => {
      const { usedAbilityCombos } = get();
      return usedAbilityCombos.includes(`${passiveId}|${activeId}|${auraId}`);
    },

    /** Devuelve el objeto de pistas por parámetro para un tipo de prueba: { [param]: count }. */
    getProbePistas: (characterId, probeType) => {
      const char     = get().characters[characterId];
      const progress = char?.probeProgress?.[probeType];
      return (progress && typeof progress === 'object') ? progress : {};
    },

    /** Suma 1 al parámetro dado de la prueba, con tope = steps del catálogo. */
    addPista: (characterId, probeType, param) => {
      set(state => ({
        characters: applyAddPista(state.characters, characterId, probeType, param),
      }));
    },
  };
}
