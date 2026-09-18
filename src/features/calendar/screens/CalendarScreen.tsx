import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Typography } from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';

export function CalendarScreen() {
  const today = new Date();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Typography variant="label" tone="primary" style={styles.eyebrow}>
        {today.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </Typography>
      <Typography accessibilityRole="header" variant="heading">
        Your calendar
      </Typography>
      <Typography tone="muted">A little room to plan your day.</Typography>
      <View style={styles.card}>
        <Typography variant="display" tone="primary" style={styles.day}>
          {today.getDate()}
        </Typography>
        <Typography variant="subtitle">Welcome to your calendar</Typography>
        <Typography tone="muted">
          Your account is ready. This is where your meetings will live.
        </Typography>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  eyebrow: {
    marginTop: spacing.lg,
  },
  card: {
    marginTop: spacing.xxl,
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  day: { fontSize: 48, lineHeight: 56 },
});
