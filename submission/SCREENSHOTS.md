# Screenshot evidence

Ten unedited screenshots captured with `adb exec-out screencap -p` on 2026-09-20 and visually inspected. Device: Pixel 10 AVD, Android 16/API 36, x86_64, gesture navigation. Portrait resolution is 1080 x 2424; landscape is 2424 x 1080. The emulator's displayed clock uses its own timezone.

Sign-in, registration and profile were captured from the debug app. Calendar, event and lock screens were captured from the bundled release app. Both use the implementation in commit `10cb8d1`; README version updates are in `dff9b5b`. The current release APK hash and checks are in [verification.json](verification.json).

All account/event data is disposable test data. The Firebase account displayed in Profile was deleted after testing. No password, session token or Firebase configuration file is included.

| File                                                                               | What it shows                                                                                                                    |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [01-sign-in.png](screenshots/android/01-sign-in.png)                               | Empty email/password sign-in form and registration link.                                                                         |
| [02-registration.png](screenshots/android/02-registration.png)                     | Empty registration form and sign-in link.                                                                                        |
| [03-month.png](screenshots/android/03-month.png)                                   | September calendar with an event on the selected day.                                                                            |
| [04-week.png](screenshots/android/04-week.png)                                     | Week agenda scrolled to the event on Sunday.                                                                                     |
| [05-day.png](screenshots/android/05-day.png)                                       | Complete long event title wrapping in the day agenda.                                                                            |
| [06-add-event.png](screenshots/android/06-add-event.png)                           | Event creation sheet with title, dates/times and description. The single-line title field is horizontally scrolled after typing. |
| [07-event-details.png](screenshots/android/07-event-details.png)                   | Bottom sheet with full event title, start/end, description and Edit action.                                                      |
| [08-profile.png](screenshots/android/08-profile.png)                               | Disposable account details, unavailable-biometric guidance and Logout.                                                           |
| [09-edit-event.png](screenshots/android/09-edit-event.png)                         | Existing event loaded into the edit sheet with Save changes.                                                                     |
| [12-session-lock-landscape.png](screenshots/android/12-session-lock-landscape.png) | Protected restored session with password fallback in landscape; simulated tall cutout enabled, content inset from the left.      |

The landscape capture uses Android's `com.android.internal.display.cutout.emulation.tall` overlay. Screen captures do not paint a physical bezel/notch; the relevant evidence is the protected content inset. Rotation and overlay settings were restored after testing.

Screenshots demonstrate rendered states, not animation smoothness, physical biometric success or complete notch compatibility. iOS and the remaining device acceptance checks are listed in [CHECKLIST.md](CHECKLIST.md).

The ZIP includes these notes, the checklist, verification results, all ten PNGs and [screenshots/manifest.json](screenshots/manifest.json) with dimensions and SHA-256 hashes. The archive intentionally excludes application configuration, credentials, build outputs and source code; submit it alongside the repository.
