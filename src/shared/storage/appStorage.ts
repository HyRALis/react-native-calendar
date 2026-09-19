import { createAsyncStorage } from '@react-native-async-storage/async-storage';

/** The two methods anything persisting here needs; easy to fake in a test. */
export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

/**
 * Plain device storage, the app's equivalent of the web's localStorage. Values
 * are not encrypted, so anything secret belongs in `secureStorage` instead.
 * The dependency is named in this file alone, so replacing it stays a one-file
 * change.
 */
export const appStorage: KeyValueStorage = createAsyncStorage('calendar');
