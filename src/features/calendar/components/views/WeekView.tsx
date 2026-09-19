import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '../../../../shared/components/atoms/Typography';
import { colors, opacity, radii, spacing } from '../../../../shared/theme';
import { getWeekDays, isSameDay } from '../../utils/calendarDates';
import type { CalendarEvent } from '../../types';
import { eventsForDay } from '../../utils/calendarEvents';
import { EventListItem } from '../EventListItem';

export type WeekViewProps = {
  /** Any day in the week to show. */
  date: Date;
  today?: Date;
  selectedDate?: Date | null;
  onSelectDay?: (day: Date) => void;
  events?: readonly CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
};

export function WeekView({
  date,
  today,
  selectedDate = null,
  onSelectDay,
  events = [],
  onSelectEvent,
}: WeekViewProps) {
  return (
    <View style={styles.agenda}>
      {getWeekDays(date).map(day => {
        const selected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isToday = today ? isSameDay(day, today) : false;
        const dayEvents = eventsForDay(events, day);

        return (
          <View
            key={day.getTime()}
            style={[styles.day, selected && styles.selected]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${day.toLocaleDateString(undefined, {
                dateStyle: 'full',
              })}${isToday ? ', today' : ''}`}
              onPress={() => onSelectDay?.(day)}
              style={({ pressed }) => [
                styles.dayHeading,
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
            </Pressable>
            {dayEvents.length ? (
              dayEvents.map(event => (
                <EventListItem
                  key={event.id}
                  event={event}
                  onPress={onSelectEvent}
                />
              ))
            ) : (
              <Pressable onPress={() => onSelectDay?.(day)} accessible={false}>
                <Typography variant="caption" tone="muted">
                  No events yet
                </Typography>
              </Pressable>
            )}
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
  day: {
    padding: spacing.lg,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  selected: { backgroundColor: colors.primaryLight },
  dayHeading: { minHeight: 44, justifyContent: 'center' },
  pressed: { opacity: opacity.pressed },
});
