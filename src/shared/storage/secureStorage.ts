import * as Keychain from 'react-native-keychain';

// Firebase accepts this three-method storage interface. Its serialized session
// lives in native secure storage, not in a plaintext AsyncStorage database.
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({
      service: service(key),
    });
    return credentials ? credentials.password : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    const saved = await Keychain.setGenericPassword('firebase-session', value, {
      service: service(key),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    if (!saved) {
      throw new Error('Secure storage could not save the session.');
    }
  },
  async removeItem(key: string): Promise<void> {
    await Keychain.resetGenericPassword({ service: service(key) });
  },
};

function service(key: string): string {
  return `com.calendarapp.firebase.${key}`;
}
