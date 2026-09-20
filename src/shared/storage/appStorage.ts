import { createAsyncStorage } from '@react-native-async-storage/async-storage';

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export const appStorage: KeyValueStorage = createAsyncStorage('calendar');
