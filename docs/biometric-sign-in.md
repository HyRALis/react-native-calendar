# Biometric sign-in

After signing in with Firebase email/password, open **Profile → Enable biometrics**
and complete the device prompt. Consent is stored for that Firebase account on
this installation. No password is saved. Anyone whose biometrics are enrolled on
the device can unlock the opted-in account.

On relaunch or after leaving the app, Calendar and Profile are unmounted. Tap
**Unlock with Biometrics**, **Face ID**, or **Touch ID** to return. Each unlock
requires a new native biometric check and a successful Firebase token refresh.
Returning through biometrics therefore requires network access. A Firebase
restoration or token-change notification alone never unlocks the app.

**Use password** clears the account's opt-in and signs out the restored session,
then shows the regular Firebase sign-in form. Missing hardware/enrollment,
cancellation, biometric lockout, network errors, and secure-storage failures do
not expose private screens. If clearing the saved session fails, the app stays
locked and offers a retry through **Use password**. Profile's **Logout** also
clears opt-in; enable it again after the next password sign-in if desired.

## Implementation

- `session.ts` separates the Firebase identity from local authorization. It
  serializes authentication operations and rejects stale results after account
  changes, backgrounding, or provider teardown. Its token accessor returns no
  token while locked and rechecks authorization after asynchronous token fetches.
- `AuthProvider` connects that state machine to React and app lifecycle changes.
  iOS's temporary inactive state during a native biometric prompt obscures the UI;
  a real background transition invalidates the pending attempt.
- `biometricService` stores account consent using the existing native secure
  storage adapter. Consent alone grants no access.
- `CalendarBiometrics` uses AndroidX `BiometricPrompt` with `BIOMETRIC_STRONG` and
  iOS `LAContext` with `deviceOwnerAuthenticationWithBiometrics`, a fresh context,
  and zero reuse duration. Device PIN/passcode is not an alternative in that
  prompt; the app's fallback is Firebase email/password.
- Android registers the native module in `MainApplication`. The iOS project
  includes the Objective-C bridge, LocalAuthentication framework, and Face ID
  usage description. A native rebuild is required; Metro reload alone is not
  enough.

Firebase still owns the server session and persists it through Keychain/Keystore.
This is an application session lock, not biometric encryption of each event or
a replacement for server authorization. Feature code must use `useAuth().service`
for tokens. Local calendar storage remains device-wide as documented in README.

## Verification

Automated tests cover restored-session gating, successful and failed credentials,
biometric cancellation/unavailability/lockout, opt-in changes, account changes,
late native and token results, backgrounding, iOS inactivity, duplicate requests,
logout/storage failures, password fallback, and protected navigation.

Run `npm test -- --runInBand`, `npm run typecheck`, and `npm run lint`.
The Android x86_64 debug build is checked with
`./gradlew.bat app:assembleDebug -PreactNativeArchitectures=x86_64` from the
Android directory.

On September 19, 2026, all 385 tests in 38 suites passed with 95.44% line
coverage using `npm test -- --runInBand --testTimeout=20000 --coverage` (the longer
timeout accommodates this workstation's integration tests). TypeScript passed;
ESLint reported no errors and one existing navigation warning. The Android
x86_64 debug APK built successfully. Existing calendar tests emit React `act`
warnings. These checks use mocked biometrics, not a physical sensor.

Device acceptance checks on Android and iOS:

1. Sign in with a disposable Firebase account. Enable biometrics in Profile.
2. Background/reopen and force-stop/relaunch. Confirm no private data appears
   before unlocking. Test success, mismatch, cancel, and OS biometric lockout.
3. Remove enrollment or disable biometric hardware access. Use password, try an
   incorrect password, then the correct one.
4. Background during authentication; a late success must not unlock the app.
5. Disable the Firebase account/revoke its refresh tokens; a biometric match must
   not bypass the failed token refresh.
6. Logout, relaunch, and confirm sign-in is required and Back cannot reopen
   private navigation. Re-enable biometrics only after signing in again.

Mocked tests and compilation do not establish sensor behavior. Face ID/Touch ID
must also be checked on iOS using Xcode and a supported device or simulator;
an iOS build cannot run on this Windows workspace.

Native API references: [Android BiometricPrompt](https://developer.android.com/reference/androidx/biometric/BiometricPrompt)
and [Apple LocalAuthentication](https://developer.apple.com/documentation/localauthentication).
