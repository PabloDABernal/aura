/**
 * App — rutas del nuevo sistema cronómetro. GDD v2.1 / Fase I (Firebase Auth).
 */
import { useEffect }            from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged }   from 'firebase/auth';
import { auth as firebaseAuth } from './firebase.js';
import useStore                 from './store/index.js';
import { setMuted }             from './engine/audio/audioEngine.js';
import LoginScreen            from './components/screens/LoginScreen.jsx';
import HomeScreen             from './components/screens/HomeScreen.jsx';
import CharacterCreatorScreen from './components/screens/CharacterCreatorScreen.jsx';
import RunScreen              from './components/screens/RunScreen.jsx';
import RunResultScreen        from './components/screens/RunResultScreen.jsx';
import TestBenchScreen        from './components/screens/TestBenchScreen.jsx';
import AuraCollectionScreen   from './components/screens/AuraCollectionScreen.jsx';
import PracticeScreen         from './components/screens/PracticeScreen.jsx';
import DailyChallengeScreen   from './components/screens/DailyChallengeScreen.jsx';
import PerfectSyncScreen      from './components/screens/PerfectSyncScreen.jsx';
import InfiniteRunScreen      from './components/screens/InfiniteRunScreen.jsx';
import ProbeEditorScreen      from './components/screens/ProbeEditorScreen.jsx';
import IntroScreen            from './components/screens/IntroScreen.jsx';

const SCREENS = {
  'login':              LoginScreen,
  'intro':              IntroScreen,
  'home':               HomeScreen,
  'character-creator':  CharacterCreatorScreen,
  'run':                RunScreen,
  'run-result':         RunResultScreen,
  'test-bench':         TestBenchScreen,
  'aura-collection':    AuraCollectionScreen,
  'practice':           PracticeScreen,
  'daily-challenge':    DailyChallengeScreen,
  'perfect-sync':       PerfectSyncScreen,
  'infinite-run':       InfiniteRunScreen,
  'probe-editor':       ProbeEditorScreen,
};

export default function App() {
  const screen       = useStore(s => s.screen);
  const audioEnabled = useStore(s => s.meta?.audioEnabled ?? true);
  const Screen       = SCREENS[screen] ?? HomeScreen;

  useEffect(() => {
    setMuted(!audioEnabled);
  }, [audioEnabled]);

  // Auth gate: Firebase listener or immediate redirect
  useEffect(() => {
    if (!firebaseAuth) {
      // Firebase no configurado — redirigir a login si no hay sesión local
      const { auth: a, setScreen: nav, meta } = useStore.getState();
      if (!a?.user && !a?.playLocal) nav('login');
      else if (!meta?.hasSeenIntro) nav('intro');
      return;
    }

    const unsub = onAuthStateChanged(firebaseAuth, async (fireUser) => {
      const store = useStore.getState();
      if (fireUser) {
        store.setAuth({
          user: {
            uid:         fireUser.uid,
            displayName: fireUser.displayName,
            email:       fireUser.email,
            isAnonymous: fireUser.isAnonymous,
          },
          playLocal: false,
        });
        // Pull cloud data on Google login
        if (!fireUser.isAnonymous) {
          await useStore.getState().mergeFromCloud();
        }
        if (useStore.getState().screen === 'login') {
          const { meta } = useStore.getState();
          useStore.getState().setScreen(meta?.hasSeenIntro ? 'home' : 'intro');
        }
      } else {
        // No Firebase session — go to login unless in local mode
        if (!store.auth?.playLocal) {
          store.setScreen('login');
        }
      }
    });

    return unsub;
  }, []); // eslint-disable-line

  // Auto-navigate to run screen if active run exists (only when authenticated)
  useEffect(() => {
    const { activeRun, auth: a, setScreen: nav, screen: s } = useStore.getState();
    if (activeRun && (a?.user || a?.playLocal) && s === 'home') nav('run');
  }, []); // eslint-disable-line

  return (
    <div style={{
      background: '#0E0E12',
      minHeight:  '100dvh',
      width:      '100%',
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          style={{ minHeight: '100dvh' }}
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
