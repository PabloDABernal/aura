/**
 * RunResultScreen — resultados de la run usando lastRunResult del store.
 * GDD v3.0 Sección 3.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/index.js';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

export default function RunResultScreen() {
  const { lastRunResult, characters, setScreen } = useStore();

  const handleHome = () => setScreen('home');

  // Leer personaje actual (ya actualizado con el nuevo grado)
  const char = lastRunResult ? characters[lastRunResult.characterId] : null;

  // Crystallization overlay: shown first time a character reaches grade 10
  const [showCrystal, setShowCrystal] = useState(false);
  useEffect(() => {
    if (!lastRunResult) return;
    if (lastRunResult.gradeUp && lastRunResult.newGrade === 10) {
      setShowCrystal(true);
    }
  }, []); // eslint-disable-line

  if (!lastRunResult) {
    return (
      <div style={{ minHeight: '100dvh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[4], padding: SPACING[6] }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, color: COLORS_UI.textSecondary }}>
          Sincronización terminada
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleHome}
          style={{ padding: `${SPACING[3]} ${SPACING[6]}`, background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.bold, color: 'white', cursor: 'pointer' }}>
          Volver
        </motion.button>
      </div>
    );
  }

  const isPass              = lastRunResult.result === 'completed';
  const gradeUp             = lastRunResult.gradeUp;
  const newGrade            = lastRunResult.newGrade;
  const wasInfinite         = lastRunResult.wasInfinite ?? false;
  const infiniteScore       = lastRunResult.infiniteScore ?? 0;
  const isNewInfiniteRecord = lastRunResult.isNewInfiniteRecord ?? false;
  const isPerfectSync       = lastRunResult.isPerfectSync ?? false;
  const isDirectInfinite    = lastRunResult.isDirectInfinite ?? false;
  const syncTime            = lastRunResult.syncTime ?? null;
  const isNewSyncRecord     = lastRunResult.isNewSyncRecord ?? false;

  return (
    <div style={{
      minHeight: '100dvh', background: COLORS_UI.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: SPACING[6], gap: SPACING[5], maxWidth: '460px', margin: '0 auto', textAlign: 'center',
    }}>

      {/* Avatar */}
      {char?.image ? (
        <img src={char.image} alt={char.name} style={{ width: '96px', height: '96px', borderRadius: BORDERS.radius.xl, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '96px', height: '96px', borderRadius: BORDERS.radius.xl, background: `linear-gradient(135deg, ${COLORS_UI.bgElevated}, #1A1A2E)`, border: `1px solid ${COLORS_UI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.textSecondary }}>
          {(lastRunResult.characterName ?? '?').slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Resultado principal */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], alignItems: 'center' }}
      >
        <div style={{ fontSize: '48px', lineHeight: 1 }}>
          {isPerfectSync && isPass ? '✦' : isDirectInfinite ? '∞' : isPass ? '✅' : '❌'}
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: isPerfectSync && isPass ? '#FFD700' : isDirectInfinite ? '#FFD700' : isPass ? '#3BA84F' : COLORS_GAME.rojo, letterSpacing: '0.1em' }}>
          {isPerfectSync
            ? (isPass ? 'SINCRONÍA PERFECTA' : 'SINCRONIZACIÓN FALLIDA')
            : isDirectInfinite
              ? 'MODO INFINITO'
              : (isPass ? 'SINCRONIZACIÓN COMPLETA' : 'SINCRONIZACIÓN INTERRUMPIDA')}
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted }}>
          {lastRunResult.characterName}
          {char?.stats?.hasCrown && <span style={{ marginLeft: SPACING[2] }}>👑</span>}
        </div>
      </motion.div>

      {/* Infinite score (when applicable) */}
      {wasInfinite && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING[2] }}>
          <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[6]}`, textAlign: 'center' }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['3xl'], fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', lineHeight: 1 }}>
              ∞ {infiniteScore}
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: 'rgba(255,215,0,0.6)', letterSpacing: '0.1em', marginTop: '4px' }}>
              PRUEBAS INFINITAS
            </div>
          </div>
          {isNewInfiniteRecord && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.4 }}
              style={{ background: 'rgba(255,215,0,0.15)', border: '1.5px solid #FFD700', borderRadius: BORDERS.radius.lg, padding: `${SPACING[1]} ${SPACING[4]}`, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', letterSpacing: '0.1em' }}>
              🏆 NUEVO RÉCORD
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Perfect sync time */}
      {isPerfectSync && isPass && syncTime !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING[2] }}>
          <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: BORDERS.radius.xl, padding: `${SPACING[3]} ${SPACING[6]}`, textAlign: 'center' }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['3xl'], fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', lineHeight: 1 }}>
              {(syncTime / 1000).toFixed(2)}s
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: 'rgba(255,215,0,0.6)', letterSpacing: '0.1em', marginTop: '4px' }}>
              TIEMPO TOTAL · +{(10 * 10) * 3} L
            </div>
          </div>
          {isNewSyncRecord && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.4 }}
              style={{ background: 'rgba(255,215,0,0.15)', border: '1.5px solid #FFD700', borderRadius: BORDERS.radius.lg, padding: `${SPACING[1]} ${SPACING[4]}`, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', letterSpacing: '0.1em' }}>
              ✦ NUEVO RÉCORD
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: SPACING[3], justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'PRUEBAS', value: `${lastRunResult.probesPassed}/${lastRunResult.totalProbes}`, color: COLORS_UI.text },
          { label: 'CONCENTRACIÓN', value: `${lastRunResult.livesRemaining}`, color: lastRunResult.livesRemaining > 0 ? COLORS_GAME.verde : COLORS_GAME.rojo },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, padding: `${SPACING[3]} ${SPACING[4]}`, display: 'flex', flexDirection: 'column', gap: SPACING[1], alignItems: 'center', minWidth: '90px' }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color }}>
              {value}
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.06em' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Grado actualizado — hidden for direct infinite and perfect sync */}
      {!isDirectInfinite && !isPerfectSync && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], alignItems: 'center' }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: newGrade >= 8 ? '#FFD700' : newGrade >= 4 ? '#60A5FA' : COLORS_UI.text, letterSpacing: '0.08em' }}>
            GRADO DE SINCRONÍA {newGrade}
          </div>
          {gradeUp && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: '#60A5FA', fontWeight: TYPOGRAPHY.weight.bold, letterSpacing: '0.06em' }}
            >
              ↑ ASCENDIDO AL GRADO {newGrade}
            </motion.div>
          )}
        </div>
      )}

      {/* Lore narrative sentence */}
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.5, maxWidth: '280px' }}>
        {isPass
          ? `Sincronización completa. ${lastRunResult.characterName} asciende al Grado ${newGrade}.`
          : `La sincronización se ha roto. ${lastRunResult.characterName} conserva el Grado ${newGrade ?? lastRunResult.prevGrade}.${lastRunResult.probesPassed > 0 ? ` Pruebas superadas: ${lastRunResult.probesPassed}/${lastRunResult.totalProbes}.` : ''}`}
        {lastRunResult.mercyRun ? ' El tiempo fue clemente esta vez.' : ''}
      </div>

      {/* Aura */}
      {lastRunResult.auraTriggered && (
        <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: BORDERS.radius.lg, padding: `${SPACING[2]} ${SPACING[4]}` }}>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: '#FFD700' }}>
            ✦ Resonancia Plena — Frecuencia {String(char?.auraNumber ?? 0).padStart(2, '0')} activada
          </span>
        </div>
      )}

      {/* Cristalización overlay (grade 10 first time) */}
      <AnimatePresence>
        {showCrystal && (
          <motion.div
            key="crystal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCrystal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(4,4,7,0.97)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACING[5], padding: SPACING[8], cursor: 'pointer', textAlign: 'center' }}
          >
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }}>
              <div style={{ fontSize: '64px', lineHeight: 1, filter: 'drop-shadow(0 0 32px #FFD70099)' }}>✦</div>
            </motion.div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size['2xl'], fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700', letterSpacing: '0.1em', textShadow: '0 0 30px #FFD70066' }}>
              CRISTALIZACIÓN
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, color: 'rgba(255,215,0,0.85)', lineHeight: 1.6, maxWidth: '300px' }}>
              Sincronía Perfecta alcanzada.<br />
              <span style={{ fontWeight: TYPOGRAPHY.weight.bold }}>{lastRunResult.characterName}</span> ha cristalizado.<br />
              Su resonancia es tuya para siempre.
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: 'rgba(255,215,0,0.3)', letterSpacing: '0.1em', marginTop: SPACING[2] }}>
              toca para continuar
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón volver */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleHome}
        style={{ width: '100%', maxWidth: '300px', minHeight: '56px', background: COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: 'white', letterSpacing: '0.14em', cursor: 'pointer', boxShadow: `0 4px 24px ${COLORS_GAME.verde}60` }}
      >
        VOLVER
      </motion.button>
    </div>
  );
}
