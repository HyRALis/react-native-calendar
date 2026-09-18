import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput as NativeTextInput,
  type TextInputProps as NativeTextInputProps,
} from 'react-native';
import { colors, controlSizes, radii, spacing, typography } from '../../theme';

export type TextInputProps = NativeTextInputProps & {
  disabled?: boolean;
  invalid?: boolean;
};

export const TextInput = forwardRef<
  React.ComponentRef<typeof NativeTextInput>,
  TextInputProps
>(function TextInputRoot(
  {
    disabled = false,
    invalid = false,
    editable = true,
    readOnly = false,
    multiline = false,
    style,
    onFocus,
    onBlur,
    accessibilityState,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const isDisabled =
    disabled ||
    accessibilityState?.disabled === true ||
    props['aria-disabled'] === true;
  const isEditable = !isDisabled && editable && !readOnly;

  return (
    <NativeTextInput
      placeholderTextColor={colors.muted}
      selectionColor={colors.primary}
      underlineColorAndroid="transparent"
      {...props}
      ref={ref}
      editable={isEditable}
      readOnly={!isEditable}
      multiline={multiline}
      accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
      aria-disabled={isDisabled}
      onFocus={event => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={event => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        styles.base,
        multiline && styles.multiline,
        focused && isEditable && styles.focused,
        invalid && styles.invalid,
        !isEditable && styles.readOnly,
        style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  base: {
    ...typography.body,
    minHeight: controlSizes.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  multiline: { minHeight: controlSizes.md * 2, textAlignVertical: 'top' },
  focused: { borderColor: colors.primary },
  invalid: { borderColor: colors.error },
  readOnly: { backgroundColor: colors.disabledSurface },
});
