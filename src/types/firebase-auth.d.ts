import type { Persistence } from 'firebase/auth';

// Firebase exposes this function at runtime in its React Native entry point,
// but its shared public declarations omit it. Keep this boundary explicit.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
