# Implementation guide: accounts and navigation

This guide follows the code that exists in this repository. Start with the
[README](../README.md) to run the app, then use this walkthrough while reading
the source. The first milestone is email/password registration, sign-in,
session restoration, Calendar, and Profile logout.

## 1. Understand the two parts of the application

The React Native app is the **client**: it displays screens, collects input,
and asks Firebase to perform account operations. Firebase Authentication is
the **authentication backend**: it creates accounts and verifies passwords.

The native `android/` and `ios/` projects package our TypeScript interface into
mobile apps. They also connect native libraries such as secure storage. Metro
bundles JavaScript; Gradle builds Android; Xcode builds iOS. Most feature work
will happen under `src/`, rather than in the generated native files.

Application logic uses `.ts`. React components use `.tsx`, which lets us write
markup-like JSX alongside TypeScript. Small build-configuration files still use
JavaScript because that is the tooling's normal format.

## 2. Trace startup before reading a form

Open [`App.tsx`](../App.tsx). It initializes Firebase, provides safe screen areas,
and mounts `AuthProvider` around `RootNavigator`.

`SafeAreaProvider` supplies information about screen areas occupied by things
such as the camera cutout and system bars. It is unrelated to account security.

[`AuthProvider`](../src/features/auth/AuthProvider.tsx) keeps the shared session
state. A React **context provider** makes a value available to components beneath
it without passing that value through every intermediate component.

The provider represents these states explicitly:

| State       | Meaning                                  | Visible interface  |
| ----------- | ---------------------------------------- | ------------------ |
| `loading`   | Firebase is determining the current user | Loading screen     |
| `signedOut` | No signed-in user                        | Sign in / Sign up  |
| `signedIn`  | Firebase supplied a user                 | Calendar / Profile |
| `error`     | The session listener reported a failure  | Error with retry   |

Notice the union type in `AuthProvider.tsx`. Each state allows only the data
appropriate to it. For example, `signedIn` requires a user. TypeScript can then
help us avoid trying to read a user ID from a signed-out state.

Startup is asynchronous: native storage and Firebase need time to restore a
session. Showing a loading state prevents briefly displaying the wrong screen.
When the provider unmounts, it unsubscribes so an old listener does not keep
updating the interface.

## 3. Understand a component's props and state

Open [`AuthScreen.tsx`](../src/features/auth/screens/AuthScreen.tsx).

**Props** are inputs from the component's parent. This screen receives:

- `mode`: either `signIn` or `signUp`.
- `onSwitch`: a function to call when the user wants the other form.

**State** is information that changes while the screen is open:

```tsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
```

`email` is the current value. Calling `setEmail` updates it and asks React to
render the screen again. The text field is controlled because its displayed
value comes from React state:

```tsx
<FormField label="Email" value={email} onChangeText={setEmail} />
```

[`FormField`](../src/shared/components/FormField.tsx) combines a label, a native
text input, and an optional error. It does not know anything about Firebase.
That makes it useful in future meeting forms too.

The shared [`Button`](../src/shared/components/Button.tsx) owns consistent
spacing, colors, accessibility information, and a loading indicator. The screen
still decides what tapping it should do.

## 4. Follow a sign-in button tap

The button calls `submit` in `AuthScreen`. Follow that function in order:

1. Reject a second submission if one is already running.
2. Build a credentials object from the current field values.
3. Validate the values and display any field errors.
4. Stop if validation failed; no Firebase request is made.
5. Mark the operation pending and call the authentication service.
6. Display a readable message if the request fails.
7. Clear the pending state in `finally`, whether the request succeeds or fails.

An `async` function can `await` another asynchronous operation. While it waits,
the JavaScript thread can continue handling other work. `try/catch` handles a
rejected request; `finally` performs cleanup in either outcome.

The `submitting` ref and `loading` state have different jobs. The ref changes
immediately to prevent two rapid taps from starting two requests. The state
updates the visible spinner and disabled controls when React renders.

## 5. Keep validation independent of the screen

[`validateCredentials`](../src/features/auth/validation/validateCredentials.ts)
is a plain function. It receives values and returns field errors. It does not
render anything, modify storage, or make a network request.

Our rules require a reasonably formatted email and a nonempty password. New
passwords must contain at least eight characters. We deliberately do not apply
new registration rules to an existing user's sign-in password.

We trim surrounding email whitespace before sending it to Firebase. We preserve
the password exactly: spaces can be intentional password characters.

TypeScript checks how our code uses data; validation checks values entered at
runtime. Both are needed. Firebase also validates the request and enforces its
own configured password policy. A local email-format check does not verify
ownership of that email address.

## 6. Put Firebase behind a small service

Open [`types.ts`](../src/features/auth/types.ts). `AuthService` is an interface:
a contract describing the operations the screens and provider can use.

```ts
interface AccountActions {
  signIn(credentials: Credentials): Promise<void>;
  signUp(credentials: Credentials): Promise<void>;
  signOut(): Promise<void>;
  getIdToken(): Promise<string | null>;
}
```

This excerpt groups four actions for illustration; the actual `AuthService`
interface also includes the session subscription.

`Promise<void>` means the operation finishes later without returning a useful
value. `Promise<string | null>` finishes with a token string or no token.

[`firebaseAuthService.ts`](../src/features/auth/services/firebaseAuthService.ts)
implements that contract using Firebase's SDK. Registration calls
`createUserWithEmailAndPassword`; sign-in calls `signInWithEmailAndPassword`.
Successful Firebase registration also signs the new user in.

The provider receives the service as a prop. This is **dependency injection**:
we supply the dependency instead of constructing it deep inside each screen.
Tests can supply a small fake service, while application builds supply Firebase.
We only introduce this boundary where it helps; there is no need for a class
hierarchy or a general-purpose service framework.

The service's subscription maps Firebase's user into our smaller `AuthUser` type.
Screens need an ID and email, rather than every SDK field and method.

## 7. Let authentication state control navigation

Open [`RootNavigator.tsx`](../src/app/navigation/RootNavigator.tsx).

A **stack navigator** handles the public account screens. A **tab navigator**
lets signed-in users switch between Calendar and Profile. The route types list
valid screen names and the parameters each screen accepts; `undefined` means
that route has no parameters.

The flow is:

```text
User taps Sign in
  -> validate credentials
  -> Firebase service sends the request
  -> Firebase signs in and notifies the session listener
  -> AuthProvider receives the user
  -> RootNavigator renders Calendar and Profile
```

The form does not manually navigate to Calendar after awaiting sign-in.
Firebase's session notification is the source of truth. This also makes session
restoration work without duplicating navigation logic.

On logout, Firebase emits a signed-out state. The private navigator is removed
and the public navigator is mounted. This removes private Back-button history.
Profile waits for the service to sign out; a failed operation shows an error
instead of claiming the session has been cleared.

## 8. Understand tokens and persistence

An **ID token** is a credential issued by Firebase for an authenticated user.
Our `getIdToken()` method asks the SDK for a current token; the SDK can refresh an
expired one. The app does not manufacture tokens or display them in Profile.

Firebase needs persistence to remember the session after the app closes.
[`secureStorage.ts`](../src/shared/storage/secureStorage.ts) supplies `getItem`,
`setItem`, and `removeItem` using native secure storage.

The native library calls its storage function `setGenericPassword`, but the
value we put there is Firebase's serialized session, **not the user's account
password**. The SDK decides what session data to serialize. The storage adapter
does not implement token refresh or verify credentials itself.

Native secure storage protects saved data; it does not automatically add
biometric sign-in. That is a later feature. Likewise, a private screen is not
backend authorization. When meetings are added, Firestore Security Rules or a
custom server must prevent users from accessing someone else's meetings.

## 9. Read the tests as examples of intended behavior

Start with these:

- [`validateCredentials.test.ts`](../src/features/auth/validation/validateCredentials.test.ts)
  checks business rules without rendering a screen.
- [`firebaseAuthService.test.ts`](../src/features/auth/services/firebaseAuthService.test.ts)
  verifies calls into the SDK and propagation of failures.
- [`secureStorage.test.ts`](../src/shared/storage/secureStorage.test.ts)
  checks storage boundaries using a mocked native library.
- [`authentication.test.tsx`](../__tests__/authentication.test.tsx) types into
  real form components and exercises real navigation with a fake auth service.

A fake service makes tests fast and repeatable. These tests do not prove a real
Firebase project is configured or that native storage works on a physical device.
That is why we also build Android and perform a device smoke test.

For this milestone, the Android emulator was also tested against the real
Firebase project with disposable accounts. Registration, Profile information,
session restoration after a process restart, logout across restarts, and signing
in again all passed. The test accounts were deleted afterward. These live checks
are separate from `npm test`, which never creates cloud accounts.

When changing a behavior, add or update a test describing what the user should
experience. For example, test that invalid input prevents submission, rather
than asserting the exact names of private state variables.

## 10. Use the Git history as a learning tool

```powershell
git log --oneline
git show 9fe921e -- src/features/auth/screens/AuthScreen.tsx
git show a69f368
git show 27c8b19
```

The first implementation commit adds the feature and native foundation. The
following fixes record problems found by a real native build: the code generator
needed to be installed at the expected root location, and an older safe-area
library referenced an API removed by React Native 0.87.

This is why passing TypeScript is valuable but insufficient for a mobile app.
JavaScript tests cannot compile Kotlin or C++. Keep the dependency lockfile
committed and use `npm ci` to reproduce the checked dependency versions.

The emulator also revealed two details worth learning from: tab accessibility
labels should name the destination without reading decorative symbols, and
diagnostic files should not trigger development refreshes. The navigator now
sets explicit Calendar/Profile labels, and Metro excludes `.git/`, where local
backups and diagnostics were stored.

For the next milestone, keep the same pattern: describe the behavior, implement
one coherent change, verify it at the appropriate level, and explain the result
in a focused commit. Meeting creation/editing and biometrics are still separate
milestones; the Calendar landing screen does not implement them yet.
