# UI library

The UI library uses React Native core components and TypeScript. It requires no
Expo packages, UI framework, theme provider, or form library. The current theme is
the app's light palette; dark mode is not implemented.

## Atomic structure

```text
src/shared/
  theme.ts                    Colors, spacing, radii, typography, control sizes
  components/
    index.ts                  Public component and prop-type exports
    atoms/
      Typography.tsx          Text styles and semantic tones
      Button.tsx              Actions, variants, sizes, pending state
      TextInput.tsx           Input, focus feedback, invalid/disabled states
      Checkbox.tsx            Controlled boolean selection
      Switch.tsx              Controlled native toggle
    molecules/
      FormField.tsx           Label + TextInput + helper/error text
    organisms/
      StatusScreen.tsx        Loading, message, and retry composition
```

Atoms are small controls. Molecules combine controls for one responsibility.
Organisms compose larger presentation sections. Feature screens own values,
validation, network requests, and navigation. UI components never import features.
Within the library, import directly from the smaller component's file to avoid
circular imports through the public index.

Screens import components from `src/shared/components` using the appropriate
relative path. The old `components/Button`, `components/FormField`, and
`components/StatusScreen` paths remain compatibility re-exports.

## Component API

| Component      | Main props                                                                | Behavior                                                                                   |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `Typography`   | `variant`, `tone`, native text props                                      | Defaults to body text; caller styles apply last.                                           |
| `Button`       | `title`, `variant`, `size`, `loading`, `disabled`, native pressable props | Keeps its title while loading; prevents presses and announces busy/disabled state.         |
| `TextInput`    | Native input props, `invalid`, `disabled`                                 | Forwards native ref and events; adds focus, invalid, read-only, and multiline styling.     |
| `Checkbox`     | `checked`, `onValueChange`, required `accessibilityLabel`                 | Controlled value; exposes checkbox role and checked/disabled state.                        |
| `Switch`       | `value`, `onValueChange`, required `accessibilityLabel`                   | Wraps the native switch with theme colors and controlled state.                            |
| `FormField`    | `label`, `helperText`, `error`, `required`, all UI input props            | Errors replace helper text. `style` targets the input; `containerStyle` targets the field. |
| `StatusScreen` | `title`, `message`, `loading`, `onRetry`                                  | Displays a status and optional retry action, disabled while loading.                       |

Every component exports its props type. All atoms and `FormField` forward refs to
their underlying native control. Native properties such as `testID`,
`accessibilityHint`, keyboard options, and autofill settings pass through.
Button and checkbox `style` accept either native style values or a press-state
callback; button `labelStyle` styles its text separately.

### Typography

Variants: `display`, `heading`, `title`, `subtitle`, `body`, `bodyStrong`, `label`,
`caption`, and `overline`. Tones: `default`, `muted`, `primary`, `error`, `inverse`.
Variants set appearance only; use `accessibilityRole="header"` for real headings.
Text respects the device font-size setting. The checkbox's decorative checkmark
has a fixed size and is hidden from accessibility.

```tsx
<Typography variant="heading" accessibilityRole="header">
  Your calendar
</Typography>
<Typography tone="muted">A little room to plan your day.</Typography>
```

### Buttons

Variants: `primary` (default), `secondary`, `outline`, `ghost`, `danger`.
Sizes: `sm`, `md` (default), `lg`, with minimum heights of 44, 52, and 60.
Height can grow for wrapping or larger text. Width follows the parent layout.
Loading shows a spinner alongside the title and disables interaction. Keep
duplicate-request protection in the feature as well, especially for keyboard
submission paths that do not go through the button.

```tsx
<Button title="Save meeting" loading={saving} onPress={saveMeeting} />
<Button title="Cancel" variant="outline" onPress={cancel} />
<Button title="Delete meeting" variant="danger" onPress={deleteMeeting} />
```

### Forms and focus

Use `FormField` for labeled inputs and the `TextInput` atom for custom compositions.
Values and validation belong to the caller. `required` adds a visible marker and
an accessibility hint; it does not validate or block submission. Use `error` for
an accessible error message, rather than relying on the red `invalid` border.
The field combines supporting text and caller hints for screen-reader access.
Errors use an alert role and an Android polite live region.

```tsx
import React, { useRef, useState } from 'react';
import { TextInput as NativeTextInput, View } from 'react-native';
import { Button, FormField } from '../src/shared/components';
import { spacing } from '../src/shared/theme';

export function MeetingForm({ onSave }: { onSave: (title: string) => void }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string>();
  const notesRef = useRef<React.ComponentRef<typeof NativeTextInput>>(null);

  function submit() {
    if (!title.trim()) {
      setError('Enter a meeting title.');
      return;
    }
    setError(undefined);
    onSave(title.trim());
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <FormField
        label="Title"
        required
        value={title}
        onChangeText={setTitle}
        error={error}
        returnKeyType="next"
        onSubmitEditing={() => notesRef.current?.focus()}
      />
      <FormField
        ref={notesRef}
        label="Notes"
        helperText="Optional details for this meeting."
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <Button title="Save meeting" onPress={submit} />
    </View>
  );
}
```

Set `disabled` during requests. Native `editable={false}` and `readOnly` are also
respected, without announcing read-only text as a disabled control. Use native
`secureTextEntry`, `keyboardType`, `autoComplete`, and `textContentType` for
passwords and email addresses. No input keyboard or capitalization is assumed.

### Boolean controls

Checkboxes and switches require an accessible label and a controlled value. They
request changes through `onValueChange`; they do not store a second copy of state.
Compose visible labels with `Typography` and layout with native `View`:

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
  <Checkbox
    accessibilityLabel="All day"
    checked={allDay}
    onValueChange={setAllDay}
  />
  <Typography>All day</Typography>
</View>
<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
  <Switch
    accessibilityLabel="Reminders"
    value={reminders}
    onValueChange={setReminders}
  />
  <Typography>Reminders</Typography>
</View>
```

The checkbox has a minimum 44-by-44 touch target. Switch appearance and dimensions
follow the native platform. Visible labels in this basic composition are text;
only the control is interactive.

## Extending and testing

1. Reuse tokens from `shared/theme.ts` before introducing new values. Screen-only
   layout and decorative styling can remain local.
2. Add a small atom for a new primitive or compose a molecule for a repeated UI
   pattern. Avoid building a generic schema/form engine into controls.
3. Export the component and its prop type from `components/index.ts`.
4. Test observable behavior using React Native Testing Library: roles, names,
   value changes, disabled actions, error messages, and native ref forwarding.
   Keep tests beside components. Avoid snapshot-only coverage.

```sh
npm test -- --runInBand src/shared/components
npm run typecheck
npm run lint
```

The authentication integration tests also exercise the library in existing
screens. Device checks should cover VoiceOver/TalkBack announcements, large font
sizes, multiline input, keyboard focus, and native switch appearance on Android
and iOS; Jest cannot establish those behaviors on a real device.
