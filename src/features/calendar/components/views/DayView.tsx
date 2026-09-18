import { StyleSheet, View } from 'react-native';
import { Typography } from '../../../../shared/components';
import { colors, radii, spacing } from '../../../../shared/theme';
import { addDays } from '../../utils/calendarDates';

export function DayView({ date }: { date: Date }) {
  return (
    <View style={styles.agenda}>
      {Array.from({ length: 24 }, (_, hour) => {
        const time = addDays(date, 0);
        time.setHours(hour, 0, 0, 0);

        return (
          <View key={hour} style={styles.hour}>
            <Typography variant="caption" tone="muted">
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
});
