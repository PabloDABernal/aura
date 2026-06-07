import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { surpriseEco } from '../../../engine/editor/surpriseMe.js';
import { ECO_HOOKS } from '../../../engine/eco/ecoHooks.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS } from '../../../styles/tokens.js';

const CATEGORIES = [
  { id: 'vibra',     label: 'Vibra',     desc: 'Modifica la mecánica de vibración',     icon: '🎵' },
  { id: 'personaje', label: 'Personaje', desc: 'Afecta a personajes o sus habilidades', icon: '👤' },
  { id: 'lugar',     label: 'Lugar',     desc: 'Altera la resonancia o conquista',      icon: '🏰' },
  { id: 'economia',  label: 'Economía',  desc: 'Afecta lereles, puntos o recursos',     icon: '💰' },
  { id: 'sinergia',  label: 'Sinergia',  desc: 'Combina efectos de otros Ecos',         icon: '✨' },
];

const RAREZAS = [
  { id: 'normal',     label: 'Común',       color: '#888899' },
  { id: 'infrecuente', label: 'Infrecuente', color: '#5B8AFF' },
  { id: 'raro',       label: 'Raro',        color: '#D4A01E' },
];

const HOOK_LABELS = {
  ON_VIBRA_RESULT:    'Al resultado de Vibra',
  ON_REST:            'Al descansar',
  ON_DRAW:            'Al robar carta',
  ON_KO:              'Al KO de personaje',
  ON_PLACE_CONQUERED: 'Al conquistar lugar',
  ON_NODE_COMPLETE:   'Al completar nodo',
  ON_COMBAT_START:    'Al inicio de combate',
};

function Section({ title, children }) {
  return (
    <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginBottom: SPACING[3], letterSpacing: '0.1em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary, marginBottom: 4 }}>{children}</div>;
}

export default function EcoEditorScreen() {
  const setScreen          = useStore(s => s.setScreen);
  const dispatchCollection = useStore(s => s.dispatchCollection);
  const dispatchMeta       = useStore(s => s.dispatchMeta);

  const [name,     setName]     = useState('');
  const [category, setCategory] = useState('vibra');
  const [hook,     setHook]     = useState('ON_VIBRA_RESULT');
  const [efecto,   setEfecto]   = useState('');
  const [rareza,   setRareza]   = useState('normal');
  const [saved,    setSaved]    = useState(false);

  const selectedCat   = CATEGORIES.find(c => c.id === category) ?? CATEGORIES[0];
  const selectedRareza = RAREZAS.find(r => r.id === rareza) ?? RAREZAS[0];

  const canSave = name.trim().length >= 2 && efecto.trim().length >= 5;

  const handleSurprise = () => {
    const s = surpriseEco(category);
    setName(s.name);
    setEfecto(s.description);
    setCategory(s.category);
    setRareza(s.rarity);
  };

  const handleSave = () => {
    if (!canSave || saved) return;
    const ecoId = crypto.randomUUID();
    const newEco = {
      id:       ecoId,
      name:     name.trim(),
      category,
      hook,
      efecto:   efecto.trim(),
      rareza,
      ownerId:  'local',
      custom:   true,
    };
    dispatchCollection({ type: 'CREATE_ECO', eco: newEco });
    dispatchMeta({ type: 'GAIN_POINTS', amount: 1 });
    setSaved(true);
    setTimeout(() => setScreen('collection-menu'), 1200);
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto' }}>

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: COLORS_UI.bg, borderBottom: `1px solid ${COLORS_UI.border}`, padding: `${SPACING[3]} ${SPACING[4]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, color: selectedRareza.color }}>
          NUEVO ECO
        </div>
        <div style={{ display: 'flex', gap: SPACING[2] }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSurprise}
            style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: `${SPACING[1]} ${SPACING[3]}`, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
            🎲 Surprise Me
          </motion.button>
          <button onClick={() => setScreen('collection-menu')}
            style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>
            ✕
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${SPACING[4]} ${SPACING[4]} 120px`, display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>

        {/* ── IDENTIDAD ──────────────────────────────────────────────────── */}
        <Section title="IDENTIDAD">
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
            <div>
              <FieldLabel>Nombre *</FieldLabel>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del Eco" maxLength={40}
                style={{ width: '100%', background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, padding: SPACING[2], color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, outline: 'none', boxSizing: 'border-box' }} />
              {name.length > 0 && name.trim().length < 2 && (
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.danger, marginTop: 4 }}>Mínimo 2 caracteres</div>
              )}
            </div>

            <div>
              <FieldLabel>Categoría</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
                {CATEGORIES.map(c => (
                  <motion.button key={c.id} whileTap={{ scale: 0.99 }} onClick={() => setCategory(c.id)}
                    style={{ background: category === c.id ? COLORS_UI.bgElevated : 'transparent', border: `1px solid ${category === c.id ? COLORS_UI.borderLight : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, padding: SPACING[2], cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: SPACING[2] }}>
                    <span style={{ fontSize: '18px' }}>{c.icon}</span>
                    <div>
                      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: category === c.id ? TYPOGRAPHY.weight.bold : TYPOGRAPHY.weight.regular, color: category === c.id ? COLORS_UI.text : COLORS_UI.textSecondary }}>{c.label}</div>
                      {category === c.id && (
                        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>{c.desc}</div>
                      )}
                    </div>
                    {category === c.id && (
                      <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: COLORS_UI.success }} />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Rareza</FieldLabel>
              <div style={{ display: 'flex', gap: SPACING[2] }}>
                {RAREZAS.map(r => (
                  <motion.button key={r.id} whileTap={{ scale: 0.96 }} onClick={() => setRareza(r.id)}
                    style={{ flex: 1, padding: SPACING[2], background: rareza === r.id ? `${r.color}22` : COLORS_UI.bgElevated, border: `2px solid ${rareza === r.id ? r.color : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: rareza === r.id ? TYPOGRAPHY.weight.bold : TYPOGRAPHY.weight.regular, color: rareza === r.id ? r.color : COLORS_UI.textMuted }}>
                    {r.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── MECÁNICA ────────────────────────────────────────────────────── */}
        <Section title="MECÁNICA">
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
            <div>
              <FieldLabel>Gancho (cuándo se activa)</FieldLabel>
              <select value={hook} onChange={e => setHook(e.target.value)}
                style={{ width: '100%', background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, padding: SPACING[2], color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>
                {Object.entries(ECO_HOOKS).map(([k, v]) => (
                  <option key={k} value={v}>{HOOK_LABELS[v] ?? v}</option>
                ))}
              </select>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: 4 }}>
                Trigger: <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, color: COLORS_UI.textSecondary }}>{hook}</span>
              </div>
            </div>

            <div>
              <FieldLabel>Efecto * (describe qué hace)</FieldLabel>
              <textarea value={efecto} onChange={e => setEfecto(e.target.value)} placeholder="Ej: Al resultado de Vibra exitoso, +1L adicional por cada Flow activo." rows={4}
                style={{ width: '100%', background: COLORS_UI.bgElevated, border: `1px solid ${efecto.trim().length > 0 && efecto.trim().length < 5 ? COLORS_UI.danger : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, padding: SPACING[2], color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: TYPOGRAPHY.lineHeight.normal }} />
              {efecto.trim().length > 0 && efecto.trim().length < 5 && (
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.danger, marginTop: 4 }}>Describe el efecto (mín. 5 caracteres)</div>
              )}
            </div>
          </div>
        </Section>

        {/* Preview card */}
        <div style={{ background: `${selectedRareza.color}11`, border: `1px solid ${selectedRareza.color}44`, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: selectedRareza.color, fontWeight: TYPOGRAPHY.weight.bold, marginBottom: SPACING[2], letterSpacing: '0.08em' }}>
            VISTA PREVIA
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING[3] }}>
            <div style={{ fontSize: '28px', lineHeight: 1 }}>{selectedCat.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>
                {name.trim() || 'Nombre del Eco'}
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: selectedRareza.color, marginTop: 2 }}>
                {selectedCat.label} · {selectedRareza.label}
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary, marginTop: SPACING[1], lineHeight: TYPOGRAPHY.lineHeight.normal }}>
                {efecto.trim() || 'Sin efecto definido.'}
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: '10px', color: COLORS_UI.textMuted, marginTop: SPACING[1] }}>
                {HOOK_LABELS[hook] ?? hook}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'sticky', bottom: 0, background: COLORS_UI.bg, borderTop: `1px solid ${COLORS_UI.border}`, padding: SPACING[4] }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!canSave || saved}
          onClick={handleSave}
          style={{ width: '100%', padding: `${SPACING[3]} 0`, background: saved ? COLORS_UI.success : canSave ? selectedRareza.color : COLORS_UI.bgElevated, border: 'none', borderRadius: BORDERS.radius.xl, color: canSave ? 'white' : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, cursor: canSave && !saved ? 'pointer' : 'default' }}>
          {saved ? '✓ GUARDADO (+1pt)' : `CREAR ECO${canSave ? ' (+1pt)' : ''}`}
        </motion.button>
      </div>
    </div>
  );
}
