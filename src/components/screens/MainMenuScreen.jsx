import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/index.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../styles/tokens.js';

const BTN_COLORS = {
  'collection-menu': COLORS_GAME.morado,
  'profile':         COLORS_GAME.verde,
  'stats':           COLORS_GAME.naranja,
  'achievements':    '#FFD700',
};

export default function MainMenuScreen() {
  const setScreen = useStore(s => s.setScreen);
  const run       = useStore(s => s.run);
  const setRun    = useStore(s => s.setRun);

  const [confirmAbandon, setConfirmAbandon] = useState(false);

  const hasActiveRun  = run?.active;
  const areaNum       = (run?.currentAreaIndex ?? 0) + 1;
  const totalAreas    = run?.areas?.length ?? 0;
  const currentArea   = run?.areas?.[run?.currentAreaIndex ?? 0];
  const nodeNum       = (currentArea?.currentNodeIndex ?? 0) + 1;
  const totalNodes    = currentArea?.nodes?.length ?? 0;

  const handleAbandon = () => {
    setRun(null);
    setConfirmAbandon(false);
  };

  const SECONDARY_BUTTONS = [
    { label: 'COLECCIÓN / EDITOR', icon: '📦', screen: 'collection-menu' },
    { label: 'PERFIL',             icon: '👤', screen: 'profile' },
    { label: 'ESTADÍSTICAS',       icon: '📊', screen: 'stats' },
    { label: 'LOGROS',             icon: '🏆', screen: 'achievements' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #06060A 0%, #0D0018 60%, #130020 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: SPACING[6], gap: SPACING[4],
      maxWidth: 460, margin: '0 auto',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', bottom: SPACING[3], right: SPACING[3], fontFamily: TYPOGRAPHY.fontFamilyMono ?? TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted, letterSpacing: '0.1em' }}>
        v0.1.0
      </div>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: SPACING[2] }}>
        <motion.div
          animate={{ textShadow: ['0 0 20px #FFD70088', '0 0 40px #FFD700cc', '0 0 20px #FFD70088'] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ fontSize: 64, lineHeight: 1 }}
        >
          ⚡
        </motion.div>
        <div style={{
          fontFamily:   TYPOGRAPHY.fontFamily,
          fontSize:     'clamp(52px,13vw,80px)',
          fontWeight:   TYPOGRAPHY.weight.black,
          color:        '#FFD700',
          letterSpacing:'0.18em',
          marginTop:    SPACING[2],
          textShadow:   '0 0 32px #FFD70055, 0 2px 0 #88600055',
          lineHeight:   1,
        }}>
          AURA
        </div>
        <div style={{
          fontFamily:   TYPOGRAPHY.fontFamily,
          fontSize:     TYPOGRAPHY.size.sm,
          color:        COLORS_GAME.morado,
          letterSpacing:'0.25em',
          marginTop:    SPACING[2],
          fontWeight:   TYPOGRAPHY.weight.bold,
        }}>
          EL JUEGO DEL COLECCIONISTA
        </div>
      </div>

      {/* Run activa info */}
      {hasActiveRun && (
        <div style={{
          background:   COLORS_UI.bgCard,
          border:       `1px solid ${COLORS_GAME.verde}44`,
          borderRadius: BORDERS.radius.lg,
          padding:      SPACING[3],
          width:        '100%', maxWidth: 340, textAlign: 'center',
          boxShadow:    `0 0 16px ${COLORS_GAME.verde}22`,
        }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_GAME.verde, fontWeight: TYPOGRAPHY.weight.bold }}>
            ▶ Área {areaNum}/{totalAreas} · Nodo {nodeNum}/{totalNodes}
          </div>
          {!confirmAbandon ? (
            <button
              onClick={() => setConfirmAbandon(true)}
              style={{ marginTop: SPACING[2], background: 'none', border: `1px solid ${COLORS_UI.danger ?? COLORS_GAME.rojo}`, borderRadius: BORDERS.radius.sm, color: COLORS_UI.danger ?? COLORS_GAME.rojo, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, padding: `${SPACING[1]} ${SPACING[3]}`, cursor: 'pointer' }}
            >
              Abandonar aventura
            </button>
          ) : (
            <div style={{ marginTop: SPACING[2], display: 'flex', gap: SPACING[2], justifyContent: 'center' }}>
              <button onClick={handleAbandon} style={{ background: COLORS_UI.danger ?? COLORS_GAME.rojo, border: 'none', borderRadius: BORDERS.radius.sm, color: 'white', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, padding: `${SPACING[1]} ${SPACING[3]}`, cursor: 'pointer' }}>
                Confirmar
              </button>
              <button onClick={() => setConfirmAbandon(false)} style={{ background: 'none', border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.sm, color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, padding: `${SPACING[1]} ${SPACING[3]}`, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Botones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], width: '100%', maxWidth: 340 }}>

        {/* JUGAR */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => setScreen(hasActiveRun ? 'map' : 'set-selection')}
          style={{
            width:        '100%',
            padding:      `${SPACING[4]} 0`,
            background:   hasActiveRun ? COLORS_GAME.verde : '#FFD700',
            border:       'none',
            borderRadius: BORDERS.radius.xl,
            color:        '#000',
            fontFamily:   TYPOGRAPHY.fontFamily,
            fontSize:     TYPOGRAPHY.size.lg,
            fontWeight:   TYPOGRAPHY.weight.black,
            letterSpacing:'0.08em',
            cursor:       'pointer',
            boxShadow:    hasActiveRun
              ? `0 6px 28px ${COLORS_GAME.verde}66`
              : `0 6px 28px #FFD70066`,
          }}
        >
          {hasActiveRun ? '▶ CONTINUAR AVENTURA' : '⚔ NUEVA AVENTURA'}
        </motion.button>

        {/* Resto */}
        {SECONDARY_BUTTONS.map(btn => {
          const accentColor = BTN_COLORS[btn.screen] ?? COLORS_UI.border;
          return (
            <motion.button
              key={btn.screen}
              whileTap={{ scale: 0.97 }}
              onClick={() => setScreen(btn.screen)}
              style={{
                width:        '100%',
                padding:      `${SPACING[3]} 0`,
                background:   COLORS_UI.bgElevated,
                border:       `1px solid ${accentColor}55`,
                borderRadius: BORDERS.radius.xl,
                color:        COLORS_UI.text,
                fontFamily:   TYPOGRAPHY.fontFamily,
                fontSize:     TYPOGRAPHY.size.md,
                fontWeight:   TYPOGRAPHY.weight.black,
                letterSpacing:'0.05em',
                cursor:       'pointer',
              }}
            >
              {btn.icon} {btn.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
