import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton } from '../../../shared/components/atoms/IconButton';
import { Typography } from '../../../shared/components/atoms/Typography';
import { BottomSheet } from '../../../shared/components/molecules/BottomSheet';
import { colors, opacity, radii } from '../../../shared/theme';
import {
  addMonths,
  atMidday,
  differenceInDays,
  getMonthWeeks,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from '../utils/calendarDates';

export type DatePickerSheetProps = {
  title: string;
  value: Date;
  today?: Date;
  minDate?: Date;
  onSelect: (day: Date) => void;
  onClose: () => void;
};

export function DatePickerSheet({
  title,
  value,
  today,
  minDate,
  onSelect,
  onClose,
}: DatePickerSheetProps) {
  const [month, setMonth] = useState(() => startOfMonth(value));
  const weeks = useMemo(() => getMonthWeeks(month), [month]);

  return (
    <BottomSheet visible title={title} onClose={onClose}>
      <View style={styles.header}>
        <IconButton
          glyph="‹"
          accessibilityLabel="Show previous month"
          onPress={() => setMonth(addMonths(month, -1))}
        />
        <Typography
          variant="bodyStrong"
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={styles.monthLabel}
        >
          {month.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </Typography>
        <IconButton
          glyph="›"
          accessibilityLabel="Show next month"
          onPress={() => setMonth(addMonths(month, 1))}
        />
      </View>

      <View style={styles.row}>
        {weeks[0].map(day => (
          <View key={day.getDay()} style={styles.cell}>
            <Typography variant="caption" tone="muted" style={styles.centered}>
              {day.toLocaleDateString(undefined, { weekday: 'narrow' })}
            </Typography>
          </View>
        ))}
      </View>

      {weeks.map(week => (
        <View key={week[0].getTime()} style={styles.row}>
          {week.map(day => {
            const selected = isSameDay(day, value);
            const outside = !isSameMonth(day, month);
            const tooEarly = minDate
              ? differenceInDays(minDate, day) < 0
              : false;

            return (
              <Pressable
                key={day.getTime()}
                accessibilityRole="button"
                accessibilityLabel={day.toLocaleDateString(undefined, {
                  dateStyle: 'full',
                })}
                accessibilityState={{ selected, disabled: tooEarly }}
                disabled={tooEarly}
                onPress={() => onSelect(atMidday(day))}
                style={({ pressed }) => [
                  styles.cell,
                  styles.day,
                  selected && styles.selected,
                  tooEarly && styles.unavailable,
                  pressed && styles.pressed,
                ]}
              >
                <Typography
                  variant={selected ? 'bodyStrong' : 'body'}
                  tone={selectedTone(selected, outside || tooEarly, day, today)}
                >
                  {String(day.getDate())}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      ))}
    </BottomSheet>
  );
}

function selectedTone(
  selected: boolean,
  outside: boolean,
  day: Date,
  today?: Date,
) {
  if (selected) {
    return 'inverse' as const;
  }

  if (outside) {
    return 'muted' as const;
  }

  return today && isSameDay(day, today) ? ('primary' as const) : undefined;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: { flex: 1, textAlign: 'center' },
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centered: { textAlign: 'center' },
  day: { aspectRatio: 1, borderRadius: radii.md },
  selected: { backgroundColor: colors.primary },
  unavailable: { opacity: opacity.disabled },
  pressed: { opacity: opacity.pressed },
});
