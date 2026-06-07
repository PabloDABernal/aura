import { useState } from 'react';
import TimingChallenge from '../vibra/TimingChallenge';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../styles/tokens';

// attribute es el atributo del personaje. halfMargin = Math.floor(attribute/2).
// Defaults de reveal: segundosUntil:0, centesimasUntil:4, separatorsFrom:5, markFrom:9, hideMark:true
const PRESETS = [
  {
    label: '① Estándar (ctms@0s, sep@5s, attr 8 → ±4)',
    desc:  'Flujo normal: centésimas desde el inicio, separadores a los 5s',
    props: {
      mode: 'centesimas', target: 78, attribute: 8, marginSide: 'both',
      pifiaMargin: 20, baseDamage: 5, timeLimit: 10,
      actionLabel: 'CONFRONTAR', actionContext: 'Luffy vs Corrupto Zoro',
      // reveal por defecto: segundosUntil:0, separatorsFrom:5, markFrom:9
    },
  },
  {
    label: '② attribute 4 (margen ±2)',
    desc:  'Presencia baja: ventana muy estrecha',
    props: {
      mode: 'centesimas', target: 55, attribute: 4, marginSide: 'both',
      pifiaMargin: 20, baseDamage: 3, timeLimit: 10,
      actionLabel: 'CONFRONTAR', actionContext: 'Invitado débil — attr 4',
    },
  },
  {
    label: '③ hideSeparators (barra siempre limpia)',
    desc:  'Modificador rival: sin separadores nunca',
    props: {
      mode: 'centesimas', target: 42, attribute: 8, marginSide: 'both',
      pifiaMargin: 20, baseDamage: 5, timeLimit: 10,
      actionLabel: 'CONFRONTAR', actionContext: 'Corrupto: sin separadores',
      reveal: { hideSeparators: true },
    },
  },
  {
    label: '④ soloBar (sep en últimos 3s)',
    desc:  'Solo barra — separadores aparecen a los 7s (10-3)',
    props: {
      mode: 'centesimas', target: 33, attribute: 6, marginSide: 'both',
      pifiaMargin: 20, baseDamage: 4, timeLimit: 10,
      actionLabel: 'CONFRONTAR', actionContext: 'Lugar Jefe — solo barra',
      reveal: { soloBar: true },
    },
  },
  {
    label: '⑤ Punto — sin marca (default)',
    desc:  'Intervenir sin habilidad de visión',
    props: {
      mode: 'punto', target: 3500, attribute: 8, marginSide: 'both',
      pifiaMargin: 20, baseDamage: 4, timeLimit: 7,
      actionLabel: 'INTERVENIR', actionContext: 'Nami — sin habilidad de marca',
      showMark: false,
    },
  },
  {
    label: '⑥ Punto — con marca (showMark=true)',
    desc:  'Personaje tiene habilidad de visión activa',
    props: {
      mode: 'punto', target: 3500, attribute: 8, marginSide: 'both',
      pifiaMargin: 20, baseDamage: 4, timeLimit: 7,
      actionLabel: 'INTERVENIR', actionContext: 'Nami — con habilidad de marca',
      showMark: true,
    },
  },
  {
    label: '⑦ hideCentesimas (décimas siempre)',
    desc:  'Modificador rival: sin centésimas nunca',
    props: {
      mode: 'centesimas', target: 65, attribute: 8, marginSide: 'both',
      pifiaMargin: 20, baseDamage: 5, timeLimit: 10,
      actionLabel: 'CONFRONTAR', actionContext: 'Corrupto: sin centésimas',
      reveal: { hideCentesimas: true },
    },
  },
  {
    label: '⑧ marginSide before + attr 8',
    desc:  'Ventana solo antes del objetivo (8 ctms completas)',
    props: {
      mode: 'centesimas', target: 50, attribute: 8, marginSide: 'before',
      pifiaMargin: 20, baseDamage: 5, timeLimit: 10,
      actionLabel: 'CONFRONTAR', actionContext: 'Test: margen solo antes',
    },
  },
];

const RESULT_COLOR = {
  flow:    '#FFD700',
  vibra:   '#3BA84F',
  fail:    '#E0823B',
  pifia:   '#E03B3B',
  timeout: '#AA3333',
};

export default function TestScreen() {
  const [active,     setActive]     = useState(false);
  const [idx,        setIdx]        = useState(0);
  const [lastResult, setLastResult] = useState(null);

  const preset = PRESETS[idx];

  const handleResult = (result) => {
    console.log('[TimingChallenge result]', result);
    setLastResult(result);
    setActive(false);
  };

  return (
    <div style={{
      minHeight:      '100vh',
      background:     COLORS_UI.bg,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      padding:        `${SPACING[5]} ${SPACING[4]}`,
      gap:            SPACING[3],
    }}>
      {/* título */}
      <div style={{
        fontFamily:    TYPOGRAPHY.fontFamily,
        fontSize:      TYPOGRAPHY.size.xl,
        fontWeight:    TYPOGRAPHY.weight.black,
        color:         COLORS_UI.text,
        letterSpacing: '0.08em',
        textAlign:     'center',
      }}>
        TimingChallenge — Test
      </div>

      {/* último resultado */}
      {lastResult && (
        <div style={{
          padding:      `${SPACING[2]} ${SPACING[3]}`,
          background:   COLORS_UI.bgCard,
          borderRadius: BORDERS.radius.lg,
          border:       `1px solid ${RESULT_COLOR[lastResult.result]}44`,
          width:        '100%',
          maxWidth:     '400px',
          display:      'flex',
          gap:          SPACING[3],
          alignItems:   'center',
        }}>
          <div style={{
            fontFamily:  TYPOGRAPHY.fontFamilyMono,
            fontSize:    TYPOGRAPHY.size.lg,
            fontWeight:  TYPOGRAPHY.weight.black,
            color:       RESULT_COLOR[lastResult.result],
            minWidth:    '80px',
          }}>
            {lastResult.result.toUpperCase()}
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary }}>
            x{lastResult.multiplier}  +{lastResult.bonusTiempo}bono  ={lastResult.finalValue}
            {lastResult.timeSpent ? `  @${(lastResult.timeSpent / 1000).toFixed(2)}s` : ''}
          </div>
        </div>
      )}

      {/* lista de presets */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           SPACING[2],
        width:         '100%',
        maxWidth:      '400px',
      }}>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            style={{
              padding:      `${SPACING[2]} ${SPACING[3]}`,
              background:   i === idx ? '#1A2E1A' : COLORS_UI.bgCard,
              border:       `1px solid ${i === idx ? COLORS_GAME.verde : COLORS_UI.border}`,
              borderRadius: BORDERS.radius.md,
              color:        i === idx ? COLORS_GAME.verde : COLORS_UI.text,
              fontFamily:   TYPOGRAPHY.fontFamily,
              fontSize:     TYPOGRAPHY.size.sm,
              fontWeight:   i === idx ? TYPOGRAPHY.weight.bold : TYPOGRAPHY.weight.regular,
              cursor:       'pointer',
              textAlign:    'left',
            }}
          >
            <div>{p.label}</div>
            <div style={{ fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: '2px' }}>{p.desc}</div>
          </button>
        ))}
      </div>

      {/* botón principal */}
      <button
        onClick={() => setActive(true)}
        style={{
          padding:      `${SPACING[4]} ${SPACING[8]}`,
          background:   COLORS_GAME.rojo,
          border:       'none',
          borderRadius: BORDERS.radius.xl,
          color:        'white',
          fontFamily:   TYPOGRAPHY.fontFamily,
          fontSize:     TYPOGRAPHY.size.lg,
          fontWeight:   TYPOGRAPHY.weight.black,
          letterSpacing:'0.1em',
          cursor:       'pointer',
          boxShadow:    `0 6px 24px ${COLORS_GAME.rojo}66`,
          width:        '100%',
          maxWidth:     '400px',
        }}
      >
        LANZAR VIBRA
      </button>

      {/* info del preset activo */}
      <div style={{
        fontFamily: TYPOGRAPHY.fontFamilyMono,
        fontSize:   TYPOGRAPHY.size.xs,
        color:      COLORS_UI.textMuted,
        textAlign:  'center',
        maxWidth:   '400px',
        wordBreak:  'break-all',
      }}>
        target:{preset.props.target} attr:{preset.props.attribute}
        (+/-{Math.floor(preset.props.attribute / 2)})
        {' '}pifia:{preset.props.pifiaMargin} mode:{preset.props.mode}
        {preset.props.marginSide !== 'both' ? ` side:${preset.props.marginSide}` : ''}
        {preset.props.showMark ? ' showMark:true' : ''}
      </div>

      {/* componente */}
      {active && (
        <TimingChallenge
          {...preset.props}
          onResult={handleResult}
        />
      )}
    </div>
  );
}
