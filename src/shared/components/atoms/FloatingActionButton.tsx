import React, { forwardRef } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import {
  colors,
  controlSizes,
  elevation,
  opacity,
  spacing,
  type ControlSize,
} from '../../theme';
import { Typography } from './Typography';

export type FloatingActionButtonProps = Omit<PressableProps, 'children'> & {
  glyph?: string;
  accessibilityLabel: string;
  size?: ControlSize;
  glyphStyle?: StyleProp<TextStyle>;
};

export const FloatingActionButton = forwardRef<
  React.ComponentRef<typeof Pressable>,
  FloatingActionButtonProps
>(function FloatingActionButtonRoot(
  { glyph = '+', size = 'lg', disabled = false, style, glyphStyle, ...props },
  ref,
) {
  const diameter = controlSizes[size];

  return (
    <Pressable
      {...props}
      ref={ref}
      accessibilityRole="button"
      aria-disabled={disabled}
      accessibilityState={{ ...props.accessibilityState, disabled }}
      disabled={disabled}
      style={state => [
        styles.base,
        { width: diameter, height: diameter, borderRadius: diameter / 2 },
        state.pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Typography
        accessible={false}
        importantForAccessibility="no"
        variant="title"
        tone="inverse"
        style={glyphStyle}
      >
        {glyph}
      </Typography>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    zIndex: 1,
    right: spacing.xl,
    bottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    ...elevation.floating,
  },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});
