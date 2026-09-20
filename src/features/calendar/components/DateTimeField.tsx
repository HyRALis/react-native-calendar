import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '../../../shared/components/atoms/Typography';
import { OptionPicker } from '../../../shared/components/molecules/OptionPicker';
import {
  colors,
  controlSizes,
  opacity,
  radii,
  spacing,
} from '../../../shared/theme';
import {
  atTime,
  combineDateAndTime,
  isSameDay,
  minutesOfDay,
} from '../utils/calendarDates';
import { formatEventTime } from '../utils/calendarEvents';
import { defaultMinuteStep } from '../utils/eventDraft';
import { buildTimeOptions } from '../utils/timeOfDay';
import { DatePickerSheet } from './DatePickerSheet';

export type DateTimeFieldProps = {
  label: string;
  value: Date;
  onChange: (next: Date) => void;
  today?: Date;
  min?: Date;
  error?: string;
  minuteStep?: number;
};

export function DateTimeField({
  label,
  value,
  onChange,
  today,
  min,
  error,
  minuteStep = defaultMinuteStep,
}: DateTimeFieldProps) {
  const [editing, setEditing] = useState<'date' | 'time' | null>(null);

  const dateLabel = value.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeLabel = formatEventTime(value);
  const earliest =
    min && isSameDay(min, value)
      ? minutesOfDay(min) +
        min.getSeconds() / 60 +
        min.getMilliseconds() / 60000
      : 0;
  const options = useMemo(
    () => buildTimeOptions(minuteStep, minutesOfDay(value), earliest),
    [earliest, minuteStep, value],
  );

  return (
    <View style={styles.field}>
      <Typography variant="label">{label}</Typography>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} date`}
          accessibilityValue={{ text: dateLabel }}
          onPress={() => setEditing('date')}
          style={({ pressed }) => [
            styles.trigger,
            styles.date,
            Boolean(error) && styles.invalid,
            pressed && styles.pressed,
          ]}
        >
          <Typography numberOfLines={1}>{dateLabel}</Typography>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} time`}
          accessibilityValue={{ text: timeLabel }}
          onPress={() => setEditing('time')}
          style={({ pressed }) => [
            styles.trigger,
            Boolean(error) && styles.invalid,
            pressed && styles.pressed,
          ]}
        >
          <Typography numberOfLines={1}>{timeLabel}</Typography>
        </Pressable>
      </View>

      {error ? (
        <Typography
          variant="caption"
          tone="error"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Typography>
      ) : null}

      {editing === 'date' ? (
        <DatePickerSheet
          title={`${label} date`}
          value={value}
          today={today}
          minDate={min}
          onSelect={day => {
            onChange(combineDateAndTime(day, value));
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <OptionPicker
        visible={editing === 'time'}
        title={`${label} time`}
        options={options}
        selectedValue={minutesOfDay(value)}
        onSelect={minutes => {
          onChange(atTime(value, minutes));
          setEditing(null);
        }}
        onClose={() => setEditing(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  trigger: {
    minHeight: controlSizes.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  date: { flex: 1 },
  invalid: { borderColor: colors.error },
  pressed: { opacity: opacity.pressed },
});
