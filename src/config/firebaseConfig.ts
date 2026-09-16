import type { FirebaseOptions } from 'firebase/app';

// Firebase Console > Project settings > Your apps > Web app configuration.
// These are public app identifiers, never service-account credentials.
export const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyCpuNQJ8AR0ZhdAsmd2ZuWMscLRiIxfhCI',
  authDomain: 'react-native-calendar-d0d40.firebaseapp.com',
  projectId: 'react-native-calendar-d0d40',
  storageBucket: 'react-native-calendar-d0d40.firebasestorage.app',
  messagingSenderId: '105623455519',
  appId: '1:105623455519:web:e0c5b8e71a16ed126f522a',
};

export function isFirebaseConfigured(config: FirebaseOptions): boolean {
  return (['apiKey', 'authDomain', 'projectId', 'appId'] as const).every(
    key => typeof config[key] === 'string' && config[key].trim().length > 0,
  );
}
