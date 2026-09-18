import React, { forwardRef } from 'react';
import {
  Switch as NativeSwitch,
  type SwitchProps as NativeSwitchProps,
} from 'react-native';
import { colors } from '../../theme';

export type SwitchProps = Omit<NativeSwitchProps, 'value' | 'onValueChange'> & {
  accessibilityLabel: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export const Switch = forwardRef<
  React.ComponentRef<typeof NativeSwitch>,
  SwitchProps
>(function SwitchRoot(
  { value, onValueChange, disabled = false, accessibilityState, ...props },
  ref,
) {
  const isDisabled =
    disabled ||
    accessibilityState?.disabled === true ||
    props['aria-disabled'] === true;

  return (
    <NativeSwitch
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={colors.surface}
      ios_backgroundColor={colors.border}
      {...props}
      ref={ref}
      accessibilityRole="switch"
      aria-checked={value}
      aria-disabled={isDisabled}
      accessibilityState={{
        ...accessibilityState,
        checked: value,
        disabled: isDisabled,
      }}
      value={value}
      disabled={isDisabled}
      onValueChange={nextValue => {
        if (!isDisabled) {
          onValueChange(nextValue);
        }
      }}
    />
  );
});
