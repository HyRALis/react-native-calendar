import { createBiometricService } from './biometricService';

function setup() {
  const native = {
    availability: jest.fn(async () => 'Face ID'),
    authenticate: jest.fn(async () => true),
    cancel: jest.fn(),
  };
  const storage = {
    getItem: jest.fn<Promise<string | null>, [string]>(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  };
  return { native, storage, service: createBiometricService(native, storage) };
}

test('only the matching account consent enables biometrics', async () => {
  const { storage, service } = setup();
  expect(await service.isEnabled('alice')).toBe(false);
  storage.getItem.mockResolvedValue('bob');
  expect(await service.isEnabled('alice')).toBe(false);
  storage.getItem.mockResolvedValue('alice');
  expect(await service.isEnabled('alice')).toBe(true);
  expect(storage.getItem).toHaveBeenCalledWith('biometrics.alice');
});

test('saves only opt-in identity, never a password or token', async () => {
  const { service, storage } = setup();
  await service.setEnabled('alice', true);
  expect(storage.setItem).toHaveBeenCalledWith('biometrics.alice', 'alice');
  await service.setEnabled('alice', false);
  expect(storage.removeItem).toHaveBeenCalledWith('biometrics.alice');
});

test('every authentication calls the native prompt and cancellation reaches native', async () => {
  const { service, native } = setup();
  expect(await service.availability()).toBe('Face ID');
  expect(await service.authenticate()).toBe(true);
  expect(await service.authenticate()).toBe(true);
  expect(native.authenticate).toHaveBeenCalledTimes(2);
  service.cancel();
  expect(native.cancel).toHaveBeenCalledTimes(1);
});

test('an unavailable native module fails closed', async () => {
  const service = createBiometricService();
  expect(await service.availability()).toBeNull();
  expect(await service.authenticate()).toBe(false);
  expect(() => service.cancel()).not.toThrow();
});

test('secure storage failures propagate to the session gate', async () => {
  const { service, storage } = setup();
  storage.getItem.mockRejectedValueOnce(new Error('storage unavailable'));
  await expect(service.isEnabled('alice')).rejects.toThrow(
    'storage unavailable',
  );
});
