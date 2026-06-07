import { motion } from 'framer-motion';
import useStore from '../../../store/index.js';
import { ECO_LIBRARY, getRandomEcos } from '../../../data/ecoLibrary.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../../styles/tokens.js';
import { useState, useMemo } from 'react';

const RARITY_COLORS = { normal: '#aaa', infrecuente: '#4A90D9', raro: '#FFD700' };

export default function MerchantScreen() {
  const setScreen   = useStore(s => s.setScreen);
  const run         = useStore(s => s.run);
  const updateRun   = useStore(s => s.updateRun);

  const lereles    = run?.lereles ?? 0;
  const activeEcos = run?.activeEcos ?? [];

  const [shopEcos]  = useState(() => getRandomEcos('normal', 3).map(e => ({ ...e, price: 3 + Math.floor(Math.random() * 4) })));
  const [rareEco]   = useState(() => ({ ...getRandomEcos('raro', 1)[0], price: 6 }));
  const [bought, setBought] = useState(new Set());
  const [log, setLog]       = useState('');

  const buy = (eco, price) => {
    if (lereles < price || bought.has(eco.id)) return;
    if (activeEcos.length >= 10) { setLog('Tienes 10 Ecos, descarta uno primero.'); return; }
    updateRun({ lereles: lereles - price, activeEcos: [...activeEcos, eco.id] });
    setBought(prev => new Set([...prev, eco.id]));
    setLog(`✅ ${eco.name} añadido por ${price}L.`);
  };

  const sell = (ecoId) => {
    const eco = ECO_LIBRARY[ecoId];
    if (!eco) return;
    updateRun({ activeEcos: activeEcos.filter(id => id !== ecoId), lereles: lereles + 2 });
    setLog(`🗑️ ${eco.name} vendido por 2L.`);
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS_UI.bg, display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto', padding: SPACING[4], gap: SPACING[3] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text }}>🛒 MERCADER</div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700', background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.md, padding: `${SPACING[1]} ${SPACING[2]}` }}>⭐ {lereles}L</div>
      </div>

      {log && <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textSecondary, background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.sm, padding: SPACING[2] }}>{log}</div>}

      {/* Ecos normales */}
      <div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginBottom: SPACING[1] }}>ECOS DISPONIBLES</div>
        {[...shopEcos, rareEco].filter(Boolean).map(eco => (
          <div key={eco.id} style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], background: COLORS_UI.bgCard, border: `1px solid ${RARITY_COLORS[eco.rarity] ?? '#aaa'}33`, borderRadius: BORDERS.radius.md, padding: SPACING[2], marginBottom: SPACING[1] }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>{eco.name}</div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted }}>{eco.desc}</div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={bought.has(eco.id) || lereles < eco.price}
              onClick={() => buy(eco, eco.price)}
              style={{ padding: `${SPACING[1]} ${SPACING[2]}`, background: bought.has(eco.id) ? COLORS_UI.bgElevated : COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.sm, color: bought.has(eco.id) ? COLORS_UI.textMuted : 'white', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, cursor: bought.has(eco.id) || lereles < eco.price ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
            >
              {bought.has(eco.id) ? '✓' : `${eco.price}L`}
            </motion.button>
          </div>
        ))}
      </div>

      {/* Ecos activos (vender) */}
      {activeEcos.length > 0 && (
        <div>
          <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.textSecondary, marginBottom: SPACING[1] }}>TUS ECOS (vender por 2L)</div>
          <div style={{ display: 'flex', gap: SPACING[1], flexWrap: 'wrap' }}>
            {activeEcos.map(ecoId => {
              const eco = ECO_LIBRARY[ecoId];
              if (!eco) return null;
              return (
                <motion.button key={ecoId} whileTap={{ scale: 0.95 }} onClick={() => sell(ecoId)}
                  style={{ padding: `${SPACING[1]} ${SPACING[2]}`, background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.sm, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, cursor: 'pointer' }}>
                  {eco.name} (-2L)
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScreen('map')}
        style={{ marginTop: 'auto', width: '100%', padding: `${SPACING[3]} 0`, background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
        Salir del mercader →
      </motion.button>
    </div>
  );
}
