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
# First setup only: fill in your Firebase values after copying the template.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
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

If Android shows **Unable to load script**, first make sure `npm start` has
finished and reports that the development server is ready. Use port 8081 for
the default build, then reload the app. A physical USB device may also need
`adb reverse tcp:8081 tcp:8081`. This message concerns the local JavaScript
server, not Firebase authentication.

## Firebase setup

The supplied public Firebase configuration is in the local, Git-ignored `.env`.
On a fresh clone, copy [`.env.example`](.env.example) to `.env` and fill in the
values from **Firebase Console > Project settings > General > Your apps > Web app**:

| Firebase field      | Environment variable           |
| ------------------- | ------------------------------ |
| `apiKey`            | `FIREBASE_API_KEY`             |
| `authDomain`        | `FIREBASE_AUTH_DOMAIN`         |
| `projectId`         | `FIREBASE_PROJECT_ID`          |
| `storageBucket`     | `FIREBASE_STORAGE_BUCKET`      |
| `messagingSenderId` | `FIREBASE_MESSAGING_SENDER_ID` |
| `appId`             | `FIREBASE_APP_ID`              |

[`src/config/firebaseConfig.ts`](src/config/firebaseConfig.ts) reads these values
through `@env`. The `react-native-dotenv` Babel plugin replaces those imports
when Metro bundles JavaScript. TypeScript declarations live in `src/types/env.d.ts`.
No native linking or Expo package is needed. Missing or blank required values
show the account-setup screen before Firebase starts.

After editing `.env`, stop Metro and restart with `npm start -- --reset-cache`,
then reload the app. A release build needs a new bundle/build to pick up changes.
On CI, supply the six variables in the build environment or create `.env` before
bundling; install dev dependencies because Babel needs the plugin.

If Metro reports **Unable to resolve module @env**, stop the existing Metro server
first (Ctrl+C in its terminal), then run `npm run start:reset` from the project root
and reload the app. This is a shortcut for starting Metro with its cache cleared.
`@env` is a virtual import that Babel replaces, not a package to install. A server
using an old transform can try to resolve it as an actual package. Starting a second
server while the original still owns port 8081 will not fix the original server.

The app uses Firebase's JavaScript SDK, which supports email/password
sign-in in React Native. A Firebase web app registration supplies its identifiers;
it does not turn this application into a website. No Analytics SDK is installed.

In the [Firebase console](https://console.firebase.google.com/):

1. Open the Firebase project identified by `FIREBASE_PROJECT_ID` in your `.env`.
2. Open **Build > Authentication > Sign-in method** (select **Get started** first
   if necessary).
3. Enable **Email/Password**, then save. Email-link sign-in is not required.
4. Optional: configure a registration password policy with a minimum of eight
   characters to match the app's validation. Firebase enforces its configured
   policy; stronger policies may reject passwords accepted by the basic form.

The configuration contains public identifiers that remain readable in the app
bundle. `.env` separates configuration from code; it does not encrypt it. Never
put service-account private keys or user passwords in the app's `.env` or source.
Firebase handles password verification; Security Rules must protect future data.
Only `.env.example` is committed. Earlier commits still contain the original public
configuration; moving it does not rewrite Git history.

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

The [UI library guide](docs/ui-library.md) documents the atomic structure,
shared design tokens, typography, button variants, form inputs, checkboxes, and
switches, with composition examples and testing guidance. Import components and
their prop types from `src/shared/components`.

## Checks

```powershell
npm run typecheck
npm run lint
npm test -- --runInBand
npm run format:check
```

Tests cover validation, Firebase service calls, secure-storage behavior, failed
sign-in, registration-to-Calendar navigation, session restoration, duplicate
submission prevention, and Profile logout.

Verified on September 17, 2026:

- All 22 tests across five suites pass, as do TypeScript, ESLint, and formatting.
- The Android x86_64 debug APK builds and runs on the Pixel 10 emulator.
- Live Firebase registration opens Calendar, and Profile displays the account.
- Restarting the app restores the session from native secure storage.
- Logout remains effective after a restart, and the account can sign in again.
- The disposable Firebase accounts created for verification were deleted.

Physical-device and iOS verification are still pending. Emulator testing does
not establish biometric behavior; biometrics are not implemented in this milestone.

The `.env` migration was verified on September 18, 2026: all 28 tests across six
suites, TypeScript, ESLint, and formatting of changed files passed. An Android
release-mode Metro bundle contains all six local configuration values. Separate
Babel checks verified missing-file handling and CI-provided variables. This
configuration change was not re-tested on a device or against live Firebase.

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

Metro excludes `.git/` from its module and asset file map so local backups and
diagnostic files cannot cause unwanted development refreshes.

See [Subtask 1 requirements](docs/subtask-1-authentication.md) for acceptance criteria.

For a beginner-friendly walkthrough of the actual code, read the
[implementation guide](docs/implementation-guide.md). It follows a button tap
through validation, Firebase, session state, and navigation, and explains the tests.

References: [React Native CLI setup](https://reactnative.dev/docs/getting-started-without-a-framework),
[Firebase React Native support](https://firebase.google.com/docs/web/environments-js-sdk),
[React Navigation auth flow](https://reactnavigation.org/docs/auth-flow/).
