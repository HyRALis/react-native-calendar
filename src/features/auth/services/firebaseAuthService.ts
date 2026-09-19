import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth';
import { firebaseConfig } from '../../../config/firebaseConfig';
import { secureStorage } from '../../../shared/storage/secureStorage';
import type { AuthService } from '../types';

export function createFirebaseAuthService(auth: Auth): AuthService {
  return {
    subscribe: (onUser, onError) =>
      onIdTokenChanged(
        auth,
        user => {
          onUser(user ? { id: user.uid, email: user.email } : null);
        },
        onError,
      ),
    async signIn({ email, password }) {
      const { user } = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      return { id: user.uid, email: user.email };
    },
    async signUp({ email, password }) {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      return { id: user.uid, email: user.email };
    },
    async signOut() {
      await signOut(auth);
    },
    async getIdToken(forceRefresh = false) {
      // The SDK refreshes expired tokens. Never manufacture or log a token.
      return auth.currentUser
        ? auth.currentUser.getIdToken(forceRefresh)
        : null;
    },
  };
}

export function getFirebaseAuthService(): AuthService {
  const existing = getApps().some(app => app.name === '[DEFAULT]');
  const auth = existing
    ? getAuth(getApp())
    : initializeAuth(initializeApp(firebaseConfig), {
        persistence: getReactNativePersistence(secureStorage),
      });
  return createFirebaseAuthService(auth);
}
