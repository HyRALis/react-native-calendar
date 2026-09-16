# Calendar App

A React Native Community CLI app written in TypeScript, without Expo.
Subtask 1 implements Firebase email/password authentication, an authenticated
Calendar landing screen, and a Profile screen with Logout.

## Run on Android (Windows)

Prerequisites: Node 22.11 or newer, JDK 17, Android Studio, an Android SDK,
and `ANDROID_HOME` pointing to that SDK. This template uses Android API 37,
Build Tools 37.0.0, and NDK 27.1.12297006; Gradle can download missing components
when the SDK licenses have already been accepted.

```powershell
npm ci
npm start
```

Keep Metro running. Start an emulator from Android Studio's Device Manager
(or connect an Android phone with USB debugging), then open another terminal:

```powershell
npm run android
```

Metro prepares the JavaScript. Gradle builds the native Android application.
The first native build takes longer because it downloads build tools and libraries.

For a build without installing on a device:

```powershell
cd android
.\gradlew.bat app:assembleDebug
```

This produces a debug APK that expects Metro during development. It is not a
production release. The template's release signing configuration is a development
default and must be replaced before publishing.

## Firebase setup

The supplied public Firebase configuration is in
[`src/config/firebaseConfig.ts`](src/config/firebaseConfig.ts).
The app uses Firebase's JavaScript SDK, which supports email/password
sign-in in React Native. A Firebase web app registration supplies its identifiers;
it does not turn this application into a website. No Analytics SDK is installed.

In the [Firebase console](https://console.firebase.google.com/):

1. Open project `react-native-calendar-d0d40`.
2. Open **Build > Authentication > Sign-in method** (select **Get started** first
   if necessary).
3. Enable **Email/Password**, then save. Email-link sign-in is not required.
4. Optional: configure a registration password policy with a minimum of eight
   characters to match the app's validation. Firebase enforces its configured
   policy; stronger policies may reject passwords accepted by the basic form.

The configuration contains public identifiers. Never put service-account private
keys or user passwords in this repository. Firebase handles password verification.

## Try the first feature

1. Tap **Create an account**, enter an email address you control and a password
   of at least eight characters, and tap **Create account**.
2. Successful registration signs you in and opens **Calendar**.
3. Open **Profile** to see your email and Firebase account ID.
4. Close and reopen the app: Firebase restores the saved session.
5. Tap **Logout** in Profile. You return to Sign in; Back must not reopen Profile.
6. Reopen the app and sign in again with the same account.
7. Try an incorrect password and an invalid email to see the error handling.

Registration creates a real account in your Firebase project. Automated tests
replace the authentication service and never create cloud accounts.

Calendar is a landing screen for this subtask. Meeting creation/editing,
biometrics, email verification, and password recovery are not implemented yet.
Logout signs out this installation; it does not revoke sessions on other devices.

## Understand the code

Read these files in this order:

1. [`App.tsx`](App.tsx) starts Firebase and mounts the application. Missing
   configuration shows a recoverable setup state rather than a crash.
2. [`AuthProvider.tsx`](src/features/auth/AuthProvider.tsx) subscribes to Firebase
   session changes. A React provider shares that state with its descendants.
3. [`RootNavigator.tsx`](src/app/navigation/RootNavigator.tsx) chooses the public
   sign-in/sign-up screens or the private Calendar/Profile tabs. It waits for
   session restoration and removes private navigation history after logout.
4. [`AuthScreen.tsx`](src/features/auth/screens/AuthScreen.tsx) renders the forms.
   React state tracks field values, errors, and whether a request is in progress.
5. [`validateCredentials.ts`](src/features/auth/validation/validateCredentials.ts)
   contains plain TypeScript business rules. It needs neither a phone nor Firebase.
6. [`firebaseAuthService.ts`](src/features/auth/services/firebaseAuthService.ts)
   talks to Firebase. Screens depend on the small `AuthService` interface, so tests
   can supply a fake service without making network requests.
7. [`secureStorage.ts`](src/shared/storage/secureStorage.ts) implements Firebase's
   storage interface using native Keychain/Keystore-backed storage. Firebase
   serializes its own session; the application never stores the user's password.

The data flow is:

```text
Form -> validation -> Firebase service -> Firebase session subscription
                                             |
                                     AuthProvider state
                                             |
                                    Navigation and screens
```

A **token** is a credential Firebase issues for an authenticated user. The service's
`getIdToken()` asks the SDK for a current token, refreshing it when needed. We do
not invent, display, or log tokens. A future custom API must validate the token on
the server. For Firestore, ownership must be enforced using Security Rules.
Hiding a screen is navigation behavior, not server authorization.

Native storage currently restores the session without a biometric prompt.
Biometrics will need a separate session-locking design; do not simply add a prompt
that leaves an already-restored session accessible in the background.

Reusable UI lives in `src/shared/components`. Feature behavior lives in
`src/features/auth`, `calendar`, and `profile`. Extract components when there is a
real shared responsibility; keep validation and networking out of presentation code.

## Checks

```powershell
npm run typecheck
npm run lint
npm test -- --runInBand
npm run format:check
```

Tests cover validation, Firebase service calls, secure-storage behavior, failed
sign-in, registration-to-Calendar navigation, session restoration, duplicate
submission prevention, and Profile logout. Device testing is still needed for
native secure storage and real Firebase connectivity.

Firebase's public TypeScript declarations currently omit the React Native-only
`getReactNativePersistence` export. `src/types/firebase-auth.d.ts` describes that
runtime API explicitly without disabling type checking.

## iOS

The `ios/` project is included. On a Mac with Xcode and CocoaPods:

```sh
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

iOS builds cannot be verified on this Windows machine.

## Git and learning workflow

Keep each commit focused. Use a short title describing the behavior, then explain
why the change was needed and list checks actually run in the body. Include tests
with the feature they protect. Do not claim a device test passed just because
TypeScript passed.

The original Expo starter and the pre-existing modified lockfile were backed up
locally under `.git/task-backups/before-react-native-cli/` before migration. This
backup is not committed. The original starter also remains in Git history.

See [Subtask 1 requirements](docs/subtask-1-authentication.md) for acceptance criteria.

References: [React Native CLI setup](https://reactnative.dev/docs/getting-started-without-a-framework),
[Firebase React Native support](https://firebase.google.com/docs/web/environments-js-sdk),
[React Navigation auth flow](https://reactnavigation.org/docs/auth-flow/).
