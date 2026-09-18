import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '../../../shared/components/atoms/Button';
import { IconButton } from '../../../shared/components/atoms/IconButton';
import { Typography } from '../../../shared/components/atoms/Typography';
import { OptionPicker } from '../../../shared/components/molecules/OptionPicker';
import { colors, opacity, radii, spacing } from '../../../shared/theme';
import { addMonths, startOfMonth } from '../utils/calendarDates';
import { buildYearOptions } from '../utils/monthPaging';

export type CalendarActionsBarProps = {
  month: Date;
  /** Origin of the selectable year range; defaults to today. */
  anchor?: Date;
  onChangeMonth: (month: Date) => void;
  today?: Date;
};

type OpenPicker = 'month' | 'year' | null;

function monthOptions(year: number) {
  return Array.from({ length: 12 }, (_, index) => ({
    value: index,
    label: new Date(year, index, 1, 12).toLocaleDateString(undefined, {
      month: 'long',
    }),
  }));
}

/**
 * Month and year navigation. The arrows are not decoration: swiping is not
 * operable with a screen reader, so they are the accessible path between
 * months, and the title announces changes politely.
 */
export function CalendarActionsBar({
  month,
  anchor,
  onChangeMonth,
  today = new Date(),
}: CalendarActionsBarProps) {
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  const year = month.getFullYear();
  const months = useMemo(() => monthOptions(year), [year]);
  const yearAnchor = anchor ?? today;
  const years = useMemo(
    () =>
      buildYearOptions(yearAnchor).map(value => ({
        value,
        label: String(value),
      })),
    [yearAnchor],
  );

  const monthLabel = month.toLocaleDateString(undefined, { month: 'long' });

  return (
    <View style={styles.bar}>
      <IconButton
        glyph={'‹'}
        accessibilityLabel="Previous month"
        onPress={() => onChangeMonth(addMonths(month, -1))}
      />
      <View style={styles.titles}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Select month, ${monthLabel}`}
          accessibilityState={{ expanded: openPicker === 'month' }}
          onPress={() => setOpenPicker('month')}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        >
          <Typography
            variant="subtitle"
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
          >
            {monthLabel}
          </Typography>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Select year, ${year}`}
          accessibilityState={{ expanded: openPicker === 'year' }}
          onPress={() => setOpenPicker('year')}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        >
          <Typography
            variant="subtitle"
            tone="muted"
            accessibilityLiveRegion="polite"
          >
            {year}
          </Typography>
        </Pressable>
      </View>
      <IconButton
        glyph={'›'}
        accessibilityLabel="Next month"
        onPress={() => onChangeMonth(addMonths(month, 1))}
      />
      <Button
        title="Today"
        variant="ghost"
        size="sm"
        style={styles.today}
        onPress={() => onChangeMonth(startOfMonth(today))}
      />

      <OptionPicker
        visible={openPicker === 'month'}
        title="Select month"
        options={months}
        selectedValue={month.getMonth()}
        onClose={() => setOpenPicker(null)}
        onSelect={value => {
          setOpenPicker(null);
          onChangeMonth(new Date(year, value, 1, 12));
        }}
      />
      <OptionPicker
        visible={openPicker === 'year'}
        title="Select year"
        options={years}
        selectedValue={year}
        onClose={() => setOpenPicker(null)}
        onSelect={value => {
          setOpenPicker(null);
          onChangeMonth(new Date(value, month.getMonth(), 1, 12));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  titles: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trigger: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  today: { paddingHorizontal: spacing.md },
  pressed: { opacity: opacity.pressed },
});
