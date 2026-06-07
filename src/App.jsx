import { AnimatePresence } from 'framer-motion';
import useStore from './store/index.js';
import AchievementToast from './components/ui/AchievementToast.jsx';

// Auth
import LoginScreen            from './components/screens/LoginScreen.jsx';
import MainMenuScreen         from './components/screens/MainMenuScreen.jsx';
// Adventure
import SetSelectionScreen     from './components/screens/adventure/SetSelectionScreen.jsx';
import LeaderSelectionScreen  from './components/screens/adventure/LeaderSelectionScreen.jsx';
import DeckReviewScreen       from './components/screens/adventure/DeckReviewScreen.jsx';
import MapScreen              from './components/screens/adventure/MapScreen.jsx';
import CombatScreen           from './components/screens/adventure/CombatScreen.jsx';
import RewardScreen           from './components/screens/adventure/RewardScreen.jsx';
import EcoSelectionScreen     from './components/screens/adventure/EcoSelectionScreen.jsx';
import MerchantScreen         from './components/screens/adventure/MerchantScreen.jsx';
import RunEndScreen           from './components/screens/adventure/RunEndScreen.jsx';
// Collection
import CollectionMenu         from './components/screens/collection/CollectionMenu.jsx';
import SetsScreen             from './components/screens/collection/SetsScreen.jsx';
import SetEditorScreen        from './components/screens/collection/SetEditorScreen.jsx';
import CharacterEditorScreen  from './components/screens/collection/CharacterEditorScreen.jsx';
import PlaceEditorScreen      from './components/screens/collection/PlaceEditorScreen.jsx';
import EcoEditorScreen        from './components/screens/collection/EcoEditorScreen.jsx';
import AchievementsScreen     from './components/screens/collection/AchievementsScreen.jsx';
import StatsScreen            from './components/screens/collection/StatsScreen.jsx';
import ProfileScreen          from './components/screens/collection/ProfileScreen.jsx';
// Dev
import TestScreen             from './components/screens/TestScreen.jsx';

const SCREENS = {
  'login':            LoginScreen,
  'main-menu':        MainMenuScreen,
  'set-selection':    SetSelectionScreen,
  'leader-selection': LeaderSelectionScreen,
  'deck-review':      DeckReviewScreen,
  'map':              MapScreen,
  'combat':           CombatScreen,
  'reward':           RewardScreen,
  'eco-selection':    EcoSelectionScreen,
  'merchant':         MerchantScreen,
  'run-end':          RunEndScreen,
  'collection-menu':  CollectionMenu,
  'sets':             SetsScreen,
  'set-editor':       SetEditorScreen,
  'char-editor':      CharacterEditorScreen,
  'place-editor':     PlaceEditorScreen,
  'eco-editor':       EcoEditorScreen,
  'achievements':     AchievementsScreen,
  'stats':            StatsScreen,
  'profile':          ProfileScreen,
  'test':             TestScreen,
};

export default function App() {
  const screen = useStore(s => s.screen);
  const Screen = SCREENS[screen] ?? MainMenuScreen;

  return (
    <>
      <Screen />
      <AchievementToast />
    </>
  );
}
