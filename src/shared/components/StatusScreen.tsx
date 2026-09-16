import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors } from '../theme';

export function StatusScreen({
  title,
  message,
  loading = false,
  onRetry,
}: {
  title: string;
  message?: string;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.screen}>
      {loading && <ActivityIndicator size="large" color={colors.primary} />}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {onRetry && <Button title="Try again" onPress={onRetry} />}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
