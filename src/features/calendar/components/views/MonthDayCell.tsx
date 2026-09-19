import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '../../../../shared/components/atoms/Typography';
import { colors, opacity, radii, spacing } from '../../../../shared/theme';
import type { CalendarEvent } from '../../types';
import {
  formatEventTime,
  summarizeDayEvents,
} from '../../utils/calendarEvents';

export type MonthDayCellProps = {
  day: Date;
  events: readonly CalendarEvent[];
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected?: boolean;
  maxEventRows?: number;
  onPress?: (day: Date) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
};

function describe(
  day: Date,
  inCurrentMonth: boolean,
  isToday: boolean,
  eventCount: number,
): string {
  return [
    day.toLocaleDateString(undefined, { dateStyle: 'full' }),
    isToday ? 'today' : null,
    inCurrentMonth ? null : 'outside the displayed month',
    eventCount === 1 ? '1 event' : `${eventCount} events`,
  ]
    .filter(Boolean)
    .join(', ');
}

export function MonthDayCell({
  day,
  events,
  inCurrentMonth,
  isToday,
  isSelected = false,
  maxEventRows = 3,
  onPress,
  onSelectEvent,
}: MonthDayCellProps) {
  const { visible, overflowCount } = summarizeDayEvents(events, maxEventRows);

  return (
    <View style={[styles.cell, isSelected && styles.selected]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={describe(
          day,
          inCurrentMonth,
          isToday,
          events.length,
        )}
        onPress={() => onPress?.(day)}
        style={({ pressed }) => [
          StyleSheet.absoluteFill,
          pressed && styles.pressed,
        ]}
      />
      <View style={styles.header} pointerEvents="none">
        <View style={[styles.dateBadge, isToday && styles.todayBadge]}>
          <Typography
            variant={isToday ? 'bodyStrong' : 'body'}
            tone={isToday ? 'inverse' : inCurrentMonth ? 'default' : 'muted'}
            accessible={false}
          >
            {day.getDate()}
          </Typography>
        </View>
      </View>
      <View style={styles.body} pointerEvents="box-none">
        {visible.map(event => (
          <Pressable
            key={event.id}
            accessibilityRole="button"
            accessibilityLabel={`${event.title}, ${formatEventTime(
              event.start,
            )}`}
            accessibilityHint="Opens event details"
            onPress={() => onSelectEvent?.(event)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Typography
              variant="overline"
              tone={inCurrentMonth ? 'default' : 'muted'}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.event}
              accessible={false}
            >
              {event.title}
            </Typography>
          </Pressable>
        ))}
        {overflowCount > 0 ? (
          <Pressable onPress={() => onPress?.(day)} accessible={false}>
            <Typography
              variant="overline"
              tone="primary"
              numberOfLines={1}
              style={styles.overflow}
              accessible={false}
            >
              {`+${overflowCount}`}
            </Typography>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.emptySpace}
          onPress={() => onPress?.(day)}
          accessible={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    overflow: 'hidden',
    padding: spacing.xs,
    gap: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: { alignItems: 'center' },
  dateBadge: {
    minWidth: spacing.xxl,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  todayBadge: { backgroundColor: colors.primary },
  body: { flex: 1, gap: 1 },
  emptySpace: { flex: 1 },
  event: {
    letterSpacing: 0,
    paddingHorizontal: 2,
    borderRadius: 2,
    backgroundColor: colors.primaryLight,
  },
  overflow: { letterSpacing: 0, paddingHorizontal: 2 },
  selected: { backgroundColor: colors.primaryLight },
  pressed: { opacity: opacity.pressed },
});
