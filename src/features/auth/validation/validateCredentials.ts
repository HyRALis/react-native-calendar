import type { AuthMode, Credentials } from '../types';

export type CredentialErrors = Partial<Record<keyof Credentials, string>>;

export function validateCredentials(
  values: Credentials,
  mode: AuthMode,
): CredentialErrors {
  const errors: CredentialErrors = {};
  const email = values.email.trim();
  if (!email) {
    errors.email = 'Enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.password) {
    errors.password = 'Enter your password.';
  } else if (mode === 'signUp' && values.password.length < 8) {
    errors.password = 'Use at least 8 characters.';
  }
  return errors;
}
