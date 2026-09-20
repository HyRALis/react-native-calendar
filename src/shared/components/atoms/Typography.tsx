import React, { forwardRef } from 'react';
import { Text, type TextProps } from 'react-native';
import { colors, typography, type TypographyVariant } from '../../theme';

const tones = {
  default: colors.text,
  muted: colors.muted,
  primary: colors.primary,
  error: colors.error,
  inverse: colors.onPrimary,
} as const;

export type TypographyProps = TextProps & {
  variant?: TypographyVariant;
  tone?: keyof typeof tones;
};

export const Typography = forwardRef<
  React.ComponentRef<typeof Text>,
  TypographyProps
>(function TypographyRoot(
  { variant = 'body', tone = 'default', style, ...props },
  ref,
) {
  return (
    <Text
      {...props}
      ref={ref}
      style={[typography[variant], { color: tones[tone] }, style]}
    />
  );
});
