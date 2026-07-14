import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

const SYNC_FIELDS = [
  'characters', 'usedAuraNumbers', 'usedAbilityCombos',
  'completedAuraRanges', 'lereles', 'auraFragments', 'extraEcoSlots', 'meta',
];

export async function pushToFirestore(uid, state) {
  if (!db || !uid) return;
  try {
    const ref     = doc(db, 'users', uid, 'data', 'progress');
    const payload = Object.fromEntries(SYNC_FIELDS.map(k => [k, state[k] ?? null]));
    payload.lastUpdated = Date.now();
    await setDoc(ref, payload, { merge: true });
  } catch (err) {
    console.error('[Sync] push failed:', err);
    throw err;
  }
}

export async function pullFromFirestore(uid) {
  if (!db || !uid) return null;
  try {
    const ref  = doc(db, 'users', uid, 'data', 'progress');
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error('[Sync] pull failed:', err);
    return null;
  }
}
