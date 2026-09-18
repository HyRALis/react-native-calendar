import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Typography } from '../../../../shared/components/atoms/Typography';
import { colors, radii, spacing } from '../../../../shared/theme';
import { atMidday, isSameDay } from '../../utils/calendarDates';

export type DayViewProps = {
  date: Date;
  today?: Date;
};

export function DayView({ date, today }: DayViewProps) {
  const isToday = today ? isSameDay(date, today) : false;

  return (
    <View style={styles.agenda}>
      {Array.from({ length: 24 }, (_, hour) => {
        const time = atMidday(date);
        time.setHours(hour, 0, 0, 0);

        return (
          <View key={hour} style={[styles.hour, isToday && styles.today]}>
            <Typography variant="caption" tone={isToday ? 'primary' : 'muted'}>
              {time.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Typography>
          </View>
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
  hour: {
    minHeight: 64,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  today: { backgroundColor: colors.primaryLight },
});
