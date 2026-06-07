import { useState, useMemo } from 'react';
import useStore from '../../../store/index.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS } from '../../../styles/tokens.js';

const TABS = ['Global', 'Historial'];

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.md, padding: SPACING[3], display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.black, fontSize: TYPOGRAPHY.size.lg, color: COLORS_UI.text }}>{value}</div>
      <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary }}>{label}</div>
      {sub && <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.textMuted }}>{sub}</div>}
    </div>
  );
}

export default function StatsScreen() {
  const setScreen  = useStore(s => s.setScreen);
  const meta       = useStore(s => s.meta);
  const collection = useStore(s => s.collection);
  const getDataCtx = useStore(s => s.getDataCtx);
  const [tab, setTab] = useState(0);

  const gs      = meta?.globalStats ?? {};
  const history = meta?.runHistory ?? [];

  const { characters: allChars, places: allPlaces } = useMemo(() => getDataCtx(), []);

  const totalRuns  = gs.totalRuns ?? 0;
  const totalWins  = gs.totalWins ?? 0;
  const totalLoses = totalRuns - totalWins;
  const winPct     = totalRuns > 0 ? Math.round((totalWins / totalRuns) * 100) : 0;
  const streak     = meta?.currentWinStreak ?? 0;
  const bestStreak = meta?.bestWinStreak ?? 0;

  // Most used character
  const charUsage = meta?.characterUsage ?? {};
  const [topCharId, topCharCount] = Object.entries(charUsage).sort((a,b) => b[1]-a[1])[0] ?? [null, 0];
  const topCharName = topCharId ? (allChars[topCharId]?.basics?.name ?? topCharId) : '—';

  // Most used eco
  const ecoMastery = meta?.ecoMastery ?? {};
  const [topEcoId, topEcoCount] = Object.entries(ecoMastery).sort((a,b) => b[1]-a[1])[0] ?? [null, 0];
  const topEcoName = topEcoId ?? '—';

  // Most conquered place
  const placeStats = meta?.placeStats ?? {};
  const [topPlaceId, topPlaceCount] = Object.entries(placeStats).sort((a,b) => b[1]-a[1])[0] ?? [null, 0];
  const topPlaceName = topPlaceId ? (allPlaces[topPlaceId]?.name ?? topPlaceId) : '—';

  return (
    <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto', padding: SPACING[4], gap: SPACING[3] }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>📊 ESTADÍSTICAS</div>
        <button onClick={() => setScreen('main-menu')} style={{ background: 'none', border: 'none', color: COLORS_UI.textMuted, cursor: 'pointer', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm }}>← Menú</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: SPACING[1] }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ flex: 1, padding: `${SPACING[1]} 0`, background: tab===i ? COLORS_UI.bgElevated : 'none', border: `1px solid ${tab===i ? COLORS_UI.border : 'transparent'}`, borderRadius: BORDERS.radius.sm, color: tab===i ? COLORS_UI.text : COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
          {/* Runs grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING[2] }}>
            <StatCard label="Runs totales"    value={totalRuns} />
            <StatCard label="Victorias"       value={totalWins} />
            <StatCard label="Derrotas"        value={totalLoses} />
            <StatCard label="% Victoria"      value={`${winPct}%`} />
            <StatCard label="Racha actual"    value={streak}   sub={`Mejor: ${bestStreak}`} />
            <StatCard label="Puntos totales"  value={meta?.collectionPoints ?? 0} sub="Coleccionista" />
          </div>

          {/* Records */}
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, letterSpacing: '0.08em' }}>RÉCORDS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
            {[
              { label: '✨ Flows totales',          value: gs.totalFlows ?? 0 },
              { label: '💥 Pifias totales',          value: gs.totalPifias ?? 0 },
              { label: '⏱️ Tiempo Vibración total',  value: `${Math.floor((gs.totalVibrationTime ?? 0)/60000)}min` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: `${SPACING[2]} ${SPACING[3]}`, background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.md }}>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>{label}</span>
                <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Favoritos */}
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, letterSpacing: '0.08em' }}>FAVORITOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${SPACING[2]} ${SPACING[3]}`, background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.md }}>
              <div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary }}>👤 Personaje más jugado</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>{topCharName}</div>
              </div>
              {topCharCount > 0 && <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted }}>{topCharCount}×</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${SPACING[2]} ${SPACING[3]}`, background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.md }}>
              <div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary }}>🌀 Eco más elegido</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>{topEcoName}</div>
              </div>
              {topEcoCount > 0 && <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted }}>{topEcoCount}×</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${SPACING[2]} ${SPACING[3]}`, background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.md }}>
              <div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary }}>🏰 Lugar más conquistado</div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>{topPlaceName}</div>
              </div>
              {topPlaceCount > 0 && <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textMuted }}>{topPlaceCount}×</span>}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
          {history.length === 0 && (
            <div style={{ textAlign: 'center', color: COLORS_UI.textMuted, fontFamily: TYPOGRAPHY.fontFamily, padding: SPACING[6] }}>
              Sin historial aún. ¡Completa una run!
            </div>
          )}
          {history.map((run, i) => {
            const isWin  = run.result === 'win' || run.victory === 'win';
            const date   = run.date ?? run.endedAt;
            const nodes  = run.nodesCompleted ?? 0;
            const ecos   = run.ecosUsed ?? (run.activeEcos?.length ?? 0);
            return (
              <div key={run.id ?? i} style={{ background: COLORS_UI.bgCard, borderRadius: BORDERS.radius.md, padding: SPACING[3], borderLeft: `3px solid ${isWin ? '#FFD700' : '#E03B3B'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[1] }}>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: isWin ? '#FFD700' : '#E03B3B' }}>
                    {isWin ? '🏆 Victoria' : '💀 Derrota'}
                  </div>
                  <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>
                    {date ? new Date(date).toLocaleDateString('es-ES') : '?'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: SPACING[3], fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary }}>
                  <span>👥 {(run.leaderIds ?? run.selectedLeaderIds ?? []).length} líderes</span>
                  <span>🗺️ {nodes} nodos</span>
                  <span>🌀 {ecos} ecos</span>
                  {(run.totalFlows ?? 0) > 0 && <span>✨ {run.totalFlows} flows</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
