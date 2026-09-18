# Subtask 1: Registration and authentication

Backend decision: Firebase Authentication. The application uses React Native
Community CLI and strict TypeScript, without Expo. The public Firebase app
configuration supplied by the user lives in a Git-ignored `.env` and is read by
`src/config/firebaseConfig.ts`. `.env.example` documents the variables for a fresh clone.

## Implemented behavior

- Email/password registration and sign-in with field validation.
- Registration also signs the user in and opens Calendar.
- Calendar and Profile are available only after Firebase supplies a user.
- Profile shows email, account ID, and Logout.
- Logout removes the session through Firebase and replaces private navigation.
- Startup waits for Firebase to restore the saved session.
- Firebase session persistence uses native secure storage; passwords are never
  stored by application code.
- Errors and pending requests have explicit UI states; repeated taps do not
  create duplicate requests.

Calendar is the landing screen in this milestone. Meeting creation/editing and
biometric sign-in remain later milestones. Firebase configuration alone does not
prove that Email/Password has been enabled or that a live account flow succeeds.

## Validation decisions

Email is required, trimmed at the service boundary, and checked for a reasonable
format. This format check does not verify email ownership. Passwords are required
and their exact value is preserved. New passwords need at least eight characters;
existing sign-in passwords are not subjected to new registration rules.
Firebase additionally enforces the project's server-side password policy.

## Responsibilities

- A screen renders inputs and feedback.
- A validation function checks values without native dependencies.
- An authentication service calls Firebase.
- The authentication provider shares loading, signed-out, signed-in, or error state.
- The navigator renders the appropriate screen tree.

`AuthService` is the test boundary. Tests supply a fake service; application builds
use Firebase. Production code does not contain a fake login or a simulated token.

## Acceptance criteria

1. Invalid values show field errors and do not call the authentication service.
2. Successful registration opens Calendar and Profile shows the correct account.
3. Invalid credentials leave the user signed out with a readable error.
4. Duplicate registration cannot overwrite an existing Firebase account.
5. A saved valid session restores on relaunch without flashing private screens
   before Firebase finishes loading.
6. Logout returns to Sign in, clears the persisted session through the SDK, and
   prevents Back navigation to private screens.
7. Logout does not delete the account; the same credentials can sign in again.
8. Failed requests stop the loading indicator and allow retry.

Unit and component tests verify the application behavior using Firebase mocks.
A real-device/cloud smoke test must separately check account creation, relaunch,
secure persistence, invalid credentials, and logout. Do not treat mocked tests as
proof that the cloud provider is configured correctly.

Authentication answers who the user is. Future meeting authorization must be
implemented on the backend (for example, Firestore Security Rules), not only by
hiding screens. Signing out this device does not revoke other-device sessions.

## Suggested development sequence

Keep setup, feature behavior, and developer documentation reviewable. Future
features should add tests alongside their implementation. Commit bodies should
explain the reason for the change and the verification actually performed.

See the root README for commands, Firebase setup, and a guided code walkthrough.

## Verification record

On September 17, 2026, all 22 automated tests passed and the Android x86_64 debug
APK built successfully. A Pixel 10 emulator connected to the real Firebase
project verified registration, Profile data, secure session restoration after
process restart, logout across restarts, and signing in again. Disposable test
accounts were removed after verification. Physical-device and iOS checks remain
pending; biometric and meeting features remain outside this milestone.

The [implementation guide](implementation-guide.md) explains the code step by step.
