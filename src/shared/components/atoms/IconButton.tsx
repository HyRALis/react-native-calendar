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
  opacity,
  radii,
  type ControlSize,
} from '../../theme';
import { Typography } from './Typography';

export type IconButtonProps = Omit<PressableProps, 'children'> & {
  /** Decorative glyph; the pressable carries the label, so it stays out of a11y. */
  glyph: string;
  accessibilityLabel: string;
  size?: ControlSize;
  glyphStyle?: StyleProp<TextStyle>;
};

/** A square tap target for compact actions where a titled Button would not fit. */
export const IconButton = forwardRef<
  React.ComponentRef<typeof Pressable>,
  IconButtonProps
>(function IconButtonRoot(
  { glyph, size = 'sm', disabled = false, style, glyphStyle, ...props },
  ref,
) {
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
        { width: controlSizes[size], height: controlSizes[size] },
        state.pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Typography
        accessible={false}
        importantForAccessibility="no"
        variant="subtitle"
        tone="primary"
        style={glyphStyle}
      >
        {glyph}
      </Typography>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});
