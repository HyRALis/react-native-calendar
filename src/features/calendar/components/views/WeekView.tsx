import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '../../../../shared/components/atoms/Typography';
import { colors, opacity, radii, spacing } from '../../../../shared/theme';
import { getWeekDays, isSameDay } from '../../utils/calendarDates';

export type WeekViewProps = {
  /** Any day in the week to show. */
  date: Date;
  today?: Date;
  selectedDate?: Date | null;
  onSelectDay?: (day: Date) => void;
};

export function WeekView({
  date,
  today,
  selectedDate = null,
  onSelectDay,
}: WeekViewProps) {
  return (
    <View style={styles.agenda}>
      {getWeekDays(date).map(day => {
        const selected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isToday = today ? isSameDay(day, today) : false;

        return (
          <Pressable
            key={day.getTime()}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${day.toLocaleDateString(undefined, {
              dateStyle: 'full',
            })}${isToday ? ', today' : ''}`}
            onPress={() => onSelectDay?.(day)}
            style={({ pressed }) => [
              styles.day,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <Typography
              variant="bodyStrong"
              tone={isToday ? 'primary' : 'default'}
              accessible={false}
            >
              {day.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Typography>
            <Typography variant="caption" tone="muted" accessible={false}>
              No events yet
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  agenda: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  day: {
    padding: spacing.lg,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  selected: { backgroundColor: colors.primaryLight },
  pressed: { opacity: opacity.pressed },
});
