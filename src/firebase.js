import { initializeApp }  from 'firebase/app';
import { getAuth }        from 'firebase/auth';
import { getFirestore }   from 'firebase/firestore';

const {
  VITE_FIREBASE_API_KEY:               apiKey,
  VITE_FIREBASE_AUTH_DOMAIN:           authDomain,
  VITE_FIREBASE_PROJECT_ID:            projectId,
  VITE_FIREBASE_STORAGE_BUCKET:        storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID:   messagingSenderId,
  VITE_FIREBASE_APP_ID:                firebaseAppId,
} = import.meta.env;

const allPresent = [apiKey, authDomain, projectId, storageBucket, messagingSenderId, firebaseAppId]
  .every(Boolean);

let auth = null;
let db   = null;

if (allPresent) {
  const app = initializeApp({
    apiKey, authDomain, projectId,
    storageBucket, messagingSenderId,
    appId: firebaseAppId,
  });
  auth = getAuth(app);
  db   = getFirestore(app);
} else {
  console.warn('[Firebase] Variables de entorno incompletas — modo offline activado.');
}

export { auth, db };
