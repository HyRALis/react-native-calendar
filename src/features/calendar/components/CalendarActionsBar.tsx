import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '../../../shared/components/atoms/Button';
import { IconButton } from '../../../shared/components/atoms/IconButton';
import { Typography } from '../../../shared/components/atoms/Typography';
import { OptionPicker } from '../../../shared/components/molecules/OptionPicker';
import { colors, opacity, radii, spacing } from '../../../shared/theme';
import type { CalendarView } from '../types';
import { formatPeriodLabel, stepUnit } from '../utils/calendarLabels';
import { buildYearOptions } from '../utils/calendarPaging';

export type CalendarActionsBarProps = {
  view: CalendarView;
  /** The month the pickers show; the month containing the focused date. */
  month: Date;
  focusedDate: Date;
  /** Origin of the selectable year range; defaults to today. */
  anchor?: Date;
  today?: Date;
  onChangeMonth: (month: Date) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
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
 * Month and year navigation for every view. The arrows step by whatever the
 * current view pages over, and they are not decoration: swiping is not operable
 * with a screen reader, so they are the accessible path between pages.
 */
export function CalendarActionsBar({
  view,
  month,
  focusedDate,
  anchor,
  today = new Date(),
  onChangeMonth,
  onPrevious,
  onNext,
  onToday,
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
  const periodLabel = formatPeriodLabel(view, focusedDate);
  const unit = stepUnit[view];

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <IconButton
          glyph={'‹'}
          accessibilityLabel={`Previous ${unit}`}
          onPress={onPrevious}
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
          accessibilityLabel={`Next ${unit}`}
          onPress={onNext}
        />
        <Button
          title="Today"
          variant="ghost"
          size="sm"
          style={styles.today}
          onPress={onToday}
        />
      </View>

      {periodLabel ? (
        <Typography
          variant="caption"
          tone="muted"
          accessibilityLiveRegion="polite"
          style={styles.period}
        >
          {periodLabel}
        </Typography>
      ) : null}

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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
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
  period: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  pressed: { opacity: opacity.pressed },
});
