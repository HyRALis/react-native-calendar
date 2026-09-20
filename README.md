# Calendar App

A React Native Community CLI calendar in TypeScript, without Expo. Includes Firebase email/password accounts, biometric session locking, a custom day/week/month calendar, event creation and editing, and an account profile.

## Versions

Resolved versions below come from `package-lock.json` and the native project configuration; use `npm ci` to reproduce them.

| Component                                            | Version                 |
| ---------------------------------------------------- | ----------------------- |
| App                                                  | 0.0.1                   |
| React Native / React                                 | 0.87.1 / 19.2.3         |
| TypeScript                                           | 6.0.3                   |
| React Native Community CLI                           | 20.2.0                  |
| Firebase                                             | 12.19.0                 |
| React Navigation native / native stack / bottom tabs | 7.4.1 / 7.19.1 / 7.19.1 |
| React Native Screens                                 | 4.26.2                  |
| Safe Area Context                                    | 5.10.0                  |
| AsyncStorage / Keychain                              | 3.1.1 / 10.0.0          |
| Android compile / target / minimum SDK               | 37 / 36 / 24            |
| Android Build Tools / NDK                            | 37.0.0 / 27.1.12297006  |
| Gradle / Kotlin                                      | 9.4.1 / 2.2.0           |
| iOS deployment target                                | 15.1                    |

Development requires Node >=22.11.0 (verified with 24.12.0), JDK 17, Android Studio and `ANDROID_HOME`. iOS requires macOS, Xcode and CocoaPods; it has not been built on this Windows workstation.

## Setup and run

```powershell
npm ci
# First setup only; preserve an existing .env.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm start
```

Populate the six `FIREBASE_*` values in `.env` from your Firebase project's **Web app configuration**. Enable **Authentication > Email/Password** in the Firebase console. `.env.example` lists the fields. The configuration contains public client identifiers; never include service-account keys or passwords. Babel's `react-native-dotenv` plugin reads these values; restart Metro with `npm run start:reset` after changes.

In another terminal, with a running emulator or connected device:

```powershell
npm run android:fast
# If USB cannot reach Metro:
adb reverse tcp:8081 tcp:8081
```

`android:fast` builds for the attached device's architecture. `npm run android` builds the default architectures. For a build without installation:

```powershell
cd android
.\gradlew.bat app:assembleDebug -PreactNativeArchitectures=x86_64
```

The debug APK is `android/app/build/outputs/apk/debug/app-debug.apk` and requires Metro. If installation times out after the build passes, retry `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`. Wait for `adb shell getprop sys.boot_completed` to return `1`. The Pixel 10 emulator needed 4 GB RAM for reliable boot in this environment; no AVD data wipe is required.

On macOS:

```sh
bundle install
cd ios && bundle exec pod install && cd ..
npm run ios
```

Native biometric changes require rebuilding, not just reloading Metro.

## Behavior and storage

- Create an account or sign in to open Calendar. Profile shows the account and Logout.
- Open the menu for Day, Week or Month. Swipe or use arrows to browse dates. Tap a date in month/week view to open that day's agenda.
- Add an event with title, start, end and optional description. All views show events; day titles wrap in full. Tapping an event opens its details sheet, including Edit.
- Events persist locally under `calendar.events.v2.<encoded Firebase UID>` in the `calendar` AsyncStorage database. Switching accounts removes the previous screen tree and loads only the new account's events. Returning to an account restores its calendar. Pending writes stay bound to the original account, including across remounts.
- The old unowned `calendar.events` key is left untouched and is never automatically imported. Its original owner cannot be established safely. Existing users start with an empty account calendar after this upgrade; any future import must require explicit ownership confirmation.
- Event storage is local, unencrypted application data, not cloud synchronization or backend authorization. Firebase session material uses native Keychain/Keystore storage; passwords are not persisted by the app.
- Enable biometrics in Profile after signing in. Relaunching or leaving the app locks the session. Unlock requires a fresh native biometric check plus Firebase token refresh, so biometric return needs network access. Use password clears biometric opt-in and signs out before showing the normal form. Logout also clears opt-in.
- Credential screens and tabs fade; calendar mode changes fade in, date paging animates and sheets slide. Device Reduce Motion disables those animations. Locking removes private screens immediately.
- Safe areas protect headers, forms, landscape side edges, drawers and bottom-sheet controls. The navigator owns the tab bar's bottom inset; calendar/profile content adds only side insets.

Email verification, password recovery, cloud event sync and cross-device session revocation are outside this implementation. Anyone enrolled in this device's biometrics can unlock an opted-in session.

## Verification and submission

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test -- --runInBand --testTimeout=20000 --coverage
```

Tests cover authentication/session gating, account-isolated storage, delayed writes and reads, event validation and editing, all calendar views, navigation, reduced-motion preferences and shared controls. The extended timeout accommodates slower workstation integration runs. Mocked biometrics do not establish native sensor behavior.

The [submission checklist](submission/CHECKLIST.md) records completed checks and remaining device acceptance work. [Screenshots and capture notes](submission/SCREENSHOTS.md) accompany the [evidence archive](submission/calendar-submission-evidence.zip). All screenshot events and accounts are disposable test data. Screenshots are actual Android captures; they do not claim iOS verification or prove animations.

iOS builds, physical-device biometric success/lockout, and a final review on a notched iPhone remain acceptance checks. The current Android signing configuration is a development default, not production signing.
