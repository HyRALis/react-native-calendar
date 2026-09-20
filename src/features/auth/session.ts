import type { AuthService, AuthUser, Credentials } from './types';
import type { BiometricService } from './services/biometricService';
import { authErrorMessage } from './services/authErrorMessage';

export type AuthState =
  | { status: 'loading' | 'signedOut' | 'locked'; user: null }
  | { status: 'signedIn'; user: AuthUser }
  | { status: 'error'; user: null; message: string };

type SessionSnapshot = {
  state: AuthState;
  biometry: string | null;
  enabled: boolean;
  checking: boolean;
  busy: boolean;
  message: string | null;
  obscured: boolean;
};

export function createAuthSession(
  auth: AuthService,
  biometrics: BiometricService,
) {
  let snapshot: SessionSnapshot = {
    state: { status: 'loading', user: null },
    biometry: null,
    enabled: false,
    checking: false,
    busy: false,
    message: null,
    obscured: false,
  };
  const listeners = new Set<() => void>();
  let user: AuthUser | null = null;
  let authorizedId: string | null = null;
  let generation = 0;
  let foreground = true;
  let connected = false;
  let unsubscribe: (() => void) | undefined;
  let operation: 'password' | 'biometric' | 'settings' | 'logout' | null = null;
  let pendingUnlock: { id: string; generation: number } | null = null;
  let inspection = 0;
  let subscriptionVersion = 0;
  let logoutRequested = false;

  function publish(patch: Partial<SessionSnapshot>) {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach(listener => listener());
  }

  function current(version: number, id: string) {
    return connected && generation === version && user?.id === id;
  }

  function authorize(id: string, version: number) {
    if (!current(version, id)) {
      return;
    }
    if (!foreground) {
      pendingUnlock = { id, generation: version };
      return;
    }
    authorizedId = id;
    publish({ state: { status: 'signedIn', user: user! }, message: null });
  }

  async function inspect() {
    const id = user?.id;
    const request = ++inspection;
    if (!id) {
      return;
    }
    publish({ checking: true });
    try {
      const [biometry, enabled] = await Promise.all([
        biometrics.availability(),
        biometrics.isEnabled(id),
      ]);
      if (connected && user?.id === id && request === inspection) {
        publish({
          biometry,
          enabled: enabled && !logoutRequested,
          checking: false,
        });
      }
    } catch {
      if (connected && user?.id === id && request === inspection) {
        publish({
          biometry: null,
          enabled: false,
          checking: false,
          message:
            'Biometrics could not be checked. You can sign in with your password.',
        });
      }
    }
  }

  function receive(next: AuthUser | null) {
    const changed = user?.id !== next?.id;
    user = next;
    if (!next) {
      generation++;
      authorizedId = null;
      pendingUnlock = null;
      inspection++;
      biometrics.cancel();
      publish({
        state: { status: 'signedOut', user: null },
        enabled: false,
        biometry: null,
        checking: false,
        message: null,
      });
      return;
    }
    if (operation === 'password') {
      return;
    }
    if (changed) {
      generation++;
      authorizedId = null;
      pendingUnlock = null;
      publish({ enabled: false, biometry: null });
    }
    publish({
      state:
        authorizedId === next.id
          ? { status: 'signedIn', user: next }
          : { status: 'locked', user: null },
    });
    if (changed) {
      void inspect();
    }
  }

  function connect() {
    unsubscribe?.();
    const subscription = ++subscriptionVersion;
    connected = true;
    generation++;
    authorizedId = null;
    pendingUnlock = null;
    user = null;
    publish({ state: { status: 'loading', user: null } });
    unsubscribe = auth.subscribe(
      next => {
        if (connected && subscriptionVersion === subscription) {
          receive(next);
        }
      },
      error => {
        if (!connected || subscriptionVersion !== subscription) {
          return;
        }
        generation++;
        authorizedId = null;
        pendingUnlock = null;
        biometrics.cancel();
        publish({
          state: {
            status: 'error',
            user: null,
            message: authErrorMessage(error),
          },
        });
      },
    );
    return () => {
      connected = false;
      subscriptionVersion++;
      generation++;
      inspection++;
      authorizedId = null;
      pendingUnlock = null;
      unsubscribe?.();
      biometrics.cancel();
    };
  }

  async function passwordSignIn(
    method: 'signIn' | 'signUp',
    credentials: Credentials,
  ) {
    if (operation) {
      throw new Error('An authentication request is already in progress.');
    }
    operation = 'password';
    const version = generation;
    try {
      const authenticated = await auth[method](credentials);
      if (
        connected &&
        generation === version &&
        foreground &&
        (!user || user.id === authenticated.id)
      ) {
        user = authenticated;
        logoutRequested = false;
        authorize(authenticated.id, version);
        void inspect();
      }
      return authenticated;
    } finally {
      operation = null;
      if (connected && user && authorizedId !== user.id) {
        publish({ state: { status: 'locked', user: null } });
        void inspect();
      }
    }
  }

  async function unlock() {
    const id = user?.id;
    if (
      !id ||
      snapshot.state.status !== 'locked' ||
      operation ||
      !foreground ||
      logoutRequested
    ) {
      return;
    }
    const version = generation;
    operation = 'biometric';
    publish({ busy: true, message: null });
    try {
      if (
        !(await biometrics.isEnabled(id)) ||
        !(await biometrics.availability())
      ) {
        throw new Error('unavailable');
      }
      if (!current(version, id)) {
        return;
      }
      const accepted = await biometrics.authenticate();
      if (!current(version, id)) {
        return;
      }
      if (accepted) {
        if (!(await auth.getIdToken(true))) {
          throw new Error('session unavailable');
        }
        if (!current(version, id)) {
          return;
        }
        authorize(id, version);
      } else {
        publish({
          message:
            'Authentication was cancelled. Try again or use your password.',
        });
      }
    } catch {
      if (current(version, id)) {
        publish({
          message:
            'Biometrics could not unlock your calendar. Try again or use your password.',
        });
      }
    } finally {
      operation = null;
      if (connected) {
        publish({ busy: false });
      }
    }
  }

  async function setBiometrics(enabled: boolean) {
    const id = user?.id;
    if (
      !id ||
      snapshot.state.status !== 'signedIn' ||
      operation ||
      !foreground
    ) {
      return;
    }
    const version = generation;
    operation = 'settings';
    publish({ busy: true, message: null });
    try {
      if (
        enabled &&
        (!(await biometrics.availability()) ||
          !(await biometrics.authenticate()))
      ) {
        throw new Error('not authenticated');
      }
      if (!current(version, id)) {
        return;
      }
      await biometrics.setEnabled(id, enabled);
      if (!current(version, id)) {
        if (enabled) {
          await biometrics.setEnabled(id, false);
        }
        return;
      }
      inspection++;
      publish({ enabled, checking: false });
    } catch {
      if (current(version, id)) {
        publish({
          message:
            'Biometric settings could not be changed. Your password still works.',
        });
      }
    } finally {
      operation = null;
      if (connected) {
        publish({ busy: false });
      }
    }
  }

  async function signOut() {
    if (operation) {
      return;
    }
    operation = 'logout';
    logoutRequested = true;
    const id = user?.id;
    generation++;
    authorizedId = null;
    pendingUnlock = null;
    publish({
      state: { status: 'locked', user: null },
      enabled: false,
      busy: true,
      message: null,
    });
    try {
      if (id) {
        await biometrics.setEnabled(id, false);
      }
      await auth.signOut();
      user = null;
      publish({ state: { status: 'signedOut', user: null }, enabled: false });
    } catch {
      publish({
        message:
          'Sign-out could not finish. Your calendar is locked. Try again.',
      });
    } finally {
      operation = null;
      if (connected) {
        publish({ busy: false });
      }
    }
  }

  function appStateChanged(next: string) {
    foreground = next === 'active';
    publish({ obscured: !foreground });
    if (foreground) {
      const pending = pendingUnlock;
      pendingUnlock = null;
      if (pending) {
        authorize(pending.id, pending.generation);
      }
      if (user) {
        void inspect();
      }
      return;
    }
    if (
      next === 'inactive' &&
      (operation === 'biometric' || operation === 'settings')
    ) {
      return;
    }
    generation++;
    authorizedId = null;
    pendingUnlock = null;
    biometrics.cancel();
    if (user) {
      publish({ state: { status: 'locked', user: null } });
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect,
    appStateChanged,
    unlock,
    setBiometrics,
    retry: () => {
      connect();
    },
    service: {
      signIn: (credentials: Credentials) =>
        passwordSignIn('signIn', credentials),
      signUp: (credentials: Credentials) =>
        passwordSignIn('signUp', credentials),
      signOut,
      getIdToken: async () => {
        const id = authorizedId;
        const version = generation;
        if (!foreground || !id || snapshot.state.status !== 'signedIn') {
          return null;
        }
        const token = await auth.getIdToken();
        return foreground && current(version, id) && authorizedId === id
          ? token
          : null;
      },
    },
  };
}
