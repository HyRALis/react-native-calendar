import { StyleSheet, View } from 'react-native';
import { Typography } from '../../../../shared/components';
import { colors, radii, spacing } from '../../../../shared/theme';
import { getWeekDays, isSameDay } from '../../utils/calendarDates';

export function WeekView({ date }: { date: Date }) {
  return (
    <View style={styles.agenda}>
      {getWeekDays(date).map(day => (
        <View
          key={day.getTime()}
          style={[styles.day, isSameDay(day, date) && styles.today]}
        >
          <Typography
            variant="bodyStrong"
            tone={isSameDay(day, date) ? 'primary' : 'default'}
          >
            {day.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Typography>
          <Typography variant="caption" tone="muted">
            No events yet
          </Typography>
        </View>
      ))}
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
  today: { backgroundColor: colors.primaryLight },
});
