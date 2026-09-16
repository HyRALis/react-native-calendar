import * as Keychain from 'react-native-keychain';
import { secureStorage } from './secureStorage';

beforeEach(() => {
  jest.clearAllMocks();
});
test('stores the SDK session under a dedicated device-only service', async () => {
  await secureStorage.setItem('user', 'serialized-session');
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'firebase-session',
    'serialized-session',
    {
      service: 'com.calendarapp.firebase.user',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  );
});
test('returns null when there is no saved session', async () => {
  expect(await secureStorage.getItem('user')).toBeNull();
});
test('returns saved session data without exposing it to a screen', async () => {
  jest.mocked(Keychain.getGenericPassword).mockResolvedValueOnce({
    username: 'firebase-session',
    password: 'serialized-session',
    service: 'test',
    storage: Keychain.STORAGE_TYPE?.AES_GCM,
  });
  expect(await secureStorage.getItem('user')).toBe('serialized-session');
});
test('propagates persistence failure instead of claiming success', async () => {
  jest.mocked(Keychain.setGenericPassword).mockResolvedValueOnce(false);
  await expect(secureStorage.setItem('user', 'value')).rejects.toThrow(
    'Secure storage',
  );
});
test('clears only the requested Firebase key', async () => {
  await secureStorage.removeItem('user');
  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
    service: 'com.calendarapp.firebase.user',
  });
});
