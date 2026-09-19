import { NativeModules } from 'react-native';
import { secureStorage } from '../../../shared/storage/secureStorage';

export type BiometricService = {
  availability: () => Promise<string | null>;
  isEnabled: (userId: string) => Promise<boolean>;
  setEnabled: (userId: string, enabled: boolean) => Promise<void>;
  authenticate: () => Promise<boolean>;
  cancel: () => void;
};

type NativeBiometrics = {
  availability: () => Promise<string | null>;
  authenticate: () => Promise<boolean>;
  cancel: () => void;
};

// This preference contains no password or token. Native authentication is
// required on EVERY unlock; reading this value alone never grants access.
export function createBiometricService(
  native: NativeBiometrics | undefined = NativeModules.CalendarBiometrics,
  storage = secureStorage,
): BiometricService {
  return {
    availability: async () => (native ? native.availability() : null),
    isEnabled: async userId =>
      (await storage.getItem(`biometrics.${userId}`)) === userId,
    setEnabled: async (userId, enabled) => {
      if (enabled) {
        await storage.setItem(`biometrics.${userId}`, userId);
      } else {
        await storage.removeItem(`biometrics.${userId}`);
      }
    },
    authenticate: async () => (native ? native.authenticate() : false),
    cancel: () => native?.cancel(),
  };
}

export const biometricService = createBiometricService();
