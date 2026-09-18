import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '../atoms/Button';
import { Typography } from '../atoms/Typography';
import { colors, spacing } from '../../theme';

export type StatusScreenProps = {
  title: string;
  message?: string;
  loading?: boolean;
  onRetry?: () => void;
};

export function StatusScreen({
  title,
  message,
  loading = false,
  onRetry,
}: StatusScreenProps) {
  return (
    <View style={styles.screen}>
      {loading && <ActivityIndicator size="large" color={colors.primary} />}
      <Typography
        accessibilityRole="header"
        variant="title"
        style={styles.centered}
      >
        {title}
      </Typography>
      {message && (
        <Typography tone="muted" style={styles.centered}>
          {message}
        </Typography>
      )}
      {onRetry && (
        <Button title="Try again" onPress={onRetry} loading={loading} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.xl,
  },
  centered: { textAlign: 'center' },
});
