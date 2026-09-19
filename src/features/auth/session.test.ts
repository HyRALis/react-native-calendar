import { createAuthSession } from './session';
import type { AuthUser, AuthService } from './types';
import type { BiometricService } from './services/biometricService';

const user = { id: 'alice', email: 'alice@example.com' };
const other = { id: 'bob', email: 'bob@example.com' };
const credentials = { email: user.email, password: 'test-only' };
const flush = async () => {
  for (let i = 0; i < 8; i++) {
    await Promise.resolve();
  }
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}
function setup(initial: AuthUser | null = user) {
  let emit!: (next: AuthUser | null) => void;
  let fail!: (error: unknown) => void;
  const auth: jest.Mocked<AuthService> = {
    subscribe: jest.fn((next, error) => {
      emit = next;
      fail = error;
      next(initial);
      return jest.fn();
    }),
    signIn: jest.fn<
      ReturnType<AuthService['signIn']>,
      Parameters<AuthService['signIn']>
    >(async () => {
      emit(user);
      return user;
    }),
    signUp: jest.fn<
      ReturnType<AuthService['signUp']>,
      Parameters<AuthService['signUp']>
    >(async () => {
      emit(user);
      return user;
    }),
    signOut: jest.fn(async () => {
      emit(null);
    }),
    getIdToken: jest.fn(async () => 'test-token'),
  };
  const biometrics: jest.Mocked<BiometricService> = {
    availability: jest.fn(async () => 'Face ID'),
    isEnabled: jest.fn<Promise<boolean>, [string]>(async () => true),
    setEnabled: jest.fn<Promise<void>, [string, boolean]>(async () => {}),
    authenticate: jest.fn(async () => true),
    cancel: jest.fn(),
  };
  const session = createAuthSession(auth, biometrics);
  const disconnect = session.connect();
  return {
    session,
    auth,
    biometrics,
    disconnect,
    emit: (next: AuthUser | null) => emit(next),
    fail: (error: unknown) => fail(error),
  };
}

test('restoration and token refresh never authorize private data or tokens', async () => {
  const { session, emit, auth } = setup();
  expect(session.getSnapshot().state).toEqual({ status: 'locked', user: null });
  emit(user);
  expect(await session.service.getIdToken()).toBeNull();
  expect(auth.getIdToken).not.toHaveBeenCalled();
  expect(session.getSnapshot().state.status).toBe('locked');
});

test.each(['signIn', 'signUp'] as const)(
  'explicit %s authorizes the returned Firebase identity',
  async method => {
    const { session } = setup(null);
    await session.service[method](credentials);
    expect(session.getSnapshot().state).toEqual({ status: 'signedIn', user });
    expect(await session.service.getIdToken()).toBe('test-token');
  },
);

test('failed credentials never authorize a user', async () => {
  const { session, auth } = setup(null);
  auth.signIn.mockRejectedValueOnce(new Error('bad password'));
  await expect(session.service.signIn(credentials)).rejects.toThrow(
    'bad password',
  );
  expect(session.getSnapshot().state.status).toBe('signedOut');
});

test('successful biometrics requires an opted-in account and a refreshed Firebase token', async () => {
  const { session, auth, biometrics } = setup();
  await session.unlock();
  expect(biometrics.isEnabled).toHaveBeenCalledWith(user.id);
  expect(auth.getIdToken).toHaveBeenCalledWith(true);
  expect(session.getSnapshot().state).toEqual({ status: 'signedIn', user });
});

test.each([
  'no consent',
  'unavailable',
  'cancelled',
  'locked out',
  'storage error',
  'expired session',
  'no token',
])('%s stays locked with password fallback', async reason => {
  const { session, auth, biometrics } = setup();
  if (reason === 'no consent') {
    biometrics.isEnabled.mockResolvedValue(false);
  }
  if (reason === 'unavailable') {
    biometrics.availability.mockResolvedValue(null);
  }
  if (reason === 'cancelled') {
    biometrics.authenticate.mockResolvedValue(false);
  }
  if (reason === 'locked out') {
    biometrics.authenticate.mockRejectedValue(new Error('lockout'));
  }
  if (reason === 'storage error') {
    biometrics.isEnabled.mockRejectedValue(new Error('storage'));
  }
  if (reason === 'expired session') {
    auth.getIdToken.mockRejectedValue(new Error('revoked'));
  }
  if (reason === 'no token') {
    auth.getIdToken.mockResolvedValue(null);
  }
  await session.unlock();
  expect(session.getSnapshot().state.status).toBe('locked');
  expect(session.getSnapshot().busy).toBe(false);
  expect(session.getSnapshot().message).toBeTruthy();
  expect(await session.service.getIdToken()).toBeNull();
});

test('duplicate biometric taps issue only one native request', async () => {
  const { session, biometrics } = setup();
  const pending = deferred<boolean>();
  biometrics.authenticate.mockReturnValue(pending.promise);
  const first = session.unlock();
  await flush();
  await session.unlock();
  expect(biometrics.authenticate).toHaveBeenCalledTimes(1);
  pending.resolve(true);
  await first;
});

test.each(['background', 'account change', 'sign-out event', 'unmount'])(
  '%s invalidates a late biometric success',
  async event => {
    const { session, biometrics, emit, disconnect } = setup();
    const pending = deferred<boolean>();
    biometrics.authenticate.mockReturnValue(pending.promise);
    const attempt = session.unlock();
    await flush();
    if (event === 'background') {
      session.appStateChanged('background');
      session.appStateChanged('active');
    }
    if (event === 'account change') {
      emit(other);
    }
    if (event === 'sign-out event') {
      emit(null);
    }
    if (event === 'unmount') {
      disconnect();
    }
    pending.resolve(true);
    await attempt;
    expect(session.getSnapshot().state.status).not.toBe('signedIn');
    expect(await session.service.getIdToken()).toBeNull();
  },
);

test('iOS inactive biometric success stays hidden until active', async () => {
  const { session, biometrics } = setup();
  const pending = deferred<boolean>();
  biometrics.authenticate.mockReturnValue(pending.promise);
  const attempt = session.unlock();
  await flush();
  session.appStateChanged('inactive');
  pending.resolve(true);
  await attempt;
  expect(session.getSnapshot().obscured).toBe(true);
  expect(session.getSnapshot().state.status).toBe('locked');
  session.appStateChanged('active');
  expect(session.getSnapshot().state.status).toBe('signedIn');
});

test('backgrounding revokes authorization and token requests already in flight', async () => {
  const { session, auth } = setup();
  await session.unlock();
  const token = deferred<string>();
  auth.getIdToken.mockReturnValue(token.promise);
  const request = session.service.getIdToken();
  session.appStateChanged('background');
  session.appStateChanged('active');
  token.resolve('late-token');
  expect(await request).toBeNull();
  expect(session.getSnapshot().state.status).toBe('locked');
});

test('password success after backgrounding cannot unlock', async () => {
  const { session, auth, emit } = setup(null);
  const pending = deferred<AuthUser>();
  auth.signIn.mockReturnValue(pending.promise);
  const request = session.service.signIn(credentials);
  session.appStateChanged('background');
  emit(user);
  session.appStateChanged('active');
  pending.resolve(user);
  await request;
  expect(session.getSnapshot().state.status).toBe('locked');
});

test('a password result for another identity cannot overwrite the current account', async () => {
  const { session, auth, emit } = setup(null);
  auth.signIn.mockImplementation(async () => {
    emit(other);
    return user;
  });
  await session.service.signIn(credentials);
  expect(session.getSnapshot().state.status).toBe('locked');
});

test('enabling biometrics requires password sign-in and a successful native check', async () => {
  const { session, biometrics } = setup();
  await session.setBiometrics(true);
  expect(biometrics.setEnabled).not.toHaveBeenCalled();
  await session.service.signIn(credentials);
  await session.setBiometrics(true);
  expect(biometrics.setEnabled).toHaveBeenCalledWith(user.id, true);
  await session.setBiometrics(false);
  expect(biometrics.setEnabled).toHaveBeenLastCalledWith(user.id, false);
  expect(session.getSnapshot().enabled).toBe(false);
});

test('cancelled opt-in does not save consent', async () => {
  const { session, biometrics } = setup(null);
  await session.service.signIn(credentials);
  biometrics.authenticate.mockResolvedValue(false);
  await session.setBiometrics(true);
  expect(biometrics.setEnabled).not.toHaveBeenCalled();
});

test('late opt-in save after backgrounding is removed', async () => {
  const { session, biometrics } = setup(null);
  await session.service.signIn(credentials);
  const pending = deferred<void>();
  biometrics.setEnabled.mockReturnValueOnce(pending.promise);
  const request = session.setBiometrics(true);
  await flush();
  session.appStateChanged('background');
  pending.resolve();
  await request;
  expect(biometrics.setEnabled).toHaveBeenLastCalledWith(user.id, false);
  expect(session.getSnapshot().state.status).toBe('locked');
});

test('password fallback clears biometric consent then signs out', async () => {
  const { session, auth, biometrics } = setup();
  await session.service.signOut();
  expect(biometrics.setEnabled).toHaveBeenCalledWith(user.id, false);
  expect(auth.signOut).toHaveBeenCalledTimes(1);
  expect(session.getSnapshot().state.status).toBe('signedOut');
});

test.each(['storage', 'firebase'])(
  'failed %s logout remains locked and supports retry',
  async failure => {
    const { session, auth, biometrics } = setup();
    await session.unlock();
    if (failure === 'storage') {
      biometrics.setEnabled.mockRejectedValueOnce(new Error('storage'));
    } else {
      auth.signOut.mockRejectedValueOnce(new Error('offline'));
    }
    await session.service.signOut();
    expect(session.getSnapshot().state.status).toBe('locked');
    expect(session.getSnapshot().enabled).toBe(false);
    await session.unlock();
    expect(session.getSnapshot().state.status).toBe('locked');
    expect(await session.service.getIdToken()).toBeNull();
    await session.service.signOut();
    expect(session.getSnapshot().state.status).toBe('signedOut');
  },
);

test('old subscription callbacks cannot restore access after retry or disconnect', async () => {
  const { session, auth, fail, disconnect } = setup();
  await session.unlock();
  const [oldEmit, oldError] = auth.subscribe.mock.calls[0];
  fail(new Error('connection'));
  expect(session.getSnapshot().state.status).toBe('error');
  session.retry();
  oldEmit(other);
  oldError(new Error('stale'));
  expect(session.getSnapshot().state.status).toBe('locked');
  await session.unlock();
  expect(session.getSnapshot().state).toEqual({ status: 'signedIn', user });
  disconnect();
  const [newEmit] = auth.subscribe.mock.calls[1];
  newEmit(other);
  expect(await session.service.getIdToken()).toBeNull();
});
