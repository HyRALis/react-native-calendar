import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  FloatingActionButton,
  Typography,
} from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';
import { CalendarActionsBar } from '../components/CalendarActionsBar';
import { CalendarViewContent } from '../components/CalendarViewContent';
import { EventDetailsSheet } from '../components/EventDetailsSheet';
import { EventFormSheet } from '../components/EventFormSheet';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import {
  useCalendarActions,
  useCalendarNavigation,
} from '../navigation/CalendarNavigationProvider';
import type { EventStore } from '../storage/eventStore';
import type { CalendarEvent } from '../types';

export type CalendarScreenProps = {
  /** Where events are read from and written back to; injectable for tests. */
  eventStore?: EventStore;
  getNow?: () => Date;
};

/**
 * Renders whatever the navigation context is focused on. The screen holds no
 * date state of its own, so the header drawer, the actions bar, swiping and day
 * taps all move the same focused date and stay in step across views.
 */
export function CalendarScreen({
  eventStore,
  getNow = currentTime,
}: CalendarScreenProps) {
  const { view, focusedDate, visibleMonth, today, anchor } =
    useCalendarNavigation();
  const {
    goToMonth,
    goToPage,
    goToNext,
    goToPrevious,
    goToToday,
    focusDate,
    openDay,
  } = useCalendarActions();
  const { events, addEvent, updateEvent, error, retry } =
    useCalendarEvents(eventStore);
  const [adding, setAdding] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  const [editing, setEditing] = useState<{
    event: CalendarEvent;
    now: Date;
  } | null>(null);

  return (
    <View style={styles.screen}>
      {error ? (
        <View style={styles.error}>
          <Typography
            tone="error"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {error}
          </Typography>
          <Button
            title="Retry saving events"
            variant="outline"
            size="sm"
            onPress={retry}
          />
        </View>
      ) : null}
      <CalendarActionsBar
        view={view}
        month={visibleMonth}
        focusedDate={focusedDate}
        anchor={anchor}
        today={today}
        onChangeMonth={goToMonth}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onToday={goToToday}
      />
      <View style={styles.content} testID={`calendar-view-${view}`}>
        <CalendarViewContent
          view={view}
          date={focusedDate}
          anchor={anchor}
          today={today}
          selectedDate={focusedDate}
          events={events}
          onChangeDate={goToPage}
          onSelectDay={openDay}
          onSelectEvent={setSelectedEvent}
        />
      </View>

      {/* The screen ends where the tab bar begins, so pinning the button to the
          bottom of the screen already clears the tabs. */}
      <FloatingActionButton
        accessibilityLabel="Add event"
        onPress={() => setAdding(getNow())}
      />

      {adding ? (
        <EventFormSheet
          initialDate={focusedDate}
          today={adding}
          now={adding}
          onSubmit={draft => {
            addEvent(draft);
            // Move to the day it starts on, so the new event is in view.
            focusDate(draft.start);
            setAdding(null);
          }}
          onClose={() => setAdding(null)}
        />
      ) : null}
      {selectedEvent ? (
        <EventDetailsSheet
          event={selectedEvent}
          onEdit={event => {
            setSelectedEvent(null);
            setEditing({ event, now: getNow() });
          }}
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}
      {editing ? (
        <EventFormSheet
          event={editing.event}
          today={editing.now}
          now={editing.now}
          onSubmit={draft => {
            updateEvent(editing.event.id, draft);
            focusDate(draft.start);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </View>
  );
}

function currentTime() {
  return new Date();
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  error: { padding: spacing.md, gap: spacing.sm },
});
