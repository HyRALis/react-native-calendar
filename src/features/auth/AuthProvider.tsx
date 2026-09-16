import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthService, AuthUser } from './types';
import { authErrorMessage } from './services/authErrorMessage';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: AuthUser }
  | { status: 'error'; user: null; message: string };
type AuthContextValue = {
  state: AuthState;
  service: AuthService;
  retry: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  service,
  children,
}: React.PropsWithChildren<{ service: AuthService }>) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ status: 'loading', user: null });
    const unsubscribe = service.subscribe(
      user => {
        if (active) {
          setState(
            user
              ? { status: 'signedIn', user }
              : { status: 'signedOut', user: null },
          );
        }
      },
      error => {
        if (active) {
          setState({
            status: 'error',
            user: null,
            message: authErrorMessage(error),
          });
        }
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [service, attempt]);
  return (
    <AuthContext.Provider
      value={{ state, service, retry: () => setAttempt(value => value + 1) }}
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
