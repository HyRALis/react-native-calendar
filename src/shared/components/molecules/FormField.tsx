import React, { forwardRef } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type TextInput as NativeTextInput,
  type ViewStyle,
} from 'react-native';
import { spacing } from '../../theme';
import { TextInput, type TextInputProps } from '../atoms/TextInput';
import { Typography } from '../atoms/Typography';

export type FormFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export const FormField = forwardRef<
  React.ComponentRef<typeof NativeTextInput>,
  FormFieldProps
>(function FormFieldRoot(
  {
    label,
    helperText,
    error,
    required = false,
    invalid = false,
    containerStyle,
    accessibilityLabel,
    accessibilityHint,
    ...props
  },
  ref,
) {
  const supportingText = error || helperText;
  const hint = [required && 'Required.', supportingText, accessibilityHint]
    .filter(Boolean)
    .join(' ');

  return (
    <View style={[styles.field, containerStyle]}>
      <Typography variant="label">
        {label}
        {required ? ' *' : ''}
      </Typography>
      <TextInput
        {...props}
        ref={ref}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={hint || undefined}
        invalid={invalid || Boolean(error)}
      />
      {supportingText ? (
        <Typography
          variant="caption"
          tone={error ? 'error' : 'muted'}
          accessibilityRole={error ? 'alert' : undefined}
          accessibilityLiveRegion={error ? 'polite' : undefined}
        >
          {supportingText}
        </Typography>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({ field: { gap: spacing.sm } });
