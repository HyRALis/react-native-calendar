import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Typography } from '../../../../shared/components';
import { colors, radii, spacing } from '../../../../shared/theme';
import type { CalendarEvent } from '../../types';
import { eventsForDay } from '../../utils/calendarEvents';
import { EventListItem } from '../EventListItem';

export type DayViewProps = {
  date: Date;
  today?: Date;
  events?: readonly CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
};

export function DayView({ date, events = [], onSelectEvent }: DayViewProps) {
  const dayEvents = eventsForDay(events, date);
  return (
    <View style={styles.agenda}>
      {dayEvents.length ? (
        dayEvents.map(event => (
          <EventListItem key={event.id} event={event} onPress={onSelectEvent} />
        ))
      ) : (
        <Typography tone="muted">No events yet</Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  agenda: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
});
