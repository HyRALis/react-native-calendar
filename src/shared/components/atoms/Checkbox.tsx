import React, { forwardRef } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { colors, controlSizes, opacity, radii, spacing } from '../../theme';
import { Typography } from './Typography';

export type CheckboxProps = Omit<PressableProps, 'children' | 'onPress'> & {
  accessibilityLabel: string;
  checked: boolean;
  onValueChange: (checked: boolean) => void;
};

/** Controlled checkbox. The caller owns the value and any visible label. */
export const Checkbox = forwardRef<
  React.ComponentRef<typeof Pressable>,
  CheckboxProps
>(function CheckboxRoot(
  {
    checked,
    onValueChange,
    disabled = false,
    accessibilityState,
    style,
    ...props
  },
  ref,
) {
  const isDisabled =
    disabled ||
    accessibilityState?.disabled === true ||
    props['aria-disabled'] === true;

  return (
    <Pressable
      {...props}
      ref={ref}
      accessibilityRole="checkbox"
      aria-checked={checked}
      aria-disabled={isDisabled}
      accessibilityState={{
        ...accessibilityState,
        checked,
        disabled: isDisabled,
      }}
      disabled={isDisabled}
      onPress={() => {
        if (!isDisabled) {
          onValueChange(!checked);
        }
      }}
      style={state => [
        styles.target,
        state.pressed && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <View style={[styles.box, checked && styles.checked]}>
        {checked && (
          <Typography
            accessible={false}
            allowFontScaling={false}
            variant="bodyStrong"
            tone="inverse"
          >
            {'\u2713'}
          </Typography>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  target: {
    minWidth: controlSizes.sm,
    minHeight: controlSizes.sm,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  box: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});
