/**
 * SettingsScreen — ajustes de la app.
 * GDD v3.0 + D1 (compra de slot de eco extra) + Fase I (Firebase Auth / sync).
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut, linkWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth as firebaseAuth } from '../../firebase.js';
import useStore from '../../store/index.js';
import { COLORS_UI, TYPOGRAPHY, SPACING, BORDERS, COLORS_GAME } from '../../styles/tokens.js';
import { EXTRA_ECO_SLOT_COST } from '../../data/economyConfig.js';

export default function SettingsScreen({ onResetDone }) {
  const {
    resetCollection,
    auraFragments, extraEcoSlots, buyExtraEcoSlot,
    meta, dispatchMeta,
    auth: storedAuth, setAuth, setScreen,
    syncStatus, pushToCloud,
  } = useStore();

  const audioEnabled = meta?.audioEnabled ?? true;
  const toggleAudio  = () => dispatchMeta({ type: 'SET_AUDIO_ENABLED', enabled: !audioEnabled });

  const [confirmReset, setConfirmReset] = useState(false);
  const [slotMsg,      setSlotMsg]      = useState('');
  const [authMsg,      setAuthMsg]      = useState('');

  const user        = storedAuth?.user;
  const isAnonymous = user?.isAnonymous ?? true;
  const hasFirebase = firebaseAuth !== null;

  const handleSignOut = async () => {
    if (firebaseAuth) {
      try { await signOut(firebaseAuth); } catch {}
    }
    setAuth({ user: null, playLocal: false });
    setScreen('login');
  };

  const handleLinkGoogle = async () => {
    if (!firebaseAuth || !firebaseAuth.currentUser) return;
    setAuthMsg('Vinculando...');
    try {
      const provider = new GoogleAuthProvider();
      const result   = await linkWithPopup(firebaseAuth.currentUser, provider);
      const u        = result.user;
      setAuth({
        user: { uid: u.uid, displayName: u.displayName, email: u.email, isAnonymous: false },
        playLocal: false,
      });
      await pushToCloud();
      setAuthMsg('Cuenta vinculada y datos sincronizados ✓');
    } catch (err) {
      setAuthMsg('Error: ' + (err.message ?? 'desconocido'));
    }
    setTimeout(() => setAuthMsg(''), 4000);
  };

  const handleManualSync = async () => {
    setAuthMsg('Sincronizando...');
    try {
      await pushToCloud();
      setAuthMsg('Sincronizado ✓');
    } catch {
      setAuthMsg('Error al sincronizar');
    }
    setTimeout(() => setAuthMsg(''), 3000);
  };

  const syncLabel = syncStatus === 'syncing'  ? 'Sincronizando...'
                  : syncStatus === 'synced'   ? 'Sincronizado'
                  : syncStatus === 'offline'  ? 'Sin conexión'
                  : '—';
  const syncColor = syncStatus === 'synced'   ? '#3BA84F'
                  : syncStatus === 'offline'  ? COLORS_GAME.rojo
                  : COLORS_UI.textMuted;

  const handleConfirmReset = () => {
    resetCollection();
    setConfirmReset(false);
    onResetDone?.();
  };

  const handleBuySlot = () => {
    const ok = buyExtraEcoSlot();
    if (ok) {
      setSlotMsg('Slot comprado. Máximo de ecos: ' + (6 + (extraEcoSlots ?? 0)));
      setTimeout(() => setSlotMsg(''), 2500);
    }
  };

  const canBuySlot = (auraFragments ?? 0) >= EXTRA_ECO_SLOT_COST;

  return (
    <div style={{ padding: SPACING[4] }}>

      {/* Header */}
      <div style={{ marginBottom: SPACING[5] }}>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.black, color: '#F0F0F5', letterSpacing: '0.06em' }}>
          Ajustes
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>

        {/* Cuenta */}
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
          CUENTA
        </div>

        <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, overflow: 'hidden' }}>
          <div style={{ padding: SPACING[4], display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
            {/* Usuario */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACING[3] }}>
              <div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>
                  {user ? (isAnonymous ? 'Anónimo' : (user.displayName ?? user.email ?? user.uid)) : 'Sin sesión'}
                </div>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: '2px' }}>
                  {!user && storedAuth?.playLocal ? 'Modo local' : user?.email ? user.email : isAnonymous ? 'Sin cuenta de Google' : ''}
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleSignOut}
                style={{ background: 'rgba(224,59,59,0.12)', border: '1px solid rgba(224,59,59,0.35)', borderRadius: BORDERS.radius.lg, color: '#E03B3B', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, padding: `${SPACING[2]} ${SPACING[3]}`, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Cerrar sesión
              </motion.button>
            </div>

            {/* Sync status + botón */}
            {user && !isAnonymous && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACING[3] }}>
                <div style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, color: syncColor }}>
                  {syncLabel}
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleManualSync}
                  style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, padding: `${SPACING[1]} ${SPACING[3]}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Sincronizar ahora
                </motion.button>
              </div>
            )}

            {/* Vincular Google si anónimo */}
            {user && isAnonymous && hasFirebase && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleLinkGoogle}
                style={{ width: '100%', padding: `${SPACING[2]} 0`, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: BORDERS.radius.lg, color: '#60A5FA', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer', letterSpacing: '0.04em' }}>
                🔗 Vincular cuenta de Google
              </motion.button>
            )}

            {authMsg && (
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: authMsg.startsWith('Error') ? COLORS_GAME.rojo : '#3BA84F', textAlign: 'center' }}>
                {authMsg}
              </div>
            )}
          </div>
        </div>

        {/* Audio */}
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
          AUDIO
        </div>
        <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, padding: SPACING[4], display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACING[3] }}>
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>
              Sonidos
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: '2px' }}>
              Efectos y drone ambiental
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={toggleAudio}
            style={{ padding: `${SPACING[2]} ${SPACING[4]}`, background: audioEnabled ? 'rgba(59,168,79,0.15)' : COLORS_UI.bgElevated, border: `1px solid ${audioEnabled ? 'rgba(59,168,79,0.5)' : COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: audioEnabled ? '#3BA84F' : COLORS_UI.textMuted, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {audioEnabled ? '🔊 Activo' : '🔇 Mudo'}
          </motion.button>
        </div>

        {/* Economía */}
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em' }}>
          ECONOMÍA
        </div>

        <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, overflow: 'hidden' }}>
          <div style={{ padding: SPACING[4], display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACING[3] }}>
            <div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>
                Slot de Eco extra
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: '2px' }}>
                Máx actual: {5 + (extraEcoSlots ?? 0)} · Coste: {EXTRA_ECO_SLOT_COST} ◆
              </div>
              {slotMsg && (
                <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: '#60A5FA', marginTop: '4px' }}>
                  {slotMsg}
                </div>
              )}
            </div>
            <motion.button
              whileTap={canBuySlot ? { scale: 0.96 } : {}}
              onClick={canBuySlot ? handleBuySlot : undefined}
              disabled={!canBuySlot}
              style={{
                background:   canBuySlot ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                border:       `1px solid ${canBuySlot ? 'rgba(167,139,250,0.4)' : COLORS_UI.border}`,
                borderRadius: BORDERS.radius.lg,
                color:        canBuySlot ? '#A78BFA' : COLORS_UI.textMuted,
                fontFamily:   TYPOGRAPHY.fontFamily,
                fontSize:     TYPOGRAPHY.size.sm,
                fontWeight:   TYPOGRAPHY.weight.bold,
                padding:      `${SPACING[2]} ${SPACING[3]}`,
                cursor:       canBuySlot ? 'pointer' : 'not-allowed',
                whiteSpace:   'nowrap',
                flexShrink:   0,
              }}
            >
              Comprar {EXTRA_ECO_SLOT_COST}◆
            </motion.button>
          </div>
        </div>

        {/* Colección */}
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, letterSpacing: '0.08em', marginTop: SPACING[2] }}>
          COLECCIÓN
        </div>

        <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, overflow: 'hidden' }}>
          <div style={{ padding: SPACING[4], display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACING[3] }}>
            <div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text }}>
                Resetear colección
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xs, color: COLORS_UI.textMuted, marginTop: '2px' }}>
                Eliminar todos los personajes
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setConfirmReset(true)}
              style={{ background: 'rgba(224,59,59,0.12)', border: '1px solid rgba(224,59,59,0.35)', borderRadius: BORDERS.radius.lg, color: '#E03B3B', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, padding: `${SPACING[2]} ${SPACING[3]}`, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Resetear
            </motion.button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmReset && (
          <motion.div key="reset-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmReset(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: SPACING[4] }}>
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
              style={{ background: COLORS_UI.bgElevated, borderRadius: BORDERS.radius.xl, padding: SPACING[5], maxWidth: '340px', width: '100%', display: 'flex', flexDirection: 'column', gap: SPACING[4], border: '1px solid rgba(224,59,59,0.3)' }}>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.black, color: COLORS_UI.text, textAlign: 'center' }}>
                ¿Borrar toda la colección?
              </div>
              <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary, textAlign: 'center', lineHeight: 1.5 }}>
                ¿Borrar todos los personajes y empezar de cero? Esta acción no se puede deshacer.
              </div>
              <div style={{ display: 'flex', gap: SPACING[2] }}>
                <button onClick={() => setConfirmReset(false)}
                  style={{ flex: 1, minHeight: '48px', background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.lg, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleConfirmReset}
                  style={{ flex: 1, minHeight: '48px', background: 'rgba(224,59,59,0.2)', border: '1px solid rgba(224,59,59,0.5)', borderRadius: BORDERS.radius.lg, color: '#E03B3B', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, fontWeight: TYPOGRAPHY.weight.bold, cursor: 'pointer' }}>
                  Borrar todo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
