export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : undefined;
  switch (code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'Choose a stronger password that meets the account password policy.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait before trying again.';
    case 'auth/user-disabled':
      return 'This account is unavailable. Please contact support.';
    case 'auth/operation-not-allowed':
    case 'auth/invalid-api-key':
    case 'auth/app-not-authorized':
      return 'Account sign-in is currently unavailable. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
