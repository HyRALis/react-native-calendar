import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import {
  colors,
  controlSizes,
  opacity,
  radii,
  spacing,
  type ControlSize,
} from '../../theme';
import { Typography } from './Typography';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ControlSize;
  labelStyle?: StyleProp<TextStyle>;
};

const labelColors: Record<ButtonVariant, string> = {
  primary: colors.onPrimary,
  secondary: colors.primary,
  outline: colors.primary,
  ghost: colors.primary,
  danger: colors.onPrimary,
};

export const Button = forwardRef<
  React.ComponentRef<typeof Pressable>,
  ButtonProps
>(function ButtonRoot(
  {
    title,
    loading = false,
    disabled = false,
    variant = 'primary',
    size = 'md',
    style,
    labelStyle,
    accessibilityLabel = title,
    accessibilityState,
    ...props
  },
  ref,
) {
  const isDisabled =
    disabled ||
    loading ||
    accessibilityState?.disabled === true ||
    props['aria-disabled'] === true;
  const isBusy =
    loading || accessibilityState?.busy === true || props['aria-busy'] === true;
  const labelColor = labelColors[variant];

  return (
    <Pressable
      {...props}
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      aria-disabled={isDisabled}
      aria-busy={isBusy}
      accessibilityState={{
        ...accessibilityState,
        disabled: isDisabled,
        busy: isBusy,
      }}
      disabled={isDisabled}
      style={state => [
        styles.base,
        styles[variant],
        { minHeight: controlSizes[size] },
        state.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading && <ActivityIndicator color={labelColor} accessible={false} />}
      <Typography
        variant="bodyStrong"
        style={[styles.label, { color: labelColor }, labelStyle]}
      >
        {title}
      </Typography>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight },
  outline: { backgroundColor: colors.surface, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.error },
  label: { textAlign: 'center', flexShrink: 1 },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});
