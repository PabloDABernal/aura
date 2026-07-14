/**
 * CharacterCreatorScreen — formulario de creación de personaje.
 * GDD v4.0 §2 y §5 + D1 (costes) + D2 (habilidades bloqueadas).
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/index.js';
import ImageCropModal from '../ui/ImageCropModal.jsx';
import { PASSIVE_ABILITIES, ACTIVE_ABILITIES, AURA_ABILITIES } from '../../data/abilityCatalog.js';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';
import { getCreateCost, isRoundAuraNumber, CREATE_CHARACTER_COST, ROUND_AURA_BONUS_COST } from '../../data/economyConfig.js';

const KIND_META = {
  passive: { label: 'HABILIDAD PASIVA', icon: '🛡', color: '#60A5FA' },
  active:  { label: 'HABILIDAD ACTIVA', icon: '⚡', color: '#A78BFA' },
  aura:    { label: 'HABILIDAD AURA',   icon: '✨', color: '#FFD700' },
};

function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textMuted, letterSpacing: '0.1em', marginBottom: SPACING[2], marginTop: SPACING[1] }}>
      {children}
    </div>
  );
}

function AbilitySelector({ kind, abilities, selected, onSelect, collectorLevel }) {
  const { label, icon, color } = KIND_META[kind];
  return (
    <div>
      <SectionTitle>{icon} {label}</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
        {abilities.map(ab => {
          const isSelected = selected?.id === ab.id;
          const isLocked   = ab.unlockLevel && ab.unlockLevel > collectorLevel;
          return (
            <motion.button
              key={ab.id}
              whileTap={!isLocked ? { scale: 0.98 } : {}}
              onClick={() => !isLocked && onSelect(isSelected ? null : ab)}
              disabled={isLocked}
              style={{
                background:    isLocked ? 'rgba(255,255,255,0.02)' : isSelected ? `${color}18` : COLORS_UI.bgElevated,
                border:        isLocked ? `1px solid ${COLORS_UI.border}` : isSelected ? `1.5px solid ${color}` : `1px solid ${COLORS_UI.border}`,
                borderRadius:  BORDERS.radius.lg,
                padding:       SPACING[3],
                cursor:        isLocked ? 'not-allowed' : 'pointer',
                textAlign:     'left',
                display:       'flex',
                flexDirection: 'column',
                gap:           SPACING[1],
                opacity:       isLocked ? 0.45 : 1,
              }}
            >
              <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>{isLocked ? '🔒' : icon}</span>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: isLocked ? COLORS_UI.textMuted : isSelected ? color : COLORS_UI.text }}>
                  {ab.name}
                </span>
                {isLocked && (
                  <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted, marginLeft: 'auto' }}>
                    Nivel {ab.unlockLevel}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: isLocked ? COLORS_UI.textMuted : COLORS_UI.textSecondary }}>
                {ab.description}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default function CharacterCreatorScreen() {
  const {
    setScreen, createCharacter, getAvailableAuraNumbers, usedAbilityCombos,
    lereles, meta, creatorPreselect, setCreatorPreselect,
  } = useStore();

  const collectorLevel = meta?.collectorLevel ?? 1;

  const [name,           setName]          = useState('');
  const [imageData,      setImageData]     = useState(null);
  const [auraNumber,     setAuraNumber]    = useState(null);
  const [passiveAbility, setPassiveAbility] = useState(null);
  const [activeAbility,  setActiveAbility]  = useState(null);
  const [auraAbility,    setAuraAbility]    = useState(null);
  const [error,          setError]          = useState('');
  const [urlInput,       setUrlInput]       = useState('');
  const [urlError,       setUrlError]       = useState('');
  const [capturedAura,   setCapturedAura]   = useState(null); // overlay post-creación
  const [cropSrc,        setCropSrc]        = useState(null); // imagen pendiente de recorte

  const fileInputRef   = useRef(null);
  const availableAuras = getAvailableAuraNumbers();

  // Apply preselected number from AuraCollectionScreen
  useEffect(() => {
    if (creatorPreselect !== null && availableAuras.includes(creatorPreselect)) {
      setAuraNumber(creatorPreselect);
      setCreatorPreselect(null);
    }
  }, []); // eslint-disable-line

  const cost        = auraNumber !== null ? getCreateCost(auraNumber) : CREATE_CHARACTER_COST;
  const isRound     = auraNumber !== null && isRoundAuraNumber(auraNumber);
  const canAfford   = (lereles ?? 0) >= cost;

  const currentCombo = passiveAbility && activeAbility && auraAbility
    ? `${passiveAbility.id}|${activeAbility.id}|${auraAbility.id}` : null;
  const comboUsed = currentCombo ? (usedAbilityCombos ?? []).includes(currentCombo) : false;

  const isDisabled = comboUsed || !canAfford;

  const handleUrlLoad = (url) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const img = new window.Image();
    img.onload  = () => { setUrlError(''); setCropSrc(trimmed); };
    img.onerror = () => setUrlError('No se pudo cargar la imagen. Prueba con otra URL o copia la dirección directa de la imagen (clic derecho → Copiar dirección de la imagen).');
    img.src = trimmed;
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text?.trim()) {
        setUrlInput(text.trim());
        setUrlError('');
        handleUrlLoad(text.trim());
      }
    } catch {
      // Sin permiso de portapapeles — usuario pega manualmente
    }
  };

  const openSearch = (engine) => {
    const query = name.trim();
    let url;
    if (engine === 'google') {
      url = query
        ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`
        : 'https://images.google.com';
    } else {
      url = query
        ? `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
        : 'https://www.pinterest.com';
    }
    window.open(url, '_blank');
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    setError('');
    if (!name.trim())       { setError('El nombre es obligatorio'); return; }
    if (auraNumber === null){ setError('Elige un número de Aura'); return; }
    if (!passiveAbility)    { setError('Elige una habilidad pasiva'); return; }
    if (!activeAbility)     { setError('Elige una habilidad activa'); return; }
    if (!auraAbility)       { setError('Elige una habilidad Aura'); return; }
    if (comboUsed)          { setError('Esta combinación de habilidades ya está en uso. Elige al menos una diferente.'); return; }
    if (!canAfford)         { setError(`Necesitas ${cost} lereles para crear este personaje. Tienes ${lereles ?? 0}.`); return; }

    const id = createCharacter({
      name:       name.trim(),
      image:      imageData ?? null,
      auraNumber,
      passiveAbility: { id: passiveAbility.id, name: passiveAbility.name, description: passiveAbility.description, scope: passiveAbility.scope },
      activeAbility:  { id: activeAbility.id,  name: activeAbility.name,  description: activeAbility.description,  scope: activeAbility.scope  },
      auraAbility:    { id: auraAbility.id,     name: auraAbility.name,    description: auraAbility.description,    scope: auraAbility.scope    },
    });

    if (!id) {
      setError('No se pudo crear el personaje. Comprueba los lereles o la unicidad del combo.');
      return;
    }

    // Captura overlay: 2.5s antes de ir a home
    setCapturedAura(auraNumber);
    setTimeout(() => { setCapturedAura(null); setScreen('home'); }, 2500);
  };

  const initials = name ? name.slice(0, 2).toUpperCase() : '?';

  return (
    <div style={{ minHeight: '100dvh', background: COLORS_UI.bg, maxWidth: '460px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3], padding: `${SPACING[4]} ${SPACING[4]} ${SPACING[3]}`, borderBottom: `1px solid ${COLORS_UI.border}`, position: 'sticky', top: 0, background: COLORS_UI.bg, zIndex: 10 }}>
        <button onClick={() => setScreen('home')} style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[2]} ${SPACING[3]}`, cursor: 'pointer' }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>
            Nuevo Personaje
          </div>
          {/* Cost indicator */}
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: canAfford ? '#FFD700' : '#E03B3B', marginTop: '2px' }}>
            Coste: {cost}L{isRound ? ` (+${ROUND_AURA_BONUS_COST} número redondo)` : ''} · Tienes: {lereles ?? 0}L
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: SPACING[4], display: 'flex', flexDirection: 'column', gap: SPACING[5], paddingBottom: SPACING[12] }}>

        {/* Imagen + nombre */}
        <div style={{ display: 'flex', gap: SPACING[4], alignItems: 'flex-start' }}>
          <div onClick={() => fileInputRef.current?.click()} style={{ width: '80px', height: '80px', borderRadius: BORDERS.radius.lg, background: COLORS_UI.bgElevated, border: `2px dashed ${COLORS_UI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, overflow: 'hidden' }}>
            {imageData ? (
              <img src={imageData} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: SPACING[2] }}>
                <div style={{ fontSize: '24px', color: COLORS_UI.textMuted }}>{initials}</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted, marginTop: '2px' }}>foto</div>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />

          <div style={{ flex: 1 }}>
            <SectionTitle>NOMBRE</SectionTitle>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del personaje" maxLength={40}
              style={{ width: '100%', padding: SPACING[3], background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Imagen desde URL */}
        <div>
          <SectionTitle>IMAGEN DESDE URL</SectionTitle>

          {/* Botones búsqueda rápida */}
          <div style={{ display: 'flex', gap: SPACING[2], marginBottom: SPACING[2] }}>
            <button onClick={() => openSearch('google')}
              style={{ flex: 1, padding: `${SPACING[2]} ${SPACING[2]}`, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer' }}>
              🔍 Google Imágenes
            </button>
            <button onClick={() => openSearch('pinterest')}
              style={{ flex: 1, padding: `${SPACING[2]} ${SPACING[2]}`, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer' }}>
              📌 Pinterest
            </button>
          </div>

          {/* Instrucción flujo */}
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted, marginBottom: SPACING[2], lineHeight: 1.5 }}>
            Busca una imagen, haz clic derecho → "Copiar dirección de la imagen", y pégala abajo.
          </div>

          {/* Input URL + Pegar + Quitar */}
          <div style={{ display: 'flex', gap: SPACING[2] }}>
            <input value={urlInput} onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
              onBlur={e => { if (e.target.value.trim()) handleUrlLoad(e.target.value); }}
              onKeyDown={e => { if (e.key === 'Enter') handleUrlLoad(urlInput); }}
              placeholder="https://ejemplo.com/imagen.jpg"
              style={{ flex: 1, padding: SPACING[3], background: COLORS_UI.bgElevated, border: `1px solid ${urlError ? 'rgba(224,59,59,0.5)' : COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, outline: 'none', boxSizing: 'border-box', minWidth: 0 }} />
            <button onClick={handlePasteFromClipboard}
              style={{ padding: `${SPACING[2]} ${SPACING[3]}`, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Pegar
            </button>
            {imageData && (
              <button onClick={() => { setImageData(null); setUrlInput(''); setUrlError(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                style={{ padding: `${SPACING[2]} ${SPACING[3]}`, background: 'rgba(224,59,59,0.12)', border: '1px solid rgba(224,59,59,0.3)', borderRadius: BORDERS.radius.lg, color: '#E03B3B', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Quitar
              </button>
            )}
          </div>
          {urlError && <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: '#E03B3B', marginTop: SPACING[1], lineHeight: 1.4 }}>{urlError}</div>}
        </div>

        {/* Número de Aura */}
        <div>
          <SectionTitle>NÚMERO DE AURA</SectionTitle>
          {auraNumber !== null && (
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: '#FFD700', marginBottom: SPACING[2] }}>
              Seleccionado: #{String(auraNumber).padStart(2, '0')}{isRound ? ' ✦ +15L (número redondo)' : ''}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
            {Array.from({ length: 100 }, (_, i) => {
              const isAvailable = availableAuras.includes(i);
              const isSelected  = auraNumber === i;
              const isRoundNum  = isRoundAuraNumber(i);
              return (
                <motion.button
                  key={i}
                  whileTap={isAvailable ? { scale: 0.88 } : {}}
                  onClick={() => isAvailable && setAuraNumber(i)}
                  disabled={!isAvailable}
                  style={{
                    aspectRatio:  '1',
                    border:       isSelected ? '2px solid #FFD700' : isAvailable ? (isRoundNum ? '1px solid rgba(255,215,0,0.3)' : `1px solid ${COLORS_UI.border}`) : '1px solid rgba(224,59,59,0.18)',
                    borderRadius: BORDERS.radius.sm,
                    background:   isSelected ? 'rgba(255,215,0,0.18)' : isAvailable ? (isRoundNum ? 'rgba(255,215,0,0.04)' : COLORS_UI.bgElevated) : 'rgba(224,59,59,0.06)',
                    color:        isSelected ? '#FFD700' : isAvailable ? (isRoundNum ? 'rgba(255,215,0,0.8)' : COLORS_UI.text) : 'rgba(224,59,59,0.35)',
                    fontFamily:   TYPOGRAPHY.fontFamilyMono,
                    fontSize:     '10px',
                    cursor:       isAvailable ? 'pointer' : 'not-allowed',
                    padding:      0,
                    lineHeight:   1,
                    boxShadow:    isSelected ? '0 0 8px rgba(255,215,0,0.35)' : 'none',
                    transition:   'background 0.15s, border-color 0.15s',
                  }}
                >
                  {String(i).padStart(2, '0')}
                </motion.button>
              );
            })}
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted, marginTop: SPACING[1] }}>
            Números con borde dorado son "redondos" (00, 11, 22…) — coste +{ROUND_AURA_BONUS_COST}L · También llamados Frecuencias redondas.
          </div>
        </div>

        {/* Habilidades */}
        <AbilitySelector kind="passive" abilities={PASSIVE_ABILITIES} selected={passiveAbility} onSelect={setPassiveAbility} collectorLevel={collectorLevel} />
        <AbilitySelector kind="active"  abilities={ACTIVE_ABILITIES}  selected={activeAbility}  onSelect={setActiveAbility}  collectorLevel={collectorLevel} />
        <AbilitySelector kind="aura"    abilities={AURA_ABILITIES}    selected={auraAbility}    onSelect={setAuraAbility}    collectorLevel={collectorLevel} />

        {/* Aviso combo duplicado */}
        {comboUsed && (
          <div style={{ background: 'rgba(224,59,59,0.08)', border: '1px solid rgba(224,59,59,0.35)', borderRadius: BORDERS.radius.lg, padding: SPACING[3], color: '#E03B3B', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>
            Esta combinación ya está en uso. Cambia al menos una habilidad.
          </div>
        )}

        {/* Lereles insuficientes */}
        {!canAfford && !comboUsed && auraNumber !== null && (
          <div style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: BORDERS.radius.lg, padding: SPACING[3], color: 'rgba(255,215,0,0.8)', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>
            Necesitas {cost}L. Tienes {lereles ?? 0}L. Completa runs para ganar más lereles.
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(224,59,59,0.1)', border: '1px solid rgba(224,59,59,0.4)', borderRadius: BORDERS.radius.lg, padding: SPACING[3], color: '#E03B3B', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>
            {error}
          </div>
        )}
      </div>

      {/* Cropper de imagen */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={(result) => { setImageData(result); setCropSrc(null); setUrlInput(''); }}
          onCancel={() => { setCropSrc(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
        />
      )}

      {/* Overlay: captura de resonancia */}
      {capturedAura !== null && (
        <div
          onClick={() => { setCapturedAura(null); setScreen('home'); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(4,4,7,0.96)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[4], cursor: 'pointer' }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING[3] }}
          >
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '72px', fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', lineHeight: 1, textShadow: '0 0 40px #FFD70099, 0 0 80px #FFD70044' }}>
              {String(capturedAura).padStart(2, '0')}
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700', letterSpacing: '0.08em' }}>
              Resonancia capturada
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: 'rgba(255,215,0,0.65)', letterSpacing: '0.12em' }}>
              Frecuencia {String(capturedAura).padStart(2, '0')}
            </div>
          </motion.div>
        </div>
      )}

      {/* Botón crear (sticky bottom) */}
      <div style={{ position: 'sticky', bottom: 0, background: COLORS_UI.bg, borderTop: `1px solid ${COLORS_UI.border}`, padding: SPACING[4] }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          style={{
            width:        '100%',
            minHeight:    '56px',
            background:   isDisabled ? COLORS_UI.bgElevated : COLORS_GAME.verde,
            border:       isDisabled ? `1px solid ${COLORS_UI.border}` : 'none',
            borderRadius: BORDERS.radius.xl,
            fontFamily:   TYPOGRAPHY.fontFamily,
            fontSize:     TYPOGRAPHY.size.xl,
            fontWeight:   TYPOGRAPHY.weight.black,
            color:        isDisabled ? COLORS_UI.textMuted : 'white',
            letterSpacing:'0.14em',
            cursor:       'pointer',
            boxShadow:    isDisabled ? 'none' : `0 4px 24px ${COLORS_GAME.verde}60`,
            transition:   'background 0.2s, box-shadow 0.2s',
          }}
        >
          CREAR — {cost}L
        </motion.button>
      </div>
    </div>
  );
}
