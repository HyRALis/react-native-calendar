import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onIdTokenChanged,
  type Auth,
  type UserCredential,
} from 'firebase/auth';
import { createFirebaseAuthService } from './firebaseAuthService';

jest.mock('firebase/app', () => ({
  getApp: jest.fn(),
  getApps: jest.fn(),
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onIdTokenChanged: jest.fn(),
}));
const auth = { currentUser: null } as Auth;
const service = createFirebaseAuthService(auth);
beforeEach(() => {
  jest.clearAllMocks();
  const credential = {
    user: { uid: 'account', email: 'user@example.com' },
  } as UserCredential;
  jest.mocked(signInWithEmailAndPassword).mockResolvedValue(credential);
  jest.mocked(createUserWithEmailAndPassword).mockResolvedValue(credential);
});
test('registers with Firebase and preserves password whitespace', async () => {
  await service.signUp({
    email: ' user@example.com ',
    password: ' secret123 ',
  });
  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
    auth,
    'user@example.com',
    ' secret123 ',
  );
});
test('signs in with Firebase rather than making a local token', async () => {
  await service.signIn({
    email: ' user@example.com ',
    password: 'password123',
  });
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
    auth,
    'user@example.com',
    'password123',
  );
});
test('delegates logout to Firebase', async () => {
  await service.signOut();
  expect(signOut).toHaveBeenCalledWith(auth);
});
test('propagates rejected credentials', async () => {
  jest
    .mocked(signInWithEmailAndPassword)
    .mockRejectedValueOnce({ code: 'auth/invalid-credential' });
  await expect(
    service.signIn({ email: 'user@example.com', password: 'wrong' }),
  ).rejects.toEqual({ code: 'auth/invalid-credential' });
});
test('subscribes to Firebase session updates', () => {
  const next = jest.fn();
  const error = jest.fn();
  service.subscribe(next, error);
  expect(onIdTokenChanged).toHaveBeenCalledWith(
    auth,
    expect.any(Function),
    error,
  );
});
test('does not return a token while signed out', async () => {
  expect(await service.getIdToken()).toBeNull();
});
