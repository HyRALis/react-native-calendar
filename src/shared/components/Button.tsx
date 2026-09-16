import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};
export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: Props) {
  const secondary = variant === 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (pressed || disabled || loading) && styles.dim,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={secondary ? colors.primary : colors.surface}
        />
      ) : (
        <Text style={[styles.label, secondary && styles.secondaryLabel]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.primaryLight },
  label: { color: colors.surface, fontSize: 16, fontWeight: '600' },
  secondaryLabel: { color: colors.primary },
  dim: { opacity: 0.65 },
});
