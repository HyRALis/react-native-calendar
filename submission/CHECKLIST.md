# Final submission checklist

Reviewed on 2026-09-20 against **React Native Calendar-Task.pdf** and the additional calendar requirements. Implementation is complete for the items below. Physical-device and iOS acceptance remain open; automated tests do not establish those results.

## Requirements and evidence

| Requirement                                   | Implementation and verification                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| React Native without Expo; TypeScript         | Community CLI, React Native 0.87.1, React 19.2.3, TypeScript 6.0.3; type checking passes.                                                                                                                                                                                                                    |
| Registration, sign-in and validation          | Firebase email/password authentication, validated fields, native secure session persistence; automated tests and Android registration/sign-in smoke test.                                                                                                                                                    |
| Biometrics for previously authenticated users | Opt-in in Profile, fresh native authentication and forced Firebase token refresh before unlocking. Restored/backgrounded sessions gate private screens. Password fallback signs out and clears opt-in; automated success, failure, cancellation and session-race tests. Native sensor acceptance is pending. |
| Protected Calendar and Profile; routing       | React Navigation stack and tabs. Locked/signed-out sessions unmount private screens; integration tests.                                                                                                                                                                                                      |
| Profile information and logout                | Account information, biometric availability/opt-in and logout; tests and Android profile capture.                                                                                                                                                                                                            |
| Custom UI and calendar                        | App-owned day/week/month components, header, navigation bar and date paging; no third-party calendar component.                                                                                                                                                                                              |
| Create and edit events                        | Title, start, end and optional description; validation and persistence tests. Created an event, changed its description, saved and reopened its details on Android.                                                                                                                                          |
| Events in every calendar mode                 | Month entries, scrollable week agenda and day agenda; automated tests and Android captures. Day view wraps the complete title.                                                                                                                                                                               |
| Event details from every mode                 | Shared bottom sheet with full title, dates/times, description and Edit; automated coverage. Opened details from day and week on Android.                                                                                                                                                                     |
| Tap a date to open day view                   | Month cells and week headings open the selected day; tests and Android smoke test.                                                                                                                                                                                                                           |
| Account-specific event storage                | Firebase UID selects the local storage key and screen instance. Tests cover A/B/A account switching, persisted isolation, delayed writes across remounts and recovery after write failure.                                                                                                                   |
| Screen transitions                            | Auth/tab fades, calendar-mode fade, animated date paging and sheet transitions. System Reduce Motion disables these animations; preference/race tests. Screenshot stills do not prove animation quality.                                                                                                     |
| Notch-safe layouts                            | Safe areas on headers, auth/status screens, calendar/profile side edges, drawers and sheet controls; scrollable constrained content. Android portrait screens and landscape locked-session layout with simulated tall cutout captured. Full device matrix is pending.                                        |
| At least 5% test coverage                     | 393 tests in 39 suites pass. Line coverage 95.08%; statements 95.01%, branches 85.80%, functions 95.18%. Coverage is for instrumented JavaScript/TypeScript, not native Kotlin/Objective-C.                                                                                                                  |
| README with software versions                 | Resolved package versions, native toolchain versions, setup, builds, storage behavior and limitations documented in the root README.                                                                                                                                                                         |
| A few app screenshots                         | Ten original Android PNG captures, capture notes and SHA-256 manifest packaged in the evidence ZIP.                                                                                                                                                                                                          |
| Source in a free repository                   | Origin is `https://github.com/HyRALis/react-native-calendar`. Confirm the final submission files are committed, pushed and accessible to the reviewer before sending.                                                                                                                                        |

## Completed checks

- [x] `npm run typecheck`.
- [x] `npm run lint` with no errors or warnings; generated coverage reports are excluded from source linting.
- [x] `npm run format:check`.
- [x] `npm test -- --runInBand --coverage`: 39 suites, 393 tests passed.
- [x] Android `app:assembleRelease -PreactNativeArchitectures=x86_64`: successful.
- [x] Release APK installed on Pixel 10 AVD, Android 16/API 36, x86_64; app runs without Metro.
- [x] Android event add/edit, month-to-day, week-to-day, full day title and details smoke checks described above.
- [x] Restored session shows the lock gate; password fallback reaches normal sign-in; unavailable biometrics explained in Profile.
- [x] Actual PNGs visually inspected; temporary Firebase test account deleted; emulator rotation/cutout settings restored.
- [x] Evidence package contains only the checklist, capture notes, verification record, screenshot manifest and screenshots.

The release artifact is `android/app/build/outputs/apk/release/app-release.apk`, SHA-256 `b1366b14f5e5a91b03369d9d0aeea5e6c9ddec60376dc91156e64531d9109d84`. It targets x86_64 and uses the project's development signing configuration. It is not included in the screenshot archive. Gradle reports existing plugin API deprecations for a future Gradle/AGP upgrade.

## Final acceptance before handoff

- [ ] Build and launch iOS on macOS/Xcode; verify native module linking and Face ID permission text.
- [ ] On enrolled Android/iOS hardware, verify biometric opt-in, cold start, background/resume, success, cancellation, failed attempts, lockout and password fallback. Cancel/failure must keep Calendar/Profile inaccessible; success must refresh Firebase before access.
- [ ] Verify offline/token-refresh failure, revoked/disabled accounts and biometric enrollment changes on hardware. Keep private screens gated whenever authentication cannot complete.
- [ ] Review all screens, sheets and keyboards on notched iPhones and Android cutouts in portrait/landscape, with larger text and both gesture/button navigation. The included landscape image verifies only the locked-session screen.
- [ ] Review transitions with Reduce Motion on and off on each platform; confirm locking never waits for an exit animation.
- [ ] Commit/push the final README, lint configuration and `submission/` files; confirm repository access and send its URL with the evidence ZIP.
- [ ] If an installable phone build is requested, build the appropriate ARM64/iOS artifact and configure the required signing. The x86_64 emulator APK is not a phone-distribution build.

## Storage decision

Events are local, unencrypted AsyncStorage data under `calendar.events.v2.<encoded Firebase UID>` in the `calendar` database. They are not synchronized to Firebase. The old shared `calendar.events` key remains untouched and is never imported automatically because its account owner is unknown. Upgraded accounts therefore begin with an empty calendar; a future import must establish ownership explicitly. Returning to the same new-format account restores that account's saved events.

See [capture notes](SCREENSHOTS.md), [verification record](verification.json) and the root [README](../README.md).
