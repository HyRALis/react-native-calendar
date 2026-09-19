import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Typography } from '../../../shared/components';
import {
  colors,
  controlSizes,
  opacity,
  radii,
  spacing,
} from '../../../shared/theme';
import type { CalendarEvent } from '../types';
import { formatEventSchedule } from '../utils/calendarEvents';

export type EventListItemProps = {
  event: CalendarEvent;
  onPress?: (event: CalendarEvent) => void;
};

export function EventListItem({ event, onPress }: EventListItemProps) {
  const schedule = formatEventSchedule(event);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${schedule}`}
      accessibilityHint="Opens event details"
      onPress={() => onPress?.(event)}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Typography variant="bodyStrong">{event.title}</Typography>
      <Typography variant="caption" tone="muted">
        {schedule}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: controlSizes.sm,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.sm,
  },
  pressed: { opacity: opacity.pressed },
});
