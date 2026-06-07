import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { surprisePlace } from '../../../engine/editor/surpriseMe.js';
import { PLACE_TYPES, PLACE_TYPE_LIST } from '../../../data/placeTypes.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

const COLOR_OPTIONS = [
  { id: 'rojo',    emoji: '🔴', label: 'Rojo',    accent: COLORS_GAME.rojo    },
  { id: 'morado',  emoji: '🟣', label: 'Morado',  accent: COLORS_GAME.morado  },
  { id: 'negro',   emoji: '⚫', label: 'Negro',   accent: '#666680'           },
  { id: 'verde',   emoji: '🟢', label: 'Verde',   accent: COLORS_GAME.verde   },
  { id: 'naranja', emoji: '🟠', label: 'Naranja', accent: COLORS_GAME.naranja },
];

function Section({ title, children, accent }) {
  return (
    <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${accent ?? COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: accent ?? COLORS_UI.textSecondary, marginBottom: SPACING[3], letterSpacing: '0.1em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary, marginBottom: 4 }}>{children}</div>;
}

function TextInput({ value, onChange, placeholder, maxLength, disabled }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} disabled={disabled}
      style={{ width: '100%', background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, padding: SPACING[2], color: disabled ? COLORS_UI.textMuted : COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, outline: 'none', boxSizing: 'border-box' }} />
  );
}

export default function PlaceEditorScreen() {
  const setScreen          = useStore(s => s.setScreen);
  const collection         = useStore(s => s.collection);
  const currentEditSetId   = useStore(s => s.currentEditSetId);
  const dispatchCollection = useStore(s => s.dispatchCollection);
  const dispatchMeta       = useStore(s => s.dispatchMeta);

  const editSet = currentEditSetId
    ? collection?.sets?.[currentEditSetId]
    : Object.values(collection?.sets ?? {}).find(s => s.status === 'draft');

  const defaultColor = editSet?.colorId ?? 'rojo';

  const [name,       setName]       = useState('');
  const [icon,       setIcon]       = useState('🏰');
  const [colorId,    setColorId]    = useState(defaultColor);
  const [type,       setType]       = useState('basico');
  const [efecto,     setEfecto]     = useState('');
  const [resonance,  setResonance]  = useState(24);
  const [intrinsic,  setIntrinsic]  = useState(false);
  const [saved,      setSaved]      = useState(false);

  const selectedColor = COLOR_OPTIONS.find(c => c.id === colorId) ?? COLOR_OPTIONS[0];
  const selectedType  = PLACE_TYPES[type];

  const canSave = name.trim().length >= 2 && (intrinsic || editSet);

  const handleSurprise = () => {
    const s = surprisePlace();
    setName(s.name);
    setIcon(s.icon);
    setType(s.type);
    setResonance(s.resonance);
  };

  const handleSave = () => {
    if (!canSave || saved) return;
    const placeId = crypto.randomUUID();
    const newPlace = {
      id:        placeId,
      setId:     intrinsic ? null : (editSet?.id ?? null),
      colorId,
      name:      name.trim(),
      icon,
      type,
      efecto:    efecto.trim(),
      resonance,
      upperLimit: null,
      vibra: { mode: selectedType?.vibraMode ?? 'punto', target: 3500, timeLimit: 7, pifiaMargin: 20 },
      pifiaConsequence: { type: 'loseAura', value: 1 },
      conquerBonus:     { type: 'lereles', value: 2 },
    };
    dispatchCollection({ type: 'CREATE_PLACE',   place: newPlace });
    dispatchCollection({ type: 'CONFIRM_PLACE',  id: placeId });
    if (!intrinsic && editSet) {
      dispatchCollection({ type: 'UPDATE_SET', id: editSet.id, patch: { placeId } });
    }
    dispatchMeta({ type: 'GAIN_POINTS', amount: 2 });
    setSaved(true);
    setTimeout(() => setScreen('set-editor'), 1200);
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto' }}>

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: COLORS_UI.bg, borderBottom: `1px solid ${COLORS_UI.border}`, padding: `${SPACING[3]} ${SPACING[4]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, color: selectedColor.accent }}>
          NUEVO LUGAR
        </div>
        <div style={{ display: 'flex', gap: SPACING[2] }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSurprise}
            style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: `${SPACING[1]} ${SPACING[3]}`, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
            🎲 Surprise Me
          </motion.button>
          <button onClick={() => setScreen('set-editor')}
            style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>
            ✕
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${SPACING[4]} ${SPACING[4]} 120px`, display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>

        {/* Set context */}
        {editSet && (
          <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, padding: `${SPACING[2]} ${SPACING[3]}`, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary }}>
            Set: <span style={{ color: selectedColor.accent, fontWeight: TYPOGRAPHY.weight.bold }}>{editSet.name || 'Sin nombre'}</span>
          </div>
        )}

        {/* ── BÁSICO ─────────────────────────────────────────────────────── */}
        <Section title="BÁSICO" accent={selectedColor.accent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
            <div>
              <FieldLabel>Nombre *</FieldLabel>
              <TextInput value={name} onChange={setName} placeholder="Nombre del lugar" maxLength={40} />
              {name.length > 0 && name.trim().length < 2 && (
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.danger, marginTop: 4 }}>Mínimo 2 caracteres</div>
              )}
            </div>

            <div>
              <FieldLabel>Icono / Emoji</FieldLabel>
              <TextInput value={icon} onChange={setIcon} placeholder="🏰" maxLength={4} />
            </div>

            <div>
              <FieldLabel>Color</FieldLabel>
              <div style={{ display: 'flex', gap: SPACING[2] }}>
                {COLOR_OPTIONS.map(c => (
                  <motion.button key={c.id} whileTap={{ scale: 0.93 }} onClick={() => setColorId(c.id)}
                    style={{ flex: 1, padding: SPACING[2], background: colorId === c.id ? `${c.accent}22` : COLORS_UI.bgElevated, border: `2px solid ${colorId === c.id ? c.accent : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: '16px' }}>{c.emoji}</span>
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: colorId === c.id ? c.accent : COLORS_UI.textMuted, fontWeight: TYPOGRAPHY.weight.bold }}>{c.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── MECÁNICA ────────────────────────────────────────────────────── */}
        <Section title="MECÁNICA" accent={COLORS_UI.textSecondary}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
            <div>
              <FieldLabel>Tipo de Lugar</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
                {PLACE_TYPE_LIST.map(t => (
                  <motion.button key={t.id} whileTap={{ scale: 0.99 }} onClick={() => setType(t.id)}
                    style={{ background: type === t.id ? COLORS_UI.bgElevated : 'transparent', border: `1px solid ${type === t.id ? selectedColor.accent : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, padding: SPACING[2], cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2] }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: type === t.id ? selectedColor.accent : COLORS_UI.border, flexShrink: 0 }} />
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: type === t.id ? TYPOGRAPHY.weight.bold : TYPOGRAPHY.weight.regular, color: type === t.id ? COLORS_UI.text : COLORS_UI.textSecondary }}>{t.name}</span>
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginLeft: 'auto' }}>{t.vibraMode === 'punto' ? '⏱ Punto' : '⌛ Centés.'}</span>
                    </div>
                    {type === t.id && (
                      <div style={{ marginTop: SPACING[1], paddingLeft: 20, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary, lineHeight: TYPOGRAPHY.lineHeight.normal }}>
                        {t.description}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Efecto especial (descripción libre)</FieldLabel>
              <textarea value={efecto} onChange={e => setEfecto(e.target.value)} placeholder="Describe el efecto especial de este lugar…" rows={3}
                style={{ width: '100%', background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, padding: SPACING[2], color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: TYPOGRAPHY.lineHeight.normal }} />
            </div>
          </div>
        </Section>

        {/* ── CONFIGURACIÓN ──────────────────────────────────────────────── */}
        <Section title="CONFIGURACIÓN" accent={COLORS_UI.textSecondary}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
            <div>
              <FieldLabel>Resonancia inicial: {resonance}</FieldLabel>
              <input type="range" min={10} max={100} step={2} value={resonance} onChange={e => setResonance(Number(e.target.value))}
                style={{ width: '100%', accentColor: selectedColor.accent }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: 2 }}>
                <span>10 (fácil)</span><span>100 (brutal)</span>
              </div>
            </div>

            <div>
              <FieldLabel>¿Lugar intrínseco?</FieldLabel>
              <div style={{ display: 'flex', gap: SPACING[2] }}>
                {[false, true].map(v => (
                  <motion.button key={String(v)} whileTap={{ scale: 0.97 }} onClick={() => setIntrinsic(v)}
                    style={{ flex: 1, padding: SPACING[2], background: intrinsic === v ? (v ? `${COLORS_UI.warning}22` : `${COLORS_UI.success}22`) : COLORS_UI.bgElevated, border: `2px solid ${intrinsic === v ? (v ? COLORS_UI.warning : COLORS_UI.success) : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: intrinsic === v ? TYPOGRAPHY.weight.bold : TYPOGRAPHY.weight.regular, color: intrinsic === v ? COLORS_UI.text : COLORS_UI.textMuted }}>
                    {v ? '✅ Sí' : '❌ No'}
                  </motion.button>
                ))}
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary, marginTop: SPACING[2], lineHeight: TYPOGRAPHY.lineHeight.normal }}>
                {intrinsic
                  ? '⚠️ Intrínseco: no pertenece a ningún set. Se añadirá al pool de lugares genéricos disponibles en todas las runs.'
                  : 'No intrínseco: este lugar se asignará al set activo en el editor.'}
              </div>
            </div>

            {!intrinsic && !editSet && (
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.danger, background: `${COLORS_UI.danger}15`, borderRadius: BORDERS.radius.md, padding: SPACING[2] }}>
                Sin set en borrador activo. Activa el modo intrínseco o crea un set primero.
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'sticky', bottom: 0, background: COLORS_UI.bg, borderTop: `1px solid ${COLORS_UI.border}`, padding: SPACING[4] }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!canSave || saved}
          onClick={handleSave}
          style={{ width: '100%', padding: `${SPACING[3]} 0`, background: saved ? COLORS_UI.success : canSave ? selectedColor.accent : COLORS_UI.bgElevated, border: 'none', borderRadius: BORDERS.radius.xl, color: canSave ? 'white' : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, cursor: canSave && !saved ? 'pointer' : 'default' }}>
          {saved ? '✓ GUARDADO (+2pts)' : `CONFIRMAR LUGAR${canSave ? ' (+2pts)' : ''}`}
        </motion.button>
      </div>
    </div>
  );
}
