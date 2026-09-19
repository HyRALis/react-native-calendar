import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { AppState } from 'react-native';
import type { AuthService } from './types';
import {
  biometricService,
  type BiometricService,
} from './services/biometricService';
import { createAuthSession } from './session';

type Session = ReturnType<typeof createAuthSession>;
type AuthContextValue = ReturnType<Session['getSnapshot']> &
  Pick<Session, 'service' | 'retry' | 'unlock' | 'setBiometrics'>;
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  service,
  biometrics = biometricService,
  children,
}: React.PropsWithChildren<{
  service: AuthService;
  biometrics?: BiometricService;
}>) {
  const session = useMemo(
    () => createAuthSession(service, biometrics),
    [service, biometrics],
  );
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);
  useEffect(() => {
    const disconnect = session.connect();
    session.appStateChanged(AppState.currentState ?? 'active');
    const subscription = AppState.addEventListener(
      'change',
      session.appStateChanged,
    );
    return () => {
      subscription.remove();
      disconnect();
    };
  }, [session]);
  return (
    <AuthContext.Provider
      value={{
        ...snapshot,
        service: session.service,
        retry: session.retry,
        unlock: session.unlock,
        setBiometrics: session.setBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
