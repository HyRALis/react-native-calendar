import type { FirebaseOptions } from 'firebase/app';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

// Babel replaces @env imports with public configuration at build time.
// Keep actual values in .env; see .env.example for the required variable names.
export const firebaseConfig: FirebaseOptions = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

export function isFirebaseConfigured(config: FirebaseOptions): boolean {
  return (['apiKey', 'authDomain', 'projectId', 'appId'] as const).every(
    key => typeof config[key] === 'string' && config[key].trim().length > 0,
  );
}
