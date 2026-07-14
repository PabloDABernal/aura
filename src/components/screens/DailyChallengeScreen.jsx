/**
 * DailyChallengeScreen — Desafío Diario. GDD v4.0 §10.3.
 * Una sola vez por día. Personaje sistema grado 10 + condición determinista.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/index.js';
import { getTodayStr, getDailyChar, getDailyCondition } from '../../engine/run/dailyChallenge.js';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';

function getTimeUntilMidnight() {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, Math.floor((next - now) / 1000));
}

function formatCountdown(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const CONDITION_ICONS = {
  standard:      '⚡',
  reduced_lives: '💔',
  tight_margins: '🎯',
  speed_rush:    '⏩',
  iron_will:     '🛡',
};

export default function DailyChallengeScreen() {
  const { setScreen, meta, startDailyRun } = useStore();

  const todayStr      = getTodayStr();
  const dailyChar     = getDailyChar(todayStr);
  const condition     = getDailyCondition(todayStr);
  const dailyState    = meta?.dailyChallengeState ?? null;
  const bestDaily     = meta?.bestDailyResult ?? null;
  const alreadyDone   = dailyState?.date === todayStr;

  const [countdown, setCountdown] = useState(getTimeUntilMidnight);

  useEffect(() => {
    const id = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleStart = () => {
    startDailyRun(dailyChar, condition);
    setScreen('run');
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#0E0E12', display: 'flex', flexDirection: 'column', maxWidth: '460px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: `${SPACING[5]} ${SPACING[4]} ${SPACING[3]}`, borderBottom: `1px solid ${COLORS_UI.border}`, display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
        <motion.button whileTap={{ scale: 0.94 }} onClick={() => setScreen('home')}
          style={{ background: 'transparent', border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[1]} ${SPACING[3]}`, cursor: 'pointer' }}>
          ←
        </motion.button>
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, letterSpacing: '0.06em' }}>
            ☀ Desafío Diario
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
            {todayStr.slice(0,4)}-{todayStr.slice(4,6)}-{todayStr.slice(6,8)}
          </div>
        </div>
        {/* Countdown */}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '9px', color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>NUEVO EN</div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#A78BFA' }}>
            {formatCountdown(countdown)}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: SPACING[4], display: 'flex', flexDirection: 'column', gap: SPACING[5], paddingBottom: '100px' }}>

        {/* Personaje del día */}
        <div style={{ background: COLORS_UI.bgCard, border: '1px solid rgba(255,215,0,0.2)', borderRadius: BORDERS.radius.xl, padding: SPACING[4], display: 'flex', alignItems: 'center', gap: SPACING[4] }}>
          <div style={{ width: '72px', height: '72px', borderRadius: BORDERS.radius.lg, background: 'linear-gradient(135deg,#1A1A2E,#22222E)', border: '2px solid rgba(255,215,0,0.4)', boxShadow: '0 0 20px rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: '#FFD700' }}>
              #{String(dailyChar.auraNumber).padStart(2, '0')}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>
              {dailyChar.name}
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: '#FFD700', marginTop: '2px' }}>
              Grado de Sincronía 10 · ★★★★★
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: '4px' }}>
              Sin habilidades — sincronización pura
            </div>
          </div>
        </div>

        {/* Condición del día */}
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em', marginBottom: SPACING[2] }}>
            CONDICIÓN DE HOY
          </div>
          <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: BORDERS.radius.xl, padding: SPACING[4] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], marginBottom: SPACING[1] }}>
              <span style={{ fontSize: '24px' }}>{CONDITION_ICONS[condition.id] ?? '⚡'}</span>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: '#A78BFA' }}>
                {condition.label}
              </div>
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, lineHeight: 1.5 }}>
              {condition.description}
            </div>
          </div>
        </div>

        {/* Recompensas */}
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em', marginBottom: SPACING[2] }}>
            RECOMPENSAS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
            {[
              { label: 'Completar la sincronización', reward: '+3 ◆ Fragmentos' },
              { label: 'Superar ≥5 pruebas', reward: '+1 ◆ Fragmento' },
            ].map(({ label, reward }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${SPACING[2]} ${SPACING[3]}`, background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg }}>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>{label}</span>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#A78BFA' }}>{reward}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mejor resultado global */}
        {bestDaily && (
          <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, padding: SPACING[3], display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted }}>Mejor resultado</div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700' }}>
              {bestDaily.probesPassed} pruebas · {bestDaily.date.slice(0,4)}-{bestDaily.date.slice(4,6)}-{bestDaily.date.slice(6,8)}
            </div>
          </div>
        )}

        {/* Resultado de hoy (si ya jugado) */}
        {alreadyDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: dailyState.completed ? 'rgba(59,168,79,0.08)' : 'rgba(96,165,250,0.06)', border: `1px solid ${dailyState.completed ? 'rgba(59,168,79,0.3)' : 'rgba(96,165,250,0.2)'}`, borderRadius: BORDERS.radius.xl, padding: SPACING[4], textAlign: 'center' }}>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: dailyState.completed ? '#3BA84F' : '#60A5FA', letterSpacing: '0.06em' }}>
              {dailyState.completed ? '✅ SINCRONIZACIÓN COMPLETA' : `${dailyState.probesPassed}/10 pruebas`}
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted, marginTop: SPACING[1] }}>
              Ya participaste hoy. Vuelve mañana.
            </div>
          </motion.div>
        )}
      </div>

      {/* CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '460px', padding: `${SPACING[3]} ${SPACING[4]}`, background: 'rgba(14,14,18,0.97)', borderTop: `1px solid ${COLORS_UI.border}`, backdropFilter: 'blur(8px)' }}>
        {alreadyDone ? (
          <div style={{ width: '100%', minHeight: '56px', background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS_UI.textMuted }}>
            Desafío completado hoy
          </div>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart}
            style={{ width: '100%', minHeight: '56px', background: 'linear-gradient(135deg, #6D28D9, #A78BFA)', border: 'none', borderRadius: BORDERS.radius.xl, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: 'white', cursor: 'pointer', letterSpacing: '0.1em', boxShadow: '0 4px 24px rgba(167,139,250,0.4)' }}>
            ☀ JUGAR DESAFÍO
          </motion.button>
        )}
      </div>
    </div>
  );
}
