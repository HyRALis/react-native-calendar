import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.screen}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: {
    flexGrow: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.xl,
  },
  centered: { textAlign: 'center' },
});
