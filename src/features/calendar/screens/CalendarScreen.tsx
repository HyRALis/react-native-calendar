import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../shared/theme';

export function CalendarScreen() {
  const today = new Date();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>
        {today.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </Text>
      <Text accessibilityRole="header" style={styles.title}>
        Your calendar
      </Text>
      <Text style={styles.subtitle}>A little room to plan your day.</Text>
      <View style={styles.card}>
        <Text style={styles.day}>{today.getDate()}</Text>
        <Text style={styles.cardTitle}>Welcome to your calendar</Text>
        <Text style={styles.subtitle}>
          Your account is ready. This is where your meetings will live.
        </Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
    gap: 12,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
  },
  title: { fontSize: 32, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, lineHeight: 24, color: colors.muted },
  card: {
    marginTop: 24,
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  day: { fontSize: 48, fontWeight: '700', color: colors.primary },
  cardTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
});
