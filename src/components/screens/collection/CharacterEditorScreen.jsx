import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { leaderAura, guestAura } from '../../../engine/character/auraCalculator.js';
import { split } from '../../../engine/character/attributeSplit.js';
import { surpriseCharacter } from '../../../engine/editor/surpriseMe.js';
import { COLORS, KEYWORD_LABELS } from '../../../data/colors.js';
import { getTheme } from '../../../styles/colorThemes.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';

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

function KwSelect({ label, value, onChange, options, colorTheme }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: COLORS_UI.bgElevated, border: `1px solid ${colorTheme.border}`, borderRadius: BORDERS.radius.md, padding: SPACING[2], color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>
        <option value="">— Sin habilidad —</option>
        {options.map(k => (
          <option key={k} value={k}>{KEYWORD_LABELS[k] ?? k}</option>
        ))}
      </select>
    </div>
  );
}

function AuraDisplay({ presencia, influencia, temple, total, label }) {
  return (
    <div style={{ background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.md, padding: SPACING[2], display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
      <div style={{ textAlign: 'center', minWidth: 40 }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>{total}</div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.textMuted }}>{label}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: SPACING[3] }}>
        {[['P', presencia, COLORS_GAME.rojo], ['I', influencia, COLORS_GAME.morado], ['T', temple, COLORS_GAME.verde]].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.bold, color: c, fontSize: TYPOGRAPHY.size.md }}>{v}</div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.textMuted }}>{l}</div>
            <div style={{ height: 3, background: '#222230', borderRadius: 2, marginTop: 2 }}>
              <div style={{ height: '100%', width: `${(v / (total || 1)) * 100}%`, background: c, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CharacterEditorScreen() {
  const setScreen          = useStore(s => s.setScreen);
  const collection         = useStore(s => s.collection);
  const currentEditSetId   = useStore(s => s.currentEditSetId);
  const dispatchCollection = useStore(s => s.dispatchCollection);
  const dispatchMeta       = useStore(s => s.dispatchMeta);

  const draftSet = currentEditSetId
    ? collection?.sets?.[currentEditSetId]
    : Object.values(collection?.sets ?? {}).find(s => s.status === 'draft');

  const colorId = draftSet?.colorId ?? 'rojo';
  const theme   = getTheme(colorId);
  const color   = COLORS[colorId];

  const [name,       setName]       = useState('');
  const [phrase,     setPhrase]     = useState('');
  const [role,       setRole]       = useState('lider');
  const [activeKw,   setActiveKw]   = useState('');
  const [passiveKw,  setPassiveKw]  = useState('');
  const [ultCost,    setUltCost]    = useState(0);
  const [vibraTarget,setVibraTarget]= useState(50);
  const [saved,      setSaved]      = useState(false);

  const activePool  = color?.keywords?.activa  ?? [];
  const passivePool = color?.keywords?.pasiva   ?? [];
  const allKws      = [...activePool, ...passivePool];

  const isLeader = role === 'lider';

  const dummyChar = {
    leader: isLeader ? {
      activeAbility:  activeKw  ? { keywordIds: [activeKw]  } : null,
      passiveAbility: passiveKw ? { keywordIds: [passiveKw] } : null,
      ultimate:       ultCost >= 5 ? { cost: ultCost } : null,
    } : null,
    guest: { inheritedAbilityIds: activeKw ? [activeKw] : [], onDrawOrInHQ: null, onDiscard: { fromHQ: null, fromZone: null } },
  };

  const lAura  = isLeader ? leaderAura(dummyChar) : 0;
  const gAura  = guestAura(dummyChar);
  const lAttrs = isLeader ? split(lAura, colorId) : { presencia: 0, influencia: 0, temple: 0 };
  const gAttrs = split(gAura, colorId);

  const canSave = name.trim().length >= 2 && !!draftSet;

  const handleSurpriseMe = () => {
    const s = surpriseCharacter(colorId);
    setName(s.name);
    setPhrase(s.phrase);
    setActiveKw(s.activeKw);
    setPassiveKw(s.passiveKw);
    setUltCost(s.ultCost);
    setVibraTarget(s.vibraTarget);
  };

  const handleSave = () => {
    if (!canSave) return;
    const charId = crypto.randomUUID();
    const emoji  = { rojo: '🔴', morado: '🟣', negro: '⚫', verde: '🟢', naranja: '🟠' }[colorId] ?? '⭐';
    const newChar = {
      id: charId, setId: draftSet.id, colorId, ownerId: 'local',
      basics: { name: name.trim(), phrase: phrase.trim(), emoji },
      leader: isLeader ? {
        activeAbility:  activeKw  ? { keywordIds: [activeKw],  level: 1, customName: null } : null,
        passiveAbility: passiveKw ? { keywordIds: [passiveKw], level: 1, customName: null } : null,
        ultimate:       ultCost > 0 ? { cost: ultCost, keywordIds: [], customName: null } : null,
      } : null,
      guest: {
        inheritedAbilityIds: activeKw ? [activeKw] : [],
        onDrawOrInHQ: null,
        onDiscard: { fromHQ: null, fromZone: null },
      },
      corrupt: isLeader ? {
        vibraTarget,
        baseActions: { attackPit: { value: 2 }, recover: { value: 2 }, interveneRise: { value: 3 }, attackPlace: { value: 2 } },
        timerModifiers: { hideMark: true, hideCentesimas: false, segundosUntil: 0, separatorsFrom: 5, markFrom: 9 },
      } : null,
    };
    dispatchCollection({ type: 'CREATE_CHARACTER', char: newChar });
    dispatchCollection({ type: 'CONFIRM_CHARACTER', id: charId });
    dispatchCollection({ type: 'UPDATE_SET', id: draftSet.id, patch: { characters: [...(draftSet.characters ?? []), charId] } });
    dispatchMeta({ type: 'GAIN_POINTS', amount: 1 });
    setSaved(true);
    setTimeout(() => setScreen('set-editor'), 1200);
  };

  if (!draftSet) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: SPACING[3] }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, color: COLORS_UI.textMuted }}>Sin Set en borrador.</div>
        <button onClick={() => setScreen('sets')} style={{ padding: `${SPACING[2]} ${SPACING[3]}`, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: COLORS_UI.text, cursor: 'pointer' }}>← Volver</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS_UI.bg, maxWidth: 460, margin: '0 auto', paddingBottom: SPACING[8] }}>
      {/* Header fijo */}
      <div style={{ position: 'sticky', top: 0, background: COLORS_UI.bg, zIndex: 10, padding: `${SPACING[4]} ${SPACING[4]} ${SPACING[2]}`, borderBottom: `1px solid ${COLORS_UI.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: theme.text }}>NUEVO PERSONAJE</div>
          <div style={{ display: 'flex', gap: SPACING[2] }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleSurpriseMe}
              style={{ padding: `${SPACING[1]} ${SPACING[2]}`, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: BORDERS.radius.md, color: theme.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer', fontWeight: TYPOGRAPHY.weight.bold }}>
              🎲 Surprise Me
            </motion.button>
            <button onClick={() => setScreen('set-editor')}
              style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>
              ← Cancelar
            </button>
          </div>
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: 4 }}>
          Set: <span style={{ color: theme.text }}>{draftSet.name}</span> · Color: {color?.emoji} {color?.label}
        </div>
      </div>

      <div style={{ padding: `${SPACING[3]} ${SPACING[4]}`, display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>

        {/* SECCIÓN 1: IDENTIDAD */}
        <Section title="1. IDENTIDAD" accent={theme.border}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
            <div>
              <FieldLabel>Nombre *</FieldLabel>
              <TextInput value={name} onChange={setName} placeholder="Nombre del personaje (2-30)" maxLength={30} />
              {name.length > 0 && name.length < 2 && (
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.danger, marginTop: 2 }}>Mínimo 2 caracteres</div>
              )}
            </div>
            <div>
              <FieldLabel>Frase (opcional)</FieldLabel>
              <TextInput value={phrase} onChange={setPhrase} placeholder="Frase del personaje..." maxLength={80} />
            </div>
            <div>
              <FieldLabel>Rol en el Set</FieldLabel>
              <div style={{ display: 'flex', gap: SPACING[2] }}>
                {[['lider', 'Líder', 'Puede comandar la run, vuelve al HQ al caer en KO.'],
                  ['aliado', 'Aliado (Invitado)', 'Se roba del mazo, no puede ser seleccionado como líder.']].map(([val, label, desc]) => (
                  <motion.button key={val} whileTap={{ scale: 0.97 }}
                    onClick={() => setRole(val)}
                    style={{ flex: 1, padding: SPACING[2], background: role === val ? theme.bg : COLORS_UI.bgElevated, border: `2px solid ${role === val ? theme.border : COLORS_UI.border}`, borderRadius: BORDERS.radius.md, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: role === val ? theme.text : COLORS_UI.text }}>{label}</div>
                    <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.textMuted, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* SECCIÓN 2: ATRIBUTOS */}
        <Section title="2. ATRIBUTOS" accent={COLORS_GAME.rojo}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
            {isLeader ? (
              <>
                <AuraDisplay {...lAttrs} total={lAura} label="Aura Líder" />
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                  El Aura se calcula automáticamente según las habilidades. Más habilidades = menos Aura base.
                </div>
                <KwSelect label="Habilidad Activa (−1 Aura)" value={activeKw} onChange={setActiveKw} options={activePool} colorTheme={theme} />
                <KwSelect label="Habilidad Pasiva (−1 Aura)" value={passiveKw} onChange={setPassiveKw} options={passivePool} colorTheme={theme} />
                <div>
                  <FieldLabel>Coste Ultimate (0=sin Ultimate · ≥5L: −1 Aura extra)</FieldLabel>
                  <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
                    <input type="range" min={0} max={10} value={ultCost} onChange={e => setUltCost(Number(e.target.value))}
                      style={{ flex: 1, accentColor: theme.border }} />
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.bold, color: theme.text, minWidth: 28, textAlign: 'right' }}>{ultCost}L</span>
                  </div>
                  {ultCost >= 5 && <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.warning, marginTop: 2 }}>⚠️ Ultimate potente: −1 Aura adicional</div>}
                </div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.md, padding: SPACING[2] }}>
                  Fórmula: 8 {activeKw ? '−1 (activa)' : ''} {passiveKw ? '−1 (pasiva)' : ''} {ultCost >= 5 ? '−1 (ult)' : ''} = <strong style={{ color: COLORS_UI.text }}>{lAura} Aura</strong>
                </div>
              </>
            ) : (
              <>
                <AuraDisplay {...gAttrs} total={gAura} label="Aura Invitado" />
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                  Aura base 5 − 1 por cada habilidad heredada. Mínimo 1.
                </div>
                <KwSelect label="Habilidad heredada (al robarse)" value={activeKw} onChange={setActiveKw} options={allKws} colorTheme={theme} />
              </>
            )}
          </div>
        </Section>

        {/* SECCIÓN 3: CARTAS */}
        <Section title="3. CARTAS" accent={COLORS_GAME.morado}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
            {isLeader ? (
              <>
                {/* Preview carta líder */}
                <div style={{ background: theme.bg, border: `2px solid ${theme.border}`, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING[2] }}>
                    <div>
                      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: theme.text, fontSize: TYPOGRAPHY.size.md }}>{name || 'Nombre del personaje'}</div>
                      {phrase && <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary, fontStyle: 'italic' }}>"{phrase}"</div>}
                    </div>
                    <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: theme.text }}>{lAura}</div>
                  </div>
                  <div style={{ display: 'flex', gap: SPACING[2], flexWrap: 'wrap' }}>
                    {activeKw && (
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', background: theme.border + '33', color: theme.text, borderRadius: BORDERS.radius.sm, padding: '2px 6px' }}>
                        ⚡ {KEYWORD_LABELS[activeKw] ?? activeKw}
                      </span>
                    )}
                    {passiveKw && (
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', background: theme.border + '33', color: theme.text, borderRadius: BORDERS.radius.sm, padding: '2px 6px' }}>
                        🛡️ {KEYWORD_LABELS[passiveKw] ?? passiveKw}
                      </span>
                    )}
                    {ultCost > 0 && (
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', background: '#FFD70033', color: '#FFD700', borderRadius: BORDERS.radius.sm, padding: '2px 6px' }}>
                        ✨ Ultimate {ultCost}L
                      </span>
                    )}
                    {!activeKw && !passiveKw && ultCost === 0 && (
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.textMuted }}>Sin habilidades especiales</span>
                    )}
                  </div>
                </div>
                {/* Preview carta corrupto */}
                {isLeader && (
                  <div>
                    <FieldLabel>Como Corrupto — Objetivo Vibra</FieldLabel>
                    <div style={{ display: 'flex', gap: SPACING[2], alignItems: 'center' }}>
                      <input type="range" min={0} max={99} value={vibraTarget} onChange={e => setVibraTarget(Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#E03B3B' }} />
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.bold, color: '#E03B3B', minWidth: 36 }}>.{String(vibraTarget).padStart(2, '0')}</span>
                    </div>
                    <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.textMuted, marginTop: 2 }}>
                      Aura ×3={lAura * 3} · ×10={lAura * 10} · ×20={lAura * 20}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: COLORS_UI.bgElevated, border: `1px solid ${theme.border}33`, borderRadius: BORDERS.radius.lg, padding: SPACING[3] }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.textSecondary, fontSize: TYPOGRAPHY.size.sm }}>{name || 'Invitado'}</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, color: COLORS_UI.textMuted, fontSize: TYPOGRAPHY.size.sm }}>Aura {gAura} · P{gAttrs.presencia}/I{gAttrs.influencia}/T{gAttrs.temple}</div>
                {activeKw && <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: theme.text, marginTop: 4 }}>Al robarse: {KEYWORD_LABELS[activeKw] ?? activeKw}</div>}
              </div>
            )}
          </div>
        </Section>

        {/* SECCIÓN 4: KEYWORDS */}
        <Section title="4. KEYWORDS DEL COLOR" accent={theme.border}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginBottom: SPACING[2] }}>
            Keywords disponibles para {color?.emoji} {color?.label}. Asígnalas en Atributos.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING[1] }}>
            {[...new Set([...activePool, ...passivePool])].map(kw => {
              const isUsed = kw === activeKw || kw === passiveKw;
              return (
                <span key={kw}
                  style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '11px', padding: '3px 8px', borderRadius: BORDERS.radius.full, background: isUsed ? theme.border + '44' : COLORS_UI.bgElevated, color: isUsed ? theme.text : COLORS_UI.textSecondary, border: `1px solid ${isUsed ? theme.border : COLORS_UI.border}`, transition: 'all 0.15s' }}>
                  {KEYWORD_LABELS[kw] ?? kw}
                  {isUsed && ' ✓'}
                </span>
              );
            })}
          </div>
          <div style={{ marginTop: SPACING[2], display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
            {['activa', 'pasiva', 'alRobarse', 'alDescartarse'].map(cat => {
              const list = color?.keywords?.[cat] ?? [];
              if (list.length === 0) return null;
              return (
                <div key={cat} style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.textMuted }}>
                  <span style={{ color: COLORS_UI.textSecondary }}>{cat}: </span>
                  {list.map(k => KEYWORD_LABELS[k] ?? k).join(', ')}
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Botón guardar fijo abajo */}
      <div style={{ position: 'sticky', bottom: 0, background: COLORS_UI.bg, padding: `${SPACING[3]} ${SPACING[4]}`, borderTop: `1px solid ${COLORS_UI.border}` }}>
        <motion.button whileTap={{ scale: 0.97 }} disabled={!canSave} onClick={handleSave}
          style={{ width: '100%', padding: `${SPACING[3]} 0`, background: canSave ? theme.border : COLORS_UI.bgElevated, border: 'none', borderRadius: BORDERS.radius.xl, color: canSave ? 'white' : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, cursor: canSave ? 'pointer' : 'default', boxShadow: canSave ? `0 4px 16px ${theme.glow}` : 'none', transition: 'all 0.15s' }}>
          {saved ? '✓ GUARDADO (+1pt)' : `CONFIRMAR PERSONAJE${canSave ? ' (+1pt)' : ' (necesitas nombre)'}`}
        </motion.button>
      </div>
    </div>
  );
}
