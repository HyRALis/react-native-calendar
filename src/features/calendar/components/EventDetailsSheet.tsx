import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet, Button, Typography } from '../../../shared/components';
import { spacing } from '../../../shared/theme';
import type { CalendarEvent } from '../types';
import { formatEventDateTime } from '../utils/calendarEvents';

export type EventDetailsSheetProps = {
  event: CalendarEvent;
  /** Omitted where an event cannot be changed; the action is then hidden. */
  onEdit?: (event: CalendarEvent) => void;
  onClose: () => void;
};

export function EventDetailsSheet({
  event,
  onEdit,
  onClose,
}: EventDetailsSheetProps) {
  return (
    <BottomSheet
      visible
      title="Event details"
      onClose={onClose}
      testID="event-details-sheet"
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Typography variant="subtitle" selectable>
          {event.title}
        </Typography>
        <View style={styles.field}>
          <Typography variant="label">Starts</Typography>
          <Typography selectable>{formatEventDateTime(event.start)}</Typography>
        </View>
        <View style={styles.field}>
          <Typography variant="label">Ends</Typography>
          <Typography selectable>
            {event.end ? formatEventDateTime(event.end) : 'No end time'}
          </Typography>
        </View>
        <View style={styles.field}>
          <Typography variant="label">Description</Typography>
          <Typography selectable>
            {event.description || 'No description'}
          </Typography>
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <Button
          title="Close"
          variant="ghost"
          onPress={onClose}
          style={styles.action}
        />
        {onEdit ? (
          <Button
            title="Edit event"
            onPress={() => onEdit(event)}
            style={styles.action}
          />
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  content: { gap: spacing.lg, paddingBottom: spacing.sm },
  field: { gap: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
